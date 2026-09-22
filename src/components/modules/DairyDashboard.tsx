'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Milk, PawPrint as CowIcon, Home, Users, Truck, Package, CalendarClock,
  ListChecks, Syringe, Droplet, HeartPulse, GitMerge, Scale, FlaskConical,
  Trash2, CloudSun, BadgeCheck, ClipboardList, BookOpen, Beef,
  Plus, Search, Loader2, ChevronLeft, ChevronRight, Pencil, X, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

/* -------------------------------------------------------------------------- */
/*                              Module configuration                          */
/* -------------------------------------------------------------------------- */

type FieldType = 'text' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea' | 'time'

interface FieldConfig {
  name: string
  label: string
  type: FieldType
  required?: boolean
  options?: string[]
  placeholder?: string
}

interface ColumnConfig {
  key: string
  label: string
  /** Render function — receives the row + a fallback accessor */
  render?: (row: Record<string, any>) => React.ReactNode
}

interface ModuleConfig {
  key: string
  label: string
  icon: React.ElementType
  description: string
  /** API base path — always relative */
  api: string
  fields: FieldConfig[]
  columns: ColumnConfig[]
}

const YES_NO = ['true', 'false']

const MODULES: ModuleConfig[] = [
  {
    key: 'cows',
    label: 'Cow Master',
    icon: CowIcon,
    description: 'Master records for every animal in the herd',
    api: '/api/dairy/cows',
    fields: [
      { name: 'cowCode', label: 'Cow Code', type: 'text', placeholder: 'UG-KIK-000123' },
      { name: 'tagNumber', label: 'Ear Tag Number', type: 'text' },
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'breed', label: 'Breed', type: 'text', placeholder: 'Holstein / Jersey / Ankole' },
      { name: 'type', label: 'Type', type: 'select', options: ['Cow', 'Bull', 'Calf'] },
      { name: 'gender', label: 'Gender', type: 'select', options: ['Female', 'Male'] },
      { name: 'lifecycleState', label: 'Lifecycle State', type: 'select', options: ['Calf', 'Weaned', 'Heifer', 'In-Calf', 'Lactating', 'Dry', 'Culled', 'Sold', 'Dead'] },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
      { name: 'shedId', label: 'Shed ID', type: 'text', placeholder: 'Optional — assign later' },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { name: 'purchasePrice', label: 'Purchase Price', type: 'number' },
      { name: 'isActive', label: 'Active', type: 'select', options: YES_NO },
    ],
    columns: [
      { key: 'cowCode', label: 'Code', render: r => r.cowCode || '—' },
      { key: 'name', label: 'Name', render: r => r.name || '—' },
      { key: 'tagNumber', label: 'Tag #', render: r => r.tagNumber || '—' },
      { key: 'breed', label: 'Breed', render: r => r.breed || '—' },
      { key: 'type', label: 'Type', render: r => <Badge variant="outline">{r.type || 'Cow'}</Badge> },
      { key: 'lifecycleState', label: 'Stage', render: r => <Badge variant="secondary">{r.lifecycleState || 'Calf'}</Badge> },
      { key: 'shed', label: 'Shed', render: r => r.shed?.shadeNumber || '—' },
      { key: 'isActive', label: 'Status', render: r => <Badge variant={r.isActive ? 'default' : 'outline'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    ],
  },
  {
    key: 'sheds',
    label: 'Sheds',
    icon: Home,
    description: 'Cow sheds / kraals / housing',
    api: '/api/dairy/sheds',
    fields: [
      { name: 'shadeNumber', label: 'Shed Number', type: 'text', required: true },
      { name: 'dimensionsSqm', label: 'Dimensions (m²)', type: 'number' },
      { name: 'ventilationType', label: 'Ventilation', type: 'select', options: ['Natural', 'Mechanical'] },
      { name: 'beddingType', label: 'Bedding', type: 'select', options: ['Straw', 'Sand', 'Rubber Mat'] },
      { name: 'capacity', label: 'Capacity (cows)', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
      { name: 'isActive', label: 'Active', type: 'select', options: YES_NO },
    ],
    columns: [
      { key: 'shadeNumber', label: 'Shed #', render: r => r.shadeNumber },
      { key: 'dimensionsSqm', label: 'Size (m²)', render: r => r.dimensionsSqm ?? '—' },
      { key: 'ventilationType', label: 'Ventilation', render: r => r.ventilationType || '—' },
      { key: 'beddingType', label: 'Bedding', render: r => r.beddingType || '—' },
      { key: 'capacity', label: 'Capacity', render: r => r.capacity ?? '—' },
      { key: '_count.cows', label: 'Cows', render: r => r._count?.cows ?? 0 },
      { key: 'isActive', label: 'Status', render: r => <Badge variant={r.isActive ? 'default' : 'outline'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    ],
  },
  {
    key: 'staff',
    label: 'Staff',
    icon: Users,
    description: 'Milkers, feeders, vets and managers',
    api: '/api/dairy/staff',
    fields: [
      { name: 'staffCode', label: 'Staff Code', type: 'text' },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'select', options: ['Milker', 'Feeder', 'Veterinarian', 'Manager', 'Cleaner'] },
      { name: 'contactNumber', label: 'Phone', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'employmentDate', label: 'Employment Date', type: 'date' },
      { name: 'salary', label: 'Salary', type: 'number' },
      { name: 'schedule', label: 'Schedule', type: 'textarea' },
      { name: 'isActive', label: 'Active', type: 'select', options: YES_NO },
    ],
    columns: [
      { key: 'staffCode', label: 'Code', render: r => r.staffCode || '—' },
      { key: 'name', label: 'Name', render: r => r.name },
      { key: 'role', label: 'Role', render: r => <Badge variant="secondary">{r.role}</Badge> },
      { key: 'contactNumber', label: 'Phone', render: r => r.contactNumber || '—' },
      { key: 'salary', label: 'Salary', render: r => r.salary?.toLocaleString() ?? '—' },
      { key: '_count.taskAssignments', label: 'Tasks', render: r => r._count?.taskAssignments ?? 0 },
      { key: 'isActive', label: 'Status', render: r => <Badge variant={r.isActive ? 'default' : 'outline'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    ],
  },
  {
    key: 'suppliers',
    label: 'Suppliers',
    icon: Truck,
    description: 'Feed, drugs, semen & equipment suppliers',
    api: '/api/dairy/suppliers',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'supplierType', label: 'Type', type: 'select', options: ['feed', 'drugs', 'semen', 'equipment', 'other'] },
      { name: 'contactNumber', label: 'Phone', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'rating', label: 'Rating', type: 'select', options: ['Good', 'Average', 'Poor'] },
      { name: 'productsSupplied', label: 'Products Supplied (comma-separated)', type: 'text', placeholder: 'Feed, Drugs' },
      { name: 'isActive', label: 'Active', type: 'select', options: YES_NO },
    ],
    columns: [
      { key: 'name', label: 'Name', render: r => r.name },
      { key: 'supplierType', label: 'Type', render: r => <Badge variant="outline">{r.supplierType}</Badge> },
      { key: 'contactNumber', label: 'Phone', render: r => r.contactNumber || '—' },
      { key: 'location', label: 'Location', render: r => r.location || '—' },
      { key: 'rating', label: 'Rating', render: r => r.rating || '—' },
      { key: '_count.feedItems', label: 'Items', render: r => r._count?.feedItems ?? 0 },
    ],
  },
  {
    key: 'feed-items',
    label: 'Feed Items',
    icon: Package,
    description: 'Inventory of feed types and stock',
    api: '/api/dairy/feed-items',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'feedType', label: 'Feed Type', type: 'select', options: ['Forage', 'Concentrate', 'Mix', 'Formulated'] },
      { name: 'quantityInStock', label: 'Stock (kg)', type: 'number' },
      { name: 'unitPrice', label: 'Unit Price', type: 'number' },
      { name: 'supplierId', label: 'Supplier ID', type: 'text', placeholder: 'Optional' },
      { name: 'nutritionalValue', label: 'Nutritional Value', type: 'textarea' },
      { name: 'isActive', label: 'Active', type: 'select', options: YES_NO },
    ],
    columns: [
      { key: 'name', label: 'Name', render: r => r.name },
      { key: 'feedType', label: 'Type', render: r => <Badge variant="outline">{r.feedType || '—'}</Badge> },
      { key: 'quantityInStock', label: 'Stock (kg)', render: r => r.quantityInStock ?? 0 },
      { key: 'unitPrice', label: 'Unit Price', render: r => r.unitPrice?.toLocaleString() ?? '—' },
      { key: 'supplier', label: 'Supplier', render: r => r.supplier?.name || '—' },
    ],
  },
  {
    key: 'feed-schedules',
    label: 'Feed Schedules',
    icon: CalendarClock,
    description: 'Per-cow feeding plan and timing',
    api: '/api/dairy/feed-schedules',
    fields: [
      { name: 'cowId', label: 'Cow ID', type: 'text', required: true },
      { name: 'feedItemId', label: 'Feed Item ID', type: 'text', required: true },
      { name: 'feedTime', label: 'Feed Time', type: 'time' },
      { name: 'feedAmountKg', label: 'Amount (kg)', type: 'number' },
      { name: 'durationMinutes', label: 'Duration (min)', type: 'number' },
      { name: 'staffId', label: 'Staff ID', type: 'text' },
      { name: 'feedDate', label: 'Feed Date', type: 'datetime-local' },
    ],
    columns: [
      { key: 'cow', label: 'Cow', render: r => r.cow?.name || r.cow?.cowCode || r.cowId },
      { key: 'feedItem', label: 'Feed', render: r => r.feedItem?.name || r.feedItemId },
      { key: 'feedTime', label: 'Time', render: r => r.feedTime },
      { key: 'feedAmountKg', label: 'Amount (kg)', render: r => r.feedAmountKg },
      { key: 'staff', label: 'Staff', render: r => r.staff?.name || '—' },
      { key: 'feedDate', label: 'Date', render: r => r.feedDate ? new Date(r.feedDate).toLocaleString() : '—' },
    ],
  },
  {
    key: 'tasks',
    label: 'Tasks',
    icon: ListChecks,
    description: 'Daily task assignments to staff',
    api: '/api/dairy/tasks',
    fields: [
      { name: 'staffId', label: 'Staff ID', type: 'text', required: true },
      { name: 'cowId', label: 'Cow ID', type: 'text' },
      { name: 'taskType', label: 'Task Type', type: 'select', options: ['Milking', 'Feeding', 'Cleaning', 'Veterinary'] },
      { name: 'taskDate', label: 'Task Date', type: 'datetime-local', required: true },
      { name: 'taskStatus', label: 'Status', type: 'select', options: ['Pending', 'Completed'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    columns: [
      { key: 'taskType', label: 'Task', render: r => <Badge variant="outline">{r.taskType}</Badge> },
      { key: 'staff', label: 'Staff', render: r => r.staff?.name || r.staffId },
      { key: 'cow', label: 'Cow', render: r => r.cow?.name || '—' },
      { key: 'taskDate', label: 'Date', render: r => r.taskDate ? new Date(r.taskDate).toLocaleString() : '—' },
      { key: 'taskStatus', label: 'Status', render: r => <Badge variant={r.taskStatus === 'Completed' ? 'default' : 'secondary'}>{r.taskStatus}</Badge> },
    ],
  },
  {
    key: 'vaccinations',
    label: 'Vaccinations',
    icon: Syringe,
    description: 'Vaccination schedule & history per cow',
    api: '/api/dairy/vaccinations',
    fields: [
      { name: 'cowId', label: 'Cow ID', type: 'text', required: true },
      { name: 'vaccineName', label: 'Vaccine Name', type: 'text', required: true },
      { name: 'vaccinationDate', label: 'Vaccination Date', type: 'datetime-local', required: true },
      { name: 'dose', label: 'Dose', type: 'text', placeholder: 'ml or mg' },
      { name: 'nextDueDate', label: 'Next Due Date', type: 'date' },
      { name: 'administeredBy', label: 'Administered By', type: 'text' },
      { name: 'effectObserved', label: 'Effect Observed', type: 'textarea' },
    ],
    columns: [
      { key: 'cow', label: 'Cow', render: r => r.cow?.name || r.cow?.cowCode || r.cowId },
      { key: 'vaccineName', label: 'Vaccine', render: r => r.vaccineName },
      { key: 'vaccinationDate', label: 'Date', render: r => r.vaccinationDate ? new Date(r.vaccinationDate).toLocaleDateString() : '—' },
      { key: 'dose', label: 'Dose', render: r => r.dose || '—' },
      { key: 'administeredBy', label: 'By', render: r => r.administeredBy || '—' },
      { key: 'nextDueDate', label: 'Next Due', render: r => r.nextDueDate ? new Date(r.nextDueDate).toLocaleDateString() : '—' },
    ],
  },
  {
    key: 'milking',
    label: 'Milking',
    icon: Droplet,
    description: 'Daily milk yield records per cow',
    api: '/api/dairy/milking',
    fields: [
      { name: 'cowId', label: 'Cow ID', type: 'text', required: true },
      { name: 'milkingDate', label: 'Milking Date', type: 'datetime-local', required: true },
      { name: 'session', label: 'Session', type: 'select', options: ['Morning', 'Midday', 'Evening'] },
      { name: 'milkYieldLitres', label: 'Yield (litres)', type: 'number', required: true },
      { name: 'fatContentPct', label: 'Fat %', type: 'number' },
      { name: 'proteinContentPct', label: 'Protein %', type: 'number' },
      { name: 'qualityGrade', label: 'Quality Grade', type: 'select', options: ['A', 'B', 'C'] },
      { name: 'storageTempC', label: 'Storage Temp (°C)', type: 'number' },
      { name: 'bulkTankId', label: 'Bulk Tank ID', type: 'text' },
      { name: 'recordedBy', label: 'Recorded By', type: 'text' },
    ],
    columns: [
      { key: 'cow', label: 'Cow', render: r => r.cow?.name || r.cow?.cowCode || r.cowId },
      { key: 'milkingDate', label: 'Date', render: r => r.milkingDate ? new Date(r.milkingDate).toLocaleString() : '—' },
      { key: 'session', label: 'Session', render: r => <Badge variant="outline">{r.session}</Badge> },
      { key: 'milkYieldLitres', label: 'Litres', render: r => <span className="font-semibold text-primary">{r.milkYieldLitres} L</span> },
      { key: 'qualityGrade', label: 'Grade', render: r => r.qualityGrade || '—' },
      { key: 'storageTempC', label: 'Temp (°C)', render: r => r.storageTempC ?? '—' },
    ],
  },
  {
    key: 'health-checks',
    label: 'Health Checks',
    icon: HeartPulse,
    description: 'Veterinary health checks & treatments',
    api: '/api/dairy/health-checks',
    fields: [
      { name: 'cowId', label: 'Cow ID', type: 'text', required: true },
      { name: 'checkDate', label: 'Check Date', type: 'datetime-local' },
      { name: 'healthStatus', label: 'Health Status', type: 'select', options: ['Good', 'Fair', 'Poor'] },
      { name: 'diseaseObserved', label: 'Disease Observed', type: 'textarea' },
      { name: 'treatmentAdministered', label: 'Treatment', type: 'textarea' },
      { name: 'veterinarian', label: 'Veterinarian', type: 'text' },
      { name: 'nextCheckDate', label: 'Next Check Date', type: 'date' },
    ],
    columns: [
      { key: 'cow', label: 'Cow', render: r => r.cow?.name || r.cow?.cowCode || r.cowId },
      { key: 'checkDate', label: 'Date', render: r => r.checkDate ? new Date(r.checkDate).toLocaleDateString() : '—' },
      { key: 'healthStatus', label: 'Status', render: r => (
        <Badge variant={r.healthStatus === 'Good' ? 'default' : r.healthStatus === 'Poor' ? 'destructive' : 'secondary'}>
          {r.healthStatus || 'Good'}
        </Badge>
      ) },
      { key: 'veterinarian', label: 'Vet', render: r => r.veterinarian || '—' },
      { key: 'nextCheckDate', label: 'Next Check', render: r => r.nextCheckDate ? new Date(r.nextCheckDate).toLocaleDateString() : '—' },
    ],
  },
  {
    key: 'breeding',
    label: 'Breeding',
    icon: GitMerge,
    description: 'AI & natural service breeding events',
    api: '/api/dairy/breeding',
    fields: [
      { name: 'damId', label: 'Dam (Cow) ID', type: 'text', required: true },
      { name: 'sireId', label: 'Sire ID', type: 'text' },
      { name: 'breedingDate', label: 'Breeding Date', type: 'datetime-local', required: true },
      { name: 'breedingType', label: 'Type', type: 'select', options: ['AI', 'Natural'] },
      { name: 'semenBatch', label: 'Semen Batch #', type: 'text' },
      { name: 'aiTechnician', label: 'AI Technician', type: 'text' },
      { name: 'expectedBirthDate', label: 'Expected Birth', type: 'date' },
      { name: 'pregnancyConfirmed', label: 'Pregnancy Confirmed', type: 'select', options: YES_NO },
      { name: 'pregnancyCheckDate', label: 'Preg. Check Date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    columns: [
      { key: 'dam', label: 'Dam', render: r => r.dam?.name || r.dam?.cowCode || r.damId },
      { key: 'sire', label: 'Sire', render: r => r.sire?.name || r.sireId || '—' },
      { key: 'breedingType', label: 'Type', render: r => <Badge variant="outline">{r.breedingType}</Badge> },
      { key: 'breedingDate', label: 'Date', render: r => r.breedingDate ? new Date(r.breedingDate).toLocaleDateString() : '—' },
      { key: 'expectedBirthDate', label: 'Expected Birth', render: r => r.expectedBirthDate ? new Date(r.expectedBirthDate).toLocaleDateString() : '—' },
      { key: 'pregnancyConfirmed', label: 'Pregnant', render: r => r.pregnancyConfirmed === true ? <Badge variant="default">Yes</Badge> : r.pregnancyConfirmed === false ? <Badge variant="outline">No</Badge> : '—' },
    ],
  },
  {
    key: 'weights',
    label: 'Weights',
    icon: Scale,
    description: 'Body weight & BCS records',
    api: '/api/dairy/weights',
    fields: [
      { name: 'cowId', label: 'Cow ID', type: 'text', required: true },
      { name: 'weightDate', label: 'Weigh Date', type: 'datetime-local' },
      { name: 'weightKg', label: 'Weight (kg)', type: 'number', required: true },
      { name: 'bodyConditionScore', label: 'BCS (1-5)', type: 'number' },
      { name: 'measurementMethod', label: 'Method', type: 'select', options: ['Scale', 'Heart-girth tape', 'Visual'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    columns: [
      { key: 'cow', label: 'Cow', render: r => r.cow?.name || r.cow?.cowCode || r.cowId },
      { key: 'weightDate', label: 'Date', render: r => r.weightDate ? new Date(r.weightDate).toLocaleDateString() : '—' },
      { key: 'weightKg', label: 'Weight (kg)', render: r => <span className="font-semibold">{r.weightKg} kg</span> },
      { key: 'bodyConditionScore', label: 'BCS', render: r => r.bodyConditionScore ?? '—' },
      { key: 'measurementMethod', label: 'Method', render: r => r.measurementMethod || '—' },
    ],
  },
  {
    key: 'quality-tests',
    label: 'Quality Tests',
    icon: FlaskConical,
    description: 'Milk batch quality & lab tests',
    api: '/api/dairy/quality-tests',
    fields: [
      { name: 'batchId', label: 'Batch ID', type: 'text', required: true },
      { name: 'tankId', label: 'Tank ID', type: 'text' },
      { name: 'collectionDate', label: 'Collection Date', type: 'datetime-local', required: true },
      { name: 'samplingTime', label: 'Sampling Time', type: 'time' },
      { name: 'testParameter', label: 'Parameter', type: 'select', options: ['Fat Content', 'Protein', 'Antibiotics', 'Somatic Cell Count'] },
      { name: 'testResult', label: 'Result', type: 'text', required: true },
      { name: 'labName', label: 'Lab Name', type: 'text' },
      { name: 'reportUrl', label: 'Report URL', type: 'text' },
    ],
    columns: [
      { key: 'batchId', label: 'Batch', render: r => r.batchId },
      { key: 'tankId', label: 'Tank', render: r => r.tankId || '—' },
      { key: 'testParameter', label: 'Parameter', render: r => <Badge variant="outline">{r.testParameter}</Badge> },
      { key: 'testResult', label: 'Result', render: r => r.testResult },
      { key: 'labName', label: 'Lab', render: r => r.labName || '—' },
      { key: 'collectionDate', label: 'Collected', render: r => r.collectionDate ? new Date(r.collectionDate).toLocaleDateString() : '—' },
    ],
  },
  {
    key: 'waste',
    label: 'Waste',
    icon: Trash2,
    description: 'Manure & slaughter waste logs',
    api: '/api/dairy/waste',
    fields: [
      { name: 'wasteDate', label: 'Waste Date', type: 'datetime-local' },
      { name: 'wasteType', label: 'Type', type: 'select', options: ['Manure', 'Slaughter Waste', 'Bedding'] },
      { name: 'quantityKg', label: 'Quantity (kg)', type: 'number' },
      { name: 'handlingMethod', label: 'Handling', type: 'select', options: ['Composting', 'Biogas', 'Direct Field Application'] },
      { name: 'treatmentDurationDays', label: 'Treatment (days)', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    columns: [
      { key: 'wasteDate', label: 'Date', render: r => r.wasteDate ? new Date(r.wasteDate).toLocaleDateString() : '—' },
      { key: 'wasteType', label: 'Type', render: r => <Badge variant="outline">{r.wasteType}</Badge> },
      { key: 'quantityKg', label: 'Qty (kg)', render: r => r.quantityKg ?? '—' },
      { key: 'handlingMethod', label: 'Handling', render: r => r.handlingMethod },
      { key: 'treatmentDurationDays', label: 'Treatment (d)', render: r => r.treatmentDurationDays ?? '—' },
    ],
  },
  {
    key: 'emissions',
    label: 'Emissions',
    icon: CloudSun,
    description: 'Carbon & GHG emission tracking',
    api: '/api/dairy/emissions',
    fields: [
      { name: 'recordDate', label: 'Record Date', type: 'datetime-local' },
      { name: 'species', label: 'Species', type: 'select', options: ['Cattle', 'Pig', 'Sheep', 'Goat'] },
      { name: 'animalCount', label: 'Animal Count', type: 'number', required: true },
      { name: 'entericMethaneKgDay', label: 'Enteric CH₄ (kg/day)', type: 'number' },
      { name: 'manureEmissionsKgDay', label: 'Manure Emissions (kg/day)', type: 'number' },
      { name: 'totalEmissionsKgCO2e', label: 'Total CO₂e (kg)', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    columns: [
      { key: 'recordDate', label: 'Date', render: r => r.recordDate ? new Date(r.recordDate).toLocaleDateString() : '—' },
      { key: 'species', label: 'Species', render: r => <Badge variant="outline">{r.species}</Badge> },
      { key: 'animalCount', label: 'Count', render: r => r.animalCount },
      { key: 'entericMethaneKgDay', label: 'CH₄', render: r => r.entericMethaneKgDay ?? '—' },
      { key: 'totalEmissionsKgCO2e', label: 'CO₂e (kg)', render: r => r.totalEmissionsKgCO2e ?? '—' },
    ],
  },
  {
    key: 'certifications',
    label: 'Certifications',
    icon: BadgeCheck,
    description: 'Welfare & quality certifications',
    api: '/api/dairy/certifications',
    fields: [
      { name: 'standard', label: 'Standard', type: 'select', options: ['G.R.A.S', 'Organic', 'Global Animal Partnership', 'BAP'] },
      { name: 'assessmentDate', label: 'Assessment Date', type: 'date', required: true },
      { name: 'assessorName', label: 'Assessor', type: 'text', required: true },
      { name: 'animalWelfare', label: 'Animal Welfare', type: 'select', options: ['Compliant', 'Non-Compliant'] },
      { name: 'biosecurity', label: 'Biosecurity', type: 'select', options: ['Compliant', 'Non-Compliant'] },
      { name: 'wasteManagement', label: 'Waste Mgmt', type: 'select', options: ['Compliant', 'Non-Compliant'] },
      { name: 'climateSmart', label: 'Climate-Smart', type: 'select', options: ['Compliant', 'Non-Compliant'] },
      { name: 'outcome', label: 'Outcome', type: 'select', options: ['Passed', 'Failed'] },
      { name: 'totalScorePct', label: 'Score %', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    columns: [
      { key: 'standard', label: 'Standard', render: r => <Badge variant="outline">{r.standard}</Badge> },
      { key: 'assessmentDate', label: 'Date', render: r => r.assessmentDate ? new Date(r.assessmentDate).toLocaleDateString() : '—' },
      { key: 'assessorName', label: 'Assessor', render: r => r.assessorName },
      { key: 'totalScorePct', label: 'Score %', render: r => r.totalScorePct ?? '—' },
      { key: 'outcome', label: 'Outcome', render: r => <Badge variant={r.outcome === 'Passed' ? 'default' : 'destructive'}>{r.outcome}</Badge> },
    ],
  },
  {
    key: 'inspections',
    label: 'Inspections',
    icon: ClipboardList,
    description: 'Farm & facility inspections',
    api: '/api/dairy/inspections',
    fields: [
      { name: 'batchOrFarmId', label: 'Batch/Farm ID', type: 'text', required: true },
      { name: 'inspectionDate', label: 'Inspection Date', type: 'datetime-local', required: true },
      { name: 'inspector', label: 'Inspector', type: 'text', required: true },
      { name: 'scope', label: 'Scope', type: 'select', options: ['Farm', 'Facility'] },
      { name: 'observations', label: 'Observations', type: 'textarea' },
      { name: 'nonConformance', label: 'Non-Conformance', type: 'select', options: YES_NO },
      { name: 'correctiveActions', label: 'Corrective Actions', type: 'textarea' },
      { name: 'followUpDate', label: 'Follow-up Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed'] },
    ],
    columns: [
      { key: 'batchOrFarmId', label: 'Batch/Farm', render: r => r.batchOrFarmId },
      { key: 'inspectionDate', label: 'Date', render: r => r.inspectionDate ? new Date(r.inspectionDate).toLocaleDateString() : '—' },
      { key: 'inspector', label: 'Inspector', render: r => r.inspector },
      { key: 'scope', label: 'Scope', render: r => <Badge variant="outline">{r.scope}</Badge> },
      { key: 'nonConformance', label: 'NC', render: r => r.nonConformance ? <Badge variant="destructive">Yes</Badge> : 'No' },
      { key: 'status', label: 'Status', render: r => <Badge variant={r.status === 'Open' ? 'secondary' : 'default'}>{r.status}</Badge> },
    ],
  },
  {
    key: 'feed-logs',
    label: 'Feed Logs',
    icon: BookOpen,
    description: 'Daily feed consumption logs',
    api: '/api/dairy/feed-logs',
    fields: [
      { name: 'feedDate', label: 'Feed Date', type: 'datetime-local' },
      { name: 'feedType', label: 'Feed Type', type: 'select', options: ['Forage', 'Concentrate', 'Mix', 'Formulated'] },
      { name: 'quantityKg', label: 'Quantity (kg)', type: 'number', required: true },
      { name: 'costPerUnit', label: 'Cost / Unit', type: 'number' },
      { name: 'feedConversionRatio', label: 'FCR', type: 'number' },
      { name: 'cowId', label: 'Cow ID', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    columns: [
      { key: 'feedDate', label: 'Date', render: r => r.feedDate ? new Date(r.feedDate).toLocaleDateString() : '—' },
      { key: 'feedType', label: 'Type', render: r => <Badge variant="outline">{r.feedType}</Badge> },
      { key: 'quantityKg', label: 'Qty (kg)', render: r => r.quantityKg },
      { key: 'costPerUnit', label: 'Cost/Unit', render: r => r.costPerUnit ?? '—' },
      { key: 'totalCost', label: 'Total Cost', render: r => r.totalCost?.toLocaleString() ?? '—' },
      { key: 'cowId', label: 'Cow', render: r => r.cowId || '—' },
    ],
  },
  {
    key: 'processing',
    label: 'Processing',
    icon: Beef,
    description: 'Meat production & processing logs',
    api: '/api/dairy/processing',
    fields: [
      { name: 'processingDate', label: 'Processing Date', type: 'datetime-local' },
      { name: 'species', label: 'Species', type: 'select', options: ['Cattle', 'Pig', 'Chicken', 'Sheep', 'Goat'] },
      { name: 'numberProcessed', label: '# Processed', type: 'number', required: true },
      { name: 'carcassWeightKg', label: 'Carcass Wt (kg)', type: 'number', required: true },
      { name: 'yieldPct', label: 'Yield %', type: 'number' },
      { name: 'processingPlantId', label: 'Plant ID', type: 'text' },
      { name: 'coldStorageId', label: 'Cold Storage ID', type: 'text' },
      { name: 'productCategories', label: 'Products (comma-sep)', type: 'text', placeholder: 'Meat, Sausage' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    columns: [
      { key: 'processingDate', label: 'Date', render: r => r.processingDate ? new Date(r.processingDate).toLocaleDateString() : '—' },
      { key: 'species', label: 'Species', render: r => <Badge variant="outline">{r.species}</Badge> },
      { key: 'numberProcessed', label: '# Processed', render: r => r.numberProcessed },
      { key: 'carcassWeightKg', label: 'Carcass (kg)', render: r => r.carcassWeightKg },
      { key: 'yieldPct', label: 'Yield %', render: r => r.yieldPct ?? '—' },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*                                  KPI tiles                                  */
/* -------------------------------------------------------------------------- */

interface KpiData {
  totalCows: number
  totalStaff: number
  todaysMilkLitres: number
  pendingTasks: number
  upcomingVaccinations: number
}

function KpiTile({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground truncate">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums truncate">{value}</p>
          </div>
          <div className={cn('shrink-0 rounded-xl p-2.5', color)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function KpiRow() {
  const [kpi, setKpi] = useState<KpiData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchKpi = useCallback(async () => {
    setLoading(true)
    try {
      const [cows, staff, milking, tasks, vaccinations] = await Promise.all([
        fetch('/api/dairy/cows?limit=1').then(r => r.json()),
        fetch('/api/dairy/staff?limit=1').then(r => r.json()),
        fetch('/api/dairy/milking?limit=500').then(r => r.json()),
        fetch('/api/dairy/tasks?taskStatus=Pending&limit=1').then(r => r.json()),
        fetch('/api/dairy/vaccinations?limit=500').then(r => r.json()),
      ])

      const todayStr = new Date().toISOString().slice(0, 10)
      const todaysMilk = (milking.data || []).filter((m: any) =>
        m.milkingDate && new Date(m.milkingDate).toISOString().slice(0, 10) === todayStr,
      ).reduce((sum: number, m: any) => sum + (m.milkYieldLitres || 0), 0)

      const now = new Date()
      const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const upcoming = (vaccinations.data || []).filter((v: any) =>
        v.nextDueDate && new Date(v.nextDueDate) >= now && new Date(v.nextDueDate) <= next30,
      ).length

      setKpi({
        totalCows: cows.total ?? 0,
        totalStaff: staff.total ?? 0,
        todaysMilkLitres: Number(todaysMilk.toFixed(1)),
        pendingTasks: tasks.total ?? 0,
        upcomingVaccinations: upcoming,
      })
    } catch (e) {
      console.error('KPI fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchKpi() }, [fetchKpi])

  const tiles: { icon: React.ElementType; label: string; value: React.ReactNode; color: string }[] = [
    { icon: CowIcon, label: 'Total Cows', value: kpi?.totalCows ?? '—', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    { icon: Users, label: 'Total Staff', value: kpi?.totalStaff ?? '—', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    { icon: Droplet, label: "Today's Milk (L)", value: kpi?.todaysMilkLitres ?? '—', color: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
    { icon: ListChecks, label: 'Pending Tasks', value: kpi?.pendingTasks ?? '—', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
    { icon: Syringe, label: 'Vaccinations due ≤30d', value: kpi?.upcomingVaccinations ?? '—', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {tiles.map(t => (
        <KpiTile key={t.label} icon={t.icon} label={t.label} value={loading ? <Skeleton className="h-7 w-12" /> : t.value} color={t.color} />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                            Generic module viewer                           */
/* -------------------------------------------------------------------------- */

function ModuleList({ module, refreshKey, onRefresh }: { module: ModuleConfig; refreshKey: number; onRefresh: () => void }) {
  const [items, setItems] = useState<Record<string, any>[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  const limit = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (search) params.set('search', search)
      const res = await fetch(`${module.api}?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setItems(json.data || [])
      setTotal(json.total ?? 0)
      setTotalPages(json.totalPages ?? 1)
    } catch (e) {
      console.error('Fetch error:', e)
      toast.error('Failed to load records')
    } finally {
      setLoading(false)
    }
  }, [module.api, page, search])

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

  // Reset to page 1 when search changes (debounced)
  useEffect(() => {
    const t = setTimeout(() => { if (page !== 1) setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search, page])

  const openAddDialog = () => {
    // Initialize form with defaults
    const defaults: Record<string, string> = {}
    for (const f of module.fields) {
      if (f.type === 'select' && f.options) defaults[f.name] = f.options[0]
      else if (f.name === 'isActive') defaults[f.name] = 'true'
      else if (f.type === 'datetime-local') defaults[f.name] = new Date().toISOString().slice(0, 16)
      else defaults[f.name] = ''
    }
    setForm(defaults)
    setDialogOpen(true)
  }

  const submit = async () => {
    // Validate required
    for (const f of module.fields) {
      if (f.required && !form[f.name]) {
        toast.error(`${f.label} is required`)
        return
      }
    }
    setSubmitting(true)
    try {
      const res = await fetch(module.api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Request failed (${res.status})`)
      }
      toast.success(`${module.label} record created`)
      setDialogOpen(false)
      fetchData()
      onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteRow = async (id: string) => {
    if (!confirm(`Delete this ${module.label.toLowerCase().replace(/s$/, '')} record?`)) return
    try {
      const res = await fetch(`${module.api}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Record deleted')
      fetchData()
      onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <module.icon className="h-5 w-5 text-primary" />
              {module.label}
            </CardTitle>
            <CardDescription className="mt-1">{module.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 w-full sm:w-56 h-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => fetchData()} title="Refresh" className="h-9 w-9">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={openAddDialog} size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto border-t">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/60 backdrop-blur z-10">
              <TableRow>
                {module.columns.map(c => (
                  <TableHead key={c.key} className="whitespace-nowrap">{c.label}</TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {module.columns.map((c, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>
                    ))}
                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={module.columns.length + 1} className="text-center text-muted-foreground py-12">
                    No records found. Click <span className="font-semibold text-foreground">Add</span> to create one.
                  </TableCell>
                </TableRow>
              ) : (
                items.map(row => (
                  <TableRow key={row.id} className="hover:bg-muted/40">
                    {module.columns.map(c => (
                      <TableCell key={c.key} className="whitespace-nowrap text-sm">
                        {c.render ? c.render(row) : (row[c.key] ?? '—')}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteRow(row.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {total > 0 ? `Showing ${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total}` : 'No records'}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">Page {page} of {Math.max(1, totalPages)}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <module.icon className="h-5 w-5 text-primary" />
              New {module.label.replace(/s$/, '')} Record
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            {module.fields.map(f => (
              <div key={f.name} className={cn('space-y-1.5', f.type === 'textarea' && 'sm:col-span-2')}>
                <Label htmlFor={f.name} className="text-xs font-medium">
                  {f.label}{f.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                {f.type === 'textarea' ? (
                  <Textarea
                    id={f.name}
                    value={form[f.name] ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                    placeholder={f.placeholder}
                    rows={3}
                  />
                ) : f.type === 'select' ? (
                  <Select value={form[f.name] ?? ''} onValueChange={v => setForm(prev => ({ ...prev, [f.name]: v }))}>
                    <SelectTrigger id={f.name}><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {f.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={f.name}
                    type={f.type}
                    value={form[f.name] ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Main dashboard                                 */
/* -------------------------------------------------------------------------- */

export default function DairyDashboard() {
  const [activeKey, setActiveKey] = useState<string>('cows')
  const [refreshKey, setRefreshKey] = useState(0)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const activeModule = useMemo(() => MODULES.find(m => m.key === activeKey) || MODULES[0], [activeKey])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Milk className="h-6 w-6 text-primary" />
            ZIWA360 Dairy Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complete dairy farm operations — herd, milk, health, breeding & compliance.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRefreshKey(k => k + 1)}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh KPIs
        </Button>
      </div>

      {/* KPI tiles */}
      <KpiRow />

      {/* Body: sidebar nav + module list */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        {/* Sidebar nav (sticky on desktop, collapsible on mobile) */}
        <Card className="lg:sticky lg:top-4 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground flex items-center justify-between">
              Modules
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden h-7 w-7 p-0"
                onClick={() => setMobileNavOpen(o => !o)}
              >
                {mobileNavOpen ? <X className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className={`p-2 pt-0 ${mobileNavOpen ? 'block' : 'hidden lg:block'}`}>
            <nav className="space-y-0.5 max-h-[70vh] overflow-y-auto pr-1">
              {MODULES.map(m => {
                const Icon = m.icon
                const active = m.key === activeKey
                return (
                  <button
                    key={m.key}
                    onClick={() => { setActiveKey(m.key); setMobileNavOpen(false) }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{m.label}</span>
                  </button>
                )
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Active module list */}
        <ModuleList
          key={activeModule.key}
          module={activeModule}
          refreshKey={refreshKey}
          onRefresh={() => setRefreshKey(k => k + 1)}
        />
      </div>
    </div>
  )
}
