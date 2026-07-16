import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/modules/main/properties/edit_sheets.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class PropertyGeneralSettingsScreen extends StatelessWidget {
  const PropertyGeneralSettingsScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          const RLBackHeader(title: 'General'),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                RLTokens.gutter,
                6,
                RLTokens.gutter,
                24,
              ),
              children: [
                const Text(
                  'General settings',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSerif,
                    fontSize: 24,
                    color: RLTokens.ink,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 5),
                const Text(
                  'Update and manage your essential information.',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13,
                    color: RLTokens.muted,
                  ),
                ),
                const SizedBox(height: 16),

                // Basic details card
                _SetCard(
                  title: 'Basic details',
                  onEdit: () => showBasicDetailsSheet(
                    context,
                    name: 'Cantonments Court',
                    description:
                        'Gated apartment block — borehole water and standby generator.',
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const _KV(k: 'Property name', v: 'Cantonments Court'),
                      const SizedBox(height: 14),
                      const _KV(
                        k: 'Description',
                        v: 'Gated apartment block — borehole water and standby generator.',
                      ),
                      const SizedBox(height: 14),
                      const _KV(k: 'Type', v: 'Multi-Unit'),
                      const SizedBox(height: 10),
                      GestureDetector(
                        onTap: () {
                          Haptics.vibrate(HapticsType.selection);
                          showSwitchTypeSheet(context, current: 'multi');
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: RLTokens.surface,
                            border: Border.all(color: RLTokens.hairline),
                            borderRadius: BorderRadius.circular(RLTokens.rMd),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.swap_horiz_rounded,
                                size: 16,
                                color: RLTokens.ink,
                              ),
                              SizedBox(width: 6),
                              Text(
                                'Switch to Single',
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
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // Rental mode card
                _SetCard(
                  title: 'Rental mode',
                  desc:
                      'Controls whether this property accepts long-term leases, short-term bookings, or both.',
                  onEdit: () => showRentalModeSheet(context, current: 'lease'),
                  child: const _KV(k: 'Current mode', v: 'Long-term (Leases)'),
                ),

                const SizedBox(height: 12),

                // Location card
                _SetCard(
                  title: 'Location',
                  desc:
                      'Changing the address updates country, region and city automatically.',
                  onEdit: () => showLocationSheet(
                    context,
                    address: 'Cantonments, Accra — Liberty Road',
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const _KV(
                        k: 'Address',
                        v: 'Cantonments, Accra — Liberty Road',
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: const [
                          Expanded(
                            child: _KV(k: 'Country', v: 'Ghana'),
                          ),
                          SizedBox(width: 12),
                          Expanded(
                            child: _KV(k: 'Region', v: 'Greater Accra'),
                          ),
                          SizedBox(width: 12),
                          Expanded(
                            child: _KV(k: 'City', v: 'Accra'),
                          ),
                        ],
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
}

// ── SetCard ───────────────────────────────────────────────────────────────────

class _SetCard extends StatelessWidget {
  const _SetCard({
    required this.title,
    this.desc,
    required this.onEdit,
    required this.child,
  });
  final String title;
  final String? desc;
  final VoidCallback onEdit;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSerif,
                    fontSize: 18,
                    color: RLTokens.ink,
                    letterSpacing: -0.2,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  onEdit();
                },
                child: const Row(
                  children: [
                    Icon(
                      Icons.settings_outlined,
                      size: 14,
                      color: RLTokens.crimson,
                    ),
                    SizedBox(width: 5),
                    Text(
                      'Edit',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 13,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.crimson,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (desc != null) ...[
            const SizedBox(height: 4),
            Text(
              desc!,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                color: RLTokens.muted,
                height: 1.45,
              ),
            ),
          ],
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

// ── KV pair ───────────────────────────────────────────────────────────────────

class _KV extends StatelessWidget {
  const _KV({required this.k, required this.v});
  final String k, v;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          k.toUpperCase(),
          style: const TextStyle(
            fontFamily: RLTokens.fontMono,
            fontSize: 10,
            letterSpacing: 0.6,
            color: RLTokens.mutedSoft,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          v,
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14,
            color: RLTokens.ink,
            height: 1.4,
          ),
        ),
      ],
    );
  }
}
