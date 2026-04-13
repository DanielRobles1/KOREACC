import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ErpCargaParams, ErpCargaResult } from '../models/import.model';

/**
 * Servicio dedicado a la integración con el ERP externo.
 * Punto único de acceso al endpoint POST /api/erp/cargar.
 *
 * El backend maneja la autenticación, paginación y transformación;
 * el frontend solo envía ejercicio y periodo.
 */
@Injectable({ providedIn: 'root' })
export class ErpService {
  constructor(private api: ApiService) {}

  cargarDesdeErp(ejercicio: number, periodo: number): Observable<ErpCargaResult> {
    const params: ErpCargaParams = { ejercicio, periodo };
    return this.api.post<ErpCargaResult>('/erp/cargar', params);
  }

  enriquecerPagos(ejercicio?: number, periodo?: number): Observable<any> {
    const body: Record<string, number> = {};
    if (ejercicio) body['ejercicio'] = ejercicio;
    if (periodo)   body['periodo']   = periodo;
    return this.api.post<any>('/erp/enriquecer-pagos', body);
  }
}
