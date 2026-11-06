// Section pages for the Application Info hub.
//
// The redesign splits the old single long scroll into a hub plus one page per
// checklist step. Tenant Details keeps Basic Information, Identity Verification
// and Emergency Contact & Background together on one page (matching the web);
// Move In, Financial and Docs each get their own.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/lib/application_utils.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/lib/property_status.dart';
import 'package:rentloop_manager/src/lib/unit_status.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_data.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_edit_sheets.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// Every section page shares this shell: back header, scrolling body, and an
/// optional lead-in description.
class _SectionScaffold extends StatelessWidget {
  const _SectionScaffold({
    required this.title,
    this.description,
    required this.children,
    this.onAddDocument,
  });

  final String title;
  final String? description;
  final List<Widget> children;
  final VoidCallback? onAddDocument;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: title,
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            trailing: onAddDocument == null
                ? null
                : GestureDetector(
                    onTap: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      if (context.mounted) onAddDocument!();
                    },
                    child: const Padding(
                      padding: EdgeInsets.all(10),
                      child: Icon(
                        Icons.more_horiz,
                        size: 22,
                        color: RLTokens.ink,
                      ),
                    ),
                  ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(
                RLTokens.gutter,
                4,
                RLTokens.gutter,
                32,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (description != null) ...[
                    Padding(
                      padding: const EdgeInsets.fromLTRB(2, 4, 2, 14),
                      child: Text(
                        description!,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 13.5,
                          color: RLTokens.muted,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                  ...children,
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Shared section building blocks ───────────────────────────────────────────

bool _canEdit(WidgetRef ref, TenantApplicationModel? model) =>
    model != null &&
    canEditApplication(model, ref.watch(myPropertyRolesProvider).valueOrNull);

class _FinishOnWebNotice extends ConsumerWidget {
  const _FinishOnWebNotice({required this.propertyId, required this.id});
  final String propertyId;
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final model = ref
        .watch(applicationDetailProvider(propertyId, id))
        .valueOrNull;
    if (!_canEdit(ref, model)) return const SizedBox.shrink();
    return const Padding(
      padding: EdgeInsets.fromLTRB(2, 0, 2, 14),
      child: Text(
        'Finish this step on the web for now.',
        style: TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 13.5,
          color: RLTokens.muted,
          height: 1.5,
        ),
      ),
    );
  }
}

/// Card with a serif heading and an optional Edit affordance.
class AppSectionCard extends StatelessWidget {
  const AppSectionCard({
    super.key,
    required this.title,
    this.onEdit,
    required this.child,
  });

  final String title;
  final VoidCallback? onEdit;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: RLCard(
        padding: const EdgeInsets.all(18),
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
                      fontSize: 17,
                      color: RLTokens.ink,
                      letterSpacing: -0.2,
                    ),
                  ),
                ),
                if (onEdit != null) EditButton(onTap: onEdit!),
              ],
            ),
            const SizedBox(height: 16),
            child,
          ],
        ),
      ),
    );
  }
}

class EditButton extends StatelessWidget {
  const EditButton({super.key, required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        onTap();
      },
      child: const Padding(
        padding: EdgeInsets.only(left: 12, bottom: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
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
    );
  }
}

/// A single key/value cell. [full] makes it span both grid columns.
class KVEntry {
  const KVEntry(this.label, this.value, {this.full = false});
  final String label;
  final String? value;
  final bool full;
}

/// Two-column key/value grid; full-width entries break onto their own row.
class KVGrid extends StatelessWidget {
  const KVGrid(this.entries, {super.key});
  final List<KVEntry> entries;

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    var i = 0;
    while (i < entries.length) {
      final entry = entries[i];
      if (entry.full) {
        rows.add(_KVCell(entry));
        i += 1;
        continue;
      }
      // Pair this cell with the next one, unless the next is full-width.
      final next = (i + 1 < entries.length && !entries[i + 1].full)
          ? entries[i + 1]
          : null;
      rows.add(
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: _KVCell(entry)),
            const SizedBox(width: 16),
            Expanded(
              child: next == null ? const SizedBox.shrink() : _KVCell(next),
            ),
          ],
        ),
      );
      i += next == null ? 1 : 2;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var r = 0; r < rows.length; r++) ...[
          if (r > 0) const SizedBox(height: 18),
          rows[r],
        ],
      ],
    );
  }
}

class _KVCell extends StatelessWidget {
  const _KVCell(this.entry);
  final KVEntry entry;

  @override
  Widget build(BuildContext context) {
    final empty = entry.value == null || entry.value!.isEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          entry.label.toUpperCase(),
          style: const TextStyle(
            fontFamily: RLTokens.fontMono,
            fontSize: 10,
            letterSpacing: 0.5,
            color: RLTokens.mutedSoft,
          ),
        ),
        const SizedBox(height: 5),
        Text(
          empty ? '—' : entry.value!,
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14.5,
            fontWeight: RLTokens.semibold,
            color: empty ? RLTokens.micro : RLTokens.ink,
          ),
        ),
      ],
    );
  }
}

/// Small heading used inside a card to separate grouped fields.
class CardSubheading extends StatelessWidget {
  const CardSubheading(this.text, {super.key, this.divided = false});
  final String text;
  final bool divided;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(top: divided ? 16 : 0, bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (divided)
            const Padding(
              padding: EdgeInsets.only(bottom: 16),
              child: Divider(color: RLTokens.hairlineSoft, height: 1),
            ),
          Text(
            text,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              fontWeight: RLTokens.bold,
              color: RLTokens.ink,
            ),
          ),
        ],
      ),
    );
  }
}

/// Uppercase mono label used above the signing-status list.
class MonoLabel extends StatelessWidget {
  const MonoLabel(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 18, bottom: 8),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontFamily: RLTokens.fontMono,
          fontSize: 10,
          letterSpacing: 0.6,
          color: RLTokens.mutedSoft,
        ),
      ),
    );
  }
}

class _IdImage extends StatelessWidget {
  const _IdImage({required this.label, required this.url});
  final String label;
  final String? url;

  Widget _placeholder() => const Text(
    'No image',
    style: TextStyle(
      fontFamily: RLTokens.fontSans,
      fontSize: 11.5,
      color: RLTokens.micro,
    ),
  );

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 12,
            color: RLTokens.muted,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          height: 92,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: RLTokens.fill,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: RLTokens.hairline),
          ),
          alignment: Alignment.center,
          child: url == null
              ? _placeholder()
              : Image.network(
                  url!,
                  width: double.infinity,
                  height: 92,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => _placeholder(),
                ),
        ),
      ],
    );
  }
}

// ── Unit Setup ───────────────────────────────────────────────────────────────

class ApplicationUnitPage extends ConsumerWidget {
  const ApplicationUnitPage({
    super.key,
    required this.data,
    required this.propertyId,
    this.readOnly = false,
  });

  final ApplicationDetailData data;
  final String propertyId;
  final bool readOnly;

  Future<void> _pickUnit(BuildContext context, ApplicationDetailData d) =>
      showChangeUnitSheet(
        context,
        propertyId: propertyId,
        id: d.id,
        currentUnitId: d.desiredUnit?.id,
        applicationRentFee: d.financial.rentFee,
      );

  Future<void> _viewUnit(BuildContext context, String unitId) async {
    await Haptics.vibrate(HapticsType.selection);
    if (!context.mounted) return;
    await context.push('/properties/$propertyId/units/$unitId');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final model = ref
        .watch(applicationDetailProvider(propertyId, data.id))
        .valueOrNull;
    final d = model == null
        ? data
        : ApplicationDetailData.fromApplicationModel(model);
    final single =
        ref.watch(propertyDetailProvider(propertyId)).valueOrNull?.type ==
        'SINGLE';
    final unit = d.desiredUnit;

    final String? lockReason;
    if (model?.financialAccount?.rentTermsLocked == true) {
      lockReason =
          "Rent has already been billed, so the unit can't be changed.";
    } else if (const {
      'SIGNED',
      'SIGNING',
    }.contains(model?.leaseAgreementDocumentStatus)) {
      lockReason =
          'The lease document has been signed, so the unit can no longer be '
          'changed.';
    } else {
      lockReason = null;
    }
    final locked = readOnly || !_canEdit(ref, model);
    final canChange = !locked && !single && lockReason == null;

    return _SectionScaffold(
      title: 'Unit Setup',
      description: 'The unit this tenant is moving into.',
      children: [
        if (unit == null)
          _NoUnitSelected(
            canAssign: canChange,
            onAssign: () => _pickUnit(context, d),
          )
        else ...[
          _SelectedUnitCard(
            unit: unit,
            onView: () => _viewUnit(context, unit.id),
            onChange: canChange ? () => _pickUnit(context, d) : null,
            showChange: canChange,
          ),
          if (canChange && unit.isOccupied)
            const Padding(
              padding: EdgeInsets.only(top: 12),
              child: _LockNotice(
                reason: 'This unit is now occupied — choose another unit',
              ),
            ),
          if (!locked && lockReason != null)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: _LockNotice(reason: lockReason),
            ),
          if (single)
            const Padding(
              padding: EdgeInsets.only(top: 12),
              child: _LockNotice(
                reason:
                    'This is a single-unit property, so there is no other '
                    'unit to choose.',
              ),
            ),
        ],
      ],
    );
  }
}

class _SelectedUnitCard extends StatelessWidget {
  const _SelectedUnitCard({
    required this.unit,
    required this.onView,
    required this.onChange,
    required this.showChange,
  });

  final ApplicationUnit unit;
  final VoidCallback onView;

  /// Null when the change affordance should render disabled.
  final VoidCallback? onChange;
  final bool showChange;

  @override
  Widget build(BuildContext context) {
    final statusLabel = propertyStatusLabel(unit.status);

    return RLCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(RLTokens.rLg),
            ),
            child: AspectRatio(
              aspectRatio: 16 / 9,
              child: unit.imageUrl == null
                  ? Container(
                      color: RLTokens.fill,
                      alignment: Alignment.center,
                      child: const Text(
                        'No image',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12.5,
                          color: RLTokens.micro,
                        ),
                      ),
                    )
                  : Image.network(
                      unit.imageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) =>
                          Container(color: RLTokens.fill),
                    ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        unit.name,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSerif,
                          fontSize: 20,
                          color: RLTokens.ink,
                          letterSpacing: -0.2,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    RLPill(statusLabel, tone: statusTone(statusLabel)),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  unitTypeLabel(unit.type),
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12.5,
                    color: RLTokens.muted,
                  ),
                ),
                const SizedBox(height: 12),
                _MarketRent(unit: unit),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: RLBtn(
                        label: 'View unit',
                        kind: RLBtnKind.light,
                        full: true,
                        onPressed: onView,
                      ),
                    ),
                    if (showChange) ...[
                      const SizedBox(width: 10),
                      Expanded(
                        child: Opacity(
                          opacity: onChange == null ? 0.45 : 1,
                          child: RLBtn(
                            label: 'Change',
                            kind: RLBtnKind.primary,
                            icon: Icons.swap_horiz_rounded,
                            full: true,
                            onPressed: onChange,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MarketRent extends StatelessWidget {
  const _MarketRent({required this.unit});
  final ApplicationUnit unit;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12),
      decoration: BoxDecoration(
        color: RLTokens.fill,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
      ),
      // Label left, value right. All leftover width goes to one Expanded and
      // the value is right-aligned inside it — a Spacer plus unconstrained
      // Texts overflows as soon as the amount grows (see the _SpecRow note in
      // docs/implementation.md for the same trap).
      child: Row(
        children: [
          const Text(
            'Market rent',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13,
              color: RLTokens.muted,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: formatPesewas(unit.rentFee),
                    style: const TextStyle(
                      fontSize: 14.5,
                      fontWeight: RLTokens.bold,
                      color: RLTokens.ink,
                    ),
                  ),
                  if (unit.paymentFrequency != null)
                    TextSpan(
                      text:
                          ' / ${paymentFrequencyLabel(unit.paymentFrequency!)}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: RLTokens.muted,
                      ),
                    ),
                ],
              ),
              textAlign: TextAlign.right,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontFamily: RLTokens.fontSans),
            ),
          ),
        ],
      ),
    );
  }
}

class _NoUnitSelected extends StatelessWidget {
  const _NoUnitSelected({required this.canAssign, required this.onAssign});
  final bool canAssign;
  final VoidCallback onAssign;

  @override
  Widget build(BuildContext context) {
    return RLCard(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
      child: Column(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: const BoxDecoration(
              color: RLTokens.fill,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.apartment_rounded,
              size: 24,
              color: RLTokens.mutedSoft,
            ),
          ),
          const SizedBox(height: 14),
          const Text(
            'No unit assigned yet',
            style: TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 18,
              color: RLTokens.ink,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Assign a unit to set the rent and payment frequency for this '
            'tenant.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13,
              color: RLTokens.muted,
              height: 1.5,
            ),
          ),
          if (canAssign) ...[
            const SizedBox(height: 18),
            RLBtn(
              label: 'Assign unit',
              kind: RLBtnKind.primary,
              icon: Icons.add_rounded,
              full: true,
              onPressed: onAssign,
            ),
          ],
        ],
      ),
    );
  }
}

class _LockNotice extends StatelessWidget {
  const _LockNotice({required this.reason});
  final String reason;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12),
      decoration: BoxDecoration(
        color: RLTokens.warningBg,
        borderRadius: BorderRadius.circular(11),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.lock_outline_rounded,
            size: 17,
            color: RLTokens.warning,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              reason,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                color: RLTokens.inkSoft,
                height: 1.45,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Tenant Details ───────────────────────────────────────────────────────────

class ApplicationTenantPage extends ConsumerWidget {
  const ApplicationTenantPage({
    super.key,
    required this.data,
    required this.propertyId,
    this.readOnly = false,
  });

  final ApplicationDetailData data;
  final String propertyId;
  final bool readOnly;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final model = ref
        .watch(applicationDetailProvider(propertyId, data.id))
        .valueOrNull;
    final d = model == null
        ? data
        : ApplicationDetailData.fromApplicationModel(model);
    final a = d.applicant;
    final id = d.identity;
    final b = d.background;
    final locked =
        readOnly ||
        !_canEdit(ref, model) ||
        const {
          'SIGNED',
          'SIGNING',
        }.contains(model?.leaseAgreementDocumentStatus);

    return _SectionScaffold(
      title: 'Tenant Details',
      description: "Applicant's personal, identity and background details.",
      children: [
        AppSectionCard(
          title: 'Basic Information',
          onEdit: locked
              ? null
              : () => showBasicInfoSheet(
                  context,
                  applicant: a,
                  propertyId: propertyId,
                  id: d.id,
                ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    clipBehavior: Clip.antiAlias,
                    decoration: const BoxDecoration(
                      color: RLTokens.fill,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: a.profilePhotoUrl == null
                        ? const Text(
                            'No photo',
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 10.5,
                              color: RLTokens.micro,
                            ),
                          )
                        : Image.network(
                            a.profilePhotoUrl!,
                            width: 56,
                            height: 56,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) =>
                                const SizedBox.shrink(),
                          ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          a.fullName,
                          style: const TextStyle(
                            fontFamily: RLTokens.fontSerif,
                            fontSize: 20,
                            color: RLTokens.ink,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Applicant',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12.5,
                            color: RLTokens.muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              KVGrid([
                KVEntry('First name', a.firstName),
                KVEntry('Last name', a.lastName),
                KVEntry('Other names', a.otherNames),
                KVEntry('Gender', kGenderOptions[a.gender]),
                KVEntry(
                  'Marital status',
                  kMaritalStatusOptions[a.maritalStatus],
                ),
                KVEntry(
                  'Date of birth',
                  a.dateOfBirth == null
                      ? null
                      : formatApplicationDate(a.dateOfBirth!),
                ),
                KVEntry('Email', a.email, full: true),
                KVEntry('Phone', a.phone, full: true),
              ]),
            ],
          ),
        ),
        AppSectionCard(
          title: 'Identity Verification',
          onEdit: locked
              ? null
              : () => showIdentitySheet(
                  context,
                  identity: id,
                  propertyId: propertyId,
                  id: d.id,
                ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              KVGrid([
                KVEntry('Nationality', id.nationality),
                KVEntry('ID type', kIdTypeOptions[id.idType]),
                KVEntry('ID number', id.idNumber),
                KVEntry('Current address', id.currentAddress),
              ]),
              const CardSubheading('ID document images', divided: false),
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Row(
                  children: [
                    Expanded(
                      child: _IdImage(label: 'Front', url: id.idFrontUrl),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _IdImage(label: 'Back', url: id.idBackUrl),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        AppSectionCard(
          title: 'Emergency Contact & Background',
          onEdit: locked
              ? null
              : () => showBackgroundSheet(
                  context,
                  background: b,
                  propertyId: propertyId,
                  id: d.id,
                ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CardSubheading('Emergency contact'),
              KVGrid([
                KVEntry('Full name', b.emergencyContactName),
                KVEntry('Relationship', b.relationshipToEmergencyContact),
                KVEntry('Phone number', b.emergencyContactPhone, full: true),
              ]),
              CardSubheading(
                b.isStudent ? 'Student information' : 'Employment',
                divided: true,
              ),
              KVGrid([
                KVEntry(
                  'Employment type',
                  kEmployerTypeOptions[b.employerType],
                ),
                if (!b.isStudent) KVEntry('Occupation', b.occupation),
                KVEntry(
                  b.isStudent ? 'Institution/School' : 'Employer',
                  b.employer,
                ),
                KVEntry('Address', b.occupationAddress),
              ]),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Move In Setup ────────────────────────────────────────────────────────────

class ApplicationMoveInPage extends ConsumerWidget {
  const ApplicationMoveInPage({
    super.key,
    required this.data,
    required this.propertyId,
    this.readOnly = false,
  });

  final ApplicationDetailData data;
  final String propertyId;
  final bool readOnly;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final model = ref
        .watch(applicationDetailProvider(propertyId, data.id))
        .valueOrNull;
    final d = model == null
        ? data
        : ApplicationDetailData.fromApplicationModel(model);
    final account = model?.financialAccount;
    final locked =
        readOnly || !_canEdit(ref, model) || account?.rentTermsLocked == true;
    final m = d.moveIn;
    final frequency =
        m.stayDurationFrequency ?? d.desiredUnit?.paymentFrequency;
    final frequencyLabel = kStayFrequencyOptions[frequency];

    return _SectionScaffold(
      title: 'Move In Setup',
      description: 'Move-in details for the tenant.',
      children: [
        AppSectionCard(
          title: 'Move In Setup',
          onEdit: locked
              ? null
              : () => showMoveInSheet(
                  context,
                  moveIn: m,
                  fallbackFrequency: d.desiredUnit?.paymentFrequency,
                  chargeCount: account?.chargeCount ?? 0,
                  propertyId: propertyId,
                  id: d.id,
                ),
          child: KVGrid([
            KVEntry(
              'Desired move-in date',
              m.desiredMoveInDate == null
                  ? null
                  : formatApplicationDate(m.desiredMoveInDate!),
            ),
            KVEntry('Stay frequency', frequencyLabel),
            KVEntry(
              'Stay duration'
              '${frequencyLabel == null ? '' : ' (${frequencyLabel.toLowerCase()})'}',
              m.stayDuration == null
                  ? null
                  : '${m.stayDuration} '
                        '${periodLabel(frequency, m.stayDuration!)}',
              full: true,
            ),
          ]),
        ),
      ],
    );
  }
}

// ── Docs Setup ───────────────────────────────────────────────────────────────

class ApplicationDocsPage extends StatefulWidget {
  const ApplicationDocsPage({
    super.key,
    required this.data,
    required this.onChanged,
    this.readOnly = false,
    this.propertyId,
  });

  final ApplicationDetailData data;
  final ValueChanged<ApplicationDetailData> onChanged;
  final bool readOnly;

  /// When set, a manager is told to finish this step on the web.
  final String? propertyId;

  @override
  State<ApplicationDocsPage> createState() => _ApplicationDocsPageState();
}

class _ApplicationDocsPageState extends State<ApplicationDocsPage> {
  late ApplicationDetailData _d = widget.data;

  void _sign(ApplicationSigner signer) async {
    await Haptics.vibrate(HapticsType.medium);
    final signers = [
      for (final s in _d.doc.signers)
        s.role == signer.role ? s.copyWith(signed: true) : s,
    ];
    final next = _d.copyWith(
      doc: ApplicationDoc(
        name: _d.doc.name,
        source: _d.doc.source,
        status: _d.doc.status,
        mode: _d.doc.mode,
        signers: signers,
      ),
    );
    setState(() => _d = next);
    widget.onChanged(next);
  }

  Future<void> _prompt(ApplicationSigner signer) async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Signing prompt sent to ${signer.label}')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final doc = _d.doc;

    return _SectionScaffold(
      title: 'Docs Setup',
      description: 'Documentation for the lease agreement.',
      onAddDocument: widget.readOnly
          ? null
          : () => showAddDocumentSheet(context),
      children: [
        if (widget.propertyId != null)
          _FinishOnWebNotice(propertyId: widget.propertyId!, id: _d.id),
        AppSectionCard(
          title: 'Docs Setup',
          onEdit: widget.readOnly ? null : () => showAddDocumentSheet(context),
          child: doc.attached
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _DocumentRow(doc: doc),
                    const SizedBox(height: 10),
                    const _EditorHint(),
                    const MonoLabel('Signing status'),
                    for (var i = 0; i < doc.signers.length; i++)
                      _SignerRow(
                        signer: doc.signers[i],
                        first: i == 0,
                        readOnly: widget.readOnly,
                        onSign: () => _sign(doc.signers[i]),
                        onPrompt: () => _prompt(doc.signers[i]),
                      ),
                  ],
                )
              : widget.readOnly
              ? const _NoDocument(onAdd: null)
              : _NoDocument(onAdd: () => showAddDocumentSheet(context)),
        ),
      ],
    );
  }
}

class _DocumentRow extends StatelessWidget {
  const _DocumentRow({required this.doc});
  final ApplicationDoc doc;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Row(
        children: [
          const DocxTile(),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  doc.name ?? 'Lease Agreement',
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13.5,
                    fontWeight: RLTokens.bold,
                    color: RLTokens.ink,
                  ),
                ),
                if (doc.source != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    doc.source!,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12,
                      color: RLTokens.muted,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 10),
          if (doc.status != null) RLPill(doc.status!, tone: RLTone.info),
        ],
      ),
    );
  }
}

class _EditorHint extends StatelessWidget {
  const _EditorHint();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 11),
      decoration: BoxDecoration(
        color: RLTokens.warningBg,
        borderRadius: BorderRadius.circular(11),
      ),
      child: RichText(
        text: const TextSpan(
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 12.5,
            color: RLTokens.inkSoft,
            height: 1.5,
          ),
          children: [
            TextSpan(text: 'Need changes? '),
            TextSpan(
              text: 'Open the editor',
              style: TextStyle(
                fontWeight: RLTokens.bold,
                color: RLTokens.warning,
              ),
            ),
            TextSpan(text: ' and revert the document to draft.'),
          ],
        ),
      ),
    );
  }
}

class _SignerRow extends StatelessWidget {
  const _SignerRow({
    required this.signer,
    required this.first,
    required this.readOnly,
    required this.onSign,
    required this.onPrompt,
  });

  final ApplicationSigner signer;
  final bool first;
  final bool readOnly;
  final VoidCallback onSign;
  final VoidCallback onPrompt;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 13),
      decoration: BoxDecoration(
        border: first
            ? null
            : const Border(top: BorderSide(color: RLTokens.hairlineSoft)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: signer.signed ? RLTokens.successBg : RLTokens.fill,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  signer.signed ? Icons.check_rounded : Icons.schedule_rounded,
                  size: 17,
                  color: signer.signed ? RLTokens.success : RLTokens.muted,
                ),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      signer.label,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 14,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.ink,
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      signer.signed ? 'Signed' : 'Awaiting signature',
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12,
                        color: RLTokens.muted,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              RLPill(
                signer.signed ? 'Signed' : 'Pending',
                tone: signer.signed ? RLTone.success : RLTone.neutral,
              ),
            ],
          ),
          if (!signer.signed && !readOnly)
            Padding(
              padding: const EdgeInsets.only(top: 10, left: 45),
              child: Align(
                alignment: Alignment.centerLeft,
                child: signer.isSelf
                    ? RLBtn(
                        label: 'Sign document',
                        kind: RLBtnKind.primary,
                        icon: Icons.edit_outlined,
                        large: false,
                        onPressed: onSign,
                      )
                    : RLBtn(
                        label: 'Prompt to sign',
                        kind: RLBtnKind.light,
                        icon: Icons.send_rounded,
                        large: false,
                        onPressed: onPrompt,
                      ),
              ),
            ),
        ],
      ),
    );
  }
}

class _NoDocument extends StatelessWidget {
  const _NoDocument({required this.onAdd});
  final VoidCallback? onAdd;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Padding(
          padding: EdgeInsets.only(bottom: 14),
          child: Text(
            'No lease document attached yet. Add one to start collecting '
            'signatures.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13,
              color: RLTokens.muted,
              height: 1.5,
            ),
          ),
        ),
        if (onAdd != null)
          RLBtn(
            label: 'Add document',
            kind: RLBtnKind.light,
            icon: Icons.add_rounded,
            full: true,
            onPressed: onAdd,
          ),
      ],
    );
  }
}
