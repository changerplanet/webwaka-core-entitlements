import { describe, it, expect } from "vitest";
import { EntitlementsEngine, CrossTenantAccessError } from "../src/engine";
import type {
  EntitlementDefinition,
  EntitlementGrant,
  EntitlementOverride,
  EntitlementContext,
} from "../src/models";

const definitions: EntitlementDefinition[] = [
  {
    id: "feature:analytics",
    name: "Analytics",
    type: "boolean",
    defaultValue: false,
  },
  {
    id: "seats:max",
    name: "Max Seats",
    type: "count",
    defaultValue: 5,
    maxValue: 100,
  },
  {
    id: "ai:tokens",
    name: "AI Tokens",
    type: "usage",
    defaultValue: 0,
    maxValue: 1000000,
  },
];

describe("EntitlementsEngine", () => {
  describe("evaluateEntitlement", () => {
    it("returns default value when no grants or overrides exist", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
      };

      const result = engine.evaluateEntitlement(
        "feature:analytics",
        context,
        [],
        []
      );

      expect(result.granted).toBe(false);
      expect(result.value).toBe(false);
      expect(result.source).toBe("default");
    });

    it("grants entitlement from plan grant", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_1",
          entitlementId: "feature:analytics",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: true,
          validFrom: fixedTime - 1000,
          validUntil: fixedTime + 86400000,
        },
      ];

      const result = engine.evaluateEntitlement(
        "feature:analytics",
        context,
        grants,
        []
      );

      expect(result.granted).toBe(true);
      expect(result.value).toBe(true);
      expect(result.source).toBe("grant:plan");
    });

    it("count entitlement returns numeric value", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_1",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: 25,
          validFrom: fixedTime - 1000,
        },
      ];

      const result = engine.evaluateEntitlement(
        "seats:max",
        context,
        grants,
        []
      );

      expect(result.granted).toBe(true);
      expect(result.value).toBe(25);
      expect(result.source).toBe("grant:plan");
    });

    it("usage entitlement evaluates correctly", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_1",
          entitlementId: "ai:tokens",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: 50000,
          validFrom: fixedTime - 1000,
        },
      ];

      const result = engine.evaluateEntitlement(
        "ai:tokens",
        context,
        grants,
        []
      );

      expect(result.granted).toBe(true);
      expect(result.value).toBe(50000);
    });

    it("throws for unknown entitlement", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
      };

      expect(() =>
        engine.evaluateEntitlement("unknown:entitlement", context, [], [])
      ).toThrow("Unknown entitlement: unknown:entitlement");
    });
  });

  describe("precedence order", () => {
    it("individual override beats plan grant", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_1",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: 10,
          validFrom: fixedTime - 1000,
        },
      ];
      const overrides: EntitlementOverride[] = [
        {
          id: "override_1",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          type: "individual",
          value: 100,
          validFrom: fixedTime - 1000,
          reason: "VIP upgrade",
        },
      ];

      const result = engine.evaluateEntitlement(
        "seats:max",
        context,
        grants,
        overrides
      );

      expect(result.value).toBe(100);
      expect(result.source).toBe("override:individual");
    });

    it("group override beats plan grant", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
        groupIds: ["group_enterprise"],
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_1",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: 10,
          validFrom: fixedTime - 1000,
        },
      ];
      const overrides: EntitlementOverride[] = [
        {
          id: "override_1",
          entitlementId: "seats:max",
          subjectId: "group_enterprise",
          tenantId: "tenant_abc",
          type: "group",
          value: 50,
          validFrom: fixedTime - 1000,
        },
      ];

      const result = engine.evaluateEntitlement(
        "seats:max",
        context,
        grants,
        overrides
      );

      expect(result.value).toBe(50);
      expect(result.source).toBe("override:group");
    });

    it("individual override beats group override", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
        groupIds: ["group_enterprise"],
      };
      const overrides: EntitlementOverride[] = [
        {
          id: "override_group",
          entitlementId: "seats:max",
          subjectId: "group_enterprise",
          tenantId: "tenant_abc",
          type: "group",
          value: 50,
          validFrom: fixedTime - 1000,
        },
        {
          id: "override_individual",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          type: "individual",
          value: 200,
          validFrom: fixedTime - 1000,
        },
      ];

      const result = engine.evaluateEntitlement(
        "seats:max",
        context,
        [],
        overrides
      );

      expect(result.value).toBe(200);
      expect(result.source).toBe("override:individual");
    });

    it("tenant grant beats plan grant", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_plan",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: 10,
          validFrom: fixedTime - 1000,
        },
        {
          id: "grant_tenant",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "tenant",
          value: 75,
          validFrom: fixedTime - 1000,
        },
      ];

      const result = engine.evaluateEntitlement(
        "seats:max",
        context,
        grants,
        []
      );

      expect(result.value).toBe(75);
      expect(result.source).toBe("grant:tenant");
    });

    it("plan grant beats partner grant", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_partner",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "partner",
          value: 30,
          validFrom: fixedTime - 1000,
        },
        {
          id: "grant_plan",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: 20,
          validFrom: fixedTime - 1000,
        },
      ];

      const result = engine.evaluateEntitlement(
        "seats:max",
        context,
        grants,
        []
      );

      expect(result.value).toBe(20);
      expect(result.source).toBe("grant:plan");
    });

    it("partner grant beats system grant", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_system",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "system",
          value: 5,
          validFrom: fixedTime - 1000,
        },
        {
          id: "grant_partner",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "partner",
          value: 15,
          validFrom: fixedTime - 1000,
        },
      ];

      const result = engine.evaluateEntitlement(
        "seats:max",
        context,
        grants,
        []
      );

      expect(result.value).toBe(15);
      expect(result.source).toBe("grant:partner");
    });
  });

  describe("time-bound validity", () => {
    it("ignores expired grant", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_expired",
          entitlementId: "feature:analytics",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: true,
          validFrom: fixedTime - 86400000,
          validUntil: fixedTime - 1000,
        },
      ];

      const result = engine.evaluateEntitlement(
        "feature:analytics",
        context,
        grants,
        []
      );

      expect(result.granted).toBe(false);
      expect(result.source).toBe("default");
    });

    it("ignores grant not yet valid", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_future",
          entitlementId: "feature:analytics",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: true,
          validFrom: fixedTime + 86400000,
        },
      ];

      const result = engine.evaluateEntitlement(
        "feature:analytics",
        context,
        grants,
        []
      );

      expect(result.granted).toBe(false);
      expect(result.source).toBe("default");
    });

    it("ignores expired override", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
      };
      const overrides: EntitlementOverride[] = [
        {
          id: "override_expired",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          type: "individual",
          value: 100,
          validFrom: fixedTime - 86400000,
          validUntil: fixedTime - 1000,
        },
      ];

      const result = engine.evaluateEntitlement(
        "seats:max",
        context,
        [],
        overrides
      );

      expect(result.value).toBe(5);
      expect(result.source).toBe("default");
    });
  });

  describe("tenant isolation", () => {
    it("throws CrossTenantAccessError for cross-tenant grant", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_other_tenant",
          entitlementId: "feature:analytics",
          subjectId: "user_123",
          tenantId: "tenant_xyz",
          source: "plan",
          value: true,
          validFrom: fixedTime - 1000,
        },
      ];

      expect(() =>
        engine.evaluateEntitlement("feature:analytics", context, grants, [])
      ).toThrow(CrossTenantAccessError);
    });

    it("throws CrossTenantAccessError for cross-tenant override", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
      };
      const overrides: EntitlementOverride[] = [
        {
          id: "override_other_tenant",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_xyz",
          type: "individual",
          value: 999,
          validFrom: fixedTime - 1000,
        },
      ];

      expect(() =>
        engine.evaluateEntitlement("seats:max", context, [], overrides)
      ).toThrow(CrossTenantAccessError);
    });

    it("throws CrossTenantAccessError on snapshot tenant mismatch", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
      };

      const snapshot = engine.generateSnapshot(context, [], []);

      expect(() =>
        engine.evaluateFromSnapshot("feature:analytics", snapshot, fixedTime + 1000, "tenant_xyz")
      ).toThrow(CrossTenantAccessError);
    });
  });

  describe("determinism", () => {
    it("same inputs produce same output 10 times", () => {
      const engine = new EntitlementsEngine(definitions);
      const fixedTime = 1700000000000;
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: fixedTime,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_1",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: 25,
          validFrom: fixedTime - 1000,
        },
      ];
      const overrides: EntitlementOverride[] = [
        {
          id: "override_1",
          entitlementId: "feature:analytics",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          type: "individual",
          value: true,
          validFrom: fixedTime - 1000,
        },
      ];

      const results: string[] = [];
      for (let i = 0; i < 10; i++) {
        const seatsResult = engine.evaluateEntitlement(
          "seats:max",
          context,
          grants,
          overrides
        );
        const analyticsResult = engine.evaluateEntitlement(
          "feature:analytics",
          context,
          grants,
          overrides
        );
        results.push(
          JSON.stringify({ seats: seatsResult, analytics: analyticsResult })
        );
      }

      const firstResult = results[0];
      for (let i = 1; i < 10; i++) {
        expect(results[i]).toBe(firstResult);
      }
    });
  });
});
