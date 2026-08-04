import 'package:flutter/material.dart';

import 'package:rentloop_manager/src/shared/tokens.dart';

/// One label/value pair in a [TermsGrid] row.
class TermCell {
  const TermCell({required this.label, required this.value});
  final String label;
  final String value;
}

/// Two-column key/value grid — each row holds up to two [TermCell]s side by
/// side. A row with a single cell leaves the other half blank (matches a
/// single full-width field, not a stretched one).
class TermsGrid extends StatelessWidget {
  const TermsGrid({super.key, required this.rows});
  final List<List<TermCell>> rows;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: rows.asMap().entries.map((entry) {
        final isLast = entry.key == rows.length - 1;
        final cells = entry.value;
        return Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            border: isLast
                ? null
                : const Border(
                    bottom: BorderSide(color: RLTokens.hairlineSoft),
                  ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (final cell in cells) Expanded(child: _TermCellView(cell)),
              if (cells.length == 1) const Expanded(child: SizedBox.shrink()),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _TermCellView extends StatelessWidget {
  const _TermCellView(this.cell);
  final TermCell cell;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            cell.label.toUpperCase(),
            style: const TextStyle(
              fontFamily: RLTokens.fontMono,
              fontSize: 10,
              letterSpacing: 0.6,
              color: RLTokens.mutedSoft,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            cell.value,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 14,
              fontWeight: RLTokens.semibold,
              color: RLTokens.ink,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
