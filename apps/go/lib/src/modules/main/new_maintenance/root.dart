import 'dart:io';

import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';
import 'attachments.dart';

class AttachmentItem {
  final File file;
  final String type;

  AttachmentItem({required this.file, required this.type});
}

class NewMaintenanceScreen extends ConsumerStatefulWidget {
  const NewMaintenanceScreen({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() =>
      _NewMaintenanceScreen();
}

class _NewMaintenanceScreen extends ConsumerState<NewMaintenanceScreen> {
  final titleController = TextEditingController();
  final descriptionController = TextEditingController();
  String? priority;
  List<AttachmentItem> attachments = [];
  DateTime? selectedDate;
  TimeOfDay? selectedTime;

  final priorities = ['Low', 'Medium', 'High'];

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: selectedDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2030),
    );

    if (picked != null && picked != selectedDate) {
      setState(() {
        selectedDate = picked;
      });
    }
  }

  Future<void> _selectTime(BuildContext context) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: selectedTime ?? TimeOfDay.now(),
    );

    if (picked != null && picked != selectedTime) {
      setState(() {
        selectedTime = picked;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
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
              icon: Icon(Icons.help_outline),
              onPressed: () async {
                await Haptics.vibrate(HapticsType.selection);
              },
            ),
            // child: FilledButton.icon(onPressed: () {}, label: Text('Submit')),
          ),
        ],
      ),

      // body with view
      body: Container(
        padding: EdgeInsets.symmetric(horizontal: 20),
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
                        Validatorless.required('The field is required'),
                      ]),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Description',
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: TextFormField(
                      controller: descriptionController,
                      keyboardType: TextInputType.multiline,
                      style: const TextStyle(fontSize: 18),
                      decoration: InputDecoration(
                        border: const OutlineInputBorder(),
                        helperText: 'Optional',
                        helperStyle: const TextStyle(
                          color: Colors.grey,
                          fontSize: 14,
                        ),
                        // errorText: controllerState.status.isFailed()
                        //     ? controllerState.errorMessage
                        //     : null,
                      ),
                      validator: Validatorless.multiple([
                        Validatorless.required('The field is required'),
                      ]),
                      maxLines: 5,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Preferred Visit Date/Time',
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  const SizedBox(height: 10),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 7,
                          childAspectRatio: 3,
                        ),
                    itemCount: 2,
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        return InkWell(
                          onTap: () => _selectDate(context),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(5),
                              border: Border.all(color: Colors.grey.shade400),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  selectedDate != null
                                      ? selectedDate!.format('MM/dd/yyyy')
                                      : 'Select Date',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                                Icon(
                                  Icons.calendar_today,
                                  color: Colors.grey.shade600,
                                  size: 15,
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      return InkWell(
                        onTap: () => _selectTime(context),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(5),
                            border: Border.all(color: Colors.grey.shade400),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                selectedTime != null
                                    ? selectedTime!.format(context)
                                    : 'Select Time',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              Icon(
                                Icons.time_to_leave,
                                color: Colors.grey.shade600,
                                size: 15,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Priority',
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  const SizedBox(height: 10),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 7,
                          childAspectRatio: 2.5,
                        ),
                    itemCount: priorities.length,
                    itemBuilder: (context, index) {
                      final prio = priorities[index];
                      final isActive = prio == priority;

                      if (isActive) {
                        return FilledButton(
                          onPressed: () async {
                            await Haptics.vibrate(HapticsType.selection);
                          },
                          child: Text(prio),
                        );
                      }

                      return OutlinedButton(
                        onPressed: () async {
                          await Haptics.vibrate(HapticsType.selection);
                          setState(() {
                            priority = prio;
                          });
                        },
                        child: Text(prio),
                      );
                    },
                  ),
                ],
              ),
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
                attachments: attachments,
                setAttachments: (attachments) {
                  setState(() {
                    this.attachments = attachments;
                  });
                },
              ),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: FilledButton(
                  onPressed: () async {
                    await Haptics.vibrate(HapticsType.selection);
                    // handle submit
                  },
                  child: const Text('Submit Request'),
                ),
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }
}
