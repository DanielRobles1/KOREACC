import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CFDI, PaginatedResponse } from '../models/cfdi.model';

export interface CFDIFilter {
  page?: number;
  limit?: number;
  source?: string;
  tipoDeComprobante?: string;
  rfcEmisor?: string;
  rfcReceptor?: string;
  satStatus?: string;
  fechaInicio?: string;
  fechaFin?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class CfdiService {
  constructor(private api: ApiService) {}

  list(filters: CFDIFilter = {}): Observable<PaginatedResponse<CFDI>> {
    return this.api.get<PaginatedResponse<CFDI>>('/cfdis', filters as Record<string, unknown>);
  }

  getById(id: string): Observable<CFDI> {
    return this.api.get<CFDI>(`/cfdis/${id}`);
  }

  uploadXMLs(files: File[], source: 'ERP' | 'SAT' = 'ERP'): Observable<{ success: any[]; failed: any[]; message: string }> {
    return this.api.uploadFiles('/cfdis/upload', files, 'xmlFiles', { source });
  }

  compare(id: string): Observable<any> {
    return this.api.post(`/cfdis/${id}/compare`, {});
  }

  verifySAT(uuid: string, rfcEmisor: string, rfcReceptor: string, total: number): Observable<any> {
    return this.api.post('/sat/verify', { uuid, rfcEmisor, rfcReceptor, total });
  }

  getSATStatus(uuid: string): Observable<any> {
    return this.api.get(`/sat/status/${uuid}`);
  }

  downloadXML(id: string): void {
    window.open(`${this.api.base}/cfdis/${id}/xml`, '_blank');
  }
}
