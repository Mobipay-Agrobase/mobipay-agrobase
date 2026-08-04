/**
 * Zod schemas for payment-related API routes.
 * 
 * These schemas enforce strict input validation on all financial endpoints
 * to prevent injection, mass-assignment, and unexpected-state bugs.
 * 
 * Usage:
 *   import { PaymentDisburseSchema } from '@/lib/security/schemas/payment-schemas'
 *   const data = await validateOrThrow(request, PaymentDisburseSchema)
 */

import { z } from 'zod'

// Payment disbursement — used by /api/payments/disburse
export const PaymentDisburseSchema = z.object({
  recipientPhone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number too long')
    .regex(/^\+?[0-9]+$/, 'Phone must contain only digits and optional + prefix'),
  recipientName: z.string()
    .min(2, 'Recipient name required')
    .max(100, 'Recipient name too long'),
  amount: z.number()
    .positive('Amount must be positive')
    .max(10_000_000, 'Amount exceeds maximum (UGX 10M per transaction)'),
  currency: z.string().length(3).default('UGX'),
  provider: z.enum(['MTN', 'AIRTEL', 'FLUTTERWAVE', 'BANK']),
  type: z.enum([
    'CASUAL', 'BULK_PURCHASE', 'BULK_DISBURSEMENT',
    'MARKETPLACE', 'VSLA', 'NSSF', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT'
  ]),
  description: z.string().max(500).optional(),
  reference: z.string().max(100).optional(),
  // Optional linkage to internal records
  refType: z.string().max(50).optional(),
  refId: z.string().max(100).optional(),
  // Idempotency key — prevents double-disbursement on retries
  idempotencyKey: z.string().max(100).optional(),
}).strict() // Reject unknown fields — prevents mass-assignment

// NSSF contribution — used by /api/nssf/contribute
export const NssfContributionSchema = z.object({
  registrationId: z.string().min(1, 'Registration ID required'),
  farmerId: z.string().min(1, 'Farmer ID required'),
  amount: z.number()
    .positive('Amount must be positive')
    .max(1_000_000, 'Amount exceeds maximum (UGX 1M per contribution)'),
  currency: z.string().length(3).default('UGX'),
  paymentMethod: z.enum(['MTN_MOMO', 'AIRTEL_MONEY', 'CARD', 'BANK_TRANSFER', 'CASH']),
  paymentReference: z.string().max(100).optional(),
  paymentProvider: z.enum(['FLUTTERWAVE', 'MTN_DIRECT', 'AIRTEL_DIRECT']).optional(),
  contributionDate: z.string().datetime().optional(),
}).strict()

// VSLA loan application
export const VslaLoanApplicationSchema = z.object({
  groupId: z.string().min(1),
  memberId: z.string().min(1),
  amount: z.number().positive().max(5_000_000, 'Max loan: UGX 5M'),
  purpose: z.string().min(5, 'Purpose must be at least 5 characters').max(500),
  termDays: z.number().int().min(7).max(365).optional(),
  productId: z.string().optional(),
  interestRateOverride: z.number().min(0).max(50).optional(),
}).strict()

// VSLA saving deposit
export const VslaSavingSchema = z.object({
  groupId: z.string().min(1),
  memberId: z.string().min(1),
  amount: z.number().positive().max(1_000_000, 'Max saving: UGX 1M'),
  paymentMethod: z.enum(['CASH', 'MOBILE_MONEY', 'BANK']).default('CASH'),
  mobileMoneyRef: z.string().max(100).optional(),
  meetingId: z.string().optional(),
  notes: z.string().max(500).optional(),
}).strict()

// User registration
export const UserRegistrationSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string()
    .min(10)
    .max(15)
    .regex(/^\+?[0-9]+$/, 'Invalid phone format'),
  email: z.string().email().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  tenantId: z.string().min(1),
  role: z.string().min(1),
}).strict()

// Auth login
export const LoginSchema = z.object({
  email: z.string().min(1, 'Email or phone required').max(100),
  password: z.string().min(1, 'Password required').max(128),
}).strict()

// Generic ID param validator (for [id] route params)
export const IdParamSchema = z.object({
  id: z.string().min(1).max(100),
})

// Pagination query validator
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  sort: z.string().max(50).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(100).optional(),
})

export type PaymentDisburseInput = z.infer<typeof PaymentDisburseSchema>
export type NssfContributionInput = z.infer<typeof NssfContributionSchema>
export type VslaLoanApplicationInput = z.infer<typeof VslaLoanApplicationSchema>
export type VslaSavingInput = z.infer<typeof VslaSavingSchema>
export type UserRegistrationInput = z.infer<typeof UserRegistrationSchema>
