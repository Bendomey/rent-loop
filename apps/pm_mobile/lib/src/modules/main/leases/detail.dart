import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:rentloop_manager/src/lib/lease_status.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/lib/property_status.dart';
import 'package:rentloop_manager/src/lib/unit_status.dart';
import 'package:rentloop_manager/src/modules/main/leases/checklist_detail.dart';
import 'package:rentloop_manager/src/modules/main/leases/create_checklist_dialog.dart';
import 'package:rentloop_manager/src/modules/main/leases/start_lease_sheet.dart';
import 'package:rentloop_manager/src/repository/models/lease_checklist_model.dart';
import 'package:rentloop_manager/src/repository/models/lease_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_model.dart';
import 'package:rentloop_manager/src/repository/providers/leases/lease_checklists_provider.dart';
import 'package:rentloop_manager/src/repository/providers/leases/lease_detail_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kLeaseTabs = [
  'Lease Details',
  'Tenant Profile',
  'Documents',
  'Expenses',
];

void _pushChecklistDetail(
  BuildContext context, {
  required String propertyId,
  required String leaseId,
  required String checklistId,
}) {
  Navigator.of(context).push(
    MaterialPageRoute(
      builder: (_) => ChecklistDetailScreen(
        propertyId: propertyId,
        leaseId: leaseId,
        checklistId: checklistId,
      ),
    ),
  );
}

/// Shared by the alert rows' "Create Report" actions and the Inspection
/// Reports card's "+ {type}" ghost buttons: confirms via
/// `showCreateChecklistDialog`, then re-fetches the checklist list (the
/// create response isn't guaranteed to include populated `items`) and opens
/// the freshly-created checklist.
Future<void> _createChecklistAndOpen(
  BuildContext context,
  WidgetRef ref, {
  required String propertyId,
  required String leaseId,
  required String type,
}) async {
  final created = await showCreateChecklistDialog(
    context: context,
    ref: ref,
    propertyId: propertyId,
    leaseId: leaseId,
    type: type,
  );
  if (created != true || !context.mounted) return;

  final checklists = await ref.refresh(
    leaseChecklistsProvider(propertyId, leaseId).future,
  );
  LeaseChecklistModel? match;
  for (final c in checklists) {
    if (c.type == type) {
      match = c;
      break;
    }
  }
  if (match == null || !context.mounted) return;
  _pushChecklistDetail(
    context,
    propertyId: propertyId,
    leaseId: leaseId,
    checklistId: match.id,
  );
}

String _formatDate(String? iso) {
  if (iso == null) return '—';
  final date = DateTime.tryParse(iso);
  if (date == null) return '—';
  return DateFormat('d MMMM y').format(date.toLocal());
}

Future<void> _openUrl(String url) async {
  final uri = Uri.parse(url);
  if (await canLaunchUrl(uri))
    await launchUrl(uri, mode: LaunchMode.externalApplication);
}

// ── Screen ────────────────────────────────────────────────────────────────────

/// Needs [propertyId] (unlike every other `/more/...` detail screen) since
/// `GET .../leases/{lease_id}` is property-scoped in the URL — carried via
/// GoRouter query param, set from `lease.unit.propertyId` when the leases
/// list pushes here.
class LeaseDetailScreen extends ConsumerWidget {
  const LeaseDetailScreen({super.key, required this.id, this.propertyId});
  final String id;
  final String? propertyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (propertyId == null) {
      return Scaffold(
        backgroundColor: RLTokens.surface,
        body: Column(
          children: [
            RLBackHeader(
              title: 'Lease',
              onBack: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (context.mounted) Navigator.of(context).pop();
              },
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(RLTokens.gutter),
                child: RLSectionError(
                  title: "Couldn't load lease",
                  body: 'Missing property context.',
                ),
              ),
            ),
          ],
        ),
      );
    }

    final leaseAsync = ref.watch(leaseDetailProvider(propertyId!, id));
    final showSkeleton = !leaseAsync.hasValue && leaseAsync.isLoading;
    final showError = leaseAsync.hasError && !leaseAsync.hasValue;

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: leaseAsync.valueOrNull?.code ?? 'Lease',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: showSkeleton
                ? const _DetailSkeleton()
                : showError
                ? Padding(
                    padding: const EdgeInsets.all(RLTokens.gutter),
                    child: RLSectionError(
                      onRetry: () =>
                          ref.invalidate(leaseDetailProvider(propertyId!, id)),
                    ),
                  )
                : RefreshIndicator(
                    color: RLTokens.crimson,
                    onRefresh: () async {
                      await Future.wait([
                        ref.refresh(
                          leaseDetailProvider(propertyId!, id).future,
                        ),
                        ref.refresh(
                          leaseChecklistsProvider(propertyId!, id).future,
                        ),
                      ]);
                    },
                    child: _LeaseDetailContent(
                      propertyId: propertyId!,
                      lease: leaseAsync.value!,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _DetailSkeleton extends StatelessWidget {
  const _DetailSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: ListView(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
        children: [
          Container(
            height: 220,
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
            ),
          ),
          Container(
            height: 160,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Body ──────────────────────────────────────────────────────────────────────

class _LeaseDetailContent extends ConsumerStatefulWidget {
  const _LeaseDetailContent({required this.propertyId, required this.lease});
  final String propertyId;
  final LeaseModel lease;

  @override
  ConsumerState<_LeaseDetailContent> createState() =>
      _LeaseDetailContentState();
}

class _LeaseDetailContentState extends ConsumerState<_LeaseDetailContent> {
  String _tab = _kLeaseTabs.first;

  Future<void> _onSelectTab(String tab) async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() => _tab = tab);
  }

  @override
  Widget build(BuildContext context) {
    final lease = widget.lease;

    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: _LeaseAlerts(propertyId: widget.propertyId, lease: lease),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              _LeaseSidebarCard(propertyId: widget.propertyId, lease: lease),
              const SizedBox(height: RLTokens.space6),
              RLFilterChips(
                options: _kLeaseTabs,
                selected: _tab,
                onSelect: _onSelectTab,
              ),
              const SizedBox(height: 16),
              ..._buildTabContent(lease),
              const SizedBox(height: 32),
            ]),
          ),
        ),
      ],
    );
  }

  List<Widget> _buildTabContent(LeaseModel lease) {
    switch (_tab) {
      case 'Tenant Profile':
        return _buildTenantProfile(lease.tenant);
      case 'Documents':
        return _buildDocuments(lease);
      case 'Expenses':
        return [const _ComingSoonTab(title: 'Expenses')];
      default:
        return _buildLeaseDetails(widget.propertyId, lease);
    }
  }
}

List<Widget> _buildLeaseDetails(String propertyId, LeaseModel lease) {
  final application = lease.tenantApplication;

  return [
    Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionHeading('Lease Terms'),
          _InfoCard(
            rows: [
              _FieldRow(
                k: 'Payment Frequency',
                v: paymentFrequencyLabel(lease.paymentFrequency ?? '—'),
              ),
              _FieldRow(
                k: 'Duration',
                v:
                    lease.stayDuration != null &&
                        lease.stayDurationFrequency != null
                    ? stayDurationLabel(
                        lease.stayDuration!,
                        lease.stayDurationFrequency!,
                      )
                    : '—',
              ),
              _FieldRow(k: 'Move-in Date', v: _formatDate(lease.moveInDate)),
              _FieldRow(k: 'Move-out Date', v: _formatDate(lease.moveOutDate)),
              _FieldRow(
                k: 'Property Inspection',
                v: _formatDate(lease.propertyInspectionDate),
              ),
              _FieldRow(
                k: 'Utility Transfers',
                v: _formatDate(lease.utilityTransfersDate),
              ),
              _FieldRow(k: 'Activated At', v: _formatDate(lease.activatedAt)),
              if (lease.cancelledAt != null)
                _FieldRow(k: 'Cancelled At', v: _formatDate(lease.cancelledAt)),
              if (lease.terminatedAt != null)
                _FieldRow(
                  k: 'Terminated At',
                  v: _formatDate(lease.terminatedAt),
                  last: lease.completedAt == null,
                ),
              if (lease.completedAt != null)
                _FieldRow(
                  k: 'Completed At',
                  v: _formatDate(lease.completedAt),
                  last: true,
                ),
            ],
          ),
          if (application != null) ...[
            const SizedBox(height: 20),
            _SectionHeading('Financial Terms'),
            _InfoCard(
              rows: [
                _FieldRow(
                  k: 'Rent Fee',
                  v: _moneyLabel(
                    application.rentFee ?? lease.rentFee,
                    application.rentFeeCurrency ?? lease.rentFeeCurrency,
                  ),
                ),
                if (application.initialDepositFee != null)
                  _FieldRow(
                    k: 'Initial Deposit',
                    v: _moneyLabel(
                      application.initialDepositFee!,
                      application.rentFeeCurrency ?? lease.rentFeeCurrency,
                    ),
                  ),
                if (application.paymentFrequency != null)
                  _FieldRow(
                    k: 'Payment Frequency',
                    v: paymentFrequencyLabel(application.paymentFrequency!),
                  ),
                _FieldRow(
                  k: 'Security Deposit',
                  v: application.securityDepositFee != null
                      ? _moneyLabel(
                          application.securityDepositFee!,
                          application.rentFeeCurrency ?? lease.rentFeeCurrency,
                        )
                      : '-',
                  last: application.applicationPaymentInvoice == null,
                ),
                if (application.applicationPaymentInvoice != null)
                  _LinkFieldRow(
                    k: 'Invoice',
                    label: application.applicationPaymentInvoice!.code,
                    last: true,
                    onTap: (context) => context.push(
                      '/money/invoices/${application.applicationPaymentInvoice!.id}',
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    ),
    const SizedBox(height: 16),
    Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: _InspectionReportsSection(
        propertyId: propertyId,
        leaseId: lease.id,
      ),
    ),
  ];
}

String _moneyLabel(int pesewas, String currency) {
  final amount = pesewasToCedis(pesewas);
  final symbol = currency.toUpperCase() == 'GHS' ? 'GH₵' : currency;
  return '$symbol ${amount.toStringAsFixed(2)}';
}

List<Widget> _buildTenantProfile(TenantModel? tenant) {
  if (tenant == null) {
    return [
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: Text(
          'Tenant information not available.',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13.5,
            color: RLTokens.muted,
          ),
        ),
      ),
    ];
  }

  final fullName = [
    tenant.firstName,
    tenant.otherNames,
    tenant.lastName,
  ].whereType<String>().where((v) => v.isNotEmpty).join(' ');

  return [
    Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionHeading('Personal Information'),
          _InfoCard(
            rows: [
              _FieldRow(k: 'Full Name', v: fullName),
              _FieldRow(k: 'Email', v: tenant.email ?? '—'),
              _FieldRow(k: 'Phone', v: tenant.phone),
              _FieldRow(k: 'Gender', v: _titleCase(tenant.gender)),
              _FieldRow(k: 'Date of Birth', v: _formatDate(tenant.dateOfBirth)),
              _FieldRow(
                k: 'Nationality',
                v: tenant.nationality != null
                    ? _titleCase(tenant.nationality!)
                    : '-',
              ),
              _FieldRow(
                k: 'Marital Status',
                v: tenant.maritalStatus != null
                    ? _titleCase(tenant.maritalStatus!)
                    : '-',
                last: true,
              ),
            ],
          ),
          const SizedBox(height: 20),
          _SectionHeading('Identification'),
          _InfoCard(
            rows: [
              _FieldRow(
                k: 'ID Type',
                v: tenant.idType?.replaceAll('_', ' ') ?? '—',
              ),
              _FieldRow(
                k: 'ID Number',
                v: tenant.idNumber ?? '—',
                last: tenant.idFrontUrl == null && tenant.idBackUrl == null,
              ),
              if (tenant.idFrontUrl != null)
                _LinkFieldRow(
                  k: 'ID Front',
                  label: 'View',
                  last: tenant.idBackUrl == null,
                  onExternalTap: () => _openUrl(tenant.idFrontUrl!),
                ),
              if (tenant.idBackUrl != null)
                _LinkFieldRow(
                  k: 'ID Back',
                  label: 'View',
                  last: true,
                  onExternalTap: () => _openUrl(tenant.idBackUrl!),
                ),
            ],
          ),
          const SizedBox(height: 20),
          _SectionHeading('Employment'),
          _InfoCard(
            rows: [
              _FieldRow(k: 'Employer', v: tenant.employer ?? '—'),
              _FieldRow(k: 'Occupation', v: tenant.occupation ?? '—'),
              _FieldRow(
                k: 'Occupation Address',
                v: tenant.occupationAddress ?? '—',
                last: tenant.proofOfIncomeUrl == null,
              ),
              if (tenant.proofOfIncomeUrl != null)
                _LinkFieldRow(
                  k: 'Proof of Income',
                  label: 'View',
                  last: true,
                  onExternalTap: () => _openUrl(tenant.proofOfIncomeUrl!),
                ),
            ],
          ),
          const SizedBox(height: 20),
          _SectionHeading('Emergency Contact'),
          _InfoCard(
            rows: [
              _FieldRow(k: 'Name', v: tenant.emergencyContactName ?? '—'),
              _FieldRow(k: 'Phone', v: tenant.emergencyContactPhone ?? '—'),
              _FieldRow(
                k: 'Relationship',
                v: tenant.relationshipToEmergencyContact != null
                    ? _titleCase(tenant.relationshipToEmergencyContact!)
                    : '-',
                last: true,
              ),
            ],
          ),
        ],
      ),
    ),
  ];
}

String _titleCase(String s) {
  if (s.isEmpty) return s;
  return '${s[0].toUpperCase()}${s.substring(1).toLowerCase()}';
}

List<Widget> _buildDocuments(LeaseModel lease) {
  return [
    Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionHeading('Lease Agreement'),
          if (lease.leaseAgreementDocumentUrl != null)
            _DocumentLinkRow(
              url: lease.leaseAgreementDocumentUrl!,
              label: 'View Document',
            )
          else
            Text(
              'Not set up yet.',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13,
                color: RLTokens.muted,
              ),
            ),
          if (lease.terminationAgreementDocumentUrl != null) ...[
            const SizedBox(height: 20),
            _SectionHeading('Termination Agreement'),
            _DocumentLinkRow(
              url: lease.terminationAgreementDocumentUrl!,
              label: 'View Document',
            ),
          ],
        ],
      ),
    ),
  ];
}

class _DocumentLinkRow extends StatelessWidget {
  const _DocumentLinkRow({required this.url, required this.label});
  final String url;
  final String label;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        await _openUrl(url);
      },
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.open_in_new_rounded, size: 14, color: RLTokens.info),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              fontWeight: RLTokens.semibold,
              color: RLTokens.info,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Alerts ────────────────────────────────────────────────────────────────────

class _LeaseAlerts extends ConsumerWidget {
  const _LeaseAlerts({required this.propertyId, required this.lease});
  final String propertyId;
  final LeaseModel lease;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final checklistsAsync = ref.watch(
      leaseChecklistsProvider(propertyId, lease.id),
    );
    // Mirrors the web's own early-return: no skeleton for alerts, they just
    // appear once the (fast, small) checklist list resolves.
    if (!checklistsAsync.hasValue) return const SizedBox.shrink();
    final checklists = checklistsAsync.value!;

    LeaseChecklistModel? checkIn;
    LeaseChecklistModel? checkOut;
    for (final c in checklists) {
      if (c.type == 'CHECK_IN') checkIn = c;
      if (c.type == 'CHECK_OUT') checkOut = c;
    }
    final checkInHandled =
        checkIn != null && isChecklistHandled(checkIn.status);
    final canOfferCheckIn = checkIn == null || checkIn.status == 'DRAFT';
    final checkOutHandled =
        checkOut != null && isChecklistHandled(checkOut.status);
    final canOfferCheckOut = checkOut == null || checkOut.status == 'DRAFT';

    final isPending = lease.status == 'Lease.Status.Pending';
    final showStarting = shouldShowCheckInAlert(lease, checklists) || isPending;
    final showEnding = shouldShowLeaseEndingAlert(lease);

    if (!showStarting && !showEnding) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(
        children: [
          if (showStarting)
            _AlertCard(
              title: 'Lease Starting Soon',
              description:
                  "Documenting the property's condition at move-in protects "
                  'you against future disputes, and activating the lease '
                  'unlocks billing and tenant access.',
              rows: [
                _AlertActionRow(
                  label: 'Move-In Report',
                  handled: checkInHandled,
                  actionLabel: canOfferCheckIn
                      ? (checkIn != null ? 'Complete Report' : 'Create Report')
                      : null,
                  onAction: () {
                    if (checkIn != null) {
                      _pushChecklistDetail(
                        context,
                        propertyId: propertyId,
                        leaseId: lease.id,
                        checklistId: checkIn.id,
                      );
                    } else {
                      _createChecklistAndOpen(
                        context,
                        ref,
                        propertyId: propertyId,
                        leaseId: lease.id,
                        type: 'CHECK_IN',
                      );
                    }
                  },
                ),
                _AlertActionRow(
                  label: 'Start Lease',
                  handled: !isPending,
                  actionLabel: isPending ? 'Start Lease' : null,
                  onAction: () async {
                    final result = await showStartLeaseSheet(
                      context: context,
                      propertyId: propertyId,
                      lease: lease,
                    );
                    if (result != null) {
                      ref.invalidate(leaseDetailProvider(propertyId, lease.id));
                    }
                  },
                ),
              ],
            ),
          if (showStarting && showEnding) const SizedBox(height: 8),
          if (showEnding)
            _AlertCard(
              title: 'Lease Ending Soon',
              description:
                  'This lease is approaching its end date. Wrap up the '
                  'Move-Out Report and decide whether to renew.',
              rows: [
                _AlertActionRow(
                  label: 'Move-Out Report',
                  handled: checkOutHandled,
                  actionLabel: canOfferCheckOut
                      ? (checkOut != null ? 'Complete Report' : 'Create Report')
                      : null,
                  onAction: () {
                    if (checkOut != null) {
                      _pushChecklistDetail(
                        context,
                        propertyId: propertyId,
                        leaseId: lease.id,
                        checklistId: checkOut.id,
                      );
                    } else {
                      _createChecklistAndOpen(
                        context,
                        ref,
                        propertyId: propertyId,
                        leaseId: lease.id,
                        type: 'CHECK_OUT',
                      );
                    }
                  },
                ),
                const _AlertActionRow(
                  label: 'Renew Lease',
                  handled: false,
                  actionLabel: 'Renew Lease',
                  disabled: true,
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _AlertCard extends StatelessWidget {
  const _AlertCard({
    required this.title,
    required this.description,
    required this.rows,
  });
  final String title;
  final String description;
  final List<Widget> rows;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: RLTokens.warningBg,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.warning.withAlpha(60)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.warning_amber_rounded,
                size: 18,
                color: RLTokens.warning,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13.5,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.warning,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            description,
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12,
              height: 1.4,
              color: RLTokens.inkSoft,
            ),
          ),
          const SizedBox(height: 10),
          ...rows,
        ],
      ),
    );
  }
}

class _AlertActionRow extends StatelessWidget {
  const _AlertActionRow({
    required this.label,
    required this.handled,
    this.actionLabel,
    this.onAction,
    this.disabled = false,
  });
  final String label;
  final bool handled;
  final String? actionLabel;
  final VoidCallback? onAction;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(140),
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(color: RLTokens.warning.withAlpha(50)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(
                handled ? Icons.check_circle_rounded : Icons.circle_outlined,
                size: 16,
                color: handled ? RLTokens.success : RLTokens.warning,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 12.5,
                  fontWeight: RLTokens.medium,
                  color: RLTokens.ink,
                ),
              ),
            ],
          ),
          if (actionLabel != null)
            GestureDetector(
              onTap: disabled
                  ? null
                  : () async {
                      await Haptics.vibrate(HapticsType.selection);
                      onAction?.call();
                    },
              child: Opacity(
                opacity: disabled ? 0.45 : 1,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    border: Border.all(color: RLTokens.warning),
                    borderRadius: BorderRadius.circular(RLTokens.rMd),
                  ),
                  child: Text(
                    actionLabel!,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 11.5,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.warning,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Sidebar card ──────────────────────────────────────────────────────────────

class _LeaseSidebarCard extends ConsumerWidget {
  const _LeaseSidebarCard({required this.propertyId, required this.lease});
  final String propertyId;
  final LeaseModel lease;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusLabel = propertyStatusLabel(lease.status);
    final tenant = lease.tenant;
    final unit = lease.unit;
    final isTerminable = lease.status == 'Lease.Status.Active';
    final isPending = lease.status == 'Lease.Status.Pending';

    return Container(
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Row(
              children: [
                const Icon(
                  Icons.description_outlined,
                  size: 18,
                  color: RLTokens.muted,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    lease.code,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 15,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.ink,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                RLPill(statusLabel, tone: statusTone(statusLabel)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _LinkRow(
                  icon: Icons.person_outline_rounded,
                  label: tenant?.fullName,
                  onTap: tenant != null
                      ? () => context.push('/more/tenants/${tenant.id}')
                      : null,
                ),
                const SizedBox(height: 10),
                _LinkRow(
                  icon: Icons.home_outlined,
                  label: unit?.name,
                  onTap: unit?.propertyId != null
                      ? () => context.push(
                          '/properties/${unit!.propertyId}/units/${unit.id}',
                        )
                      : null,
                ),
                const SizedBox(height: 14),
                const Divider(height: 1, color: RLTokens.hairlineSoft),
                const SizedBox(height: 14),
                Text(
                  'Rent Fee',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 11.5,
                    color: RLTokens.muted,
                  ),
                ),
                const SizedBox(height: 4),
                RLMoney(pesewasToCedis(lease.rentFee), size: 26),
                const SizedBox(height: 4),
                Text(
                  paymentFrequencyLabel(lease.paymentFrequency ?? '—'),
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 11.5,
                    color: RLTokens.muted,
                  ),
                ),
                const SizedBox(height: 14),
                const Divider(height: 1, color: RLTokens.hairlineSoft),
                const SizedBox(height: 14),
                _DateRow(label: 'Created On', iso: lease.createdAt),
                const SizedBox(height: 10),
                _DateRow(label: 'Updated On', iso: lease.updatedAt),
                if (lease.tenantApplicationId != null) ...[
                  const SizedBox(height: 14),
                  const Divider(height: 1, color: RLTokens.hairlineSoft),
                  const SizedBox(height: 14),
                  GestureDetector(
                    onTap: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      if (context.mounted) {
                        context.push(
                          '/activity/applications/${lease.tenantApplicationId}',
                        );
                      }
                    },
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.open_in_new_rounded,
                          size: 13,
                          color: RLTokens.info,
                        ),
                        const SizedBox(width: 5),
                        Text(
                          'View Application'
                          '${lease.tenantApplication != null ? ' (${lease.tenantApplication!.code})' : ''}',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12,
                            color: RLTokens.info,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (isTerminable || isPending) ...[
            const SizedBox(height: 4),
            Container(
              margin: const EdgeInsets.only(top: 14),
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: RLTokens.hairlineSoft)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (isTerminable)
                    Opacity(
                      opacity: 0.5,
                      child: IgnorePointer(
                        child: RLBtn(
                          label: 'Terminate Lease',
                          kind: RLBtnKind.danger,
                        ),
                      ),
                    ),
                  if (isPending)
                    RLBtn(
                      label: 'Start Lease',
                      icon: Icons.check_rounded,
                      onPressed: () async {
                        await Haptics.vibrate(HapticsType.selection);
                        if (!context.mounted) return;
                        final result = await showStartLeaseSheet(
                          context: context,
                          propertyId: propertyId,
                          lease: lease,
                        );
                        if (result != null) {
                          ref.invalidate(
                            leaseDetailProvider(propertyId, lease.id),
                          );
                        }
                      },
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _LinkRow extends StatelessWidget {
  const _LinkRow({required this.icon, required this.label, this.onTap});
  final IconData icon;
  final String? label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap == null
          ? null
          : () async {
              await Haptics.vibrate(HapticsType.selection);
              onTap!();
            },
      child: Row(
        children: [
          Icon(icon, size: 16, color: RLTokens.muted),
          const SizedBox(width: 8),
          Text(
            label ?? '—',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              fontWeight: onTap != null ? RLTokens.semibold : RLTokens.regular,
              color: onTap != null ? RLTokens.info : RLTokens.muted,
            ),
          ),
        ],
      ),
    );
  }
}

class _DateRow extends StatelessWidget {
  const _DateRow({required this.label, required this.iso});
  final String label;
  final String? iso;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(
          Icons.calendar_today_outlined,
          size: 15,
          color: RLTokens.muted,
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 11,
                color: RLTokens.muted,
              ),
            ),
            Text(
              _formatDate(iso),
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13,
                color: RLTokens.ink,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ── Inspection reports ────────────────────────────────────────────────────────

class _InspectionReportsSection extends ConsumerWidget {
  const _InspectionReportsSection({
    required this.propertyId,
    required this.leaseId,
  });
  final String propertyId;
  final String leaseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final checklistsAsync = ref.watch(
      leaseChecklistsProvider(propertyId, leaseId),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeading('Inspection Reports'),
        if (!checklistsAsync.hasValue && checklistsAsync.isLoading)
          Shimmer.fromColors(
            baseColor: RLTokens.fill,
            highlightColor: RLTokens.paper,
            child: Column(
              children: List.generate(
                2,
                (_) => Container(
                  height: 48,
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(RLTokens.rMd),
                  ),
                ),
              ),
            ),
          )
        else if (checklistsAsync.hasError && !checklistsAsync.hasValue)
          RLSectionError(
            compact: true,
            onRetry: () =>
                ref.invalidate(leaseChecklistsProvider(propertyId, leaseId)),
          )
        else
          _ChecklistList(
            propertyId: propertyId,
            leaseId: leaseId,
            checklists: checklistsAsync.value ?? const [],
          ),
      ],
    );
  }
}

class _ChecklistList extends ConsumerWidget {
  const _ChecklistList({
    required this.propertyId,
    required this.leaseId,
    required this.checklists,
  });
  final String propertyId;
  final String leaseId;
  final List<LeaseChecklistModel> checklists;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const order = ['CHECK_IN', 'ROUTINE', 'CHECK_OUT'];
    final sorted = [...checklists]
      ..sort((a, b) => order.indexOf(a.type).compareTo(order.indexOf(b.type)));
    final existingTypes = checklists.map((c) => c.type).toSet();
    final missing = order.where((t) => !existingTypes.contains(t)).toList();

    return Column(
      children: [
        if (checklists.isEmpty) ...[
          const SizedBox(height: 4),
          const Icon(
            Icons.assignment_outlined,
            size: 28,
            color: RLTokens.mutedSoft,
          ),
          const SizedBox(height: 8),
          Text(
            'No inspection reports yet.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12.5,
              color: RLTokens.muted,
            ),
          ),
          const SizedBox(height: 12),
        ],
        ...sorted.map(
          (c) => _ChecklistRow(
            propertyId: propertyId,
            leaseId: leaseId,
            checklist: c,
          ),
        ),
        if (missing.isNotEmpty) ...[
          if (checklists.isNotEmpty) const SizedBox(height: 4),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: missing.map((type) {
              return GestureDetector(
                onTap: () => _createChecklistAndOpen(
                  context,
                  ref,
                  propertyId: propertyId,
                  leaseId: leaseId,
                  type: type,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.add_rounded,
                      size: 14,
                      color: RLTokens.muted,
                    ),
                    Text(
                      leaseChecklistTypeLabel(type),
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12,
                        color: RLTokens.muted,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
        if (checklists.isEmpty) const SizedBox(height: 4),
      ],
    );
  }
}

class _ChecklistRow extends StatelessWidget {
  const _ChecklistRow({
    required this.propertyId,
    required this.leaseId,
    required this.checklist,
  });
  final String propertyId;
  final String leaseId;
  final LeaseChecklistModel checklist;

  @override
  Widget build(BuildContext context) {
    final items = checklist.items ?? const [];
    final pendingCount = items.where((i) => i.status == 'PENDING').length;
    final summary = checklist.status == 'DISPUTED'
        ? 'Tenant disputed — needs your attention'
        : items.isEmpty
        ? 'No items'
        : pendingCount > 0
        ? '$pendingCount of ${items.length} items need attention'
        : '${items.length} items';

    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (context.mounted) {
          _pushChecklistDetail(
            context,
            propertyId: propertyId,
            leaseId: leaseId,
            checklistId: checklist.id,
          );
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          border: Border.all(color: RLTokens.hairline),
          borderRadius: BorderRadius.circular(RLTokens.rMd),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.assignment_outlined,
              size: 18,
              color: RLTokens.muted,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    leaseChecklistTypeLabel(checklist.type),
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.ink,
                    ),
                  ),
                  Text(
                    summary,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 11.5,
                      color: RLTokens.muted,
                    ),
                  ),
                ],
              ),
            ),
            RLPill(
              leaseChecklistStatusLabel(checklist.status),
              tone: leaseChecklistStatusTone(checklist.status),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Shared card/field widgets (mirrors unit_detail.dart's) ────────────────────

class _SectionHeading extends StatelessWidget {
  const _SectionHeading(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          fontFamily: RLTokens.fontMono,
          fontSize: 10.5,
          fontWeight: RLTokens.medium,
          letterSpacing: 0.6,
          color: RLTokens.mutedSoft,
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.rows});
  final List<Widget> rows;

  @override
  Widget build(BuildContext context) {
    return Column(children: rows);
  }
}

class _FieldRow extends StatelessWidget {
  const _FieldRow({required this.k, required this.v, this.last = false});
  final String k;
  final String v;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: last
            ? null
            : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            k,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13,
              color: RLTokens.muted,
            ),
          ),
          Flexible(
            child: Text(
              v,
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13,
                fontWeight: RLTokens.semibold,
                color: RLTokens.ink,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LinkFieldRow extends StatelessWidget {
  const _LinkFieldRow({
    required this.k,
    required this.label,
    this.last = false,
    this.onTap,
    this.onExternalTap,
  });
  final String k;
  final String label;
  final bool last;
  final void Function(BuildContext context)? onTap;
  final VoidCallback? onExternalTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: last
            ? null
            : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            k,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13,
              color: RLTokens.muted,
            ),
          ),
          GestureDetector(
            onTap: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (!context.mounted) return;
              if (onTap != null) onTap!(context);
              onExternalTap?.call();
            },
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.open_in_new_rounded,
                  size: 13,
                  color: RLTokens.info,
                ),
                const SizedBox(width: 4),
                Text(
                  label,
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.info,
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

// ── Inline "coming soon" tab content (mirrors unit_detail.dart's) ─────────────

class _ComingSoonTab extends StatelessWidget {
  const _ComingSoonTab({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48),
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.construction_rounded,
            size: 34,
            color: RLTokens.hairline,
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 17,
              color: RLTokens.muted,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'This feature is under construction.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12.5,
              color: RLTokens.mutedSoft,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
