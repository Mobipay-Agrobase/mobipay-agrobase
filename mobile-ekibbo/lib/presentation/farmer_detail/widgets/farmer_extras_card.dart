import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:qr_flutter/qr_flutter.dart';

import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/config/env_config.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// Farmer ID card + Ekibbo Loyalty + Climate Credit Score — the three
/// missing pieces of the farmer detail page. Data comes from
/// /api/mobile/ekibbo-farmer-detail/[id] (loyalty + creditScore + qrData).
/// ─────────────────────────────────────────────────────────────────────────
class FarmerExtrasCard extends StatefulWidget {
  const FarmerExtrasCard({super.key, required this.farmerId});

  final int farmerId;

  @override
  State<FarmerExtrasCard> createState() => _FarmerExtrasCardState();
}

class _FarmerExtrasCardState extends State<FarmerExtrasCard> {
  bool _loading = true;
  Map<String, dynamic>? _loyalty;
  Map<String, dynamic>? _credit;
  String? _qrData;

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
          // fresh token per request (widget may outlive a login)
          'Authorization': 'Bearer ${SharedPreferencesProvider.instance.accessToken}',
          'x-app-client': 'agrobase-ekibbo-flutter',
        },
      ));
      final res = await dio.get('/mobile/ekibbo-farmer-detail/${widget.farmerId}');
      if (res.statusCode == 200 && res.data['result'] == true) {
        setState(() {
          _loyalty = res.data['loyalty'] as Map<String, dynamic>?;
          _credit = res.data['creditScore'] as Map<String, dynamic>?;
          _qrData = res.data['qrData'] as String?;
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(child: CircularProgressIndicator(color: ColorConstant.primary)),
      );
    }

    final tier = (_loyalty?['tier'] ?? 'NONE') as String;
    final points = (_loyalty?['points'] ?? 0) as num;
    final score = _credit != null ? (_credit!['totalScore'] ?? _credit!['score']) : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Farmer ID card with QR ──
        if (_qrData != null)
          Container(
            margin: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(15),
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  offset: const Offset(4, 4),
                  blurRadius: 15,
                  color: Colors.black.withOpacity(0.15),
                )
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        SvgPicture.asset('ic_profile'.iconSvg, color: ColorConstant.primary),
                        const SizedBox(width: 8),
                        Text('FARMER ID CARD',
                            style: TextStyleConstant.quicksandW700(
                                fontSize: 13, color: ColorConstant.primary)),
                      ]),
                      const SizedBox(height: 8),
                      Text('Scan to verify this farmer on the Agrobase platform.',
                          style: TextStyleConstant.robotoW400(
                              fontSize: 11, color: ColorConstant.text79)),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: ColorConstant.primary, width: 2),
                  ),
                  child: QrImageView(
                    data: _qrData!,
                    version: QrVersions.auto,
                    size: 84,
                    backgroundColor: Colors.white,
                    padding: EdgeInsets.zero,
                    eyeStyle: QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: ColorConstant.primary,
                    ),
                    dataModuleStyle: QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: ColorConstant.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),

        // ── Loyalty + Credit score row ──
        Container(
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Row(
            children: [
              // Loyalty card
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(15),
                    color: _tierColor(tier).withOpacity(0.12),
                    border: Border.all(color: _tierColor(tier), width: 1.5),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Icon(Icons.card_giftcard, size: 16, color: _tierColor(tier)),
                        const SizedBox(width: 6),
                        Text('LOYALTY',
                            style: TextStyleConstant.quicksandW700(
                                fontSize: 11, color: _tierColor(tier))),
                      ]),
                      const SizedBox(height: 8),
                      Text('$points pts',
                          style: TextStyleConstant.worksansW600(
                              fontSize: 20, color: _tierColor(tier))),
                      const SizedBox(height: 2),
                      Text(tier == 'NONE' ? 'No sales yet' : '$tier member',
                          style: TextStyleConstant.robotoW400(
                              fontSize: 11, color: ColorConstant.text79)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Credit score card
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(15),
                    color: ColorConstant.primary.withOpacity(0.08),
                    border: Border.all(color: ColorConstant.primary, width: 1.5),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Icon(Icons.eco_outlined, size: 16, color: ColorConstant.primary),
                        const SizedBox(width: 6),
                        Text('CREDIT SCORE',
                            style: TextStyleConstant.quicksandW700(
                                fontSize: 11, color: ColorConstant.primary)),
                      ]),
                      const SizedBox(height: 8),
                      Text(score != null ? '$score/100' : '—',
                          style: TextStyleConstant.worksansW600(
                              fontSize: 20, color: ColorConstant.primary)),
                      const SizedBox(height: 2),
                      Text(_credit != null
                          ? 'Climate resilience (${_credit!['category'] ?? '—'})'
                          : 'Not yet computed',
                          style: TextStyleConstant.robotoW400(
                              fontSize: 11, color: ColorConstant.text79)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Color _tierColor(String tier) {
    switch (tier) {
      case 'GOLD':
        return const Color(0xFFB8860B);
      case 'SILVER':
        return const Color(0xFF6B7280);
      case 'BRONZE':
        return const Color(0xFFB45309);
      default:
        return ColorConstant.primary;
    }
  }
}
