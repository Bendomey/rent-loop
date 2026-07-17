import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';

import 'package:rentloop_manager/src/lib/lease_status.dart';
import 'package:rentloop_manager/src/modules/main/properties/unit_form_widgets.dart';
import 'package:rentloop_manager/src/repository/models/lease_checklist_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/leases/create_checklist_item_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/leases/update_checklist_item_notifier.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// Add/edit a single checklist item — ports the web `ChecklistItemDialog`'s 3
/// fields (description, status, notes) as a bottom sheet rather than a
/// dialog. [item] null means "add"; non-null means "edit" and prefills.
/// Returns true if the item was saved (caller should refresh).
Future<bool?> showChecklistItemSheet({
  required BuildContext context,
  required String propertyId,
  required String leaseId,
  required String checklistId,
  LeaseChecklistItemModel? item,
}) {
  return showModalBottomSheet<bool>(
    context: context,
    backgroundColor: Colors.transparent,
    barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
    isScrollControlled: true,
    builder: (_) => _ChecklistItemSheet(
      propertyId: propertyId,
      leaseId: leaseId,
      checklistId: checklistId,
      item: item,
    ),
  );
}

class _ChecklistItemSheet extends ConsumerStatefulWidget {
  const _ChecklistItemSheet({
    required this.propertyId,
    required this.leaseId,
    required this.checklistId,
    this.item,
  });
  final String propertyId;
  final String leaseId;
  final String checklistId;
  final LeaseChecklistItemModel? item;

  @override
  ConsumerState<_ChecklistItemSheet> createState() =>
      _ChecklistItemSheetState();
}

class _ChecklistItemSheetState extends ConsumerState<_ChecklistItemSheet> {
  late final TextEditingController _descriptionCtrl;
  late final TextEditingController _notesCtrl;
  late String _status;
  String? _validationError;

  bool get _isEdit => widget.item != null;

  @override
  void initState() {
    super.initState();
    _descriptionCtrl = TextEditingController(
      text: widget.item?.description ?? '',
    );
    _notesCtrl = TextEditingController(text: widget.item?.notes ?? '');
    _status = widget.item?.status ?? kChecklistItemStatuses.first;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(createChecklistItemNotifierProvider.notifier).reset();
      ref.read(updateChecklistItemNotifierProvider.notifier).reset();
    });
  }

  @override
  void dispose() {
    _descriptionCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final description = _descriptionCtrl.text.trim();
    if (description.isEmpty) {
      await Haptics.vibrate(HapticsType.error);
      setState(() => _validationError = 'Please describe this item.');
      return;
    }

    await Haptics.vibrate(HapticsType.selection);
    setState(() => _validationError = null);
    final notes = _notesCtrl.text.trim();

    if (_isEdit) {
      await ref
          .read(updateChecklistItemNotifierProvider.notifier)
          .submit(
            propertyId: widget.propertyId,
            leaseId: widget.leaseId,
            checklistId: widget.checklistId,
            itemId: widget.item!.id,
            description: description,
            status: _status,
            notes: notes.isEmpty ? '' : notes,
          );
      if (!mounted) return;
      if (ref.read(updateChecklistItemNotifierProvider).status.isSuccess()) {
        Navigator.of(context).pop(true);
      }
    } else {
      await ref
          .read(createChecklistItemNotifierProvider.notifier)
          .submit(
            propertyId: widget.propertyId,
            leaseId: widget.leaseId,
            checklistId: widget.checklistId,
            description: description,
            status: _status,
            notes: notes.isEmpty ? null : notes,
          );
      if (!mounted) return;
      if (ref.read(createChecklistItemNotifierProvider).status.isSuccess()) {
        Navigator.of(context).pop(true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final createState = ref.watch(createChecklistItemNotifierProvider);
    final updateState = ref.watch(updateChecklistItemNotifierProvider);
    final isPending = _isEdit
        ? updateState.status.isLoading()
        : createState.status.isLoading();
    final apiError = _isEdit
        ? (updateState.status.isFailed() ? updateState.errorMessage : null)
        : (createState.status.isFailed() ? createState.errorMessage : null);
    final error = _validationError ?? apiError;

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
                _isEdit ? 'Edit Item' : 'Add Item',
                style: TextStyle(
                  fontFamily: RLTokens.fontSerif,
                  fontSize: 20,
                  color: RLTokens.ink,
                ),
              ),
              const SizedBox(height: 16),
              const UFieldLabel('Description'),
              UTextInput(
                controller: _descriptionCtrl,
                placeholder: 'e.g. Living Room - Wall paint condition',
              ),
              const SizedBox(height: 18),
              const UFieldLabel('Condition'),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: kChecklistItemStatuses.map((s) {
                  return UChip(
                    label: checklistItemStatusLabel(s),
                    selected: _status == s,
                    onTap: () => setState(() => _status = s),
                  );
                }).toList(),
              ),
              const SizedBox(height: 18),
              const UFieldLabel('Notes', optional: true),
              TextField(
                controller: _notesCtrl,
                maxLines: 3,
                textCapitalization: TextCapitalization.sentences,
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 14.5,
                  color: RLTokens.ink,
                  height: 1.5,
                ),
                decoration: InputDecoration(
                  hintText: 'Any additional detail…',
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
              if (error != null) ...[
                const SizedBox(height: 14),
                RLInlineBanner(
                  tone: RLBannerTone.danger,
                  title: _isEdit
                      ? 'Could not update item'
                      : 'Could not add item',
                  body: error,
                ),
              ],
              const SizedBox(height: 20),
              RLBtn(
                label: isPending
                    ? 'Saving…'
                    : (_isEdit ? 'Save Changes' : 'Add Item'),
                full: true,
                onPressed: isPending ? null : _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
