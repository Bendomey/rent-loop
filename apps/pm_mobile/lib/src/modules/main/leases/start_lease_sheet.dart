import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:intl/intl.dart';

import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/lib/unit_status.dart';
import 'package:rentloop_manager/src/repository/models/lease_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/leases/start_lease_notifier.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// Ports the web `StartLeaseDialog`: confirms the utility transfer date
/// before moving a Pending lease to Active. Resolves `true` if the lease was
/// activated (caller should refresh), `false`/`null` otherwise (utility date
/// saved without activating, or dismissed).
Future<bool?> showStartLeaseSheet({
  required BuildContext context,
  required String propertyId,
  required LeaseModel lease,
}) {
  return showModalBottomSheet<bool>(
    context: context,
    backgroundColor: Colors.transparent,
    barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
    isScrollControlled: true,
    builder: (_) => _StartLeaseSheet(propertyId: propertyId, lease: lease),
  );
}

class _StartLeaseSheet extends ConsumerStatefulWidget {
  const _StartLeaseSheet({required this.propertyId, required this.lease});
  final String propertyId;
  final LeaseModel lease;

  @override
  ConsumerState<_StartLeaseSheet> createState() => _StartLeaseSheetState();
}

class _StartLeaseSheetState extends ConsumerState<_StartLeaseSheet> {
  late bool _utilityDone;
  late DateTime _utilityDate;
  bool _activating = false;

  @override
  void initState() {
    super.initState();
    final existing = widget.lease.utilityTransfersDate;
    _utilityDone = existing != null;
    _utilityDate = existing != null
        ? DateTime.parse(existing).toLocal()
        : DateTime.now();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(startLeaseNotifierProvider.notifier).reset();
    });
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _utilityDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_utilityDate),
    );
    if (time == null || !mounted) return;
    setState(() {
      _utilityDate = DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      );
    });
  }

  Future<void> _save() async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() => _activating = false);
    await ref
        .read(startLeaseNotifierProvider.notifier)
        .saveUtilityTransfer(
          propertyId: widget.propertyId,
          leaseId: widget.lease.id,
          utilityTransfersDate: _utilityDate,
        );
    if (!mounted) return;
    if (ref.read(startLeaseNotifierProvider).status.isSuccess()) {
      showRLToast(
        ref,
        tone: RLToastTone.success,
        title: 'Utility transfer date saved',
      );
      Navigator.of(context).pop(false);
    }
  }

  Future<void> _activate() async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() => _activating = true);
    await ref
        .read(startLeaseNotifierProvider.notifier)
        .activate(
          propertyId: widget.propertyId,
          leaseId: widget.lease.id,
          utilityTransfersDate: _utilityDate,
        );
    if (!mounted) return;
    if (ref.read(startLeaseNotifierProvider).status.isSuccess()) {
      showRLToast(ref, tone: RLToastTone.success, title: 'Lease activated');
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(startLeaseNotifierProvider);
    final isPending = state.status.isLoading();
    final lease = widget.lease;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(RLTokens.rXl)),
        boxShadow: RLTokens.elevSheet,
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 12,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 38,
                  height: 5,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: RLTokens.hairline,
                    borderRadius: BorderRadius.circular(5),
                  ),
                ),
              ),
              Text(
                'Start Lease',
                style: TextStyle(
                  fontFamily: RLTokens.fontSerif,
                  fontSize: 20,
                  color: RLTokens.ink,
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: RLTokens.fill,
                  borderRadius: BorderRadius.circular(RLTokens.rMd),
                ),
                child: Column(
                  children: [
                    _SummaryRow(label: 'Tenant', value: lease.tenant?.fullName),
                    const SizedBox(height: 6),
                    _SummaryRow(label: 'Unit', value: lease.unit?.name),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Rent',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 13,
                            color: RLTokens.muted,
                          ),
                        ),
                        Row(
                          children: [
                            RLMoney(pesewasToCedis(lease.rentFee), size: 16),
                            Text(
                              ' / ${paymentFrequencyLabel(lease.paymentFrequency ?? '').toLowerCase()}',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 13,
                                fontWeight: RLTokens.semibold,
                                color: RLTokens.ink,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Checkbox(
                    value: _utilityDone,
                    activeColor: RLTokens.crimson,
                    onChanged: isPending
                        ? null
                        : (v) => setState(() => _utilityDone = v ?? false),
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Text(
                        'Has utility transfer been completed?',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 13.5,
                          color: RLTokens.ink,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              if (_utilityDone) ...[
                const SizedBox(height: 4),
                GestureDetector(
                  onTap: isPending ? null : _pickDate,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      border: Border.all(color: RLTokens.hairline),
                      borderRadius: BorderRadius.circular(RLTokens.rMd),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          DateFormat('d MMM y, h:mm a').format(_utilityDate),
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 13.5,
                            color: RLTokens.ink,
                          ),
                        ),
                        const Icon(
                          Icons.event_outlined,
                          size: 18,
                          color: RLTokens.muted,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              if (state.errorMessage != null) ...[
                const SizedBox(height: 14),
                RLInlineBanner(
                  tone: RLBannerTone.danger,
                  title: 'Could not start lease',
                  body: state.errorMessage,
                ),
              ],
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: RLBtn(
                      label: isPending && !_activating
                          ? 'Saving…'
                          : 'Save For Later',
                      kind: RLBtnKind.light,
                      full: true,
                      onPressed: (isPending || !_utilityDone) ? null : _save,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: RLBtn(
                      label: isPending && _activating
                          ? 'Activating…'
                          : 'Activate',
                      full: true,
                      onPressed: (isPending || !_utilityDone)
                          ? null
                          : _activate,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.value});
  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13,
            color: RLTokens.muted,
          ),
        ),
        Text(
          value ?? '—',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13,
            fontWeight: RLTokens.semibold,
            color: RLTokens.ink,
          ),
        ),
      ],
    );
  }
}
