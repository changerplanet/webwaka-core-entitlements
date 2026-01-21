"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntitlementsEngine = exports.CrossTenantAccessError = void 0;
const models_1 = require("../models");
const evaluators_1 = require("../evaluators");
const snapshot_1 = require("../snapshot");
const crypto_1 = require("crypto");
const DEFAULT_SNAPSHOT_TTL_MS = 3600000;
class CrossTenantAccessError extends Error {
    constructor(expectedTenantId, actualTenantId) {
        super(`Cross-tenant access denied: expected tenant '${expectedTenantId}', found '${actualTenantId}'`);
        this.name = "CrossTenantAccessError";
    }
}
exports.CrossTenantAccessError = CrossTenantAccessError;
function validateTenantIsolation(tenantId, grants, overrides) {
    for (const grant of grants) {
        if (grant.tenantId !== tenantId) {
            throw new CrossTenantAccessError(tenantId, grant.tenantId);
        }
    }
    for (const override of overrides) {
        if (override.tenantId !== tenantId) {
            throw new CrossTenantAccessError(tenantId, override.tenantId);
        }
    }
}
function simpleHash(str) {
    return (0, crypto_1.createHash)("sha256").update(str).digest("hex").substring(0, 16);
}
function generateSnapshotId(subjectId, tenantId, generatedAt, entitlements) {
    const payload = JSON.stringify({
        subjectId,
        tenantId,
        generatedAt,
        entitlements: entitlements.map((e) => e.entitlementId).sort(),
    });
    return `snap_${simpleHash(payload)}`;
}
class EntitlementsEngine {
    constructor(definitions, options) {
        this.definitions = new Map();
        for (const def of definitions) {
            this.definitions.set(def.id, def);
        }
        this.snapshotTtlMs = options?.snapshotTtlMs ?? DEFAULT_SNAPSHOT_TTL_MS;
    }
    evaluateEntitlement(entitlementId, context, grants, overrides) {
        models_1.EntitlementContextSchema.parse(context);
        grants.forEach((g) => models_1.EntitlementGrantSchema.parse(g));
        overrides.forEach((o) => models_1.EntitlementOverrideSchema.parse(o));
        validateTenantIsolation(context.tenantId, grants, overrides);
        const definition = this.definitions.get(entitlementId);
        if (!definition) {
            throw new Error(`Unknown entitlement: ${entitlementId}`);
        }
        const tenantGrants = grants;
        const tenantOverrides = overrides;
        const match = (0, evaluators_1.evaluateWithPrecedence)(entitlementId, context, tenantGrants, tenantOverrides, definition.defaultValue);
        const granted = typeof match.value === "boolean" ? match.value : match.value > 0;
        const result = {
            entitlementId,
            granted,
            value: match.value,
            source: match.source,
            expiresAt: match.expiresAt,
            evaluatedAt: context.evaluationTime,
        };
        return models_1.EntitlementResultSchema.parse(result);
    }
    generateSnapshot(context, grants, overrides) {
        models_1.EntitlementContextSchema.parse(context);
        grants.forEach((g) => models_1.EntitlementGrantSchema.parse(g));
        overrides.forEach((o) => models_1.EntitlementOverrideSchema.parse(o));
        validateTenantIsolation(context.tenantId, grants, overrides);
        const entitlements = [];
        for (const [entitlementId, definition] of this.definitions) {
            const tenantGrants = grants;
            const tenantOverrides = overrides;
            const match = (0, evaluators_1.evaluateWithPrecedence)(entitlementId, context, tenantGrants, tenantOverrides, definition.defaultValue);
            const granted = typeof match.value === "boolean" ? match.value : match.value > 0;
            if (granted) {
                entitlements.push({
                    entitlementId,
                    value: match.value,
                    source: match.source,
                    expiresAt: match.expiresAt,
                });
            }
        }
        const generatedAt = context.evaluationTime;
        const expiresAt = generatedAt + this.snapshotTtlMs;
        const checksum = (0, snapshot_1.generateChecksum)(context.subjectId, context.tenantId, generatedAt, expiresAt, entitlements);
        const snapshot = {
            id: generateSnapshotId(context.subjectId, context.tenantId, generatedAt, entitlements),
            subjectId: context.subjectId,
            tenantId: context.tenantId,
            generatedAt,
            expiresAt,
            entitlements,
            checksum,
        };
        return models_1.EntitlementSnapshotSchema.parse(snapshot);
    }
    verifySnapshot(snapshot) {
        try {
            models_1.EntitlementSnapshotSchema.parse(snapshot);
        }
        catch {
            return false;
        }
        return (0, snapshot_1.verifyChecksum)(snapshot.subjectId, snapshot.tenantId, snapshot.generatedAt, snapshot.expiresAt, snapshot.entitlements, snapshot.checksum);
    }
    evaluateFromSnapshot(entitlementId, snapshot, currentTime, expectedTenantId) {
        if (!this.verifySnapshot(snapshot)) {
            return null;
        }
        if (snapshot.tenantId !== expectedTenantId) {
            throw new CrossTenantAccessError(expectedTenantId, snapshot.tenantId);
        }
        if (currentTime >= snapshot.expiresAt) {
            return null;
        }
        const effective = snapshot.entitlements.find((e) => e.entitlementId === entitlementId);
        if (!effective) {
            const definition = this.definitions.get(entitlementId);
            if (!definition) {
                return null;
            }
            return {
                entitlementId,
                granted: false,
                value: definition.defaultValue,
                source: "default",
                expiresAt: snapshot.expiresAt,
                evaluatedAt: currentTime,
            };
        }
        return {
            entitlementId,
            granted: true,
            value: effective.value,
            source: effective.source,
            expiresAt: effective.expiresAt ?? snapshot.expiresAt,
            evaluatedAt: currentTime,
        };
    }
}
exports.EntitlementsEngine = EntitlementsEngine;
//# sourceMappingURL=EntitlementsEngine.js.map