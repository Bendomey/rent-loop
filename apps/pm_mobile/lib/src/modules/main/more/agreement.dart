import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Legal text sections ───────────────────────────────────────────────────────

class _Section {
  const _Section({this.h2, required this.p});
  final String? h2;
  final String p;
}

const _kLegalBody = [
  _Section(p: 'Effective Date: April 3, 2026 · Version: 1.0'),
  _Section(
      p: 'This Property Owner Agreement ("Agreement") is entered into between RentLoop ("RentLoop", "we", "our", "us") and the property owner, property manager, or agent registering on the RentLoop platform ("User", "Landlord", "you").'),
  _Section(
      p: 'By creating an account, clicking "I Agree", or using the RentLoop platform, you agree to be bound by this Agreement.'),
  _Section(
      h2: '1. About RentLoop',
      p: 'RentLoop is a software platform that provides tools for property owners and managers to manage rental properties, tenants, leases, invoices, maintenance, and related rental operations.'),
  _Section(
      p: 'RentLoop is not a real-estate broker, landlord, property manager, or party to any lease or tenancy agreement between you and your tenants. We provide software only.'),
  _Section(
      h2: '2. Your Account',
      p: 'You are responsible for the accuracy of the information you provide, for maintaining the confidentiality of your login credentials, and for all activity that occurs under your account.'),
  _Section(
      h2: '3. Your Responsibilities',
      p: 'You are solely responsible for your compliance with all applicable laws, including tenancy, housing, tax, and data-protection laws in your jurisdiction. You are responsible for the lawfulness of every lease, invoice, and notice you create using RentLoop.'),
  _Section(
      h2: '4. Fees & Billing',
      p: 'Use of certain features may require a paid subscription. Fees are billed in advance and are non-refundable except where required by law. We may change our fees with reasonable notice.'),
  _Section(
      h2: '5. Data & Privacy',
      p: 'We process personal data in line with our Privacy Policy. You confirm you have the right to upload any tenant or third-party information you add to the platform.'),
  _Section(
      h2: '6. Limitation of Liability',
      p: 'To the maximum extent permitted by law, RentLoop is not liable for any indirect, incidental, or consequential damages, or for any loss of profits, revenue, or data arising from your use of the platform.'),
  _Section(
      h2: '7. Termination',
      p: 'You may stop using RentLoop at any time. We may suspend or terminate your access if you breach this Agreement or use the platform unlawfully. You may export your data before termination.'),
  _Section(
      h2: '8. Changes to this Agreement',
      p: 'We may publish new or updated versions of this Agreement. When we do, you will be asked to review and accept the new version before continuing to use the platform.'),
  _Section(
      h2: '9. Contact',
      p: 'Questions about this Agreement can be sent to legal@rentloopapp.com.'),
  _Section(
      p: 'By clicking "I Agree" you confirm that you have read, understood, and agree to be bound by this Agreement.'),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class AgreementScreen extends StatefulWidget {
  const AgreementScreen({super.key});

  @override
  State<AgreementScreen> createState() => _AgreementScreenState();
}

class _AgreementScreenState extends State<AgreementScreen> {
  bool _landlordAccepted = false;
  final bool _dpaAccepted = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Legal agreements',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Legal agreements',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 25,
                      color: RLTokens.ink,
                      letterSpacing: -0.4,
                    ),
                  ),
                  const SizedBox(height: 5),
                  const Text(
                    "Review and accept the agreements required to use Rentloop. When new versions are published, you'll need to accept them again.",
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      color: RLTokens.muted,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 18),
                  _AgreementCard(
                    title: 'Landlord Agreement',
                    version: 'v1.0',
                    effective: 'April 3, 2026',
                    accepted: _landlordAccepted,
                    onAccept: () =>
                        setState(() => _landlordAccepted = true),
                  ),
                  const SizedBox(height: 12),
                  _AgreementCard(
                    title: 'Data Processing Addendum',
                    version: 'v1.0',
                    effective: 'April 3, 2026',
                    accepted: _dpaAccepted,
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

// ── Agreement card ────────────────────────────────────────────────────────────

class _AgreementCard extends StatefulWidget {
  const _AgreementCard({
    required this.title,
    required this.version,
    required this.effective,
    required this.accepted,
    this.onAccept,
  });
  final String title;
  final String version;
  final String effective;
  final bool accepted;
  final VoidCallback? onAccept;

  @override
  State<_AgreementCard> createState() => _AgreementCardState();
}

class _AgreementCardState extends State<_AgreementCard> {
  late bool _open;
  late bool _reachedEnd;
  final _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    _open = !widget.accepted;
    _reachedEnd = widget.accepted;
    _scrollCtrl.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_reachedEnd || !_scrollCtrl.hasClients) return;
    final pos = _scrollCtrl.position;
    if (pos.pixels >= pos.maxScrollExtent - 24) {
      setState(() => _reachedEnd = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        children: [
          // ── Header ────────────────────────────────────────────────────────
          GestureDetector(
            onTap: () {
              Haptics.vibrate(HapticsType.selection);
              setState(() => _open = !_open);
            },
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Icon tile
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: RLTokens.fill,
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: const Icon(
                      Icons.description_outlined,
                      size: 20,
                      color: RLTokens.inkSoft,
                    ),
                  ),
                  const SizedBox(width: 13),
                  // Title + version + effective
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                widget.title,
                                style: const TextStyle(
                                  fontFamily: RLTokens.fontSans,
                                  fontSize: 15,
                                  fontWeight: RLTokens.bold,
                                  color: RLTokens.ink,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(
                                border: Border.all(
                                    color: RLTokens.hairline),
                                borderRadius: BorderRadius.circular(5),
                              ),
                              child: Text(
                                widget.version,
                                style: const TextStyle(
                                  fontFamily: RLTokens.fontMono,
                                  fontSize: 10,
                                  fontWeight: RLTokens.semibold,
                                  color: RLTokens.muted,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        Text(
                          'Effective ${widget.effective}',
                          style: const TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12.5,
                            color: RLTokens.muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  // Accepted pill or chevron
                  if (widget.accepted)
                    const RLPill('✓ Accepted',
                        tone: RLTone.success, large: true)
                  else
                    Icon(
                      _open
                          ? Icons.keyboard_arrow_down_rounded
                          : Icons.chevron_right,
                      size: 18,
                      color: RLTokens.micro,
                    ),
                ],
              ),
            ),
          ),

          // ── Expanded body ─────────────────────────────────────────────────
          if (_open) ...[
            // Scrollable legal text
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: RLTokens.fill,
                borderRadius: BorderRadius.circular(RLTokens.rMd),
                border: const Border(
                    top: BorderSide(color: RLTokens.hairlineSoft)),
              ),
              constraints: const BoxConstraints(maxHeight: 320),
              child: SingleChildScrollView(
                controller: _scrollCtrl,
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
                child: const _AgreementBody(),
              ),
            ),

            // Accept zone
            Padding(
              padding: const EdgeInsets.all(16),
              child: widget.accepted
                  ? _AcceptedStamp()
                  : _AcceptZone(
                      reachedEnd: _reachedEnd,
                      onAgree: () async {
                        await Haptics.vibrate(HapticsType.medium);
                        widget.onAccept?.call();
                      },
                    ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Agreement body ────────────────────────────────────────────────────────────

class _AgreementBody extends StatelessWidget {
  const _AgreementBody();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'RENTLOOP PROPERTY OWNER AGREEMENT\n(LANDLORD AGREEMENT)',
          style: TextStyle(
            fontFamily: RLTokens.fontSerif,
            fontSize: 19,
            color: RLTokens.ink,
            letterSpacing: -0.3,
            height: 1.15,
          ),
        ),
        const SizedBox(height: 14),
        ..._kLegalBody.map((s) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (s.h2 != null) ...[
                    Text(
                      s.h2!,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 15,
                        fontWeight: RLTokens.bold,
                        color: RLTokens.ink,
                      ),
                    ),
                    const SizedBox(height: 6),
                  ],
                  Text(
                    s.p,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13.5,
                      color: RLTokens.inkSoft,
                      height: 1.6,
                    ),
                  ),
                ],
              ),
            )),
      ],
    );
  }
}

// ── Accepted stamp ────────────────────────────────────────────────────────────

class _AcceptedStamp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: const [
        Icon(Icons.push_pin_outlined,
            size: 16, color: RLTokens.success),
        SizedBox(width: 8),
        Text(
          'Accepted on Apr 3, 2026',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13,
            fontWeight: RLTokens.semibold,
            color: RLTokens.success,
          ),
        ),
      ],
    );
  }
}

// ── Accept zone (unaccepted state) ────────────────────────────────────────────

class _AcceptZone extends StatelessWidget {
  const _AcceptZone({required this.reachedEnd, required this.onAgree});
  final bool reachedEnd;
  final VoidCallback onAgree;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (!reachedEnd) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              Icon(Icons.keyboard_arrow_down_rounded,
                  size: 14, color: RLTokens.mutedSoft),
              SizedBox(width: 7),
              Text(
                'Scroll to the end to continue',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 12,
                  color: RLTokens.mutedSoft,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
        ],
        GestureDetector(
          onTap: reachedEnd ? onAgree : null,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: reachedEnd ? RLTokens.crimson : RLTokens.fill,
              borderRadius: BorderRadius.circular(RLTokens.rMd),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (reachedEnd) ...[
                  const Icon(Icons.check_rounded,
                      size: 18, color: Colors.white),
                  const SizedBox(width: 8),
                ],
                Text(
                  'I agree',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 15,
                    fontWeight: RLTokens.semibold,
                    color:
                        reachedEnd ? Colors.white : RLTokens.mutedSoft,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
