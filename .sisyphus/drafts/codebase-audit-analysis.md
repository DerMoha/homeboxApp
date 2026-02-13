# Draft: Codebase Audit Analysis Plan

## User's Request

Create a comprehensive analysis plan to investigate 8 categories of issues from a React Native/TypeScript codebase audit. Analysis only - no fixes.

## Codebase Overview (Confirmed)

- **Tech Stack**: React Native 0.79.1, React 19, TypeScript 5.0.4
- **Key Dependencies**: axios, AsyncStorage, react-navigation, react-native-image-picker
- **Structure**: 51 TypeScript files across src/ (screens, components, services, hooks, utils, types)
- **Test Setup**: Jest configured, but only 1 smoke test exists (`__tests__/App.test.tsx`)

## Initial Findings (Evidence Gathered)

### Category 1: Architecture Weaknesses

**Confirmed issues:**

- `serverService.ts` (576 lines): Singleton mixing auth, storage, API calls, transforms
  - Lines 253-292: Direct AsyncStorage access for server management
  - Lines 182-218: Auth logic embedded in service
  - Lines 419-426: Transform functions inside API service
- App.tsx line 27: `ServerService.getInstance().autoConnect()` in useEffect
- `useServerConfig.ts` line 40: Similar auto-connect pattern in hook

### Category 2: Storage Fragmentation

**Confirmed issues:**

- `storageService.ts` exists with central STORAGE_KEYS (lines 9-27)
- BUT `serverService.ts` uses hardcoded keys: 'servers', 'lastUsedServerId' (lines 255, 274, 286, 357, 369)
- `constants/storage.ts` only has 1 key - incomplete migration

### Category 3: Security/Privacy Risks

**Confirmed issues:**

- `serverService.ts` line 9: Plaintext password storage `password: string` in ServerConfig
- Lines 185-186: HTTP fallback `const protocol = config.host.startsWith('http') ? '' : 'http://';`
- Lines 479, 502, 507, 512: `console.log` with JSON.stringify of server responses
- Lines 553, 559-560: Logging of upload form data and responses

### Category 4: Type Safety Issues

**Confirmed issues:**

- Duplicate `InventoryItem`: `serverService.ts:18-38` vs `useInventoryData.ts:5-23`
- `any` casts: `serverService.ts:538`, `serverService.ts:561`, `storageService.ts:115`
- `logger.ts` uses `...args: any[]` throughout

### Category 5: Comment Hygiene

**Confirmed issues:**

- `logger.ts` lines 2-5: Docstring says "In production, only errors are logged" but line 17 shows errors also suppressed in production
- Need to investigate: UI narrating comments, theme context comments

### Category 6: Test Coverage Gaps

**Confirmed issues:**

- Only 1 test file: `__tests__/App.test.tsx` (14 lines, smoke test only)
- Missing tests for: auth flows, storage parsing, async state, theme persistence, add-item

### Category 7: Duplicate Code Hotspots

**Need to investigate:**

- Preference lookup patterns in inventory list/grid items
- Image quality preference reading
- Add item field mapping
- Settings header layouts

### Category 8: Performance Issues

**Need to investigate:**

- FlatList renderItem patterns
- Inline callbacks
- Missing dependency arrays

## Research Findings (Pending)

- Background agents still gathering:
  - Codebase structure exploration
  - Service layer patterns
  - Security/logging patterns
  - Type safety issues
  - Duplicate code patterns
  - Test coverage
  - Comment patterns
  - Performance patterns

## Open Questions

1. Priority ranking: Which categories are most critical to analyze first?
2. Report format: Markdown file with sections, or separate reports per category?
3. Evidence requirements: Screenshots/code snippets for each finding?
4. Severity levels: Should findings be rated (Critical/High/Medium/Low)?
5. Scope: Deep dive on specific files, or breadth across all 51 files?

## Scope Boundaries (TBD)

- INCLUDE: [pending user confirmation]
- EXCLUDE: [pending user confirmation]

## Test Strategy Decision

- **Infrastructure exists**: YES (Jest configured)
- **User wants tests**: N/A - this is analysis only, no implementation
- **QA approach**: Analysis report generation
