import 'package:flutter/material.dart';

/// EKiBBO Agrobase — Color Palette
/// ─────────────────────────────────────────────────────────────
/// Inspired by EKiBBO Coffee Exporters' brand identity (Uganda):
///   - Coffee brown tones (primary brand color)
///   - Forest green (agriculture / sustainability)
///   - Cream / off-white (background, packaging)
///   - Gold accent (premium coffee export)
///
/// Originally this file came from fa-upstream-mobile (Farm Angel Upstream),
/// which used a bright green primary (#0DC619). EKiBBO uses a deeper,
/// coffee-themed palette to match its brand.
class ColorConstant {
  // ─── Primary brand colors ───
  /// Deep coffee brown — primary brand color (EKiBBO = coffee exporter)
  static const Color primary = Color(0xFF6F4E37);       // coffee brown
  static const Color primaryDark = Color(0xFF4A3220);  // dark roast
  static const Color primaryLight = Color(0xFFA87C5C); // light roast

  // ─── Secondary / accent ───
  /// Forest green — agriculture / sustainability / "growing"
  static const Color secondary = Color(0xFF2D6A4F);    // forest green
  static const Color secondaryLight = Color(0xFF52B788);// mint accent

  /// Gold — premium coffee export / harvest / value
  static const Color gold = Color(0xFFD4A24E);         // gold accent

  // ─── Background / surface ───
  static const Color background = Color(0xFFFAF7F2);   // cream / off-white
  static const Color surface = Color(0xFFFFFFFF);
  static const Color grayEB = Color(0xFFEBEBEB);
  static const Color grayF6F7F9 = Color(0xFFF6F7F9);
  static const Color grayEDEFF4 = Color(0xFFEDEFF4);

  // ─── Text ───
  static const Color heading = Color(0xFF1C1F34);     // dark navy heading
  static const Color text79 = Color(0xFF797979);      // muted body text
  static const Color textSecondary = Color(0xFF6C757D);
  static const Color textPrimary = Color(0xFF212529);

  // ─── Status colors ───
  static const Color success = Color(0xFF28A745);    // active / approved
  static const Color warning = Color(0xFFFFC107);     // pending
  static const Color danger = Color(0xFFDC3545);      // rejected / overdue
  static const Color info = Color(0xFF17A2B8);        // informational

  // ─── Role-specific colors (login screen role selection) ───
  static const Color roleAdmin = Color(0xFF6F4E37);   // coffee brown
  static const Color roleFieldOfficer = Color(0xFF2D6A4F); // forest green
  static const Color roleFarmer = Color(0xFFD4A24E);  // gold

  // ─── Misc ───
  static const Color greyEBEBEB = Color(0xFFEBEBEB);
  static const Color gray6C757D = Color(0xFF6C757D);
}
