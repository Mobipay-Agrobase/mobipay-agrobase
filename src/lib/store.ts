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
  'farmer-detail' | 'farmer-create' | 'farmer-edit' |
  'purchase-create' | 'purchase-edit' | 'purchase-detail' | 'e2e-trace' |
  'sale-create' | 'sale-edit' | 'sale-detail' |
  'input-dist-create' | 'input-dist-edit' | 'input-dist-detail' |
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
  selectedPurchaseId: string | null
  selectedSaleId: string | null
  selectedInputDistId: string | null
  e2eTraceQuery: string | null
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
  setSelectedPurchaseId: (id: string | null) => void
  setSelectedSaleId: (id: string | null) => void
  setSelectedInputDistId: (id: string | null) => void
  setE2eTraceQuery: (q: string | null) => void
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
  selectedPurchaseId: null,
  selectedSaleId: null,
  selectedInputDistId: null,
  e2eTraceQuery: null,
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
  setSelectedPurchaseId: (id) => set({ selectedPurchaseId: id }),
  setSelectedSaleId: (id) => set({ selectedSaleId: id }),
  setSelectedInputDistId: (id) => set({ selectedInputDistId: id }),
  setE2eTraceQuery: (q) => set({ e2eTraceQuery: q }),
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
] as const