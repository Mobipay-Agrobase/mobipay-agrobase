'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2, Save, X } from 'lucide-react'

// ─── FormShell ────────────────────────────────────────────────────────
// Wraps a form with consistent padding, max-width, and fade-in animation.

export function FormShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('animate-form-fade-in max-w-5xl mx-auto', className)}>
      {children}
    </div>
  )
}

// ─── FormSection ──────────────────────────────────────────────────────
// Card-like section with a header (icon + title + description) and body.
// Used to group related fields within a form.

export function FormSection({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string
  description?: string
  icon?: React.ElementType
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('form-section-card', className)}>
      <div className='form-section-header'>
        <div className='flex items-center gap-2'>
          {Icon && <Icon className='w-4 h-4 text-primary' />}
          <div>
            <h3 className='text-sm font-semibold text-foreground'>{title}</h3>
            {description && <p className='text-xs text-muted-foreground mt-0.5'>{description}</p>}
          </div>
        </div>
      </div>
      <div className='form-section-body'>{children}</div>
    </div>
  )
}

// ─── FormGrid ─────────────────────────────────────────────────────────
// Responsive grid for form fields. 2 columns on desktop, 1 on mobile.
// Each cell has a consistent min-width so dropdowns don't get squished.

export function FormGrid({
  children,
  cols = 2,
  className,
}: {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
  className?: string
}) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }[cols]
  return (
    <div className={cn('grid gap-4', colClass, className)}>
      {children}
    </div>
  )
}

// ─── FormField ────────────────────────────────────────────────────────
// Label + input wrapper with:
// - Proper case label (auto-capitalized)
// - Required asterisk
// - Error message display
// - Full-span option for wider fields (textarea, multiselect)
// - Consistent height for all inputs (h-10)

export function FormField({
  label,
  required,
  error,
  fullSpan,
  children,
  hint,
}: {
  label: string
  required?: boolean
  error?: string | null
  fullSpan?: boolean
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className={cn('space-y-1', fullSpan && 'md:col-span-full')}>
      <Label className='form-label-base'>
        {label}
        {required && <span className='form-required'>*</span>}
      </Label>
      {children}
      {hint && !error && <p className='text-[11px] text-muted-foreground'>{hint}</p>}
      {error && (
        <p className='form-error-msg'>
          <AlertCircle className='w-3 h-3' />
          {error}
        </p>
      )}
    </div>
  )
}

// ─── FormActions ──────────────────────────────────────────────────────
// Footer with Cancel + Submit buttons. Submit shows loading spinner.

export function FormActions({
  onCancel,
  onSubmit,
  submitLabel = 'Save',
  submitting = false,
  submitIcon: SubmitIcon = Save,
}: {
  onCancel: () => void
  onSubmit?: () => void
  submitLabel?: string
  submitting?: boolean
  submitIcon?: React.ElementType
}) {
  return (
    <div className='flex items-center justify-end gap-3 pt-4 border-t border-border/40 mt-6'>
      <Button
        type='button'
        variant='outline'
        onClick={onCancel}
        className='gap-2 btn-hover-lift'
        disabled={submitting}
      >
        <X className='w-4 h-4' />
        Cancel
      </Button>
      <Button
        type={onSubmit ? 'button' : 'submit'}
        onClick={onSubmit}
        disabled={submitting}
        className='gap-2 btn-hover-lift min-w-[120px]'
      >
        {submitting ? (
          <>
            <Loader2 className='w-4 h-4 animate-spin' />
            Saving...
          </>
        ) : (
          <>
            <SubmitIcon className='w-4 h-4' />
            {submitLabel}
          </>
        )}
      </Button>
    </div>
  )
}

// ─── FormTabs ─────────────────────────────────────────────────────────
// Animated tab switcher for multi-tab forms. Each tab has an icon + label.
// Content area gets a slide-up animation on tab change.

export function FormTabs({
  tabs,
  activeTab,
  onTabChange,
  children,
}: {
  tabs: Array<{ value: string; label: string; icon?: React.ElementType }>
  activeTab: string
  onTabChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-1 p-1 rounded-xl bg-muted/50 border border-border/40'>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              type='button'
              onClick={() => onTabChange(tab.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              {Icon && <Icon className={cn('w-3.5 h-3.5', isActive && 'text-primary')} />}
              {tab.label}
            </button>
          )
        })}
      </div>
      <div key={activeTab} className='form-tab-content'>
        {children}
      </div>
    </div>
  )
}

// ─── FormInput ────────────────────────────────────────────────────────
// Standardized input with consistent height + focus ring.
// Replaces raw <Input> in forms for visual consistency.

export function FormInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
  className,
}: {
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <Input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={cn('form-input-base', className)}
    />
  )
}

// ─── Validation utilities ─────────────────────────────────────────────

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || !value.trim()) return `${fieldName} is required`
  return null
}

export function validatePhone(value: string): string | null {
  if (!value) return null // optional by default
  const cleaned = value.replace(/[\s\-()]/g, '')
  if (!/^\+\d{10,15}$/.test(cleaned)) {
    return 'Phone must be in international format (e.g. +256700000000)'
  }
  return null
}

export function validateEmail(value: string): string | null {
  if (!value) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Invalid email format'
  }
  return null
}

export function validateNumber(value: string, fieldName: string, min?: number): string | null {
  if (!value) return null
  const n = Number(value)
  if (isNaN(n)) return `${fieldName} must be a number`
  if (min !== undefined && n < min) return `${fieldName} must be at least ${min}`
  return null
}

// ─── EmptyState ───────────────────────────────────────────────────────

export function FormEmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className='flex flex-col items-center justify-center py-12 text-center animate-form-fade-in'>
      <div className='w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-3'>
        <Icon className='w-8 h-8 text-muted-foreground' />
      </div>
      <p className='text-sm font-medium text-foreground'>{title}</p>
      {description && <p className='text-xs text-muted-foreground mt-1 max-w-xs'>{description}</p>}
    </div>
  )
}

const FormDesignSystem = {
  FormShell,
  FormSection,
  FormGrid,
  FormField,
  FormActions,
  FormTabs,
  FormInput,
  FormEmptyState,
  validateRequired,
  validatePhone,
  validateEmail,
  validateNumber,
}

export default FormDesignSystem
