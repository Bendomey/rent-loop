import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/lib/money.dart';
import 'package:rentloop_go/src/lib/payment_frequency.dart';
import 'package:rentloop_go/src/repository/providers/tenant_application_provider.dart';

class TenantApplicationDetailsScreen extends ConsumerWidget {
  final String applicationId;

  const TenantApplicationDetailsScreen({
    super.key,
    required this.applicationId,
  });

  String _formatDate(String iso) {
    try {
      return DateFormat('MMM d, yyyy').format(DateTime.parse(iso).toLocal());
    } catch (_) {
      return iso;
    }
  }

  (Color, Color) _statusColors(String status) {
    final s = status.toLowerCase();
    if (s.contains('completed')) {
      return (Colors.green.shade50, Colors.green.shade700);
    }
    if (s.contains('cancelled')) {
      return (Colors.red.shade50, Colors.red.shade700);
    }
    return (Colors.orange.shade50, Colors.orange.shade700);
  }

  String _statusLabel(String status) {
    if (status.contains('.')) return status.split('.').last;
    return status;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appAsync = ref.watch(tenantApplicationProvider(applicationId));

    return Scaffold(
      appBar: AppBar(title: const Text('Application')),
      body: Builder(
        builder: (context) {
          if (!appAsync.hasValue && appAsync.isLoading) {
            return const _ApplicationSkeleton();
          }

          if (appAsync.hasError && !appAsync.hasValue) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 48,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Failed to load application',
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () => ref.invalidate(
                        tenantApplicationProvider(applicationId),
                      ),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }

          final app = appAsync.value!;
          final (statusBg, statusText) = _statusColors(app.status);
          return RefreshIndicator(
            onRefresh: () =>
                ref.refresh(tenantApplicationProvider(applicationId).future),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              app.code,
                              style: Theme.of(context).textTheme.titleLarge
                                  ?.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: statusText,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Application Code',
                              style: TextStyle(
                                fontSize: 12,
                                color: statusText.withValues(alpha: 0.7),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: statusText.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          _statusLabel(app.status),
                          style: TextStyle(
                            color: statusText,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                _SectionCard(
                  title: 'Financials',
                  children: [
                    _DetailRow(
                      icon: Icons.payments_outlined,
                      label: 'Agreed Rent',
                      value: MoneyLib.formatPesewas(app.rentFee),
                    ),
                    if (app.paymentFrequency != null)
                      _DetailRow(
                        icon: Icons.repeat,
                        label: 'Payment Frequency',
                        value: getPaymentFrequencyLabel(app.paymentFrequency!),
                      ),
                    if (app.initialDepositFee != null)
                      _DetailRow(
                        icon: Icons.account_balance_wallet_outlined,
                        label: 'Initial Deposit',
                        value: MoneyLib.formatPesewas(app.initialDepositFee!),
                      ),
                    if (app.securityDepositFee != null)
                      _DetailRow(
                        icon: Icons.security_outlined,
                        label: 'Security Deposit',
                        value: MoneyLib.formatPesewas(app.securityDepositFee!),
                      ),
                  ],
                ),

                const SizedBox(height: 12),

                _SectionCard(
                  title: 'Terms',
                  children: [
                    if (app.desiredMoveInDate != null)
                      _DetailRow(
                        icon: Icons.door_front_door_outlined,
                        label: 'Desired Move-in',
                        value: _formatDate(app.desiredMoveInDate!),
                      ),
                    if (app.stayDuration != null)
                      _DetailRow(
                        icon: Icons.timelapse,
                        label: 'Stay Duration',
                        value:
                            '${app.stayDuration} ${app.stayDurationFrequency != null ? getPaymentFrequencyPeriodLabel(app.stayDurationFrequency!, count: app.stayDuration!) : ''}',
                      ),
                    if (app.leaseAgreementDocumentStatus != null)
                      _DetailRow(
                        icon: Icons.description_outlined,
                        label: 'Agreement Status',
                        value: app.leaseAgreementDocumentStatus!,
                      ),
                  ],
                ),

                const SizedBox(height: 12),

                _SectionCard(
                  title: 'Timeline',
                  children: [
                    if (app.createdAt != null)
                      _DetailRow(
                        icon: Icons.calendar_today_outlined,
                        label: 'Submitted',
                        value: _formatDate(app.createdAt!),
                      ),
                    if (app.completedAt != null)
                      _DetailRow(
                        icon: Icons.check_circle_outline,
                        label: 'Completed',
                        value: _formatDate(app.completedAt!),
                      ),
                    if (app.cancelledAt != null)
                      _DetailRow(
                        icon: Icons.cancel_outlined,
                        label: 'Cancelled',
                        value: _formatDate(app.cancelledAt!),
                      ),
                  ],
                ),

                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _ApplicationSkeleton extends StatelessWidget {
  const _ApplicationSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade50,
      child: ListView(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: [
          // Header card
          Container(
            height: 80,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          const SizedBox(height: 16),
          _skeletonSection(rows: 4),
          const SizedBox(height: 12),
          _skeletonSection(rows: 3),
          const SizedBox(height: 12),
          _skeletonSection(rows: 3),
        ],
      ),
    );
  }

  Widget _skeletonSection({required int rows}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          height: 14,
          width: 80,
          margin: const EdgeInsets.only(left: 4, bottom: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: List.generate(rows, (i) {
              return Column(
                children: [
                  if (i > 0) Divider(height: 0, color: Colors.grey.shade100),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 18,
                          height: 18,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Container(
                            height: 14,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                        const SizedBox(width: 40),
                        Container(
                          height: 14,
                          width: 60,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            }),
          ),
        ),
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _SectionCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    final visible = children.where((c) => c is! SizedBox).toList();
    if (visible.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade100),
          ),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: EdgeInsets.zero,
            itemCount: children.length,
            separatorBuilder: (_, __) =>
                Divider(height: 0, color: Colors.grey.shade100),
            itemBuilder: (_, i) => children[i],
          ),
        ),
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey.shade500),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600),
            ),
          ),
          const SizedBox(width: 16),
          _FadingScrollValue(
            value: value,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _FadingScrollValue extends StatefulWidget {
  final String value;
  final TextStyle? style;

  const _FadingScrollValue({required this.value, this.style});

  @override
  State<_FadingScrollValue> createState() => _FadingScrollValueState();
}

class _FadingScrollValueState extends State<_FadingScrollValue> {
  late final ScrollController _ctrl;
  bool _fadeLeft = false;
  bool _fadeRight = false;

  @override
  void initState() {
    super.initState();
    _ctrl = ScrollController();
    _ctrl.addListener(_update);
    WidgetsBinding.instance.addPostFrameCallback((_) => _update());
  }

  void _update() {
    if (!_ctrl.hasClients) return;
    final max = _ctrl.position.maxScrollExtent;
    final pos = _ctrl.offset;
    setState(() {
      // reverse: true — offset 0 = right end of content
      _fadeLeft = pos < max; // overflow to the left
      _fadeRight = pos > 0; // user scrolled, content to the right
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 180),
      child: Stack(
        children: [
          SingleChildScrollView(
            controller: _ctrl,
            scrollDirection: Axis.horizontal,
            reverse: true,
            child: Text(widget.value, maxLines: 1, style: widget.style),
          ),
          if (_fadeLeft)
            Positioned(
              left: 0,
              top: 0,
              bottom: 0,
              child: IgnorePointer(
                child: Container(
                  width: 24,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerRight,
                      end: Alignment.centerLeft,
                      colors: [Colors.white.withValues(alpha: 0), Colors.white],
                    ),
                  ),
                ),
              ),
            ),
          if (_fadeRight)
            Positioned(
              right: 0,
              top: 0,
              bottom: 0,
              child: IgnorePointer(
                child: Container(
                  width: 24,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                      colors: [Colors.white.withValues(alpha: 0), Colors.white],
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
