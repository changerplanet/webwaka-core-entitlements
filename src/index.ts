export interface Entitlement {
  id: string;
  name: string;
  description?: string;
}

export interface EntitlementCheck {
  entitlementId: string;
  granted: boolean;
}

export function checkEntitlement(entitlementId: string): EntitlementCheck {
  return {
    entitlementId,
    granted: false,
  };
}

export const VERSION = "0.0.0";
