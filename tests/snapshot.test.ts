import { describe, it, expect } from "vitest";
import { EntitlementsEngine } from "../src/engine";
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

describe("EntitlementsEngine - Snapshots", () => {
  describe("generateSnapshot", () => {
    it("generates a valid snapshot", () => {
      const engine = new EntitlementsEngine(definitions);
      const now = Date.now();
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: now,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_1",
          entitlementId: "feature:analytics",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: true,
          validFrom: now - 1000,
        },
        {
          id: "grant_2",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: 25,
          validFrom: now - 1000,
        },
      ];

      const snapshot = engine.generateSnapshot(context, grants, []);

      expect(snapshot.subjectId).toBe("user_123");
      expect(snapshot.tenantId).toBe("tenant_abc");
      expect(snapshot.generatedAt).toBe(now);
      expect(snapshot.expiresAt).toBeGreaterThan(now);
      expect(snapshot.entitlements.length).toBe(2);
      expect(snapshot.checksum).toBeTruthy();
    });

    it("only includes granted entitlements (excludes false booleans)", () => {
      const testDefinitions: EntitlementDefinition[] = [
        {
          id: "feature:analytics",
          name: "Analytics",
          type: "boolean",
          defaultValue: false,
        },
        {
          id: "feature:export",
          name: "Export",
          type: "boolean",
          defaultValue: false,
        },
      ];
      const engine = new EntitlementsEngine(testDefinitions);
      const now = Date.now();
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: now,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_1",
          entitlementId: "feature:analytics",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: true,
          validFrom: now - 1000,
        },
      ];

      const snapshot = engine.generateSnapshot(context, grants, []);

      expect(snapshot.entitlements.length).toBe(1);
      expect(snapshot.entitlements[0].entitlementId).toBe("feature:analytics");
    });

    it("includes source attribution", () => {
      const engine = new EntitlementsEngine(definitions);
      const now = Date.now();
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: now,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_1",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "partner",
          value: 50,
          validFrom: now - 1000,
        },
      ];

      const snapshot = engine.generateSnapshot(context, grants, []);

      const seatsEntitlement = snapshot.entitlements.find(
        (e) => e.entitlementId === "seats:max"
      );
      expect(seatsEntitlement?.source).toBe("grant:partner");
    });
  });

  describe("verifySnapshot", () => {
    it("verifies a valid snapshot", () => {
      const engine = new EntitlementsEngine(definitions);
      const now = Date.now();
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: now,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_1",
          entitlementId: "feature:analytics",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: true,
          validFrom: now - 1000,
        },
      ];

      const snapshot = engine.generateSnapshot(context, grants, []);
      const isValid = engine.verifySnapshot(snapshot);

      expect(isValid).toBe(true);
    });

    it("rejects tampered snapshot", () => {
      const engine = new EntitlementsEngine(definitions);
      const now = Date.now();
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: now,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_1",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: 25,
          validFrom: now - 1000,
        },
      ];

      const snapshot = engine.generateSnapshot(context, grants, []);
      const tamperedSnapshot = {
        ...snapshot,
        entitlements: snapshot.entitlements.map((e) => ({
          ...e,
          value: 999,
        })),
      };
      const isValid = engine.verifySnapshot(tamperedSnapshot);

      expect(isValid).toBe(false);
    });

    it("rejects snapshot with modified checksum", () => {
      const engine = new EntitlementsEngine(definitions);
      const now = Date.now();
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: now,
      };

      const snapshot = engine.generateSnapshot(context, [], []);
      const tamperedSnapshot = {
        ...snapshot,
        checksum: "tampered_checksum",
      };
      const isValid = engine.verifySnapshot(tamperedSnapshot);

      expect(isValid).toBe(false);
    });
  });

  describe("evaluateFromSnapshot", () => {
    it("evaluates entitlement from snapshot matches live evaluation", () => {
      const engine = new EntitlementsEngine(definitions);
      const now = Date.now();
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: now,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_1",
          entitlementId: "feature:analytics",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: true,
          validFrom: now - 1000,
        },
        {
          id: "grant_2",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: 25,
          validFrom: now - 1000,
        },
      ];

      const liveResult = engine.evaluateEntitlement(
        "feature:analytics",
        context,
        grants,
        []
      );
      const snapshot = engine.generateSnapshot(context, grants, []);
      const snapshotResult = engine.evaluateFromSnapshot(
        "feature:analytics",
        snapshot,
        now + 1000
      );

      expect(snapshotResult).not.toBeNull();
      expect(snapshotResult!.granted).toBe(liveResult.granted);
      expect(snapshotResult!.value).toBe(liveResult.value);
      expect(snapshotResult!.source).toBe(liveResult.source);
    });

    it("returns null for expired snapshot", () => {
      const engine = new EntitlementsEngine(definitions, {
        snapshotTtlMs: 1000,
      });
      const now = Date.now();
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: now,
      };

      const snapshot = engine.generateSnapshot(context, [], []);
      const result = engine.evaluateFromSnapshot(
        "feature:analytics",
        snapshot,
        now + 5000
      );

      expect(result).toBeNull();
    });

    it("returns null for tampered snapshot", () => {
      const engine = new EntitlementsEngine(definitions);
      const now = Date.now();
      const context: EntitlementContext = {
        subjectId: "user_123",
        tenantId: "tenant_abc",
        evaluationTime: now,
      };
      const grants: EntitlementGrant[] = [
        {
          id: "grant_1",
          entitlementId: "seats:max",
          subjectId: "user_123",
          tenantId: "tenant_abc",
          source: "plan",
          value: 25,
          validFrom: now - 1000,
        },
      ];

      const snapshot = engine.generateSnapshot(context, grants, []);
      const tamperedSnapshot = {
        ...snapshot,
        checksum: "fake_checksum",
      };
      const result = engine.evaluateFromSnapshot(
        "seats:max",
        tamperedSnapshot,
        now + 1000
      );

      expect(result).toBeNull();
    });
  });

  describe("snapshot determinism", () => {
    it("snapshots are deterministic for fixed inputs", () => {
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
        },
      ];

      const snapshot1 = engine.generateSnapshot(context, grants, []);
      const snapshot2 = engine.generateSnapshot(context, grants, []);

      expect(snapshot1.checksum).toBe(snapshot2.checksum);
      expect(snapshot1.entitlements).toEqual(snapshot2.entitlements);
      expect(snapshot1.generatedAt).toBe(snapshot2.generatedAt);
      expect(snapshot1.expiresAt).toBe(snapshot2.expiresAt);
    });
  });
});
