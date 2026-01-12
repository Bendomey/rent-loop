import 'package:flutter/cupertino.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';
import 'package:rentloop_go/src/constants.dart';
import 'package:rentloop_go/src/lib/launch_external_site.dart';
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
                        'Edit profile',
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
            onTap: () => context.push('/more/lease-agreement'),
            child: const ListTile(
              leading: Icon(Icons.dashboard_customize_outlined),
              trailing: Icon(Icons.chevron_right, color: Colors.grey),
              title: Text('Lease Details'),
            ),
          ),
          InkWell(
            onTap: () => context.push('/more/documents'),
            child: const ListTile(
              leading: Icon(Icons.document_scanner_outlined),
              trailing: Icon(Icons.chevron_right, color: Colors.grey),
              title: Text('Documents'),
            ),
          ),
          InkWell(
            onTap: () => context.push('/more/announcements'),
            child: const ListTile(
              leading: Icon(Icons.notifications_outlined),
              trailing: Icon(Icons.chevron_right, color: Colors.grey),
              title: Text('Announcements'),
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
            onTap: () => launchExternalSite(context, WEBSITE),
            child: const ListTile(
              leading: Icon(Icons.call_outlined),
              trailing: Icon(Icons.open_in_new, color: Colors.grey),
              title: Text('Contact Us'),
            ),
          ),
          InkWell(
            onTap: () => launchExternalSite(context, '$WEBSITE/privacy'),
            child: const ListTile(
              leading: Icon(Icons.file_copy_outlined),
              trailing: Icon(Icons.open_in_new, color: Colors.grey),
              title: Text('Privacy Policy'),
            ),
          ),
          InkWell(
            onTap: () => launchExternalSite(context, '$WEBSITE/faqs'),
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
            onTap: () => SharePlus.instance.share(
              ShareParams(
                subject: 'Tell others about Rentloop',
                uri: Uri.parse(WEBSITE),
              ),
            ),
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
            onTap: () => context.push('/more/delete-account'),
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
