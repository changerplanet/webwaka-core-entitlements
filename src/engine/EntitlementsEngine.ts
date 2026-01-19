import {
  EntitlementContextSchema,
  EntitlementGrantSchema,
  EntitlementOverrideSchema,
  EntitlementResultSchema,
  EntitlementSnapshotSchema,
  type EntitlementContext,
  type EntitlementDefinition,
  type EntitlementGrant,
  type EntitlementOverride,
  type EntitlementResult,
  type EntitlementSnapshot,
  type EffectiveEntitlement,
} from "../models";
import { evaluateWithPrecedence } from "../evaluators";
import { generateChecksum, verifyChecksum } from "../snapshot";

const DEFAULT_SNAPSHOT_TTL_MS = 3600000;

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

function generateSnapshotId(
  subjectId: string,
  tenantId: string,
  generatedAt: number,
  entitlements: readonly EffectiveEntitlement[]
): string {
  const payload = JSON.stringify({
    subjectId,
    tenantId,
    generatedAt,
    entitlements: entitlements.map((e) => e.entitlementId).sort(),
  });
  return `snap_${simpleHash(payload)}`;
}

export class EntitlementsEngine {
  private readonly definitions: Map<string, EntitlementDefinition>;
  private readonly snapshotTtlMs: number;

  constructor(
    definitions: readonly EntitlementDefinition[],
    options?: { snapshotTtlMs?: number }
  ) {
    this.definitions = new Map();
    for (const def of definitions) {
      this.definitions.set(def.id, def);
    }
    this.snapshotTtlMs = options?.snapshotTtlMs ?? DEFAULT_SNAPSHOT_TTL_MS;
  }

  evaluateEntitlement(
    entitlementId: string,
    context: EntitlementContext,
    grants: readonly EntitlementGrant[],
    overrides: readonly EntitlementOverride[]
  ): EntitlementResult {
    EntitlementContextSchema.parse(context);
    grants.forEach((g) => EntitlementGrantSchema.parse(g));
    overrides.forEach((o) => EntitlementOverrideSchema.parse(o));

    const definition = this.definitions.get(entitlementId);
    if (!definition) {
      throw new Error(`Unknown entitlement: ${entitlementId}`);
    }

    const tenantGrants = grants.filter((g) => g.tenantId === context.tenantId);
    const tenantOverrides = overrides.filter((o) => o.tenantId === context.tenantId);

    const match = evaluateWithPrecedence(
      entitlementId,
      context,
      tenantGrants,
      tenantOverrides,
      definition.defaultValue
    );

    const granted =
      typeof match.value === "boolean" ? match.value : match.value > 0;

    const result: EntitlementResult = {
      entitlementId,
      granted,
      value: match.value,
      source: match.source,
      expiresAt: match.expiresAt,
      evaluatedAt: context.evaluationTime,
    };

    return EntitlementResultSchema.parse(result);
  }

  generateSnapshot(
    context: EntitlementContext,
    grants: readonly EntitlementGrant[],
    overrides: readonly EntitlementOverride[]
  ): EntitlementSnapshot {
    EntitlementContextSchema.parse(context);
    grants.forEach((g) => EntitlementGrantSchema.parse(g));
    overrides.forEach((o) => EntitlementOverrideSchema.parse(o));

    const entitlements: EffectiveEntitlement[] = [];

    for (const [entitlementId, definition] of this.definitions) {
      const tenantGrants = grants.filter((g) => g.tenantId === context.tenantId);
      const tenantOverrides = overrides.filter((o) => o.tenantId === context.tenantId);

      const match = evaluateWithPrecedence(
        entitlementId,
        context,
        tenantGrants,
        tenantOverrides,
        definition.defaultValue
      );

      const granted =
        typeof match.value === "boolean" ? match.value : match.value > 0;

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

    const checksum = generateChecksum(
      context.subjectId,
      context.tenantId,
      generatedAt,
      expiresAt,
      entitlements
    );

    const snapshot: EntitlementSnapshot = {
      id: generateSnapshotId(context.subjectId, context.tenantId, generatedAt, entitlements),
      subjectId: context.subjectId,
      tenantId: context.tenantId,
      generatedAt,
      expiresAt,
      entitlements,
      checksum,
    };

    return EntitlementSnapshotSchema.parse(snapshot);
  }

  verifySnapshot(snapshot: EntitlementSnapshot): boolean {
    try {
      EntitlementSnapshotSchema.parse(snapshot);
    } catch {
      return false;
    }

    return verifyChecksum(
      snapshot.subjectId,
      snapshot.tenantId,
      snapshot.generatedAt,
      snapshot.expiresAt,
      snapshot.entitlements,
      snapshot.checksum
    );
  }

  evaluateFromSnapshot(
    entitlementId: string,
    snapshot: EntitlementSnapshot,
    currentTime: number
  ): EntitlementResult | null {
    if (!this.verifySnapshot(snapshot)) {
      return null;
    }

    if (currentTime >= snapshot.expiresAt) {
      return null;
    }

    const effective = snapshot.entitlements.find(
      (e) => e.entitlementId === entitlementId
    );

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
