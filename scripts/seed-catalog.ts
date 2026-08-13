import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed CatalogMaster with all dropdown values from the Farmer Up-Stream Application Excel spec.
 * Run: npx tsx scripts/seed-catalog.ts
 */

interface CatalogEntry {
  category: string
  value: string
  label?: string
  sortOrder?: number
}

const CATALOG_ENTRIES: CatalogEntry[] = [
  // ============================================
  // FARMER REGISTRATION
  // ============================================
  
  // Enrollment Place
  { category: 'enrollment_place', value: 'At Farmer Place', sortOrder: 1 },
  { category: 'enrollment_place', value: 'At Cooperative', sortOrder: 2 },
  { category: 'enrollment_place', value: 'At Farmer Organization', sortOrder: 3 },
  { category: 'enrollment_place', value: 'At Warehouse', sortOrder: 4 },

  // Certification Type
  { category: 'certification_type', value: 'Individual', sortOrder: 1 },
  { category: 'certification_type', value: 'Group', sortOrder: 2 },

  // Member Type
  { category: 'member_type', value: 'General', sortOrder: 1 },
  { category: 'member_type', value: 'Commercial', sortOrder: 2 },

  // Gender
  { category: 'gender', value: 'Male', sortOrder: 1 },
  { category: 'gender', value: 'Female', sortOrder: 2 },
  { category: 'gender', value: 'Other', sortOrder: 3 },

  // Education Level
  { category: 'education_level', value: 'Primary', sortOrder: 1 },
  { category: 'education_level', value: 'Secondary', sortOrder: 2 },
  { category: 'education_level', value: 'UG', label: 'Undergraduate', sortOrder: 3 },
  { category: 'education_level', value: 'PG', label: 'Postgraduate', sortOrder: 4 },
  { category: 'education_level', value: 'Other', sortOrder: 5 },

  // Marital Status
  { category: 'marital_status', value: 'Un-Married', sortOrder: 1 },
  { category: 'marital_status', value: 'Married', sortOrder: 2 },
  { category: 'marital_status', value: 'Widow', sortOrder: 3 },

  // National ID Type
  { category: 'national_id_type', value: 'National ID No', sortOrder: 1 },
  { category: 'national_id_type', value: 'Driving License', sortOrder: 2 },
  { category: 'national_id_type', value: 'Passport', sortOrder: 3 },

  // Country
  { category: 'country', value: 'Uganda', sortOrder: 1 },
  { category: 'country', value: 'Ghana', sortOrder: 2 },
  { category: 'country', value: 'Kenya', sortOrder: 3 },
  { category: 'country', value: 'Rwanda', sortOrder: 4 },
  { category: 'country', value: 'Tanzania', sortOrder: 5 },

  // ============================================
  // FAMILY INFORMATION
  // ============================================
  // (No dropdowns needed - all are numeric inputs)

  // ============================================
  // ASSET INFORMATION
  // ============================================

  // Housing Ownership
  { category: 'housing_ownership', value: 'Owned', sortOrder: 1 },
  { category: 'housing_ownership', value: 'Rent', sortOrder: 2 },
  { category: 'housing_ownership', value: 'Lease', sortOrder: 3 },

  // House Type
  { category: 'house_type', value: 'Brick house', sortOrder: 1 },
  { category: 'house_type', value: 'Wooden house', sortOrder: 2 },
  { category: 'house_type', value: 'Hut', sortOrder: 3 },
  { category: 'house_type', value: 'Other', sortOrder: 4 },

  // Consumer Electronics
  { category: 'consumer_electronics', value: 'TV', sortOrder: 1 },
  { category: 'consumer_electronics', value: 'Washing Machine', sortOrder: 2 },
  { category: 'consumer_electronics', value: 'Air Conditioner', sortOrder: 3 },
  { category: 'consumer_electronics', value: 'Fridge', sortOrder: 4 },

  // Vehicle
  { category: 'vehicle_type', value: 'Bike', sortOrder: 1 },
  { category: 'vehicle_type', value: 'Car', sortOrder: 2 },
  { category: 'vehicle_type', value: 'Boat', sortOrder: 3 },

  // ============================================
  // FINANCE INFORMATION
  // ============================================

  // Account Type
  { category: 'account_type', value: 'Current', sortOrder: 1 },
  { category: 'account_type', value: 'Savings', sortOrder: 2 },
  { category: 'account_type', value: 'Salary', sortOrder: 3 },
  { category: 'account_type', value: 'Fixed Deposit', sortOrder: 4 },
  { category: 'account_type', value: 'Recurring Deposit', sortOrder: 5 },

  // Loan Source
  { category: 'loan_source', value: 'Bank', sortOrder: 1 },
  { category: 'loan_source', value: 'Relative', sortOrder: 2 },
  { category: 'loan_source', value: 'Friend', sortOrder: 3 },
  { category: 'loan_source', value: 'Farming Contract', sortOrder: 4 },
  { category: 'loan_source', value: 'Other', sortOrder: 5 },

  // Loan Purpose
  { category: 'loan_purpose', value: 'Crop Loan', sortOrder: 1 },
  { category: 'loan_purpose', value: 'House Loan', sortOrder: 2 },
  { category: 'loan_purpose', value: 'Vehicle Loan', sortOrder: 3 },
  { category: 'loan_purpose', value: 'Farm Inputs', sortOrder: 4 },
  { category: 'loan_purpose', value: 'Equipment', sortOrder: 5 },
  { category: 'loan_purpose', value: 'Education', sortOrder: 6 },
  { category: 'loan_purpose', value: 'Medical', sortOrder: 7 },
  { category: 'loan_purpose', value: 'Other', sortOrder: 8 },

  // Loan Interest Period
  { category: 'loan_interest_period', value: 'Monthly', sortOrder: 1 },
  { category: 'loan_interest_period', value: 'Yearly', sortOrder: 2 },

  // ============================================
  // INSURANCE INFORMATION
  // ============================================

  // Insurance Type
  { category: 'insurance_type', value: 'Life', sortOrder: 1 },
  { category: 'insurance_type', value: 'Health', sortOrder: 2 },
  { category: 'insurance_type', value: 'Crop', sortOrder: 3 },
  { category: 'insurance_type', value: 'Social', sortOrder: 4 },
  { category: 'insurance_type', value: 'Other', sortOrder: 5 },

  // ============================================
  // FARM EQUIPMENT
  // ============================================

  // Farm Equipment Items
  { category: 'farm_equipment', value: 'Tractor', sortOrder: 1 },
  { category: 'farm_equipment', value: 'Power Tiller', sortOrder: 2 },
  { category: 'farm_equipment', value: 'Sprayer', sortOrder: 3 },
  { category: 'farm_equipment', value: 'Harvester', sortOrder: 4 },
  { category: 'farm_equipment', value: 'Irrigation Pump', sortOrder: 5 },
  { category: 'farm_equipment', value: 'Hand Tools', sortOrder: 6 },
  { category: 'farm_equipment', value: 'Ox Plow', sortOrder: 7 },
  { category: 'farm_equipment', value: 'Thresher', sortOrder: 8 },
  { category: 'farm_equipment', value: 'Drying Yard', sortOrder: 9 },
  { category: 'farm_equipment', value: 'Storage Bin', sortOrder: 10 },

  // ============================================
  // ANIMAL HUSBANDRY
  // ============================================

  // Animal Type
  { category: 'animal_type', value: 'Cow', sortOrder: 1 },
  { category: 'animal_type', value: 'Hen', sortOrder: 2 },
  { category: 'animal_type', value: 'Goat', sortOrder: 3 },
  { category: 'animal_type', value: 'Sheep', sortOrder: 4 },
  { category: 'animal_type', value: 'Pig', sortOrder: 5 },
  { category: 'animal_type', value: 'Duck', sortOrder: 6 },
  { category: 'animal_type', value: 'Rabbit', sortOrder: 7 },
  { category: 'animal_type', value: 'Fish', sortOrder: 8 },
  { category: 'animal_type', value: 'Bee', sortOrder: 9 },

  // Fodder
  { category: 'fodder', value: 'Straw', sortOrder: 1 },
  { category: 'fodder', value: 'Grass', sortOrder: 2 },
  { category: 'fodder', value: 'Dry', sortOrder: 3 },
  { category: 'fodder', value: 'Corn', sortOrder: 4 },
  { category: 'fodder', value: 'Silage', sortOrder: 5 },
  { category: 'fodder', value: 'Hay', sortOrder: 6 },

  // Animal Housing
  { category: 'animal_housing', value: 'Shed', sortOrder: 1 },
  { category: 'animal_housing', value: 'Hut', sortOrder: 2 },
  { category: 'animal_housing', value: 'Barn', sortOrder: 3 },
  { category: 'animal_housing', value: 'Free Range', sortOrder: 4 },
  { category: 'animal_housing', value: 'Cage', sortOrder: 5 },

  // Animal For Growth (Purpose)
  { category: 'animal_for_growth', value: 'Meat', sortOrder: 1 },
  { category: 'animal_for_growth', value: 'Milk', sortOrder: 2 },
  { category: 'animal_for_growth', value: 'Eggs', sortOrder: 3 },
  { category: 'animal_for_growth', value: 'Draught', sortOrder: 4 },
  { category: 'animal_for_growth', value: 'Wool', sortOrder: 5 },
  { category: 'animal_for_growth', value: 'Honey', sortOrder: 6 },

  // ============================================
  // FARM LAND CREATION
  // ============================================

  // Land Ownership
  { category: 'land_ownership', value: 'Owned', sortOrder: 1 },
  { category: 'land_ownership', value: 'Rent', sortOrder: 2 },
  { category: 'land_ownership', value: 'Lease', sortOrder: 3 },

  // Land Topology
  { category: 'land_topology', value: 'Valley', sortOrder: 1 },
  { category: 'land_topology', value: 'Plains', sortOrder: 2 },
  { category: 'land_topology', value: 'Plateaus', sortOrder: 3 },

  // Land Gradient
  { category: 'land_gradient', value: 'Up Land', sortOrder: 1 },
  { category: 'land_gradient', value: 'Low Land', sortOrder: 2 },

  // Approach Road
  { category: 'approach_road', value: 'Close main road', sortOrder: 1 },
  { category: 'approach_road', value: 'Inner field', sortOrder: 2 },
  { category: 'approach_road', value: 'Close main canal', sortOrder: 3 },

  // Water Source
  { category: 'water_source', value: 'Well', sortOrder: 1 },
  { category: 'water_source', value: 'Bore Well', sortOrder: 2 },
  { category: 'water_source', value: 'Pump', sortOrder: 3 },
  { category: 'water_source', value: 'River', sortOrder: 4 },
  { category: 'water_source', value: 'Lake', sortOrder: 5 },
  { category: 'water_source', value: 'Rainwater', sortOrder: 6 },

  // Power Source
  { category: 'power_source', value: 'Solar', sortOrder: 1 },
  { category: 'power_source', value: 'Electricity', sortOrder: 2 },
  { category: 'power_source', value: 'Fuel', sortOrder: 3 },
  { category: 'power_source', value: 'None', sortOrder: 4 },

  // Soil Fertility
  { category: 'soil_fertility', value: 'Good', sortOrder: 1 },
  { category: 'soil_fertility', value: 'Normal', sortOrder: 2 },
  { category: 'soil_fertility', value: 'Poor', sortOrder: 3 },

  // Irrigation Source
  { category: 'irrigation_source', value: 'Rainfed', sortOrder: 1 },
  { category: 'irrigation_source', value: 'Irrigated', sortOrder: 2 },

  // Irrigation Type
  { category: 'irrigation_type', value: 'Drip', sortOrder: 1 },
  { category: 'irrigation_type', value: 'Canal', sortOrder: 2 },
  { category: 'irrigation_type', value: 'Sprinkler', sortOrder: 3 },
  { category: 'irrigation_type', value: 'Flood', sortOrder: 4 },
  { category: 'irrigation_type', value: 'Others', sortOrder: 5 },

  // Worker Type
  { category: 'worker_type', value: 'Full-time', sortOrder: 1 },
  { category: 'worker_type', value: 'Part-time', sortOrder: 2 },
  { category: 'worker_type', value: 'Family Member', sortOrder: 3 },

  // Conversion Status
  { category: 'conversion_status', value: 'IC-1', sortOrder: 1 },
  { category: 'conversion_status', value: 'IC-2', sortOrder: 2 },
  { category: 'conversion_status', value: 'IC-3', sortOrder: 3 },
  { category: 'conversion_status', value: 'Organic', sortOrder: 4 },
  { category: 'conversion_status', value: 'SRP', sortOrder: 5 },

  // Certification Standard
  { category: 'certification_standard', value: 'NPOP', sortOrder: 1 },
  { category: 'certification_standard', value: 'NOP', sortOrder: 2 },

  // Soil Criteria
  { category: 'soil_criteria', value: 'pH', sortOrder: 1 },
  { category: 'soil_criteria', value: 'Sulphur (S)', sortOrder: 2 },
  { category: 'soil_criteria', value: 'Nitrogen (N)', sortOrder: 3 },
  { category: 'soil_criteria', value: 'Phosphorus (P)', sortOrder: 4 },
  { category: 'soil_criteria', value: 'Potassium (K)', sortOrder: 5 },
  { category: 'soil_criteria', value: 'Organic Matter', sortOrder: 6 },
  { category: 'soil_criteria', value: 'EC', sortOrder: 7 },

  // Soil Criteria UOM
  { category: 'soil_criteria_uom', value: 'ppm', sortOrder: 1 },
  { category: 'soil_criteria_uom', value: 'mg/g', sortOrder: 2 },
  { category: 'soil_criteria_uom', value: 'meq/100g', sortOrder: 3 },
  { category: 'soil_criteria_uom', value: '%', sortOrder: 4 },

  // ============================================
  // CULTIVATION CREATION
  // ============================================

  // Crop Category
  { category: 'crop_category', value: 'Main Crop', sortOrder: 1 },
  { category: 'crop_category', value: 'Inter Crop', sortOrder: 2 },
  { category: 'crop_category', value: 'Border Crop', sortOrder: 3 },

  // Seed Source
  { category: 'seed_source', value: 'Seed Company', sortOrder: 1 },
  { category: 'seed_source', value: 'Agent', sortOrder: 2 },
  { category: 'seed_source', value: 'Self-save', sortOrder: 3 },

  // Seed Type
  { category: 'seed_type', value: 'Certified 1', sortOrder: 1 },
  { category: 'seed_type', value: 'Certified 2', sortOrder: 2 },
  { category: 'seed_type', value: 'Self-save', sortOrder: 3 },
  { category: 'seed_type', value: 'Other', sortOrder: 4 },

  // Type of Sowing
  { category: 'sowing_type', value: 'Row sowing', sortOrder: 1 },
  { category: 'sowing_type', value: 'Hand sowing', sortOrder: 2 },
  { category: 'sowing_type', value: 'Drone sowing', sortOrder: 3 },
  { category: 'sowing_type', value: 'Transplanting', sortOrder: 4 },
  { category: 'sowing_type', value: 'Re-planting', sortOrder: 5 },

  // Sowing Charges By
  { category: 'sowing_charges_by', value: 'Hour', sortOrder: 1 },
  { category: 'sowing_charges_by', value: 'Hectare', sortOrder: 2 },

  // ============================================
  // CROP MASTER
  // ============================================

  // Crop Category (Master)
  { category: 'crop_master_category', value: 'Field Crop', sortOrder: 1 },
  { category: 'crop_master_category', value: 'Oil Seed', sortOrder: 2 },
  { category: 'crop_master_category', value: 'Spices', sortOrder: 3 },
  { category: 'crop_master_category', value: 'Fruits', sortOrder: 4 },
  { category: 'crop_master_category', value: 'Vegetables', sortOrder: 5 },
  { category: 'crop_master_category', value: 'Fiber', sortOrder: 6 },

  // Crop Duration UOM
  { category: 'crop_duration_uom', value: 'Day(s)', sortOrder: 1 },
  { category: 'crop_duration_uom', value: 'Week(s)', sortOrder: 2 },
  { category: 'crop_duration_uom', value: 'Month(s)', sortOrder: 3 },

  // ============================================
  // EQUIPMENT MASTER
  // ============================================

  // Equipment UOM
  { category: 'equipment_uom', value: 'pcs', sortOrder: 1 },
  { category: 'equipment_uom', value: 'kg', sortOrder: 2 },
  { category: 'equipment_uom', value: 'litre', sortOrder: 3 },

  // ============================================
  // PESTICIDE MASTER
  // ============================================

  // Pesticide UOM
  { category: 'pesticide_uom', value: 'Kg', sortOrder: 1 },
  { category: 'pesticide_uom', value: 'Gram', sortOrder: 2 },
  { category: 'pesticide_uom', value: 'ml', sortOrder: 3 },
  { category: 'pesticide_uom', value: 'Litre', sortOrder: 4 },

  // ============================================
  // FERTILIZER MASTER
  // ============================================

  // Fertilizer UOM
  { category: 'fertilizer_uom', value: 'Kg', sortOrder: 1 },
  { category: 'fertilizer_uom', value: 'Tonnes', sortOrder: 2 },
  { category: 'fertilizer_uom', value: 'Quintal', sortOrder: 3 },
  { category: 'fertilizer_uom', value: 'Gram', sortOrder: 4 },
  { category: 'fertilizer_uom', value: 'ml', sortOrder: 5 },
  { category: 'fertilizer_uom', value: 'Litre', sortOrder: 6 },

  // ============================================
  // SEED MASTER
  // ============================================

  // Seed UOM
  { category: 'seed_uom', value: 'Kg', sortOrder: 1 },
  { category: 'seed_uom', value: 'Tonnes', sortOrder: 2 },
  { category: 'seed_uom', value: 'Quintal', sortOrder: 3 },
  { category: 'seed_uom', value: 'Gram', sortOrder: 4 },
  { category: 'seed_uom', value: 'Seedlings', sortOrder: 5 },

  // ============================================
  // DISEASE MASTER
  // ============================================

  // Affected Types
  { category: 'affected_type', value: 'Flower', sortOrder: 1 },
  { category: 'affected_type', value: 'Fruit', sortOrder: 2 },
  { category: 'affected_type', value: 'Leaf', sortOrder: 3 },
  { category: 'affected_type', value: 'Soil', sortOrder: 4 },
  { category: 'affected_type', value: 'Grain', sortOrder: 5 },
  { category: 'affected_type', value: 'Tree', sortOrder: 6 },
  { category: 'affected_type', value: 'Stem', sortOrder: 7 },
  { category: 'affected_type', value: 'Root', sortOrder: 8 },
  { category: 'affected_type', value: 'Other', sortOrder: 9 },

  // Affected UOM
  { category: 'affected_uom', value: 'Tree', sortOrder: 1 },
  { category: 'affected_uom', value: 'Area', sortOrder: 2 },
  { category: 'affected_uom', value: 'Bed', sortOrder: 3 },
  { category: 'affected_uom', value: 'Plant', sortOrder: 4 },

  // ============================================
  // PEST MASTER
  // ============================================

  // Pest Stage
  { category: 'pest_stage', value: 'Sowing', sortOrder: 1 },
  { category: 'pest_stage', value: 'Young Tree', sortOrder: 2 },
  { category: 'pest_stage', value: 'Flowering', sortOrder: 3 },
  { category: 'pest_stage', value: 'Graining', sortOrder: 4 },
  { category: 'pest_stage', value: 'Harvest', sortOrder: 5 },

  // ============================================
  // CROP STAGE MASTER
  // ============================================

  // Agriculture Stage
  { category: 'agriculture_stage', value: 'Land Preparation', sortOrder: 1 },
  { category: 'agriculture_stage', value: 'Sowing', sortOrder: 2 },
  { category: 'agriculture_stage', value: 'Germination', sortOrder: 3 },
  { category: 'agriculture_stage', value: 'Vegetative', sortOrder: 4 },
  { category: 'agriculture_stage', value: 'Flowering', sortOrder: 5 },
  { category: 'agriculture_stage', value: 'Fruiting', sortOrder: 6 },
  { category: 'agriculture_stage', value: 'Maturity', sortOrder: 7 },
  { category: 'agriculture_stage', value: 'Harvest', sortOrder: 8 },
  { category: 'agriculture_stage', value: 'Post-Harvest', sortOrder: 9 },

  // ============================================
  // SOIL TYPE MASTER
  // ============================================

  { category: 'soil_type', value: 'Clay', sortOrder: 1 },
  { category: 'soil_type', value: 'Sandy', sortOrder: 2 },
  { category: 'soil_type', value: 'Loamy', sortOrder: 3 },
  { category: 'soil_type', value: 'Silt', sortOrder: 4 },
  { category: 'soil_type', value: 'Peat', sortOrder: 5 },
  { category: 'soil_type', value: 'Chalky', sortOrder: 6 },

  // ============================================
  // UOM MASTER (Generic)
  // ============================================

  { category: 'uom', value: 'Kg', sortOrder: 1 },
  { category: 'uom', value: 'Gram', sortOrder: 2 },
  { category: 'uom', value: 'Quintal', sortOrder: 3 },
  { category: 'uom', value: 'Tonnes', sortOrder: 4 },
  { category: 'uom', value: 'Litre', sortOrder: 5 },
  { category: 'uom', value: 'ml', sortOrder: 6 },
  { category: 'uom', value: 'pcs', sortOrder: 7 },
  { category: 'uom', value: 'Hectare', sortOrder: 8 },
  { category: 'uom', value: 'Acre', sortOrder: 9 },
  { category: 'uom', value: 'Seedlings', sortOrder: 10 },
  { category: 'uom', value: 'Day(s)', sortOrder: 11 },
  { category: 'uom', value: 'Week(s)', sortOrder: 12 },
  { category: 'uom', value: 'Month(s)', sortOrder: 13 },

  // ============================================
  // STATUS
  // ============================================

  { category: 'status', value: 'Active', sortOrder: 1 },
  { category: 'status', value: 'InActive', sortOrder: 2 },

  // ============================================
  // FIELD STAFF ROLES
  // ============================================

  { category: 'field_staff_role', value: 'Extension Officer', sortOrder: 1 },
  { category: 'field_staff_role', value: 'Agent', sortOrder: 2 },
  { category: 'field_staff_role', value: 'CBT', sortOrder: 3 },
  { category: 'field_staff_role', value: 'Field Officer', sortOrder: 4 },

  // ============================================
  // COOPERATIVE SERVICES
  // ============================================

  { category: 'cooperative_service', value: 'Fertilizer', sortOrder: 1 },
  { category: 'cooperative_service', value: 'Harvester', sortOrder: 2 },
  { category: 'cooperative_service', value: 'Soil Preparation', sortOrder: 3 },
  { category: 'cooperative_service', value: 'Seeds', sortOrder: 4 },
  { category: 'cooperative_service', value: 'Plant Protection Products', sortOrder: 5 },
  { category: 'cooperative_service', value: 'Compost', sortOrder: 6 },

  // ============================================
  // RICE MENU (SRP Audit)
  // ============================================

  // Farming System
  { category: 'farming_system', value: 'Rice 2-crops', sortOrder: 1 },
  { category: 'farming_system', value: 'Rice 3-crops', sortOrder: 2 },
  { category: 'farming_system', value: 'Rice-aqua', sortOrder: 3 },
  { category: 'farming_system', value: 'Rice-crop', sortOrder: 4 },

  // Water Source Type
  { category: 'water_source_type', value: 'Surface-canal', sortOrder: 1 },
  { category: 'water_source_type', value: 'Sprinkle', sortOrder: 2 },
  { category: 'water_source_type', value: 'Line-source', sortOrder: 3 },

  // Rice Crop Season
  { category: 'rice_crop_season', value: 'WS', label: 'Winter Spring', sortOrder: 1 },
  { category: 'rice_crop_season', value: 'SA', label: 'Summer Autumn', sortOrder: 2 },
  { category: 'rice_crop_season', value: 'AW', label: 'Autumn Winter', sortOrder: 3 },
  { category: 'rice_crop_season', value: 'Other', sortOrder: 4 },

  // Rice Variety
  { category: 'rice_variety', value: 'IR504', sortOrder: 1 },
  { category: 'rice_variety', value: 'IR5451', sortOrder: 2 },
  { category: 'rice_variety', value: 'OM5451', sortOrder: 3 },
  { category: 'rice_variety', value: 'OM380', sortOrder: 4 },
  { category: 'rice_variety', value: 'OM6976', sortOrder: 5 },
  { category: 'rice_variety', value: 'OM18', sortOrder: 6 },
  { category: 'rice_variety', value: 'DT8', sortOrder: 7 },
  { category: 'rice_variety', value: 'Nanghoa', sortOrder: 8 },
  { category: 'rice_variety', value: 'RVT', sortOrder: 9 },
  { category: 'rice_variety', value: 'ST24', sortOrder: 10 },
  { category: 'rice_variety', value: 'ST25', sortOrder: 11 },
  { category: 'rice_variety', value: 'Jasmin', sortOrder: 12 },
  { category: 'rice_variety', value: 'OM4900', sortOrder: 13 },

  // Certificate Plot Register
  { category: 'certificate_plot', value: 'SRP', sortOrder: 1 },
  { category: 'certificate_plot', value: 'VietGAP', sortOrder: 2 },
  { category: 'certificate_plot', value: 'GlobalGAP', sortOrder: 3 },
  { category: 'certificate_plot', value: 'Other', sortOrder: 4 },

  // Water Use
  { category: 'water_use', value: 'Rainfed', sortOrder: 1 },
  { category: 'water_use', value: 'Flood irrigated', sortOrder: 2 },
  { category: 'water_use', value: 'Non-flood irrigated', sortOrder: 3 },

  // Land Leveling
  { category: 'land_leveling', value: 'Flat-good', sortOrder: 1 },
  { category: 'land_leveling', value: 'Flat-normal', sortOrder: 2 },
  { category: 'land_leveling', value: 'Flat-weak', sortOrder: 3 },
  { category: 'land_leveling', value: 'Slope-good practice', sortOrder: 4 },
  { category: 'land_leveling', value: 'Slope-physical', sortOrder: 5 },
  { category: 'land_leveling', value: 'Slope-non', sortOrder: 6 },
  { category: 'land_leveling', value: 'Dry-non', sortOrder: 7 },

  // Preparation Type
  { category: 'preparation_type', value: 'Ploughing+tillering', sortOrder: 1 },
  { category: 'preparation_type', value: 'Tillering', sortOrder: 2 },

  // Leveling Type
  { category: 'leveling_type', value: 'Laser dry leveling', sortOrder: 1 },
  { category: 'leveling_type', value: 'Wet leveling', sortOrder: 2 },
  { category: 'leveling_type', value: 'Dry leveling', sortOrder: 3 },

  // Seed Reason
  { category: 'seed_reason', value: 'First sowing', sortOrder: 1 },
  { category: 'seed_reason', value: 'Replace death plant', sortOrder: 2 },
  { category: 'seed_reason', value: 'Loss by rain', sortOrder: 3 },
  { category: 'seed_reason', value: 'Loss by insect', sortOrder: 4 },

  // Fertilizer Type
  { category: 'fertilizer_type', value: 'Organic', sortOrder: 1 },
  { category: 'fertilizer_type', value: 'Chemical', sortOrder: 2 },
  { category: 'fertilizer_type', value: 'Mix-chemical', sortOrder: 3 },
  { category: 'fertilizer_type', value: 'Mix organic-chem', sortOrder: 4 },
  { category: 'fertilizer_type', value: 'Lime', sortOrder: 5 },
  { category: 'fertilizer_type', value: 'Phosphate', sortOrder: 6 },
  { category: 'fertilizer_type', value: 'Bio-liquid', sortOrder: 7 },

  // Fertilizer Labor
  { category: 'fertilizer_labor', value: 'Machine', sortOrder: 1 },
  { category: 'fertilizer_labor', value: 'Labour', sortOrder: 2 },
]

async function main() {
  console.log('Seeding CatalogMaster...')

  let created = 0
  let skipped = 0

  for (const entry of CATALOG_ENTRIES) {
    try {
      // Check if already exists
      const existing = await prisma.catalogMaster.findFirst({
        where: {
          category: entry.category,
          value: entry.value,
        },
      })

      if (existing) {
        skipped++
        continue
      }

      await prisma.catalogMaster.create({
        data: {
          category: entry.category,
          value: entry.value,
          label: entry.label || null,
          sortOrder: entry.sortOrder || 0,
          isGlobal: true,
        },
      })
      created++
    } catch (error) {
      console.error(`Failed to create catalog entry: ${entry.category}/${entry.value}`, error)
    }
  }

  console.log(`Catalog seeding complete: ${created} created, ${skipped} skipped (already exist)`)
  console.log(`Total entries processed: ${CATALOG_ENTRIES.length}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
