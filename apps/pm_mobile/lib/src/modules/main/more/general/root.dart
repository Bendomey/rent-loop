import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/architecture/current_user/current_user_notifier.dart';
import 'package:rentloop_manager/src/modules/main/more/general/pages.dart';
import 'package:rentloop_manager/src/modules/main/more/general/widgets.dart';
import 'package:rentloop_manager/src/repository/models/client_model.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// General settings — the mobile counterpart of the web portal's
/// Settings › General redesign.
///
/// The web puts five categories behind a tab strip; the phone gets a hub plus
/// one page each, matching the My Account redesign:
///   Profile   — account name and ownership type
///   Company   — description, registration and support contacts
///     (individual accounts get Identity in this slot instead)
///   Location  — the official physical address
///   Branding  — logo and document accent colour
///   Preferences — currency, time zone, date format, language
///
/// Reads are live, from the signed-in user's client. Edits are not: the app
/// has no client API class yet, so the sheets report "coming soon" rather
/// than appearing to save. See placeholder_data.dart.
class GeneralSettingsScreen extends ConsumerWidget {
  const GeneralSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserNotifierProvider);
    final client = user?.clientUsers.isNotEmpty == true
        ? user!.clientUsers.first.client
        : null;
    final isCompany = isCompanyAccount(client);

    return Scaffold(
      backgroundColor: RLTokens.paper,
      body: Column(
        children: [
          RLBackHeader(
            title: 'General settings',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                RLTokens.gutter,
                0,
                RLTokens.gutter,
                40,
              ),
              children: [
                const SizedBox(height: 8),

                // ── Account identity ───────────────────────────────────────
                RLCard(
                  padding: const EdgeInsets.all(18),
                  child: Row(
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: RLTokens.ink,
                          borderRadius: BorderRadius.circular(RLTokens.rMd + 2),
                        ),
                        child: Icon(
                          isCompany
                              ? Icons.apartment_rounded
                              : Icons.person_outline_rounded,
                          size: 23,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              client?.name ?? 'Your account',
                              style: const TextStyle(
                                fontFamily: RLTokens.fontSerif,
                                fontSize: 19,
                                color: RLTokens.ink,
                                letterSpacing: -0.2,
                                height: 1.15,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 7,
                              runSpacing: 6,
                              children: [
                                RLPill(
                                  ownershipLabel(client),
                                  tone: RLTone.neutral,
                                ),
                                if (businessTypeLabel(client) != null)
                                  RLPill(
                                    businessTypeLabel(client)!,
                                    tone: RLTone.neutral,
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const Padding(
                  padding: EdgeInsets.fromLTRB(2, 12, 2, 0),
                  child: Text(
                    'Update and manage your essential information.',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12.5,
                      color: RLTokens.muted,
                      height: 1.5,
                    ),
                  ),
                ),

                // ── Categories ─────────────────────────────────────────────
                const RLLabel('Categories'),
                RLCard(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 4,
                  ),
                  child: Column(
                    children: [
                      RLRow(
                        leading: const RLIconTile(
                          icon: Icons.badge_outlined,
                          tone: RLTone.danger,
                        ),
                        title: 'Profile',
                        subtitle: _profileSummary(client),
                        onTap: () => _push(
                          context,
                          'Profile',
                          GeneralProfilePage(client: client),
                        ),
                      ),
                      // Company details only exist for company accounts; an
                      // individual carries identity documents instead.
                      if (isCompany)
                        RLRow(
                          leading: const RLIconTile(
                            icon: Icons.description_outlined,
                            tone: RLTone.info,
                          ),
                          title: 'Company',
                          subtitle: 'Description, registration, support',
                          onTap: () => _push(
                            context,
                            'Company',
                            GeneralCompanyPage(client: client),
                          ),
                        )
                      else
                        RLRow(
                          leading: const RLIconTile(
                            icon: Icons.fingerprint_rounded,
                            tone: RLTone.info,
                          ),
                          title: 'Identity',
                          subtitle:
                              idTypeLabel(client) ??
                              'Government-issued identification',
                          onTap: () => _push(
                            context,
                            'Identity',
                            GeneralIdentityPage(client: client),
                          ),
                        ),
                      RLRow(
                        leading: const RLIconTile(
                          icon: Icons.location_on_outlined,
                          tone: RLTone.success,
                        ),
                        title: 'Location',
                        subtitle: _locationSummary(client),
                        onTap: () => _push(
                          context,
                          'Business location',
                          GeneralLocationPage(client: client),
                        ),
                      ),
                      RLRow(
                        leading: const RLIconTile(
                          icon: Icons.palette_outlined,
                          tone: RLTone.warning,
                        ),
                        title: 'Branding',
                        subtitle: 'Logo and accent colour',
                        onTap: () => _push(
                          context,
                          'Branding',
                          const GeneralBrandingPage(),
                        ),
                      ),
                      RLRow(
                        leading: const RLIconTile(
                          icon: Icons.public_rounded,
                          tone: RLTone.neutral,
                        ),
                        title: 'Preferences',
                        subtitle: 'Currency, time zone, dates, language',
                        last: true,
                        onTap: () => _push(
                          context,
                          'Preferences',
                          const GeneralPreferencesPage(),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// "Acme Ltd · Company" — falls back to the ownership type alone when the
  /// name has not loaded.
  static String _profileSummary(ClientModel? client) {
    final name = client?.name;
    final ownership = ownershipLabel(client);
    return name == null || name.isEmpty ? ownership : '$name · $ownership';
  }

  /// City and country when we have them, so the row is not just a label.
  static String _locationSummary(ClientModel? client) {
    final parts = [
      client?.city,
      client?.country,
    ].where((p) => p != null && p.isNotEmpty).cast<String>();
    return parts.isEmpty ? 'Your official physical address' : parts.join(', ');
  }

  static void _push(BuildContext context, String title, Widget body) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => _GeneralSubPage(title: title, body: body),
      ),
    );
  }
}

/// Shared chrome for the category pages — back header plus the scroll view
/// every body leans on.
class _GeneralSubPage extends StatelessWidget {
  const _GeneralSubPage({required this.title, required this.body});

  final String title;
  final Widget body;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.paper,
      body: Column(
        children: [
          RLBackHeader(
            title: title,
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(
                RLTokens.gutter,
                0,
                RLTokens.gutter,
                40,
              ),
              child: body,
            ),
          ),
        ],
      ),
    );
  }
}
