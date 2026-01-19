import { z } from "zod";

export const EntitlementTypeSchema = z.enum(["boolean", "count", "usage"]);
export type EntitlementType = z.infer<typeof EntitlementTypeSchema>;

export const EntitlementDefinitionSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    type: EntitlementTypeSchema,
    defaultValue: z.union([z.boolean(), z.number()]),
    maxValue: z.number().optional(),
  })
  .readonly();

export type EntitlementDefinition = z.infer<typeof EntitlementDefinitionSchema>;

export const GrantSourceSchema = z.enum([
  "plan",
  "partner",
  "system",
  "individual",
  "group",
]);
export type GrantSource = z.infer<typeof GrantSourceSchema>;

export const EntitlementGrantSchema = z
  .object({
    id: z.string().min(1),
    entitlementId: z.string().min(1),
    subjectId: z.string().min(1),
    tenantId: z.string().min(1),
    source: GrantSourceSchema,
    value: z.union([z.boolean(), z.number()]),
    validFrom: z.number(),
    validUntil: z.number().optional(),
    metadata: z.record(z.string(), z.string()).optional(),
  })
  .readonly();

export type EntitlementGrant = z.infer<typeof EntitlementGrantSchema>;

export const OverrideTypeSchema = z.enum(["individual", "group"]);
export type OverrideType = z.infer<typeof OverrideTypeSchema>;

export const EntitlementOverrideSchema = z
  .object({
    id: z.string().min(1),
    entitlementId: z.string().min(1),
    subjectId: z.string().min(1),
    tenantId: z.string().min(1),
    type: OverrideTypeSchema,
    value: z.union([z.boolean(), z.number()]),
    validFrom: z.number(),
    validUntil: z.number().optional(),
    reason: z.string().optional(),
  })
  .readonly();

export type EntitlementOverride = z.infer<typeof EntitlementOverrideSchema>;

export const EntitlementContextSchema = z
  .object({
    subjectId: z.string().min(1),
    tenantId: z.string().min(1),
    evaluationTime: z.number(),
    groupIds: z.array(z.string()).optional(),
  })
  .readonly();

export type EntitlementContext = z.infer<typeof EntitlementContextSchema>;

export const EntitlementSourceSchema = z.enum([
  "override:individual",
  "override:group",
  "grant:plan",
  "grant:partner",
  "grant:system",
  "default",
]);
export type EntitlementSource = z.infer<typeof EntitlementSourceSchema>;

export const EntitlementResultSchema = z
  .object({
    entitlementId: z.string().min(1),
    granted: z.boolean(),
    value: z.union([z.boolean(), z.number()]),
    source: EntitlementSourceSchema,
    expiresAt: z.number().optional(),
    evaluatedAt: z.number(),
  })
  .readonly();

export type EntitlementResult = z.infer<typeof EntitlementResultSchema>;

export const EffectiveEntitlementSchema = z
  .object({
    entitlementId: z.string().min(1),
    value: z.union([z.boolean(), z.number()]),
    source: EntitlementSourceSchema,
    expiresAt: z.number().optional(),
  })
  .readonly();

export type EffectiveEntitlement = z.infer<typeof EffectiveEntitlementSchema>;

export const EntitlementSnapshotSchema = z
  .object({
    id: z.string().min(1),
    subjectId: z.string().min(1),
    tenantId: z.string().min(1),
    generatedAt: z.number(),
    expiresAt: z.number(),
    entitlements: z.array(EffectiveEntitlementSchema),
    checksum: z.string().min(1),
  })
  .readonly();

export type EntitlementSnapshot = z.infer<typeof EntitlementSnapshotSchema>;
