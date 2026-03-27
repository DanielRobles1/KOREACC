import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Comparison, Discrepancy, PaginatedResponse, DashboardKPIs } from '../models/cfdi.model';

@Injectable({ providedIn: 'root' })
export class ComparisonService {
  constructor(private api: ApiService) {}

  listComparisons(filters: Record<string, unknown> = {}): Observable<PaginatedResponse<Comparison>> {
    return this.api.get<PaginatedResponse<Comparison>>('/comparisons', filters);
  }

  getComparison(id: string): Observable<Comparison> {
    return this.api.get<Comparison>(`/comparisons/${id}`);
  }

  getStats(): Observable<{ total: number; byStatus: any[] }> {
    return this.api.get('/comparisons/stats');
  }

  runBatch(filters: Record<string, unknown> = {}): Observable<any> {
    return this.api.post('/comparisons/batch', { filters });
  }

  resolve(id: string, resolutionNotes?: string): Observable<Comparison> {
    return this.api.patch<Comparison>(`/comparisons/${id}/resolve`, { resolutionNotes });
  }

  listDiscrepancies(filters: Record<string, unknown> = {}): Observable<PaginatedResponse<Discrepancy>> {
    return this.api.get<PaginatedResponse<Discrepancy>>('/discrepancies', filters);
  }

  getDiscrepancySummary(): Observable<any> {
    return this.api.get('/discrepancies/summary');
  }

  updateDiscrepancyStatus(id: string, status: string, resolutionType?: string, note?: string): Observable<Discrepancy> {
    return this.api.patch<Discrepancy>(`/discrepancies/${id}/status`, { status, resolutionType, note });
  }

  getDashboard(filters: Record<string, unknown> = {}): Observable<{ kpis: DashboardKPIs; topDiscrepancyTypes: any[]; recentDiscrepancies: Discrepancy[] }> {
    return this.api.get('/reports/dashboard', filters);
  }

  exportExcel(filters: Record<string, unknown> = {}): Observable<Blob> {
    return this.api.downloadBlob('/reports/export/excel', filters);
  }
}
