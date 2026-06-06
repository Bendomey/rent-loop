import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

// ── Public API ─────────────────────────────────────────────────────────────────

void showBasicDetailsSheet(BuildContext context, {String name = '', String description = ''}) {
  _openSheet(context, (ctx, close) => _BasicDetailsSheet(initialName: name, initialDesc: description, onClose: close));
}

void showRentalModeSheet(BuildContext context, {String current = 'lease'}) {
  _openSheet(context, (ctx, close) => _RentalModeSheet(current: current, onClose: close));
}

void showLocationSheet(BuildContext context, {String address = ''}) {
  _openSheet(context, (ctx, close) => _LocationSheet(initialAddress: address, onClose: close));
}

void showSwitchTypeSheet(BuildContext context, {String current = 'multi', int unitCount = 24}) {
  _openSheet(context, (ctx, close) => _SwitchTypeSheet(current: current, unitCount: unitCount, onClose: close));
}

// ── Internal sheet launcher ────────────────────────────────────────────────────

void _openSheet(BuildContext context, Widget Function(BuildContext, VoidCallback) builder) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => builder(ctx, () => Navigator.of(ctx).pop()),
  );
}

// ── PSSheet chrome ─────────────────────────────────────────────────────────────

class _PSSheet extends StatelessWidget {
  const _PSSheet({
    required this.title,
    this.desc,
    required this.onClose,
    required this.child,
    required this.footer,
  });
  final String title;
  final String? desc;
  final VoidCallback onClose;
  final Widget child;
  final Widget footer;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return AnimatedPadding(
      duration: const Duration(milliseconds: 150),
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.9),
        decoration: const BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(RLTokens.rXl)),
          boxShadow: RLTokens.elevSheet,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Center(
                child: Container(
                  width: 38,
                  height: 5,
                  decoration: BoxDecoration(
                    color: RLTokens.hairline,
                    borderRadius: BorderRadius.circular(5),
                  ),
                ),
              ),
            ),
            // Title row
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 10, 12, 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontFamily: RLTokens.fontSerif,
                            fontSize: 21,
                            color: RLTokens.ink,
                            letterSpacing: -0.3,
                          ),
                        ),
                        if (desc != null) ...[
                          const SizedBox(height: 5),
                          Text(
                            desc!,
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 13,
                              color: RLTokens.muted,
                              height: 1.45,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  GestureDetector(
                    onTap: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      onClose();
                    },
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: RLTokens.fill,
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: const Icon(Icons.close_rounded, size: 18, color: RLTokens.inkSoft),
                    ),
                  ),
                ],
              ),
            ),
            // Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
                child: child,
              ),
            ),
            // Footer
            Padding(
              padding: EdgeInsets.fromLTRB(20, 14, 20, 30 + bottom),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [footer],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Save + Cancel buttons ──────────────────────────────────────────────────────

Widget _saveCancel(VoidCallback onClose) {
  return Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      GestureDetector(
        onTap: () async {
          await Haptics.vibrate(HapticsType.selection);
          onClose();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          decoration: BoxDecoration(
            color: RLTokens.fill,
            borderRadius: BorderRadius.circular(RLTokens.rMd),
            border: Border.all(color: RLTokens.hairline),
          ),
          child: const Text(
            'Cancel',
            style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14.5, fontWeight: RLTokens.semibold, color: RLTokens.ink),
          ),
        ),
      ),
      const SizedBox(width: 10),
      GestureDetector(
        onTap: () async {
          await Haptics.vibrate(HapticsType.medium);
          onClose();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          decoration: BoxDecoration(
            color: RLTokens.crimson,
            borderRadius: BorderRadius.circular(RLTokens.rMd),
          ),
          child: const Row(
            children: [
              Icon(Icons.check_rounded, size: 16, color: Colors.white),
              SizedBox(width: 6),
              Text(
                'Save',
                style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14.5, fontWeight: RLTokens.semibold, color: Colors.white),
              ),
            ],
          ),
        ),
      ),
    ],
  );
}

// ── Shared input field ─────────────────────────────────────────────────────────

class _SheetInput extends StatelessWidget {
  const _SheetInput({required this.controller, required this.placeholder, this.prefixIcon, this.textCapitalization = TextCapitalization.none});
  final TextEditingController controller;
  final String placeholder;
  final IconData? prefixIcon;
  final TextCapitalization textCapitalization;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      textCapitalization: textCapitalization,
      style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, color: RLTokens.ink),
      decoration: InputDecoration(
        hintText: placeholder,
        hintStyle: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, color: RLTokens.mutedSoft),
        prefixIcon: prefixIcon != null ? Icon(prefixIcon, size: 18, color: RLTokens.mutedSoft) : null,
        filled: true,
        fillColor: RLTokens.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border:        OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: RLTokens.hairline, width: 1.5)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: RLTokens.hairline, width: 1.5)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: RLTokens.crimson,   width: 1.5)),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13.5, fontWeight: RLTokens.semibold, color: RLTokens.ink),
      ),
    );
  }
}

// ── 1. Basic details ───────────────────────────────────────────────────────────

class _BasicDetailsSheet extends StatefulWidget {
  const _BasicDetailsSheet({required this.initialName, required this.initialDesc, required this.onClose});
  final String initialName, initialDesc;
  final VoidCallback onClose;

  @override
  State<_BasicDetailsSheet> createState() => _BasicDetailsSheetState();
}

class _BasicDetailsSheetState extends State<_BasicDetailsSheet> {
  late final _nameCtrl = TextEditingController(text: widget.initialName);
  late final _descCtrl = TextEditingController(text: widget.initialDesc);

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _PSSheet(
      title: 'Edit basic details',
      desc: 'Update the property name and description.',
      onClose: widget.onClose,
      footer: _saveCancel(widget.onClose),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _FieldLabel('Property name'),
          _SheetInput(controller: _nameCtrl, placeholder: 'e.g. Cantonments Court', textCapitalization: TextCapitalization.words),
          const SizedBox(height: 16),
          const _FieldLabel('Description'),
          TextField(
            controller: _descCtrl,
            maxLines: 4,
            style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14.5, color: RLTokens.ink, height: 1.5),
            decoration: InputDecoration(
              hintText: 'Briefly describe your property…',
              hintStyle: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14.5, color: RLTokens.mutedSoft),
              filled: true,
              fillColor: RLTokens.surface,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
              border:        OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: RLTokens.hairline, width: 1.5)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: RLTokens.hairline, width: 1.5)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: RLTokens.crimson,   width: 1.5)),
            ),
          ),
        ],
      ),
    );
  }
}

// ── 2. Rental mode ─────────────────────────────────────────────────────────────

class _RentalModeSheet extends StatefulWidget {
  const _RentalModeSheet({required this.current, required this.onClose});
  final String current;
  final VoidCallback onClose;

  @override
  State<_RentalModeSheet> createState() => _RentalModeSheetState();
}

class _RentalModeSheetState extends State<_RentalModeSheet> {
  late String _value = widget.current;

  @override
  Widget build(BuildContext context) {
    return _PSSheet(
      title: 'Rental mode',
      desc: 'Choose what type of rentals this property handles.',
      onClose: widget.onClose,
      footer: _saveCancel(widget.onClose),
      child: Column(
        children: [
          _RentalRow(icon: Icons.description_outlined, title: 'Long-term (Leases)', desc: 'Monthly rent, applications, lease agreements.', selected: _value == 'lease', onTap: () { Haptics.vibrate(HapticsType.selection); setState(() => _value = 'lease'); }),
          const SizedBox(height: 10),
          _RentalRow(icon: Icons.calendar_month_outlined, title: 'Short-term (Bookings)', desc: 'Nightly stays, booking link, availability calendar.', selected: _value == 'booking', onTap: () { Haptics.vibrate(HapticsType.selection); setState(() => _value = 'booking'); }),
          const SizedBox(height: 10),
          _RentalRow(icon: Icons.grid_view_rounded, title: 'Both', desc: 'Some units long-term, others for short stays.', selected: _value == 'both', onTap: () { Haptics.vibrate(HapticsType.selection); setState(() => _value = 'both'); }),
        ],
      ),
    );
  }
}

// ── 3. Location ────────────────────────────────────────────────────────────────

class _LocationSheet extends StatefulWidget {
  const _LocationSheet({required this.initialAddress, required this.onClose});
  final String initialAddress;
  final VoidCallback onClose;

  @override
  State<_LocationSheet> createState() => _LocationSheetState();
}

class _LocationSheetState extends State<_LocationSheet> {
  late final _addrCtrl = TextEditingController(text: widget.initialAddress);

  @override
  void dispose() {
    _addrCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _PSSheet(
      title: 'Edit location',
      desc: 'Search and select an address to update location details.',
      onClose: widget.onClose,
      footer: _saveCancel(widget.onClose),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _FieldLabel('Address'),
          _SheetInput(controller: _addrCtrl, placeholder: 'Search address', prefixIcon: Icons.search_rounded, textCapitalization: TextCapitalization.words),
          const SizedBox(height: 8),
          const Text(
            'Country, region and city update automatically.',
            style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12, color: RLTokens.mutedSoft),
          ),
        ],
      ),
    );
  }
}

// ── 4. Switch type ─────────────────────────────────────────────────────────────

class _SwitchTypeSheet extends StatelessWidget {
  const _SwitchTypeSheet({required this.current, required this.unitCount, required this.onClose});
  final String current;
  final int unitCount;
  final VoidCallback onClose;

  bool get _toSingle => current == 'multi';
  bool get _blocked  => _toSingle && unitCount > 1;

  @override
  Widget build(BuildContext context) {
    return _PSSheet(
      title: 'Switch to ${_toSingle ? "Single" : "Multi"} type?',
      onClose: onClose,
      footer: _blocked
          ? GestureDetector(
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                onClose();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                decoration: BoxDecoration(
                  color: RLTokens.fill,
                  borderRadius: BorderRadius.circular(RLTokens.rMd),
                  border: Border.all(color: RLTokens.hairline),
                ),
                child: const Text(
                  'Got it',
                  style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14.5, fontWeight: RLTokens.semibold, color: RLTokens.ink),
                ),
              ),
            )
          : _saveCancel(onClose),
      child: _blocked ? _blockedContent() : _confirmContent(),
    );
  }

  Widget _blockedContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: RLTokens.warningBg,
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.warning_amber_rounded, size: 18, color: RLTokens.warning),
              SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Reduce to 1 block & 1 unit first', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13.5, fontWeight: RLTokens.semibold, color: RLTokens.warning)),
                    SizedBox(height: 4),
                    Text('A single-unit property can only have one block and one unit. Remove the extras, then switch.', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12.5, color: RLTokens.warning, height: 1.4)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          decoration: BoxDecoration(
            border: Border.all(color: RLTokens.hairline),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(Icons.apartment_outlined, size: 18, color: RLTokens.muted),
              const SizedBox(width: 9),
              const Expanded(child: Text('Units', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14.5, fontWeight: RLTokens.semibold, color: RLTokens.ink))),
              const Text('current', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12, color: RLTokens.muted)),
              const SizedBox(width: 8),
              _chip('$unitCount', RLTokens.crimsonTint, RLTokens.crimson),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: Icon(Icons.arrow_forward_rounded, size: 14, color: RLTokens.micro),
              ),
              const Text('max', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12, color: RLTokens.muted)),
              const SizedBox(width: 8),
              _chip('1', RLTokens.successBg, RLTokens.success),
            ],
          ),
        ),
      ],
    );
  }

  Widget _confirmContent() {
    return Text(
      _toSingle
          ? 'A Single property has one unit only.'
          : 'A Multi property supports multiple blocks and units. You can add more after switching.',
      style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14, color: RLTokens.muted, height: 1.5),
    );
  }

  Widget _chip(String label, Color bg, Color fg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12.5, fontWeight: RLTokens.bold, color: fg)),
    );
  }
}

// ── Rental row (shared) ────────────────────────────────────────────────────────

class _RentalRow extends StatelessWidget {
  const _RentalRow({required this.icon, required this.title, required this.desc, required this.selected, required this.onTap});
  final IconData icon;
  final String title, desc;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? RLTokens.crimsonTint : RLTokens.surface,
          border: Border.all(color: selected ? RLTokens.crimson : RLTokens.hairline, width: 1.5),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: selected ? RLTokens.surface : RLTokens.fill,
                borderRadius: BorderRadius.circular(11),
              ),
              child: Icon(icon, size: 20, color: selected ? RLTokens.crimson : RLTokens.inkSoft),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14.5, fontWeight: RLTokens.semibold, color: RLTokens.ink)),
                  const SizedBox(height: 2),
                  Text(desc, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12, color: RLTokens.muted, height: 1.4)),
                ],
              ),
            ),
            const SizedBox(width: 12),
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: selected ? RLTokens.crimson : RLTokens.hairline, width: 1.5),
                color: selected ? RLTokens.crimson : RLTokens.surface,
              ),
              child: selected ? const Center(child: CircleAvatar(radius: 4, backgroundColor: Colors.white)) : null,
            ),
          ],
        ),
      ),
    );
  }
}
