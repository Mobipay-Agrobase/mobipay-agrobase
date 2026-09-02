import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { mapFarmer, resolveFarmerByNumericId, farmerSelect } from '@/lib/mobile/ekibbo-adapter'
import { farmerSelfAccess } from '@/lib/mobile/ekibbo-mobile-utils'

/**
 * GET /api/mobile/ekibbo-farmer/[id]
 *   id = numeric upstream id | 'me' (signed-in farmer)
 *
 * Farmer detail in the upstream envelope:
 *   { result, data: { farmer_data: {...} } }
 *
 * Tenant-scoped — numeric ids from another tenant never resolve.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { id } = await params

    let farmer: Record<string, unknown> | null = null
    let farmerRealId: string | null = null

    if (id === 'me') {
      const own = await db.farmerProfile.findFirst({
        where: { ...tf, userId: ctx.userId },
        select: farmerSelect,
      })
      farmer = own ? mapFarmer(own as any) : null
      farmerRealId = own?.id ?? null
    } else {
      const numId = parseInt(id, 10)
      if (Number.isNaN(numId)) {
        return NextResponse.json({ result: false, message: 'Invalid farmer id' }, { status: 400 })
      }
      const own = await resolveFarmerByNumericId(tf, numId)
      farmer = own ? mapFarmer(own) : null
      farmerRealId = own?.id ?? null
    }

    if (!farmer) {
      return NextResponse.json({ result: false, message: 'Farmer not found' }, { status: 404 })
    }

    // Farmer self-scope: farmer tokens may only read their OWN profile.
    if (!(await farmerSelfAccess(ctx, farmerRealId))) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }

    return NextResponse.json({ result: true, data: { farmer_data: farmer } })
  } catch (error) {
    console.error('[ekibbo-farmer/[id]]', error)
    return NextResponse.json({ result: false, message: 'Failed to fetch farmer' }, { status: 500 })
  }
}

/**
 * PUT /api/mobile/ekibbo-farmer/[id]
 *
 * Tolerant update handler for ALL farmer-detail sub-tab screens (family,
 * assets, bank, finance, equipment, animals, insurance, certificate).
 * Accepts the upstream payload shapes — each nests its data under a key
 * like data_family / data_asset / data_bank / data_finance / data_equipment /
 * data_animal / data_insurance / data_certificate — and maps the known
 * fields onto FarmerProfile columns + child tables. Returns { result: true }.
 */
function pick(body: Record<string, any>, keys: string[]): Record<string, any> {
  // search flat + one-level-deep (tab payloads nest under data_*)
  for (const k of Object.keys(body)) {
    if (typeof body[k] === 'object' && body[k] !== null && !Array.isArray(body[k])) {
      const inner = body[k]
      const hit = keys.filter(key => inner[key] !== undefined)
      if (hit.length) return inner
    }
  }
  return body
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { id } = await params

    const numId = parseInt(id, 10)
    if (Number.isNaN(numId)) {
      return NextResponse.json({ result: false, message: 'Invalid farmer id' }, { status: 400 })
    }
    const farmer = await resolveFarmerByNumericId(tf, numId)
    if (!farmer) {
      return NextResponse.json({ result: false, message: 'Farmer not found' }, { status: 404 })
    }

    // Farmer self-scope: farmer tokens may only edit their OWN profile.
    if (!(await farmerSelfAccess(ctx, farmer.id))) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))

    // ── Family / assets / finance / certificate → FarmerProfile columns ──
    const fam = pick(body, ['education', 'marial_status', 'spouse_name'])
    const asset = pick(body, ['housing_ownership', 'house_type'])
    const fin = pick(body, ['loan_taken_last_year', 'loan_taken_from', 'loan_amount', 'loan_purpose'])
    const cert = pick(body, ['is_certified_farmer', 'certification_type', 'year_of_ics'])

    const profileData: Record<string, unknown> = {}
    if (fam.education !== undefined) profileData.education = fam.education || null
    if (fam.marial_status !== undefined) profileData.maritalStatus = fam.marial_status || null
    if (fam.spouse_name !== undefined) profileData.spouseName = fam.spouse_name || null
    if (fam.parent_name !== undefined) profileData.guardianName = fam.parent_name || null
    if (fam.no_of_family !== undefined) profileData.familyMembers = parseInt(fam.no_of_family) || null
    if (fam.total_child_under_18_going_school !== undefined) {
      profileData.schoolGoingChildren = parseInt(fam.total_child_under_18_going_school) || null
    }
    if (fam.total_child_under_18 !== undefined) {
      const t = typeof fam.total_child_under_18 === 'object'
        ? (parseInt(fam.total_child_under_18.total) || (parseInt(fam.total_child_under_18.male) || 0) + (parseInt(fam.total_child_under_18.female) || 0))
        : (parseInt(fam.total_child_under_18) || null)
      profileData.childrenUnder18 = t
    }
    if (asset.housing_ownership !== undefined) profileData.housingOwnership = asset.housing_ownership || null
    if (asset.house_type !== undefined) profileData.houseType = asset.house_type || null
    if (Array.isArray(asset.consumer_electronics)) profileData.consumerElectronics = JSON.stringify(asset.consumer_electronics)
    if (Array.isArray(asset.vehicles)) profileData.vehicle = JSON.stringify(asset.vehicles)
    if (fin.loan_taken_last_year !== undefined) profileData.loanTakenLastYear = ['1', 1, 'true', true, 'Yes', 'yes'].includes(fin.loan_taken_last_year)
    if (fin.loan_taken_from !== undefined) profileData.loanTakenFrom = fin.loan_taken_from || null
    if (fin.loan_amount !== undefined) profileData.loanAmount = parseFloat(fin.loan_amount) || null
    if (fin.loan_purpose !== undefined) profileData.loanPurpose = fin.loan_purpose || null
    if (cert.is_certified_farmer !== undefined) profileData.isCertified = ['1', 1, 'true', true, 'Yes', 'yes'].includes(cert.is_certified_farmer)
    if (cert.certification_type !== undefined) profileData.certificationType = cert.certification_type || null
    if (cert.year_of_ics !== undefined) profileData.icsYear = String(cert.year_of_ics ?? '') || null

    // ── Bank accounts (JSON column) ──
    const bankArr = Array.isArray(body.bank_info) ? body.bank_info
      : Array.isArray(body.data_bank) ? body.data_bank
      : Array.isArray(body.bank_accounts) ? body.bank_accounts : null
    if (bankArr) {
      profileData.bankAccounts = JSON.stringify(bankArr.map((b: any) => ({
        accountType: b.accout_type ?? b.accountType ?? '',
        accountNo: b.accout_no ?? b.accountNo ?? '',
        bankName: b.bank_name ?? b.bankName ?? '',
        branchDetails: b.branch_details ?? b.branchDetails ?? '',
        sortCode: b.sort_code ?? b.sortCode ?? '',
      })))
    }

    if (Object.keys(profileData).length > 0) {
      await db.farmerProfile.update({ where: { id: farmer.id }, data: profileData })
    }

    // ── Equipment rows (replace-all) ──
    const equipArr = Array.isArray(body.farm_equipment) ? body.farm_equipment
      : Array.isArray(body.data_equipment) ? body.data_equipment : null
    if (equipArr) {
      await db.farmerFarmEquipment.deleteMany({ where: { farmerId: farmer.id } })
      for (const e of equipArr as any[]) {
        const name = e.farm_equipment_items ?? e.equipmentItem ?? e.equipment_name
        if (!name) continue
        await db.farmerFarmEquipment.create({
          data: {
            farmerId: farmer.id,
            equipmentName: String(name),
            count: parseInt(e.count) || 1,
            yearOfManufacture: parseInt(e.year_of_manufacture) || null,
            yearOfPurchase: parseInt(e.year_of_purchase) || null,
          },
        })
      }
    }

    // ── Animal husbandry rows (replace-all) ──
    const animalArr = Array.isArray(body.animal_husbandry) ? body.animal_husbandry
      : Array.isArray(body.data_animal) ? body.data_animal : null
    if (animalArr) {
      await db.farmerAnimalHusbandry.deleteMany({ where: { farmerId: farmer.id } })
      for (const a of animalArr as any[]) {
        const type = a.farm_animal ?? a.farmAnimal ?? a.animal_type
        if (!type) continue
        await db.farmerAnimalHusbandry.create({
          data: {
            farmerId: farmer.id,
            animalType: String(type),
            count: parseInt(a.animal_count ?? a.count) || 0,
            breedName: a.breed_name ?? null,
            fodder: a.fodder ?? null,
            animalHousing: a.animal_housing ?? null,
            revenue: parseFloat(a.revenue) || null,
            animalForGrowth: a.animal_for_growth ?? null,
          },
        })
      }
    }

    // ── Insurance rows (replace-all) ──
    const insArr = Array.isArray(body.insurance_info) ? body.insurance_info
      : Array.isArray(body.data_insurance) ? body.data_insurance : null
    if (insArr) {
      await db.farmerInsurance.deleteMany({ where: { farmerId: farmer.id } })
      for (const ins of insArr as any[]) {
        const type = ins.insurance_type ?? ins.type
        if (!type) continue
        await db.farmerInsurance.create({
          data: {
            farmerId: farmer.id,
            insuranceType: String(type),
            provider: ins.provider ?? null,
            amount: parseFloat(ins.amount) || null,
            cropInsured: ins.crop_insuranced ?? ins.cropInsured ?? null,
            areaInsured: parseFloat(ins.area_insuranced ?? ins.areaInsured) || null,
          },
        })
      }
    }

    return NextResponse.json({ result: true, message: 'Updated' })
  } catch (error: any) {
    console.error('[ekibbo-farmer PUT]', error)
    return NextResponse.json({ result: false, message: 'Update failed', detail: error.message }, { status: 500 })
  }
}
