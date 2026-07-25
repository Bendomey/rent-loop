// Single source of truth for all RentLoop Manager design tokens.
// Derived from Design Tokens v1.0 (Manager App handoff, June 2026).
// Every color, size, radius, and shadow in the app must trace back here.

import 'package:flutter/material.dart';

abstract final class RLTokens {
  // ── Brand ──────────────────────────────────────────────────────────────────
  static const Color crimson = Color(0xFFC8003A);
  static const Color crimsonTint = Color.fromRGBO(200, 0, 58, 0.08);
  static const Color crimsonTint2 = Color.fromRGBO(200, 0, 58, 0.14);

  // ── Ink & text ─────────────────────────────────────────────────────────────
  static const Color ink = Color(0xFF111110);
  static const Color inkSoft = Color(0xFF3A3935);
  static const Color muted = Color.fromRGBO(17, 17, 16, 0.55);
  static const Color mutedSoft = Color.fromRGBO(17, 17, 16, 0.40);
  static const Color micro = Color.fromRGBO(17, 17, 16, 0.30);

  // ── Surfaces & lines ───────────────────────────────────────────────────────
  static const Color surface = Color(0xFFFFFFFF);
  static const Color paper = Color(0xFFFAFAF8);
  static const Color fill = Color(0xFFF4F4F2);
  static const Color hairline = Color.fromRGBO(17, 17, 16, 0.12);
  static const Color hairlineSoft = Color.fromRGBO(17, 17, 16, 0.07);

  // ── Status tones — fg / bg pairs ───────────────────────────────────────────
  static const Color success = Color(0xFF157A47);
  static const Color successBg = Color.fromRGBO(27, 158, 92, 0.13);
  static const Color info = Color(0xFF2456C4);
  static const Color infoBg = Color.fromRGBO(46, 108, 246, 0.12);
  static const Color warning = Color(0xFFBD5E16);
  static const Color warningBg = Color.fromRGBO(233, 123, 42, 0.16);
  static const Color danger = Color(0xFFC8003A); // same as crimson
  static const Color dangerBg = Color.fromRGBO(200, 0, 58, 0.10);
  static const Color neutral = Color(0xFF555555);
  static const Color neutralBg = Color.fromRGBO(17, 17, 16, 0.06);

  // ── Spacing (4px base grid) ────────────────────────────────────────────────
  static const double space1 = 6; // icon-to-label gaps, dot spacing
  static const double space2 = 10; // gap between stacked cards / list items
  static const double space3 = 14; // row leading-to-content gap
  static const double space4 = 16; // default card padding
  static const double space5 = 20; // screen horizontal gutter
  static const double space6 = 22; // section label top-margin
  static const double gutter = 20; // screen side padding

  // ── Radius ─────────────────────────────────────────────────────────────────
  static const double rSm = 10; // icon tiles, small chips
  static const double rMd = 12; // buttons, inputs
  static const double rLg = 16; // cards — default container radius
  static const double rXl = 22; // bottom sheets (top corners only)
  static const double rPill = 999; // status pills, filter chips

  // ── Layout constants (iOS, 1×) ─────────────────────────────────────────────
  static const double statusTop = 56; // clears status bar / Dynamic Island
  static const double tabbarH =
      84; // tab bar height incl. home-indicator safe area

  // ── Type scale (px at 1×, 402pt design width) ─────────────────────────────
  static const double textDisplay = 40; // hero numbers (serif)
  static const double textTitle = 28; // screen title (serif)
  static const double textCardHead = 18; // card heading (serif)
  static const double textBarTitle = 16; // nav bar / sheet title (sans 600)
  static const double textRowTitle = 15; // list row title (sans 600)
  static const double textAction = 14.5; // button label (sans 600)
  static const double textBody = 14; // body / input (sans 400)
  static const double textSubtitle = 12.5; // captions, subtitles (sans 400)
  static const double textLabel =
      10.5; // eyebrows, section labels (mono 500 uppercase)

  // ── Type weights ───────────────────────────────────────────────────────────
  static const FontWeight regular = FontWeight.w400;
  static const FontWeight medium = FontWeight.w500;
  static const FontWeight semibold = FontWeight.w600;
  static const FontWeight bold = FontWeight.w700;

  // ── Font families (bundled assets) ────────────────────────────────────────
  static const String fontSans = 'DMSans'; // body, UI, buttons
  static const String fontSerif = 'DMSerifDisplay'; // headings, numbers
  static const String fontMono = 'JetBrainsMono'; // labels, metadata

  // ── Elevation / shadows ────────────────────────────────────────────────────
  // elev-0: border only (no shadow) — default cards, use hairline + surface
  static const List<BoxShadow> elev1 = [
    BoxShadow(
      color: Color.fromRGBO(0, 0, 0, 0.08),
      blurRadius: 3,
      offset: Offset(0, 1),
    ),
  ];
  // Sticky bottom action bars
  static const List<BoxShadow> elevBar = [
    BoxShadow(
      color: Color.fromRGBO(17, 17, 16, 0.18),
      blurRadius: 18,
      spreadRadius: -10,
      offset: Offset(0, -6),
    ),
  ];
  // Floating action button
  static const List<BoxShadow> elevFab = [
    BoxShadow(
      color: Color.fromRGBO(17, 17, 16, 0.35),
      blurRadius: 16,
      spreadRadius: -6,
      offset: Offset(0, 6),
    ),
  ];
  // Bottom sheet (over 35% ink scrim)
  static const List<BoxShadow> elevSheet = [
    BoxShadow(
      color: Color.fromRGBO(0, 0, 0, 0.25),
      blurRadius: 40,
      spreadRadius: -12,
      offset: Offset(0, -10),
    ),
  ];
}

// ── Status tone system ──────────────────────────────────────────────────────
// Every status in the app resolves to one of these five tones.
// Never hard-code a color on a status string — use statusTone() instead.

enum RLTone { success, info, warning, danger, neutral }

extension RLToneColors on RLTone {
  Color get fg => switch (this) {
    RLTone.success => RLTokens.success,
    RLTone.info => RLTokens.info,
    RLTone.warning => RLTokens.warning,
    RLTone.danger => RLTokens.danger,
    RLTone.neutral => RLTokens.neutral,
  };

  Color get bg => switch (this) {
    RLTone.success => RLTokens.successBg,
    RLTone.info => RLTokens.infoBg,
    RLTone.warning => RLTokens.warningBg,
    RLTone.danger => RLTokens.dangerBg,
    RLTone.neutral => RLTokens.neutralBg,
  };
}

RLTone statusTone(String status) => switch (status) {
  // Lease / payment
  'Paid' => RLTone.success,
  'Active' => RLTone.success,
  'Confirmed' => RLTone.success,
  'Resolved' => RLTone.success,
  'Available' => RLTone.success,
  'Checked In' => RLTone.info,
  'In Progress' => RLTone.info,
  'Issued' => RLTone.info,
  'Occupied' => RLTone.info,
  'Scheduled' => RLTone.info,
  'In Review' => RLTone.warning,
  'Partially Paid' => RLTone.warning,
  'Maintenance' => RLTone.warning,
  'Medium' => RLTone.warning,
  'Overdue' => RLTone.danger,
  'Expired' => RLTone.danger,
  'Cancelled' => RLTone.danger,
  'Terminated' => RLTone.danger,
  'High' => RLTone.danger,
  _ => RLTone.neutral, // New, Draft, Pending, Low, etc.
};
