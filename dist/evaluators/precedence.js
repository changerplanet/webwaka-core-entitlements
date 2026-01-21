"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateWithPrecedence = evaluateWithPrecedence;
function isValid(validFrom, validUntil, evaluationTime) {
    if (evaluationTime < validFrom)
        return false;
    if (validUntil !== undefined && evaluationTime >= validUntil)
        return false;
    return true;
}
function findIndividualOverride(entitlementId, context, overrides) {
    for (const override of overrides) {
        if (override.entitlementId === entitlementId &&
            override.subjectId === context.subjectId &&
            override.tenantId === context.tenantId &&
            override.type === "individual" &&
            isValid(override.validFrom, override.validUntil, context.evaluationTime)) {
            return {
                value: override.value,
                source: "override:individual",
                expiresAt: override.validUntil,
            };
        }
    }
    return null;
}
function findGroupOverride(entitlementId, context, overrides) {
    if (!context.groupIds || context.groupIds.length === 0)
        return null;
    for (const override of overrides) {
        if (override.entitlementId === entitlementId &&
            override.tenantId === context.tenantId &&
            override.type === "group" &&
            context.groupIds.includes(override.subjectId) &&
            isValid(override.validFrom, override.validUntil, context.evaluationTime)) {
            return {
                value: override.value,
                source: "override:group",
                expiresAt: override.validUntil,
            };
        }
    }
    return null;
}
function findGrantBySource(entitlementId, context, grants, sourceType) {
    for (const grant of grants) {
        if (grant.entitlementId === entitlementId &&
            grant.subjectId === context.subjectId &&
            grant.tenantId === context.tenantId &&
            grant.source === sourceType &&
            isValid(grant.validFrom, grant.validUntil, context.evaluationTime)) {
            const source = sourceType === "tenant"
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
function evaluateWithPrecedence(entitlementId, context, grants, overrides, defaultValue) {
    let match;
    match = findIndividualOverride(entitlementId, context, overrides);
    if (match)
        return match;
    match = findGroupOverride(entitlementId, context, overrides);
    if (match)
        return match;
    match = findGrantBySource(entitlementId, context, grants, "tenant");
    if (match)
        return match;
    match = findGrantBySource(entitlementId, context, grants, "plan");
    if (match)
        return match;
    match = findGrantBySource(entitlementId, context, grants, "partner");
    if (match)
        return match;
    match = findGrantBySource(entitlementId, context, grants, "system");
    if (match)
        return match;
    return {
        value: defaultValue,
        source: "default",
        expiresAt: undefined,
    };
}
//# sourceMappingURL=precedence.js.map