import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';
import 'package:rentloop_go/src/constants.dart';
import 'package:rentloop_go/src/lib/launch_external_site.dart';
import 'package:rentloop_go/src/repository/providers/announcements_provider.dart';
import 'package:rentloop_go/src/repository/providers/checklists_provider.dart';
import './logout_button_widget.dart';
import 'package:share_plus/share_plus.dart';
import './user_card_widget.dart';

class MoreScreen extends ConsumerStatefulWidget {
  const MoreScreen({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _MoreScreen();
}

class _MoreScreen extends ConsumerState<MoreScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 10),
            child: LogoutButtonWidget(),
          ),
        ],
      ),
      body: ListView(
        children: <Widget>[
          Center(
            child: Column(
              children: [
                const UserCardWidget(),
                Padding(
                  padding: const EdgeInsets.only(top: 20),
                  child: SizedBox(
                    height: 50,
                    child: FilledButton(
                      onPressed: () => context.push('/more/profile'),
                      child: const Text(
                        'View profile',
                        style: TextStyle(fontSize: 17),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 30),
          Divider(color: Colors.grey.shade300),
          const Padding(
            padding: EdgeInsets.only(left: 15, top: 10, bottom: 10),
            child: Text(
              'Account',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
            ),
          ),
          InkWell(
            onTap: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) context.push('/more/lease-details');
            },
            child: ListTile(
              leading: const Icon(Icons.document_scanner_outlined),
              trailing: ref.watch(checklistTotalNotifierProvider) > 0
                  ? Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Badge.count(
                          count: ref.watch(checklistTotalNotifierProvider),
                          backgroundColor: Colors.blue,
                        ),
                        const SizedBox(width: 6),
                        const Icon(Icons.chevron_right, color: Colors.grey),
                      ],
                    )
                  : const Icon(Icons.chevron_right, color: Colors.grey),
              title: const Text('Lease Details'),
            ),
          ),
          InkWell(
            onTap: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) context.push('/more/announcements');
            },
            child: ListTile(
              leading: const Icon(Icons.notifications_outlined),
              trailing: ref.watch(announcementTotalNotifierProvider) > 0
                  ? Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Badge.count(
                          count: ref.watch(announcementTotalNotifierProvider),
                          backgroundColor: Colors.red,
                        ),
                        const SizedBox(width: 6),
                        const Icon(Icons.chevron_right, color: Colors.grey),
                      ],
                    )
                  : const Icon(Icons.chevron_right, color: Colors.grey),
              title: const Text('Announcements'),
            ),
          ),
          Divider(color: Colors.grey.shade300),
          const Padding(
            padding: EdgeInsets.only(left: 15, top: 10, bottom: 10),
            child: Text(
              'Help',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
            ),
          ),
          InkWell(
            onTap: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) launchExternalSite(context, WEBSITE);
            },
            child: const ListTile(
              leading: Icon(Icons.call_outlined),
              trailing: Icon(Icons.open_in_new, color: Colors.grey),
              title: Text('Contact Us'),
            ),
          ),
          InkWell(
            onTap: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted)
                launchExternalSite(context, '$WEBSITE/privacy-policy');
            },
            child: const ListTile(
              leading: Icon(Icons.file_copy_outlined),
              trailing: Icon(Icons.open_in_new, color: Colors.grey),
              title: Text('Privacy Policy'),
            ),
          ),
          InkWell(
            onTap: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted)
                launchExternalSite(context, '$WEBSITE/#faqs');
            },
            child: const ListTile(
              leading: Icon(Icons.question_mark_sharp),
              trailing: Icon(Icons.open_in_new, color: Colors.grey),
              title: Text('FAQs'),
            ),
          ),
          Divider(color: Colors.grey.shade300),
          const Padding(
            padding: EdgeInsets.only(left: 15, top: 10, bottom: 10),
            child: Text(
              'Others',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
            ),
          ),
          InkWell(
            onTap: () async {
              await Haptics.vibrate(HapticsType.selection);
              SharePlus.instance.share(
                ShareParams(
                  subject: 'Tell others about Rentloop',
                  uri: Uri.parse(WEBSITE),
                ),
              );
            },
            child: const ListTile(
              leading: Icon(Icons.card_giftcard),
              trailing: Icon(Icons.chevron_right, color: Colors.grey),
              title: Text('Refer a friend'),
            ),
          ),
          Divider(color: Colors.grey.shade300),
          const Padding(
            padding: EdgeInsets.only(left: 15, top: 10, bottom: 10),
            child: Text(
              'Danger',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
            ),
          ),
          InkWell(
            onTap: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) context.push('/more/delete-account');
            },
            child: const ListTile(
              leading: Icon(Icons.delete, color: Colors.red),
              title: Text(
                'Delete Account',
                style: TextStyle(color: Colors.red),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
