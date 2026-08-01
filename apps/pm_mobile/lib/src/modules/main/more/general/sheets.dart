import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rentloop_manager/src/modules/main/more/general/placeholder_data.dart';
import 'package:rentloop_manager/src/modules/main/more/general/widgets.dart';
import 'package:rentloop_manager/src/repository/models/client_model.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Public API ────────────────────────────────────────────────────────────────
//
// Every sheet below is UI only. The app has no client API class, so the
// committing button reports "coming soon" rather than closing as though it
// saved. Fields are pre-filled from the live client so the forms are already
// shaped correctly for whenever the endpoint lands.

void showChangeNameSheet(BuildContext context, WidgetRef ref, ClientModel? c) {
  showRLSheet(
    context,
    (close) => _ChangeNameSheet(client: c, ref: ref, onClose: close),
  );
}

void showBusinessTypeSheet(
  BuildContext context,
  WidgetRef ref,
  ClientModel? c,
) {
  showRLSheet(
    context,
    (close) => _BusinessTypeSheet(client: c, ref: ref, onClose: close),
  );
}

void showSwitchTypeSheet(BuildContext context, WidgetRef ref, ClientModel? c) {
  showRLSheet(
    context,
    (close) => _SwitchTypeSheet(client: c, ref: ref, onClose: close),
  );
}

void showCompanySheet(BuildContext context, WidgetRef ref, ClientModel? c) {
  showRLSheet(
    context,
    (close) => _CompanySheet(client: c, ref: ref, onClose: close),
  );
}

void showLocationSheet(BuildContext context, WidgetRef ref, ClientModel? c) {
  showRLSheet(
    context,
    (close) => _LocationSheet(client: c, ref: ref, onClose: close),
  );
}

void showIdentitySheet(BuildContext context, WidgetRef ref, ClientModel? c) {
  showRLSheet(
    context,
    (close) => _IdentitySheet(client: c, ref: ref, onClose: close),
  );
}

void showLogoSheet(BuildContext context, WidgetRef ref) {
  showRLSheet(context, (close) => _LogoSheet(ref: ref, onClose: close));
}

void showAccentSheet(BuildContext context, WidgetRef ref) {
  showRLSheet(context, (close) => _AccentSheet(ref: ref, onClose: close));
}

/// The four preference pickers share one sheet — only the copy and options
/// differ.
void showPreferenceSheet(
  BuildContext context,
  WidgetRef ref, {
  required String title,
  required String desc,
  required String label,
  required List<String> options,
  required String current,
  required String feature,
}) {
  showRLSheet(
    context,
    (close) => _PreferenceSheet(
      title: title,
      desc: desc,
      label: label,
      options: options,
      current: current,
      feature: feature,
      ref: ref,
      onClose: close,
    ),
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────

class _ChangeNameSheet extends StatefulWidget {
  const _ChangeNameSheet({
    required this.client,
    required this.ref,
    required this.onClose,
  });

  final ClientModel? client;
  final WidgetRef ref;
  final VoidCallback onClose;

  @override
  State<_ChangeNameSheet> createState() => _ChangeNameSheetState();
}

class _ChangeNameSheetState extends State<_ChangeNameSheet> {
  late final _controller = TextEditingController(
    text: widget.client?.name ?? '',
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isCompany = isCompanyAccount(widget.client);
    return RLSheet(
      title: 'Change account name',
      desc: 'Appears on invoices, lease documents and tenant-facing pages.',
      onClose: widget.onClose,
      footer: rlSheetFooter(
        confirmLabel: 'Save name',
        onCancel: widget.onClose,
        onConfirm: () => _comingSoon(widget.ref, widget.onClose, 'Editing'),
      ),
      child: RLSheetField(
        label: isCompany ? 'Company name' : 'Full name',
        controller: _controller,
        hint: isCompany ? 'Your company or trading name' : 'Your full name',
      ),
    );
  }
}

class _BusinessTypeSheet extends StatefulWidget {
  const _BusinessTypeSheet({
    required this.client,
    required this.ref,
    required this.onClose,
  });

  final ClientModel? client;
  final WidgetRef ref;
  final VoidCallback onClose;

  @override
  State<_BusinessTypeSheet> createState() => _BusinessTypeSheetState();
}

class _BusinessTypeSheetState extends State<_BusinessTypeSheet> {
  late String? _selected = businessTypeLabel(widget.client);

  @override
  Widget build(BuildContext context) {
    return RLSheet(
      title: 'Change business type',
      desc: 'How your company is described on tenant-facing pages.',
      onClose: widget.onClose,
      footer: rlSheetFooter(
        confirmLabel: 'Save',
        onCancel: widget.onClose,
        onConfirm: () => _comingSoon(widget.ref, widget.onClose, 'Editing'),
      ),
      child: RLSheetSelect(
        label: 'Business type',
        value: _selected,
        options: kBusinessTypeOptions,
        onChanged: (v) => setState(() => _selected = v),
      ),
    );
  }
}

class _SwitchTypeSheet extends StatelessWidget {
  const _SwitchTypeSheet({
    required this.client,
    required this.ref,
    required this.onClose,
  });

  final ClientModel? client;
  final WidgetRef ref;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final isCompany = isCompanyAccount(client);
    final target = isCompany ? 'Individual' : 'Company';
    final consequences = isCompany
        ? const [
            'Company details are replaced by your personal details',
            'Registration number is no longer collected',
            'Existing leases and invoices keep their original name',
          ]
        : const [
            'Your identity document details are no longer collected',
            'We start collecting company details and a registration number',
            'Existing leases and invoices keep their original name',
          ];

    return RLSheet(
      title: 'Switch to $target?',
      desc:
          'This account bills as ${isCompany ? 'a Company' : 'an Individual'}. '
          'Switching changes what details we collect and how documents are '
          'addressed.',
      onClose: onClose,
      footer: rlSheetFooter(
        confirmLabel: 'Switch to $target',
        onCancel: onClose,
        onConfirm: () => _comingSoon(ref, onClose, 'Switching account type'),
      ),
      child: Column(
        children: [
          RLSheetBullets(title: 'What changes', items: consequences),
          const SizedBox(height: 14),
          const RLSheetNote(
            text:
                'You can switch back any time, but you’ll need to re-enter the '
                'details for whichever type you choose.',
            tone: RLTone.warning,
          ),
        ],
      ),
    );
  }
}

// ── Company ───────────────────────────────────────────────────────────────────

class _CompanySheet extends StatefulWidget {
  const _CompanySheet({
    required this.client,
    required this.ref,
    required this.onClose,
  });

  final ClientModel? client;
  final WidgetRef ref;
  final VoidCallback onClose;

  @override
  State<_CompanySheet> createState() => _CompanySheetState();
}

class _CompanySheetState extends State<_CompanySheet> {
  late final _description = TextEditingController(
    text: widget.client?.description ?? '',
  );
  late final _registration = TextEditingController(
    text: widget.client?.registrationNumber ?? '',
  );
  late final _email = TextEditingController(
    text: widget.client?.supportEmail ?? '',
  );
  late final _phone = TextEditingController(
    text: widget.client?.supportPhone ?? '',
  );
  late final _website = TextEditingController(
    text: widget.client?.websiteUrl ?? '',
  );

  @override
  void dispose() {
    _description.dispose();
    _registration.dispose();
    _email.dispose();
    _phone.dispose();
    _website.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RLSheet(
      title: 'Edit company details',
      desc: 'Support details are shown to tenants when they need to reach you.',
      onClose: widget.onClose,
      footer: rlSheetFooter(
        confirmLabel: 'Save details',
        onCancel: widget.onClose,
        onConfirm: () => _comingSoon(widget.ref, widget.onClose, 'Editing'),
      ),
      child: Column(
        children: [
          RLSheetTextArea(
            label: 'Description',
            controller: _description,
            hint: 'What your company does…',
            helper: 'Optional. Appears on the tenant portal.',
          ),
          const SizedBox(height: 16),
          RLSheetField(
            label: 'Registration number',
            controller: _registration,
            hint: 'e.g. CS123456789',
          ),
          const SizedBox(height: 16),
          RLSheetField(
            label: 'Support email',
            controller: _email,
            hint: 'support@example.com',
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 16),
          RLSheetField(
            label: 'Support phone',
            controller: _phone,
            hint: '+233…',
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 16),
          RLSheetField(
            label: 'Website',
            controller: _website,
            hint: 'https://example.com',
            keyboardType: TextInputType.url,
          ),
        ],
      ),
    );
  }
}

// ── Location ──────────────────────────────────────────────────────────────────

class _LocationSheet extends StatefulWidget {
  const _LocationSheet({
    required this.client,
    required this.ref,
    required this.onClose,
  });

  final ClientModel? client;
  final WidgetRef ref;
  final VoidCallback onClose;

  @override
  State<_LocationSheet> createState() => _LocationSheetState();
}

class _LocationSheetState extends State<_LocationSheet> {
  late final _address = TextEditingController(
    text: widget.client?.address ?? '',
  );
  late final _city = TextEditingController(text: widget.client?.city ?? '');
  late final _region = TextEditingController(text: widget.client?.region ?? '');
  late String _country = widget.client?.country ?? kCountryOptions.first;

  @override
  void dispose() {
    _address.dispose();
    _city.dispose();
    _region.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // The picker can only offer what it knows; an unlisted country stays
    // selected by being added rather than silently switching to Ghana.
    final options = kCountryOptions.contains(_country)
        ? kCountryOptions
        : [_country, ...kCountryOptions];

    return RLSheet(
      title: 'Edit business location',
      desc:
          'Your official physical address. Used on invoices and lease '
          'documents.',
      onClose: widget.onClose,
      footer: rlSheetFooter(
        confirmLabel: 'Save address',
        onCancel: widget.onClose,
        onConfirm: () => _comingSoon(widget.ref, widget.onClose, 'Editing'),
      ),
      child: Column(
        children: [
          RLSheetTextArea(
            label: 'Address',
            controller: _address,
            hint: 'Street, landmark, municipality',
          ),
          const SizedBox(height: 16),
          RLSheetField(label: 'City', controller: _city),
          const SizedBox(height: 16),
          RLSheetField(label: 'Region', controller: _region),
          const SizedBox(height: 16),
          RLSheetSelect(
            label: 'Country',
            value: _country,
            options: options,
            onChanged: (v) => setState(() => _country = v),
          ),
        ],
      ),
    );
  }
}

// ── Identity ──────────────────────────────────────────────────────────────────

class _IdentitySheet extends StatefulWidget {
  const _IdentitySheet({
    required this.client,
    required this.ref,
    required this.onClose,
  });

  final ClientModel? client;
  final WidgetRef ref;
  final VoidCallback onClose;

  @override
  State<_IdentitySheet> createState() => _IdentitySheetState();
}

class _IdentitySheetState extends State<_IdentitySheet> {
  static const _types = ['National ID', 'Passport', "Driver's License"];

  late String? _type = idTypeLabel(widget.client);
  late final _number = TextEditingController(
    text: widget.client?.idNumber ?? '',
  );

  @override
  void dispose() {
    _number.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RLSheet(
      title: 'Edit identity',
      desc: 'Used to verify the person behind this account.',
      onClose: widget.onClose,
      footer: rlSheetFooter(
        confirmLabel: 'Save',
        onCancel: widget.onClose,
        onConfirm: () => _comingSoon(widget.ref, widget.onClose, 'Editing'),
      ),
      child: Column(
        children: [
          RLSheetSelect(
            label: 'ID type',
            value: _type,
            options: _types,
            onChanged: (v) => setState(() => _type = v),
          ),
          const SizedBox(height: 16),
          RLSheetField(label: 'ID number', controller: _number),
        ],
      ),
    );
  }
}

// ── Branding ──────────────────────────────────────────────────────────────────

class _LogoSheet extends StatelessWidget {
  const _LogoSheet({required this.ref, required this.onClose});

  final WidgetRef ref;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return RLSheet(
      title: 'Upload your logo',
      desc: 'Appears on invoices, lease documents and the tenant portal.',
      onClose: onClose,
      footer: rlSheetFooter(
        confirmLabel: 'Save logo',
        onCancel: onClose,
        onConfirm: () => _comingSoon(ref, onClose, 'Logo uploads'),
      ),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(
            color: RLTokens.hairline,
            style: BorderStyle.solid,
          ),
        ),
        child: Column(
          children: [
            Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(
                color: RLTokens.fill,
                borderRadius: BorderRadius.circular(RLTokens.rLg),
                border: Border.all(color: RLTokens.hairline),
              ),
              child: const Icon(
                Icons.apartment_rounded,
                size: 24,
                color: RLTokens.mutedSoft,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Choose your logo',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 14,
                fontWeight: RLTokens.bold,
                color: RLTokens.ink,
              ),
            ),
            const SizedBox(height: 3),
            const Text(
              'PNG or SVG · transparent preferred · up to 2MB',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12,
                color: RLTokens.muted,
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: RLBtn(
                    label: 'Take photo',
                    kind: RLBtnKind.light,
                    full: true,
                    onPressed: () => showGeneralComingSoon(ref, 'Logo uploads'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: RLBtn(
                    label: 'Choose file',
                    kind: RLBtnKind.light,
                    full: true,
                    onPressed: () => showGeneralComingSoon(ref, 'Logo uploads'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AccentSheet extends StatefulWidget {
  const _AccentSheet({required this.ref, required this.onClose});

  final WidgetRef ref;
  final VoidCallback onClose;

  @override
  State<_AccentSheet> createState() => _AccentSheetState();
}

class _AccentSheetState extends State<_AccentSheet> {
  String _selected = kPlaceholderAccent;

  @override
  Widget build(BuildContext context) {
    return RLSheet(
      title: 'Document accent colour',
      desc: 'Used for headings and highlights on tenant-facing documents.',
      onClose: widget.onClose,
      footer: rlSheetFooter(
        confirmLabel: 'Save colour',
        onCancel: widget.onClose,
        onConfirm: () =>
            _comingSoon(widget.ref, widget.onClose, 'Document accent colours'),
      ),
      child: Column(
        children: [
          Row(
            children: [
              for (final hex in kPlaceholderAccentSwatches) ...[
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selected = hex),
                    child: Container(
                      height: 52,
                      decoration: BoxDecoration(
                        color: _hexColor(hex),
                        borderRadius: BorderRadius.circular(RLTokens.rMd),
                        border: hex == _selected
                            ? Border.all(color: RLTokens.ink, width: 2.5)
                            : Border.all(color: RLTokens.hairline),
                      ),
                      child: hex == _selected
                          ? const Icon(
                              Icons.check_rounded,
                              size: 19,
                              color: Colors.white,
                            )
                          : null,
                    ),
                  ),
                ),
                if (hex != kPlaceholderAccentSwatches.last)
                  const SizedBox(width: 10),
              ],
            ],
          ),
          const SizedBox(height: 10),
          Text(
            _selected,
            style: const TextStyle(
              fontFamily: RLTokens.fontMono,
              fontSize: 11.5,
              color: RLTokens.muted,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Preferences ───────────────────────────────────────────────────────────────

class _PreferenceSheet extends StatefulWidget {
  const _PreferenceSheet({
    required this.title,
    required this.desc,
    required this.label,
    required this.options,
    required this.current,
    required this.feature,
    required this.ref,
    required this.onClose,
  });

  final String title;
  final String desc;
  final String label;
  final List<String> options;
  final String current;
  final String feature;
  final WidgetRef ref;
  final VoidCallback onClose;

  @override
  State<_PreferenceSheet> createState() => _PreferenceSheetState();
}

class _PreferenceSheetState extends State<_PreferenceSheet> {
  late String _selected = widget.current;

  @override
  Widget build(BuildContext context) {
    return RLSheet(
      title: widget.title,
      desc: widget.desc,
      onClose: widget.onClose,
      footer: rlSheetFooter(
        confirmLabel: 'Save',
        onCancel: widget.onClose,
        onConfirm: () =>
            _comingSoon(widget.ref, widget.onClose, widget.feature),
      ),
      child: RLSheetSelect(
        label: widget.label,
        value: _selected,
        options: widget.options,
        onChanged: (v) => setState(() => _selected = v),
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Close the sheet, then say why nothing was saved.
void _comingSoon(WidgetRef ref, VoidCallback close, String feature) {
  close();
  showGeneralComingSoon(ref, feature);
}

Color _hexColor(String hex) =>
    Color(int.parse(hex.replaceFirst('#', ''), radix: 16) | 0xFF000000);
