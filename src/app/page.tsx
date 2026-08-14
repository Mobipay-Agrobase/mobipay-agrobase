'use client'

import React, { Suspense, lazy, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAppStore, EKB_HIDDEN_MODULES } from '@/lib/store'

// Master-data module keys that should be accessible to all admin/field roles.
// Listed once here so every role bouncer stays in sync — previously each
// allowlist had its own partial copy, which caused sidebar clicks to bounce
// to dashboard when the key wasn't included.
const MASTER_DATA_KEYS = [
  'master-data',
  'catalog-manager',
  'data-quality',
  'location-master',
  'season-master',
  'crop-master',
  'seed-master',
  'fertilizer-master',
  'equipment-master',
  'pesticide-master',
  'weed-master',
  'disease-master',
  'pest-master',
  'soiltype-master',
  'crop-stages',
  'crop-variety',
  'field-staff',
  'cooperatives',
  'farmer-mapping',
] as const
import { useIsEkibboTenant } from '@/hooks/use-is-ekibbo'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { LoginPage } from '@/components/auth/LoginPage'
import { Skeleton } from '@/components/ui/skeleton'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { SimulationBanner } from '@/components/layout/SimulationBanner'
import { useSimulationStatus } from '@/hooks/use-simulation-status'
import {
  EkbMdDashboard, EkbOpsManagerDashboard, EkbFinanceDashboard,
  EkbFinAssistantDashboard, EkbMecDashboard, EkbExtensionDashboard,
} from '@/components/dashboard/EkbiboDashboards'

// Core modules
const DashboardView = lazy(() => import('@/components/modules/DashboardView'))
const FarmersView = lazy(() => import('@/components/modules/FarmersView'))
const FarmLandsView = lazy(() => import('@/components/modules/FarmLandsView'))
const CultivationsView = lazy(() => import('@/components/modules/CultivationsView'))
const VslaView = lazy(() => import('@/components/modules/VslaView'))
const SaccoView = lazy(() => import('@/components/modules/SaccoView'))
const FarmerDetailFull = lazy(() => import('@/components/modules/FarmerDetailFull'))
const FarmerFormPage = lazy(() => import('@/components/modules/FarmerFormPage'))
const FarmLandFormPage = lazy(() => import('@/components/modules/FarmLandFormPage'))
const FarmLandDetailPage = lazy(() => import('@/components/modules/FarmLandDetailPage'))
const CultivationFormPage = lazy(() => import('@/components/modules/CultivationFormPage'))
const CultivationDetailPage = lazy(() => import('@/components/modules/CultivationDetailPage'))
const CatalogManager = lazy(() => import('@/components/modules/CatalogManager'))
const DataQualityView = lazy(() => import('@/components/admin/DataQualityView'))
const MasterDataView = lazy(() => import('@/components/modules/MasterDataView'))
const FarmerMappingView = lazy(() => import('@/components/modules/FarmerMappingView'))
const LocationMaster = lazy(() => import('@/components/admin/LocationMaster').then(m => ({ default: m.LocationMaster })))
const FieldStaffManagement = lazy(() => import('@/components/admin/FieldStaffManagement').then(m => ({ default: m.FieldStaffManagement })))
const CooperativeManagement = lazy(() => import('@/components/admin/CooperativeManagement').then(m => ({ default: m.CooperativeManagement })))
const SaccoDashboard = lazy(() => import('@/components/modules/SaccoDashboard'))
const VslaProviderDashboard = lazy(() => import('@/components/modules/VslaProviderDashboard'))
const KilimoDashboard = lazy(() => import('@/components/modules/KilimoDashboard'))
const ResetDashboardComponent = lazy(() => import('@/components/modules/ResetDashboard'))
const MarketplaceView = lazy(() => import('@/components/modules/MarketplaceView'))
const PaymentsView = lazy(() => import('@/components/modules/PaymentsView'))
const LoansView = lazy(() => import('@/components/modules/LoansView'))
const ReportsView = lazy(() => import('@/components/modules/ReportsView'))
const TrainingView = lazy(() => import('@/components/modules/TrainingView'))
const SettingsView = lazy(() => import('@/components/modules/SettingsView'))
const CommunicationView = lazy(() => import('@/components/modules/CommunicationView'))
const AgriTrackView = lazy(() => import('@/components/modules/AgriTrackView'))

// Extended modules (20 new)
const TraceabilityView = lazy(() => import('@/components/modules/TraceabilityView'))
const SurveysView = lazy(() => import('@/components/modules/SurveysView'))
const InputAggregationView = lazy(() => import('@/components/modules/InputAggregationView'))
const PurchasesView = lazy(() => import('@/components/modules/PurchasesView'))
const ConsignmentsView = lazy(() => import('@/components/modules/ConsignmentsView'))
const SalesView = lazy(() => import('@/components/modules/SalesView'))
const DeliveriesView = lazy(() => import('@/components/modules/DeliveriesView'))
const CompaniesView = lazy(() => import('@/components/modules/CompaniesView'))
const UsersView = lazy(() => import('@/components/modules/UsersView'))
const FeedbackView = lazy(() => import('@/components/modules/FeedbackView'))
const ApprovalsView = lazy(() => import('@/components/modules/ApprovalsView'))
const ProcessingView = lazy(() => import('@/components/modules/ProcessingView'))
const ComplianceView = lazy(() => import('@/components/modules/ComplianceView'))
const ImpactAssessmentView = lazy(() => import('@/components/modules/ImpactAssessmentView'))
const FarmVisitsView = lazy(() => import('@/components/modules/FarmVisitsView'))
const ProfileView = lazy(() => import('@/components/modules/ProfileView'))
const ChannelSimulatorView = lazy(() => import('@/components/modules/ChannelSimulatorView'))
const CcrpView = lazy(() => import('@/components/modules/CcrpView'))
const CohortsView = lazy(() => import('@/components/modules/CohortsView'))
const ProgramsView = lazy(() => import('@/components/modules/ProgramsView'))
const MfiPortalView = lazy(() => import('@/components/modules/MfiPortalView'))
const TransportPortalView = lazy(() => import('@/components/modules/TransportPortalView'))
const PlotsView = lazy(() => import('@/components/modules/PlotsView'))

// Super Admin views
const SuperAdminOverviewView = lazy(() => import('@/components/admin/SuperAdminOverviewView'))
const SuperAdminTenantsView = lazy(() => import('@/components/admin/SuperAdminTenantsView'))
const SuperAdminRevenueView = lazy(() => import('@/components/admin/SuperAdminRevenueView'))
const SuperAdminImpactView = lazy(() => import('@/components/admin/SuperAdminImpactView'))
const SuperAdminAllUsersView = lazy(() => import('@/components/admin/SuperAdminAllUsersView'))
const SuperAdminMobileView = lazy(() => import('@/components/admin/SuperAdminMobileView'))
const SuperAdminConfigView = lazy(() => import('@/components/admin/SuperAdminConfigView'))
const SuperAdminModuleStore = lazy(() => import('@/components/admin/SuperAdminModuleStore'))

// Farm Management (core product) views
const CarbonView = lazy(() => import('@/components/modules/CarbonView'))
const Farm5xView = lazy(() => import('@/components/modules/Farm5xView'))
const CostOfCultivationView = lazy(() => import('@/components/modules/CostOfCultivationView'))
const CropStagesLibraryView = lazy(() => import('@/components/modules/CropStagesLibraryView'))
const CropVarietyMasterView = lazy(() => import('@/components/modules/CropVarietyMasterView'))
const RolesPermissionsView = lazy(() => import('@/components/modules/RolesPermissionsView'))
const InputDistributionView = lazy(() => import('@/components/ekbibo/InputDistributionView'))
const CropInsuranceView = lazy(() => import('@/components/ekbibo/CropInsuranceView'))

// Billing
const BillingView = lazy(() => import('@/components/modules/BillingView'))

// Billing Engine
const BillingOperationsDashboard = lazy(() => import('@/components/admin/BillingOperationsDashboard'))
const RecoveryDashboard = lazy(() => import('@/components/billing/RecoveryDashboard'))
const SupportTicketsView = lazy(() => import('@/components/billing/SupportTicketsView'))
const QuotesView = lazy(() => import('@/components/billing/QuotesView'))
const NssfContributionsView = lazy(() => import('@/components/nssf/NssfContributionsView'))
const NssfSettlementView = lazy(() => import('@/components/nssf/NssfSettlementView'))
const ResetView = lazy(() => import('@/components/modules/ResetView'))

function ModuleLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted/50 rounded-xl" />
        ))}
      </div>
      <div className="h-80 bg-muted/50 rounded-xl" />
    </div>
  )
}

function ModuleRouter() {
  const { activeModule, user, selectedFarmerId, selectedFarmId, selectedFarmLandId, selectedCultivationId } = useAppStore()
  const role = user?.role || ''

  // Tenant-specific dashboard routing
  if (activeModule === 'dashboard') {
    if (role === 'SACCO_ADMIN' || role === 'SACCO_OFFICER') {
      return <SaccoDashboard />
    }
    if (role === 'VSLA_PROVIDER_ADMIN') {
      return <VslaProviderDashboard />
    }
    // EKIBBO roles — each gets their own role-specific dashboard
    if (role === 'EKB_MD') return <EkbMdDashboard />
    if (role === 'EKB_OPS_MANAGER') return <EkbOpsManagerDashboard />
    if (role === 'EKB_FINANCE') return <EkbFinanceDashboard />
    if (role === 'EKB_FIN_ASSISTANT') return <EkbFinAssistantDashboard />
    if (role === 'EKB_MEC') return <EkbMecDashboard />
    if (role === 'EKB_EXTENSION') return <EkbExtensionDashboard />
    // ReSET roles
    if (['CONSORTIUM_ADMIN', 'PARTNER_ADMIN', 'RESET_FIELD_AGENT', 'RESET_ME_OFFICER'].includes(role)) {
      return <ResetDashboardComponent />
    }
    // Default: generic dashboard (covers TENANT_ADMIN, COUNTRY_ADMIN, etc.)
    return <DashboardView />
  }

  switch (activeModule) {
    case 'farmers': return <FarmersView />
    case 'farmer-detail': {
      if (!selectedFarmerId) return <div className='text-center p-8 text-muted-foreground'>No farmer selected</div>
      return <FarmerDetailFull key={selectedFarmerId} farmerId={selectedFarmerId} onBack={() => useAppStore.getState().setActiveModule('farmers')} />
    }
    case 'farmer-create': return <FarmerFormPage mode="create" />
    case 'farmer-edit': {
      if (!selectedFarmerId) return <div className='text-center p-8 text-muted-foreground'>No farmer selected</div>
      return <FarmerFormPage key={selectedFarmerId} mode="edit" farmerId={selectedFarmerId} />
    }
    case 'farmland-create': return <FarmLandFormPage mode="create" farmerId={selectedFarmerId || undefined} />
    case 'farmland-edit': {
      if (!selectedFarmLandId) return <div className='text-center p-8 text-muted-foreground'>No farm land selected</div>
      return <FarmLandFormPage key={selectedFarmLandId} mode="edit" farmLandId={selectedFarmLandId} />
    }
    case 'farmland-detail': {
      if (!selectedFarmLandId) return <div className='text-center p-8 text-muted-foreground'>No farm land selected</div>
      return <FarmLandDetailPage key={selectedFarmLandId} farmLandId={selectedFarmLandId} onBack={() => useAppStore.getState().setActiveModule('farm-lands')} />
    }
    case 'cultivation-create': return <CultivationFormPage mode="create" farmId={selectedFarmId || selectedFarmLandId || undefined} />
    case 'cultivation-edit': {
      if (!selectedCultivationId) return <div className='text-center p-8 text-muted-foreground'>No cultivation selected</div>
      return <CultivationFormPage key={selectedCultivationId} mode="edit" cultivationId={selectedCultivationId} />
    }
    case 'cultivation-detail': {
      if (!selectedCultivationId) return <div className='text-center p-8 text-muted-foreground'>No cultivation selected</div>
      return <CultivationDetailPage key={selectedCultivationId} cultivationId={selectedCultivationId} onBack={() => useAppStore.getState().setActiveModule('cultivations')} />
    }
    case 'catalog-manager': return <CatalogManager />
    case 'data-quality': return <DataQualityView />
    case 'master-data': return <MasterDataView kind="crop" />
    case 'season-master': return <MasterDataView kind="season" />
    case 'crop-master': return <MasterDataView kind="crop" />
    case 'seed-master': return <MasterDataView kind="seed" />
    case 'fertilizer-master': return <MasterDataView kind="fertilizer" />
    case 'equipment-master': return <MasterDataView kind="equipment" />
    case 'pesticide-master': return <MasterDataView kind="pesticide" />
    case 'weed-master': return <MasterDataView kind="weed" />
    case 'disease-master': return <MasterDataView kind="disease" />
    case 'pest-master': return <MasterDataView kind="pest" />
    case 'soiltype-master': return <MasterDataView kind="soiltype" />
    case 'location-master': return <LocationMaster />
    case 'field-staff': return <FieldStaffManagement />
    case 'cooperatives': return <CooperativeManagement />
    case 'farmer-mapping': return <FarmerMappingView />
    case 'farm-lands': return <FarmLandsView />
    case 'cultivations': return <CultivationsView />
    case 'vsla': return <VslaView />
    case 'sacco': return <SaccoView />
    case 'marketplace': return <MarketplaceView />
    case 'payments': return <PaymentsView />
    case 'loans': return <LoansView />
    case 'reports': return <ReportsView />
    case 'training': return <TrainingView />
    case 'settings': return <SettingsView />
    case 'communication': return <CommunicationView />
    case 'agritrack': return <AgriTrackView />
    // Farm Management (core product)
    case 'carbon': return <CarbonView />
    case 'farm5x': return <Farm5xView />
    case 'cost-of-cultivation': return <CostOfCultivationView />
    case 'crop-stages': return <CropStagesLibraryView />
    case 'crop-variety': return <CropVarietyMasterView />
    case 'roles-permissions': return <RolesPermissionsView />
    case 'input-distribution': return <InputDistributionView />
    case 'crop-insurance': return <CropInsuranceView />
    // Supply Chain
    case 'input-aggregation': return <InputAggregationView />
    case 'purchases': return <PurchasesView />
    case 'approvals': return <ApprovalsView />
    case 'processing': return <ProcessingView />
    case 'sales': return <SalesView />
    case 'deliveries': return <DeliveriesView />
    case 'consignments': return <ConsignmentsView />
    case 'trace': return <TraceabilityView />
    // ReSET MarketLink
    case 'reset-dashboard': return <ResetView />
    case 'reset-beneficiaries': return <ResetView />
    case 'reset-vouchers': return <ResetView />
    case 'reset-merchants': return <ResetView />
    case 'reset-cash': return <ResetView />
    case 'reset-reports': return <ResetView />
    // Engagement
    case 'surveys': return <SurveysView />
    case 'feedback': return <FeedbackView />
    case 'farm-visits': return <FarmVisitsView />
    case 'impact-assessment': return <ImpactAssessmentView />
    // Admin
    case 'companies': return <CompaniesView />
    case 'users': return <UsersView />
    case 'compliance': return <ComplianceView />
    case 'profile': return <ProfileView />
    case 'billing': return <BillingView />
    // Programs
    case 'ccrp': return <CcrpView />
    case 'cohort1': return <CohortsView />
    case 'cohort2': return <CohortsView />
    case 'smile': return <ProgramsView />
    case 'nakivaale': return <ProgramsView />
    // Channel
    case 'ivr': return <ChannelSimulatorView />
    case 'channel-sim': return <ChannelSimulatorView />
    // Finance
    case 'mfi': return <MfiPortalView />
    case 'transport': return <TransportPortalView />
    // Plot-Level Traceability
    case 'plots': return <PlotsView />
    // Super Admin
    case 'super-admin-overview': return <SuperAdminOverviewView />
    case 'super-admin-tenants': return <SuperAdminTenantsView />
    case 'super-admin-revenue': return <SuperAdminRevenueView />
    case 'super-admin-impact': return <SuperAdminImpactView />
    case 'super-admin-users': return <SuperAdminAllUsersView />
    case 'super-admin-mobile': return <SuperAdminMobileView />
    case 'super-admin-config': return <SuperAdminConfigView />
    case 'super-admin-module-store': return <SuperAdminModuleStore />
    // Billing Engine
    case 'billing-operations': return <BillingOperationsDashboard />
    case 'platform-recovery': return <RecoveryDashboard />
    case 'support-tickets': return <SupportTicketsView />
    case 'quotes': return <QuotesView />
    case 'nssf-contributions': return <NssfContributionsView />
    case 'nssf-settlement': return <NssfSettlementView />
    default: return <DashboardView />
  }
}

function AuthenticatedApp() {
  const { status: simStatus, refresh: refreshSim } = useSimulationStatus()
  const user = useAppStore((s) => s.user)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  return (
    <div className="flex h-screen overflow-hidden bg-background flex-col">
      {isSuperAdmin && <SimulationBanner status={simStatus} onExited={refreshSim} />}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar simulationStatus={simStatus} onSimulationChange={refreshSim} />
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
              <Suspense fallback={<ModuleLoader />}>
                <ModuleRouter />
              </Suspense>
            </div>
          </main>
        </div>
      </div>
      {/* Onboarding wizard is tenant-admin scoped — hide for SUPER_ADMIN */}
      {!isSuperAdmin && <OnboardingWizard />}
      <CommandPalette />
    </div>
  )
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const setUser = useAppStore((s) => s.setUser)
  const setActiveModule = useAppStore((s) => s.setActiveModule)
  const activeModule = useAppStore((s) => s.activeModule)
  const isEkibbo = useIsEkibboTenant((session?.user as { role?: string } | undefined)?.role)

  useEffect(() => {
    if (session?.user) {
      const role = (session.user as { role: string }).role
      setUser({
        userId: (session.user as { userId: string }).userId,
        tenantId: (session.user as { tenantId: string }).tenantId,
        role,
        name: session.user.name || '',
      })
      // If SUPER_ADMIN and currently on a tenant-only module (e.g. farmers, vsla),
      // bounce them to the platform overview. We deliberately ALLOW Profile,
      // Settings, Roles & Permissions, Billing, Catalog Master, and Farmer Detail
      // (when a farmer is selected) so the TopBar dropdown and sidebar links
      // continue to work for SUPER_ADMIN.
      const adminAllowedForSuperAdmin = new Set([
        'profile', 'settings', 'roles-permissions', 'billing',
        'platform-recovery', 'farmer-detail',
        'farmland-detail', 'cultivation-detail',
        ...MASTER_DATA_KEYS,
      ])
      const isAllowedForSuperAdmin =
        activeModule.startsWith('super-admin') ||
        activeModule === 'billing-operations' ||
        adminAllowedForSuperAdmin.has(activeModule)
      if (role === 'SUPER_ADMIN' && !isAllowedForSuperAdmin) {
        setActiveModule('super-admin-overview')
      }
      // MOBIPAY_FINANCE: redirect to billing-operations if on a non-billing module
      const isAllowedForFinance =
        activeModule === 'billing-operations' ||
        activeModule === 'platform-recovery' ||
        activeModule === 'support-tickets' ||
        activeModule === 'quotes' ||
        activeModule === 'nssf-settlement' ||
        activeModule === 'billing' ||
        activeModule === 'profile' ||
        activeModule === 'dashboard'
      if (role === 'MOBIPAY_FINANCE' && !isAllowedForFinance) {
        setActiveModule('billing-operations')
      }
      // MOBIPAY_SUPPORT: redirect to support-tickets if on a non-support module
      const isAllowedForSupport =
        activeModule === 'support-tickets' ||
        activeModule === 'profile' ||
        activeModule === 'dashboard'
      if (role === 'MOBIPAY_SUPPORT' && !isAllowedForSupport) {
        setActiveModule('support-tickets')
      }

      // SACCO_ADMIN / SACCO_OFFICER: redirect to dashboard if on an irrelevant module
      const saccoAllowed = new Set([
        'dashboard', 'sacco', 'farmers', 'farm-lands', 'cultivations',
        'reports', 'training', 'profile',
        'farmer-detail', 'farmer-create', 'farmer-edit',
        'farmland-detail', 'farmland-create', 'farmland-edit',
        'cultivation-detail', 'cultivation-create', 'cultivation-edit',
        ...MASTER_DATA_KEYS,
      ])
      if ((role === 'SACCO_ADMIN' || role === 'SACCO_OFFICER') && !saccoAllowed.has(activeModule)) {
        setActiveModule('dashboard')
      }

      // VSLA_PROVIDER_ADMIN: redirect to dashboard if on an irrelevant module
      const vslaProviderAllowed = new Set([
        'dashboard', 'vsla', 'farmers', 'farm-lands', 'cultivations',
        'reports', 'training', 'profile',
        'farmer-detail', 'farmer-create', 'farmer-edit',
        'farmland-detail', 'farmland-create', 'farmland-edit',
        'cultivation-detail', 'cultivation-create', 'cultivation-edit',
        ...MASTER_DATA_KEYS,
      ])
      if (role === 'VSLA_PROVIDER_ADMIN' && !vslaProviderAllowed.has(activeModule)) {
        setActiveModule('dashboard')
      }

      // ReSET roles: redirect to dashboard if on a non-ReSET module
      const resetRoles = ['CONSORTIUM_ADMIN', 'PARTNER_ADMIN', 'RESET_FIELD_AGENT', 'RESET_ME_OFFICER']
      const resetAllowed = new Set([
        'dashboard', 'reset-dashboard', 'reset-beneficiaries', 'reset-vouchers',
        'reset-merchants', 'reset-cash', 'reset-reports', 'profile', 'support-tickets', 'quotes',
      ])
      if (resetRoles.includes(role) && !resetAllowed.has(activeModule)) {
        setActiveModule('dashboard')
      }

      // EKIBBO roles: redirect to dashboard if on an irrelevant module
      const ekbRoles = ['EKB_MD', 'EKB_OPS_MANAGER', 'EKB_FINANCE', 'EKB_FIN_ASSISTANT', 'EKB_MEC', 'EKB_EXTENSION']
      // Ekibbo tenant (any role, incl. shared TENANT_ADMIN): bounce off
      // modules that are excluded from the Ekibbo product.
      if (isEkibbo && (EKB_HIDDEN_MODULES as readonly string[]).includes(activeModule as string)) {
        setActiveModule('dashboard')
      }
      const ekbAllowed = new Set([
        'dashboard', 'farmers', 'farm-lands', 'cultivations', 'purchases', 'sales',
        'input-aggregation', 'input-distribution', 'approvals', 'processing', 'deliveries',
        'consignments', 'trace', 'reports', 'training', 'farm-visits', 'surveys',
        'compliance', 'cost-of-cultivation', 'farmer-ledger',
        'agritrack',
        'profile', 'support-tickets', 'farmer-detail', 'farmer-create', 'farmer-edit',
        'farmland-detail', 'farmland-create', 'farmland-edit',
        'cultivation-detail', 'cultivation-create', 'cultivation-edit',
        'settings',
        ...MASTER_DATA_KEYS,
      ])
      if (ekbRoles.includes(role) && !ekbAllowed.has(activeModule)) {
        setActiveModule('dashboard')
      }

      // EKIBBO Farmer (self-service): allow only farmer-facing modules.
      const ekbFarmerAllowed = new Set([
        'dashboard', 'profile', 'farmer-ledger', 'sales', 'purchases',
        'training', 'farm-visits',
        'farmer-detail', 'farm-lands', 'cultivations', 'surveys',
      ])
      if (role === 'EKB_FARMER' && !ekbFarmerAllowed.has(activeModule)) {
        setActiveModule('dashboard')
      }
    } else {
      setUser(null)
    }
  }, [session, setUser, setActiveModule, activeModule, isEkibbo])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-3 w-48 bg-muted/50 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  return <AuthenticatedApp />
}