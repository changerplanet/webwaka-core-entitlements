import type { EffectiveEntitlement } from "../models";

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hashNum = Math.abs(hash);
  return hashNum.toString(16).padStart(8, "0");
}

export function generateChecksum(
  subjectId: string,
  tenantId: string,
  generatedAt: number,
  expiresAt: number,
  entitlements: readonly EffectiveEntitlement[]
): string {
  const sortedEntitlements = [...entitlements].sort((a, b) =>
    a.entitlementId.localeCompare(b.entitlementId)
  );

  const payload = JSON.stringify({
    subjectId,
    tenantId,
    generatedAt,
    expiresAt,
    entitlements: sortedEntitlements.map((e) => ({
      entitlementId: e.entitlementId,
      value: e.value,
      source: e.source,
      expiresAt: e.expiresAt,
    })),
  });

  return simpleHash(payload);
}

export function verifyChecksum(
  subjectId: string,
  tenantId: string,
  generatedAt: number,
  expiresAt: number,
  entitlements: readonly EffectiveEntitlement[],
  checksum: string
): boolean {
  const computed = generateChecksum(
    subjectId,
    tenantId,
    generatedAt,
    expiresAt,
    entitlements
  );
  return computed === checksum;
}
