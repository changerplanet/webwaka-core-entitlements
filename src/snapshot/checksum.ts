import { createHash } from "crypto";
import type { EffectiveEntitlement } from "../models";

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

  return createHash("sha256").update(payload).digest("hex");
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
