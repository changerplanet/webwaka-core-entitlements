import type { EffectiveEntitlement } from "../models";
export declare function generateChecksum(subjectId: string, tenantId: string, generatedAt: number, expiresAt: number, entitlements: readonly EffectiveEntitlement[]): string;
export declare function verifyChecksum(subjectId: string, tenantId: string, generatedAt: number, expiresAt: number, entitlements: readonly EffectiveEntitlement[], checksum: string): boolean;
//# sourceMappingURL=checksum.d.ts.map