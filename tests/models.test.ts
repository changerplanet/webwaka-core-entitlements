import { describe, it, expect } from "vitest";
import {
  EntitlementDefinitionSchema,
  EntitlementGrantSchema,
  EntitlementOverrideSchema,
  EntitlementContextSchema,
  EntitlementResultSchema,
  EntitlementSnapshotSchema,
} from "../src/models";

describe("EntitlementDefinitionSchema", () => {
  it("validates a boolean entitlement definition", () => {
    const def = {
      id: "feature:analytics",
      name: "Analytics",
      type: "boolean" as const,
      defaultValue: false,
    };
    expect(() => EntitlementDefinitionSchema.parse(def)).not.toThrow();
  });

  it("validates a count entitlement definition", () => {
    const def = {
      id: "seats:max",
      name: "Max Seats",
      type: "count" as const,
      defaultValue: 5,
      maxValue: 100,
    };
    expect(() => EntitlementDefinitionSchema.parse(def)).not.toThrow();
  });

  it("validates a usage entitlement definition", () => {
    const def = {
      id: "ai:tokens",
      name: "AI Tokens",
      type: "usage" as const,
      defaultValue: 0,
      maxValue: 1000000,
    };
    expect(() => EntitlementDefinitionSchema.parse(def)).not.toThrow();
  });

  it("rejects invalid entitlement type", () => {
    const def = {
      id: "test",
      name: "Test",
      type: "invalid",
      defaultValue: false,
    };
    expect(() => EntitlementDefinitionSchema.parse(def)).toThrow();
  });

  it("rejects empty id", () => {
    const def = {
      id: "",
      name: "Test",
      type: "boolean",
      defaultValue: false,
    };
    expect(() => EntitlementDefinitionSchema.parse(def)).toThrow();
  });
});

describe("EntitlementGrantSchema", () => {
  it("validates a valid grant", () => {
    const grant = {
      id: "grant_1",
      entitlementId: "feature:analytics",
      subjectId: "user_123",
      tenantId: "tenant_abc",
      source: "plan" as const,
      value: true,
      validFrom: Date.now(),
      validUntil: Date.now() + 86400000,
    };
    expect(() => EntitlementGrantSchema.parse(grant)).not.toThrow();
  });

  it("validates a grant without expiry", () => {
    const grant = {
      id: "grant_2",
      entitlementId: "seats:max",
      subjectId: "user_123",
      tenantId: "tenant_abc",
      source: "partner" as const,
      value: 10,
      validFrom: Date.now(),
    };
    expect(() => EntitlementGrantSchema.parse(grant)).not.toThrow();
  });

  it("validates a grant with metadata", () => {
    const grant = {
      id: "grant_3",
      entitlementId: "feature:export",
      subjectId: "user_123",
      tenantId: "tenant_abc",
      source: "system" as const,
      value: true,
      validFrom: Date.now(),
      metadata: { reason: "promotion" },
    };
    expect(() => EntitlementGrantSchema.parse(grant)).not.toThrow();
  });

  it("rejects invalid source", () => {
    const grant = {
      id: "grant_1",
      entitlementId: "feature:test",
      subjectId: "user_123",
      tenantId: "tenant_abc",
      source: "unknown",
      value: true,
      validFrom: Date.now(),
    };
    expect(() => EntitlementGrantSchema.parse(grant)).toThrow();
  });
});

describe("EntitlementOverrideSchema", () => {
  it("validates an individual override", () => {
    const override = {
      id: "override_1",
      entitlementId: "feature:analytics",
      subjectId: "user_123",
      tenantId: "tenant_abc",
      type: "individual" as const,
      value: true,
      validFrom: Date.now(),
      reason: "VIP customer",
    };
    expect(() => EntitlementOverrideSchema.parse(override)).not.toThrow();
  });

  it("validates a group override", () => {
    const override = {
      id: "override_2",
      entitlementId: "seats:max",
      subjectId: "group_enterprise",
      tenantId: "tenant_abc",
      type: "group" as const,
      value: 50,
      validFrom: Date.now(),
    };
    expect(() => EntitlementOverrideSchema.parse(override)).not.toThrow();
  });
});

describe("EntitlementContextSchema", () => {
  it("validates a basic context", () => {
    const context = {
      subjectId: "user_123",
      tenantId: "tenant_abc",
      evaluationTime: Date.now(),
    };
    expect(() => EntitlementContextSchema.parse(context)).not.toThrow();
  });

  it("validates a context with group memberships", () => {
    const context = {
      subjectId: "user_123",
      tenantId: "tenant_abc",
      evaluationTime: Date.now(),
      groupIds: ["group_enterprise", "group_beta"],
    };
    expect(() => EntitlementContextSchema.parse(context)).not.toThrow();
  });
});

describe("EntitlementResultSchema", () => {
  it("validates a result", () => {
    const result = {
      entitlementId: "feature:analytics",
      granted: true,
      value: true,
      source: "grant:plan" as const,
      evaluatedAt: Date.now(),
    };
    expect(() => EntitlementResultSchema.parse(result)).not.toThrow();
  });
});

describe("EntitlementSnapshotSchema", () => {
  it("validates a snapshot", () => {
    const snapshot = {
      id: "snap_123",
      subjectId: "user_123",
      tenantId: "tenant_abc",
      generatedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
      entitlements: [
        {
          entitlementId: "feature:analytics",
          value: true,
          source: "grant:plan" as const,
        },
      ],
      checksum: "abc12345",
    };
    expect(() => EntitlementSnapshotSchema.parse(snapshot)).not.toThrow();
  });
});
