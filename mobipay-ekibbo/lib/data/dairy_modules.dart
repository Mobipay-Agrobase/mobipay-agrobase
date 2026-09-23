import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';

/// ZIWA360 Dairy — Module configurations for all 51 dairy sub-modules.
///
/// Each module declares:
///   - `key`           — endpoint slug used in `/api/dairy/<key>`
///   - `title`         — human-readable name shown in the dashboard grid
///   - `endpoint`      — full API path
///   - `icon`          — Material icon for the dashboard tile + list app bar
///   - `color`         — brand palette color used for the icon + accent
///   - `fields`        — list of `DairyField` definitions (drives the form
///                       dialog). Field types map to inputs:
///                         text / number / date / dropdown / textarea / switch
///   - `columns`       — keys to render in the list card subtitle (1-3 keys)
///   - `searchFields`   — keys used to filter rows in-memory on the list screen
///
/// Used by `DairyDashboardScreen`, `DairyListScreen`, `DairyFormDialog`, and
/// `DairyRepository` (which uses `endpoint` for both API + cache table name).

enum DairyFieldType {
  text,
  number,
  date,
  dropdown,
  textarea,
  switch_,
}

/// One field on a dairy form dialog.
class DairyField {
  const DairyField({
    required this.key,
    required this.label,
    this.type = DairyFieldType.text,
    this.required = false,
    this.options = const [],
    this.hint,
    this.defaultValue,
  });

  /// JSON key sent to the API.
  final String key;

  /// Human label rendered above the input.
  final String label;

  /// Input type — drives which widget is rendered.
  final DairyFieldType type;

  /// Whether the field must have a non-empty value before Save is enabled.
  final bool required;

  /// Static options for `DairyFieldType.dropdown`. Empty list = free text
  /// (rendered as a plain TextField, not a select).
  final List<String> options;

  /// Optional helper text shown under the input.
  final String? hint;

  /// Optional default value used when creating a new record.
  final dynamic defaultValue;

  bool get isDropdown => type == DairyFieldType.dropdown && options.isNotEmpty;
}

/// One dairy sub-module definition.
class DairyModule {
  const DairyModule({
    required this.key,
    required this.title,
    required this.icon,
    required this.color,
    required this.fields,
    this.columns = const [],
    this.searchFields = const [],
    this.description,
  });

  final String key;
  final String title;
  final IconData icon;
  final Color color;
  final List<DairyField> fields;
  final List<String> columns;
  final List<String> searchFields;
  final String? description;

  /// Full API endpoint (always `/api/dairy/<key>`).
  String get endpoint => '/api/dairy/$key';

  /// Table name in the local SQLite cache.
  String get tableName => 'dairy_$key';
}

/// Static registry of all 51 ZIWA360 dairy modules.
///
/// Order here is the order tiles appear in the dashboard grid.
class DairyModules {
  DairyModules._();

  /// The ZIWA360 tenant ID — dairy UI is only visible to users on this tenant.
  /// Pulled from the backend Prisma `Tenant.id` for the ZIWA360 row.
  static const String ziwa360TenantId = 'cmucvdj5z000mk1048cmianwy';

  static const List<DairyModule> all = [
    // 1 ─ Cows ──────────────────────────────────────────────────────────────
    DairyModule(
      key: 'cows',
      title: 'Cows',
      icon: Icons.pets,
      color: ColorConstant.primary,
      description: 'Individual cow / cattle records',
      columns: ['name', 'tagNumber', 'breed', 'status'],
      searchFields: ['name', 'tagNumber', 'breed'],
      fields: [
        DairyField(key: 'name', label: 'Name', required: true),
        DairyField(key: 'tagNumber', label: 'Tag Number', required: true),
        DairyField(
          key: 'breed',
          label: 'Breed',
          type: DairyFieldType.dropdown,
          options: ['Friesian', 'Jersey', 'Ankole', 'Guernsey', 'Ayrshire', 'Cross'],
        ),
        DairyField(
          key: 'gender',
          label: 'Gender',
          type: DairyFieldType.dropdown,
          options: ['Female', 'Male'],
        ),
        DairyField(key: 'birthDate', label: 'Birth Date', type: DairyFieldType.date),
        DairyField(
          key: 'status',
          label: 'Status',
          type: DairyFieldType.dropdown,
          options: ['Active', 'Dry', 'Pregnant', 'Lactating', 'Sold', 'Deceased'],
        ),
        DairyField(
          key: 'notes',
          label: 'Notes',
          type: DairyFieldType.textarea,
        ),
      ],
    ),

    // 2 ─ Sheds ─────────────────────────────────────────────────────────────
    DairyModule(
      key: 'sheds',
      title: 'Sheds',
      icon: Icons.warehouse_outlined,
      color: ColorConstant.secondary,
      description: 'Housing / shed infrastructure',
      columns: ['name', 'capacity', 'type'],
      searchFields: ['name', 'type', 'location'],
      fields: [
        DairyField(key: 'name', label: 'Name', required: true),
        DairyField(
          key: 'capacity',
          label: 'Capacity (animals)',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'type',
          label: 'Type',
          type: DairyFieldType.dropdown,
          options: ['Open', 'Closed', 'Milking Parlour', 'Calf Pen', 'Sick Bay'],
        ),
        DairyField(key: 'location', label: 'Location'),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 3 ─ Staff ─────────────────────────────────────────────────────────────
    DairyModule(
      key: 'staff',
      title: 'Staff',
      icon: Icons.people_outline,
      color: ColorConstant.gold,
      description: 'Farm workers & their roles',
      columns: ['name', 'role', 'phone'],
      searchFields: ['name', 'role', 'phone'],
      fields: [
        DairyField(key: 'name', label: 'Full Name', required: true),
        DairyField(
          key: 'role',
          label: 'Role',
          type: DairyFieldType.dropdown,
          options: ['Manager', 'Milker', 'Herdsperson', 'Veterinarian', 'Feeder', 'Other'],
        ),
        DairyField(key: 'phone', label: 'Phone'),
        DairyField(key: 'email', label: 'Email'),
        DairyField(key: 'hiredDate', label: 'Hired Date', type: DairyFieldType.date),
        DairyField(
          key: 'status',
          label: 'Status',
          type: DairyFieldType.dropdown,
          options: ['Active', 'Inactive', 'On Leave', 'Terminated'],
        ),
      ],
    ),

    // 4 ─ Suppliers ─────────────────────────────────────────────────────────
    DairyModule(
      key: 'suppliers',
      title: 'Suppliers',
      icon: Icons.local_shipping_outlined,
      color: ColorConstant.primaryLight,
      description: 'Feed / vet / drug suppliers',
      columns: ['name', 'contactPerson', 'phone'],
      searchFields: ['name', 'contactPerson', 'phone'],
      fields: [
        DairyField(key: 'name', label: 'Supplier Name', required: true),
        DairyField(key: 'contactPerson', label: 'Contact Person'),
        DairyField(key: 'phone', label: 'Phone'),
        DairyField(key: 'email', label: 'Email'),
        DairyField(key: 'address', label: 'Address'),
        DairyField(key: 'itemsSupplied', label: 'Items Supplied'),
      ],
    ),

    // 5 ─ Feed Items ────────────────────────────────────────────────────────
    DairyModule(
      key: 'feed-items',
      title: 'Feed Items',
      icon: Icons.grass_outlined,
      color: ColorConstant.secondaryLight,
      description: 'Feed / forage inventory catalog',
      columns: ['name', 'type', 'unit', 'unitCost'],
      searchFields: ['name', 'type'],
      fields: [
        DairyField(key: 'name', label: 'Feed Name', required: true),
        DairyField(
          key: 'type',
          label: 'Type',
          type: DairyFieldType.dropdown,
          options: ['Concentrate', 'Roughage', 'Mineral Mix', 'Silage', 'Hay', 'Other'],
        ),
        DairyField(
          key: 'unit',
          label: 'Unit',
          type: DairyFieldType.dropdown,
          options: ['kg', 'bag', 'tonne', 'litre', 'bale'],
        ),
        DairyField(
          key: 'unitCost',
          label: 'Unit Cost',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'quantityInStock',
          label: 'Quantity In Stock',
          type: DairyFieldType.number,
        ),
        DairyField(key: 'supplier', label: 'Supplier'),
      ],
    ),

    // 6 ─ Feed Schedules ────────────────────────────────────────────────────
    DairyModule(
      key: 'feed-schedules',
      title: 'Feed Schedules',
      icon: Icons.event_note_outlined,
      color: ColorConstant.info,
      description: 'Daily / weekly feeding plan',
      columns: ['cowId', 'feedItemId', 'scheduledDate'],
      searchFields: ['cowId', 'feedItemId', 'frequency'],
      fields: [
        DairyField(key: 'cowId', label: 'Cow ID'),
        DairyField(key: 'feedItemId', label: 'Feed Item ID'),
        DairyField(
          key: 'quantity',
          label: 'Quantity (kg)',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'scheduledDate',
          label: 'Scheduled Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'frequency',
          label: 'Frequency',
          type: DairyFieldType.dropdown,
          options: ['Daily', 'Weekly', 'One-off'],
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 7 ─ Tasks ─────────────────────────────────────────────────────────────
    DairyModule(
      key: 'tasks',
      title: 'Tasks',
      icon: Icons.task_alt,
      color: ColorConstant.success,
      description: 'Daily operations & to-do list',
      columns: ['title', 'assigneeId', 'dueDate', 'status'],
      searchFields: ['title', 'assigneeId', 'priority'],
      fields: [
        DairyField(key: 'title', label: 'Title', required: true),
        DairyField(
          key: 'description',
          label: 'Description',
          type: DairyFieldType.textarea,
        ),
        DairyField(key: 'assigneeId', label: 'Assignee (Staff ID)'),
        DairyField(
          key: 'dueDate',
          label: 'Due Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'priority',
          label: 'Priority',
          type: DairyFieldType.dropdown,
          options: ['Low', 'Medium', 'High', 'Critical'],
        ),
        DairyField(
          key: 'status',
          label: 'Status',
          type: DairyFieldType.dropdown,
          options: ['Pending', 'In Progress', 'Done', 'Overdue'],
        ),
      ],
    ),

    // 8 ─ Vaccinations ──────────────────────────────────────────────────────
    DairyModule(
      key: 'vaccinations',
      title: 'Vaccinations',
      icon: Icons.vaccines_outlined,
      color: ColorConstant.danger,
      description: 'Cow immunization records',
      columns: ['cowId', 'vaccineName', 'dateAdministered', 'nextDueDate'],
      searchFields: ['cowId', 'vaccineName'],
      fields: [
        DairyField(key: 'cowId', label: 'Cow ID', required: true),
        DairyField(key: 'vaccineName', label: 'Vaccine Name', required: true),
        DairyField(
          key: 'dateAdministered',
          label: 'Date Administered',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'nextDueDate',
          label: 'Next Due Date',
          type: DairyFieldType.date,
        ),
        DairyField(
          key: 'dosage',
          label: 'Dosage (ml)',
          type: DairyFieldType.number,
        ),
        DairyField(key: 'veterinarian', label: 'Veterinarian'),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 9 ─ Milking ───────────────────────────────────────────────────────────
    DairyModule(
      key: 'milking',
      title: 'Milking Records',
      icon: Icons.water_drop_outlined,
      color: ColorConstant.gold,
      description: 'Daily milk yield per cow per shift',
      columns: ['cowId', 'date', 'shift', 'yieldLitres'],
      searchFields: ['cowId', 'shift'],
      fields: [
        DairyField(key: 'cowId', label: 'Cow ID', required: true),
        DairyField(
          key: 'date',
          label: 'Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'shift',
          label: 'Shift',
          type: DairyFieldType.dropdown,
          options: ['Morning', 'Afternoon', 'Evening'],
          required: true,
        ),
        DairyField(
          key: 'yieldLitres',
          label: 'Yield (litres)',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'qualityScore',
          label: 'Quality Score (0-100)',
          type: DairyFieldType.number,
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 10 ─ Health Checks ────────────────────────────────────────────────────
    DairyModule(
      key: 'health-checks',
      title: 'Health Checks',
      icon: Icons.health_and_safety_outlined,
      color: ColorConstant.secondary,
      description: 'Veterinary examinations',
      columns: ['cowId', 'date', 'checkedBy', 'diagnosis'],
      searchFields: ['cowId', 'diagnosis', 'checkedBy'],
      fields: [
        DairyField(key: 'cowId', label: 'Cow ID', required: true),
        DairyField(
          key: 'date',
          label: 'Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(key: 'checkedBy', label: 'Checked By'),
        DairyField(
          key: 'temperature',
          label: 'Temperature (°C)',
          type: DairyFieldType.number,
        ),
        DairyField(key: 'diagnosis', label: 'Diagnosis'),
        DairyField(key: 'treatment', label: 'Treatment'),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 11 ─ Breeding ─────────────────────────────────────────────────────────
    DairyModule(
      key: 'breeding',
      title: 'Breeding',
      icon: Icons.family_restroom,
      color: ColorConstant.primary,
      description: 'Insemination / mating records',
      columns: ['cowId', 'sireId', 'breedingDate', 'expectedCalving'],
      searchFields: ['cowId', 'sireId', 'method'],
      fields: [
        DairyField(key: 'cowId', label: 'Cow ID', required: true),
        DairyField(key: 'sireId', label: 'Sire ID / Bull Name'),
        DairyField(
          key: 'breedingDate',
          label: 'Breeding Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'method',
          label: 'Method',
          type: DairyFieldType.dropdown,
          options: ['AI', 'Natural', 'Embryo Transfer'],
        ),
        DairyField(
          key: 'expectedCalving',
          label: 'Expected Calving Date',
          type: DairyFieldType.date,
        ),
        DairyField(
          key: 'result',
          label: 'Result',
          type: DairyFieldType.dropdown,
          options: ['Pending', 'Pregnant', 'Failed', 'Unknown'],
        ),
      ],
    ),

    // 12 ─ Weights ──────────────────────────────────────────────────────────
    DairyModule(
      key: 'weights',
      title: 'Weights',
      icon: Icons.monitor_weight_outlined,
      color: ColorConstant.warning,
      description: 'Body weight & BCS logs',
      columns: ['cowId', 'date', 'weightKg'],
      searchFields: ['cowId'],
      fields: [
        DairyField(key: 'cowId', label: 'Cow ID', required: true),
        DairyField(
          key: 'date',
          label: 'Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'weightKg',
          label: 'Weight (kg)',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'bodyConditionScore',
          label: 'Body Condition Score (1-5)',
          type: DairyFieldType.number,
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 13 ─ Quality Tests ────────────────────────────────────────────────────
    DairyModule(
      key: 'quality-tests',
      title: 'Quality Tests',
      icon: Icons.science_outlined,
      color: ColorConstant.info,
      description: 'Milk composition lab tests',
      columns: ['sampleId', 'testDate', 'fatPercent', 'grade'],
      searchFields: ['sampleId', 'grade'],
      fields: [
        DairyField(key: 'sampleId', label: 'Sample ID', required: true),
        DairyField(
          key: 'testDate',
          label: 'Test Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'fatPercent',
          label: 'Fat %',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'proteinPercent',
          label: 'Protein %',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'lactose',
          label: 'Lactose %',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'somaticCellCount',
          label: 'Somatic Cell Count',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'grade',
          label: 'Grade',
          type: DairyFieldType.dropdown,
          options: ['A', 'B', 'C', 'Reject'],
        ),
      ],
    ),

    // 14 ─ Waste ────────────────────────────────────────────────────────────
    DairyModule(
      key: 'waste',
      title: 'Waste',
      icon: Icons.delete_outlined,
      color: ColorConstant.textSecondary,
      description: 'Manure & waste disposal',
      columns: ['type', 'quantity', 'date', 'disposalMethod'],
      searchFields: ['type', 'disposalMethod'],
      fields: [
        DairyField(
          key: 'type',
          label: 'Waste Type',
          type: DairyFieldType.dropdown,
          options: ['Manure', 'Slurry', 'Bedding', 'Plastic', 'Medical', 'Other'],
          required: true,
        ),
        DairyField(
          key: 'quantity',
          label: 'Quantity (kg / litres)',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'date',
          label: 'Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'disposalMethod',
          label: 'Disposal Method',
          type: DairyFieldType.dropdown,
          options: ['Compost', 'Biogas', 'Landfill', 'Recycle', 'Incinerate'],
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 15 ─ Emissions ────────────────────────────────────────────────────────
    DairyModule(
      key: 'emissions',
      title: 'Emissions',
      icon: Icons.cloud_outlined,
      color: ColorConstant.textSecondary,
      description: 'GHG emission measurements',
      columns: ['source', 'type', 'amountKg', 'measurementDate'],
      searchFields: ['source', 'type'],
      fields: [
        DairyField(key: 'source', label: 'Source', required: true),
        DairyField(
          key: 'type',
          label: 'Emission Type',
          type: DairyFieldType.dropdown,
          options: ['CO2', 'Methane', 'Nitrous Oxide', 'Ammonia'],
          required: true,
        ),
        DairyField(
          key: 'amountKg',
          label: 'Amount (kg)',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'measurementDate',
          label: 'Measurement Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 16 ─ Certifications ────────────────────────────────────────────────────
    DairyModule(
      key: 'certifications',
      title: 'Certifications',
      icon: Icons.verified_outlined,
      color: ColorConstant.success,
      description: 'Organic / fair-trade / quality certs',
      columns: ['name', 'issuer', 'expiryDate', 'status'],
      searchFields: ['name', 'issuer', 'status'],
      fields: [
        DairyField(key: 'name', label: 'Certification Name', required: true),
        DairyField(key: 'issuer', label: 'Issuer'),
        DairyField(key: 'certificateNumber', label: 'Certificate Number'),
        DairyField(
          key: 'issueDate',
          label: 'Issue Date',
          type: DairyFieldType.date,
        ),
        DairyField(
          key: 'expiryDate',
          label: 'Expiry Date',
          type: DairyFieldType.date,
        ),
        DairyField(
          key: 'status',
          label: 'Status',
          type: DairyFieldType.dropdown,
          options: ['Active', 'Expired', 'Suspended', 'Pending'],
        ),
      ],
    ),

    // 17 ─ Inspections ───────────────────────────────────────────────────────
    DairyModule(
      key: 'inspections',
      title: 'Inspections',
      icon: Icons.fact_check_outlined,
      color: ColorConstant.primary,
      description: 'Regulatory / internal inspections',
      columns: ['inspectionType', 'date', 'inspectorName', 'status'],
      searchFields: ['inspectionType', 'inspectorName', 'status'],
      fields: [
        DairyField(
          key: 'inspectionType',
          label: 'Inspection Type',
          required: true,
        ),
        DairyField(key: 'inspectorName', label: 'Inspector Name'),
        DairyField(
          key: 'date',
          label: 'Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'findings',
          label: 'Findings',
          type: DairyFieldType.textarea,
        ),
        DairyField(
          key: 'status',
          label: 'Status',
          type: DairyFieldType.dropdown,
          options: ['Passed', 'Failed', 'Pending', 'Re-inspect'],
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 18 ─ Feed Logs ─────────────────────────────────────────────────────────
    DairyModule(
      key: 'feed-logs',
      title: 'Feed Logs',
      icon: Icons.list_alt_outlined,
      color: ColorConstant.secondary,
      description: 'Issued feed consumption logs',
      columns: ['feedItemId', 'cowId', 'quantity', 'date'],
      searchFields: ['feedItemId', 'cowId'],
      fields: [
        DairyField(key: 'feedItemId', label: 'Feed Item ID', required: true),
        DairyField(key: 'cowId', label: 'Cow ID'),
        DairyField(
          key: 'quantity',
          label: 'Quantity Issued (kg)',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'date',
          label: 'Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 19 ─ Processing ────────────────────────────────────────────────────────
    DairyModule(
      key: 'processing',
      title: 'Processing',
      icon: Icons.precision_manufacturing_outlined,
      color: ColorConstant.gold,
      description: 'Milk → product processing batches',
      columns: ['batchNumber', 'productType', 'processingDate', 'outputKg'],
      searchFields: ['batchNumber', 'productType'],
      fields: [
        DairyField(key: 'batchNumber', label: 'Batch Number', required: true),
        DairyField(
          key: 'productType',
          label: 'Product Type',
          type: DairyFieldType.dropdown,
          options: ['Pasteurized Milk', 'Yoghurt', 'Cheese', 'Butter', 'Ghee', 'Powder'],
          required: true,
        ),
        DairyField(
          key: 'quantityLitres',
          label: 'Input (litres)',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'processingDate',
          label: 'Processing Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'outputKg',
          label: 'Output (kg)',
          type: DairyFieldType.number,
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 20 ─ Vets ──────────────────────────────────────────────────────────────
    DairyModule(
      key: 'vets',
      title: 'Veterinarians',
      icon: Icons.medical_services_outlined,
      color: ColorConstant.danger,
      description: 'Vet directory',
      columns: ['name', 'clinic', 'phone'],
      searchFields: ['name', 'clinic', 'specialization'],
      fields: [
        DairyField(key: 'name', label: 'Vet Name', required: true),
        DairyField(key: 'clinic', label: 'Clinic'),
        DairyField(key: 'phone', label: 'Phone'),
        DairyField(key: 'email', label: 'Email'),
        DairyField(key: 'specialization', label: 'Specialization'),
        DairyField(key: 'address', label: 'Address'),
      ],
    ),

    // 21 ─ Vet Requests ──────────────────────────────────────────────────────
    DairyModule(
      key: 'vet-requests',
      title: 'Vet Requests',
      icon: Icons.mark_email_unread_outlined,
      color: ColorConstant.warning,
      description: 'Calls / visits requested to vets',
      columns: ['cowId', 'vetId', 'requestDate', 'status', 'priority'],
      searchFields: ['cowId', 'vetId', 'status'],
      fields: [
        DairyField(key: 'cowId', label: 'Cow ID', required: true),
        DairyField(key: 'vetId', label: 'Vet ID'),
        DairyField(
          key: 'requestDate',
          label: 'Request Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(key: 'reason', label: 'Reason', type: DairyFieldType.textarea),
        DairyField(
          key: 'priority',
          label: 'Priority',
          type: DairyFieldType.dropdown,
          options: ['Low', 'Medium', 'High', 'Emergency'],
        ),
        DairyField(
          key: 'status',
          label: 'Status',
          type: DairyFieldType.dropdown,
          options: ['Open', 'Accepted', 'Completed', 'Cancelled'],
        ),
      ],
    ),

    // 22 ─ Vet Reviews ───────────────────────────────────────────────────────
    DairyModule(
      key: 'vet-reviews',
      title: 'Vet Reviews',
      icon: Icons.rate_review_outlined,
      color: ColorConstant.gold,
      description: 'Feedback after vet visits',
      columns: ['vetRequestId', 'reviewDate', 'rating'],
      searchFields: ['vetRequestId'],
      fields: [
        DairyField(key: 'vetRequestId', label: 'Vet Request ID', required: true),
        DairyField(
          key: 'reviewDate',
          label: 'Review Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'rating',
          label: 'Rating (1-5)',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'comments',
          label: 'Comments',
          type: DairyFieldType.textarea,
        ),
        DairyField(
          key: 'wouldRecommend',
          label: 'Would Recommend?',
          type: DairyFieldType.switch_,
        ),
      ],
    ),

    // 23 ─ Vaccination Protocols ─────────────────────────────────────────────
    DairyModule(
      key: 'vax-protocols',
      title: 'Vax Protocols',
      icon: Icons.rule_outlined,
      color: ColorConstant.info,
      description: 'Standard immunization schedules',
      columns: ['name', 'vaccineName', 'scheduleDays'],
      searchFields: ['name', 'vaccineName'],
      fields: [
        DairyField(key: 'name', label: 'Protocol Name', required: true),
        DairyField(key: 'vaccineName', label: 'Vaccine Name', required: true),
        DairyField(
          key: 'scheduleDays',
          label: 'Schedule (days)',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'boosterInterval',
          label: 'Booster Interval (days)',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'targetAgeMonths',
          label: 'Target Age (months)',
          type: DairyFieldType.number,
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 24 ─ Deworming ─────────────────────────────────────────────────────────
    DairyModule(
      key: 'deworming',
      title: 'Deworming',
      icon: Icons.healing_outlined,
      color: ColorConstant.secondary,
      description: 'Anti-parasite treatments',
      columns: ['cowId', 'drugName', 'dateAdministered', 'nextDueDate'],
      searchFields: ['cowId', 'drugName'],
      fields: [
        DairyField(key: 'cowId', label: 'Cow ID', required: true),
        DairyField(key: 'drugName', label: 'Drug Name', required: true),
        DairyField(
          key: 'dosage',
          label: 'Dosage (ml)',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'dateAdministered',
          label: 'Date Administered',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'nextDueDate',
          label: 'Next Due Date',
          type: DairyFieldType.date,
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 25 ─ Withdrawals ───────────────────────────────────────────────────────
    DairyModule(
      key: 'withdrawals',
      title: 'Withdrawals',
      icon: Icons.lock_clock_outlined,
      color: ColorConstant.danger,
      description: 'Milk/meat withdrawal locks',
      columns: ['cowId', 'type', 'startDate', 'endDate', 'status'],
      searchFields: ['cowId', 'type', 'status'],
      fields: [
        DairyField(key: 'cowId', label: 'Cow ID', required: true),
        DairyField(
          key: 'type',
          label: 'Withdrawal Type',
          type: DairyFieldType.dropdown,
          options: ['Milk', 'Meat', 'Both'],
          required: true,
        ),
        DairyField(
          key: 'startDate',
          label: 'Start Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'endDate',
          label: 'End Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(key: 'reason', label: 'Reason'),
        DairyField(
          key: 'status',
          label: 'Status',
          type: DairyFieldType.dropdown,
          options: ['Active', 'Cleared', 'Cancelled'],
        ),
      ],
    ),

    // 26 ─ Lactations ────────────────────────────────────────────────────────
    DairyModule(
      key: 'lactations',
      title: 'Lactations',
      icon: Icons.cake_outlined,
      color: ColorConstant.primaryLight,
      description: 'Lactation cycle per cow',
      columns: ['cowId', 'lactationNumber', 'startDate', 'status'],
      searchFields: ['cowId', 'status'],
      fields: [
        DairyField(key: 'cowId', label: 'Cow ID', required: true),
        DairyField(
          key: 'lactationNumber',
          label: 'Lactation Number',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'startDate',
          label: 'Start Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'endDate',
          label: 'End Date',
          type: DairyFieldType.date,
        ),
        DairyField(
          key: 'calvingDate',
          label: 'Calving Date',
          type: DairyFieldType.date,
        ),
        DairyField(
          key: 'status',
          label: 'Status',
          type: DairyFieldType.dropdown,
          options: ['Active', 'Ended', 'Dry'],
        ),
      ],
    ),

    // 27 ─ Diseases ─────────────────────────────────────────────────────────
    DairyModule(
      key: 'diseases',
      title: 'Diseases',
      icon: Icons.coronavirus_outlined,
      color: ColorConstant.danger,
      description: 'Known disease catalog',
      columns: ['name', 'category', 'isReportable'],
      searchFields: ['name', 'category'],
      fields: [
        DairyField(key: 'name', label: 'Disease Name', required: true),
        DairyField(
          key: 'category',
          label: 'Category',
          type: DairyFieldType.dropdown,
          options: ['Bacterial', 'Viral', 'Parasitic', 'Fungal', 'Nutritional', 'Other'],
        ),
        DairyField(
          key: 'symptoms',
          label: 'Symptoms',
          type: DairyFieldType.textarea,
        ),
        DairyField(
          key: 'treatmentProtocol',
          label: 'Treatment Protocol',
          type: DairyFieldType.textarea,
        ),
        DairyField(
          key: 'isReportable',
          label: 'Reportable?',
          type: DairyFieldType.switch_,
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 28 ─ Drugs ─────────────────────────────────────────────────────────────
    DairyModule(
      key: 'drugs',
      title: 'Drugs',
      icon: Icons.medication_outlined,
      color: ColorConstant.secondary,
      description: 'Pharmacy inventory',
      columns: ['name', 'category', 'unit', 'stockQuantity'],
      searchFields: ['name', 'category'],
      fields: [
        DairyField(key: 'name', label: 'Drug Name', required: true),
        DairyField(
          key: 'category',
          label: 'Category',
          type: DairyFieldType.dropdown,
          options: ['Antibiotic', 'Anti-parasite', 'Vitamin', 'Vaccine', 'Hormone', 'Other'],
        ),
        DairyField(
          key: 'unit',
          label: 'Unit',
          type: DairyFieldType.dropdown,
          options: ['tablet', 'ml', 'vial', 'sachet', 'tube'],
        ),
        DairyField(
          key: 'stockQuantity',
          label: 'Stock Quantity',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'reorderLevel',
          label: 'Reorder Level',
          type: DairyFieldType.number,
        ),
        DairyField(key: 'supplier', label: 'Supplier'),
      ],
    ),

    // 29 ─ Vet Service Areas ────────────────────────────────────────────────
    DairyModule(
      key: 'vet-service-areas',
      title: 'Vet Service Areas',
      icon: Icons.map_outlined,
      color: ColorConstant.info,
      description: 'Geographic coverage per vet',
      columns: ['vetId', 'region', 'district'],
      searchFields: ['vetId', 'region', 'district'],
      fields: [
        DairyField(key: 'vetId', label: 'Vet ID', required: true),
        DairyField(key: 'region', label: 'Region'),
        DairyField(key: 'district', label: 'District'),
        DairyField(
          key: 'isActive',
          label: 'Active?',
          type: DairyFieldType.switch_,
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // ──────────────────────────────────────────────────────────────────────
    // ZIWA360 Phase 3 — Logistics & Quality modules (30-41)
    // ──────────────────────────────────────────────────────────────────────

    // 30 ─ Transporters ─────────────────────────────────────────────────────
    DairyModule(
      key: 'transporters',
      title: 'Transporters',
      icon: Icons.local_shipping,
      color: ColorConstant.primaryLight,
      description: 'Transporter / driver registry',
      columns: ['fullName', 'companyName', 'transporterType', 'verificationStatus'],
      searchFields: ['fullName', 'companyName', 'transporterCode', 'licenceNo', 'phone'],
      fields: [
        DairyField(key: 'fullName', label: 'Full Name', required: true),
        DairyField(key: 'companyName', label: 'Company Name'),
        DairyField(key: 'transporterCode', label: 'Transporter Code'),
        DairyField(
          key: 'transporterType',
          label: 'Type',
          type: DairyFieldType.dropdown,
          options: ['pickup', 'bulk', 'motorcycle', 'bicycle'],
        ),
        DairyField(key: 'licenceNo', label: 'Licence No.'),
        DairyField(
          key: 'insuranceExpiry',
          label: 'Insurance Expiry',
          type: DairyFieldType.date,
        ),
        DairyField(key: 'phone', label: 'Phone'),
        DairyField(
          key: 'verificationStatus',
          label: 'Verification Status',
          type: DairyFieldType.dropdown,
          options: ['pending', 'verified', 'rejected'],
        ),
        DairyField(
          key: 'avgRating',
          label: 'Avg Rating',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'totalReviews',
          label: 'Total Reviews',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'isActive',
          label: 'Active?',
          type: DairyFieldType.switch_,
        ),
      ],
    ),

    // 31 ─ Vehicles ────────────────────────────────────────────────────────
    DairyModule(
      key: 'vehicles',
      title: 'Vehicles',
      icon: Icons.directions_bus,
      color: ColorConstant.secondary,
      description: 'Transport vehicles & tankers',
      columns: ['plateNo', 'vehicleType', 'capacityLitres', 'coldChain'],
      searchFields: ['plateNo', 'tempLoggerUid', 'gpsUid'],
      fields: [
        DairyField(key: 'transporterId', label: 'Transporter ID', required: true),
        DairyField(key: 'plateNo', label: 'Plate Number', required: true),
        DairyField(
          key: 'vehicleType',
          label: 'Vehicle Type',
          type: DairyFieldType.dropdown,
          options: ['pickup', 'bulk_tanker', 'motorcycle', 'bicycle'],
        ),
        DairyField(
          key: 'capacityLitres',
          label: 'Capacity (Litres)',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'coldChain',
          label: 'Cold Chain?',
          type: DairyFieldType.switch_,
        ),
        DairyField(key: 'tempLoggerUid', label: 'Temp Logger UID'),
        DairyField(key: 'gpsUid', label: 'GPS UID'),
        DairyField(
          key: 'isActive',
          label: 'Active?',
          type: DairyFieldType.switch_,
        ),
      ],
    ),

    // 32 ─ Transport Routes ─────────────────────────────────────────────────
    DairyModule(
      key: 'routes',
      title: 'Transport Routes',
      icon: Icons.alt_route,
      color: ColorConstant.info,
      description: 'Milk collection routes',
      columns: ['name', 'mccId', 'distanceKm', 'cutoffTime'],
      searchFields: ['name', 'cutoffTime'],
      fields: [
        DairyField(key: 'name', label: 'Route Name', required: true),
        DairyField(key: 'mccId', label: 'MCC ID'),
        DairyField(key: 'processorId', label: 'Processor ID'),
        DairyField(
          key: 'distanceKm',
          label: 'Distance (km)',
          type: DairyFieldType.number,
        ),
        DairyField(key: 'cutoffTime', label: 'Cutoff Time (HH:mm)'),
        DairyField(
          key: 'stopsJson',
          label: 'Stops (JSON)',
          type: DairyFieldType.textarea,
        ),
        DairyField(
          key: 'isActive',
          label: 'Active?',
          type: DairyFieldType.switch_,
        ),
      ],
    ),

    // 33 ─ Transport Trips ─────────────────────────────────────────────────
    DairyModule(
      key: 'trips',
      title: 'Transport Trips',
      icon: Icons.timeline,
      color: ColorConstant.gold,
      description: 'Milk transport trips',
      columns: ['tripDate', 'tripType', 'status', 'litresPicked'],
      searchFields: ['sealNoOut', 'sealNoIn', 'notes'],
      fields: [
        DairyField(key: 'transporterId', label: 'Transporter ID', required: true),
        DairyField(key: 'vehicleId', label: 'Vehicle ID', required: true),
        DairyField(key: 'routeId', label: 'Route ID'),
        DairyField(
          key: 'tripDate',
          label: 'Trip Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'tripType',
          label: 'Trip Type',
          type: DairyFieldType.dropdown,
          options: ['farm_to_mcc', 'mcc_to_processor', 'farm_to_processor'],
        ),
        DairyField(
          key: 'status',
          label: 'Status',
          type: DairyFieldType.dropdown,
          options: ['planned', 'in_transit', 'completed', 'cancelled'],
        ),
        DairyField(
          key: 'distanceKm',
          label: 'Distance (km)',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'litresPicked',
          label: 'Litres Picked',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'litresDelivered',
          label: 'Litres Delivered',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'costTotal',
          label: 'Cost Total',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'costPerLitre',
          label: 'Cost / Litre',
          type: DairyFieldType.number,
        ),
        DairyField(key: 'sealNoOut', label: 'Seal No (Out)'),
        DairyField(key: 'sealNoIn', label: 'Seal No (In)'),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 34 ─ Pickups (e-Receipts) ─────────────────────────────────────────────
    DairyModule(
      key: 'pickups',
      title: 'Pickups',
      icon: Icons.receipt_long,
      color: ColorConstant.success,
      description: 'Milk pickup e-receipts',
      columns: ['receiptNo', 'farmerName', 'litres', 'grade', 'pickedAt'],
      searchFields: ['receiptNo', 'farmerName', 'notes'],
      fields: [
        DairyField(key: 'tripId', label: 'Trip ID', required: true),
        DairyField(key: 'farmerId', label: 'Farmer ID'),
        DairyField(key: 'farmerName', label: 'Farmer Name', required: true),
        DairyField(key: 'receiptNo', label: 'Receipt No.', required: true),
        DairyField(
          key: 'litres',
          label: 'Litres',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'pickedAt',
          label: 'Picked At',
          type: DairyFieldType.date,
        ),
        DairyField(
          key: 'lat',
          label: 'Latitude',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'lng',
          label: 'Longitude',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'qrVerified',
          label: 'QR Verified?',
          type: DairyFieldType.switch_,
        ),
        DairyField(
          key: 'farmerConfirmed',
          label: 'Farmer Confirmed?',
          type: DairyFieldType.switch_,
        ),
        DairyField(
          key: 'grade',
          label: 'Grade',
          type: DairyFieldType.dropdown,
          options: ['A', 'B', 'C', 'Reject'],
        ),
        DairyField(
          key: 'pricePerLitre',
          label: 'Price / Litre',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'grossAmount',
          label: 'Gross Amount',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'quickTestJson',
          label: 'Quick Test (JSON)',
          type: DairyFieldType.textarea,
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 35 ─ Temperature Logs ─────────────────────────────────────────────────
    DairyModule(
      key: 'temp-logs',
      title: 'Temperature Logs',
      icon: Icons.thermostat,
      color: ColorConstant.warning,
      description: 'Cold-chain temperature readings',
      columns: ['tripId', 'tempC', 'loggedAt'],
      searchFields: ['tripId'],
      fields: [
        DairyField(key: 'tripId', label: 'Trip ID', required: true),
        DairyField(
          key: 'tempC',
          label: 'Temperature (°C)',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'loggedAt',
          label: 'Logged At',
          type: DairyFieldType.date,
        ),
      ],
    ),

    // 36 ─ Tamper Events ───────────────────────────────────────────────────
    DairyModule(
      key: 'tamper-events',
      title: 'Tamper Events',
      icon: Icons.warning_amber,
      color: ColorConstant.danger,
      description: 'Seal / equipment tamper alerts',
      columns: ['tripId', 'eventType', 'detectedAt', 'resolved'],
      searchFields: ['eventType', 'detailsJson', 'resolvedBy', 'notes'],
      fields: [
        DairyField(key: 'tripId', label: 'Trip ID', required: true),
        DairyField(
          key: 'eventType',
          label: 'Event Type',
          required: true,
          type: DairyFieldType.dropdown,
          options: [
            'seal_broken',
            'lid_opened',
            'temp_breach',
            'gps_loss',
            'route_deviation',
            'other',
          ],
        ),
        DairyField(
          key: 'detectedAt',
          label: 'Detected At',
          type: DairyFieldType.date,
        ),
        DairyField(
          key: 'detailsJson',
          label: 'Details (JSON)',
          type: DairyFieldType.textarea,
        ),
        DairyField(
          key: 'resolved',
          label: 'Resolved?',
          type: DairyFieldType.switch_,
        ),
        DairyField(
          key: 'resolvedAt',
          label: 'Resolved At',
          type: DairyFieldType.date,
        ),
        DairyField(key: 'resolvedBy', label: 'Resolved By'),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 37 ─ Milk Losses ─────────────────────────────────────────────────────
    DairyModule(
      key: 'milk-losses',
      title: 'Milk Losses',
      icon: Icons.water_drop,
      color: ColorConstant.danger,
      description: 'Milk loss / rejection records',
      columns: ['lossDate', 'lossType', 'litresLost', 'valueLost', 'reconciled'],
      searchFields: ['lossType', 'responsibleParty', 'notes'],
      fields: [
        DairyField(key: 'tripId', label: 'Trip ID'),
        DairyField(key: 'pickupId', label: 'Pickup ID'),
        DairyField(
          key: 'lossDate',
          label: 'Loss Date',
          type: DairyFieldType.date,
        ),
        DairyField(
          key: 'lossType',
          label: 'Loss Type',
          type: DairyFieldType.dropdown,
          options: [
            'spillage',
            'spoilage',
            'rejection',
            'leakage',
            'theft',
            'other',
          ],
        ),
        DairyField(
          key: 'litresLost',
          label: 'Litres Lost',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'valueLost',
          label: 'Value Lost',
          type: DairyFieldType.number,
        ),
        DairyField(key: 'responsibleParty', label: 'Responsible Party'),
        DairyField(
          key: 'reconciled',
          label: 'Reconciled?',
          type: DairyFieldType.switch_,
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 38 ─ Offtakers ─────────────────────────────────────────────────────────
    DairyModule(
      key: 'offtakers',
      title: 'Offtakers',
      icon: Icons.factory,
      color: ColorConstant.primaryDark,
      description: 'MCC / processor buyers',
      columns: ['name', 'offtakerType', 'location', 'paymentTerms'],
      searchFields: ['name', 'location', 'contactPhone', 'contactEmail'],
      fields: [
        DairyField(key: 'name', label: 'Name', required: true),
        DairyField(
          key: 'offtakerType',
          label: 'Type',
          type: DairyFieldType.dropdown,
          options: ['mcc', 'processor', 'cooperative', 'retailer'],
        ),
        DairyField(key: 'contactPhone', label: 'Contact Phone'),
        DairyField(key: 'contactEmail', label: 'Contact Email'),
        DairyField(key: 'location', label: 'Location'),
        DairyField(
          key: 'paymentTerms',
          label: 'Payment Terms',
          type: DairyFieldType.dropdown,
          options: ['daily', 'weekly', 'biweekly', 'monthly'],
        ),
        DairyField(
          key: 'isActive',
          label: 'Active?',
          type: DairyFieldType.switch_,
        ),
      ],
    ),

    // 39 ─ MCC Centers ──────────────────────────────────────────────────────
    DairyModule(
      key: 'mcc-centers',
      title: 'MCC Centers',
      icon: Icons.warehouse,
      color: ColorConstant.secondaryLight,
      description: 'Milk Cooling & Collection centers',
      columns: ['name', 'offtakerId', 'capacityLitres', 'hasCooler'],
      searchFields: ['name'],
      fields: [
        DairyField(key: 'offtakerId', label: 'Offtaker ID'),
        DairyField(key: 'name', label: 'Name', required: true),
        DairyField(
          key: 'capacityLitres',
          label: 'Capacity (Litres)',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'hasCooler',
          label: 'Has Cooler?',
          type: DairyFieldType.switch_,
        ),
        DairyField(
          key: 'hasAnalyzer',
          label: 'Has Analyzer?',
          type: DairyFieldType.switch_,
        ),
        DairyField(
          key: 'lat',
          label: 'Latitude',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'lng',
          label: 'Longitude',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'isActive',
          label: 'Active?',
          type: DairyFieldType.switch_,
        ),
      ],
    ),

    // 40 ─ MCC Intakes ──────────────────────────────────────────────────────
    DairyModule(
      key: 'mcc-intakes',
      title: 'MCC Intakes',
      icon: Icons.input,
      color: ColorConstant.info,
      description: 'MCC daily milk intakes',
      columns: ['mccId', 'farmerName', 'litresAccepted', 'grade', 'intakeDate'],
      searchFields: ['farmerName', 'rejectReason', 'notes'],
      fields: [
        DairyField(key: 'mccId', label: 'MCC ID', required: true),
        DairyField(key: 'farmerId', label: 'Farmer ID'),
        DairyField(key: 'farmerName', label: 'Farmer Name', required: true),
        DairyField(key: 'pickupId', label: 'Pickup ID'),
        DairyField(
          key: 'intakeDate',
          label: 'Intake Date',
          type: DairyFieldType.date,
        ),
        DairyField(
          key: 'session',
          label: 'Session',
          type: DairyFieldType.dropdown,
          options: ['morning', 'evening'],
        ),
        DairyField(
          key: 'litresReceived',
          label: 'Litres Received',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'litresAccepted',
          label: 'Litres Accepted',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'litresRejected',
          label: 'Litres Rejected',
          type: DairyFieldType.number,
        ),
        DairyField(key: 'rejectReason', label: 'Reject Reason'),
        DairyField(
          key: 'grade',
          label: 'Grade',
          type: DairyFieldType.dropdown,
          options: ['A', 'B', 'C', 'Reject'],
        ),
        DairyField(
          key: 'pricePerLitre',
          label: 'Price / Litre',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'grossAmount',
          label: 'Gross Amount',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'currency',
          label: 'Currency',
          type: DairyFieldType.dropdown,
          options: ['UGX', 'USD', 'KES', 'TZS', 'RWF'],
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 41 ─ Farm Quality Tests ───────────────────────────────────────────────
    DairyModule(
      key: 'farm-quality-tests',
      title: 'Farm Quality Tests',
      icon: Icons.science_outlined,
      color: ColorConstant.warning,
      description: 'Farm-level milk quality tests',
      columns: ['farmerName', 'testType', 'result', 'isAbnormal', 'testDate'],
      searchFields: ['farmerName', 'testType', 'result', 'mastitisRisk', 'testedBy', 'notes'],
      fields: [
        DairyField(key: 'cowId', label: 'Cow ID'),
        DairyField(key: 'farmerId', label: 'Farmer ID'),
        DairyField(key: 'farmerName', label: 'Farmer Name'),
        DairyField(
          key: 'testDate',
          label: 'Test Date',
          type: DairyFieldType.date,
        ),
        DairyField(
          key: 'testType',
          label: 'Test Type',
          required: true,
          type: DairyFieldType.dropdown,
          options: [
            'alcohol',
            'clot_on_boiling',
            'density',
            'antibiotics',
            'mastitis_cmt',
            'somatic_cell_count',
            'bacteriological',
            'adulteration',
            'other',
          ],
        ),
        DairyField(key: 'result', label: 'Result', required: true),
        DairyField(key: 'unit', label: 'Unit'),
        DairyField(
          key: 'isAbnormal',
          label: 'Abnormal?',
          type: DairyFieldType.switch_,
        ),
        DairyField(
          key: 'mastitisRisk',
          label: 'Mastitis Risk',
          type: DairyFieldType.dropdown,
          options: ['low', 'medium', 'high'],
        ),
        DairyField(key: 'testedBy', label: 'Tested By'),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 42 ─ Price Rules ───────────────────────────────────────────────────────
    DairyModule(
      key: 'price-rules',
      title: 'Price Rules',
      icon: Icons.price_change_outlined,
      color: ColorConstant.success,
      description: 'Milk pricing rules (base + bonuses + penalties)',
      columns: ['name', 'basePrice', 'season', 'priority', 'isActive'],
      searchFields: ['name', 'season', 'currency'],
      fields: [
        DairyField(key: 'offtakerId', label: 'Offtaker ID (blank = all)'),
        DairyField(key: 'name', label: 'Rule Name', required: true),
        DairyField(
          key: 'currency',
          label: 'Currency',
          type: DairyFieldType.dropdown,
          options: ['UGX', 'USD', 'KES', 'TZS', 'RWF'],
        ),
        DairyField(
          key: 'basePrice',
          label: 'Base Price / Litre',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'season',
          label: 'Season',
          type: DairyFieldType.dropdown,
          options: ['all', 'dry', 'wet'],
        ),
        DairyField(
          key: 'fatBonusPerPct',
          label: 'Fat Bonus / % over baseline',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'snfBonusPerPct',
          label: 'SNF Bonus / % over baseline',
          type: DairyFieldType.number,
        ),
        DairyField(key: 'gradeAdjustJson', label: 'Grade Adjustments (JSON)'),
        DairyField(key: 'penaltyJson', label: 'Penalties (JSON)'),
        DairyField(
          key: 'coolingBonus',
          label: 'Pre-Cooling Bonus',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'minPrice',
          label: 'Min Price',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'maxPrice',
          label: 'Max Price',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'priority',
          label: 'Priority (lower = higher)',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'validFrom',
          label: 'Valid From',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(key: 'validTo', label: 'Valid To', type: DairyFieldType.date),
        DairyField(
          key: 'isActive',
          label: 'Active?',
          type: DairyFieldType.switch_,
        ),
      ],
    ),

    // 43 ─ Contracts ────────────────────────────────────────────────────────
    DairyModule(
      key: 'contracts',
      title: 'Contracts',
      icon: Icons.handshake_outlined,
      color: ColorConstant.primaryDark,
      description: 'Seller ↔ buyer milk supply contracts',
      columns: ['contractNo', 'pricingType', 'status', 'startDate', 'endDate'],
      searchFields: ['contractNo', 'pricingType', 'status', 'notes', 'penaltyTerms'],
      fields: [
        DairyField(key: 'sellerOrgUnitId', label: 'Seller Org Unit ID'),
        DairyField(key: 'buyerOfftakerId', label: 'Buyer Offtaker ID'),
        DairyField(key: 'contractNo', label: 'Contract No.', required: true),
        DairyField(
          key: 'pricingType',
          label: 'Pricing Type',
          type: DairyFieldType.dropdown,
          options: ['spot', 'fixed', 'floor', 'formula'],
        ),
        DairyField(
          key: 'pricePerLitre',
          label: 'Fixed Price / Litre',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'currency',
          label: 'Currency',
          type: DairyFieldType.dropdown,
          options: ['UGX', 'USD', 'KES', 'TZS', 'RWF'],
        ),
        DairyField(
          key: 'minLitresDay',
          label: 'Min Litres / Day',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'maxLitresDay',
          label: 'Max Litres / Day',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'startDate',
          label: 'Start Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'endDate',
          label: 'End Date',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'penaltyTerms',
          label: 'Penalty Terms',
          type: DairyFieldType.textarea,
        ),
        DairyField(
          key: 'status',
          label: 'Status',
          type: DairyFieldType.dropdown,
          options: ['draft', 'active', 'expired', 'terminated'],
        ),
        DairyField(key: 'documentUrl', label: 'Document URL'),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 44 ─ Deduction Rules ──────────────────────────────────────────────────
    DairyModule(
      key: 'deduction-rules',
      title: 'Deduction Rules',
      icon: Icons.remove_circle_outline,
      color: ColorConstant.danger,
      description: 'Auto-deduction rules applied to farmer payments',
      columns: ['name', 'deductionType', 'amount', 'appliesTo', 'isActive'],
      searchFields: ['name', 'deductionType', 'appliesTo', 'currency'],
      fields: [
        DairyField(key: 'name', label: 'Rule Name', required: true),
        DairyField(
          key: 'deductionType',
          label: 'Deduction Type',
          type: DairyFieldType.dropdown,
          options: [
            'fixed_per_litre',
            'fixed_per_day',
            'percentage',
            'fixed_amount',
          ],
        ),
        DairyField(
          key: 'amount',
          label: 'Amount',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'currency',
          label: 'Currency',
          type: DairyFieldType.dropdown,
          options: ['UGX', 'USD', 'KES', 'TZS', 'RWF'],
        ),
        DairyField(
          key: 'appliesTo',
          label: 'Applies To',
        ),
        DairyField(
          key: 'isActive',
          label: 'Active?',
          type: DairyFieldType.switch_,
        ),
      ],
    ),

    // 45 ─ Farmer Ledger ───────────────────────────────────────────────────
    DairyModule(
      key: 'farmer-ledger',
      title: 'Farmer Ledger',
      icon: Icons.account_balance_wallet_outlined,
      color: ColorConstant.gold,
      description: 'Farmer double-entry ledger (append-only)',
      columns: ['farmerName', 'entryType', 'direction', 'amount', 'postedAt'],
      searchFields: ['farmerName', 'entryType', 'direction', 'narrative', 'refType', 'currency'],
      fields: [
        DairyField(key: 'farmerId', label: 'Farmer ID', required: true),
        DairyField(key: 'farmerName', label: 'Farmer Name', required: true),
        DairyField(
          key: 'entryType',
          label: 'Entry Type',
          type: DairyFieldType.dropdown,
          required: true,
          options: [
            'milk_earning',
            'deduction',
            'payment',
            'adjustment',
            'reversal',
            'fee',
            'bonus',
            'loan_disbursement',
            'loan_repayment',
          ],
        ),
        DairyField(
          key: 'direction',
          label: 'Direction',
          type: DairyFieldType.dropdown,
          required: true,
          options: ['credit', 'debit'],
        ),
        DairyField(
          key: 'amount',
          label: 'Amount',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'currency',
          label: 'Currency',
          type: DairyFieldType.dropdown,
          options: ['UGX', 'USD', 'KES', 'TZS', 'RWF'],
        ),
        DairyField(
          key: 'refType',
          label: 'Ref Type',
          type: DairyFieldType.dropdown,
          options: ['mcc_intake', 'payment', 'deduction', 'contract', ''],
        ),
        DairyField(key: 'refId', label: 'Ref ID'),
        DairyField(
          key: 'runningBalance',
          label: 'Running Balance',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'narrative',
          label: 'Narrative',
          type: DairyFieldType.textarea,
        ),
        DairyField(key: 'postedAt', label: 'Posted At', type: DairyFieldType.date),
      ],
    ),

    // 46 ─ Payment Batches ─────────────────────────────────────────────────
    DairyModule(
      key: 'payment-batches',
      title: 'Payment Batches',
      icon: Icons.payments_outlined,
      color: ColorConstant.success,
      description: 'Bulk payment batches (dual approval)',
      columns: ['batchNo', 'totalAmount', 'totalPayments', 'channel', 'status'],
      searchFields: ['batchNo', 'channel', 'status', 'currency', 'notes'],
      fields: [
        DairyField(key: 'batchNo', label: 'Batch No.', required: true),
        DairyField(key: 'batchDate', label: 'Batch Date', type: DairyFieldType.date),
        DairyField(
          key: 'totalAmount',
          label: 'Total Amount',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'totalPayments',
          label: 'Total Payments',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'currency',
          label: 'Currency',
          type: DairyFieldType.dropdown,
          options: ['UGX', 'USD', 'KES', 'TZS', 'RWF'],
        ),
        DairyField(
          key: 'channel',
          label: 'Channel',
          type: DairyFieldType.dropdown,
          options: [
            'mobipay_wallet',
            'mtn_momo',
            'airtel_money',
            'mpesa',
            'bank',
            'cash',
          ],
        ),
        DairyField(
          key: 'status',
          label: 'Status',
          type: DairyFieldType.dropdown,
          options: [
            'draft',
            'submitted',
            'approved',
            'processing',
            'completed',
            'failed',
          ],
        ),
        DairyField(key: 'submittedBy', label: 'Submitted By'),
        DairyField(
          key: 'submittedAt',
          label: 'Submitted At',
          type: DairyFieldType.date,
        ),
        DairyField(key: 'approvedBy', label: 'Approved By'),
        DairyField(
          key: 'approvedAt',
          label: 'Approved At',
          type: DairyFieldType.date,
        ),
        DairyField(
          key: 'processedAt',
          label: 'Processed At',
          type: DairyFieldType.date,
        ),
        DairyField(
          key: 'completedAt',
          label: 'Completed At',
          type: DairyFieldType.date,
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 47 ─ Payments ────────────────────────────────────────────────────────
    DairyModule(
      key: 'payments',
      title: 'Payments',
      icon: Icons.payment_outlined,
      color: ColorConstant.info,
      description: 'Individual farmer / vendor payments',
      columns: ['payeeName', 'payeeType', 'amount', 'channel', 'status'],
      searchFields: [
        'payeeName',
        'payeePhone',
        'payeeType',
        'status',
        'channel',
        'providerRef',
        'idempotencyKey',
        'failureReason',
        'currency',
      ],
      fields: [
        DairyField(key: 'batchId', label: 'Batch ID'),
        DairyField(
          key: 'payeeType',
          label: 'Payee Type',
          type: DairyFieldType.dropdown,
          options: ['farmer', 'vet', 'transporter', 'supplier', 'mcc'],
        ),
        DairyField(key: 'payeeId', label: 'Payee ID', required: true),
        DairyField(key: 'payeeName', label: 'Payee Name', required: true),
        DairyField(key: 'payeePhone', label: 'Payee Phone (MSISDN)'),
        DairyField(
          key: 'amount',
          label: 'Amount',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'feeAmount',
          label: 'Fee Amount',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'currency',
          label: 'Currency',
          type: DairyFieldType.dropdown,
          options: ['UGX', 'USD', 'KES', 'TZS', 'RWF'],
        ),
        DairyField(
          key: 'channel',
          label: 'Channel',
          type: DairyFieldType.dropdown,
          options: [
            'mobipay_wallet',
            'mtn_momo',
            'airtel_money',
            'mpesa',
            'bank',
            'cash',
          ],
        ),
        DairyField(key: 'idempotencyKey', label: 'Idempotency Key', required: true),
        DairyField(key: 'providerRef', label: 'Provider Reference'),
        DairyField(
          key: 'status',
          label: 'Status',
          type: DairyFieldType.dropdown,
          options: ['pending', 'processing', 'success', 'failed', 'reversed'],
        ),
        DairyField(key: 'failureReason', label: 'Failure Reason'),
        DairyField(
          key: 'initiatedAt',
          label: 'Initiated At',
          type: DairyFieldType.date,
        ),
        DairyField(
          key: 'completedAt',
          label: 'Completed At',
          type: DairyFieldType.date,
        ),
      ],
    ),

    // 48 ─ Credit Scores ────────────────────────────────────────────────────
    DairyModule(
      key: 'credit-scores',
      title: 'Credit Scores',
      icon: Icons.credit_score_outlined,
      color: ColorConstant.secondaryLight,
      description: 'Data-driven farmer credit scores',
      columns: ['farmerName', 'score', 'band', 'scoredOn'],
      searchFields: ['farmerName', 'band', 'modelVersion', 'notes'],
      fields: [
        DairyField(key: 'farmerId', label: 'Farmer ID', required: true),
        DairyField(key: 'farmerName', label: 'Farmer Name', required: true),
        DairyField(
          key: 'scoredOn',
          label: 'Scored On',
          type: DairyFieldType.date,
        ),
        DairyField(
          key: 'score',
          label: 'Score (300-900)',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'band',
          label: 'Band',
          type: DairyFieldType.dropdown,
          required: true,
          options: ['A', 'B', 'C', 'D', 'E'],
        ),
        DairyField(
          key: 'monthsOfHistory',
          label: 'Months of History',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'avgMonthlyIncome',
          label: 'Avg Monthly Income',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'volumeConsistency',
          label: 'Volume Consistency (0-1)',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'qualityIndex',
          label: 'Quality Index (0-1)',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'herdHealthIndex',
          label: 'Herd Health Index (0-1)',
          type: DairyFieldType.number,
        ),
        DairyField(key: 'modelVersion', label: 'Model Version'),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 49 ─ Market Listings ─────────────────────────────────────────────────
    DairyModule(
      key: 'market-listings',
      title: 'Market Listings',
      icon: Icons.storefront_outlined,
      color: ColorConstant.secondary,
      description: 'Marketplace: live animals, feed, drugs, equipment',
      columns: ['title', 'listingType', 'price', 'quantity', 'status'],
      searchFields: [
        'title',
        'sellerName',
        'description',
        'listingType',
        'unit',
        'location',
        'currency',
        'status',
      ],
      fields: [
        DairyField(
          key: 'sellerType',
          label: 'Seller Type',
          type: DairyFieldType.dropdown,
          options: ['farmer', 'vet', 'supplier', 'offtaker'],
        ),
        DairyField(key: 'sellerId', label: 'Seller ID', required: true),
        DairyField(key: 'sellerName', label: 'Seller Name', required: true),
        DairyField(
          key: 'listingType',
          label: 'Listing Type',
          type: DairyFieldType.dropdown,
          options: ['live_animal', 'feed', 'vet_drug', 'equipment', 'semen'],
        ),
        DairyField(key: 'animalId', label: 'Animal ID (if live_animal)'),
        DairyField(key: 'title', label: 'Title', required: true),
        DairyField(
          key: 'description',
          label: 'Description',
          type: DairyFieldType.textarea,
        ),
        DairyField(
          key: 'price',
          label: 'Price',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'currency',
          label: 'Currency',
          type: DairyFieldType.dropdown,
          options: ['UGX', 'USD', 'KES', 'TZS', 'RWF'],
        ),
        DairyField(
          key: 'quantity',
          label: 'Quantity',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'unit',
          label: 'Unit',
          type: DairyFieldType.dropdown,
          options: ['each', 'kg', 'litres', 'doses'],
        ),
        DairyField(key: 'imageUrl', label: 'Image URL'),
        DairyField(key: 'location', label: 'Location'),
        DairyField(
          key: 'status',
          label: 'Status',
          type: DairyFieldType.dropdown,
          options: ['active', 'sold', 'cancelled', 'expired'],
        ),
        DairyField(
          key: 'expiresAt',
          label: 'Expires At',
          type: DairyFieldType.date,
        ),
      ],
    ),

    // 50 ─ Market Orders ───────────────────────────────────────────────────
    DairyModule(
      key: 'market-orders',
      title: 'Market Orders',
      icon: Icons.shopping_cart_outlined,
      color: ColorConstant.warning,
      description: 'Buy orders on marketplace listings',
      columns: ['buyerName', 'quantity', 'unitPrice', 'totalAmount', 'status'],
      searchFields: [
        'buyerName',
        'buyerType',
        'status',
        'paymentStatus',
        'escrowRef',
        'currency',
        'notes',
      ],
      fields: [
        DairyField(key: 'listingId', label: 'Listing ID', required: true),
        DairyField(
          key: 'buyerType',
          label: 'Buyer Type',
          type: DairyFieldType.dropdown,
          options: ['farmer', 'vet', 'supplier', 'offtaker'],
        ),
        DairyField(key: 'buyerId', label: 'Buyer ID', required: true),
        DairyField(key: 'buyerName', label: 'Buyer Name', required: true),
        DairyField(
          key: 'quantity',
          label: 'Quantity',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'unitPrice',
          label: 'Unit Price',
          type: DairyFieldType.number,
          required: true,
        ),
        DairyField(
          key: 'totalAmount',
          label: 'Total Amount',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'currency',
          label: 'Currency',
          type: DairyFieldType.dropdown,
          options: ['UGX', 'USD', 'KES', 'TZS', 'RWF'],
        ),
        DairyField(
          key: 'status',
          label: 'Status',
          type: DairyFieldType.dropdown,
          options: [
            'pending',
            'accepted',
            'rejected',
            'paid',
            'shipped',
            'completed',
            'cancelled',
          ],
        ),
        DairyField(key: 'escrowRef', label: 'Escrow Reference'),
        DairyField(
          key: 'paymentStatus',
          label: 'Payment Status',
          type: DairyFieldType.dropdown,
          options: ['unpaid', 'escrow_held', 'released', 'refunded'],
        ),
        DairyField(key: 'notes', label: 'Notes', type: DairyFieldType.textarea),
      ],
    ),

    // 51 ─ Farmer Statements ────────────────────────────────────────────────
    DairyModule(
      key: 'farmer-statements',
      title: 'Farmer Statements',
      icon: Icons.summarize_outlined,
      color: ColorConstant.primaryLight,
      description: 'Periodic farmer statements (earnings, deductions, payments)',
      columns: ['farmerName', 'statementNo', 'periodStart', 'periodEnd', 'closingBalance'],
      searchFields: ['farmerName', 'statementNo', 'status', 'currency'],
      fields: [
        DairyField(key: 'farmerId', label: 'Farmer ID', required: true),
        DairyField(key: 'farmerName', label: 'Farmer Name', required: true),
        DairyField(key: 'statementNo', label: 'Statement No.', required: true),
        DairyField(
          key: 'periodStart',
          label: 'Period Start',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'periodEnd',
          label: 'Period End',
          type: DairyFieldType.date,
          required: true,
        ),
        DairyField(
          key: 'totalMilkLitres',
          label: 'Total Milk (Litres)',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'totalEarnings',
          label: 'Total Earnings',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'totalDeductions',
          label: 'Total Deductions',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'totalPayments',
          label: 'Total Payments',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'closingBalance',
          label: 'Closing Balance',
          type: DairyFieldType.number,
        ),
        DairyField(
          key: 'currency',
          label: 'Currency',
          type: DairyFieldType.dropdown,
          options: ['UGX', 'USD', 'KES', 'TZS', 'RWF'],
        ),
        DairyField(key: 'pdfUrl', label: 'PDF URL'),
        DairyField(
          key: 'status',
          label: 'Status',
          type: DairyFieldType.dropdown,
          options: ['generated', 'sent', 'acknowledged'],
        ),
        DairyField(key: 'sentAt', label: 'Sent At', type: DairyFieldType.date),
        DairyField(
          key: 'acknowledgedAt',
          label: 'Acknowledged At',
          type: DairyFieldType.date,
        ),
      ],
    ),
  ];

  /// Look up a module by its endpoint key (e.g. `cows`, `feed-items`).
  static DairyModule? byKey(String key) {
    for (final m in all) {
      if (m.key == key) return m;
    }
    return null;
  }
}
