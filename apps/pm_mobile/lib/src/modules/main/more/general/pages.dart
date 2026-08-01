import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rentloop_manager/src/modules/main/more/general/placeholder_data.dart';
import 'package:rentloop_manager/src/modules/main/more/general/sheets.dart';
import 'package:rentloop_manager/src/modules/main/more/general/widgets.dart';
import 'package:rentloop_manager/src/repository/models/client_model.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// The five category pages behind the General Settings hub. Each is a plain
/// [Column] — the hub's sub-page shell provides the scroll view.

// ── Profile ───────────────────────────────────────────────────────────────────

class GeneralProfilePage extends ConsumerWidget {
  const GeneralProfilePage({super.key, required this.client});

  final ClientModel? client;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCompany = isCompanyAccount(client);
    final target = isCompany ? 'Individual' : 'Company';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        GeneralCard(
          title: 'Account profile',
          subtitle: 'Shown on invoices, leases and tenant-facing pages.',
          onEdit: () => showChangeNameSheet(context, ref, client),
          fields: [GeneralField(label: 'Account name', value: client?.name)],
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Divider(height: 1, color: RLTokens.hairlineSoft),
              const SizedBox(height: 14),
              const Text(
                'OWNERSHIP TYPE',
                style: TextStyle(
                  fontFamily: RLTokens.fontMono,
                  fontSize: 10,
                  letterSpacing: 0.6,
                  color: RLTokens.mutedSoft,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _OwnershipChip(
                    label: ownershipLabel(client),
                    icon: isCompany
                        ? Icons.apartment_rounded
                        : Icons.person_outline_rounded,
                  ),
                  if (businessTypeLabel(client) != null)
                    RLPill(businessTypeLabel(client)!, tone: RLTone.neutral),
                ],
              ),
              const SizedBox(height: 14),
              RLBtn(
                label: 'Switch to $target',
                kind: RLBtnKind.light,
                full: true,
                icon: Icons.swap_horiz_rounded,
                onPressed: () => showSwitchTypeSheet(context, ref, client),
              ),
              if (isCompany) ...[
                const SizedBox(height: 10),
                RLBtn(
                  label: 'Change business type',
                  kind: RLBtnKind.light,
                  full: true,
                  icon: Icons.edit_outlined,
                  onPressed: () => showBusinessTypeSheet(context, ref, client),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _OwnershipChip extends StatelessWidget {
  const _OwnershipChip({required this.label, required this.icon});

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(RLTokens.rPill),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: RLTokens.ink),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13,
              fontWeight: RLTokens.semibold,
              color: RLTokens.ink,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Company ───────────────────────────────────────────────────────────────────

class GeneralCompanyPage extends ConsumerWidget {
  const GeneralCompanyPage({super.key, required this.client});

  final ClientModel? client;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        const SizedBox(height: 8),
        GeneralCard(
          title: 'Company details',
          subtitle:
              'Support details are shown to tenants when they need to reach '
              'you.',
          onEdit: () => showCompanySheet(context, ref, client),
          fields: [
            GeneralField(label: 'Description', value: client?.description),
            GeneralField(
              label: 'Registration number',
              value: client?.registrationNumber,
            ),
            GeneralField(label: 'Support email', value: client?.supportEmail),
            GeneralField(label: 'Support phone', value: client?.supportPhone),
            GeneralField(label: 'Website', value: client?.websiteUrl),
          ],
        ),
      ],
    );
  }
}

// ── Identity ──────────────────────────────────────────────────────────────────

class GeneralIdentityPage extends ConsumerWidget {
  const GeneralIdentityPage({super.key, required this.client});

  final ClientModel? client;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        const SizedBox(height: 8),
        GeneralCard(
          title: 'Identity',
          subtitle:
              'Your government-issued identification. Used to verify the '
              'person behind this account.',
          onEdit: () => showIdentitySheet(context, ref, client),
          fields: [
            GeneralField(label: 'ID type', value: idTypeLabel(client)),
            GeneralField(label: 'ID number', value: client?.idNumber),
            GeneralField(label: 'Expiry date', value: client?.idExpiry),
          ],
        ),
      ],
    );
  }
}

// ── Location ──────────────────────────────────────────────────────────────────

class GeneralLocationPage extends ConsumerWidget {
  const GeneralLocationPage({super.key, required this.client});

  final ClientModel? client;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        const SizedBox(height: 8),
        GeneralCard(
          title: 'Business location',
          subtitle:
              'Your official physical address. Used on invoices and lease '
              'documents.',
          onEdit: () => showLocationSheet(context, ref, client),
          fields: [
            GeneralField(label: 'Address', value: client?.address),
            GeneralField(label: 'Country', value: client?.country),
            GeneralField(label: 'Region', value: client?.region),
            GeneralField(label: 'City', value: client?.city),
          ],
        ),
      ],
    );
  }
}

// ── Branding ──────────────────────────────────────────────────────────────────

class GeneralBrandingPage extends ConsumerWidget {
  const GeneralBrandingPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        RLCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Logo',
                style: TextStyle(
                  fontFamily: RLTokens.fontSerif,
                  fontSize: 17,
                  color: RLTokens.ink,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: RLTokens.fill,
                    borderRadius: BorderRadius.circular(RLTokens.rLg),
                    border: Border.all(color: RLTokens.hairline),
                  ),
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.apartment_rounded,
                        size: 23,
                        color: RLTokens.mutedSoft,
                      ),
                      SizedBox(height: 5),
                      Text(
                        'NO LOGO',
                        style: TextStyle(
                          fontFamily: RLTokens.fontMono,
                          fontSize: 9,
                          letterSpacing: 0.4,
                          color: RLTokens.mutedSoft,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              const Text(
                'Appears on invoices, lease documents and the tenant portal. '
                'PNG or SVG, up to 2MB.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 12.5,
                  color: RLTokens.muted,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 14),
              RLBtn(
                label: 'Upload logo',
                full: true,
                onPressed: () => showLogoSheet(context, ref),
              ),
            ],
          ),
        ),
        const RLLabel('Accent colour'),
        RLCard(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: const Color(0xFFC8003A),
                  borderRadius: BorderRadius.circular(RLTokens.rSm),
                  border: Border.all(color: RLTokens.hairline),
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Document accent',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 14,
                        fontWeight: RLTokens.bold,
                        color: RLTokens.ink,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      kPlaceholderAccent,
                      style: TextStyle(
                        fontFamily: RLTokens.fontMono,
                        fontSize: 12,
                        color: RLTokens.muted,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              RLBtn(
                label: 'Change',
                kind: RLBtnKind.light,
                large: false,
                onPressed: () => showAccentSheet(context, ref),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Preferences ───────────────────────────────────────────────────────────────

class GeneralPreferencesPage extends ConsumerWidget {
  const GeneralPreferencesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rows = [
      (
        icon: Icons.payments_outlined,
        title: 'Currency',
        value: kPlaceholderCurrency,
        sheetTitle: 'Change currency',
        desc:
            'All rents, invoices and reports use this currency. Existing '
            'documents keep the currency they were issued in.',
        options: kCurrencyOptions,
        feature: 'Changing your currency',
      ),
      (
        icon: Icons.public_rounded,
        title: 'Time zone',
        value: kPlaceholderTimezone,
        sheetTitle: 'Change time zone',
        desc: 'Due dates, reminders and activity timestamps follow this zone.',
        options: kTimezoneOptions,
        feature: 'Changing your time zone',
      ),
      (
        icon: Icons.calendar_today_outlined,
        title: 'Date format',
        value: kPlaceholderDateFormat,
        sheetTitle: 'Change date format',
        desc: 'How dates are written across the app and on documents.',
        options: kDateFormatOptions,
        feature: 'Changing your date format',
      ),
      (
        icon: Icons.translate_rounded,
        title: 'Language',
        value: kPlaceholderLanguage,
        sheetTitle: 'Change language',
        desc: 'The app language for your account.',
        options: kLanguageOptions,
        feature: 'Changing your language',
      ),
    ];

    return Column(
      children: [
        const SizedBox(height: 8),
        RLCard(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          child: Column(
            children: [
              for (final (index, row) in rows.indexed)
                RLRow(
                  leading: RLIconTile(icon: row.icon, tone: RLTone.neutral),
                  title: row.title,
                  subtitle: row.value,
                  last: index == rows.length - 1,
                  onTap: () => showPreferenceSheet(
                    context,
                    ref,
                    title: row.sheetTitle,
                    desc: row.desc,
                    label: row.title,
                    options: row.options,
                    current: row.value,
                    feature: row.feature,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
