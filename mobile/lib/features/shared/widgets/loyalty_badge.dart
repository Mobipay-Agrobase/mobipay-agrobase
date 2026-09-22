import 'dart:math' as math;
import 'package:flutter/material.dart';

/// LoyaltyBadge — a circular donut badge showing the farmer's loyalty tier
/// (New / Engaged / Active / Loyal / Champion) based on a 0–4 stage score.
///
/// Stages:
///   1 = Training/Visit · 2 = Input Uptake · 3 = Sold Produce · 4 = Repeat Seller
///
/// The badge renders as a 4-segment donut ring (completed stages colored,
/// incomplete faint) with the tier short label + "X/4" in the center.
/// Matches the web design (Phase 2 Loyalty Cycle).
class LoyaltyBadge extends StatelessWidget {
  /// Number of completed stages (0–4).
  final int stages;

  /// Whether to show the long label ("Champion") or short ("Champ").
  /// Default: short (mobile-friendly).
  final bool useLongLabel;

  /// Badge diameter in logical pixels. Default: 64.
  final double size;

  const LoyaltyBadge({
    super.key,
    required this.stages,
    this.useLongLabel = false,
    this.size = 64,
  });

  /// Tier config: label + short label + color (hex matching the web).
  static const _tiers = <_Tier>[
    _Tier(label: 'New', short: 'New', color: Color(0xFF94A3B8)),       // slate-400
    _Tier(label: 'Engaged', short: 'Engaged', color: Color(0xFF60A5FA)),  // blue-400
    _Tier(label: 'Active', short: 'Active', color: Color(0xFFFBBF24)),    // amber-400
    _Tier(label: 'Loyal', short: 'Loyal', color: Color(0xFF34D399)),      // emerald-400
    _Tier(label: 'Champion', short: 'Champ', color: Color(0xFFFB7185)),   // rose-400
  ];

  @override
  Widget build(BuildContext context) {
    final clamped = stages.clamp(0, 4);
    final tier = _tiers[clamped];
    final label = useLongLabel ? tier.label : tier.short;

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Donut ring (custom painted)
          CustomPaint(
            size: Size(size, size),
            painter: _DonutPainter(
              stages: clamped,
              color: tier.color,
            ),
          ),
          // Center text
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: size * 0.14, // ~9px at size 64
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  letterSpacing: 0.5,
                  height: 1.1,
                ),
              ),
              const SizedBox(height: 1),
              Text(
                '$clamped/4',
                style: TextStyle(
                  fontSize: size * 0.115, // ~7.5px at size 64
                  fontWeight: FontWeight.w500,
                  color: Colors.white.withValues(alpha: 0.7),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// CustomPainter that draws a 4-segment donut ring.
/// Each segment is 90°. Completed segments are tier-colored, incomplete
/// are faint white. Small gap between segments for a clean look.
class _DonutPainter extends CustomPainter {
  final int stages;
  final Color color;

  _DonutPainter({required this.stages, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 4; // 4px padding for stroke
    final strokeWidth = size.width * 0.06; // proportional to size
    // Use 270° of arc per segment (90°) with a small gap
    final segmentSweep = 90.0 * math.pi / 180;
    final gapSweep = 6.0 * math.pi / 180; // 6° gap between segments
    final effectiveSweep = segmentSweep - gapSweep;
    // Start at top (-90°) — same convention as CSS -rotate-90 for SVG
    final startAngle = -math.pi / 2;

    final basePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.12)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final activePaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    // Draw all 4 segments. Completed segments use activePaint, others basePaint.
    for (var i = 0; i < 4; i++) {
      final segStart = startAngle + i * segmentSweep + gapSweep / 2;
      final paint = i < stages ? activePaint : basePaint;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        segStart,
        effectiveSweep,
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_DonutPainter old) =>
      old.stages != stages || old.color != color;
}

class _Tier {
  final String label;
  final String short;
  final Color color;
  const _Tier({
    required this.label,
    required this.short,
    required this.color,
  });
}

/// Extract the stages count (0–4) from a /api/farmers/[id]/loyalty
/// response, or from the inline `loyalty` block in /api/farmers/[id].
/// Returns null if the response is null/missing — caller should handle
/// (e.g. show a placeholder badge).
int? stagesFromLoyaltyJson(Map<String, dynamic>? json) {
  if (json == null) return null;
  final s = json['stages'];
  if (s is int) return s;
  if (s is num) return s.toInt();
  // Fallback: count true stageFlags
  final flags = json['stageFlags'];
  if (flags is Map) {
    return flags.values.where((v) => v == true).length;
  }
  return null;
}

