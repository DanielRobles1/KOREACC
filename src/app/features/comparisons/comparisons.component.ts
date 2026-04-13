import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, filter, take } from 'rxjs/operators';
import { ComparisonFacade } from '../../core/facades';
import { Comparison, ComparisonSession, CFDI } from '../../core/models/cfdi.model';
import {
  COMPARISON_STATUS_LABEL,
  COMPARISON_STATUS_CLASS,
  SAT_STATUS_CLASS,
  SEVERITY_LABEL,
  FIELD_LABEL,
  MESES,
} from '../../core/constants/cfdi-labels';

@Component({
  standalone: false,
  selector: 'app-comparisons',
  templateUrl: './comparisons.component.html',
})
export class ComparisonsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  comparisons: Comparison[] = [];
  pagination = { total: 0, page: 1, limit: 20, pages: 0 };
  loading = false;
  expanded: Record<string, boolean> = {};
  statusFilter = '';

  ejercicioFilter: number | '' = '';
  periodoFilter:   number | '' = '';
  tipoFilter:      string      = '';
  ejerciciosDisponibles: number[] = [];
  readonly meses = MESES;

  readonly tipoOptions = [
    { value: '',  label: 'Todos' },
    { value: 'I', label: 'Ingreso' },
    { value: 'E', label: 'Egreso' },
    { value: 'P', label: 'Pago' },
    { value: 'N', label: 'Nómina' },
  ];

  batchLoading = false;
  batchMessage = '';

  // Modal de resultados post-comparación
  mostrarModalResultado = false;
  resultadoComparacion: { match: number; discrepancy: number; not_in_sat: number; not_in_erp: number; cancelled: number; error: number; total: number } | null = null;

  lastSession: ComparisonSession | null = null;
  sessionExpanded = false;
  sessionComparisons: Comparison[] = [];
  sessionCompPagination = { total: 0, page: 1, limit: 20, pages: 0 };
  sessionLoading = false;
  sessionExpanded2: Record<string, boolean> = {};

  readonly statusLabel    = COMPARISON_STATUS_LABEL;
  readonly statusClass    = COMPARISON_STATUS_CLASS;
  readonly satStatusClass = SAT_STATUS_CLASS;
  readonly severityLabel  = SEVERITY_LABEL;
  readonly fieldLabel     = FIELD_LABEL;

  readonly statusOptions = [
    { value: '',            label: 'Todos' },
    { value: 'match',       label: '✓ Coincide' },
    { value: 'discrepancy', label: '⚠ Con diferencias' },
    { value: 'not_in_sat',  label: '? No en SAT' },
    { value: 'cancelled',   label: '✗ Cancelado en SAT' },
    { value: 'error',       label: '! Error' },
  ];

  constructor(
    private comparisonFacade: ComparisonFacade,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadPeriodos();
    const qp = this.route.snapshot.queryParamMap;
    const ej = qp.get('ejercicio');
    const pe = qp.get('periodo');
    if (ej) this.ejercicioFilter = parseInt(ej);
    if (pe) this.periodoFilter   = parseInt(pe);
    this.load();
    this.loadLastSession();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPeriodos(): void {
    this.comparisonFacade.getPeriodos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { this.ejerciciosDisponibles = res.ejercicios; },
      error: () => {},
    });
  }

  load(page = 1): void {
    this.loading = true;
    const filters: Record<string, unknown> = { page, limit: 20 };
    if (this.statusFilter)    filters['status']    = this.statusFilter;
    if (this.ejercicioFilter) filters['ejercicio'] = this.ejercicioFilter;
    if (this.periodoFilter)   filters['periodo']   = this.periodoFilter;
    if (this.tipoFilter)      filters['tipo']      = this.tipoFilter;
    this.comparisonFacade.listComparisons(filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.comparisons = res.data;
        this.pagination = res.pagination;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  applyFilter(): void { this.load(1); }
  changePage(page: number): void { this.load(page); }

  toggle(id: string): void {
    this.expanded[id] = !this.expanded[id];
  }

  loadLastSession(): void {
    this.comparisonFacade.listSessions({ page: 1, limit: 1 }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.lastSession = res.data[0] ?? null;
        if (this.sessionExpanded && this.lastSession) {
          this.loadSessionDetail(1);
        }
      },
      error: () => {},
    });
  }

  toggleSessionDetail(): void {
    this.sessionExpanded = !this.sessionExpanded;
    if (this.sessionExpanded && this.lastSession && !this.sessionComparisons.length) {
      this.loadSessionDetail(1);
    }
  }

  loadSessionDetail(page: number): void {
    if (!this.lastSession) return;
    this.sessionLoading = true;
    this.sessionExpanded2 = {};
    this.comparisonFacade.getSession(this.lastSession._id, { page, limit: 20 }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.sessionComparisons = res.comparisons.data;
        this.sessionCompPagination = res.comparisons.pagination;
        this.sessionLoading = false;
      },
      error: () => { this.sessionLoading = false; },
    });
  }

  toggleSession2(id: string): void {
    this.sessionExpanded2[id] = !this.sessionExpanded2[id];
  }

  changeSessionPage(page: number): void { this.loadSessionDetail(page); }

  runBatch(): void {
    this.batchLoading = true;
    this.batchMessage = '';
    const ej   = this.ejercicioFilter || undefined;
    const pe   = this.periodoFilter   || undefined;
    const tipo = this.tipoFilter      || undefined;
    this.comparisonFacade.runBatch({}, ej as number | undefined, pe as number | undefined, tipo).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.batchLoading = false;
        if (res?.results) {
          // Resultado síncrono (poco probable, pero manejarlo)
          const r = res.results;
          this.resultadoComparacion = {
            match:       r.match       ?? 0,
            discrepancy: r.discrepancy ?? 0,
            not_in_sat:  r.not_in_sat  ?? 0,
            not_in_erp:  r.not_in_erp  ?? 0,
            cancelled:   r.cancelled   ?? 0,
            error:       r.error       ?? 0,
            total:       res.total     ?? 0,
          };
          this.mostrarModalResultado = true;
        } else if (res?.sessionId) {
          // Batch asíncrono — esperar por polling hasta que la sesión termine
          this.batchMessage = `Comparando ${res.total ?? '?'} CFDIs...`;
          this.esperarResultados(res.sessionId.toString());
        }
      },
      error: () => {
        this.batchLoading = false;
        this.batchMessage = 'Error al iniciar la comparación.';
      },
    });
  }

  esperarResultados(sessionId: string): void {
    interval(5000).pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.comparisonFacade.getSession(sessionId, { page: 1, limit: 1 })),
      filter(res => ['completed', 'failed'].includes((res.session as any).status)),
      take(1),
    ).subscribe({
      next: (res) => {
        this.batchMessage = '';
        const s = res.session as any;
        const r = s.results ?? {};
        this.resultadoComparacion = {
          match:       r.match       ?? 0,
          discrepancy: r.discrepancy ?? 0,
          not_in_sat:  r.not_in_sat  ?? 0,
          not_in_erp:  r.not_in_erp  ?? 0,
          cancelled:   r.cancelled   ?? 0,
          error:       r.error       ?? 0,
          total:       s.totalCFDIs  ?? 0,
        };
        this.mostrarModalResultado = true;
        // Refrescar listas tras completar
        this.comparisons = [];
        this.sessionComparisons = [];
        this.sessionExpanded = false;
        this.load();
        this.loadLastSession();
      },
      error: () => { this.batchMessage = ''; },
    });
  }

  irADiscrepancias(): void {
    this.mostrarModalResultado = false;
    const qp: Record<string, number> = {};
    if (this.ejercicioFilter) qp['ejercicio'] = +this.ejercicioFilter;
    if (this.periodoFilter)   qp['periodo']   = +this.periodoFilter;
    this.router.navigate(['/discrepancies'], { queryParams: qp });
  }

  irACfdis(): void {
    this.mostrarModalResultado = false;
    const qp: Record<string, string | number> = { source: 'ERP' };
    if (this.ejercicioFilter) qp['ejercicio'] = +this.ejercicioFilter;
    if (this.periodoFilter)   qp['periodo']   = +this.periodoFilter;
    this.router.navigate(['/cfdis'], { queryParams: qp });
  }

  getNombreMes(num: number | ''): string {
    if (!num) return '';
    return this.meses[+num - 1]?.label ?? '';
  }

  cfdi(c: Comparison): Partial<CFDI> | null {
    return c.erpCfdiId && typeof c.erpCfdiId === 'object' ? c.erpCfdiId as Partial<CFDI> : null;
  }

  fieldName(field: string): string {
    return this.fieldLabel[field] ?? field;
  }

  sessionDuration(s: ComparisonSession): string {
    if (!s.completedAt) return '—';
    const ms = new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime();
    const secs = Math.floor(ms / 1000);
    return secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${secs % 60}s`;
  }

  sessionResults(s: ComparisonSession): { match: number; discrepancy: number; not_in_sat: number; cancelled: number; error: number } {
    const r = (s as any).results ?? {};
    return {
      match:       r.match       ?? 0,
      discrepancy: r.discrepancy ?? 0,
      not_in_sat:  r.not_in_sat  ?? 0,
      cancelled:   r.cancelled   ?? 0,
      error:       r.error       ?? 0,
    };
  }
}
