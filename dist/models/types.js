"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntitlementSnapshotSchema = exports.EffectiveEntitlementSchema = exports.EntitlementResultSchema = exports.EntitlementSourceSchema = exports.EntitlementContextSchema = exports.EntitlementOverrideSchema = exports.OverrideTypeSchema = exports.EntitlementGrantSchema = exports.GrantSourceSchema = exports.EntitlementDefinitionSchema = exports.EntitlementTypeSchema = void 0;
const zod_1 = require("zod");
exports.EntitlementTypeSchema = zod_1.z.enum(["boolean", "count", "usage"]);
exports.EntitlementDefinitionSchema = zod_1.z
    .object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    type: exports.EntitlementTypeSchema,
    defaultValue: zod_1.z.union([zod_1.z.boolean(), zod_1.z.number()]),
    maxValue: zod_1.z.number().optional(),
})
    .readonly();
exports.GrantSourceSchema = zod_1.z.enum([
    "tenant",
    "plan",
    "partner",
    "system",
    "individual",
    "group",
]);
exports.EntitlementGrantSchema = zod_1.z
    .object({
    id: zod_1.z.string().min(1),
    entitlementId: zod_1.z.string().min(1),
    subjectId: zod_1.z.string().min(1),
    tenantId: zod_1.z.string().min(1),
    source: exports.GrantSourceSchema,
    value: zod_1.z.union([zod_1.z.boolean(), zod_1.z.number()]),
    validFrom: zod_1.z.number(),
    validUntil: zod_1.z.number().optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
})
    .readonly();
exports.OverrideTypeSchema = zod_1.z.enum(["individual", "group"]);
exports.EntitlementOverrideSchema = zod_1.z
    .object({
    id: zod_1.z.string().min(1),
    entitlementId: zod_1.z.string().min(1),
    subjectId: zod_1.z.string().min(1),
    tenantId: zod_1.z.string().min(1),
    type: exports.OverrideTypeSchema,
    value: zod_1.z.union([zod_1.z.boolean(), zod_1.z.number()]),
    validFrom: zod_1.z.number(),
    validUntil: zod_1.z.number().optional(),
    reason: zod_1.z.string().optional(),
})
    .readonly();
exports.EntitlementContextSchema = zod_1.z
    .object({
    subjectId: zod_1.z.string().min(1),
    tenantId: zod_1.z.string().min(1),
    evaluationTime: zod_1.z.number(),
    groupIds: zod_1.z.array(zod_1.z.string()).optional(),
})
    .readonly();
exports.EntitlementSourceSchema = zod_1.z.enum([
    "override:individual",
    "override:group",
    "grant:tenant",
    "grant:plan",
    "grant:partner",
    "grant:system",
    "default",
]);
exports.EntitlementResultSchema = zod_1.z
    .object({
    entitlementId: zod_1.z.string().min(1),
    granted: zod_1.z.boolean(),
    value: zod_1.z.union([zod_1.z.boolean(), zod_1.z.number()]),
    source: exports.EntitlementSourceSchema,
    expiresAt: zod_1.z.number().optional(),
    evaluatedAt: zod_1.z.number(),
})
    .readonly();
exports.EffectiveEntitlementSchema = zod_1.z
    .object({
    entitlementId: zod_1.z.string().min(1),
    value: zod_1.z.union([zod_1.z.boolean(), zod_1.z.number()]),
    source: exports.EntitlementSourceSchema,
    expiresAt: zod_1.z.number().optional(),
})
    .readonly();
exports.EntitlementSnapshotSchema = zod_1.z
    .object({
    id: zod_1.z.string().min(1),
    subjectId: zod_1.z.string().min(1),
    tenantId: zod_1.z.string().min(1),
    generatedAt: zod_1.z.number(),
    expiresAt: zod_1.z.number(),
    entitlements: zod_1.z.array(exports.EffectiveEntitlementSchema),
    checksum: zod_1.z.string().min(1),
})
    .readonly();
//# sourceMappingURL=types.js.map