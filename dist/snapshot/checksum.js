"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChecksum = generateChecksum;
exports.verifyChecksum = verifyChecksum;
const crypto_1 = require("crypto");
function generateChecksum(subjectId, tenantId, generatedAt, expiresAt, entitlements) {
    const sortedEntitlements = [...entitlements].sort((a, b) => a.entitlementId.localeCompare(b.entitlementId));
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
    return (0, crypto_1.createHash)("sha256").update(payload).digest("hex");
}
function verifyChecksum(subjectId, tenantId, generatedAt, expiresAt, entitlements, checksum) {
    const computed = generateChecksum(subjectId, tenantId, generatedAt, expiresAt, entitlements);
    return computed === checksum;
}
//# sourceMappingURL=checksum.js.map