# WebWaka Core Entitlements

## Overview
A pure, deterministic TypeScript library for entitlement and access control. This is a Core Module (Phase 3C-3) in the WebWaka modular architecture, providing foundational entitlement evaluation infrastructure for Suite modules (POS, SVM, MVM, etc.).

## Project Structure
```
├── src/
│   ├── models/          # Zod-validated domain models
│   │   ├── types.ts     # All type definitions and schemas
│   │   └── index.ts     # Model exports
│   ├── engine/          # Core entitlements engine
│   │   ├── EntitlementsEngine.ts
│   │   └── index.ts
│   ├── evaluators/      # Precedence evaluation logic
│   │   ├── precedence.ts
│   │   └── index.ts
│   ├── snapshot/        # Snapshot generation and verification
│   │   ├── checksum.ts
│   │   └── index.ts
│   └── index.ts         # Main entry point
├── tests/               # Vitest test suites
├── dist/                # Compiled output (generated)
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── module.manifest.json
```

## Domain Models
- `EntitlementDefinition` - Defines an entitlement (boolean/count/usage)
- `EntitlementGrant` - Time-bound grant from plan/partner/system
- `EntitlementOverride` - Individual or group override
- `EntitlementContext` - Evaluation context (subject, tenant, time)
- `EntitlementSnapshot` - Cacheable, verifiable snapshot
- `EntitlementResult` - Evaluation result with source attribution

## Core Engine APIs
```typescript
// Evaluate single entitlement
evaluateEntitlement(entitlementId, context, grants, overrides): EntitlementResult

// Generate cacheable snapshot
generateSnapshot(context, grants, overrides): EntitlementSnapshot

// Verify snapshot integrity (SHA-256 checksum)
verifySnapshot(snapshot): boolean

// Evaluate from cached snapshot (requires expectedTenantId for tenant isolation)
evaluateFromSnapshot(entitlementId, snapshot, currentTime, expectedTenantId): EntitlementResult | null
```

## Precedence Order (Strict)
1. Individual overrides
2. Group-level overrides
3. Tenant grants
4. Plan-derived grants
5. Partner-level grants
6. System defaults
7. Definition defaults

## Capabilities
- `entitlement:check`
- `entitlement:snapshot.generate`
- `entitlement:snapshot.verify`
- `entitlement:grant.define`
- `entitlement:override.apply`

## Development Commands
```bash
npm run build          # Compile TypeScript
npm run dev            # Watch mode
npm test               # Run tests
npm run test:coverage  # Coverage report
npm run clean          # Remove dist/
```

## Constraints
- NO UI, NO database persistence, NO network calls
- Pure TypeScript library only
- Deterministic evaluation
- Tenant isolation enforced
