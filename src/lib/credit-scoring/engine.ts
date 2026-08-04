/**
 * Agrobase V3 — Credit Scoring Engine (Excel-aligned 4-factor model)
 *
 * Based on the Credit Score Blueprint from the New Ecosystem Excel:
 *
 * Factor                  Weight   Data Points                        Scoring (0-100)
 * ─────────────────────── ─────── ─────────────────────────────────── ─────────────────────────────
 * Demographics            15%      Age, Education, Marital, Family    (Age + Education + Marital + Family) / 4
 * Asset Ownership         25%      Land, House, Equipment, Livestock  (Land + House + Equipment + Livestock) / 4
 * Crop Performance        25%      Crop Type, Yield, Productivity     (Crop + Yield + Productivity) / 3
 * Financial Discipline    35%      Loan, Repayment, Insurance          (Loan + Repayment + Insurance) / 3
 *
 * Total = Demographics×0.15 + Assets×0.25 + Crop×0.25 + Financial×0.35
 * Scale: 0-1000 (multiply by 10)
 *
 * Risk categories:
 *   HIGH:   0 – 400
 *   MEDIUM: 401 – 700
 *   LOW:    701 – 1000
 *
 * Integration points:
 *   - Farmer Registration → demographics + assets data
 *   - Cultivation + Yield → crop performance data
 *   - VSLA loans + repayment → financial discipline data
 *   - Insurance data → financial discipline data
 *   - MFI loan underwriting consumes the score
 *   - Impact KPI I-04 (loan repayment) feeds back
 */

import { db } from '@/lib/db'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreditScoreResult {
  score: number                 // 0-1000
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH'
  demographicsScore: number     // 0-100
  assetScore: number            // 0-100
  cropScore: number             // 0-100
  financialScore: number        // 0-100
  totalScore: number            // 0-100 (before ×10)
  breakdown: {
    demographics: { age: number; education: number; marital: number; family: number }
    assets: { land: number; house: number; equipment: number; livestock: number }
    crop: { cropType: number; yield: number; productivity: number }
    financial: { loan: number; repayment: number; insurance: number }
  }
  recommendations: string[]
}

// ─── Weights (from Excel: Credit Score Blue Print sheet) ────────────────────

const WEIGHTS = {
  DEMOGRAPHICS: 0.15,
  ASSETS: 0.25,
  CROP_PERFORMANCE: 0.25,
  FINANCIAL_DISCIPLINE: 0.35,
} as const

// ─── Credit Scoring Engine ───────────────────────────────────────────────────

export class CreditScoringEngine {
  /**
   * Calculate a credit score for a farmer using the Excel 4-factor model.
   *
   * @param farmerId - The farmer's profile ID
   * @returns Full credit score result with per-factor breakdown
   */
  async calculateScore(farmerId: string): Promise<CreditScoreResult> {
    const farmer = await db.farmerProfile.findUnique({
      where: { id: farmerId },
      select: {
        id: true, createdAt: true, tenantId: true,
        dateOfBirth: true, education: true, maritalStatus: true,
        familyMembers: true,
        housingOwnership: true, houseType: true,
        farmSize: true, farmOwnership: true,
        farmEquipment: true, livestockTypes: true,
        loanTakenLastYear: true, loanAmount: true, loanRepaymentAmount: true,
        insuranceData: true,
        mainCrops: true,
        // New multi-entry models
        farmerBankAccounts: { select: { id: true, isPrimary: true } },
        farmerInsurances: { select: { id: true, insuranceType: true, amount: true } },
        farmerAnimals: { select: { id: true, animalType: true, count: true, revenue: true } },
        farmerEquipment: { select: { id: true, equipmentName: true, count: true } },
      },
    })

    if (!farmer) {
      throw new Error(`Farmer ${farmerId} not found`)
    }

    // ─── Compute each factor (0-100 scale) ───────────────────
    const demographics = await this.computeDemographics(farmer)
    const assets = await this.computeAssets(farmer)
    const crop = await this.computeCropPerformance(farmerId, farmer)
    const financial = await this.computeFinancialDiscipline(farmerId, farmer)

    // Weighted total (0-100)
    const totalScore =
      demographics.avg * WEIGHTS.DEMOGRAPHICS +
      assets.avg * WEIGHTS.ASSETS +
      crop.avg * WEIGHTS.CROP_PERFORMANCE +
      financial.avg * WEIGHTS.FINANCIAL_DISCIPLINE

    // Scale to 0-1000
    const score = Math.round(totalScore * 10)

    const riskCategory: CreditScoreResult['riskCategory'] =
      score >= 701 ? 'LOW' : score >= 401 ? 'MEDIUM' : 'HIGH'

    const recommendations = this.generateRecommendations({
      demographics: demographics.avg,
      assets: assets.avg,
      crop: crop.avg,
      financial: financial.avg,
    }, riskCategory)

    return {
      score,
      riskCategory,
      demographicsScore: Math.round(demographics.avg),
      assetScore: Math.round(assets.avg),
      cropScore: Math.round(crop.avg),
      financialScore: Math.round(financial.avg),
      totalScore: Math.round(totalScore * 10) / 10,
      breakdown: {
        demographics: demographics.detail,
        assets: assets.detail,
        crop: crop.detail,
        financial: financial.detail,
      },
      recommendations,
    }
  }

  // ─── Factor 1: Demographics (15%) ──────────────────────────
  // Age: 25-50=100, 18-24=80, 51-65=70, >65=50
  // Education: PG/UG=100, Secondary=70, Primary=50
  // Marital: Married=100, Unmarried=80, Widow=60
  // Family: ≤4=100, 5-6=80, >6=60
  private async computeDemographics(farmer: any): Promise<{ avg: number; detail: { age: number; education: number; marital: number; family: number } }> {
    // Age
    let age = 50
    if (farmer.dateOfBirth) {
      const ageYears = Math.floor((Date.now() - farmer.dateOfBirth.getTime()) / (365.25 * 86400000))
      if (ageYears >= 25 && ageYears <= 50) age = 100
      else if (ageYears >= 18 && ageYears <= 24) age = 80
      else if (ageYears >= 51 && ageYears <= 65) age = 70
      else age = 50
    }

    // Education
    const educationScores: Record<string, number> = { PG: 100, UG: 100, Secondary: 70, Primary: 50, Other: 50 }
    const education = educationScores[farmer.education] ?? 50

    // Marital
    const maritalScores: Record<string, number> = { Married: 100, 'Un-Married': 80, Unmarried: 80, Widow: 60 }
    const marital = maritalScores[farmer.maritalStatus] ?? 60

    // Family size
    const famSize = farmer.familyMembers || 0
    const family = famSize <= 4 ? 100 : famSize <= 6 ? 80 : 60

    const avg = (age + education + marital + family) / 4
    return { avg, detail: { age, education, marital, family } }
  }

  // ─── Factor 2: Asset Ownership (25%) ───────────────────────
  // Land: >5ha=100, 2-5=80, 1-2=60, <1=50
  // House: Brick=100, Wooden=70, Hut=50
  // Equipment: Tractor+Irrigation=100, one=70, none=50
  // Livestock: >10=100, 5-10=80, <5=60
  private async computeAssets(farmer: any): Promise<{ avg: number; detail: { land: number; house: number; equipment: number; livestock: number } }> {
    // Land
    const landHa = farmer.farmSize || 0
    const land = landHa > 5 ? 100 : landHa >= 2 ? 80 : landHa >= 1 ? 60 : 50

    // House
    const houseScores: Record<string, number> = { 'Brick house': 100, 'Brick House': 100, 'Wooden house': 70, 'Wooden House': 70, Hut: 50, 'Mud House': 50, Other: 50 }
    const house = houseScores[farmer.houseType] ?? 50

    // Equipment — use new multi-entry model first, fall back to JSON
    let equipment = 50
    const farmerEquip = farmer.farmerEquipment || []
    if (farmerEquip.length > 0) {
      const hasTractor = farmerEquip.some((e: any) => e.equipmentName?.toLowerCase().includes('tractor'))
      const hasIrrigation = farmerEquip.some((e: any) => e.equipmentName?.toLowerCase().includes('irrigation') || e.equipmentName?.toLowerCase().includes('pump'))
      const totalCount = farmerEquip.reduce((s: number, e: any) => s + (e.count || 1), 0)
      if (hasTractor && hasIrrigation) equipment = 100
      else if (hasTractor || hasIrrigation || totalCount >= 3) equipment = 80
      else if (totalCount > 0) equipment = 70
    } else {
      // Fall back to old JSON field
      try {
        const equipmentList = farmer.farmEquipment ? JSON.parse(farmer.farmEquipment) : []
        const hasTractor = equipmentList.some((e: any) => e.item?.toLowerCase().includes('tractor'))
        const hasIrrigation = equipmentList.some((e: any) => e.item?.toLowerCase().includes('irrigation'))
        if (hasTractor && hasIrrigation) equipment = 100
        else if (hasTractor || hasIrrigation || equipmentList.length > 0) equipment = 70
      } catch { /* default 50 */ }
    }

    // Livestock — use new multi-entry model first, fall back to JSON
    let livestock = 60
    const farmerAnimals = farmer.farmerAnimals || []
    if (farmerAnimals.length > 0) {
      const totalAnimals = farmerAnimals.reduce((s: number, a: any) => s + (a.count || 0), 0)
      const totalRevenue = farmerAnimals.reduce((s: number, a: any) => s + (a.revenue || 0), 0)
      if (totalAnimals > 20 || totalRevenue > 1000000) livestock = 100
      else if (totalAnimals >= 5 || totalRevenue > 200000) livestock = 80
      else if (totalAnimals > 0) livestock = 70
    } else {
      try {
        const livestockList = farmer.livestockTypes ? JSON.parse(farmer.livestockTypes) : []
        livestock = livestockList.length > 3 ? 100 : livestockList.length >= 1 ? 80 : 60
      } catch { /* default 60 */ }
    }

    const avg = (land + house + equipment + livestock) / 4
    return { avg, detail: { land, house, equipment, livestock } }
  }

  // ─── Factor 3: Crop Performance (25%) ──────────────────────
  // Crop: High-value=100, Staples=80, Others=60
  // Yield: ≥90% of estimated=100, 70-89%=80, <70%=50
  // Productivity: >5t/ha=100, 3-5=80, <3=50
  private async computeCropPerformance(farmerId: string, farmer: any): Promise<{ avg: number; detail: { cropType: number; yield: number; productivity: number } }> {
    // Fetch cultivations
    const cultivations = await db.cultivation.findMany({
      where: { farm: { farmerId } },
      select: { cropName: true, estimatedYield: true, actualYield: true, cultivationAreaHa: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
    })

    // Crop type
    const highValueCrops = ['Coffee', 'Cocoa', 'Vanilla', 'Tea', 'Avocado']
    const stapleCrops = ['Maize', 'Rice', 'Beans', 'Cassava', 'Banana', 'Sorghum', 'Groundnuts']
    let cropType = 60
    if (cultivations.length > 0) {
      const mainCrop = cultivations[0].cropName
      if (highValueCrops.some(c => mainCrop.toLowerCase().includes(c.toLowerCase()))) cropType = 100
      else if (stapleCrops.some(c => mainCrop.toLowerCase().includes(c.toLowerCase()))) cropType = 80
    }

    // Yield ratio (actual / estimated)
    let yieldScore = 50
    if (cultivations.length > 0 && cultivations[0].estimatedYield && cultivations[0].actualYield) {
      const ratio = cultivations[0].actualYield / cultivations[0].estimatedYield
      if (ratio >= 0.9) yieldScore = 100
      else if (ratio >= 0.7) yieldScore = 80
      else yieldScore = 50
    }

    // Productivity (yield per hectare)
    let productivity = 50
    if (cultivations.length > 0 && cultivations[0].actualYield && cultivations[0].cultivationAreaHa) {
      const tPerHa = cultivations[0].actualYield / 1000 / cultivations[0].cultivationAreaHa // kg → tonnes
      if (tPerHa > 5) productivity = 100
      else if (tPerHa >= 3) productivity = 80
      else productivity = 50
    }

    const avg = (cropType + yieldScore + productivity) / 3
    return { avg, detail: { cropType, yield: yieldScore, productivity } }
  }

  // ─── Factor 4: Financial Discipline (35%) ──────────────────
  // Loan: No loan=100, Yes <50% income=80, >50%=60
  // Repayment: On-time=100, Late=70, Defaulted=50
  // Insurance: Has insurance=100, No=60
  private async computeFinancialDiscipline(farmerId: string, farmer: any): Promise<{ avg: number; detail: { loan: number; repayment: number; insurance: number } }> {
    // Loan burden
    let loan = 100
    if (farmer.loanTakenLastYear && farmer.loanAmount) {
      loan = farmer.loanAmount > 500 ? 60 : 80
    }

    // Repayment timeliness (from VSLA V1 + V2 loan history)
    // V1 loans
    const vslaLoansV1 = await db.vslaLoan.findMany({
      where: { farmerId },
      select: { status: true, amount: true },
    })

    // V2 loans — match by phone number since V2 members link to farmers by phone
    const farmerPhone = farmer.phone || farmer.phoneNumber
    let vslaLoansV2: any[] = []
    if (farmerPhone) {
      const v2Member = await db.vslaMemberV2.findFirst({
        where: { phone: farmerPhone },
        select: { id: true },
      })
      if (v2Member) {
        vslaLoansV2 = await db.vslaLoanV2.findMany({
          where: { memberId: v2Member.id },
          select: { status: true, amount: true, amountRepaid: true, totalRepayable: true, outstanding: true },
        })
      }
    }

    const allLoans = [...vslaLoansV1, ...vslaLoansV2]
    let repayment = 100

    if (allLoans.length > 0) {
      const defaulted = allLoans.filter(l => l.status === 'DEFAULTED' || l.status === 'WRITTEN_OFF').length
      const overdue = allLoans.filter(l => l.status === 'OVERDUE').length
      const repaid = allLoans.filter(l => l.status === 'REPAID').length
      const total = allLoans.length

      if (defaulted > 0) {
        repayment = 30 // Major red flag
      } else if (overdue > 0) {
        repayment = 60 // Yellow flag
      } else if (repaid === total) {
        // All loans fully repaid — excellent
        repayment = 100
      } else {
        // Some active loans, no defaults — good
        repayment = 85
      }

      // V2 bonus: if repayment ratio is high, boost score
      const totalRepaid = vslaLoansV2.reduce((sum, l) => sum + (l.amountRepaid || 0), 0)
      const totalRepayable = vslaLoansV2.reduce((sum, l) => sum + (l.totalRepayable || 0), 0)
      if (totalRepayable > 0) {
        const repaymentRatio = totalRepaid / totalRepayable
        if (repaymentRatio > 0.8 && defaulted === 0) {
          repayment = Math.min(100, repayment + 10) // Boost for good V2 repayment history
        }
      }
    }

    // Insurance coverage — use new multi-entry model first, fall back to JSON
    let insurance = 60
    const farmerIns = farmer.farmerInsurances || []
    if (farmerIns.length > 0) {
      // Has at least one insurance record
      const hasLifeOrHealth = farmerIns.some((i: any) => i.insuranceType === 'Life' || i.insuranceType === 'Health')
      const hasCrop = farmerIns.some((i: any) => i.insuranceType === 'Crop')
      const totalAmount = farmerIns.reduce((s: number, i: any) => s + (i.amount || 0), 0)
      if (hasLifeOrHealth && hasCrop) insurance = 100
      else if (hasLifeOrHealth || hasCrop) insurance = 85
      else if (farmerIns.length > 0) insurance = 75
    } else {
      try {
        const insData = farmer.insuranceData ? JSON.parse(farmer.insuranceData) : {}
        const hasAny = insData.life || insData.health || insData.crop || insData.social
        if (hasAny) insurance = 100
      } catch { /* default 60 */ }
    }

    const avg = (loan + repayment + insurance) / 3
    return { avg, detail: { loan, repayment, insurance } }
  }

  // ─── Recommendations ───────────────────────────────────────
  private generateRecommendations(
    scores: { demographics: number; assets: number; crop: number; financial: number },
    risk: 'LOW' | 'MEDIUM' | 'HIGH',
  ): string[] {
    const recs: string[] = []

    if (scores.demographics < 60) recs.push('Improve demographics score: complete education level and family size data')
    if (scores.assets < 60) recs.push('Asset score low: record farm equipment and livestock to improve score')
    if (scores.crop < 60) recs.push('Crop performance low: track actual yields and update estimated yields')
    if (scores.financial < 60) recs.push('Financial discipline low: enroll in crop insurance and maintain timely VSLA repayments')

    if (risk === 'HIGH') recs.push('HIGH RISK: Recommend financial literacy training before loan approval')
    if (risk === 'MEDIUM') recs.push('MEDIUM RISK: Approve loans with collateral or guarantor')
    if (risk === 'LOW') recs.push('LOW RISK: Eligible for prime loan rates')

    return recs
  }
}

// ─── Export singleton ────────────────────────────────────────────────────────
export const creditScoringEngine = new CreditScoringEngine()
