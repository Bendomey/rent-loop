import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/repair_labels.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_form_widgets.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/create_maintenance_request_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/repair_form_options_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kAssetError = 'Pick at least one block or unit';
const _kVacantNote =
    'No tenant lives here yet, so only staff will see this repair.';
const _kMaxPhotos = 5;
const _kInternalValue = 'INTERNAL_ONLY';
const _kTenantValue = 'TENANT_VISIBLE';

String _labelFor(List<(String, String)> options, String value) {
  for (final o in options) {
    if (o.$1 == value) return o.$2;
  }
  return '';
}

class _PhotoSlot {
  final key = UniqueKey();
  String? url;
  bool blocking = false;
}

// ── Screen ────────────────────────────────────────────────────────────────────

class AddMaintenanceScreen extends ConsumerStatefulWidget {
  const AddMaintenanceScreen({super.key, this.propertyId});

  final String? propertyId;

  @override
  ConsumerState<AddMaintenanceScreen> createState() =>
      _AddMaintenanceScreenState();
}

class _AddMaintenanceScreenState extends ConsumerState<AddMaintenanceScreen> {
  final _blocks = <String>{};
  final _units = <String>{};
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _photos = [_PhotoSlot()];
  String? _pickedPropertyId;
  String _priority = '';
  String _category = '';
  String _chosenVisibility = _kTenantValue;
  String? _activePicker;
  bool _submitting = false;
  // Only raised once the manager tries to submit, so the form doesn't scold
  // them before they've had a go at it.
  bool _showErrors = false;

  int get _assetCount => _blocks.length + _units.length;

  // Selected assets always become one combined request, so anything broader
  // than a single unit has no one tenant to show it to and stays internal.
  bool get _forcedInternal => _blocks.isNotEmpty || _assetCount > 1;

  String get _forcedInternalReason => _units.isEmpty
      ? 'Block work has no tenant attached, so only staff can see this repair.'
      : 'This repair covers more than one place, so only staff can see it and no tenant is told.';

  String get _visibility =>
      _forcedInternal ? _kInternalValue : _chosenVisibility;

  bool get _photoBlocking => _photos.any((p) => p.blocking);

  String? _propertyFor(List<PropertyModel> options) {
    final picked = _pickedPropertyId;
    if (picked != null && options.any((p) => p.id == picked)) return picked;
    final scoped = widget.propertyId;
    if (scoped != null) {
      return options.any((p) => p.id == scoped) ? scoped : null;
    }
    return options.length == 1 ? options.first.id : null;
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  void _openPicker(String key) {
    Haptics.vibrate(HapticsType.selection);
    setState(() => _activePicker = key);
  }

  void _closePicker() => setState(() => _activePicker = null);

  void _pickProperty(String id, String? current) {
    setState(() {
      if (id != current) {
        _blocks.clear();
        _units.clear();
        _chosenVisibility = _kTenantValue;
        _showErrors = false;
      }
      _pickedPropertyId = id;
      _activePicker = null;
    });
    Haptics.vibrate(HapticsType.selection);
  }

  /// Blocks and units are independent selections, so the sheet stays open and
  /// each tap toggles one asset.
  void _toggleAsset(String key, String value) {
    setState(() {
      final selection = key == 'block' ? _blocks : _units;
      if (!selection.remove(value)) selection.add(value);
    });
    Haptics.vibrate(HapticsType.selection);
  }

  void _pick(String key, String value) {
    setState(() {
      switch (key) {
        case 'priority':
          _priority = value;
        case 'category':
          _category = value;
        case 'vis':
          _chosenVisibility = value;
      }
      _activePicker = null;
    });
    Haptics.vibrate(HapticsType.selection);
  }

  bool get _valid =>
      _assetCount > 0 &&
      _titleCtrl.text.trim().isNotEmpty &&
      _descCtrl.text.trim().isNotEmpty &&
      _priority.isNotEmpty &&
      _category.isNotEmpty;

  Future<void> _submit(String? propertyId) async {
    if (_submitting || _photoBlocking) return;
    if (propertyId == null || !_valid) {
      setState(() => _showErrors = true);
      await Haptics.vibrate(HapticsType.warning);
      return;
    }
    setState(() => _submitting = true);
    await Haptics.vibrate(HapticsType.medium);

    final notifier = ref.read(
      createMaintenanceRequestNotifierProvider.notifier,
    );
    await notifier.submit(
      propertyId: propertyId,
      unitIds: _units.toList(),
      blockIds: _blocks.toList(),
      title: _titleCtrl.text.trim(),
      description: _descCtrl.text.trim(),
      priority: _priority,
      category: _category,
      visibility: _visibility,
      attachments: [
        for (final p in _photos)
          if (p.url != null) p.url!,
      ],
    );
    if (!mounted) return;
    setState(() => _submitting = false);

    final result = ref.read(createMaintenanceRequestNotifierProvider);
    if (result.status == ApiStatus.success) {
      showRLToast(ref, tone: RLToastTone.success, title: 'Repair added');
      final id = result.createdId;
      if (id == null) {
        context.pop();
      } else {
        context.pushReplacement(
          '/activity/maintenances/$id',
          extra: propertyId,
        );
      }
    } else {
      showRLToast(
        ref,
        tone: RLToastTone.error,
        title: result.errorMessage ?? 'Something happened. Try again.',
      );
    }
  }

  String _assetSummary(
    Set<String> selection,
    String plural,
    String Function(String) nameOf,
  ) {
    if (selection.isEmpty) return '';
    if (selection.length == 1) return nameOf(selection.first);
    return '${selection.length} $plural selected';
  }

  @override
  Widget build(BuildContext context) {
    final optionsAsync = ref.watch(repairPropertyOptionsProvider);
    final options = optionsAsync.valueOrNull;
    final loading = !optionsAsync.hasValue && optionsAsync.isLoading;
    final noAccess = options != null && options.isEmpty;
    final propertyId = options == null ? null : _propertyFor(options);
    final assetsAsync = propertyId == null
        ? null
        : ref.watch(repairAssetOptionsProvider(propertyId));
    final assets = assetsAsync?.valueOrNull;
    final assetsLoading =
        assetsAsync != null && !assetsAsync.hasValue && assetsAsync.isLoading;
    final assetsFailed =
        assetsAsync != null && !assetsAsync.hasValue && assetsAsync.hasError;
    final blockList = assets?.blocks ?? const [];
    final unitList = assets?.units ?? const [];
    final vacantSingleUnit =
        _blocks.isEmpty &&
        _units.length == 1 &&
        unitList.any(
          (u) =>
              u.id == _units.first &&
              u.status != 'Unit.Status.Occupied' &&
              u.status != 'Unit.Status.PartiallyOccupied',
        );

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Stack(
        children: [
          Column(
            children: [
              RLBackHeader(
                title: 'New repair',
                onBack: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  if (context.mounted) Navigator.of(context).pop();
                },
              ),
              Expanded(
                child: noAccess
                    ? const Padding(
                        padding: EdgeInsets.all(28),
                        child: Text(
                          'You need manager access to a property to add a repair.',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 15,
                            color: RLTokens.muted,
                            height: 1.45,
                          ),
                        ),
                      )
                    : SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(20, 14, 20, 140),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'New repair',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSerif,
                                fontSize: 25,
                                color: RLTokens.ink,
                                letterSpacing: -0.4,
                                height: 1.1,
                              ),
                            ),
                            const SizedBox(height: 7),
                            const Text(
                              'Report something that needs fixing in a block or unit.',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 13.5,
                                color: RLTokens.muted,
                              ),
                            ),
                            const SizedBox(height: 24),
                            _FormField(
                              label: 'Property',
                              error:
                                  _showErrors && propertyId == null && !loading
                                  ? 'Pick a property'
                                  : null,
                              child: loading
                                  ? const _FieldSkeleton()
                                  : _SelectField(
                                      value:
                                          options
                                              ?.where((p) => p.id == propertyId)
                                              .firstOrNull
                                              ?.name ??
                                          '',
                                      placeholder: optionsAsync.hasError
                                          ? "Couldn't load properties"
                                          : 'Select property',
                                      onTap: () => _openPicker('property'),
                                    ),
                            ),
                            const SizedBox(height: 18),
                            _FormField(
                              label: 'Blocks',
                              required: false,
                              child: assetsLoading
                                  ? const _FieldSkeleton()
                                  : assetsFailed
                                  ? _AssetLoadError(
                                      onRetry: () => ref.invalidate(
                                        repairAssetOptionsProvider(propertyId!),
                                      ),
                                    )
                                  : _SelectField(
                                      value: _assetSummary(
                                        _blocks,
                                        'blocks',
                                        (id) =>
                                            blockList
                                                .where((b) => b.id == id)
                                                .firstOrNull
                                                ?.name ??
                                            '',
                                      ),
                                      placeholder: propertyId == null
                                          ? 'Pick a property first'
                                          : 'Select blocks',
                                      enabled: propertyId != null,
                                      hasError: _showErrors && _assetCount == 0,
                                      onTap: () => _openPicker('block'),
                                    ),
                            ),
                            if (!assetsFailed) ...[
                              const SizedBox(height: 18),
                              _FormField(
                                label: 'Units',
                                required: false,
                                child: assetsLoading
                                    ? const _FieldSkeleton()
                                    : _SelectField(
                                        value: _assetSummary(
                                          _units,
                                          'units',
                                          (id) =>
                                              unitList
                                                  .where((u) => u.id == id)
                                                  .firstOrNull
                                                  ?.name ??
                                              '',
                                        ),
                                        placeholder: propertyId == null
                                            ? 'Pick a property first'
                                            : 'Select units',
                                        enabled: propertyId != null,
                                        hasError:
                                            _showErrors && _assetCount == 0,
                                        onTap: () => _openPicker('unit'),
                                      ),
                              ),
                            ],
                            if (_showErrors && _assetCount == 0) ...[
                              const SizedBox(height: 8),
                              const _FieldError(_kAssetError),
                            ],
                            const SizedBox(height: 18),
                            _FormField(
                              label: 'Title',
                              error:
                                  _showErrors && _titleCtrl.text.trim().isEmpty
                                  ? 'Add a title'
                                  : null,
                              child: _InputField(
                                controller: _titleCtrl,
                                placeholder: 'e.g. Fix leaky faucet',
                              ),
                            ),
                            const SizedBox(height: 18),
                            _FormField(
                              label: 'Description',
                              error:
                                  _showErrors && _descCtrl.text.trim().isEmpty
                                  ? 'Add a description'
                                  : null,
                              child: _TextAreaField(
                                controller: _descCtrl,
                                placeholder: 'Describe the issue in detail…',
                              ),
                            ),
                            const SizedBox(height: 18),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: _FormField(
                                    label: 'Priority',
                                    error: _showErrors && _priority.isEmpty
                                        ? 'Pick how urgent it is'
                                        : null,
                                    child: _SelectField(
                                      value: _labelFor([
                                        for (final p in repairPriorities)
                                          (p.$1, p.$2),
                                      ], _priority),
                                      placeholder: 'Select urgency',
                                      onTap: () => _openPicker('priority'),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _FormField(
                                    label: 'Category',
                                    error: _showErrors && _category.isEmpty
                                        ? 'Pick a category'
                                        : null,
                                    child: _SelectField(
                                      value: _labelFor(
                                        repairCategories,
                                        _category,
                                      ),
                                      placeholder: 'Select category',
                                      onTap: () => _openPicker('category'),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 28),
                            const Text(
                              'Photos (optional)',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSerif,
                                fontSize: 19,
                                color: RLTokens.ink,
                                letterSpacing: -0.3,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Add photos related to the issue.',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 12.5,
                                color: RLTokens.muted,
                              ),
                            ),
                            const SizedBox(height: 14),
                            for (final slot in _photos) ...[
                              ApplicationUploadTile(
                                key: slot.key,
                                label: 'Photo',
                                objectKeyPrefix: 'maintenance-requests/',
                                optional: true,
                                onChanged: (url) => slot.url = url,
                                onBlockingChanged: (b) {
                                  if (!mounted) return;
                                  setState(() => slot.blocking = b);
                                },
                              ),
                              const SizedBox(height: 10),
                            ],
                            if (_photos.length < _kMaxPhotos)
                              RLBtn(
                                label: 'Add another photo',
                                kind: RLBtnKind.light,
                                large: false,
                                onPressed: () {
                                  Haptics.vibrate(HapticsType.selection);
                                  setState(() => _photos.add(_PhotoSlot()));
                                },
                              ),
                            const SizedBox(height: 28),
                            const Text(
                              'Visibility',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSerif,
                                fontSize: 19,
                                color: RLTokens.ink,
                                letterSpacing: -0.3,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Should the tenant see this repair in their app?',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 12.5,
                                color: RLTokens.muted,
                                height: 1.45,
                              ),
                            ),
                            const SizedBox(height: 12),
                            if (_forcedInternal)
                              Tooltip(
                                message: _forcedInternalReason,
                                triggerMode: TooltipTriggerMode.tap,
                                showDuration: const Duration(seconds: 4),
                                margin: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                ),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: RLTokens.ink,
                                  borderRadius: BorderRadius.circular(
                                    RLTokens.rSm,
                                  ),
                                ),
                                textStyle: const TextStyle(
                                  fontFamily: RLTokens.fontSans,
                                  fontSize: 12.5,
                                  color: RLTokens.surface,
                                  height: 1.4,
                                ),
                                child: _SelectField(
                                  value: _labelFor([
                                    for (final v in repairVisibilities)
                                      (v.$1, v.$2),
                                  ], _kInternalValue),
                                  placeholder: 'Select visibility',
                                  enabled: false,
                                ),
                              )
                            else
                              _SelectField(
                                value: _labelFor([
                                  for (final v in repairVisibilities)
                                    (v.$1, v.$2),
                                ], _chosenVisibility),
                                placeholder: 'Select visibility',
                                onTap: () => _openPicker('vis'),
                              ),
                            if (vacantSingleUnit) ...[
                              const SizedBox(height: 8),
                              const Text(
                                _kVacantNote,
                                style: TextStyle(
                                  fontFamily: RLTokens.fontSans,
                                  fontSize: 12.5,
                                  color: RLTokens.muted,
                                  height: 1.45,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
              ),
            ],
          ),

          if (!noAccess)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
                padding: EdgeInsets.fromLTRB(
                  20,
                  12,
                  20,
                  12 + MediaQuery.of(context).padding.bottom,
                ),
                decoration: BoxDecoration(
                  color: RLTokens.surface,
                  border: const Border(
                    top: BorderSide(color: RLTokens.hairline),
                  ),
                  boxShadow: RLTokens.elevBar,
                ),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () async {
                        await Haptics.vibrate(HapticsType.selection);
                        if (context.mounted) Navigator.of(context).pop();
                      },
                      child: const Padding(
                        padding: EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 12,
                        ),
                        child: Text(
                          'Cancel',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: RLTokens.textAction,
                            fontWeight: RLTokens.semibold,
                            color: RLTokens.ink,
                          ),
                        ),
                      ),
                    ),
                    const Spacer(),
                    if (_photoBlocking)
                      const Flexible(
                        child: Padding(
                          padding: EdgeInsets.only(right: 12),
                          child: Text(
                            'Wait for the photos to finish.',
                            textAlign: TextAlign.end,
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 12.5,
                              color: RLTokens.muted,
                            ),
                          ),
                        ),
                      ),
                    RLBtn(
                      label: 'Create repair',
                      kind: RLBtnKind.primary,
                      icon: Icons.check_rounded,
                      onPressed: _submitting || _photoBlocking
                          ? null
                          : () => _submit(propertyId),
                    ),
                  ],
                ),
              ),
            ),

          if (_activePicker == 'property' && options != null)
            _PickerSheet(
              title: 'Property',
              options: [
                for (final p in options)
                  _PickerOption(value: p.id, label: p.name),
              ],
              selected: propertyId ?? '',
              onPick: (v) => _pickProperty(v, propertyId),
              onClose: _closePicker,
            ),
          if (_activePicker == 'block')
            _PickerSheet(
              title: 'Select blocks',
              options: [
                for (final b in blockList)
                  _PickerOption(value: b.id, label: b.name),
              ],
              emptyMessage: 'No blocks in this property',
              selectedValues: _blocks,
              onPick: (v) => _toggleAsset('block', v),
              onClose: _closePicker,
            ),
          if (_activePicker == 'unit')
            _PickerSheet(
              title: 'Select units',
              options: [
                for (final u in unitList)
                  _PickerOption(
                    value: u.id,
                    label: u.name,
                    sub: u.propertyBlock?.name,
                  ),
              ],
              emptyMessage: 'No units in this property',
              selectedValues: _units,
              onPick: (v) => _toggleAsset('unit', v),
              onClose: _closePicker,
            ),
          if (_activePicker == 'priority')
            _PickerSheet(
              title: 'Priority',
              options: [
                for (final p in repairPriorities)
                  _PickerOption(
                    value: p.$1,
                    label: p.$2,
                    tone: p.$1 == 'EMERGENCY'
                        ? RLTone.danger
                        : statusTone(p.$2),
                  ),
              ],
              selected: _priority,
              onPick: (v) => _pick('priority', v),
              onClose: _closePicker,
            ),
          if (_activePicker == 'category')
            _PickerSheet(
              title: 'Category',
              options: [
                for (final c in repairCategories)
                  _PickerOption(value: c.$1, label: c.$2),
              ],
              selected: _category,
              onPick: (v) => _pick('category', v),
              onClose: _closePicker,
            ),
          if (_activePicker == 'vis')
            _PickerSheet(
              title: 'Tenant visibility',
              options: [
                for (final v in repairVisibilities)
                  _PickerOption(value: v.$1, label: v.$2, sub: v.$3),
              ],
              selected: _chosenVisibility,
              onPick: (v) => _pick('vis', v),
              onClose: _closePicker,
            ),
        ],
      ),
    );
  }
}

class _AssetLoadError extends StatelessWidget {
  const _AssetLoadError({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(
          child: Text(
            "Couldn't load blocks and units.",
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              color: RLTokens.danger,
            ),
          ),
        ),
        RLBtn(
          label: 'Try again',
          kind: RLBtnKind.light,
          large: false,
          onPressed: onRetry,
        ),
      ],
    );
  }
}

class _FieldSkeleton extends StatelessWidget {
  const _FieldSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade50,
      child: Container(
        height: 50,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(RLTokens.rMd),
        ),
      ),
    );
  }
}

// ── Form field label wrapper ──────────────────────────────────────────────────

class _FormField extends StatelessWidget {
  const _FormField({
    required this.label,
    required this.child,
    this.required = true,
    this.error,
  });
  final String label;
  final Widget child;
  final String? error;

  /// Blocks and units are each optional on their own — one of the two is
  /// required, so neither carries the asterisk.
  final bool required;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13.5,
                fontWeight: RLTokens.semibold,
                color: RLTokens.ink,
              ),
            ),
            if (required)
              const Text(
                ' *',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13.5,
                  fontWeight: RLTokens.bold,
                  color: RLTokens.crimson,
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        child,
        if (error != null) ...[const SizedBox(height: 6), _FieldError(error!)],
      ],
    );
  }
}

class _FieldError extends StatelessWidget {
  const _FieldError(this.message);
  final String message;

  @override
  Widget build(BuildContext context) => Text(
    message,
    style: const TextStyle(
      fontFamily: RLTokens.fontSans,
      fontSize: 12.5,
      color: RLTokens.danger,
    ),
  );
}

// ── Select field ──────────────────────────────────────────────────────────────

class _SelectField extends StatelessWidget {
  const _SelectField({
    required this.value,
    required this.placeholder,
    this.onTap,
    this.hasError = false,
    this.enabled = true,
  });
  final String value;
  final String placeholder;
  final VoidCallback? onTap;
  final bool hasError;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final isPlaceholder = value.isEmpty;

    return GestureDetector(
      // A null callback leaves the tap to any wrapper, so a locked field can
      // still open its tooltip.
      onTap: enabled ? onTap : null,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: enabled ? RLTokens.surface : RLTokens.fill,
          borderRadius: BorderRadius.circular(RLTokens.rMd),
          border: Border.all(
            color: hasError ? RLTokens.danger : RLTokens.hairline,
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                isPlaceholder ? placeholder : value,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 15,
                  color: isPlaceholder || !enabled
                      ? RLTokens.mutedSoft
                      : RLTokens.ink,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              enabled
                  ? Icons.keyboard_arrow_down_rounded
                  : Icons.lock_outline_rounded,
              size: enabled ? 18 : 15,
              color: RLTokens.mutedSoft,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Text input field ──────────────────────────────────────────────────────────

class _InputField extends StatelessWidget {
  const _InputField({required this.controller, required this.placeholder});
  final TextEditingController controller;
  final String placeholder;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(color: RLTokens.hairline, width: 1.5),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: TextField(
        controller: controller,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 14.5,
          color: RLTokens.ink,
        ),
        decoration: InputDecoration(
          hintText: placeholder,
          hintStyle: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14.5,
            color: RLTokens.mutedSoft,
          ),
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }
}

// ── Textarea field ────────────────────────────────────────────────────────────

class _TextAreaField extends StatelessWidget {
  const _TextAreaField({required this.controller, required this.placeholder});
  final TextEditingController controller;
  final String placeholder;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(color: RLTokens.hairline, width: 1.5),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: TextField(
        controller: controller,
        maxLines: null,
        minLines: 5,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 14.5,
          color: RLTokens.ink,
          height: 1.5,
        ),
        decoration: InputDecoration(
          hintText: placeholder,
          hintStyle: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14.5,
            color: RLTokens.mutedSoft,
          ),
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 13),
        ),
      ),
    );
  }
}

// ── Picker option model ───────────────────────────────────────────────────────

class _PickerOption {
  const _PickerOption({
    required this.value,
    required this.label,
    this.tone,
    this.sub,
  });
  final String value;
  final String label;
  final RLTone? tone;
  final String? sub;
}

// ── Picker sheet ──────────────────────────────────────────────────────────────

class _PickerSheet extends StatelessWidget {
  const _PickerSheet({
    required this.title,
    required this.options,
    required this.onPick,
    required this.onClose,
    this.emptyMessage,
    this.selected = '',
    this.selectedValues,
  });

  final String title;
  final List<_PickerOption> options;
  final ValueChanged<String> onPick;
  final VoidCallback onClose;
  final String? emptyMessage;

  /// Single-select sheets track one value…
  final String selected;

  /// …while multi-select sheets stay open and toggle each tapped value.
  final Set<String>? selectedValues;

  bool _isSelected(String value) =>
      selectedValues?.contains(value) ?? selected == value;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onClose,
      child: Container(
        color: const Color.fromRGBO(17, 17, 16, 0.38),
        child: Align(
          alignment: Alignment.bottomCenter,
          child: GestureDetector(
            onTap: () {}, // prevent tap-through
            child: Container(
              decoration: const BoxDecoration(
                color: RLTokens.surface,
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(RLTokens.rXl),
                ),
                boxShadow: RLTokens.elevSheet,
              ),
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.8,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Drag handle
                  const SizedBox(height: 10),
                  Container(
                    width: 38,
                    height: 5,
                    decoration: BoxDecoration(
                      color: RLTokens.hairline,
                      borderRadius: BorderRadius.circular(5),
                    ),
                  ),
                  // Sheet header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 10, 14, 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSerif,
                              fontSize: 20,
                              color: RLTokens.ink,
                              letterSpacing: -0.3,
                            ),
                          ),
                        ),
                        RLIconBtn(
                          // Multi-select sheets stay open while toggling, so
                          // this button reads as "done" rather than "cancel".
                          icon: selectedValues == null
                              ? Icons.close
                              : Icons.check_rounded,
                          bg: RLTokens.fill,
                          iconColor: RLTokens.inkSoft,
                          onTap: onClose,
                        ),
                      ],
                    ),
                  ),
                  // Options list
                  Flexible(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(14, 4, 14, 30),
                      child: Column(
                        children: [
                          if (options.isEmpty && emptyMessage != null)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 24),
                              child: Text(
                                emptyMessage!,
                                style: const TextStyle(
                                  fontFamily: RLTokens.fontSans,
                                  fontSize: 14,
                                  color: RLTokens.muted,
                                ),
                              ),
                            ),
                          ...options.asMap().entries.map((e) {
                            final i = e.key;
                            final o = e.value;
                            final isLast = i == options.length - 1;
                            final isSelected = _isSelected(o.value);
                            return GestureDetector(
                              onTap: () => onPick(o.value),
                              behavior: HitTestBehavior.opaque,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 13,
                                  horizontal: 8,
                                ),
                                decoration: BoxDecoration(
                                  border: isLast
                                      ? null
                                      : const Border(
                                          bottom: BorderSide(
                                            color: RLTokens.hairlineSoft,
                                          ),
                                        ),
                                ),
                                child: Row(
                                  children: [
                                    if (o.tone != null) ...[
                                      RLDot(tone: o.tone!, size: 9),
                                      const SizedBox(width: 12),
                                    ],
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            o.label,
                                            style: TextStyle(
                                              fontFamily: RLTokens.fontSans,
                                              fontSize: 15,
                                              fontWeight: isSelected
                                                  ? RLTokens.bold
                                                  : RLTokens.medium,
                                              color: RLTokens.ink,
                                            ),
                                          ),
                                          if (o.sub != null) ...[
                                            const SizedBox(height: 2),
                                            Text(
                                              o.sub!,
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
                                    if (isSelected)
                                      const Icon(
                                        Icons.check_rounded,
                                        size: 18,
                                        color: RLTokens.crimson,
                                      ),
                                  ],
                                ),
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
