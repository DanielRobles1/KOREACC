import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ComparisonFacade } from '../../core/facades';
import { DashboardKPIs, Discrepancy } from '../../core/models/cfdi.model';
import { DISCREPANCY_TYPE_LABEL, MESES_LABELS } from '../../core/constants/cfdi-labels';

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  kpis: DashboardKPIs | null = null;
  topDiscrepancyTypes: any[] = [];
  recentDiscrepancies: Discrepancy[] = [];
  readonly discrepancyTypeLabel = DISCREPANCY_TYPE_LABEL;
  loading = true;
  error: string | null = null;

  ejercicioSeleccionado?: number;
  periodoSeleccionado?: number;
  tipoSeleccionado?: string;
  readonly anioActual = new Date().getFullYear();
  readonly ejercicios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  readonly meses = MESES_LABELS.map((nombre, i) => ({ valor: i + 1, nombre }));
  readonly tipos = [
    { valor: 'I', label: 'I - Ingreso' },
    { valor: 'E', label: 'E - Egreso' },
    { valor: 'P', label: 'P - Pago' },
    { valor: 'T', label: 'T - Traslado' },
    { valor: 'N', label: 'N - Nómina' },
  ];

  readonly donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { font: { size: 11 }, boxWidth: 10, padding: 8 } },
    },
  };

  readonly barHOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { font: { size: 10 } } },
      y: { ticks: { font: { size: 11 } } },
    },
  };

  satStatusChartData: any    = { datasets: [], labels: [] };
  conciliationChartData: any = { datasets: [], labels: [] };
  amountsChartData: any      = { datasets: [], labels: [] };

  constructor(private comparisonFacade: ComparisonFacade) {}

  ngOnInit(): void { this.loadDashboard(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboard(): void {
    this.loading = true;
    this.comparisonFacade.getDashboard(this.ejercicioSeleccionado, this.periodoSeleccionado, this.tipoSeleccionado).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.kpis = data.kpis;
        this.topDiscrepancyTypes = data.topDiscrepancyTypes;
        this.recentDiscrepancies = data.recentDiscrepancies;
        this.buildCharts(data.kpis);
        this.loading = false;
      },
      error: () => {
        this.error = 'Error cargando el dashboard';
        this.loading = false;
      },
    });
  }

  private buildCharts(kpis: DashboardKPIs): void {
    const satStatusColor: Record<string, string> = {
      'Vigente':            '#22c55e',
      'Cancelado':          '#ef4444',
      'No Encontrado':      '#f59e0b',
      'Error':              '#94a3b8',
      'Deshabilitado':      '#9ca3af',
      'Expresión Inválida': '#6366f1',
      'Pendiente':          '#60a5fa',
      'Sin verificar':      '#e2e8f0',
    };
    this.satStatusChartData = {
      labels: kpis.cfdisBySatStatus.map(s => s._id || 'Sin verificar'),
      datasets: [{
        data: kpis.cfdisBySatStatus.map(s => s.count),
        backgroundColor: kpis.cfdisBySatStatus.map(s => satStatusColor[s._id || 'Sin verificar'] ?? '#e2e8f0'),
      }],
    };

    this.conciliationChartData = {
      labels: ['Conciliados', 'Con discrepancias / advertencias', 'Pendientes / sin comparar'],
      datasets: [{
        data: [kpis.conciliados, kpis.conDiscrepancia, kpis.sinConciliar],
        backgroundColor: ['#22c55e', '#ef4444', '#94a3b8'],
      }],
    };

    this.amountsChartData = {
      labels: ['Total SAT', 'Total Sistema (ERP)'],
      datasets: [{
        data: [kpis.totalSAT, kpis.totalERP],
        backgroundColor: ['#22c55e', '#3b82f6'],
        borderRadius: 4,
      }],
    };

  }

  get totalDiscrepanciasCriticas(): number {
    return this.kpis?.discrepancyStats.find(d => d._id === 'critical')?.count ?? 0;
  }

  get totalImpactoFiscal(): number {
    return this.kpis?.discrepancyStats.reduce((sum, d) => sum + (d.fiscalImpact ?? 0), 0) ?? 0;
  }

  get matchRate(): number {
    if (!this.kpis) return 0;
    const total = (this.kpis.conciliados ?? 0) + (this.kpis.conDiscrepancia ?? 0) + (this.kpis.sinConciliar ?? 0);
    return total > 0 ? Math.round(((this.kpis.conciliados ?? 0) / total) * 100) : 0;
  }

  get diferenciaAbs(): number {
    return Math.abs(this.kpis?.diferencia ?? 0);
  }

  get ivaTrasladadoTotal(): number { return this.kpis?.ivaStats?.ivaTrasladadoTotal ?? 0; }
  get ivaRetenidoTotal():   number { return this.kpis?.ivaStats?.ivaRetenidoTotal   ?? 0; }
  get ivaNeto():            number { return this.kpis?.ivaStats?.ivaNeto            ?? 0; }
  get countERP():           number { return this.kpis?.countERP ?? 0; }
  get countSAT():           number { return this.kpis?.countSAT ?? 0; }

  onEjercicioChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.ejercicioSeleccionado = val ? +val : undefined;
    this.periodoSeleccionado = undefined;
    this.loadDashboard();
  }

  onPeriodoChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.periodoSeleccionado = val ? +val : undefined;
    this.loadDashboard();
  }

  onTipoChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.tipoSeleccionado = val || undefined;
    this.loadDashboard();
  }

  runBatchComparison(): void {
    this.comparisonFacade.runBatch().subscribe();
  }
}
