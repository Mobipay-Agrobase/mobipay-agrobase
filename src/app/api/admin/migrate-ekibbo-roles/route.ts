import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'

/**
 * POST /api/admin/migrate-ekibbo-roles
 *
 * One-shot, idempotent migration: remaps the 7 existing EKIBBO staff users
 * from their current generic roles (TENANT_ADMIN / AGENT / CBT /
 * EXTENSION_OFFICER) to the dedicated EKB_* roles.
 *
 * SUPER_ADMIN only — returns 403 for any other role.
 *
 * Idempotent: re-running on already-migrated users reports "already_migrated"
 * and makes no DB writes.
 */

interface Migration {
  email: string
  expectedOldRole: string
  newRole: string
  label: string
}

const MIGRATIONS: Migration[] = [
  { email: 'eric@ekibbo.co',      expectedOldRole: 'TENANT_ADMIN',      newRole: 'EKB_MD',             label: 'Managing Director' },
  { email: 'ops@ekibbo.co',       expectedOldRole: 'TENANT_ADMIN',      newRole: 'EKB_OPS_MANAGER',    label: 'Operations Manager' },
  { email: 'finance@ekibbo.co',   expectedOldRole: 'TENANT_ADMIN',      newRole: 'EKB_FINANCE',        label: 'Finance Officer' },
  { email: 'assistant@ekibbo.co', expectedOldRole: 'AGENT',             newRole: 'EKB_FIN_ASSISTANT',  label: 'Finance & Ops Assistant' },
  { email: 'mec@ekibbo.co',       expectedOldRole: 'CBT',               newRole: 'EKB_MEC',            label: 'M, E & C Officer' },
  { email: 'eo1@ekibbo.co',       expectedOldRole: 'EXTENSION_OFFICER', newRole: 'EKB_EXTENSION',      label: 'Extension Officer 1' },
  { email: 'eo2@ekibbo.co',       expectedOldRole: 'EXTENSION_OFFICER', newRole: 'EKB_EXTENSION',      label: 'Extension Officer 2' },
]

export async function POST() {
  try {
    const ctx = await getTenantContext()
    if (!ctx.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Super Admin access required. Log in as admin@agrobase.co to run this migration.' },
        { status: 403 }
      )
    }

    const tenant = await db.tenant.findFirst({
      where: { name: { contains: 'EKIBBO' } },
      select: { id: true, name: true },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'EKIBBO tenant not found.' },
        { status: 404 }
      )
    }

    const migrated: Array<{ email: string; oldRole: string; newRole: string; label: string }> = []
    const alreadyMigrated: Array<{ email: string; newRole: string; label: string }> = []
    const notFound: Array<{ email: string; label: string }> = []

    for (const m of MIGRATIONS) {
      const user = await db.user.findFirst({
        where: { email: m.email },
        select: { id: true, role: true, tenantId: true },
      })

      if (!user) {
        notFound.push({ email: m.email, label: m.label })
        continue
      }

      if (user.role === m.newRole) {
        alreadyMigrated.push({ email: m.email, newRole: m.newRole, label: m.label })
        continue
      }

      await db.user.update({
        where: { id: user.id },
        data: { role: m.newRole },
      })

      migrated.push({
        email: m.email,
        oldRole: user.role || '(none)',
        newRole: m.newRole,
        label: m.label,
      })
    }

    return NextResponse.json({
      ok: true,
      tenant: { id: tenant.id, name: tenant.name },
      migrated,
      alreadyMigrated,
      notFound,
      summary: {
        migrated: migrated.length,
        alreadyMigrated: alreadyMigrated.length,
        notFound: notFound.length,
        total: MIGRATIONS.length,
      },
      nextStep: 'Ask each migrated user to log out and back in so NextAuth reissues their JWT with the new role.',
    })
  } catch (error: any) {
    console.error('[migrate-ekibbo-roles] error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/migrate-ekibbo-roles
 * Returns a dry-run preview — what WOULD be migrated. No DB writes.
 */
export async function GET() {
  try {
    const ctx = await getTenantContext()
    if (!ctx.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Super Admin access required.' },
        { status: 403 }
      )
    }

    const preview: Array<{
      email: string
      currentRole: string | null
      newRole: string
      label: string
      status: 'would_migrate' | 'already_migrated' | 'not_found'
    }> = []

    for (const m of MIGRATIONS) {
      const user = await db.user.findFirst({
        where: { email: m.email },
        select: { role: true },
      })

      if (!user) {
        preview.push({ email: m.email, currentRole: null, newRole: m.newRole, label: m.label, status: 'not_found' })
      } else if (user.role === m.newRole) {
        preview.push({ email: m.email, currentRole: user.role, newRole: m.newRole, label: m.label, status: 'already_migrated' })
      } else {
        preview.push({ email: m.email, currentRole: user.role, newRole: m.newRole, label: m.label, status: 'would_migrate' })
      }
    }

    return NextResponse.json({
      ok: true,
      preview,
      summary: {
        wouldMigrate: preview.filter(p => p.status === 'would_migrate').length,
        alreadyMigrated: preview.filter(p => p.status === 'already_migrated').length,
        notFound: preview.filter(p => p.status === 'not_found').length,
        total: MIGRATIONS.length,
      },
    })
  } catch (error: any) {
    console.error('[migrate-ekibbo-roles preview] error:', error)
    return NextResponse.json(
      { error: 'Preview failed', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}
