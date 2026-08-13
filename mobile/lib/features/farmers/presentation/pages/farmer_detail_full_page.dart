import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../../core/api/api_client.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/loading_shimmer.dart';
import '../../../shared/widgets/empty_state.dart';

/// Farmer Detail Page — full 8-section view with multi-entry add/remove.
///
/// Sections:
/// 1. Profile (demographics, contact, location)
/// 2. Family (spouse, children, housing)
/// 3. Finance (income, loans)
/// 4. Bank Accounts (multi-entry CRUD)
/// 5. Insurance (multi-entry CRUD)
/// 6. Livestock (multi-entry CRUD)
/// 7. Equipment (multi-entry CRUD)
class FarmerDetailPage extends StatefulWidget {
  final String farmerId;

  const FarmerDetailPage({super.key, required this.farmerId});

  @override
  State<FarmerDetailPage> createState() => _FarmerDetailPageState();
}

class _FarmerDetailPageState extends State<FarmerDetailPage> {
  final ApiClient _api = ApiClient();
  Map<String, dynamic>? _farmer;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadFarmer();
  }

  Future<void> _loadFarmer() async {
    try {
      final res = await _api.get('/api/farmers/${widget.farmerId}');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          _farmer = data['data'] ?? data['farmer'];
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 5,
      child: Scaffold(
        appBar: AppBar(
          title: Text(_farmer != null
              ? '${_farmer!['firstName'] ?? ''} ${_farmer!['lastName'] ?? ''}'
              : 'Farmer Detail'),
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: 'Profile'),
              Tab(text: 'Family'),
              Tab(text: 'Bank'),
              Tab(text: 'Insurance'),
              Tab(text: 'Livestock'),
            ],
          ),
        ),
        body: _loading
            ? const LoadingShimmer()
            : _farmer == null
                ? const EmptyState(icon: Icons.error, title: 'Not Found', message: 'Farmer not found')
                : TabBarView(
                    children: [
                      _buildProfileTab(),
                      _buildFamilyTab(),
                      _buildMultiEntryTab(
                        'Bank Accounts',
                        'bank-accounts',
                        'accounts',
                        ['accountType', 'accountNo', 'bankName', 'branchDetails'],
                      ),
                      _buildMultiEntryTab(
                        'Insurance',
                        'insurances',
                        'insurances',
                        ['insuranceType', 'provider', 'amount'],
                      ),
                      _buildMultiEntryTab(
                        'Livestock',
                        'animals',
                        'animals',
                        ['animalType', 'count', 'breedName'],
                      ),
                    ],
                  ),
      ),
    );
  }

  Widget _buildProfileTab() {
    final f = _farmer!;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildSection('Farmer Information', [
          _buildInfoRow('Code', f['farmerCode']),
          _buildInfoRow('Phone', f['phone']),
          _buildInfoRow('Gender', f['gender']),
          _buildInfoRow('DOB', f['dateOfBirth'] != null ? f['dateOfBirth'].substring(0, 10) : 'NA'),
          _buildInfoRow('Education', f['education']),
          _buildInfoRow('Marital Status', f['maritalStatus']),
          _buildInfoRow('Extension Officer', f['extensionOfficer']),
        ]),
        const SizedBox(height: 16),
        _buildSection('Location', [
          _buildInfoRow('District', f['district']),
          _buildInfoRow('Sub-county', f['commune']),
          _buildInfoRow('Village', f['villageName']),
          _buildInfoRow('GPS Lat', f['gpsLatitude']?.toString()),
          _buildInfoRow('GPS Lng', f['gpsLongitude']?.toString()),
          _buildInfoRow('Farm Size (ha)', f['farmSize']?.toString()),
          _buildInfoRow('Land Ownership', f['farmOwnership']),
        ]),
      ],
    );
  }

  Widget _buildFamilyTab() {
    final f = _farmer!;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildSection('Family Information', [
          _buildInfoRow('Spouse Name', f['spouseName']),
          _buildInfoRow('Family Members', f['familyMembers']?.toString()),
          _buildInfoRow('Children < 18', f['childrenUnder18']?.toString()),
          _buildInfoRow('School Going', f['schoolGoingChildren']?.toString()),
          _buildInfoRow('Housing Ownership', f['housingOwnership']),
          _buildInfoRow('House Type', f['houseType']),
          _buildInfoRow('Meals/Day', f['mealsPerDay']),
          _buildInfoRow('Fuel Type', f['fuelType']),
        ]),
        const SizedBox(height: 16),
        _buildSection('Financial Information', [
          _buildInfoRow('Monthly Income', f['monthlyHouseholdIncome'] != null ? 'UGX ${f['monthlyHouseholdIncome']}' : 'NA'),
          _buildInfoRow('Annual Income', f['annualHouseholdIncome'] != null ? 'UGX ${f['annualHouseholdIncome']}' : 'NA'),
          _buildInfoRow('Primary Income Source', f['primaryIncomeSource']),
        ]),
      ],
    );
  }

  Widget _buildMultiEntryTab(String title, String endpoint, String dataKey, List<String> fields) {
    final items = (_farmer?['farmerBankAccounts'] as List?) ??
        (_farmer?['farmerInsurances'] as List?) ??
        (_farmer?['farmerAnimals'] as List?) ??
        (_farmer?['farmerEquipment'] as List?) ??
        [];

    // Determine which list to show based on endpoint
    List<dynamic> list = [];
    if (endpoint == 'bank-accounts') list = _farmer?['farmerBankAccounts'] as List? ?? [];
    else if (endpoint == 'insurances') list = _farmer?['farmerInsurances'] as List? ?? [];
    else if (endpoint == 'animals') list = _farmer?['farmerAnimals'] as List? ?? [];
    else if (endpoint == 'equipment') list = _farmer?['farmerEquipment'] as List? ?? [];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('$title (${list.length})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ElevatedButton.icon(
              onPressed: () => _showAddDialog(title, endpoint, fields),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (list.isEmpty)
          Card(child: Padding(padding: const EdgeInsets.all(16), child: Center(child: Text('No $title records. Tap "Add" to create one.'))))
        else
          ...list.map((item) => Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              title: Text(fields.map((f) => item[f]?.toString() ?? 'NA').join(' · '), style: const TextStyle(fontSize: 14)),
              trailing: IconButton(
                icon: const Icon(Icons.delete, color: Colors.red, size: 18),
                onPressed: () => _deleteItem(endpoint, item['id']),
              ),
            ),
          )),
      ],
    );
  }

  void _showAddDialog(String title, String endpoint, List<String> fields) {
    final controllers = <String, TextEditingController>{};
    for (final f in fields) {
      controllers[f] = TextEditingController();
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Add $title'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView(
            shrinkWrap: true,
            children: fields.map((f) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: TextField(
                controller: controllers[f],
                decoration: InputDecoration(labelText: f, border: const OutlineInputBorder()),
              ),
            )).toList(),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final body = <String, dynamic>{};
              for (final f in fields) {
                body[f] = controllers[f]!.text;
              }
              Navigator.pop(ctx);
              final res = await _api.post('/api/farmers/${widget.farmerId}/$endpoint', body: body);
              if (res.statusCode == 201) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$title added')));
                _loadFarmer();
              } else {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to add')));
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteItem(String endpoint, String itemId) async {
    final res = await _api.delete('/api/farmers/${widget.farmerId}/$endpoint?itemId=$itemId');
    if (res.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Deleted')));
      _loadFarmer();
    }
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String? value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: Colors.grey[600])),
          Text(value ?? 'NA', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
