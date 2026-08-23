import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/domain/config/env_config.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// Ekibbo Field-Officer module list screen — serves Trainings, Farmer
/// Visits, Surveys and Loans from the Agrobase platform
/// (/api/mobile/ekibbo-modules?type=…), tenant-scoped.
/// ─────────────────────────────────────────────────────────────────────────
class EkibboModuleListScreen extends StatefulWidget {
  const EkibboModuleListScreen({
    super.key,
    required this.type,
    required this.title,
  });

  final String type; // trainings | farm-visits | surveys | loans
  final String title;

  @override
  State<EkibboModuleListScreen> createState() => _EkibboModuleListScreenState();
}

class _EkibboModuleListScreenState extends State<EkibboModuleListScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _rows = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final dio = Dio(BaseOptions(
        baseUrl: EnvConfig.domainStream,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        validateStatus: (s) => true,
        headers: {
          'Authorization': 'Bearer ${SharedPreferencesProvider.instance.accessToken}',
          'x-app-client': 'agrobase-ekibbo-flutter',
        },
      ));
      final res = await dio.get('/mobile/ekibbo-modules', queryParameters: {'type': widget.type});
      if (!mounted) return;
      if (res.statusCode == 200 && res.data['result'] == true) {
        setState(() {
          _rows = (res.data['data'] as List).cast<Map<String, dynamic>>();
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(title: widget.title, color: ColorConstant.primary, titleColor: Colors.white),
      body: RefreshIndicator(
        color: ColorConstant.primary,
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ColorConstant.primary))
            : _rows.isEmpty
                ? ListView(children: const [Padding(
                    padding: EdgeInsets.only(top: 120),
                    child: NoDataView(),
                  )])
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _rows.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _card(_rows[i]),
                  ),
      ),
    );
  }

  Widget _card(Map<String, dynamic> r) {
    final status = (r['status'] ?? '').toString();
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ColorConstant.grayF7F8FA,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  _titleOf(r),
                  style: TextStyleConstant.quicksandW600(fontSize: 15),
                ),
              ),
              if (status.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: _statusColor(status).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    status,
                    style: TextStyleConstant.robotoW400(fontSize: 10, color: _statusColor(status)),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            _subtitleOf(r),
            style: TextStyleConstant.robotoW400(fontSize: 12, color: ColorConstant.text79),
          ),
        ],
      ),
    );
  }

  String _titleOf(Map<String, dynamic> r) {
    switch (widget.type) {
      case 'trainings':
        return '${r['topic']}';
      case 'farm-visits':
        return '${r['farmerName']} — ${r['topic']}';
      case 'surveys':
        return '${r['title']}';
      case 'loans':
        return '${r['farmerName']}';
      default:
        return '';
    }
  }

  String _subtitleOf(Map<String, dynamic> r) {
    switch (widget.type) {
      case 'trainings':
        return '${r['date']} · ${r['location'] ?? '—'} · ${r['trainer'] ?? '—'} · ${r['attendees'] ?? 0} attendees';
      case 'farm-visits':
        return '${r['visitDate']} · ${r['farmerCode'] ?? ''}';
      case 'surveys':
        return '${r['questions'] ?? 0} questions · ${r['responses'] ?? 0} responses';
      case 'loans':
        return 'UGX ${r['amount']} · ${r['date']}';
      default:
        return '';
    }
  }

  Color _statusColor(String s) {
    switch (s.toUpperCase()) {
      case 'COMPLETED':
      case 'ACTIVE':
      case 'APPROVED':
      case 'DISBURSED':
        return const Color(0xFF059669);
      case 'SCHEDULED':
      case 'ONGOING':
      case 'PENDING':
        return const Color(0xFFB45309);
      case 'CANCELLED':
      case 'REJECTED':
        return const Color(0xFFDC2626);
      default:
        return ColorConstant.primary;
    }
  }
}
