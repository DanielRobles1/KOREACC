import { Component, OnInit } from '@angular/core';
import { ComparisonService } from '../../core/services/comparison.service';
import { Discrepancy } from '../../core/models/cfdi.model';

@Component({
  standalone: false,
  selector: 'app-discrepancies',
  templateUrl: './discrepancies.component.html',
})
export class DiscrepanciesComponent implements OnInit {
  discrepancies: Discrepancy[] = [];
  summary: any = null;
  pagination = { total: 0, page: 1, limit: 20 };
  loading = false;
  filters = { type: '', severity: '', status: 'open', rfcEmisor: '' };

  readonly severityColors = {
    critical: 'badge-danger',
    high: 'badge-warning',
    medium: 'badge-info',
    low: 'badge-secondary',
  };

  readonly statusOptions = ['open', 'in_review', 'resolved', 'ignored', 'escalated'];
  readonly resolutionTypes = ['corrected', 'accepted', 'erp_error', 'sat_error', 'false_positive'];

  constructor(private comparisonService: ComparisonService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    const params = { ...this.filters, page: this.pagination.page, limit: this.pagination.limit } as Record<string, unknown>;

    this.comparisonService.listDiscrepancies(params).subscribe({
      next: (res) => {
        this.discrepancies = res.data;
        this.pagination = { ...this.pagination, total: res.pagination.total };
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });

    this.comparisonService.getDiscrepancySummary().subscribe({
      next: (s) => this.summary = s,
    });
  }

  updateStatus(d: Discrepancy, status: string, resolutionType?: string): void {
    this.comparisonService.updateDiscrepancyStatus(d._id, status, resolutionType).subscribe({
      next: (updated) => {
        const idx = this.discrepancies.findIndex(x => x._id === d._id);
        if (idx >= 0) this.discrepancies[idx] = updated;
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
    this.comparisonService.exportExcel(this.filters as Record<string, unknown>).subscribe({
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
