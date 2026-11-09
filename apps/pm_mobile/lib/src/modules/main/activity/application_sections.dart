import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/lib/application_checklist.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_data.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_detail_pages.dart';
import 'package:rentloop_manager/src/modules/main/activity/financial/financial_page.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_detail_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

Widget applicationSectionPage(
  ChecklistSection section,
  ApplicationDetailData data,
  String propertyId,
) => switch (section) {
  ChecklistSection.unit => ApplicationUnitPage(
    data: data,
    propertyId: propertyId,
  ),
  ChecklistSection.tenant => ApplicationTenantPage(
    data: data,
    propertyId: propertyId,
  ),
  ChecklistSection.moveIn => ApplicationMoveInPage(
    data: data,
    propertyId: propertyId,
  ),
  ChecklistSection.financial => ApplicationFinancialPage(
    data: data,
    propertyId: propertyId,
  ),
  ChecklistSection.docs => ApplicationDocsPage(
    data: data,
    propertyId: propertyId,
  ),
};

/// A checklist step opened from the hub, with a bar that walks on to the
/// following step. Each step replaces the last so back always lands on the
/// hub and its refreshed progress.
class ApplicationSectionFlow extends ConsumerWidget {
  const ApplicationSectionFlow({
    super.key,
    required this.section,
    required this.data,
    required this.propertyId,
  });

  final ChecklistSection section;
  final ApplicationDetailData data;
  final String propertyId;

  ChecklistSection? get _next {
    final i = section.index + 1;
    return i < ChecklistSection.values.length
        ? ChecklistSection.values[i]
        : null;
  }

  Future<void> _continue(BuildContext context, WidgetRef ref) async {
    await Haptics.vibrate(HapticsType.selection);
    if (!context.mounted) return;
    final next = _next;
    if (next == null) {
      Navigator.of(context).pop();
      return;
    }
    final model = ref
        .read(applicationDetailProvider(propertyId, data.id))
        .valueOrNull;
    final latest = model == null
        ? data
        : ApplicationDetailData.fromApplicationModel(model);
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => ApplicationSectionFlow(
          section: next,
          data: latest,
          propertyId: propertyId,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final next = _next;
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: applicationSectionPage(section, data, propertyId),
      bottomNavigationBar: Container(
        padding: EdgeInsets.fromLTRB(
          RLTokens.gutter,
          12,
          RLTokens.gutter,
          12 + MediaQuery.of(context).padding.bottom,
        ),
        decoration: const BoxDecoration(
          color: RLTokens.surface,
          border: Border(top: BorderSide(color: RLTokens.hairline)),
          boxShadow: RLTokens.elevBar,
        ),
        child: RLBtn(
          label: next == null ? 'Back to overview' : 'Next: ${next.label}',
          kind: next == null ? RLBtnKind.light : RLBtnKind.primary,
          full: true,
          onPressed: () => _continue(context, ref),
        ),
      ),
    );
  }
}
