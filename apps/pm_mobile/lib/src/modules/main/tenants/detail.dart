import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/lib/tenant_label.dart';
import 'package:rentloop_manager/src/lib/unit_status.dart';
import 'package:rentloop_manager/src/repository/models/tenant_model.dart';
import 'package:rentloop_manager/src/repository/providers/leases/lease_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/tenants/tenant_detail_provider.dart';
import 'package:rentloop_manager/src/shared/contact_buttons.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

String _formatDate(String? iso) {
  final date = iso == null ? null : DateTime.tryParse(iso);
  if (date == null) return '—';
  return DateFormat('d MMM yyyy').format(date.toLocal());
}

String _displayName(TenantModel t) => [
  t.firstName,
  t.otherNames,
  t.lastName,
].whereType<String>().where((v) => v.isNotEmpty).join(' ');

class TenantDetailScreen extends ConsumerWidget {
  const TenantDetailScreen({super.key, required this.id, this.propertyId});
  final String id;
  final String? propertyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pid = propertyId;
    final header = RLBackHeader(
      title: 'Tenant',
      onBack: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (context.mounted) Navigator.of(context).pop();
      },
    );

    if (pid == null || pid.isEmpty) {
      return Scaffold(
        backgroundColor: RLTokens.surface,
        body: Column(
          children: [
            header,
            const Expanded(
              child: Padding(
                padding: EdgeInsets.all(RLTokens.gutter),
                child: Align(
                  alignment: Alignment.topCenter,
                  child: Text(
                    "We couldn't open this tenant.",
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 14,
                      color: RLTokens.muted,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    final tenantAsync = ref.watch(tenantDetailProvider(pid, id));
    final tenant = tenantAsync.valueOrNull;

    final Widget body;
    if (tenant == null && tenantAsync.isLoading) {
      body = const _Skeleton();
    } else if (tenant == null) {
      body = Padding(
        padding: const EdgeInsets.all(RLTokens.gutter),
        child: RLSectionError(
          onRetry: () => ref.invalidate(tenantDetailProvider(pid, id)),
        ),
      );
    } else {
      body = RefreshIndicator(
        color: RLTokens.crimson,
        onRefresh: () async {
          final leaseId = tenant.recentLease?.id;
          if (leaseId != null) {
            ref.invalidate(leaseDetailProvider(pid, leaseId));
          }
          ref.invalidate(tenantDetailProvider(pid, id));
          try {
            await ref.read(tenantDetailProvider(pid, id).future);
          } catch (_) {}
        },
        child: _Content(propertyId: pid, tenant: tenant),
      );
    }

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          header,
          Expanded(child: body),
        ],
      ),
    );
  }
}

class _Content extends StatelessWidget {
  const _Content({required this.propertyId, required this.tenant});
  final String propertyId;
  final TenantModel tenant;

  @override
  Widget build(BuildContext context) {
    final lease = tenant.recentLease;
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(
        RLTokens.gutter,
        0,
        RLTokens.gutter,
        32,
      ),
      children: [
        _Hero(tenant: tenant),
        const SizedBox(height: 14),
        _OwesCard(propertyId: propertyId, tenant: tenant),
        if (lease != null) ...[
          RLLabel('Lease'),
          _LeaseCard(propertyId: propertyId, lease: lease),
        ],
        RLLabel('Contact'),
        _ContactCard(tenant: tenant),
      ],
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.tenant});
  final TenantModel tenant;

  @override
  Widget build(BuildContext context) {
    final name = _displayName(tenant);
    final unit = tenantUnitLabel(tenant.recentLease);
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 18, 0, 6),
      child: Column(
        children: [
          Center(child: RLAvatar(name, size: 76, crimsonTone: true)),
          const SizedBox(height: 12),
          Center(
            child: Text(
              name,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontFamily: RLTokens.fontSerif,
                fontWeight: RLTokens.headingWeight,
                fontSize: 24,
                color: RLTokens.ink,
              ),
            ),
          ),
          if (unit != null) ...[
            const SizedBox(height: 3),
            Center(
              child: Text(
                unit,
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13,
                  color: RLTokens.muted,
                ),
              ),
            ),
          ],
          const SizedBox(height: 14),
          RLContactButtons(phone: tenant.phone),
        ],
      ),
    );
  }
}

class _OwesCard extends ConsumerWidget {
  const _OwesCard({required this.propertyId, required this.tenant});
  final String propertyId;
  final TenantModel tenant;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaseId = tenant.recentLease?.id;
    if (leaseId == null) return const _StatCard.notSetUp();

    final leaseAsync = ref.watch(leaseDetailProvider(propertyId, leaseId));
    final lease = leaseAsync.valueOrNull;
    if (lease == null && leaseAsync.isLoading) return const _StatCardSkeleton();
    if (lease == null) {
      return RLCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Couldn't load what they owe.",
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13.5,
                color: RLTokens.muted,
              ),
            ),
            const SizedBox(height: 10),
            RLBtn(
              label: 'Try again',
              kind: RLBtnKind.light,
              large: false,
              onPressed: () =>
                  ref.invalidate(leaseDetailProvider(propertyId, leaseId)),
            ),
          ],
        ),
      );
    }

    final fin = lease.financialAccount;
    if (fin == null) return const _StatCard.notSetUp();

    final first = tenant.firstName;
    final owed = fin.outstandingAmount;
    String money(int v) => formatPesewas(v, code: fin.currency);
    if (owed > 0) {
      return _StatCard(
        label: '$first owes you',
        value: money(owed),
        valueColor: RLTokens.crimson,
      );
    }
    if (owed == 0) {
      return _StatCard(
        label: 'All paid up',
        value: money(0),
        valueColor: RLTokens.success,
      );
    }
    return _StatCard(
      label: 'You owe $first',
      value: money(owed.abs()),
      valueColor: RLTokens.ink,
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.valueColor,
  });
  const _StatCard.notSetUp()
    : label = 'Rent not set up yet',
      value = '—',
      valueColor = RLTokens.muted;
  final String label;
  final String value;
  final Color valueColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontWeight: RLTokens.headingWeight,
              fontSize: 24,
              color: valueColor,
              letterSpacing: -0.4,
              height: 1,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 11.5,
              color: RLTokens.muted,
            ),
          ),
        ],
      ),
    );
  }
}

class _LeaseCard extends StatelessWidget {
  const _LeaseCard({required this.propertyId, required this.lease});
  final String propertyId;
  final TenantLeaseRef lease;

  @override
  Widget build(BuildContext context) {
    final (statusText, statusColor) = switch (lease.status) {
      'Lease.Status.Active' => ('Active', RLTokens.success),
      'Lease.Status.Pending' => ('Not started', RLTokens.muted),
      'Lease.Status.Cancelled' => ('Cancelled', RLTokens.muted),
      _ => ('Ended', RLTokens.muted),
    };
    final frequency = lease.paymentFrequency;
    final rent = formatPesewas(lease.rentFee, code: lease.rentFeeCurrency);
    final leaseId = lease.id;
    final pending = lease.status == 'Lease.Status.Pending';

    return _Card(
      children: [
        _FieldRow(k: 'Status', v: statusText, vColor: statusColor),
        _FieldRow(
          k: pending ? 'Moves in' : 'Moved in',
          v: _formatDate(lease.moveInDate),
        ),
        _FieldRow(k: 'Lease ends', v: _formatDate(lease.moveOutDate)),
        _FieldRow(
          k: 'Rent',
          v: frequency == null
              ? rent
              : '$rent / ${paymentFrequencyLabel(frequency).toLowerCase()}',
          last: leaseId == null,
        ),
        if (leaseId != null)
          RLRow(
            title: 'See lease',
            last: true,
            onTap: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) {
                context.push('/more/leases/$leaseId?property_id=$propertyId');
              }
            },
          ),
      ],
    );
  }
}

class _ContactCard extends StatelessWidget {
  const _ContactCard({required this.tenant});
  final TenantModel tenant;

  @override
  Widget build(BuildContext context) {
    String? present(String? v) => v == null || v.trim().isEmpty ? null : v;
    final phone = present(tenant.phone);
    final email = present(tenant.email);
    final emergency = [
      present(tenant.emergencyContactName),
      present(tenant.emergencyContactPhone),
    ].whereType<String>();
    final hasEmergency = emergency.isNotEmpty;
    return _Card(
      children: [
        _FieldRow(
          k: 'Phone',
          v: phone ?? 'Not added',
          vColor: phone == null ? RLTokens.muted : null,
        ),
        _FieldRow(
          k: 'Email',
          v: email ?? 'Not added',
          vColor: email == null ? RLTokens.muted : null,
          last: !hasEmergency,
        ),
        if (hasEmergency)
          _FieldRow(
            k: 'Emergency contact',
            v: emergency.join(' · '),
            last: true,
          ),
      ],
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(children: children),
    );
  }
}

class _FieldRow extends StatelessWidget {
  const _FieldRow({
    required this.k,
    required this.v,
    this.vColor,
    this.last = false,
  });
  final String k;
  final String v;
  final Color? vColor;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
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
              fontSize: 13.5,
              color: RLTokens.muted,
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              v,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13.5,
                fontWeight: RLTokens.semibold,
                color: vColor ?? RLTokens.ink,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

Widget _block(double h, {double? w, double radius = RLTokens.rLg}) => Container(
  height: h,
  width: w,
  decoration: BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(radius),
  ),
);

class _StatCardSkeleton extends StatelessWidget {
  const _StatCardSkeleton();

  @override
  Widget build(BuildContext context) => Shimmer.fromColors(
    baseColor: RLTokens.fill,
    highlightColor: RLTokens.paper,
    child: _block(76),
  );
}

class _Skeleton extends StatelessWidget {
  const _Skeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: ListView(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(
          RLTokens.gutter,
          18,
          RLTokens.gutter,
          0,
        ),
        children: [
          Center(child: _block(76, w: 76, radius: 38)),
          const SizedBox(height: 12),
          Center(child: _block(24, w: 160, radius: 6)),
          const SizedBox(height: 14),
          _block(76),
          const SizedBox(height: 24),
          _block(150),
          const SizedBox(height: 24),
          _block(110),
        ],
      ),
    );
  }
}
