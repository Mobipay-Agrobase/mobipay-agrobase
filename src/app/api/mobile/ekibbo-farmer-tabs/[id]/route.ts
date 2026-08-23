import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { resolveFarmerByNumericId, numericId } from '@/lib/mobile/ekibbo-adapter'

/**
 * GET /api/mobile/ekibbo-farmer-tabs/[id]  (id = numeric upstream id)
 *
 * ALL farmer-detail sub-tab payloads in ONE response, in the exact upstream
 * JSON shapes the mobile tab parsers expect (each parser picks its own keys;
 * extra keys are ignored). Data sourced from the same Agrobase tables the
 * WEB farmer detail page uses:
 *   family_info (+ education/marital catalogs)
 *   asset_info  (+ housing/house/electronics/vehicle catalogs)
 *   bank_info   (+ account types) — from FarmerProfile.bankAccounts JSON
 *   finance_info (+ loan purpose catalog)
 *   insurance_info (+ crop list) — FarmerInsurance rows
 *   farm_equipment (+ catalog) — FarmerFarmEquipment rows
 *   animal_husbandry (+ 4 catalogs) — FarmerAnimalHusbandry rows
 *   certificate_info — isCertified / certificationType / icsYear
 */
const CATS = [
  'education_level', 'marital_status', 'housing_ownership', 'house_type',
  'consumer_electronics', 'vehicle_type', 'account_type', 'bank_uganda',
  'loan_purpose', 'farm_equipment', 'animal_type', 'fodder',
  'animal_housing', 'animal_for_growth',
]

function cat(items: Array<{ category: string; value: string; label: string | null }>, category: string) {
  const seen = new Set<string>()
  const out: Array<{ ID: number; NAME: string; name: string }> = []
  for (const i of items) {
    if (i.category !== category) continue
    // CatalogMaster holds global + tenant copies of the same value — dedupe
    if (seen.has(i.value)) continue
    seen.add(i.value)
    out.push({ ID: out.length + 1, NAME: i.label || i.value, name: i.value })
  }
  return out
}

function safeJson(raw: string | null): unknown[] {
  if (!raw) return []
  try {
    const p = JSON.parse(raw)
    return Array.isArray(p) ? p : []
  } catch {
    return []
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { id } = await params
    const numId = parseInt(id, 10)
    if (Number.isNaN(numId)) {
      return NextResponse.json({ result: true, data: {} }, { status: 200 })
    }

    const farmer = await resolveFarmerByNumericId(tf, numId)
    if (!farmer) {
      return NextResponse.json({ result: true, data: {} }, { status: 200 })
    }

    const [full, catalog, insurances, equipments, animals, crops] = await Promise.all([
      db.farmerProfile.findFirst({
        where: { id: farmer.id },
        select: {
          maritalStatus: true, spouseName: true, familyMembers: true,
          childrenUnder18: true, schoolGoingChildren: true, education: true,
          housingOwnership: true, houseType: true, consumerElectronics: true,
          vehicle: true, bankAccounts: true, loanTakenLastYear: true,
          loanTakenFrom: true, loanAmount: true, loanPurpose: true,
          isCertified: true, certificationType: true, icsYear: true,
        },
      }),
      db.catalogMaster.findMany({
        where: { isActive: true, category: { in: CATS } },
        select: { category: true, value: true, label: true },
        orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
        take: 1500,
      }),
      db.farmerInsurance.findMany({ where: { farmerId: farmer.id }, take: 50 }),
      db.farmerFarmEquipment.findMany({ where: { farmerId: farmer.id }, take: 50 }),
      db.farmerAnimalHusbandry.findMany({ where: { farmerId: farmer.id }, take: 50 }),
      db.cropMaster.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' }, take: 100 }),
    ])

    if (!full) {
      return NextResponse.json({ result: true, data: {} }, { status: 200 })
    }

    const electronics = safeJson(full.consumerElectronics).map((e: any) => String(e))
    const vehicles = safeJson(full.vehicle).map((e: any) => String(e))
    const banks = safeJson(full.bankAccounts) as Array<Record<string, any>>

    const childrenTotal = full.childrenUnder18 ?? 0
    const schoolTotal = full.schoolGoingChildren ?? 0

    return NextResponse.json({
      result: true,
      data: {
        // ── Family tab ──
        data_education: cat(catalog, 'education_level'),
        data_marial_status: cat(catalog, 'marital_status'),
        family_info: {
          id: numId,
          farmer_id: numId,
          marial_status: full.maritalStatus,
          parent_name: '',
          spouse_name: full.spouseName,
          no_of_family: full.familyMembers != null ? String(full.familyMembers) : '',
          total_child_under_18: { male: '', female: '', total: String(childrenTotal) },
          total_child_under_18_going_school: String(schoolTotal),
          education: full.education,
        },
        // ── Assets tab ──
        data_housing_owner: cat(catalog, 'housing_ownership'),
        data_house_type: cat(catalog, 'house_type'),
        data_consumer_electronic: cat(catalog, 'consumer_electronics'),
        data_vehicle: cat(catalog, 'vehicle_type'),
        asset_info: {
          housing_ownership: full.housingOwnership,
          house_type: full.houseType,
          consumer_electronics: electronics,
          vehicles: vehicles,
        },
        // ── Bank tab ──
        data_account_type: cat(catalog, 'account_type'),
        bank_info: banks.map((b, i) => ({
          id: i + 1,
          farmer_id: numId,
          accout_type: b.accountType || '',
          accout_no: b.accountNo || '',
          bank_name: b.bankName || '',
          branch_details: b.branchDetails || '',
          sort_code: b.sortCode || '',
        })),
        // ── Finance tab ──
        data_purpose: cat(catalog, 'loan_purpose'),
        finance_info: {
          id: numId,
          farmer_id: numId,
          loan_taken_last_year: full.loanTakenLastYear ? '1' : '0',
          loan_taken_from: full.loanTakenFrom,
          loan_amount: full.loanAmount != null ? String(full.loanAmount) : '',
          loan_purpose: full.loanPurpose,
        },
        // ── Insurance tab ──
        insurance_info: insurances.map(ins => ({
          id: numericId(ins.id),
          life_insurance: ins.insuranceType === 'Life' ? 'Yes' : 'No',
          health_insurance: ins.insuranceType === 'Health' ? 'Yes' : 'No',
          crop_insurance: ins.insuranceType === 'Crop' ? 'Yes' : 'No',
          social_insurance: ins.insuranceType === 'Social' ? 'Yes' : 'No',
          other_insurance: ins.insuranceType === 'Other' ? (ins.notes || 'Yes') : 'No',
          crop_insuranced: ins.cropInsured || '',
          area_insuranced: ins.areaInsured != null ? String(ins.areaInsured) : '',
        })),
        data_crop: crops.map((c, i) => ({ ID: i + 1, name: c.name })),
        // ── Equipment tab ──
        data_farm_equipment: cat(catalog, 'farm_equipment'),
        farm_equipment: equipments.map(eq => ({
          id: numericId(eq.id),
          farm_equipment_items: eq.equipmentName,
          count: eq.count != null ? String(eq.count) : '',
          year_of_manufacture: eq.yearOfManufacture != null ? String(eq.yearOfManufacture) : '',
          year_of_purchase: eq.yearOfPurchase != null ? String(eq.yearOfPurchase) : '',
        })),
        // ── Animals tab ──
        data_farm_animal: cat(catalog, 'animal_type'),
        data_fodder: cat(catalog, 'fodder'),
        data_animal_housing: cat(catalog, 'animal_housing'),
        data_animal_for_growth: cat(catalog, 'animal_for_growth'),
        animal_husbandry: animals.map(a => ({
          id: numericId(a.id),
          farm_animal: a.animalType,
          animal_count: a.count != null ? String(a.count) : '',
          fodder: a.fodder || '',
          animal_housing: a.animalHousing || '',
          revenue: a.revenue != null ? String(a.revenue) : '',
          breed_name: a.breedName || '',
          animal_for_growth: a.animalForGrowth || '',
        })),
        // ── Certificate tab ──
        certificate_info: {
          is_certified_farmer: full.isCertified ? '1' : '0',
          certification_type: full.certificationType,
          year_of_ics: full.icsYear != null ? String(full.icsYear) : '',
        },
      },
    })
  } catch (error: any) {
    console.error('[ekibbo-farmer-tabs]', error)
    return NextResponse.json({ result: true, data: {} }, { status: 200 })
  }
}
