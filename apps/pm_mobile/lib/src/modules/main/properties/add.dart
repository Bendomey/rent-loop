import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

const _kSteps = ['Property type', 'Basic info', 'Address', 'Review'];

class AddPropertyScreen extends StatefulWidget {
  const AddPropertyScreen({super.key});

  @override
  State<AddPropertyScreen> createState() => _State();
}

class _State extends State<AddPropertyScreen> {
  int _step = 1; // 1-based

  // Step 1
  String _type   = 'Single Unit';
  String _status = 'Active';
  String _rental = 'Long-term (Leases)';

  // Step 2
  final _nameCtrl    = TextEditingController(text: 'Cantonments Court');
  final _detailsCtrl = TextEditingController(
    text: 'Gated 2-bed apartment block, 24 units, borehole water and standby generator.',
  );
  final _tagDraftCtrl = TextEditingController();
  List<String> _tags = ['Apartments', 'Gated'];

  // Step 3
  final _addressCtrl = TextEditingController(text: '12 Switchback Rd, Cantonments, Accra');
  final _gpsCtrl     = TextEditingController();

  @override
  void dispose() {
    _nameCtrl.dispose();
    _detailsCtrl.dispose();
    _tagDraftCtrl.dispose();
    _addressCtrl.dispose();
    _gpsCtrl.dispose();
    super.dispose();
  }

  void _next() {
    Haptics.vibrate(HapticsType.selection);
    if (_step < 4) setState(() => _step++);
  }

  void _back() {
    Haptics.vibrate(HapticsType.selection);
    if (_step > 1) setState(() => _step--);
  }

  void _addTag() {
    final t = _tagDraftCtrl.text.trim();
    if (t.isEmpty) return;
    setState(() {
      _tags = [..._tags, t];
      _tagDraftCtrl.clear();
    });
  }

  void _removeTag(int i) {
    setState(() => _tags = [..._tags]..removeAt(i));
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          _WizHeader(step: _step, onClose: () => context.pop()),
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(20, 14, 20, 120 + bottom),
              child: _buildStep(),
            ),
          ),
          _WizFooter(
            step: _step,
            onBack: _back,
            onNext: _next,
            onCancel: () => context.pop(),
          ),
        ],
      ),
    );
  }

  Widget _buildStep() {
    return switch (_step) {
      1 => _Step1(
        type:   _type,
        status: _status,
        rental: _rental,
        onType:   (v) { Haptics.vibrate(HapticsType.selection); setState(() => _type   = v); },
        onStatus: (v) { Haptics.vibrate(HapticsType.selection); setState(() => _status = v); },
        onRental: (v) { Haptics.vibrate(HapticsType.selection); setState(() => _rental = v); },
      ),
      2 => _Step2(
        nameCtrl:    _nameCtrl,
        detailsCtrl: _detailsCtrl,
        tagDraftCtrl: _tagDraftCtrl,
        tags:    _tags,
        onAddTag:    _addTag,
        onRemoveTag: _removeTag,
      ),
      3 => _Step3(
        addressCtrl: _addressCtrl,
        gpsCtrl:     _gpsCtrl,
      ),
      _ => _Step4(
        type:    _type,
        status:  _status,
        rental:  _rental,
        name:    _nameCtrl.text,
        details: _detailsCtrl.text,
        tags:    _tags,
        address: _addressCtrl.text,
        gps:     _gpsCtrl.text,
        onEdit:  (s) { Haptics.vibrate(HapticsType.selection); setState(() => _step = s); },
      ),
    };
  }
}

// ── Header ────────────────────────────────────────────────────────────────────

class _WizHeader extends StatelessWidget {
  const _WizHeader({required this.step, required this.onClose});
  final int step;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Container(
      color: RLTokens.surface,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(height: top),
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 4, 16, 12),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 22, color: RLTokens.ink),
                  onPressed: () async {
                    await Haptics.vibrate(HapticsType.selection);
                    onClose();
                  },
                ),
                const Expanded(
                  child: Center(
                    child: Text(
                      'Add property',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 16,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.ink,
                      ),
                    ),
                  ),
                ),
                Text(
                  '$step/4',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 11.5,
                    color: RLTokens.muted,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: List.generate(4, (i) {
                    return Expanded(
                      child: Container(
                        margin: EdgeInsets.only(right: i < 3 ? 5 : 0),
                        height: 4,
                        decoration: BoxDecoration(
                          color: i < step ? RLTokens.crimson : RLTokens.fill,
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 8),
                Text(
                  'Step $step · ${_kSteps[step - 1]}',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 10.5,
                    letterSpacing: 0.6,
                    color: RLTokens.mutedSoft,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: RLTokens.hairline),
        ],
      ),
    );
  }
}

// ── Footer ────────────────────────────────────────────────────────────────────

class _WizFooter extends StatelessWidget {
  const _WizFooter({
    required this.step,
    required this.onBack,
    required this.onNext,
    required this.onCancel,
  });
  final int step;
  final VoidCallback onBack;
  final VoidCallback onNext;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Container(
      padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + bottom),
      decoration: const BoxDecoration(
        color: RLTokens.surface,
        border: Border(top: BorderSide(color: RLTokens.hairline)),
      ),
      child: Row(
        children: [
          step == 1
              ? GestureDetector(
                  onTap: onCancel,
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 4, vertical: 12),
                    child: Text(
                      'Cancel',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 14.5,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.muted,
                      ),
                    ),
                  ),
                )
              : GestureDetector(
                  onTap: onBack,
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 4, vertical: 12),
                    child: Row(
                      children: [
                        Icon(Icons.chevron_left_rounded, size: 18, color: RLTokens.ink),
                        SizedBox(width: 4),
                        Text(
                          'Back',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 14.5,
                            fontWeight: RLTokens.semibold,
                            color: RLTokens.ink,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
          const Spacer(),
          GestureDetector(
            onTap: onNext,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
              decoration: BoxDecoration(
                color: RLTokens.crimson,
                borderRadius: BorderRadius.circular(RLTokens.rMd),
              ),
              child: Row(
                children: [
                  Text(
                    step < 4 ? 'Next' : 'Submit property',
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 14.5,
                      fontWeight: RLTokens.semibold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Icon(
                    step < 4 ? Icons.arrow_forward_rounded : Icons.check_rounded,
                    size: 16,
                    color: Colors.white,
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

// ── Step 1 — Type & status ────────────────────────────────────────────────────

class _Step1 extends StatelessWidget {
  const _Step1({
    required this.type,
    required this.status,
    required this.rental,
    required this.onType,
    required this.onStatus,
    required this.onRental,
  });
  final String type, status, rental;
  final ValueChanged<String> onType, onStatus, onRental;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'What type of property is this?',
          style: TextStyle(
            fontFamily: RLTokens.fontSerif,
            fontSize: 25,
            color: RLTokens.ink,
            letterSpacing: -0.4,
            height: 1.1,
          ),
        ),
        const SizedBox(height: 7),
        RichText(
          text: const TextSpan(
            style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13.5, color: RLTokens.muted, height: 1.5),
            children: [
              TextSpan(text: 'Choose the category that best matches your property\'s layout or use. '),
              TextSpan(
                text: 'Learn more',
                style: TextStyle(color: RLTokens.crimson, fontWeight: RLTokens.semibold),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(child: _TypeCard(
              icon: Icons.home_outlined,
              title: 'Single Unit',
              desc: 'One complete space, rented by one tenant.',
              selected: type == 'Single Unit',
              onTap: () => onType('Single Unit'),
            )),
            const SizedBox(width: 10),
            Expanded(child: _TypeCard(
              icon: Icons.apartment_outlined,
              title: 'Multi-Unit',
              desc: 'Divided into separate spaces for many tenants.',
              selected: type == 'Multi-Unit',
              onTap: () => onType('Multi-Unit'),
            )),
          ],
        ),
        const SizedBox(height: 24),
        const _SectionLabel('Status'),
        const SizedBox(height: 10),
        _StatusPills(value: status, onChange: onStatus),
        const SizedBox(height: 24),
        const _SectionLabel('What rentals does this property handle?'),
        const SizedBox(height: 10),
        _RentalRow(
          icon: Icons.description_outlined,
          title: 'Long-term (Leases)',
          desc: 'Monthly rent, applications, lease agreements.',
          selected: rental == 'Long-term (Leases)',
          onTap: () => onRental('Long-term (Leases)'),
        ),
        const SizedBox(height: 10),
        _RentalRow(
          icon: Icons.calendar_month_outlined,
          title: 'Short-term (Bookings)',
          desc: 'Nightly stays, booking link, availability calendar.',
          selected: rental == 'Short-term (Bookings)',
          onTap: () => onRental('Short-term (Bookings)'),
        ),
        const SizedBox(height: 10),
        _RentalRow(
          icon: Icons.grid_view_rounded,
          title: 'Both',
          desc: 'Some units long-term, others for short stays.',
          selected: rental == 'Both',
          onTap: () => onRental('Both'),
        ),
      ],
    );
  }
}

class _TypeCard extends StatelessWidget {
  const _TypeCard({
    required this.icon,
    required this.title,
    required this.desc,
    required this.selected,
    required this.onTap,
  });
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
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? RLTokens.crimsonTint : RLTokens.surface,
          border: Border.all(
            color: selected ? RLTokens.crimson : RLTokens.hairline,
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, size: 30, color: selected ? RLTokens.crimson : RLTokens.ink),
                const SizedBox(height: 10),
                Text(
                  title,
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 15,
                    fontWeight: RLTokens.bold,
                    color: RLTokens.ink,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12,
                    color: RLTokens.muted,
                    height: 1.4,
                  ),
                ),
              ],
            ),
            if (selected)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  width: 20,
                  height: 20,
                  decoration: const BoxDecoration(
                    color: RLTokens.crimson,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_rounded, size: 12, color: Colors.white),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _StatusPills extends StatelessWidget {
  const _StatusPills({required this.value, required this.onChange});
  final String value;
  final ValueChanged<String> onChange;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: ['Active', 'Inactive', 'Maintenance'].map((o) {
        final on = value == o;
        return Expanded(
          flex: o == 'Maintenance' ? 12 : 10,
          child: GestureDetector(
            onTap: () => onChange(o),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              margin: EdgeInsets.only(right: o == 'Maintenance' ? 0 : 8),
              padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 8),
              decoration: BoxDecoration(
                color: on ? RLTokens.crimson : RLTokens.surface,
                border: Border.all(color: on ? RLTokens.crimson : RLTokens.hairline),
                borderRadius: BorderRadius.circular(11),
              ),
              child: Center(
                child: Text(
                  o,
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13.5,
                    fontWeight: RLTokens.semibold,
                    color: on ? Colors.white : RLTokens.muted,
                  ),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _RentalRow extends StatelessWidget {
  const _RentalRow({
    required this.icon,
    required this.title,
    required this.desc,
    required this.selected,
    required this.onTap,
  });
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
          border: Border.all(
            color: selected ? RLTokens.crimson : RLTokens.hairline,
            width: 1.5,
          ),
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
                  Text(
                    title,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 14.5,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    desc,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12,
                      color: RLTokens.muted,
                      height: 1.4,
                    ),
                  ),
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
                border: Border.all(
                  color: selected ? RLTokens.crimson : RLTokens.hairline,
                  width: 1.5,
                ),
                color: selected ? RLTokens.crimson : RLTokens.surface,
              ),
              child: selected
                  ? const Center(
                      child: CircleAvatar(radius: 4, backgroundColor: Colors.white),
                    )
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Step 2 — Basic info ───────────────────────────────────────────────────────

class _Step2 extends StatelessWidget {
  const _Step2({
    required this.nameCtrl,
    required this.detailsCtrl,
    required this.tagDraftCtrl,
    required this.tags,
    required this.onAddTag,
    required this.onRemoveTag,
  });
  final TextEditingController nameCtrl, detailsCtrl, tagDraftCtrl;
  final List<String> tags;
  final VoidCallback onAddTag;
  final ValueChanged<int> onRemoveTag;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Basic information',
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
          'Name your property and add a photo.',
          style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13.5, color: RLTokens.muted),
        ),
        const SizedBox(height: 22),
        const _WLabel('Name'),
        _WInput(controller: nameCtrl, placeholder: 'e.g. Cantonments Court'),
        const SizedBox(height: 20),
        const _WLabel('Property image', optional: true),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: RLTokens.hairline, width: 1.5, style: BorderStyle.solid),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            children: [
              Container(
                height: 130,
                decoration: BoxDecoration(
                  color: RLTokens.fill,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(13)),
                ),
                child: const Center(
                  child: Icon(Icons.camera_alt_outlined, size: 30, color: RLTokens.mutedSoft),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(14),
                child: GestureDetector(
                  onTap: () => Haptics.vibrate(HapticsType.selection),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 18),
                    decoration: BoxDecoration(
                      color: RLTokens.surface,
                      border: Border.all(color: RLTokens.hairline),
                      borderRadius: BorderRadius.circular(RLTokens.rMd),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.add_rounded, size: 16, color: RLTokens.ink),
                        SizedBox(width: 6),
                        Text(
                          'Choose image',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 13.5,
                            fontWeight: RLTokens.semibold,
                            color: RLTokens.ink,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        const _WLabel('Details', optional: true),
        TextField(
          controller: detailsCtrl,
          maxLines: 4,
          textCapitalization: TextCapitalization.sentences,
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
        const SizedBox(height: 20),
        const _WLabel('Tags', optional: true),
        Row(
          children: [
            Expanded(child: _WInput(controller: tagDraftCtrl, placeholder: 'Type a tag…')),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                onAddTag();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                decoration: BoxDecoration(
                  color: RLTokens.ink,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'Add',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14.5,
                    fontWeight: RLTokens.semibold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
        if (tags.isNotEmpty) ...[
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: tags.asMap().entries.map((e) {
              return Container(
                padding: const EdgeInsets.fromLTRB(12, 6, 8, 6),
                decoration: BoxDecoration(
                  color: RLTokens.fill,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      e.value,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12.5,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.ink,
                      ),
                    ),
                    const SizedBox(width: 6),
                    GestureDetector(
                      onTap: () async {
                        await Haptics.vibrate(HapticsType.selection);
                        onRemoveTag(e.key);
                      },
                      child: const Icon(Icons.close_rounded, size: 14, color: RLTokens.mutedSoft),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }
}

// ── Step 3 — Address ──────────────────────────────────────────────────────────

class _Step3 extends StatelessWidget {
  const _Step3({required this.addressCtrl, required this.gpsCtrl});
  final TextEditingController addressCtrl, gpsCtrl;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Where is it located?',
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
          'Search the address, or drop a Ghana Post GPS code.',
          style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13.5, color: RLTokens.muted),
        ),
        const SizedBox(height: 22),
        const _WLabel('Address'),
        _WInput(
          controller: addressCtrl,
          placeholder: 'Search address',
          prefixIcon: Icons.search_rounded,
        ),
        const SizedBox(height: 16),
        // Map placeholder
        Container(
          height: 150,
          decoration: BoxDecoration(
            color: const Color(0xFFEDEBE6),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: RLTokens.hairline),
          ),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.location_on_rounded, size: 30, color: RLTokens.crimson),
                const SizedBox(height: 6),
                const Text(
                  'Map preview',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12.5,
                    color: RLTokens.muted,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        const _WLabel('Ghana Post GPS', optional: true),
        _WInput(controller: gpsCtrl, placeholder: 'e.g. GM-123-4567'),
      ],
    );
  }
}

// ── Step 4 — Review ───────────────────────────────────────────────────────────

class _Step4 extends StatelessWidget {
  const _Step4({
    required this.type,
    required this.status,
    required this.rental,
    required this.name,
    required this.details,
    required this.tags,
    required this.address,
    required this.gps,
    required this.onEdit,
  });
  final String type, status, rental, name, details, address, gps;
  final List<String> tags;
  final ValueChanged<int> onEdit;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Review & submit',
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
          'Check everything below. Edit any step before submitting.',
          style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13.5, color: RLTokens.muted, height: 1.5),
        ),
        const SizedBox(height: 20),
        _ReviewCard(
          title: 'Type & status',
          onEdit: () => onEdit(1),
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _ReviewPill(type),
              _ReviewPill(status, tone: _PillTone.green),
              _ReviewPill(rental, tone: _PillTone.blue),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _ReviewCard(
          title: 'Basic information',
          onEdit: () => onEdit(2),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(child: _ReviewPair(k: 'Name', v: name)),
                  const SizedBox(width: 14),
                  Expanded(child: _ReviewPair(k: 'Tags', v: tags.isEmpty ? '—' : tags.join(', '))),
                ],
              ),
              const SizedBox(height: 8),
              _ReviewPair(k: 'Details', v: details.isEmpty ? '—' : details),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _ReviewCard(
          title: 'Address',
          onEdit: () => onEdit(3),
          child: Row(
            children: [
              Expanded(child: _ReviewPair(k: 'Address', v: address.isEmpty ? '—' : address)),
              const SizedBox(width: 14),
              SizedBox(width: 96, child: _ReviewPair(k: 'GPS', v: gps.isEmpty ? '—' : gps)),
            ],
          ),
        ),
      ],
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({required this.title, required this.onEdit, required this.child});
  final String title;
  final VoidCallback onEdit;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        border: Border.all(color: RLTokens.hairline),
        borderRadius: BorderRadius.circular(RLTokens.rLg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14.5,
                    fontWeight: RLTokens.bold,
                    color: RLTokens.ink,
                  ),
                ),
              ),
              GestureDetector(
                onTap: onEdit,
                child: const Row(
                  children: [
                    Icon(Icons.settings_outlined, size: 14, color: RLTokens.crimson),
                    SizedBox(width: 4),
                    Text(
                      'Edit',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 13,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.crimson,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _ReviewPair extends StatelessWidget {
  const _ReviewPair({required this.k, required this.v});
  final String k, v;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          k.toUpperCase(),
          style: const TextStyle(
            fontFamily: RLTokens.fontMono,
            fontSize: 10,
            letterSpacing: 0.5,
            color: RLTokens.mutedSoft,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          v,
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14,
            color: RLTokens.ink,
            height: 1.4,
          ),
        ),
      ],
    );
  }
}

enum _PillTone { gray, green, blue }

class _ReviewPill extends StatelessWidget {
  const _ReviewPill(this.label, {this.tone = _PillTone.gray});
  final String label;
  final _PillTone tone;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (tone) {
      _PillTone.green => (RLTokens.successBg, RLTokens.success),
      _PillTone.blue  => (RLTokens.infoBg,    RLTokens.info),
      _PillTone.gray  => (RLTokens.neutralBg,  RLTokens.inkSoft),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(RLTokens.rPill)),
      child: Text(
        label,
        style: TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 12.5,
          fontWeight: RLTokens.semibold,
          color: fg,
        ),
      ),
    );
  }
}

// ── Shared helpers ────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontFamily: RLTokens.fontSans,
        fontSize: 13.5,
        fontWeight: RLTokens.semibold,
        color: RLTokens.ink,
      ),
    );
  }
}

class _WLabel extends StatelessWidget {
  const _WLabel(this.text, {this.optional = false});
  final String text;
  final bool optional;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            text,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              fontWeight: RLTokens.semibold,
              color: RLTokens.ink,
            ),
          ),
          if (optional)
            const Text(
              'Optional',
              style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 11.5, color: RLTokens.mutedSoft),
            ),
        ],
      ),
    );
  }
}

class _WInput extends StatelessWidget {
  const _WInput({
    required this.controller,
    required this.placeholder,
    this.prefixIcon,
  });
  final TextEditingController controller;
  final String placeholder;
  final IconData? prefixIcon;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, color: RLTokens.ink),
      decoration: InputDecoration(
        hintText: placeholder,
        hintStyle: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, color: RLTokens.mutedSoft),
        prefixIcon: prefixIcon != null
            ? Icon(prefixIcon, size: 18, color: RLTokens.mutedSoft)
            : null,
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
