import type {
  EntitlementContext,
  EntitlementGrant,
  EntitlementOverride,
  EntitlementSource,
} from "../models";

export interface EvaluationMatch {
  value: boolean | number;
  source: EntitlementSource;
  expiresAt?: number;
}

function isValid(validFrom: number, validUntil: number | undefined, evaluationTime: number): boolean {
  if (evaluationTime < validFrom) return false;
  if (validUntil !== undefined && evaluationTime >= validUntil) return false;
  return true;
}

function findIndividualOverride(
  entitlementId: string,
  context: EntitlementContext,
  overrides: readonly EntitlementOverride[]
): EvaluationMatch | null {
  for (const override of overrides) {
    if (
      override.entitlementId === entitlementId &&
      override.subjectId === context.subjectId &&
      override.tenantId === context.tenantId &&
      override.type === "individual" &&
      isValid(override.validFrom, override.validUntil, context.evaluationTime)
    ) {
      return {
        value: override.value,
        source: "override:individual",
        expiresAt: override.validUntil,
      };
    }
  }
  return null;
}

function findGroupOverride(
  entitlementId: string,
  context: EntitlementContext,
  overrides: readonly EntitlementOverride[]
): EvaluationMatch | null {
  if (!context.groupIds || context.groupIds.length === 0) return null;
  
  for (const override of overrides) {
    if (
      override.entitlementId === entitlementId &&
      override.tenantId === context.tenantId &&
      override.type === "group" &&
      context.groupIds.includes(override.subjectId) &&
      isValid(override.validFrom, override.validUntil, context.evaluationTime)
    ) {
      return {
        value: override.value,
        source: "override:group",
        expiresAt: override.validUntil,
      };
    }
  }
  return null;
}

function findGrantBySource(
  entitlementId: string,
  context: EntitlementContext,
  grants: readonly EntitlementGrant[],
  sourceType: "tenant" | "plan" | "partner" | "system"
): EvaluationMatch | null {
  for (const grant of grants) {
    if (
      grant.entitlementId === entitlementId &&
      grant.subjectId === context.subjectId &&
      grant.tenantId === context.tenantId &&
      grant.source === sourceType &&
      isValid(grant.validFrom, grant.validUntil, context.evaluationTime)
    ) {
      const source: EntitlementSource =
        sourceType === "tenant"
          ? "grant:tenant"
          : sourceType === "plan"
          ? "grant:plan"
          : sourceType === "partner"
          ? "grant:partner"
          : "grant:system";
      return {
        value: grant.value,
        source,
        expiresAt: grant.validUntil,
      };
    }
  }
  return null;
}

export function evaluateWithPrecedence(
  entitlementId: string,
  context: EntitlementContext,
  grants: readonly EntitlementGrant[],
  overrides: readonly EntitlementOverride[],
  defaultValue: boolean | number
): EvaluationMatch {
  let match: EvaluationMatch | null;

  match = findIndividualOverride(entitlementId, context, overrides);
  if (match) return match;

  match = findGroupOverride(entitlementId, context, overrides);
  if (match) return match;

  match = findGrantBySource(entitlementId, context, grants, "tenant");
  if (match) return match;

  match = findGrantBySource(entitlementId, context, grants, "plan");
  if (match) return match;

  match = findGrantBySource(entitlementId, context, grants, "partner");
  if (match) return match;

  match = findGrantBySource(entitlementId, context, grants, "system");
  if (match) return match;

  return {
    value: defaultValue,
    source: "default",
    expiresAt: undefined,
  };
}
