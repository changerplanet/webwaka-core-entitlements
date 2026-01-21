import type { EntitlementContext, EntitlementGrant, EntitlementOverride, EntitlementSource } from "../models";
export interface EvaluationMatch {
    value: boolean | number;
    source: EntitlementSource;
    expiresAt?: number;
}
export declare function evaluateWithPrecedence(entitlementId: string, context: EntitlementContext, grants: readonly EntitlementGrant[], overrides: readonly EntitlementOverride[], defaultValue: boolean | number): EvaluationMatch;
//# sourceMappingURL=precedence.d.ts.map