import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';

class DeleteAccountScreen extends ConsumerStatefulWidget {
  const DeleteAccountScreen({super.key});

  @override
  ConsumerState<DeleteAccountScreen> createState() =>
      _DeleteAccountScreenState();
}

class _DeleteAccountScreenState extends ConsumerState<DeleteAccountScreen> {
  bool _confirmed = false;

  Future<void> _showConfirmDialog() async {
    await Haptics.vibrate(HapticsType.heavy);
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete account?'),
        backgroundColor: Colors.white,
        content: const Text(
          'This will permanently remove your access to Rentloop Go. Your active leases will not be affected — contact your landlord to reinstate your account at any time.',
        ),
        actions: [
          TextButton(
            onPressed: () async {
              await Haptics.vibrate(HapticsType.light);
              Navigator.pop(ctx);
            },
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              await Haptics.vibrate(HapticsType.heavy);
              Navigator.pop(ctx);
              // TODO: call DELETE /api/v1/tenant-accounts/me when endpoint is available,
              // then clear state and navigate to /auth.
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Account deletion is not available yet. Please contact your landlord.',
                  ),
                ),
              );
            },
            child: const Text('Yes, delete my account'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Delete Account',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Warning icon
          Center(
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.delete_forever_outlined,
                size: 40,
                color: Colors.red.shade400,
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Are you sure?',
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          Text(
            'Deleting your account is permanent. Here\'s what happens:',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey.shade600,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 24),

          // What you'll lose
          _SectionLabel(label: "What you'll lose"),
          const SizedBox(height: 10),
          _InfoTile(
            icon: Icons.no_accounts_outlined,
            iconColor: Colors.red.shade400,
            bgColor: Colors.red.shade50,
            title: 'Account access',
            subtitle: 'You will no longer be able to log in to Rentloop Go.',
          ),
          _InfoTile(
            icon: Icons.notifications_off_outlined,
            iconColor: Colors.red.shade400,
            bgColor: Colors.red.shade50,
            title: 'Notifications',
            subtitle:
                'You will stop receiving rent reminders and property announcements.',
          ),
          _InfoTile(
            icon: Icons.history_outlined,
            iconColor: Colors.red.shade400,
            bgColor: Colors.red.shade50,
            title: 'Payment history',
            subtitle:
                'In-app access to your payment records will no longer be available.',
          ),

          const SizedBox(height: 20),

          // What you keep
          _SectionLabel(label: "What you keep"),
          const SizedBox(height: 10),
          _InfoTile(
            icon: Icons.home_outlined,
            iconColor: Colors.green.shade600,
            bgColor: Colors.green.shade50,
            title: 'Your active leases',
            subtitle:
                'Your lease agreements remain in effect. Deleting your account does not affect your tenancy.',
          ),

          const SizedBox(height: 20),

          // Reinstatement note
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.shade100),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.info_outline, size: 20, color: Colors.blue.shade600),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Changed your mind later? Reach out to your landlord or property manager and they can reinstate your account at any time.',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.blue.shade800,
                      height: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          // Confirmation checkbox
          InkWell(
            borderRadius: BorderRadius.circular(8),
            onTap: () async {
              await Haptics.vibrate(HapticsType.light);
              setState(() => _confirmed = !_confirmed);
            },
            child: Row(
              children: [
                Checkbox(
                  value: _confirmed,
                  activeColor: Colors.red,
                  onChanged: (v) async {
                    await Haptics.vibrate(HapticsType.light);
                    setState(() => _confirmed = v ?? false);
                  },
                ),
                Expanded(
                  child: Text(
                    'I understand that deleting my account is permanent.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          SizedBox(
            width: double.infinity,
            height: 52,
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: _confirmed ? Colors.red : Colors.grey.shade300,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(50),
                ),
              ),
              onPressed: _confirmed ? _showConfirmDialog : null,
              child: const Text(
                'Delete my account',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ),
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;

  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: Theme.of(context).textTheme.labelLarge?.copyWith(
        color: Colors.grey.shade600,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.4,
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String title;
  final String subtitle;

  const _InfoTile({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: bgColor, shape: BoxShape.circle),
            child: Icon(icon, size: 18, color: iconColor),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade600,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
