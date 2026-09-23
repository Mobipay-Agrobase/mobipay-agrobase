import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';

/// ZIWA360 Dairy — Module configurations for all 29 dairy sub-modules.
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

/// Static registry of all 29 ZIWA360 dairy modules.
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
  ];

  /// Look up a module by its endpoint key (e.g. `cows`, `feed-items`).
  static DairyModule? byKey(String key) {
    for (final m in all) {
      if (m.key == key) return m;
    }
    return null;
  }
}
