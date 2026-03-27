import { Component } from '@angular/core';
import { ComparisonService } from '../../core/services/comparison.service';

@Component({
  standalone: false,
  selector: 'app-reports',
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Reportes</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="table-card p-6">
          <h3 class="text-lg font-semibold mb-2">Exportar Comparaciones</h3>
          <p class="text-gray-500 text-sm mb-4">Descarga un Excel con todas las comparaciones y su estado.</p>
          <button (click)="exportExcel()" [disabled]="loading" class="btn btn-primary">
            {{ loading ? 'Generando...' : 'Descargar Excel' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ReportsComponent {
  loading = false;

  constructor(private comparisonService: ComparisonService) {}

  exportExcel(): void {
    this.loading = true;
    this.comparisonService.exportExcel().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_cfdis_${Date.now()}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
