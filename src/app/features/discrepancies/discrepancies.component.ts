import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ComparisonFacade } from '../../core/facades';
import { Discrepancy, Comparison, CFDI } from '../../core/models/cfdi.model';
import {
  SEVERITY_LABEL,
  SEVERITY_CLASS,
  DISCREPANCY_TYPE_LABEL,
  DISCREPANCY_TYPE_EXPLANATION,
  FIELD_LABEL,
  MESES,
} from '../../core/constants/cfdi-labels';

@Component({
  standalone: false,
  selector: 'app-discrepancies',
  templateUrl: './discrepancies.component.html',
})
export class DiscrepanciesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  discrepancies: Discrepancy[] = [];
  summary: any = null;
  pagination = { total: 0, page: 1, limit: 20 };
  loading = false;
  filters = { type: '', severity: '', status: 'open', rfcEmisor: '', tipoDeComprobante: '', ejercicio: '' as number | '', periodo: '' as number | '' };
  selectedDiscrepancy: Discrepancy | null = null;

  ejerciciosDisponibles: number[] = [];
  readonly meses = MESES;

  readonly severityLabel    = SEVERITY_LABEL;
  readonly severityColors   = SEVERITY_CLASS;
  readonly typeLabel        = DISCREPANCY_TYPE_LABEL;
  readonly typeExplanation  = DISCREPANCY_TYPE_EXPLANATION;
  readonly fieldLabel       = FIELD_LABEL;

  readonly statusOptions = ['open', 'in_review', 'resolved', 'ignored', 'escalated'];

  constructor(
    private comparisonFacade: ComparisonFacade,
    private route: ActivatedRoute,
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.comparisonFacade.getPeriodos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { this.ejerciciosDisponibles = res.ejercicios; },
      error: () => {},
    });
    const qp = this.route.snapshot.queryParamMap;
    const ej = qp.get('ejercicio');
    const pe = qp.get('periodo');
    if (ej) this.filters.ejercicio = parseInt(ej);
    if (pe) this.filters.periodo   = parseInt(pe);
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    const params = { ...this.filters, page: this.pagination.page, limit: this.pagination.limit } as Record<string, unknown>;

    this.comparisonFacade.listDiscrepancies(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.discrepancies = res.data;
        this.pagination = { ...this.pagination, total: res.pagination.total };
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });

    this.comparisonFacade.getDiscrepancySummary().pipe(takeUntil(this.destroy$)).subscribe({
      next: (s) => { this.summary = s; },
    });
  }

  esDiferenciaMinima(d: Discrepancy): boolean {
    const amount = d.fiscalImpact?.amount;
    return amount !== undefined && amount !== null && amount > 0 && amount <= 0.01;
  }

  openDetail(d: Discrepancy): void { this.selectedDiscrepancy = d; }
  closeDetail(): void { this.selectedDiscrepancy = null; }

  getComparison(d: Discrepancy): Comparison | null {
    if (!d.comparisonId || typeof d.comparisonId === 'string') return null;
    return d.comparisonId as Comparison;
  }

  getErpCfdi(d: Discrepancy): Partial<CFDI> | null {
    const c = this.getComparison(d);
    if (!c || !c.erpCfdiId || typeof c.erpCfdiId === 'string') return null;
    return c.erpCfdiId as Partial<CFDI>;
  }

  getSatCfdi(d: Discrepancy): Partial<CFDI> | null {
    const c = this.getComparison(d);
    if (!c || !c.satCfdiId || typeof c.satCfdiId === 'string') return null;
    return c.satCfdiId as Partial<CFDI>;
  }

  fieldName(field: string): string {
    return this.fieldLabel[field] ?? field;
  }

  updateStatus(d: Discrepancy, status: string): void {
    this.comparisonFacade.updateDiscrepancyStatus(d._id, status).subscribe({
      next: (updated) => {
        const idx = this.discrepancies.findIndex(x => x._id === d._id);
        if (idx >= 0) this.discrepancies[idx] = { ...this.discrepancies[idx], ...updated };
      },
    });
  }

  applyFilters(): void {
    this.pagination.page = 1;
    this.loadData();
  }

  changePage(page: number): void {
    this.pagination.page = page;
    this.loadData();
  }

  exportExcel(): void {
    this.comparisonFacade.exportExcel(this.filters as Record<string, unknown>).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `discrepancias_${Date.now()}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }
}
