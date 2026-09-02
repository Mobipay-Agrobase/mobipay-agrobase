/**
 * Unit tests for the mobile farmer self-scope guard.
 * Run: npx jest src/lib/__tests__/mobile-selfscope.test.ts
 *
 * Regression lock: a farmer-role token must never be able to read or edit
 * ANOTHER farmer's profile/tabs/farmlands via the mobile [id] routes.
 * (Fixes the cross-farmer IDOR found during the module double-check.)
 */
import { isFarmerRole, isMobileStaff } from '../mobile/ekibbo-mobile-utils'

// farmerSelfAccess hits Prisma; mock the shared client so the unit test
// stays hermetic.
jest.mock('@/lib/db', () => ({
  db: {
    farmerProfile: {
      findFirst: jest.fn(async (args: { where: { id: string; userId?: string } }) =>
        // Simulate: farmer 'f_own' belongs to user 'u1'; nobody else.
        args.where.id === 'f_own' && args.where.userId === 'u1'
          ? { id: 'f_own' }
          : null,
      ),
    },
  },
}))

import { farmerSelfAccess } from '../mobile/ekibbo-mobile-utils'

describe('Mobile role gates', () => {
  it('recognizes exactly the staff roles that may use field-officer screens', () => {
    expect(isMobileStaff('EKB_MD')).toBe(true)
    expect(isMobileStaff('EKB_OPS_MANAGER')).toBe(true)
    expect(isMobileStaff('EKB_EXTENSION')).toBe(true)
    expect(isMobileStaff('EKB_FIN_ASSISTANT')).toBe(true)
    expect(isMobileStaff('TENANT_ADMIN')).toBe(true)
    // office roles + farmers are NOT mobile staff
    expect(isMobileStaff('EKB_MEC')).toBe(false)
    expect(isMobileStaff('EKB_FINANCE')).toBe(false)
    expect(isMobileStaff('EKB_FARMER')).toBe(false)
    expect(isMobileStaff(undefined)).toBe(false)
  })

  it('recognizes farmer self-service roles', () => {
    expect(isFarmerRole('EKB_FARMER')).toBe(true)
    expect(isFarmerRole('FARMER')).toBe(true)
    expect(isFarmerRole('VSLA_MEMBER')).toBe(true)
    expect(isFarmerRole('EKB_MD')).toBe(false)
    expect(isFarmerRole(undefined)).toBe(false)
  })
})

describe('farmerSelfAccess (IDOR guard)', () => {
  it('ALLOWS staff roles to access any farmer (tenant scope applies elsewhere)', async () => {
    expect(await farmerSelfAccess({ role: 'EKB_MD', userId: 'u9' }, 'f_other')).toBe(true)
    expect(await farmerSelfAccess({ role: 'EKB_EXTENSION', userId: 'u9' }, 'f_other')).toBe(true)
    expect(await farmerSelfAccess({ role: 'TENANT_ADMIN', userId: 'u9' }, 'f_own')).toBe(true)
  })

  it('ALLOWS a farmer to access their OWN profile', async () => {
    expect(await farmerSelfAccess({ role: 'EKB_FARMER', userId: 'u1' }, 'f_own')).toBe(true)
  })

  it('BLOCKS a farmer from another farmer profile (the IDOR regression)', async () => {
    expect(await farmerSelfAccess({ role: 'EKB_FARMER', userId: 'u1' }, 'f_other')).toBe(false)
    expect(await farmerSelfAccess({ role: 'FARMER', userId: 'u2' }, 'f_own')).toBe(false)
  })

  it('BLOCKS farmer roles with missing identity or target', async () => {
    expect(await farmerSelfAccess({ role: 'EKB_FARMER' }, 'f_own')).toBe(false)
    expect(await farmerSelfAccess({ role: 'EKB_FARMER', userId: 'u1' }, null)).toBe(false)
    expect(await farmerSelfAccess({ role: 'EKB_FARMER', userId: 'u1' }, undefined)).toBe(false)
  })
})
