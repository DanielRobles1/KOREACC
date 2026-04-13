import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ComparisonFacade } from '../../../core/facades';
import { ComparisonSession, Comparison, CFDI } from '../../../core/models/cfdi.model';
import {
  COMPARISON_STATUS_LABEL,
  COMPARISON_STATUS_CLASS,
  SAT_STATUS_CLASS,
  SEVERITY_LABEL,
  FIELD_LABEL,
} from '../../../core/constants/cfdi-labels';

@Component({
  standalone: false,
  selector: 'app-comparison-sessions',
  templateUrl: './comparison-sessions.component.html',
})
export class ComparisonSessionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  readonly Math = Math;

  sessions: ComparisonSession[] = [];
  pagination = { total: 0, page: 1, limit: 20 };
  loading = false;
  batchLoading = false;

  expandedSessionId: string | null = null;
  sessionComparisons: Comparison[] = [];
  sessionCompPagination = { total: 0, page: 1, limit: 20 };
  sessionLoading = false;
  expandedCompId: Record<string, boolean> = {};

  readonly statusLabel   = COMPARISON_STATUS_LABEL;
  readonly statusClass   = COMPARISON_STATUS_CLASS;
  readonly satStatusClass = SAT_STATUS_CLASS;
  readonly severityLabel = SEVERITY_LABEL;
  readonly fieldLabel    = FIELD_LABEL;

  constructor(private comparisonFacade: ComparisonFacade) {}

  ngOnInit(): void { this.load(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(page = 1): void {
    this.loading = true;
    this.comparisonFacade.listSessions({ page, limit: 20 }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.sessions = res.data;
        this.pagination = { ...res.pagination };
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  toggleSession(session: ComparisonSession): void {
    if (this.expandedSessionId === session._id) {
      this.expandedSessionId = null;
      this.sessionComparisons = [];
      return;
    }
    this.expandedSessionId = session._id;
    this.loadSessionComparisons(session._id, 1);
  }

  loadSessionComparisons(sessionId: string, page: number): void {
    this.sessionLoading = true;
    this.expandedCompId = {};
    this.comparisonFacade.getSession(sessionId, { page, limit: 20 }).subscribe({
      next: (res) => {
        this.sessionComparisons = res.comparisons.data;
        this.sessionCompPagination = { ...res.comparisons.pagination };
        this.sessionLoading = false;
      },
      error: () => { this.sessionLoading = false; },
    });
  }

  runBatch(): void {
    this.batchLoading = true;
    this.comparisonFacade.runBatch().subscribe({
      next: () => {
        this.batchLoading = false;
        setTimeout(() => this.load(), 1500);
      },
      error: () => { this.batchLoading = false; },
    });
  }

  /** Devuelve el CFDI populado de una comparación, o null si solo es un ID. */
  cfdi(c: Comparison): Partial<CFDI> | null {
    return c.erpCfdiId && typeof c.erpCfdiId === 'object' ? c.erpCfdiId as Partial<CFDI> : null;
  }

  toggleComp(id: string): void {
    this.expandedCompId[id] = !this.expandedCompId[id];
  }

  fieldName(field: string): string {
    return this.fieldLabel[field] ?? field;
  }

  duration(session: ComparisonSession): string {
    if (!session.completedAt) return '—';
    const ms = new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime();
    const secs = Math.floor(ms / 1000);
    return secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${secs % 60}s`;
  }

  changePage(page: number): void { this.load(page); }

  changeSessionPage(page: number): void {
    if (this.expandedSessionId) this.loadSessionComparisons(this.expandedSessionId, page);
  }

  getSessionStatusClass(status: string): string {
    return status === 'completed' ? 'badge-success' : status === 'running' ? 'badge-info' : 'badge-danger';
  }
}
