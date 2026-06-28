export type ErrorCode = string;

export interface CatalogEntry {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  bridgeFacing: boolean;
}

export const errorCatalog: CatalogEntry[] = [
  { code: "OUTAGE_NOT_FOUND",     message: "Outage ID does not exist in storage.",            retryable: false, bridgeFacing: true },
  { code: "CALC_OVERFLOW",        message: "Calculation exceeded safe numeric bounds.",        retryable: false, bridgeFacing: true },
  { code: "CONFIG_LOCKED",        message: "Configuration is frozen and cannot be mutated.",  retryable: false, bridgeFacing: true },
  { code: "QUORUM_NOT_MET",       message: "Governance action lacks required quorum.",         retryable: true,  bridgeFacing: true },
  { code: "DUPLICATE_SUBMISSION", message: "This outage ID has already been processed.",      retryable: false, bridgeFacing: true },
];

export function lookupError(code: ErrorCode): CatalogEntry | undefined {
  return errorCatalog.find((e) => e.code === code);
}

export function bridgeFacingErrors(): CatalogEntry[] {
  return errorCatalog.filter((e) => e.bridgeFacing);
}

export function publishCatalog(): Record<ErrorCode, Omit<CatalogEntry, "code">> {
  return Object.fromEntries(errorCatalog.map(({ code, ...rest }) => [code, rest]));
}
