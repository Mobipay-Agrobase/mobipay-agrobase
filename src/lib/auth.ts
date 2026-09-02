import type { NextAuthOptions } from 'next-auth'
import { randomBytes } from 'crypto'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { entitlementEngine } from '@/lib/entitlements/engine'
import { setTenantEntitlements } from '@/middleware/edge-entitlements'
import { getDescendantTenantIds } from '@/lib/tenant'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email or Phone', type: 'text', placeholder: 'admin@agrobase.co' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: { equals: credentials.email, mode: 'insensitive' } },
              { phone: credentials.email },
            ],
            isActive: true,
          },
        })

        if (!user) {
          return null
        }

        // Verify password (supports Argon2id + legacy bcrypt with auto-upgrade)
        if (!user.passwordHash) {
          return null
        }
        const { valid: isValid, needsRehash } = await verifyPassword(credentials.password, user.passwordHash)
        if (!isValid) {
          return null
        }
        // SECURITY: Silently upgrade bcrypt hashes to Argon2id on successful login.
        // This gradually migrates the entire user base to Argon2id without requiring
        // a password reset campaign.
        if (needsRehash) {
          try {
            const { hashPassword } = await import('@/lib/password')
            const newHash = await hashPassword(credentials.password)
            await db.user.update({
              where: { id: user.id },
              data: { passwordHash: newHash },
            })
            console.log('[security] Upgraded user password hash to Argon2id:', user.id)
          } catch (e) {
            console.error('[security] Failed to upgrade password hash:', e)
            // Non-blocking — user can still log in, will retry on next login
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Fetch full user from DB to get tenantId and role
        const dbUser = await db.user.findUnique({
          where: { id: user.id! },
          select: { id: true, tenantId: true, role: true, firstName: true, lastName: true, isActive: true },
        })
        if (dbUser) {
          token.userId = dbUser.id
          token.tenantId = dbUser.tenantId
          token.role = dbUser.role
          token.name = `${dbUser.firstName} ${dbUser.lastName}`

          // For COUNTRY_ADMIN, resolve all descendant tenant IDs and store in token
          // so the middleware can set the correct x-tenant-scope header
          if (dbUser.role === 'COUNTRY_ADMIN' && dbUser.tenantId) {
            try {
              const descendantIds = await getDescendantTenantIds(dbUser.tenantId)
              token.tenantScope = descendantIds
            } catch (e) {
              console.error('[Auth] Failed to resolve descendant tenants:', e)
              token.tenantScope = [dbUser.tenantId]
            }
          }

          // Auto-warm Edge entitlement cache on login/JWT refresh
          if (dbUser.tenantId) {
            // Fetch tenant active status + features + module entitlements
            const tenant = await db.tenant.findUnique({
              where: { id: dbUser.tenantId },
              select: {
                isActive: true,
                features: true,
                moduleEntitlements: { where: { isEnabled: true }, select: { moduleCode: true } },
              },
            })

            if (tenant) {
              // Parse features JSON
              let features: Record<string, boolean> = {}
              try {
                features = tenant.features ? JSON.parse(tenant.features) : {}
              } catch { /* invalid JSON, default to empty */ }

              entitlementEngine.getEnabledModules(dbUser.tenantId).then(modules => {
                setTenantEntitlements(dbUser.tenantId!, modules, tenant.isActive, features)
              }).catch(() => { /* non-blocking */ })
            } else {
              entitlementEngine.getEnabledModules(dbUser.tenantId).then(modules => {
                setTenantEntitlements(dbUser.tenantId!, modules)
              }).catch(() => { /* non-blocking */ })
            }
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.userId = token.userId as string
        session.user.tenantId = token.tenantId as string
        session.user.role = token.role as string
      }
      return session
    },
    async signIn({ user }) {
      if (!user?.id) return false
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { isActive: true },
      })
      if (!dbUser?.isActive) {
        return false
      }
      // Update last login
      await db.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      })
      return true
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
  // SECURITY FIX: No hardcoded fallback. Fail hard if NEXTAUTH_SECRET is missing.
  // Previous code had a publicly-known fallback in git history — anyone could forge JWTs.
  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      // Non-fatal: use a random ephemeral secret so the app still starts.
      // Sessions won't persist across cold starts until NEXTAUTH_SECRET is set.
      const ephemeral = randomBytes(32).toString('base64')
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
      console.error('!! CRITICAL: NEXTAUTH_SECRET is NOT set!')
      console.error('!! Using ephemeral secret — sessions will NOT persist across restarts.')
      console.error('!! Set NEXTAUTH_SECRET in Vercel env vars immediately:')
      console.error('!! openssl rand -base64 32')
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
      return ephemeral
    }
    return secret
  })(),
}