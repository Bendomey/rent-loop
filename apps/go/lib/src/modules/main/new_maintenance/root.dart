import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';
import 'package:modal_bottom_sheet/modal_bottom_sheet.dart';
import 'package:rentloop_go/src/repository/notifiers/maintenance/create_maintenance_request_notifier/create_maintenance_request_notifier.dart';
import 'attachments.dart';

class NewMaintenanceScreen extends ConsumerStatefulWidget {
  const NewMaintenanceScreen({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() =>
      _NewMaintenanceScreen();
}

class _NewMaintenanceScreen extends ConsumerState<NewMaintenanceScreen> {
  final _formKey = GlobalKey<FormState>();
  final titleController = TextEditingController();
  final descriptionController = TextEditingController();
  String? priority;
  String? category;

  bool _hasOngoingUploads = false;
  List<String> _uploadedUrls = [];

  static const _priorities = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];
  static const _categories = ['PLUMBING', 'ELECTRICAL', 'HVAC', 'OTHER'];

  String _priorityLabel(String p) => switch (p) {
    'LOW' => 'Low',
    'MEDIUM' => 'Medium',
    'HIGH' => 'High',
    'EMERGENCY' => 'Emergency',
    _ => p,
  };

  String _categoryLabel(String c) => switch (c) {
    'PLUMBING' => 'Plumbing',
    'ELECTRICAL' => 'Electrical',
    'HVAC' => 'HVAC',
    'OTHER' => 'Other',
    _ => c,
  };

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    await Haptics.vibrate(HapticsType.selection);

    final leaseId = ref.read(currentLeaseNotifierProvider)?.id;
    if (leaseId == null) return;

    final newId = await ref
        .read(createMaintenanceRequestNotifierProvider.notifier)
        .submit(
          leaseId: leaseId,
          title: titleController.text.trim(),
          description: descriptionController.text.trim(),
          category: category!,
          priority: priority!,
          attachments: _uploadedUrls,
        );

    if (newId != null && mounted) {
      context.pushReplacement('/maintenance/$newId');
    }
  }

  @override
  void dispose() {
    titleController.dispose();
    descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(createMaintenanceRequestNotifierProvider);
    final isLoading = state.status.isLoading();
    final isSubmitDisabled = isLoading || _hasOngoingUploads;

    // Show API error
    ref.listen(createMaintenanceRequestNotifierProvider, (_, next) {
      if (next.status.isFailed() && next.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.errorMessage!),
            backgroundColor: Colors.red,
          ),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Submit An Issue',
          style: Theme.of(context).textTheme.titleLarge!.copyWith(fontSize: 20),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 10),
            child: IconButton(
              icon: const Icon(Icons.help_outline),
              onPressed: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (!context.mounted) return;
                showCupertinoModalBottomSheet(
                  context: context,
                  builder: (_) => const _MaintenanceHelpSheet(),
                );
              },
            ),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                Text(
                  'General Information',
                  style: Theme.of(
                    context,
                  ).textTheme.displaySmall!.copyWith(fontSize: 22),
                ),
                const SizedBox(height: 5),
                Text(
                  'Please provide the details of the maintenance issue you are experiencing.',
                  style: Theme.of(context).textTheme.bodySmall!.copyWith(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 20),

                // Title
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Case Title *',
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: TextFormField(
                        controller: titleController,
                        keyboardType: TextInputType.name,
                        style: const TextStyle(fontSize: 18),
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                        ),
                        validator: Validatorless.multiple([
                          Validatorless.required('Title is required'),
                        ]),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Description
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Description *',
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: TextFormField(
                        controller: descriptionController,
                        keyboardType: TextInputType.multiline,
                        style: const TextStyle(fontSize: 18),
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                        ),
                        validator: Validatorless.multiple([
                          Validatorless.required('Description is required'),
                        ]),
                        maxLines: 5,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Category
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Category *',
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: DropdownButtonFormField<String>(
                        value: category,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          hintText: 'Select a category',
                        ),
                        items: _categories
                            .map(
                              (c) => DropdownMenuItem(
                                value: c,
                                child: Text(_categoryLabel(c)),
                              ),
                            )
                            .toList(),
                        onChanged: (v) async {
                          await Haptics.vibrate(HapticsType.selection);
                          setState(() => category = v);
                        },
                        validator: (v) =>
                            v == null ? 'Please select a category' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Priority
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Priority *',
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: DropdownButtonFormField<String>(
                        value: priority,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          hintText: 'Select a priority',
                        ),
                        items: _priorities
                            .map(
                              (p) => DropdownMenuItem(
                                value: p,
                                child: Text(_priorityLabel(p)),
                              ),
                            )
                            .toList(),
                        onChanged: (v) async {
                          await Haptics.vibrate(HapticsType.selection);
                          setState(() => priority = v);
                        },
                        validator: (v) =>
                            v == null ? 'Please select a priority' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                Text(
                  'Photos & Videos',
                  style: Theme.of(
                    context,
                  ).textTheme.displaySmall!.copyWith(fontSize: 22),
                ),
                const SizedBox(height: 5),
                Text(
                  'Add any relevant photos or videos to help us understand the issue better.',
                  style: Theme.of(context).textTheme.bodySmall!.copyWith(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 10),
                ManageAttachmentsWidget(
                  onUploadStateChanged:
                      ({required hasOngoingUploads, required uploadedUrls}) {
                        setState(() {
                          _hasOngoingUploads = hasOngoingUploads;
                          _uploadedUrls = uploadedUrls;
                        });
                      },
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: FilledButton(
                    onPressed: isSubmitDisabled ? null : _submit,
                    child: isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text('Submit Request'),
                  ),
                ),
                const SizedBox(height: 30),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MaintenanceHelpSheet extends StatelessWidget {
  const _MaintenanceHelpSheet();

  @override
  Widget build(BuildContext context) {
    return Material(
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Theme.of(
                        context,
                      ).colorScheme.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.construction_outlined,
                      color: Theme.of(context).colorScheme.primary,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Text(
                    'Maintenance Requests',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Use this form to report any maintenance issue in your unit. Here\'s how to get the fastest response:',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade700,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 20),
              ..._tips.map(
                (tip) => Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        tip.icon,
                        size: 20,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              tip.title,
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              tip.body,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: Colors.grey.shade600,
                                    height: 1.4,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(50),
                    ),
                  ),
                  child: const Text('Got it'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HelpTip {
  final IconData icon;
  final String title;
  final String body;
  const _HelpTip({required this.icon, required this.title, required this.body});
}

const _tips = [
  _HelpTip(
    icon: Icons.title_outlined,
    title: 'Be specific in the title',
    body:
        'A clear title (e.g. "Kitchen tap leaking") helps us assign the right technician faster.',
  ),
  _HelpTip(
    icon: Icons.photo_camera_outlined,
    title: 'Attach photos or videos',
    body: 'Visual evidence speeds up diagnosis and avoids unnecessary visits.',
  ),
  _HelpTip(
    icon: Icons.flag_outlined,
    title: 'Set the right priority',
    body:
        'Use Emergency only for urgent safety hazards (floods, electrical faults). Routine issues should be Low or Medium.',
  ),
  _HelpTip(
    icon: Icons.track_changes_outlined,
    title: 'Track your request',
    body:
        'Once submitted you can follow the repair progress from the Maintenance tab.',
  ),
];
