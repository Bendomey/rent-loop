import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';

import 'package:rentloop_manager/src/modules/main/properties/unit_form_widgets.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/blocks/blocks_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/blocks/update_block_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/block_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_blocks_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kBlockStatuses = [
  (
    value: 'PropertyBlock.Status.Active',
    label: 'Active',
    desc: 'Ready to use. Units in this block can be rented.',
  ),
  (
    value: 'PropertyBlock.Status.Maintenance',
    label: 'Maintenance',
    desc: 'Temporarily unavailable. Use while the block is under repair.',
  ),
  (
    value: 'PropertyBlock.Status.Inactive',
    label: 'Inactive',
    desc: 'Not currently in use.',
  ),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class EditBlockScreen extends ConsumerStatefulWidget {
  const EditBlockScreen({
    super.key,
    required this.propertyId,
    required this.blockId,
  });
  final String propertyId;
  final String blockId;

  @override
  ConsumerState<EditBlockScreen> createState() => _EditBlockScreenState();
}

class _EditBlockScreenState extends ConsumerState<EditBlockScreen> {
  bool _prefilled = false;
  String _status = 'PropertyBlock.Status.Active';
  final _nameCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  List<String> _images = [];
  bool _imagesUploading = false;
  String? _validationError;
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descriptionCtrl.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToTop() {
    if (!_scrollController.hasClients) return;
    _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  void _prefill(PropertyBlockModel block) {
    _status = block.status;
    _nameCtrl.text = block.name;
    _descriptionCtrl.text = block.description ?? '';
    _images = block.images ?? [];
    _prefilled = true;
  }

  Future<void> _submit() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      await Haptics.vibrate(HapticsType.error);
      setState(() => _validationError = 'Please enter a block name.');
      _scrollToTop();
      return;
    }
    if (_imagesUploading) {
      await Haptics.vibrate(HapticsType.error);
      setState(
        () =>
            _validationError = 'Please wait for the photo to finish uploading.',
      );
      _scrollToTop();
      return;
    }

    await Haptics.vibrate(HapticsType.medium);
    setState(() => _validationError = null);

    final description = _descriptionCtrl.text.trim();
    await ref
        .read(updateBlockNotifierProvider.notifier)
        .submit(
          propertyId: widget.propertyId,
          blockId: widget.blockId,
          name: name,
          description: description,
          images: _images,
          status: _status,
        );

    if (!mounted) return;
    final state = ref.read(updateBlockNotifierProvider);
    if (state.status.isSuccess()) {
      await Haptics.vibrate(HapticsType.success);
      ref.invalidate(propertyBlocksProvider(widget.propertyId));
      ref.invalidate(blockDetailProvider(widget.propertyId, widget.blockId));
      await ref
          .read(blocksNotifierProvider.notifier)
          .loadFirstPage(widget.propertyId);
      if (mounted) context.pop();
    } else {
      await Haptics.vibrate(HapticsType.error);
      _scrollToTop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final blockAsync = ref.watch(
      blockDetailProvider(widget.propertyId, widget.blockId),
    );
    final updateState = ref.watch(updateBlockNotifierProvider);
    final isSubmitting = updateState.status.isLoading();

    if (!blockAsync.hasValue && blockAsync.isLoading) {
      return Scaffold(
        backgroundColor: RLTokens.surface,
        body: Column(
          children: [
            const RLBackHeader(title: 'Edit Block'),
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
    if (blockAsync.hasError && !blockAsync.hasValue) {
      return Scaffold(
        backgroundColor: RLTokens.surface,
        body: Column(
          children: [
            const RLBackHeader(title: 'Edit Block'),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(RLTokens.gutter),
                child: RLSectionError(
                  onRetry: () => ref.invalidate(
                    blockDetailProvider(widget.propertyId, widget.blockId),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    final unit = blockAsync.value!;
    if (!_prefilled) _prefill(unit);

    final error =
        _validationError ??
        (updateState.status.isFailed() ? updateState.errorMessage : null);

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Edit Block',
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
                    'Update the details for this block.',
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
                      title: 'Could not update block',
                      body: error,
                      onDismiss: () {
                        setState(() => _validationError = null);
                        ref.read(updateBlockNotifierProvider.notifier).reset();
                      },
                    ),
                    const SizedBox(height: 18),
                  ],

                  const UFieldLabel('Name'),
                  UTextInput(
                    controller: _nameCtrl,
                    placeholder: 'e.g. Block A',
                  ),
                  const SizedBox(height: 20),
                  const UFieldLabel('Block Image', optional: true),
                  UImagePicker(
                    initialImages: unit.images ?? const [],
                    maxImages: 1,
                    onImagesChanged: (urls) => setState(() => _images = urls),
                    onUploadingChanged: (uploading) =>
                        setState(() => _imagesUploading = uploading),
                  ),
                  const SizedBox(height: 20),
                  const UFieldLabel('Description', optional: true),
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
                      hintText: 'Briefly describe this block…',
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
                  const USectionHeading(
                    'Status',
                    'Set the current availability of this block.',
                  ),
                  const SizedBox(height: 12),
                  ..._kBlockStatuses.map(
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
            onSubmit: _submit,
          ),
        ],
      ),
    );
  }
}
