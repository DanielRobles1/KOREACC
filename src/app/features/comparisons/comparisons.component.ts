import { Component, OnInit } from '@angular/core';
import { ComparisonService } from '../../core/services/comparison.service';
import { Comparison } from '../../core/models/cfdi.model';

@Component({
  standalone: false,
  selector: 'app-comparisons',
  templateUrl: './comparisons.component.html',
})
export class ComparisonsComponent implements OnInit {
  comparisons: Comparison[] = [];
  pagination = { total: 0, page: 1, limit: 20, pages: 0 };
  loading = false;
  batchLoading = false;
  expanded: Record<string, boolean> = {};

  readonly statusLabel: Record<string, string | undefined> = {
    match:       'Coincide',
    discrepancy: 'Con discrepancias',
    not_in_sat:  'No en SAT',
    cancelled:   'Cancelado en SAT',
    pending:     'Pendiente',
    error:       'Error',
  };

  readonly statusClass: Record<string, string> = {
    match:       'badge-success',
    discrepancy: 'badge-danger',
    not_in_sat:  'badge-warning',
    cancelled:   'badge-danger',
    pending:     'badge-info',
    error:       'badge-secondary',
  };

  readonly severityLabel: Record<string, string | undefined> = {
    critical: 'Crítica',
    warning:  'Advertencia',
    info:     'Info',
  };

  readonly fieldLabel: Record<string, string> = {
    'total':                               'Total',
    'subTotal':                            'SubTotal',
    'descuento':                           'Descuento',
    'emisor.rfc':                          'RFC Emisor',
    'receptor.rfc':                        'RFC Receptor',
    'emisor.regimenFiscal':               'Régimen Fiscal Emisor',
    'impuestos.totalImpuestosTrasladados': 'IVA Trasladado',
    'fecha':                               'Fecha',
    'sat.uuid':                            'UUID en SAT',
    'sat.estado':                          'Estado SAT',
  };

  constructor(private comparisonService: ComparisonService) {}

  ngOnInit(): void { this.load(); }

  load(page = 1): void {
    this.loading = true;
    this.comparisonService.listComparisons({ page, limit: 20 }).subscribe({
      next: (res) => {
        this.comparisons = res.data;
        this.pagination = res.pagination;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  runBatch(): void {
    this.batchLoading = true;
    this.comparisonService.runBatch().subscribe({
      next: () => { this.batchLoading = false; this.load(); },
      error: () => { this.batchLoading = false; },
    });
  }

  toggle(id: string): void {
    this.expanded[id] = !this.expanded[id];
  }

  fieldName(field: string): string {
    return this.fieldLabel[field] ?? field;
  }

  changePage(page: number): void { this.load(page); }
}
