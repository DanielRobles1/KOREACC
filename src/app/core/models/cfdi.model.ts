export type CFDISource = 'ERP' | 'SAT' | 'MANUAL' | 'RECEPTOR';
export type TipoComprobante = 'I' | 'E' | 'T' | 'N' | 'P';
export type SatStatus = 'Vigente' | 'Cancelado' | 'No Encontrado' | 'Pendiente' | 'Error' | 'Expresión Inválida' | 'Desconocido' | null;
export type ComparisonStatus = 'match' | 'discrepancy' | 'not_in_sat' | 'not_in_erp' | 'cancelled' | 'pending' | 'error';
export type DiscrepancyType =
  | 'UUID_NOT_FOUND_SAT' | 'AMOUNT_MISMATCH' | 'RFC_MISMATCH' | 'DATE_MISMATCH'
  | 'CANCELLED_IN_SAT' | 'DUPLICATE_UUID' | 'MISSING_IN_ERP' | 'TAX_CALCULATION_ERROR'
  | 'CFDI_VERSION_MISMATCH' | 'SIGNATURE_INVALID' | 'COMPLEMENT_MISSING' | 'REGIME_MISMATCH' | 'OTHER';
export type Severity = 'critical' | 'warning' | 'high' | 'medium' | 'low';
export type DiscrepancyStatus = 'open' | 'in_review' | 'resolved' | 'ignored' | 'escalated';

export interface Contribuyente {
  rfc: string;
  nombre?: string;
  regimenFiscal?: string;
  usoCFDI?: string;
}

export interface CFDI {
  _id: string;
  uuid: string;
  source: CFDISource;
  version: string;
  serie?: string;
  folio?: string;
  fecha: Date;
  subTotal: number;
  descuento?: number;
  moneda: string;
  tipoCambio?: number;
  total: number;
  tipoDeComprobante: TipoComprobante;
  formaPago?: string;
  metodoPago?: string;
  lugarExpedicion?: string;
  emisor: Contribuyente;
  receptor: Contribuyente;
  satStatus: SatStatus;
  satLastCheck?: Date;
  lastComparisonStatus?: ComparisonStatus | null;
  lastComparisonAt?: Date;
  erpId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldDiff {
  field: string;
  erpValue: unknown;
  satValue: unknown;
  severity: 'critical' | 'warning' | 'info';
  fiscalImpact?: { amount: number; currency: string; taxType?: string };
}

export interface Comparison {
  _id: string;
  uuid: string;
  erpCfdiId: string | Partial<CFDI>;
  satCfdiId?: string | Partial<CFDI>;
  status: ComparisonStatus;
  differences: FieldDiff[];
  totalDifferences: number;
  criticalCount: number;
  warningCount: number;
  comparedAt: Date;
  comparedBy: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolutionNotes?: string;
  hasLocalSATCopy?: boolean;
}

export interface Discrepancy {
  _id: string;
  comparisonId: string | Partial<Comparison>;
  uuid: string;
  type: DiscrepancyType;
  severity: Severity;
  description: string;
  erpValue?: unknown;
  satValue?: unknown;
  rfcEmisor?: string;
  rfcReceptor?: string;
  status: DiscrepancyStatus;
  fiscalImpact?: { amount: number; currency: string; taxType?: string };
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface DashboardKPIs {
  totalCFDIs: number;
  cfdisBySatStatus: Array<{ _id: SatStatus; count: number; totalAmount: number }>;
  comparisonStats: Array<{ _id: ComparisonStatus; count: number }>;
  discrepancyStats: Array<{ _id: Severity; count: number; fiscalImpact: number }>;
}
