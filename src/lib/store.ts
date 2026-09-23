import { create } from 'zustand'

export type ModuleKey =
  'dashboard' | 'farmers' | 'farm-lands' | 'cultivations' |
  'vsla' | 'sacco' | 'marketplace' | 'payments' | 'loans' |
  'reports' | 'training' | 'settings' | 'communication' | 'agritrack' |
  'profile' | 'companies' | 'input-aggregation' | 'purchases' | 'approvals' |
  'sales' | 'deliveries' | 'consignments' | 'processing' |
  'ccrp' | 'cohort1' | 'cohort2' | 'smile' | 'nakivaale' |
  'ivr' | 'feedback' | 'trace' | 'users' | 'surveys' |
  'farm-visits' | 'impact-assessment' | 'channel-sim' | 'compliance' | 'mfi' | 'transport' | 'plots' |
  // Core product modules
  'carbon' | 'farm5x' | 'cost-of-cultivation' | 'crop-stages' | 'crop-variety' |
  // Billing
  'billing' |
  // EKIBBO modules
  'input-distribution' | 'crop-insurance' |
  // Billing Engine
  'billing-operations' | 'platform-recovery' |
  'support-tickets' | 'quotes' |
  'nssf-contributions' | 'nssf-settlement' |
  // Reference
  'catalog-manager' | 'data-quality' |
  // Master data (seasons, crops, seeds, fertilizers, catalog)
  'season-master' | 'crop-master' | 'seed-master' | 'fertilizer-master' | 'master-data' |
  'equipment-master' | 'pesticide-master' | 'weed-master' | 'disease-master' | 'pest-master' | 'soiltype-master' |
  'location-master' | 'field-staff' | 'cooperatives' | 'farmer-groups' | 'farmer-mapping' |
  // ZIWA360 Dairy Farm Management
  'dairy' |
  'farmer-detail' | 'farmer-create' | 'farmer-edit' |
  'farmland-detail' | 'farmland-create' | 'farmland-edit' |
  'cultivation-detail' | 'cultivation-create' | 'cultivation-edit' |
  'training-create' | 'training-edit' | 'training-detail' |
  'roles-permissions' |
  'super-admin-overview' | 'super-admin-tenants' | 'super-admin-revenue' | 'super-admin-impact' | 'super-admin-users' | 'super-admin-mobile' | 'super-admin-config' | 'super-admin-module-store' | 'reset-dashboard' | 'reset-beneficiaries' | 'reset-vouchers' | 'reset-merchants' | 'reset-cash' | 'reset-reports'

interface AuthUser {
  userId: string
  role: string
  tenantId: string
  name: string
  email?: string
  phone?: string
  avatarUrl?: string
  country?: string
  currency?: string
  language?: string
}

interface AppState {
  activeModule: ModuleKey
  activeSubTab: string
  sidebarOpen: boolean
  selectedFarmerId: string | null
  selectedFarmId: string | null
  selectedFarmLandId: string | null
  selectedCultivationId: string | null
  selectedTrainingId: string | null
  selectedVslaGroupId: string | null
  user: AuthUser | null
  setActiveModule: (m: ModuleKey) => void
  setActiveSubTab: (t: string) => void
  setSidebarOpen: (o: boolean) => void
  setSelectedFarmerId: (id: string | null) => void
  setSelectedFarmId: (id: string | null) => void
  setSelectedFarmLandId: (id: string | null) => void
  setSelectedCultivationId: (id: string | null) => void
  setSelectedTrainingId: (id: string | null) => void
  setSelectedVslaGroupId: (id: string | null) => void
  setUser: (user: AuthUser | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'dashboard',
  activeSubTab: '',
  sidebarOpen: false,
  selectedFarmerId: null,
  selectedFarmId: null,
  selectedFarmLandId: null,
  selectedCultivationId: null,
  selectedTrainingId: null,
  selectedVslaGroupId: null,
  user: null,
  setActiveModule: (m) => set((state) => ({
    activeModule: m,
    activeSubTab: '',
    selectedFarmerId: m === 'farmer-detail' || m === 'farmer-edit' ? state.selectedFarmerId : null,
    selectedFarmId: (m === 'farm-lands' || m === 'cultivations' || m === 'farmland-detail' || m === 'farmland-edit') ? state.selectedFarmId : null,
    selectedFarmLandId: m === 'farmland-detail' || m === 'farmland-edit' || m === 'cultivation-create' ? state.selectedFarmLandId : null,
    selectedCultivationId: m === 'cultivation-detail' || m === 'cultivation-edit' ? state.selectedCultivationId : null,
    selectedVslaGroupId: null,
  })),
  setActiveSubTab: (t) => set({ activeSubTab: t }),
  setSidebarOpen: (o) => set({ sidebarOpen: o }),
  setSelectedFarmerId: (id) => set({ selectedFarmerId: id }),
  setSelectedFarmId: (id) => set({ selectedFarmId: id }),
  setSelectedFarmLandId: (id) => set({ selectedFarmLandId: id }),
  setSelectedCultivationId: (id) => set({ selectedCultivationId: id }),
  setSelectedTrainingId: (id) => set({ selectedTrainingId: id }),
  setSelectedVslaGroupId: (id) => set({ selectedVslaGroupId: id }),
  setUser: (user) => set({ user }),
}))

// Menus that are NOT applicable to the Ekibbo tenant and must be hidden for all
// EKB_* roles (sidebar, command palette, and module-router guard).
export const EKB_HIDDEN_MODULES = [
  'marketplace', 'payments', 'loans',           // Core Operations
  'carbon', 'crop-insurance',                    // Farm Management
  'crop-stages',                                 // Farm Management — not relevant to EKIBBO
  'impact-assessment',                           // Intelligence
  'communication', 'feedback', 'channel-sim',    // Engagement
  'mfi',                                         // Finance
  // EKiBBO Sheet-3 feedback: remove these modules
  'cultivations',                                // Sheet-3 I: "Remove cultivation"
  'farmer-animals',                              // Sheet-3 E: "Remove livestock module"
  'farmer-equipment',                            // Sheet-3 F: "Remove farm equipments sub-module"
] as const
// ZIWA360 (Dairy) — hidden modules. Only dairy + essential admin menus shown.
// All crop/farmer/coffee/NSSF/VSLA/trace/carbon modules are irrelevant for dairy.
export const ZIWA_HIDDEN_MODULES = [
  // Core Operations — not relevant for dairy
  'marketplace', 'payments', 'loans',
  // Farm Management — crops are irrelevant for dairy
  'farm-lands', 'cultivations', 'carbon', 'crop-insurance', 'crop-stages',
  'cost-of-cultivation', 'crop-variety',
  // Intelligence — not relevant for dairy
  'impact-assessment', 'agritrack',
  // Engagement — not relevant for dairy
  'communication', 'feedback', 'channel-sim',
  // Finance — NSSF/MFI not relevant for dairy
  'mfi', 'nssf-contributions', 'nssf-settlement',
  // Traceability — coffee traceability, not dairy
  'trace',
  // Compliance — coffee certifications, not dairy
  'compliance',
  // Programs — CCRP/SMILE/Nakivaale are health programs, not dairy
  'ccrp', 'cohort1', 'cohort2', 'smile', 'nakivaale',
  // Reset — mobile money reset, not relevant
  'reset-dashboard', 'reset-beneficiaries', 'reset-vouchers', 'reset-merchants', 'reset-cash', 'reset-reports',
  // VSLA — savings groups, not relevant for dairy farm
  'vsla', 'sacco',
  // Purchases/Sales — these are coffee purchases, not dairy
  'purchases', 'sales', 'input-aggregation', 'input-distribution',
  'approvals', 'processing', 'deliveries', 'consignments',
  // Master data — most are crop-focused
  'season-master', 'crop-master', 'seed-master', 'fertilizer-master',
  'equipment-master', 'pesticide-master', 'weed-master', 'disease-master', 'pest-master',
  'soiltype-master', 'cooperatives', 'farmer-groups', 'farmer-mapping',
  'cultivation-detail', 'cultivation-create', 'cultivation-edit',
  // Farmer detail sub-modules — dairy doesn't use this farmer CRUD
  'farmer-detail', 'farmer-create', 'farmer-edit',
  'farmland-detail', 'farmland-create', 'farmland-edit',
  // Training — dairy has its own training in the dairy module
  'training-create', 'training-edit', 'training-detail',
  // Carbon/billing modules — not relevant for dairy
  'carbon', 'billing-operations', 'platform-recovery',
  // IVR — not relevant
  'ivr',
  // Plots — land management, not dairy
  'plots',
] as const
