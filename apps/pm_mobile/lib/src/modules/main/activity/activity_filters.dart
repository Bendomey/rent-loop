// Filter chips and the filter bottom sheet, shared by the Activity tab's
// screens (the maintenance board and the applications list) so the two cannot
// drift apart. Extracted verbatim from maintenance_board.dart.

import 'package:flutter/material.dart';

import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class RLFilterTriggerChip extends StatelessWidget {
  const RLFilterTriggerChip({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final String? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final active = value != null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: active ? RLTokens.crimsonTint : RLTokens.fill,
          borderRadius: BorderRadius.circular(RLTokens.rPill),
          border: Border.all(
            color: active ? RLTokens.crimson : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value ?? label,
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                fontWeight: active ? RLTokens.semibold : RLTokens.medium,
                color: active ? RLTokens.crimson : RLTokens.muted,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 16,
              color: active ? RLTokens.crimson : RLTokens.mutedSoft,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Filter sheet ──────────────────────────────────────────────────────────────

class RLFilterPickResult {
  const RLFilterPickResult.select(this.value, {this.id})
    : values = null,
      ids = null,
      isClear = false;
  const RLFilterPickResult.selectMulti(this.values, {this.ids})
    : value = null,
      id = null,
      isClear = false;
  const RLFilterPickResult.clear()
    : value = null,
      id = null,
      values = null,
      ids = null,
      isClear = true;

  final String? value;
  final String? id;
  final List<String>? values;
  final List<String>? ids;
  final bool isClear;
}

class RLFilterSheet extends StatefulWidget {
  const RLFilterSheet({
    required this.title,
    required this.options,
    this.selected,
    this.selectedMulti = const [],
    this.idsByLabel,
    this.multiSelect = false,
  });

  final String title;
  final List<String> options;
  final String? selected;

  /// Pre-checked labels, multi-select mode only.
  final List<String> selectedMulti;

  /// Only set for person/property/unit filters — maps a displayed label to
  /// the id that must actually be sent to the API.
  final Map<String, String>? idsByLabel;
  final bool multiSelect;

  @override
  State<RLFilterSheet> createState() => RLFilterSheetState();
}

class RLFilterSheetState extends State<RLFilterSheet> {
  late final Set<String> _checked = {...widget.selectedMulti};

  void _apply() {
    Navigator.pop(
      context,
      RLFilterPickResult.selectMulti(
        _checked.toList(),
        ids: widget.idsByLabel == null
            ? null
            : _checked
                  .map((label) => widget.idsByLabel![label])
                  .whereType<String>()
                  .toList(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.8,
        ),
        decoration: const BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(RLTokens.rXl),
            topRight: Radius.circular(RLTokens.rXl),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                RLTokens.space4,
                RLTokens.space4,
                RLTokens.space4,
                8,
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: const Icon(
                      Icons.close_rounded,
                      size: 22,
                      color: RLTokens.inkSoft,
                    ),
                  ),
                  Expanded(
                    child: Text(
                      'Filter by ${widget.title}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: RLTokens.textBarTitle,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.ink,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(
                      context,
                      const RLFilterPickResult.clear(),
                    ),
                    child: const Text(
                      'Clear',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: RLTokens.textSubtitle,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.crimson,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (widget.options.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: RLTokens.space4,
                  vertical: 24,
                ),
                child: Text(
                  'No options yet.',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: RLTokens.textBody,
                    color: RLTokens.mutedSoft,
                  ),
                ),
              )
            else
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(
                    horizontal: RLTokens.space4,
                  ),
                  itemCount: widget.options.length,
                  separatorBuilder: (_, _) =>
                      Container(height: 1, color: RLTokens.hairlineSoft),
                  itemBuilder: (_, i) {
                    final option = widget.options[i];
                    final isSelected = widget.multiSelect
                        ? _checked.contains(option)
                        : option == widget.selected;
                    return GestureDetector(
                      onTap: () {
                        if (widget.multiSelect) {
                          setState(() {
                            if (_checked.contains(option)) {
                              _checked.remove(option);
                            } else {
                              _checked.add(option);
                            }
                          });
                        } else {
                          Navigator.pop(
                            context,
                            RLFilterPickResult.select(
                              option,
                              id: widget.idsByLabel?[option],
                            ),
                          );
                        }
                      },
                      behavior: HitTestBehavior.opaque,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                option,
                                style: const TextStyle(
                                  fontFamily: RLTokens.fontSans,
                                  fontSize: RLTokens.textBody,
                                  color: RLTokens.ink,
                                ),
                              ),
                            ),
                            Icon(
                              widget.multiSelect
                                  ? (isSelected
                                        ? Icons.check_box_rounded
                                        : Icons.check_box_outline_blank_rounded)
                                  : (isSelected
                                        ? Icons.radio_button_checked_rounded
                                        : Icons.radio_button_unchecked_rounded),
                              size: 20,
                              color: isSelected
                                  ? RLTokens.crimson
                                  : RLTokens.hairline,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            if (widget.multiSelect)
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  RLTokens.space4,
                  8,
                  RLTokens.space4,
                  0,
                ),
                child: RLBtn(label: 'Apply', full: true, onPressed: _apply),
              ),
            SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
          ],
        ),
      ),
    );
  }
}

String? rlMultiSelectChipLabel({
  required List<String> selectedIds,
  required List<({String id, String name})> options,
  required String singularNoun,
  required String pluralNoun,
}) {
  if (selectedIds.isEmpty) return null;
  if (selectedIds.length == 1) {
    final match = options.where((o) => o.id == selectedIds.first);
    return match.isEmpty ? '1 $singularNoun' : match.first.name;
  }
  return '${selectedIds.length} $pluralNoun';
}
