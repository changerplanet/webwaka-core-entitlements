import { type EntitlementContext, type EntitlementDefinition, type EntitlementGrant, type EntitlementOverride, type EntitlementResult, type EntitlementSnapshot } from "../models";
export declare class CrossTenantAccessError extends Error {
    constructor(expectedTenantId: string, actualTenantId: string);
}
export declare class EntitlementsEngine {
    private readonly definitions;
    private readonly snapshotTtlMs;
    constructor(definitions: readonly EntitlementDefinition[], options?: {
        snapshotTtlMs?: number;
    });
    evaluateEntitlement(entitlementId: string, context: EntitlementContext, grants: readonly EntitlementGrant[], overrides: readonly EntitlementOverride[]): EntitlementResult;
    generateSnapshot(context: EntitlementContext, grants: readonly EntitlementGrant[], overrides: readonly EntitlementOverride[]): EntitlementSnapshot;
    verifySnapshot(snapshot: EntitlementSnapshot): boolean;
    evaluateFromSnapshot(entitlementId: string, snapshot: EntitlementSnapshot, currentTime: number, expectedTenantId: string): EntitlementResult | null;
}
//# sourceMappingURL=EntitlementsEngine.d.ts.map