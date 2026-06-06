// Shared UI primitives for RentLoop Manager.
// All values reference RLTokens — never use hardcoded colors or sizes here.

import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'tokens.dart';

// ── Card ─────────────────────────────────────────────────────────────────────

class RLCard extends StatelessWidget {
  const RLCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(RLTokens.space4),
    this.onTap,
    this.dark = false,
    this.borderRadius,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final bool dark;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? BorderRadius.circular(RLTokens.rLg);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: padding,
        decoration: BoxDecoration(
          color: dark ? RLTokens.ink : RLTokens.surface,
          borderRadius: radius,
          border: dark ? null : Border.all(color: RLTokens.hairline),
        ),
        child: child,
      ),
    );
  }
}

// ── Status pill ───────────────────────────────────────────────────────────────

class RLPill extends StatelessWidget {
  const RLPill(this.label, {super.key, this.tone = RLTone.neutral, this.large = false});

  final String label;
  final RLTone tone;
  final bool large;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: large ? 11 : 9,
        vertical: large ? 5 : 3,
      ),
      decoration: BoxDecoration(
        color: tone.bg,
        borderRadius: BorderRadius.circular(RLTokens.rPill),
      ),
      child: Text(
        label,
        style: TextStyle(fontFamily: RLTokens.fontSans, 
          fontSize: large ? 12 : 11,
          fontWeight: RLTokens.semibold,
          color: tone.fg,
          letterSpacing: 0.1,
          height: 1,
        ),
      ),
    );
  }
}

// ── Status dot ───────────────────────────────────────────────────────────────

class RLDot extends StatelessWidget {
  const RLDot({super.key, this.tone = RLTone.neutral, this.size = 7});

  final RLTone tone;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: tone.fg,
        shape: BoxShape.circle,
      ),
    );
  }
}

// ── Section label ────────────────────────────────────────────────────────────

class RLLabel extends StatelessWidget {
  const RLLabel(this.text, {super.key, this.action, this.onAction});

  final String text;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(2, RLTokens.space6, 2, RLTokens.space2),
      child: Row(
        children: [
          Expanded(
            child: Text(
              text.toUpperCase(),
              style: TextStyle(fontFamily: RLTokens.fontMono, 
                fontSize: RLTokens.textLabel,
                fontWeight: RLTokens.medium,
                letterSpacing: 1.1,
                color: RLTokens.mutedSoft,
              ),
            ),
          ),
          if (action != null)
            GestureDetector(
              onTap: onAction,
              child: Text(
                action!,
                style: TextStyle(fontFamily: RLTokens.fontSans, 
                  fontSize: RLTokens.textSubtitle,
                  fontWeight: RLTokens.semibold,
                  color: RLTokens.crimson,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Avatar ───────────────────────────────────────────────────────────────────

class RLAvatar extends StatelessWidget {
  const RLAvatar(this.name, {super.key, this.size = 40, this.crimsonTone = false});

  final String name;
  final double size;
  final bool crimsonTone;

  @override
  Widget build(BuildContext context) {
    final initials = name
        .split(' ')
        .where((s) => s.isNotEmpty)
        .take(2)
        .map((s) => s[0].toUpperCase())
        .join();
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: crimsonTone ? RLTokens.crimsonTint2 : RLTokens.fill,
        shape: BoxShape.circle,
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Center(
        child: Text(
          initials,
          style: TextStyle(fontFamily: RLTokens.fontSerif, 
            fontSize: size * 0.36,
            color: RLTokens.crimson,
            height: 1,
          ),
        ),
      ),
    );
  }
}

// ── Money figure ─────────────────────────────────────────────────────────────

class RLMoney extends StatelessWidget {
  const RLMoney(this.amount, {super.key, this.size = 30, this.color = RLTokens.ink, this.currency = 'GH₵'});

  final num amount;
  final double size;
  final Color color;
  final String currency;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        Text(
          currency,
          style: TextStyle(fontFamily: RLTokens.fontSans, 
            fontSize: size * 0.5,
            fontWeight: RLTokens.semibold,
            color: color.withAlpha((255 * color.a * 0.6).round()),
            height: 1,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          _format(amount),
          style: TextStyle(fontFamily: RLTokens.fontSerif, 
            fontSize: size,
            color: color,
            letterSpacing: -0.6,
            height: 1,
          ),
        ),
      ],
    );
  }

  String _format(num v) {
    // Simple thousands separator without intl dependency
    final s = v.round().toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    return buf.toString();
  }
}

// ── Metric tile ──────────────────────────────────────────────────────────────

class RLMetric extends StatelessWidget {
  const RLMetric({super.key, required this.value, required this.label, this.delta, this.deltaTone = RLTone.success});

  final String value;
  final String label;
  final String? delta;
  final RLTone deltaTone;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: TextStyle(fontFamily: RLTokens.fontSerif, 
            fontSize: 24,
            color: RLTokens.ink,
            letterSpacing: -0.4,
            height: 1,
          ),
        ),
        const SizedBox(height: 6),
        Row(
          children: [
            Text(
              label,
              style: TextStyle(fontFamily: RLTokens.fontSans, 
                fontSize: 11.5,
                color: RLTokens.muted,
              ),
            ),
            if (delta != null) ...[
              const SizedBox(width: 6),
              Text(
                delta!,
                style: TextStyle(fontFamily: RLTokens.fontMono, 
                  fontSize: RLTokens.textLabel,
                  fontWeight: RLTokens.bold,
                  color: deltaTone.fg,
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}

// ── List row ─────────────────────────────────────────────────────────────────

class RLRow extends StatelessWidget {
  const RLRow({
    super.key,
    this.leading,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.last = false,
    this.showChevron = true,
  });

  final Widget? leading;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool last;
  final bool showChevron;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 2),
        decoration: BoxDecoration(
          border: last ? null : Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
        ),
        child: Row(
          children: [
            if (leading != null) ...[leading!, const SizedBox(width: 13)],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(fontFamily: RLTokens.fontSans, 
                      fontSize: RLTokens.textRowTitle,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.ink,
                      letterSpacing: -0.1,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: RLTokens.textSubtitle, color: RLTokens.muted),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            if (trailing != null) ...[const SizedBox(width: 8), trailing!],
            if (showChevron && onTap != null) ...[
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right, size: 17, color: RLTokens.micro),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Icon tile ────────────────────────────────────────────────────────────────

class RLIconTile extends StatelessWidget {
  const RLIconTile({super.key, required this.icon, required this.tone, this.size = 38});

  final IconData icon;
  final RLTone tone;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: tone.bg,
        borderRadius: BorderRadius.circular(RLTokens.rSm + 1),
      ),
      child: Icon(icon, size: size * 0.47, color: tone.fg),
    );
  }
}

// ── Button ───────────────────────────────────────────────────────────────────

enum RLBtnKind { primary, dark, light, ghost, danger }

class RLBtn extends StatelessWidget {
  const RLBtn({
    super.key,
    required this.label,
    this.onPressed,
    this.kind = RLBtnKind.primary,
    this.full = false,
    this.icon,
    this.large = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final RLBtnKind kind;
  final bool full;
  final IconData? icon;
  final bool large;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, border) = switch (kind) {
      RLBtnKind.primary => (RLTokens.crimson, Colors.white, null),
      RLBtnKind.dark    => (RLTokens.ink, Colors.white, null),
      RLBtnKind.light   => (RLTokens.surface, RLTokens.ink, Border.all(color: RLTokens.hairline)),
      RLBtnKind.ghost   => (RLTokens.fill, RLTokens.ink, null),
      RLBtnKind.danger  => (Colors.transparent, RLTokens.danger, Border.all(color: RLTokens.crimsonTint2, width: 1.5)),
    };
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: full ? double.infinity : null,
        padding: EdgeInsets.symmetric(horizontal: 18, vertical: large ? 15 : 11),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(RLTokens.rMd),
          border: border,
        ),
        child: Row(
          mainAxisSize: full ? MainAxisSize.max : MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[Icon(icon, size: 18, color: fg), const SizedBox(width: 8)],
            Text(
              label,
              style: TextStyle(fontFamily: RLTokens.fontSans, 
                fontSize: large ? RLTokens.textAction : 14,
                fontWeight: RLTokens.semibold,
                color: fg,
                letterSpacing: 0.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── FAB ──────────────────────────────────────────────────────────────────────

class RLFAB extends StatelessWidget {
  const RLFAB({super.key, this.label, this.icon = Icons.add, this.onPressed});

  final String? label;
  final IconData icon;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        height: 52,
        padding: EdgeInsets.symmetric(horizontal: label != null ? 20 : 0),
        width: label != null ? null : 52,
        decoration: BoxDecoration(
          color: RLTokens.crimson,
          borderRadius: BorderRadius.circular(26),
          boxShadow: RLTokens.elevFab,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 22, color: Colors.white),
            if (label != null) ...[
              const SizedBox(width: 8),
              Text(
                label!,
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: RLTokens.textAction,
                  fontWeight: RLTokens.semibold,
                  color: Colors.white,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Progress bar ─────────────────────────────────────────────────────────────

class RLBar extends StatelessWidget {
  const RLBar({super.key, required this.percent, this.height = 7, this.color = RLTokens.crimson, this.trackColor = RLTokens.fill});

  final double percent; // 0–100
  final double height;
  final Color color;
  final Color trackColor;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (_, constraints) {
        final w = constraints.maxWidth;
        return Container(
          height: height,
          width: w,
          decoration: BoxDecoration(color: trackColor, borderRadius: BorderRadius.circular(height)),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Container(
              width: w * (percent.clamp(0, 100) / 100),
              height: height,
              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(height)),
            ),
          ),
        );
      },
    );
  }
}

// ── Donut chart ───────────────────────────────────────────────────────────────

class RLDonut extends StatelessWidget {
  const RLDonut({
    super.key,
    required this.percent,
    this.size = 80,
    this.thickness = 11,
    this.color = RLTokens.crimson,
    this.trackColor = RLTokens.fill,
    this.child,
  });

  final double percent; // 0–100
  final double size;
  final double thickness;
  final Color color;
  final Color trackColor;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _DonutPainter(
          percent: percent / 100,
          thickness: thickness,
          color: color,
          trackColor: trackColor,
        ),
        child: child != null ? Center(child: child) : null,
      ),
    );
  }
}

class _DonutPainter extends CustomPainter {
  const _DonutPainter({required this.percent, required this.thickness, required this.color, required this.trackColor});

  final double percent;
  final double thickness;
  final Color color;
  final Color trackColor;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - thickness) / 2;
    final rect = Rect.fromCircle(center: center, radius: radius);

    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = thickness;
    canvas.drawCircle(center, radius, trackPaint);

    if (percent > 0) {
      final progressPaint = Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = thickness
        ..strokeCap = StrokeCap.round;
      canvas.drawArc(rect, -math.pi / 2, 2 * math.pi * percent, false, progressPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _DonutPainter old) =>
      old.percent != percent || old.color != color;
}

// ── Mini bar chart ────────────────────────────────────────────────────────────

class RLMiniBars extends StatelessWidget {
  const RLMiniBars({super.key, required this.data, this.height = 44, this.color = RLTokens.crimson, this.trackColor = RLTokens.crimsonTint2});

  final List<double> data;
  final double height;
  final Color color;
  final Color trackColor;

  @override
  Widget build(BuildContext context) {
    final max = data.reduce(math.max);
    return SizedBox(
      height: height,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: data.asMap().entries.map((e) {
          final isLast = e.key == data.length - 1;
          return Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 3),
              height: height * (e.value / max),
              decoration: BoxDecoration(
                color: isLast ? color : trackColor,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ── Segmented control ─────────────────────────────────────────────────────────

class RLSegmented extends StatelessWidget {
  const RLSegmented({super.key, required this.items, required this.value, required this.onChanged});

  final List<RLSegmentItem> items;
  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: RLTokens.fill,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
      ),
      child: Row(
        children: items.map((item) {
          final active = item.key == value;
          return Expanded(
            child: GestureDetector(
              onTap: () => onChanged(item.key),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: active ? RLTokens.surface : Colors.transparent,
                  borderRadius: BorderRadius.circular(9),
                  boxShadow: active ? RLTokens.elev1 : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      item.label,
                      style: TextStyle(fontFamily: RLTokens.fontSans, 
                        fontSize: 13,
                        fontWeight: active ? RLTokens.bold : RLTokens.medium,
                        color: active ? RLTokens.ink : RLTokens.muted,
                      ),
                    ),
                    if (item.count != null) ...[
                      const SizedBox(width: 6),
                      Text(
                        '${item.count}',
                        style: TextStyle(fontFamily: RLTokens.fontMono, 
                          fontSize: RLTokens.textLabel,
                          fontWeight: RLTokens.bold,
                          color: active ? RLTokens.crimson : RLTokens.mutedSoft,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class RLSegmentItem {
  const RLSegmentItem({required this.key, required this.label, this.count});
  final String key;
  final String label;
  final int? count;
}

// ── Screen scaffold helpers ───────────────────────────────────────────────────

class RLTopHeader extends StatelessWidget {
  const RLTopHeader({
    super.key,
    required this.title,
    this.eyebrow,
    this.trailing,
  });

  final String title;
  final Widget? eyebrow;
  final List<Widget>? trailing;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: RLTokens.surface,
      padding: const EdgeInsets.only(bottom: 1),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(height: MediaQuery.of(context).padding.top),
          Padding(
            padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 6, RLTokens.gutter, 14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (eyebrow != null) ...[eyebrow!, const SizedBox(height: 4)],
                      Text(
                        title,
                        style: TextStyle(fontFamily: RLTokens.fontSerif, 
                          fontSize: RLTokens.textTitle,
                          letterSpacing: -0.4,
                          color: RLTokens.ink,
                          height: 1,
                        ),
                      ),
                    ],
                  ),
                ),
                if (trailing != null)
                  Row(children: trailing!.expand((w) => [w, const SizedBox(width: 8)]).take((trailing!.length * 2) - 1).toList()),
              ],
            ),
          ),
          Container(height: 1, color: RLTokens.hairlineSoft),
        ],
      ),
    );
  }
}

class RLBackHeader extends StatelessWidget {
  const RLBackHeader({super.key, required this.title, this.onBack, this.trailing, this.dark = false});

  final String title;
  final VoidCallback? onBack;
  final Widget? trailing;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    final fg = dark ? Colors.white : RLTokens.ink;
    final bg = dark ? RLTokens.ink : RLTokens.surface;
    return Container(
      color: bg,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(height: MediaQuery.of(context).padding.top),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 4, 14, 12),
            child: Row(
              children: [
                GestureDetector(
                  onTap: onBack ?? () => Navigator.of(context).pop(),
                  child: Padding(
                    padding: const EdgeInsets.all(6),
                    child: Icon(Icons.chevron_left, size: 26, color: fg),
                  ),
                ),
                Expanded(
                  child: Text(
                    title,
                    textAlign: TextAlign.center,
                    style: TextStyle(fontFamily: RLTokens.fontSans, 
                      fontSize: RLTokens.textBarTitle,
                      fontWeight: RLTokens.semibold,
                      color: fg,
                      letterSpacing: -0.2,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                trailing != null
                    ? trailing!
                    : const SizedBox(width: 38 + 12),
              ],
            ),
          ),
          Container(height: 1, color: dark ? Colors.white.withAlpha(20) : RLTokens.hairlineSoft),
        ],
      ),
    );
  }
}

// ── Search bar ────────────────────────────────────────────────────────────────

class RLSearchBar extends StatelessWidget {
  const RLSearchBar({super.key, this.hint = 'Search', this.onTap});

  final String hint;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rMd),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: Row(
          children: [
            const Icon(Icons.search, size: 18, color: RLTokens.mutedSoft),
            const SizedBox(width: 10),
            Text(
              hint,
              style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: RLTokens.textBody, color: RLTokens.mutedSoft),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Filter chip row ───────────────────────────────────────────────────────────

class RLFilterChips extends StatelessWidget {
  const RLFilterChips({super.key, required this.options, required this.selected, this.onSelect});

  final List<String> options;
  final String selected;
  final ValueChanged<String>? onSelect;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: EdgeInsets.zero,
      child: Row(
        children: options.map((opt) {
          final active = opt == selected;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => onSelect?.call(opt),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  color: active ? RLTokens.ink : RLTokens.surface,
                  borderRadius: BorderRadius.circular(RLTokens.rPill),
                  border: Border.all(color: active ? RLTokens.ink : RLTokens.hairline),
                ),
                child: Text(
                  opt,
                  style: TextStyle(fontFamily: RLTokens.fontSans, 
                    fontSize: 12.5,
                    fontWeight: RLTokens.semibold,
                    color: active ? Colors.white : RLTokens.muted,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ── Inline banner ─────────────────────────────────────────────────────────────
// Two families: banners stay inline where the user is acting; toasts handle
// async results. Three tones: danger (form submit failed), warning (offline /
// connection lost), info (contextual guidance).

enum RLBannerTone { danger, warning, info }

extension _RLBannerToneX on RLBannerTone {
  Color get fg => switch (this) {
    RLBannerTone.danger  => RLTokens.crimson,
    RLBannerTone.warning => RLTokens.warning,
    RLBannerTone.info    => RLTokens.info,
  };

  Color get bg => switch (this) {
    RLBannerTone.danger  => const Color.fromRGBO(200, 0, 58, 0.07),
    RLBannerTone.warning => const Color.fromRGBO(233, 123, 42, 0.09),
    RLBannerTone.info    => const Color.fromRGBO(46, 108, 246, 0.07),
  };

  Color get border => switch (this) {
    RLBannerTone.danger  => const Color.fromRGBO(200, 0, 58, 0.20),
    RLBannerTone.warning => const Color.fromRGBO(233, 123, 42, 0.26),
    RLBannerTone.info    => const Color.fromRGBO(46, 108, 246, 0.20),
  };

  IconData get defaultIcon => switch (this) {
    RLBannerTone.danger  => Icons.warning_rounded,
    RLBannerTone.warning => Icons.wifi_off_rounded,
    RLBannerTone.info    => Icons.info_outline_rounded,
  };
}

class RLInlineBanner extends StatelessWidget {
  const RLInlineBanner({
    super.key,
    this.tone = RLBannerTone.danger,
    this.icon,
    required this.title,
    this.body,
    this.actionLabel,
    this.onAction,
    this.onDismiss,
  });

  final RLBannerTone tone;
  final IconData? icon;
  final String title;
  final String? body;
  final String? actionLabel;
  final VoidCallback? onAction;
  final VoidCallback? onDismiss;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: tone.bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: tone.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(9),
              border: Border.all(color: tone.border),
            ),
            child: Icon(icon ?? tone.defaultIcon, size: 17, color: tone.fg),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 14,
                          fontWeight: RLTokens.bold,
                          color: RLTokens.ink,
                          height: 1.3,
                        ),
                      ),
                    ),
                    if (onDismiss != null) ...[
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: onDismiss,
                        child: const Padding(
                          padding: EdgeInsets.all(2),
                          child: Icon(Icons.close_rounded, size: 16, color: RLTokens.mutedSoft),
                        ),
                      ),
                    ],
                  ],
                ),
                if (body != null) ...[
                  const SizedBox(height: 3),
                  Text(
                    body!,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12.5,
                      color: RLTokens.muted,
                      height: 1.45,
                    ),
                  ),
                ],
                if (actionLabel != null) ...[
                  const SizedBox(height: 11),
                  GestureDetector(
                    onTap: onAction,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 7),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(9),
                        border: Border.all(color: tone.border),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.refresh_rounded, size: 14, color: tone.fg),
                          const SizedBox(width: 6),
                          Text(
                            actionLabel!,
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 12.5,
                              fontWeight: RLTokens.semibold,
                              color: tone.fg,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Section error ─────────────────────────────────────────────────────────────
// Shown inside a card when a data fetch fails. Always offer a Retry.

class RLSectionError extends StatelessWidget {
  const RLSectionError({
    super.key,
    this.title = "Couldn't load",
    this.body = 'Check your connection and try again.',
    this.onRetry,
    this.compact = false,
  });

  final String title;
  final String body;
  final VoidCallback? onRetry;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return RLCard(
      padding: EdgeInsets.all(compact ? 16 : 22),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: RLTokens.fill,
              borderRadius: BorderRadius.circular(13),
            ),
            child: const Icon(Icons.wifi_off_rounded, size: 22, color: RLTokens.mutedSoft),
          ),
          SizedBox(height: compact ? 8 : 11),
          Text(
            title,
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 15,
              fontWeight: RLTokens.semibold,
              color: RLTokens.ink,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 3),
          Text(
            body,
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12.5,
              color: RLTokens.muted,
              height: 1.45,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 13),
          GestureDetector(
            onTap: onRetry,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
              decoration: BoxDecoration(
                color: RLTokens.ink,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.refresh_rounded, size: 15, color: Colors.white),
                  const SizedBox(width: 7),
                  Text(
                    'Try again',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      fontWeight: RLTokens.semibold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Icon button ───────────────────────────────────────────────────────────────

class RLIconBtn extends StatelessWidget {
  const RLIconBtn({super.key, required this.icon, this.onTap, this.badge, this.bg = RLTokens.surface, this.iconColor = RLTokens.ink});

  final IconData icon;
  final VoidCallback? onTap;
  final int? badge;
  final Color bg;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(RLTokens.rSm + 1),
              border: Border.all(color: RLTokens.hairline),
            ),
            child: Icon(icon, size: 19, color: iconColor),
          ),
          if (badge != null && badge! > 0)
            Positioned(
              top: -5,
              right: -5,
              child: Container(
                constraints: const BoxConstraints(minWidth: 17, minHeight: 17),
                padding: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: RLTokens.crimson,
                  shape: BoxShape.circle,
                  border: Border.all(color: RLTokens.surface, width: 2),
                ),
                child: Center(
                  child: Text(
                    '$badge',
                    style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 10, fontWeight: RLTokens.bold, color: Colors.white, height: 1),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Status stepper ────────────────────────────────────────────────────────────

class RLStepper extends StatelessWidget {
  const RLStepper({super.key, required this.steps, required this.current});

  final List<String> steps;
  final int current; // 0-based index of the active step

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: steps.asMap().entries.map((e) {
        final i      = e.key;
        final label  = e.value;
        final done   = i < current;
        final active = i == current;
        final isLast = i == steps.length - 1;

        return Expanded(
          child: Column(
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Container(
                      height: 2,
                      color: i == 0
                          ? Colors.transparent
                          : (done || active)
                              ? RLTokens.crimson
                              : RLTokens.hairline,
                    ),
                  ),
                  _RLStepCircle(done: done, active: active),
                  Expanded(
                    child: Container(
                      height: 2,
                      color: isLast
                          ? Colors.transparent
                          : done
                              ? RLTokens.crimson
                              : RLTokens.hairline,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 10,
                  fontWeight: active ? RLTokens.bold : RLTokens.medium,
                  color: (done || active) ? RLTokens.ink : RLTokens.mutedSoft,
                  height: 1.2,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _RLStepCircle extends StatelessWidget {
  const _RLStepCircle({required this.done, required this.active});
  final bool done;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: done
            ? RLTokens.crimson
            : active
                ? RLTokens.surface
                : RLTokens.fill,
        border: Border.all(
          color: (done || active) ? RLTokens.crimson : RLTokens.hairline,
          width: 2,
        ),
      ),
      child: Center(
        child: done
            ? const Icon(Icons.check_rounded, size: 13, color: Colors.white)
            : Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: active ? RLTokens.crimson : RLTokens.micro,
                ),
              ),
      ),
    );
  }
}
