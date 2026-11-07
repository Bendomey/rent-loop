import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/announcement_labels.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/announcements/post_announcement_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/block_options_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/options_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/property_options_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/unit_options_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';
import 'package:rentloop_manager/src/shared/paged_picker_sheet.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kTitleMax = 60;
const _kContentMax = 2000;
const _kSmsNote =
    'Tenants get this by SMS and in their app. Only tenants who have moved in receive it.';

enum _Audience {
  property('Whole property'),
  block('One block'),
  units('Some units');

  const _Audience(this.label);
  final String label;
}

String _labelFor(List<(String, String)> options, String value) {
  for (final o in options) {
    if (o.$1 == value) return o.$2;
  }
  return '';
}

class AddAnnouncementScreen extends ConsumerStatefulWidget {
  const AddAnnouncementScreen({super.key, this.propertyId});

  final String? propertyId;

  @override
  ConsumerState<AddAnnouncementScreen> createState() =>
      _AddAnnouncementScreenState();
}

class _AddAnnouncementScreenState extends ConsumerState<AddAnnouncementScreen> {
  final _titleCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();
  final _units = <String, UnitModel>{};
  PropertyModel? _pickedProperty;
  PropertyModel? _soleProperty;
  bool _soleDecided = false;
  PropertyBlockModel? _block;
  String _type = '';
  String _priority = 'NORMAL';
  _Audience _audience = _Audience.property;
  String? _activePicker;
  bool _posting = false;
  bool _showErrors = false;

  PropertyModel? _propertyFor(OptionsState<PropertyModel> options) {
    final picked = _pickedProperty;
    if (picked != null) return picked;
    final scoped = widget.propertyId;
    if (scoped != null) {
      final listed = options.items.where((p) => p.id == scoped).firstOrNull;
      if (listed != null) return listed;
      final roles = ref.watch(myPropertyRolesProvider).valueOrNull;
      if (roles?[scoped] != 'MANAGER') return null;
      return ref.watch(propertyDetailProvider(scoped)).valueOrNull;
    }
    if (!_soleDecided &&
        options.hasLoaded &&
        !options.isLoading &&
        options.error == null &&
        options.search.isEmpty) {
      _soleDecided = true;
      if (options.items.length == 1 && !options.hasNextPage) {
        _soleProperty = options.items.first;
      }
    }
    return _soleProperty;
  }

  @override
  void initState() {
    super.initState();
    _titleCtrl.addListener(_refresh);
    _contentCtrl.addListener(_refresh);
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _contentCtrl.dispose();
    super.dispose();
  }

  void _refresh() => setState(() {});

  void _openPicker(String key) {
    Haptics.vibrate(HapticsType.selection);
    setState(() => _activePicker = key);
  }

  Future<void> _leave({required bool hasDraft}) async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;
    if (!hasDraft) {
      Navigator.of(context).pop();
      return;
    }
    showRLSheet(
      context,
      (close) => RLSheet(
        title: 'Leave without sending?',
        desc: "It's saved as a draft. You can send it later from the web.",
        onClose: close,
        footer: Row(
          children: [
            Expanded(
              child: RLBtn(
                label: 'Stay',
                kind: RLBtnKind.light,
                full: true,
                onPressed: close,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: RLBtn(
                label: 'Leave',
                kind: RLBtnKind.primary,
                full: true,
                onPressed: () {
                  close();
                  Navigator.of(context).pop();
                },
              ),
            ),
          ],
        ),
        child: const SizedBox.shrink(),
      ),
    );
  }

  void _closePicker() => setState(() => _activePicker = null);

  Future<void> _pickProperty(PropertyModel? current) async {
    Haptics.vibrate(HapticsType.selection);
    final options = propertyOptionsNotifierProvider(managerOnly: true);
    final picked = await showPagedPickerSheet<PropertyModel>(
      context: context,
      title: 'Property',
      state: options,
      onSearch: (v) => ref.read(options.notifier).setSearch(v),
      onLoadMore: () => ref.read(options.notifier).loadNextPage(),
      onRetry: () => ref.read(options.notifier).refresh(),
      label: (p) => p.name,
      id: (p) => p.id,
      initial: [?current],
      emptyText: 'No properties found',
    );
    if (mounted) ref.read(options.notifier).setSearch('');
    if (picked == null || picked.isEmpty || !mounted) return;
    final property = picked.first;
    setState(() {
      if (property.id != current?.id) {
        _block = null;
        _units.clear();
        _showErrors = false;
      }
      _pickedProperty = property;
    });
  }

  Future<void> _pickBlock(String propertyId) async {
    Haptics.vibrate(HapticsType.selection);
    final options = blockOptionsNotifierProvider(propertyId);
    final picked = await showPagedPickerSheet<PropertyBlockModel>(
      context: context,
      title: 'Select block',
      state: options,
      onSearch: (v) => ref.read(options.notifier).setSearch(v),
      onLoadMore: () => ref.read(options.notifier).loadNextPage(),
      onRetry: () => ref.read(options.notifier).refresh(),
      label: (b) => b.name,
      id: (b) => b.id,
      initial: [?_block],
      emptyText: 'No blocks in this property',
    );
    if (picked == null || picked.isEmpty || !mounted) return;
    setState(() => _block = picked.first);
  }

  Future<void> _pickUnits(String propertyId) async {
    Haptics.vibrate(HapticsType.selection);
    final options = unitOptionsNotifierProvider(
      UnitOptionsQuery(propertyIds: [propertyId]),
    );
    final picked = await showPagedPickerSheet<UnitModel>(
      context: context,
      title: 'Select units',
      state: options,
      onSearch: (v) => ref.read(options.notifier).setSearch(v),
      onLoadMore: () => ref.read(options.notifier).loadNextPage(),
      onRetry: () => ref.read(options.notifier).refresh(),
      label: (u) => u.name,
      sub: (u) => u.propertyBlock?.name ?? '',
      id: (u) => u.id,
      multi: true,
      initial: _units.values.toList(),
      emptyText: 'No units in this property',
    );
    if (picked == null || !mounted) return;
    setState(() {
      _units
        ..clear()
        ..addEntries([for (final u in picked) MapEntry(u.id, u)]);
    });
  }

  void _pick(String key, String value) {
    setState(() {
      switch (key) {
        case 'type':
          _type = value;
        case 'priority':
          _priority = value;
      }
      _activePicker = null;
    });
    Haptics.vibrate(HapticsType.selection);
  }

  bool get _valid =>
      _titleCtrl.text.trim().isNotEmpty &&
      _contentCtrl.text.trim().isNotEmpty &&
      _type.isNotEmpty &&
      switch (_audience) {
        _Audience.property => true,
        _Audience.block => _block != null,
        _Audience.units => _units.isNotEmpty,
      };

  Future<void> _submit(String? propertyId) async {
    if (_posting) return;
    if (propertyId == null || !_valid) {
      setState(() => _showErrors = true);
      await Haptics.vibrate(HapticsType.warning);
      return;
    }
    setState(() => _posting = true);
    await Haptics.vibrate(HapticsType.medium);

    await ref
        .read(postAnnouncementNotifierProvider.notifier)
        .post(
          propertyId: propertyId,
          title: _titleCtrl.text.trim(),
          content: _contentCtrl.text.trim(),
          type: _type,
          priority: _priority,
          propertyBlockId: _audience == _Audience.block ? _block?.id : null,
          targetUnitIds: _audience == _Audience.units
              ? _units.keys.toList()
              : null,
        );
    if (!mounted) return;
    setState(() => _posting = false);

    final result = ref.read(postAnnouncementNotifierProvider);
    if (result.sent) {
      showRLToast(ref, tone: RLToastTone.success, title: 'Announcement sent');
      context.pop();
    } else if (result.draftId == null) {
      showRLToast(
        ref,
        tone: RLToastTone.error,
        title: result.errorMessage ?? 'Something happened. Try again.',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final post = ref.watch(postAnnouncementNotifierProvider);
    final locked = post.draftId != null;
    final options = ref.watch(
      propertyOptionsNotifierProvider(managerOnly: true),
    );
    final loading = !options.hasLoaded;
    final noAccess =
        options.hasLoaded &&
        options.items.isEmpty &&
        !options.hasNextPage &&
        options.error == null &&
        options.search.isEmpty;
    final property = _propertyFor(options);
    final propertyId = locked && post.propertyId != null
        ? post.propertyId
        : property?.id;
    final optionsFailed =
        options.hasLoaded && options.error != null && options.items.isEmpty;

    final unitSummary = _units.isEmpty
        ? ''
        : _units.length == 1
        ? _units.values.first.name
        : '${_units.length} units selected';

    return PopScope(
      canPop: !locked,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _leave(hasDraft: true);
      },
      child: Scaffold(
        backgroundColor: RLTokens.surface,
        body: Stack(
          children: [
            Column(
              children: [
                RLBackHeader(
                  title: 'New announcement',
                  onBack: () => _leave(hasDraft: locked),
                ),
                Expanded(
                  child: noAccess
                      ? const Padding(
                          padding: EdgeInsets.all(28),
                          child: Text(
                            'You need manager access to a property to post an announcement.',
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
                          child: IgnorePointer(
                            ignoring: locked,
                            child: Opacity(
                              opacity: locked ? 0.55 : 1,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'New announcement',
                                    style: TextStyle(
                                      fontFamily: RLTokens.fontSerif,
                                      fontWeight: RLTokens.headingWeight,
                                      fontSize: 25,
                                      color: RLTokens.ink,
                                      letterSpacing: -0.4,
                                      height: 1.1,
                                    ),
                                  ),
                                  const SizedBox(height: 22),
                                  _FormField(
                                    label: 'Property',
                                    error:
                                        _showErrors &&
                                            propertyId == null &&
                                            !loading
                                        ? 'Pick a property'
                                        : null,
                                    child: loading
                                        ? const _FieldSkeleton()
                                        : optionsFailed
                                        ? _LoadError(
                                            message:
                                                "Couldn't load your properties.",
                                            onRetry: () => ref
                                                .read(
                                                  propertyOptionsNotifierProvider(
                                                    managerOnly: true,
                                                  ).notifier,
                                                )
                                                .refresh(),
                                          )
                                        : _SelectField(
                                            value: property?.name ?? '',
                                            placeholder: 'Select property',
                                            onTap: () =>
                                                _pickProperty(property),
                                          ),
                                  ),
                                  const SizedBox(height: 18),
                                  _FormField(
                                    label: 'Title',
                                    error:
                                        _showErrors &&
                                            _titleCtrl.text.trim().isEmpty
                                        ? 'Add a title'
                                        : null,
                                    child: _TextBox(
                                      controller: _titleCtrl,
                                      placeholder: 'Announcement title',
                                      maxLength: _kTitleMax,
                                      enabled: !locked,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  _Counter(
                                    _titleCtrl.text.characters.length,
                                    _kTitleMax,
                                  ),
                                  const SizedBox(height: 12),
                                  _FormField(
                                    label: 'Message',
                                    error:
                                        _showErrors &&
                                            _contentCtrl.text.trim().isEmpty
                                        ? 'Write a message'
                                        : null,
                                    child: _TextBox(
                                      controller: _contentCtrl,
                                      placeholder: 'Write your announcement…',
                                      maxLength: _kContentMax,
                                      multiline: true,
                                      enabled: !locked,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  _Counter(
                                    _contentCtrl.text.characters.length,
                                    _kContentMax,
                                  ),
                                  const SizedBox(height: 18),
                                  Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Expanded(
                                        child: _FormField(
                                          label: 'Type',
                                          error: _showErrors && _type.isEmpty
                                              ? 'Pick a type'
                                              : null,
                                          child: _SelectField(
                                            value: _labelFor(
                                              announcementTypes,
                                              _type,
                                            ),
                                            placeholder: 'Select type',
                                            onTap: () => _openPicker('type'),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: _FormField(
                                          label: 'Priority',
                                          child: _SelectField(
                                            value: _labelFor(
                                              announcementPriorities,
                                              _priority,
                                            ),
                                            placeholder: 'Select priority',
                                            onTap: () =>
                                                _openPicker('priority'),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 26),
                                  const Text(
                                    'Who should get it?',
                                    style: TextStyle(
                                      fontFamily: RLTokens.fontSerif,
                                      fontWeight: RLTokens.headingWeight,
                                      fontSize: 19,
                                      color: RLTokens.ink,
                                      letterSpacing: -0.3,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      for (final a in _Audience.values) ...[
                                        Expanded(
                                          child: _AudienceChip(
                                            label: a.label,
                                            selected: _audience == a,
                                            onTap: () {
                                              Haptics.vibrate(
                                                HapticsType.selection,
                                              );
                                              setState(() => _audience = a);
                                            },
                                          ),
                                        ),
                                        if (a != _Audience.values.last)
                                          const SizedBox(width: 8),
                                      ],
                                    ],
                                  ),
                                  if (_audience != _Audience.property) ...[
                                    const SizedBox(height: 14),
                                    if (_audience == _Audience.block)
                                      _FormField(
                                        label: 'Block',
                                        error: _showErrors && _block == null
                                            ? 'Pick a block'
                                            : null,
                                        child: _SelectField(
                                          value: _block?.name ?? '',
                                          placeholder: propertyId == null
                                              ? 'Pick a property first'
                                              : 'Select block',
                                          enabled: propertyId != null,
                                          onTap: () => _pickBlock(propertyId!),
                                        ),
                                      )
                                    else
                                      _FormField(
                                        label: 'Units',
                                        error: _showErrors && _units.isEmpty
                                            ? 'Pick at least one unit'
                                            : null,
                                        child: _SelectField(
                                          value: unitSummary,
                                          placeholder: propertyId == null
                                              ? 'Pick a property first'
                                              : 'Select units',
                                          enabled: propertyId != null,
                                          onTap: () => _pickUnits(propertyId!),
                                        ),
                                      ),
                                  ],
                                  const SizedBox(height: 18),
                                  const Text(
                                    _kSmsNote,
                                    style: TextStyle(
                                      fontFamily: RLTokens.fontSans,
                                      fontSize: 12.5,
                                      color: RLTokens.muted,
                                      height: 1.45,
                                    ),
                                  ),
                                ],
                              ),
                            ),
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
                        onTap: () => _leave(hasDraft: locked),
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
                      if (locked)
                        const Flexible(
                          child: Padding(
                            padding: EdgeInsets.only(right: 12),
                            child: Text(
                              'Saved, but not sent yet.',
                              textAlign: TextAlign.end,
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 12.5,
                                color: RLTokens.danger,
                              ),
                            ),
                          ),
                        ),
                      RLBtn(
                        label: locked ? 'Send now' : 'Post now',
                        kind: RLBtnKind.primary,
                        icon: Icons.send_rounded,
                        onPressed: _posting ? null : () => _submit(propertyId),
                      ),
                    ],
                  ),
                ),
              ),

            if (_activePicker == 'type')
              _PickerSheet(
                title: 'Type',
                options: [
                  for (final t in announcementTypes)
                    _PickerOption(value: t.$1, label: t.$2),
                ],
                selected: _type,
                onPick: (v) => _pick('type', v),
                onClose: _closePicker,
              ),
            if (_activePicker == 'priority')
              _PickerSheet(
                title: 'Priority',
                options: [
                  for (final p in announcementPriorities)
                    _PickerOption(value: p.$1, label: p.$2),
                ],
                selected: _priority,
                onPick: (v) => _pick('priority', v),
                onClose: _closePicker,
              ),
          ],
        ),
      ),
    );
  }
}

class _Counter extends StatelessWidget {
  const _Counter(this.count, this.max);
  final int count;
  final int max;

  @override
  Widget build(BuildContext context) => Align(
    alignment: Alignment.centerRight,
    child: Text(
      '$count/$max',
      style: const TextStyle(
        fontFamily: RLTokens.fontMono,
        fontSize: 11,
        color: RLTokens.micro,
      ),
    ),
  );
}

class _AudienceChip extends StatelessWidget {
  const _AudienceChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 13),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? RLTokens.crimsonTint : RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rMd),
          border: Border.all(
            color: selected ? RLTokens.crimson : RLTokens.hairline,
            width: 1.5,
          ),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13,
            fontWeight: selected ? RLTokens.bold : RLTokens.medium,
            color: RLTokens.ink,
          ),
        ),
      ),
    );
  }
}

class _CharacterLimit extends TextInputFormatter {
  const _CharacterLimit(this.max);
  final int max;

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (newValue.text.characters.length <= max) return newValue;
    final clipped = newValue.text.characters.take(max).toString();
    return TextEditingValue(
      text: clipped,
      selection: TextSelection.collapsed(offset: clipped.length),
    );
  }
}

class _TextBox extends StatelessWidget {
  const _TextBox({
    required this.controller,
    required this.placeholder,
    required this.maxLength,
    required this.enabled,
    this.multiline = false,
  });
  final TextEditingController controller;
  final String placeholder;
  final int maxLength;
  final bool enabled;
  final bool multiline;

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
        enabled: enabled,
        maxLines: multiline ? null : 1,
        minLines: multiline ? 5 : null,
        inputFormatters: [_CharacterLimit(maxLength)],
        style: TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 14.5,
          color: RLTokens.ink,
          height: multiline ? 1.5 : null,
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
          disabledBorder: InputBorder.none,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }
}

class _LoadError extends StatelessWidget {
  const _LoadError({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            message,
            style: const TextStyle(
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

class _FormField extends StatelessWidget {
  const _FormField({required this.label, required this.child, this.error});
  final String label;
  final Widget child;
  final String? error;

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

class _SelectField extends StatelessWidget {
  const _SelectField({
    required this.value,
    required this.placeholder,
    this.onTap,
    this.enabled = true,
  });
  final String value;
  final String placeholder;
  final VoidCallback? onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final isPlaceholder = value.isEmpty;

    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: enabled ? RLTokens.surface : RLTokens.fill,
          borderRadius: BorderRadius.circular(RLTokens.rMd),
          border: Border.all(color: RLTokens.hairline, width: 1.5),
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

class _PickerOption {
  const _PickerOption({required this.value, required this.label});
  final String value;
  final String label;
}

class _PickerSheet extends StatelessWidget {
  const _PickerSheet({
    required this.title,
    required this.options,
    required this.onPick,
    required this.onClose,
    this.selected = '',
  });

  final String title;
  final List<_PickerOption> options;
  final ValueChanged<String> onPick;
  final VoidCallback onClose;
  final String selected;

  bool _isSelected(String value) => selected == value;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onClose,
      child: Container(
        color: const Color.fromRGBO(17, 17, 16, 0.38),
        child: Align(
          alignment: Alignment.bottomCenter,
          child: GestureDetector(
            onTap: () {},
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
                    padding: const EdgeInsets.fromLTRB(20, 10, 14, 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSerif,
                              fontWeight: RLTokens.headingWeight,
                              fontSize: 20,
                              color: RLTokens.ink,
                              letterSpacing: -0.3,
                            ),
                          ),
                        ),
                        RLIconBtn(
                          icon: Icons.close,
                          bg: RLTokens.fill,
                          iconColor: RLTokens.inkSoft,
                          onTap: onClose,
                        ),
                      ],
                    ),
                  ),
                  Flexible(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(14, 4, 14, 30),
                      child: Column(
                        children: [
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
