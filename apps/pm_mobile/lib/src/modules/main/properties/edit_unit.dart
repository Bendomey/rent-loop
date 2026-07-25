import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';

import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/modules/main/properties/unit_form_widgets.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/units/update_unit_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/units/units_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_units_preview_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/unit_detail_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kOccupiedStatuses = {
  'Unit.Status.Occupied',
  'Unit.Status.PartiallyOccupied',
};

// ── Screen ────────────────────────────────────────────────────────────────────

class EditUnitScreen extends ConsumerStatefulWidget {
  const EditUnitScreen({
    super.key,
    required this.propertyId,
    required this.unitId,
  });
  final String propertyId;
  final String unitId;

  @override
  ConsumerState<EditUnitScreen> createState() => _EditUnitScreenState();
}

class _EditUnitScreenState extends ConsumerState<EditUnitScreen> {
  bool _prefilled = false;
  String _type = 'APARTMENT';
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

  void _prefill(UnitModel unit) {
    _type = unit.type;
    _nameCtrl.text = unit.name;
    _descriptionCtrl.text = unit.description ?? '';
    _rentFeeCtrl.text = pesewasToCedis(unit.rentFee).toString();
    _maxOccupants = unit.maxOccupantsAllowed ?? 1;
    _paymentFrequency = unit.paymentFrequency;
    _images = unit.images ?? [];
    _prefilled = true;
  }

  Future<void> _submit(bool isRentalInfoEditable) async {
    final name = _nameCtrl.text.trim();
    final rent = double.tryParse(_rentFeeCtrl.text.trim());
    if (name.isEmpty || (isRentalInfoEditable && (rent == null || rent <= 0))) {
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
        .read(updateUnitNotifierProvider.notifier)
        .submit(
          propertyId: widget.propertyId,
          unitId: widget.unitId,
          name: name,
          description: description,
          images: _images,
          type: _type,
          rentFee: isRentalInfoEditable ? cedisToPesewas(rent!) : null,
          rentFeeCurrency: isRentalInfoEditable ? 'GHS' : null,
          paymentFrequency: isRentalInfoEditable ? _paymentFrequency : null,
          maxOccupantsAllowed: isRentalInfoEditable ? _maxOccupants : null,
        );

    if (!mounted) return;
    final state = ref.read(updateUnitNotifierProvider);
    if (state.status.isSuccess()) {
      await Haptics.vibrate(HapticsType.success);
      ref.invalidate(unitDetailProvider(widget.propertyId, widget.unitId));
      ref.invalidate(propertyUnitsPreviewProvider(widget.propertyId));
      await ref
          .read(unitsNotifierProvider.notifier)
          .loadFirstPage(widget.propertyId);
      if (mounted) {
        showRLToast(ref, tone: RLToastTone.success, title: 'Unit updated');
        context.pop();
      }
    } else {
      await Haptics.vibrate(HapticsType.error);
      _scrollToTop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final unitAsync = ref.watch(
      unitDetailProvider(widget.propertyId, widget.unitId),
    );
    final propertyAsync = ref.watch(propertyDetailProvider(widget.propertyId));
    final updateState = ref.watch(updateUnitNotifierProvider);
    final isSubmitting = updateState.status.isLoading();

    if (!unitAsync.hasValue && unitAsync.isLoading) {
      return Scaffold(
        backgroundColor: RLTokens.surface,
        body: Column(
          children: [
            const RLBackHeader(title: 'Edit Unit'),
            const Expanded(
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
            ),
          ],
        ),
      );
    }
    if (unitAsync.hasError && !unitAsync.hasValue) {
      return Scaffold(
        backgroundColor: RLTokens.surface,
        body: Column(
          children: [
            const RLBackHeader(title: 'Edit Unit'),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(RLTokens.gutter),
                child: RLSectionError(
                  onRetry: () => ref.invalidate(
                    unitDetailProvider(widget.propertyId, widget.unitId),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    final unit = unitAsync.value!;
    if (!_prefilled) _prefill(unit);

    final isLease = (propertyAsync.valueOrNull?.modes ?? const []).contains(
      'LEASE',
    );
    final isRentalInfoEditable = !_kOccupiedStatuses.contains(unit.status);
    final error =
        _validationError ??
        (updateState.status.isFailed() ? updateState.errorMessage : null);
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
            title: 'Edit Unit',
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
                    unit.name,
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
                    'Update the details for this property unit.',
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
                      title: 'Could not update unit',
                      body: error,
                      onDismiss: () {
                        setState(() => _validationError = null);
                        ref.read(updateUnitNotifierProvider.notifier).reset();
                      },
                    ),
                    const SizedBox(height: 18),
                  ],

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
                    initialImages: unit.images ?? const [],
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

                  if (!isRentalInfoEditable)
                    RLInlineBanner(
                      tone: RLBannerTone.info,
                      title: 'Rental information can\'t be edited',
                      body:
                          'This unit is currently occupied. Rent, billing cycle, '
                          'and occupancy can only be changed once the unit is vacated.',
                    )
                  else ...[
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
                              onTap: () =>
                                  setState(() => _paymentFrequency = f),
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
                ],
              ),
            ),
          ),
          UBottomActionBar(
            submitLabel: 'Save Changes',
            isSubmitting: isSubmitting,
            onCancel: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            onSubmit: () => _submit(isRentalInfoEditable),
          ),
        ],
      ),
    );
  }
}
