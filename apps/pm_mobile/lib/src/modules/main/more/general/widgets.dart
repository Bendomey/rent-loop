import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/repository/models/client_model.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// Branding, regional preferences and every edit on this screen are built but
/// not released — the app has no client API yet. Controls stay visible and say
/// so rather than silently doing nothing.
void showGeneralComingSoon(WidgetRef ref, String feature) {
  showRLToast(
    ref,
    tone: RLToastTone.info,
    title: '$feature is coming soon',
    body: 'We’re still building this. It’ll land in an upcoming release.',
  );
}

/// A key/value pair as the design draws it: small mono caption above, the
/// value below, an em-dash where nothing is filled in yet.
class GeneralField extends StatelessWidget {
  const GeneralField({super.key, required this.label, this.value});

  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    final filled = value != null && value!.trim().isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontFamily: RLTokens.fontMono,
            fontSize: 10,
            letterSpacing: 0.6,
            color: RLTokens.mutedSoft,
          ),
        ),
        const SizedBox(height: 5),
        Text(
          filled ? value! : '—',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14.5,
            fontWeight: RLTokens.semibold,
            color: filled ? RLTokens.ink : RLTokens.micro,
            height: 1.4,
          ),
        ),
      ],
    );
  }
}

/// Card with a serif heading, a line of supporting copy and a single Edit in
/// the header — then a stack of [GeneralField]s divided by hairlines.
class GeneralCard extends StatelessWidget {
  const GeneralCard({
    super.key,
    required this.title,
    this.subtitle,
    this.onEdit,
    this.fields = const [],
    this.child,
  });

  final String title;
  final String? subtitle;
  final VoidCallback? onEdit;
  final List<GeneralField> fields;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return RLCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSerif,
                        fontSize: 17,
                        color: RLTokens.ink,
                        letterSpacing: -0.2,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        subtitle!,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12.5,
                          color: RLTokens.muted,
                          height: 1.45,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (onEdit != null) ...[
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: () async {
                    await Haptics.vibrate(HapticsType.selection);
                    onEdit!();
                  },
                  behavior: HitTestBehavior.opaque,
                  child: const Row(
                    children: [
                      Icon(Icons.edit_outlined, size: 15, color: RLTokens.ink),
                      SizedBox(width: 6),
                      Text(
                        'Edit',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 13.5,
                          fontWeight: RLTokens.semibold,
                          color: RLTokens.ink,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          if (fields.isNotEmpty) ...[
            const SizedBox(height: 4),
            // Indexed rather than compared by value: two fields can hold the
            // same label and value, and only the first should skip the rule.
            for (final (index, field) in fields.indexed)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  border: index == 0
                      ? null
                      : const Border(
                          top: BorderSide(color: RLTokens.hairlineSoft),
                        ),
                ),
                child: field,
              ),
          ],
          if (child != null) ...[const SizedBox(height: 16), child!],
        ],
      ),
    );
  }
}

/// Human-readable ownership label — the API stores COMPANY / INDIVIDUAL.
String ownershipLabel(ClientModel? client) =>
    client?.type == 'COMPANY' ? 'Company' : 'Individual';

bool isCompanyAccount(ClientModel? client) => client?.type == 'COMPANY';

/// PROPERTY_MANAGER → Property Manager.
String? businessTypeLabel(ClientModel? client) {
  final raw = client?.subType;
  if (raw == null || raw.isEmpty) return null;
  return raw
      .toLowerCase()
      .split('_')
      .where((part) => part.isNotEmpty)
      .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}

/// NATIONAL_ID → National ID, and the two others the backend accepts.
String? idTypeLabel(ClientModel? client) => switch (client?.idType) {
  'NATIONAL_ID' => 'National ID',
  'PASSPORT' => 'Passport',
  'DRIVERS_LICENSE' => "Driver's License",
  _ => null,
};
