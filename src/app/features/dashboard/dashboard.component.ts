import { Component, OnInit } from '@angular/core';
import { ComparisonService } from '../../core/services/comparison.service';
import { DashboardKPIs, Discrepancy } from '../../core/models/cfdi.model';

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  kpis: DashboardKPIs | null = null;
  topDiscrepancyTypes: any[] = [];
  recentDiscrepancies: Discrepancy[] = [];
  loading = true;
  error: string | null = null;

  // Chart: estado SAT
  satStatusChartData: any = { datasets: [], labels: [] };
  satStatusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { font: { size: 11 }, boxWidth: 10, padding: 8 } },
    },
  };

  // Chart: comparaciones por estado
  comparisonChartData: any = { datasets: [], labels: [] };

  constructor(private comparisonService: ComparisonService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.comparisonService.getDashboard().subscribe({
      next: (data) => {
        this.kpis = data.kpis;
        this.topDiscrepancyTypes = data.topDiscrepancyTypes;
        this.recentDiscrepancies = data.recentDiscrepancies;
        this.buildCharts(data.kpis);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error cargando el dashboard';
        this.loading = false;
      },
    });
  }

  private buildCharts(kpis: DashboardKPIs): void {
    // Gráfica de estado SAT
    const satLabels = kpis.cfdisBySatStatus.map(s => s._id || 'Sin verificar');
    const satData = kpis.cfdisBySatStatus.map(s => s.count);
    this.satStatusChartData = {
      labels: satLabels,
      datasets: [{
        data: satData,
        backgroundColor: ['#22c55e', '#ef4444', '#f59e0b', '#94a3b8', '#6366f1'],
      }],
    };

    // Gráfica de comparaciones
    const compLabels = kpis.comparisonStats.map(s => s._id);
    const compData = kpis.comparisonStats.map(s => s.count);
    this.comparisonChartData = {
      labels: compLabels,
      datasets: [{
        label: 'Comparaciones',
        data: compData,
        backgroundColor: '#3b82f6',
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
    const total = this.kpis.comparisonStats.reduce((s, c) => s + c.count, 0);
    const matches = this.kpis.comparisonStats.find(c => c._id === 'match')?.count ?? 0;
    return total > 0 ? Math.round((matches / total) * 100) : 0;
  }

  runBatchComparison(): void {
    this.comparisonService.runBatch().subscribe({
      next: (res) => console.log('Batch iniciado:', res),
      error: (err) => console.error('Error en batch:', err),
    });
  }
}
