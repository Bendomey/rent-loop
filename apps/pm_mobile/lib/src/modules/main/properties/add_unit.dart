import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';

import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/modules/main/properties/unit_form_widgets.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/units/create_unit_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/units/units_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_blocks_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_stats_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_units_preview_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kUnitStatuses = [
  (
    value: 'Unit.Status.Draft',
    label: 'Draft',
    desc: 'Not yet visible to tenants. Use this while setting up the unit.',
  ),
  (
    value: 'Unit.Status.Available',
    label: 'Available',
    desc: 'Ready to rent. Tenants can see and book this unit.',
  ),
  (
    value: 'Unit.Status.Maintenance',
    label: 'Maintenance',
    desc:
        'Temporarily unavailable. Use when the unit is being repaired or serviced.',
  ),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class AddUnitScreen extends ConsumerStatefulWidget {
  const AddUnitScreen({super.key, required this.propertyId});
  final String propertyId;

  @override
  ConsumerState<AddUnitScreen> createState() => _AddUnitScreenState();
}

class _AddUnitScreenState extends ConsumerState<AddUnitScreen> {
  PropertyBlockModel? _block;
  String _type = 'APARTMENT';
  String _status = 'Unit.Status.Draft';
  final _nameCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  final _rentFeeCtrl = TextEditingController();
  int _maxOccupants = 1;
  String? _paymentFrequency;
  List<String> _images = [];
  bool _imagesUploading = false;
  String? _validationError;
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descriptionCtrl.dispose();
    _rentFeeCtrl.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  /// The error banner renders at the top of the scrollable form — if the
  /// user has scrolled down (e.g. filling in Billing Cycle), it fires off
  /// screen unless we scroll back up to show it.
  void _scrollToTop() {
    if (!_scrollController.hasClients) return;
    _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  Future<void> _pickBlock() async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;
    final selected = await showModalBottomSheet<PropertyBlockModel>(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
      isScrollControlled: true,
      builder: (_) => _BlockPickerSheet(
        propertyId: widget.propertyId,
        selectedId: _block?.id,
      ),
    );
    if (selected != null) setState(() => _block = selected);
  }

  Future<void> _submit(bool isLease) async {
    final block = _block;
    final name = _nameCtrl.text.trim();
    final rent = double.tryParse(_rentFeeCtrl.text.trim());
    if (block == null || name.isEmpty || rent == null || rent <= 0) {
      await Haptics.vibrate(HapticsType.error);
      setState(() => _validationError = 'Please fill in the required fields.');
      _scrollToTop();
      return;
    }
    if (_imagesUploading) {
      await Haptics.vibrate(HapticsType.error);
      setState(
        () => _validationError = 'Please wait for photos to finish uploading.',
      );
      _scrollToTop();
      return;
    }

    await Haptics.vibrate(HapticsType.medium);
    setState(() => _validationError = null);

    final description = _descriptionCtrl.text.trim();
    await ref
        .read(createUnitNotifierProvider.notifier)
        .submit(
          propertyId: widget.propertyId,
          blockId: block.id,
          name: name,
          description: description.isEmpty ? null : description,
          images: _images.isEmpty ? null : _images,
          type: _type,
          status: _status,
          rentFee: cedisToPesewas(rent),
          rentFeeCurrency: 'GHS',
          paymentFrequency:
              _paymentFrequency ?? (isLease ? 'MONTHLY' : 'DAILY'),
          maxOccupantsAllowed: _maxOccupants,
        );

    if (!mounted) return;
    final state = ref.read(createUnitNotifierProvider);
    if (state.status.isSuccess()) {
      await Haptics.vibrate(HapticsType.success);
      ref.invalidate(propertyUnitsPreviewProvider(widget.propertyId));
      ref.invalidate(propertyStatsProvider(widget.propertyId));
      ref.invalidate(propertyBlocksProvider(widget.propertyId));
      await ref
          .read(unitsNotifierProvider.notifier)
          .loadFirstPage(widget.propertyId);
      if (mounted) {
        showRLToast(ref, tone: RLToastTone.success, title: 'Unit created');
        context.pop();
      }
    } else {
      await Haptics.vibrate(HapticsType.error);
      _scrollToTop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final propertyAsync = ref.watch(propertyDetailProvider(widget.propertyId));
    final createState = ref.watch(createUnitNotifierProvider);
    final isSubmitting = createState.status.isLoading();
    final isLease = (propertyAsync.valueOrNull?.modes ?? const []).contains(
      'LEASE',
    );
    final error =
        _validationError ??
        (createState.status.isFailed() ? createState.errorMessage : null);
    final frequencyOptions = [
      'DAILY',
      if (isLease) ...['WEEKLY', 'MONTHLY'],
    ];
    final selectedFrequency =
        _paymentFrequency ?? (isLease ? 'MONTHLY' : 'DAILY');
    final isShared = _maxOccupants > 1;

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Add Unit',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: SingleChildScrollView(
              controller: _scrollController,
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Add New Property Unit',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 24,
                      color: RLTokens.ink,
                      letterSpacing: -0.4,
                      height: 1.1,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'We break down properties into units to better organize and manage rental spaces.',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      color: RLTokens.muted,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 20),
                  if (error != null) ...[
                    RLInlineBanner(
                      tone: RLBannerTone.danger,
                      title: 'Could not create unit',
                      body: error,
                      onDismiss: () {
                        setState(() => _validationError = null);
                        ref.read(createUnitNotifierProvider.notifier).reset();
                      },
                    ),
                    const SizedBox(height: 18),
                  ],

                  // ── Block ─────────────────────────────────────────
                  const UFieldLabel('Block'),
                  _BlockSelectField(block: _block, onTap: _pickBlock),
                  const SizedBox(height: 8),
                  Text(
                    'A block groups related units within a property — e.g., '
                    '"Block A" or "West Wing". If your property has only one '
                    'section, select the default Main block.',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12,
                      color: RLTokens.muted,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ── Unit type ─────────────────────────────────────
                  const USectionHeading(
                    'Unit Type',
                    'What kind of space is this unit?',
                  ),
                  const SizedBox(height: 12),
                  ...kUnitTypes.map(
                    (t) => USelectRow(
                      icon: t.icon,
                      title: t.title,
                      desc: t.desc,
                      selected: _type == t.type,
                      onTap: () async {
                        await Haptics.vibrate(HapticsType.selection);
                        setState(() => _type = t.type);
                      },
                    ),
                  ),
                  const SizedBox(height: 12),

                  // ── Status ────────────────────────────────────────
                  const USectionHeading(
                    'Status',
                    'Set the current availability of this unit.',
                  ),
                  const SizedBox(height: 12),
                  ..._kUnitStatuses.map(
                    (s) => USelectRow(
                      title: s.label,
                      desc: s.desc,
                      selected: _status == s.value,
                      onTap: () async {
                        await Haptics.vibrate(HapticsType.selection);
                        setState(() => _status = s.value);
                      },
                    ),
                  ),

                  const SizedBox(height: 24),
                  Container(height: 1, color: RLTokens.hairline),
                  const SizedBox(height: 24),

                  // ── Basic information ─────────────────────────────
                  Text(
                    'Basic Information',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 21,
                      color: RLTokens.ink,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Set the basic information of your unit',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      color: RLTokens.muted,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const UFieldLabel('Name'),
                  UTextInput(
                    controller: _nameCtrl,
                    placeholder: 'e.g. Unit 101',
                  ),
                  const SizedBox(height: 20),
                  const UFieldLabel('Unit Images', optional: true),
                  UImagePicker(
                    onImagesChanged: (urls) => setState(() => _images = urls),
                    onUploadingChanged: (uploading) =>
                        setState(() => _imagesUploading = uploading),
                  ),
                  const SizedBox(height: 20),
                  const UFieldLabel('Unit Details', optional: true),
                  TextField(
                    controller: _descriptionCtrl,
                    maxLines: 4,
                    textCapitalization: TextCapitalization.sentences,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 14.5,
                      color: RLTokens.ink,
                      height: 1.5,
                    ),
                    decoration: InputDecoration(
                      hintText:
                          'Briefly describe your property unit (e.g., size, features, or highlights)…',
                      hintStyle: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 14.5,
                        color: RLTokens.mutedSoft,
                      ),
                      filled: true,
                      fillColor: RLTokens.surface,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 13,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: RLTokens.hairline,
                          width: 1.5,
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: RLTokens.hairline,
                          width: 1.5,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: RLTokens.crimson,
                          width: 1.5,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),
                  Container(height: 1, color: RLTokens.hairline),
                  const SizedBox(height: 24),

                  // ── Rental information ────────────────────────────
                  Text(
                    'Rental Information',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 21,
                      color: RLTokens.ink,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Set the rent details for this unit',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      color: RLTokens.muted,
                    ),
                  ),
                  const SizedBox(height: 20),

                  const UFieldLabel('Occupancy'),
                  Text(
                    'Is this unit rented to one tenant, or shared among multiple tenants at once?',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12.5,
                      color: RLTokens.muted,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      UChip(
                        label: 'Single tenant',
                        selected: !isShared,
                        onTap: () => setState(() => _maxOccupants = 1),
                      ),
                      UChip(
                        label: 'Multiple tenants (shared unit)',
                        selected: isShared,
                        onTap: () => setState(
                          () => _maxOccupants = isShared ? _maxOccupants : 2,
                        ),
                      ),
                    ],
                  ),
                  if (isShared) ...[
                    const SizedBox(height: 12),
                    UOccupantsStepper(
                      value: _maxOccupants,
                      onDecrement: () =>
                          setState(() => _maxOccupants = _maxOccupants - 1),
                      onIncrement: () =>
                          setState(() => _maxOccupants = _maxOccupants + 1),
                    ),
                    const SizedBox(height: 10),
                    RLInlineBanner(
                      tone: RLBannerTone.info,
                      title:
                          'This unit can have up to $_maxOccupants occupants renting it at the same time.',
                    ),
                  ],
                  const SizedBox(height: 20),

                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 78,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const UFieldLabel('Currency'),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 14,
                              ),
                              decoration: BoxDecoration(
                                color: RLTokens.fill,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                'GHS',
                                style: TextStyle(
                                  fontFamily: RLTokens.fontSans,
                                  fontSize: 14,
                                  fontWeight: RLTokens.semibold,
                                  color: RLTokens.inkSoft,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            UFieldLabel(
                              kRentFeeLabels[selectedFrequency] ??
                                  'Price per Month',
                            ),
                            UTextInput(
                              controller: _rentFeeCtrl,
                              placeholder: 'e.g. 5000.00',
                              keyboardType:
                                  const TextInputType.numberWithOptions(
                                    decimal: true,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  const UFieldLabel('Billing Cycle'),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: frequencyOptions
                        .map(
                          (f) => UChip(
                            label: kBillingCycleLabels[f] ?? f,
                            selected: selectedFrequency == f,
                            onTap: () => setState(() => _paymentFrequency = f),
                          ),
                        )
                        .toList(),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'How the unit is rented — the price above is charged per cycle',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12,
                      color: RLTokens.muted,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ),
          UBottomActionBar(
            submitLabel: 'Create Unit',
            isSubmitting: isSubmitting,
            onCancel: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            onSubmit: () => _submit(isLease),
          ),
        ],
      ),
    );
  }
}

// ── Block select field + picker sheet ───────────────────────────────────────

class _BlockSelectField extends StatelessWidget {
  const _BlockSelectField({required this.block, required this.onTap});
  final PropertyBlockModel? block;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          border: Border.all(color: RLTokens.hairline, width: 1.5),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                block?.name ?? 'Select block…',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 15,
                  color: block != null ? RLTokens.ink : RLTokens.mutedSoft,
                ),
              ),
            ),
            const Icon(
              Icons.expand_more_rounded,
              size: 20,
              color: RLTokens.mutedSoft,
            ),
          ],
        ),
      ),
    );
  }
}

class _BlockPickerSheet extends ConsumerWidget {
  const _BlockPickerSheet({required this.propertyId, this.selectedId});
  final String propertyId;
  final String? selectedId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final blocksAsync = ref.watch(propertyBlocksProvider(propertyId));

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.7,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(RLTokens.rXl)),
        boxShadow: RLTokens.elevSheet,
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 10),
            Container(
              width: 38,
              height: 5,
              decoration: BoxDecoration(
                color: RLTokens.hairline,
                borderRadius: BorderRadius.circular(5),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
              child: Row(
                children: [
                  Text(
                    'Select block',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 21,
                      letterSpacing: -0.3,
                      color: RLTokens.ink,
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      if (context.mounted) Navigator.of(context).pop();
                    },
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: RLTokens.fill,
                        borderRadius: BorderRadius.circular(RLTokens.rSm),
                      ),
                      child: const Icon(
                        Icons.close,
                        size: 17,
                        color: RLTokens.inkSoft,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Flexible(
              child: !blocksAsync.hasValue && blocksAsync.isLoading
                  ? const Padding(
                      padding: EdgeInsets.symmetric(vertical: 40),
                      child: Center(
                        child: SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: RLTokens.crimson,
                          ),
                        ),
                      ),
                    )
                  : blocksAsync.hasError && !blocksAsync.hasValue
                  ? Padding(
                      padding: const EdgeInsets.all(20),
                      child: RLSectionError(
                        compact: true,
                        onRetry: () =>
                            ref.invalidate(propertyBlocksProvider(propertyId)),
                      ),
                    )
                  : blocksAsync.value!.rows.isEmpty
                  ? _EmptyBlocks(propertyId: propertyId)
                  : SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(14, 4, 14, 8),
                      child: Column(
                        children: blocksAsync.value!.rows.asMap().entries.map((
                          e,
                        ) {
                          final b = e.value;
                          final last =
                              e.key == blocksAsync.value!.rows.length - 1;
                          final on = b.id == selectedId;
                          return GestureDetector(
                            onTap: () async {
                              await Haptics.vibrate(HapticsType.selection);
                              if (context.mounted) Navigator.of(context).pop(b);
                            },
                            behavior: HitTestBehavior.opaque,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 13,
                              ),
                              decoration: BoxDecoration(
                                border: last
                                    ? null
                                    : const Border(
                                        bottom: BorderSide(
                                          color: RLTokens.hairlineSoft,
                                        ),
                                      ),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          b.name,
                                          style: TextStyle(
                                            fontFamily: RLTokens.fontSans,
                                            fontSize: 15,
                                            fontWeight: RLTokens.semibold,
                                            color: RLTokens.ink,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${b.unitsCount} ${b.unitsCount == 1 ? 'unit' : 'units'}',
                                          style: TextStyle(
                                            fontFamily: RLTokens.fontSans,
                                            fontSize: 12,
                                            color: RLTokens.muted,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (on)
                                    const Icon(
                                      Icons.check_circle_rounded,
                                      size: 20,
                                      color: RLTokens.crimson,
                                    ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class _EmptyBlocks extends StatelessWidget {
  const _EmptyBlocks({required this.propertyId});
  final String propertyId;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: RLTokens.fill,
              borderRadius: BorderRadius.circular(13),
            ),
            child: const Icon(
              Icons.dashboard_outlined,
              size: 22,
              color: RLTokens.mutedSoft,
            ),
          ),
          const SizedBox(height: 11),
          Text(
            'No blocks yet',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 15,
              fontWeight: RLTokens.semibold,
              color: RLTokens.ink,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            'A unit needs a block first.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12.5,
              color: RLTokens.muted,
              height: 1.45,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 14),
          GestureDetector(
            onTap: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) {
                context.push('/properties/$propertyId/blocks/add');
              }
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: RLTokens.ink,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.add_rounded, size: 14, color: Colors.white),
                  const SizedBox(width: 7),
                  Text(
                    'Add a block',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      fontWeight: RLTokens.semibold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
