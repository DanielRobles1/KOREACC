import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CfdisFacade } from '../../core/facades';
import { CFDI, CFDIFilter, Discrepancy, PaginatedResponse } from '../../core/models/cfdi.model';
import { SAT_STATUS_CLASS, COMPARISON_STATUS_CLASS, COMPARISON_STATUS_LABEL, SEVERITY_CLASS, SEVERITY_LABEL, DISCREPANCY_TYPE_LABEL } from '../../core/constants/cfdi-labels';

@Component({
  standalone: false,
  selector: 'app-cfdi-list',
  templateUrl: './cfdi-list.component.html',
})
export class CfdiListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  cfdis: CFDI[] = [];
  pagination = { total: 0, page: 1, limit: 20, pages: 0 };
  loading = false;
  filterForm: FormGroup;

  ejercicioActual?: number;
  periodoActual?: number;
  periodoLabel = '';

  readonly satStatusColors = SAT_STATUS_CLASS;
  readonly compStatusColors = COMPARISON_STATUS_CLASS;
  readonly compStatusLabel = COMPARISON_STATUS_LABEL;

  selectedCfdi: CFDI | null = null;
  discrepanciasCfdi: Discrepancy[] = [];
  loadingDiscrepancias = false;
  comparandoId: string | null = null;
  enriqueciendo = false;
  enriquecerMsg = '';
  downloadingExcel = false;

  readonly severityColors = SEVERITY_CLASS;
  readonly severityLabel  = SEVERITY_LABEL;
  readonly typeLabel      = DISCREPANCY_TYPE_LABEL;

  readonly tiposComparables = new Set(['I', 'E', 'P']);

  constructor(
    private cfdisFacade: CfdisFacade,
    private fb: FormBuilder,
    private route: ActivatedRoute,
  ) {
    this.filterForm = this.fb.group({
      source: [''],
      tipoDeComprobante: [''],
      rfcEmisor: [''],
      rfcReceptor: [''],
      satStatus: [''],
      lastComparisonStatus: [''],
      fechaInicio: [''],
      fechaFin: [''],
      search: [''],
    });
  }

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParams;
    const ej = qp['ejercicio'];
    const pe = qp['periodo'];
    if (ej) {
      this.ejercicioActual = parseInt(ej);
      this.periodoLabel = pe
        ? `${this.mesLabel(parseInt(pe))} ${ej}`
        : `Año ${ej}`;
    }
    if (pe) this.periodoActual = parseInt(pe);
    if (qp['fechaInicio'] || qp['fechaFin'] || qp['source']) {
      this.filterForm.patchValue({
        fechaInicio: qp['fechaInicio'] ?? '',
        fechaFin:    qp['fechaFin']    ?? '',
        source:      qp['source']      ?? '',
      }, { emitEvent: false });
    }
    this.loadCFDIs();
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      takeUntil(this.destroy$),
    ).subscribe(() => this.loadCFDIs(1));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  mesLabel(n: number): string {
    const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                     'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return nombres[n - 1] ?? '';
  }

  loadCFDIs(page = 1): void {
    this.loading = true;
    const filters: CFDIFilter = { ...this.filterForm.value, page, limit: this.pagination.limit };
    if (this.ejercicioActual) filters.ejercicio = this.ejercicioActual;
    if (this.periodoActual)   filters.periodo   = this.periodoActual;
    this.cfdisFacade.list(filters).subscribe({
      next: (res: PaginatedResponse<CFDI>) => {
        this.cfdis = res.data;
        this.pagination = res.pagination;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  resetFilters(): void {
    this.filterForm.reset({ source: '' });
  }

  changePage(page: number): void {
    this.loadCFDIs(page);
  }

  downloadXML(cfdi: CFDI): void {
    this.cfdisFacade.downloadXML(cfdi._id);
  }

  comparar(cfdi: CFDI, event: Event): void {
    event.stopPropagation();
    this.comparandoId = cfdi._id;
    this.cfdisFacade.compare(cfdi._id).subscribe({
      next: () => { this.comparandoId = null; this.loadCFDIs(this.pagination.page); },
      error: () => { this.comparandoId = null; },
    });
  }

  selectCfdi(cfdi: CFDI): void {
    if (this.selectedCfdi?._id === cfdi._id) {
      this.selectedCfdi = null;
      this.discrepanciasCfdi = [];
      return;
    }
    this.selectedCfdi = cfdi;
    this.discrepanciasCfdi = [];
    if (cfdi.lastComparisonStatus === 'discrepancy' || cfdi.lastComparisonStatus === 'warning' ||
        cfdi.lastComparisonStatus === 'cancelled' ||
        cfdi.lastComparisonStatus === 'not_in_sat' || cfdi.lastComparisonStatus === 'not_in_erp') {
      this.loadingDiscrepancias = true;
      this.cfdisFacade.getDiscrepanciasPorUUID(cfdi.uuid).subscribe({
        next: (res) => { this.discrepanciasCfdi = res.data; this.loadingDiscrepancias = false; },
        error: () => { this.loadingDiscrepancias = false; },
      });
    }
  }

  closeDetail(): void {
    this.selectedCfdi = null;
  }

  enriquecerPagos(): void {
    this.enriqueciendo = true;
    this.enriquecerMsg = '';
    this.cfdisFacade.enriquecerPagos(this.ejercicioActual, this.periodoActual).subscribe({
      next: (res) => {
        this.enriqueciendo = false;
        this.enriquecerMsg = `${res.enriquecidos} complementos de pago procesados.`;
        this.loadCFDIs(this.pagination.page);
      },
      error: () => {
        this.enriqueciendo = false;
        this.enriquecerMsg = 'Error al enriquecer complementos de pago.';
      },
    });
  }

  /**
   * Devuelve el monto a mostrar para un CFDI:
   *  - tipo P: usa complementoPago (totales > primer pago > null)
   *  - otros: usa cfdi.total
   */
  montoDisplay(cfdi: CFDI): number | null {
    if (cfdi.tipoDeComprobante !== 'P') return cfdi.total;
    const cp = cfdi.complementoPago;
    if (cp) {
      if (cp.totales?.montoTotalPagos != null) return cp.totales.montoTotalPagos;
      if (cp.pagos?.length) return cp.pagos[0].monto ?? null;
    }
    // Fallback: importación desde Excel guarda el Monto en cfdi.total
    return cfdi.total > 0 ? cfdi.total : null;
  }

  soloAdvertencias(): boolean {
    return this.discrepanciasCfdi.length > 0 && this.discrepanciasCfdi.every(d => d.severity === 'warning');
  }

  monedaDisplay(cfdi: CFDI): string {
    if (cfdi.tipoDeComprobante !== 'P') return 'MXN';
    return cfdi.complementoPago?.pagos?.[0]?.monedaP ?? 'MXN';
  }

  downloadExcel(): void {
    this.downloadingExcel = true;
    const filters: CFDIFilter = { ...this.filterForm.value };
    if (this.ejercicioActual) filters.ejercicio = this.ejercicioActual;
    if (this.periodoActual)   filters.periodo   = this.periodoActual;

    this.cfdisFacade.exportExcel(filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => {
        const periodo = this.periodoLabel
          ? this.periodoLabel.replace(/\s+/g, '_')
          : new Date().toISOString().slice(0, 7);
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `cfdis_${periodo}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingExcel = false;
      },
      error: () => { this.downloadingExcel = false; },
    });
  }
}
