import { z } from "zod";
export declare const EntitlementTypeSchema: z.ZodEnum<{
    boolean: "boolean";
    count: "count";
    usage: "usage";
}>;
export type EntitlementType = z.infer<typeof EntitlementTypeSchema>;
export declare const EntitlementDefinitionSchema: z.ZodReadonly<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<{
        boolean: "boolean";
        count: "count";
        usage: "usage";
    }>;
    defaultValue: z.ZodUnion<readonly [z.ZodBoolean, z.ZodNumber]>;
    maxValue: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>;
export type EntitlementDefinition = z.infer<typeof EntitlementDefinitionSchema>;
export declare const GrantSourceSchema: z.ZodEnum<{
    tenant: "tenant";
    plan: "plan";
    partner: "partner";
    system: "system";
    individual: "individual";
    group: "group";
}>;
export type GrantSource = z.infer<typeof GrantSourceSchema>;
export declare const EntitlementGrantSchema: z.ZodReadonly<z.ZodObject<{
    id: z.ZodString;
    entitlementId: z.ZodString;
    subjectId: z.ZodString;
    tenantId: z.ZodString;
    source: z.ZodEnum<{
        tenant: "tenant";
        plan: "plan";
        partner: "partner";
        system: "system";
        individual: "individual";
        group: "group";
    }>;
    value: z.ZodUnion<readonly [z.ZodBoolean, z.ZodNumber]>;
    validFrom: z.ZodNumber;
    validUntil: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.core.$strip>>;
export type EntitlementGrant = z.infer<typeof EntitlementGrantSchema>;
export declare const OverrideTypeSchema: z.ZodEnum<{
    individual: "individual";
    group: "group";
}>;
export type OverrideType = z.infer<typeof OverrideTypeSchema>;
export declare const EntitlementOverrideSchema: z.ZodReadonly<z.ZodObject<{
    id: z.ZodString;
    entitlementId: z.ZodString;
    subjectId: z.ZodString;
    tenantId: z.ZodString;
    type: z.ZodEnum<{
        individual: "individual";
        group: "group";
    }>;
    value: z.ZodUnion<readonly [z.ZodBoolean, z.ZodNumber]>;
    validFrom: z.ZodNumber;
    validUntil: z.ZodOptional<z.ZodNumber>;
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
export type EntitlementOverride = z.infer<typeof EntitlementOverrideSchema>;
export declare const EntitlementContextSchema: z.ZodReadonly<z.ZodObject<{
    subjectId: z.ZodString;
    tenantId: z.ZodString;
    evaluationTime: z.ZodNumber;
    groupIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>>;
export type EntitlementContext = z.infer<typeof EntitlementContextSchema>;
export declare const EntitlementSourceSchema: z.ZodEnum<{
    default: "default";
    "override:individual": "override:individual";
    "override:group": "override:group";
    "grant:tenant": "grant:tenant";
    "grant:plan": "grant:plan";
    "grant:partner": "grant:partner";
    "grant:system": "grant:system";
}>;
export type EntitlementSource = z.infer<typeof EntitlementSourceSchema>;
export declare const EntitlementResultSchema: z.ZodReadonly<z.ZodObject<{
    entitlementId: z.ZodString;
    granted: z.ZodBoolean;
    value: z.ZodUnion<readonly [z.ZodBoolean, z.ZodNumber]>;
    source: z.ZodEnum<{
        default: "default";
        "override:individual": "override:individual";
        "override:group": "override:group";
        "grant:tenant": "grant:tenant";
        "grant:plan": "grant:plan";
        "grant:partner": "grant:partner";
        "grant:system": "grant:system";
    }>;
    expiresAt: z.ZodOptional<z.ZodNumber>;
    evaluatedAt: z.ZodNumber;
}, z.core.$strip>>;
export type EntitlementResult = z.infer<typeof EntitlementResultSchema>;
export declare const EffectiveEntitlementSchema: z.ZodReadonly<z.ZodObject<{
    entitlementId: z.ZodString;
    value: z.ZodUnion<readonly [z.ZodBoolean, z.ZodNumber]>;
    source: z.ZodEnum<{
        default: "default";
        "override:individual": "override:individual";
        "override:group": "override:group";
        "grant:tenant": "grant:tenant";
        "grant:plan": "grant:plan";
        "grant:partner": "grant:partner";
        "grant:system": "grant:system";
    }>;
    expiresAt: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>;
export type EffectiveEntitlement = z.infer<typeof EffectiveEntitlementSchema>;
export declare const EntitlementSnapshotSchema: z.ZodReadonly<z.ZodObject<{
    id: z.ZodString;
    subjectId: z.ZodString;
    tenantId: z.ZodString;
    generatedAt: z.ZodNumber;
    expiresAt: z.ZodNumber;
    entitlements: z.ZodArray<z.ZodReadonly<z.ZodObject<{
        entitlementId: z.ZodString;
        value: z.ZodUnion<readonly [z.ZodBoolean, z.ZodNumber]>;
        source: z.ZodEnum<{
            default: "default";
            "override:individual": "override:individual";
            "override:group": "override:group";
            "grant:tenant": "grant:tenant";
            "grant:plan": "grant:plan";
            "grant:partner": "grant:partner";
            "grant:system": "grant:system";
        }>;
        expiresAt: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
    checksum: z.ZodString;
}, z.core.$strip>>;
export type EntitlementSnapshot = z.infer<typeof EntitlementSnapshotSchema>;
//# sourceMappingURL=types.d.ts.map