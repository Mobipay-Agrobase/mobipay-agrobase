/**
 * Unit tests for buildTenantFilter tenant isolation.
 * Run: npx jest src/lib/__tests__/tenant-filter.test.ts
 *
 * Regression lock: a non-super-admin with an EMPTY tenant scope must get a
 * never-matching filter (fail closed). Previously the filter returned {}
 * (unfiltered) which leaked cross-tenant data.
 */
import { buildTenantFilter, type TenantContext } from '../tenant'

// tenant.ts imports the Prisma client at module load; mock it so this unit
// test stays hermetic (buildTenantFilter itself never touches the DB).
jest.mock('@/lib/db', () => ({ db: {} }))

function makeCtx(overrides: Partial<TenantContext>): TenantContext {
  return {
    userId: 'user_1',
    role: 'EKB_EXTENSION',
    tenantId: 'tenant_9',
    tenantScope: ['tenant_9'],
    isSuperAdmin: false,
    isSimulating: false,
    ...overrides,
  }
}

describe('buildTenantFilter (tenant isolation)', () => {
  it('returns NO filter for a SUPER_ADMIN (platform-wide view)', () => {
    const ctx = makeCtx({ role: 'SUPER_ADMIN', isSuperAdmin: true, tenantScope: [] })
    expect(buildTenantFilter(ctx)).toEqual({})
  })

  it('scopes a regular user to their own tenant', () => {
    const ctx = makeCtx({})
    expect(buildTenantFilter(ctx)).toEqual({ tenantId: { in: ['tenant_9'] } })
  })

  it('scopes a COUNTRY_ADMIN to their descendant set', () => {
    const ctx = makeCtx({
      role: 'COUNTRY_ADMIN',
      tenantScope: ['tenant_1', 'tenant_2', 'tenant_3'],
    })
    expect(buildTenantFilter(ctx)).toEqual({
      tenantId: { in: ['tenant_1', 'tenant_2', 'tenant_3'] },
    })
  })

  it('FAILS CLOSED: empty scope for a non-super-admin matches NOTHING (was: everything)', () => {
    const ctx = makeCtx({ tenantScope: [] })
    const filter = buildTenantFilter(ctx)

    // The critical assertion: must NOT be an unfiltered {}.
    expect(filter).not.toEqual({})
    // Must be a never-matching `in: []` filter on the tenant field.
    expect(filter).toEqual({ tenantId: { in: [] } })
  })

  it('applies the fail-closed rule to custom field names too', () => {
    const ctx = makeCtx({ tenantScope: [] })
    expect(buildTenantFilter(ctx, 'farmer.tenantId')).toEqual({
      'farmer.tenantId': { in: [] },
    })
  })

  it('keeps the super-admin behavior while SIMULATING a tenant (narrowed scope)', () => {
    const ctx = makeCtx({
      role: 'SUPER_ADMIN',
      isSuperAdmin: false,
      isSimulating: true,
      simulatedTenantId: 'tenant_sim',
      tenantScope: ['tenant_sim'],
    })
    expect(buildTenantFilter(ctx)).toEqual({ tenantId: { in: ['tenant_sim'] } })
  })
})
