import 'package:flutter/foundation.dart';

import 'package:rentloop_manager/src/lib/document_utils.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';

enum ChecklistSection {
  unit('unit', 'Select a unit'),
  tenant('tenant', 'Add tenant details'),
  moveIn('movein', 'Move-in setup'),
  financial('financial', 'Financial setup'),
  docs('docs', 'Lease docs setup');

  const ChecklistSection(this.key, this.label);

  final String key;
  final String label;
}

enum ChecklistStepState { todo, progress, done, locked, blocked, attention }

@immutable
class ChecklistStep {
  const ChecklistStep({
    required this.section,
    required this.state,
    required this.doneItems,
    required this.totalItems,
  });

  final ChecklistSection section;
  final ChecklistStepState state;
  final int doneItems;
  final int totalItems;

  bool get isSatisfied =>
      state == ChecklistStepState.done || state == ChecklistStepState.locked;

  bool get hasItems => totalItems > 0;

  bool get allItemsDone => totalItems > 0 && doneItems == totalItems;
}

@immutable
class ApplicationChecklist {
  const ApplicationChecklist({
    required this.steps,
    required this.progress,
    required this.canApprove,
  });

  final List<ChecklistStep> steps;
  final double progress;
  final bool canApprove;

  ChecklistStep step(ChecklistSection section) =>
      steps.firstWhere((s) => s.section == section);
}

const _inProgress = 'TenantApplication.Status.InProgress';
const _completed = 'TenantApplication.Status.Completed';
const _unitOccupied = 'Unit.Status.Occupied';

const _dependsOn = {
  ChecklistSection.unit: <ChecklistSection>[],
  ChecklistSection.tenant: <ChecklistSection>[],
  ChecklistSection.moveIn: [ChecklistSection.unit],
  ChecklistSection.financial: [ChecklistSection.moveIn],
  ChecklistSection.docs: [ChecklistSection.financial],
};

bool _has(String? v) => v != null && v.isNotEmpty;

bool _all(List<bool> checks) => checks.every((c) => c);

List<bool> _unitItems(TenantApplicationModel a) => [a.desiredUnit != null];

List<bool> _tenantItems(TenantApplicationModel a) => [
  _all([
    _has(a.firstName),
    _has(a.lastName),
    _has(a.phone),
    _has(a.gender),
    a.dateOfBirth != null,
    _has(a.nationality),
    _has(a.maritalStatus),
    _has(a.currentAddress),
  ]),
  _all([_has(a.idType), _has(a.idNumber)]),
  _all([
    _has(a.employerType),
    _has(a.occupation),
    _has(a.employer),
    _has(a.occupationAddress),
  ]),
  _all([
    _has(a.emergencyContactName),
    _has(a.emergencyContactPhone),
    _has(a.relationshipToEmergencyContact),
  ]),
];

List<bool> _moveInItems(TenantApplicationModel a) => [
  a.desiredMoveInDate != null,
  _has(a.stayDurationFrequency),
  a.stayDuration != null,
];

List<bool> _financialItems(TenantApplicationModel a) => [
  a.rentFee != null,
  a.financialAccount != null,
];

List<bool> _docsItems(TenantApplicationModel a) {
  final mode = a.leaseAgreementDocumentMode;
  if (!_has(mode)) return const [];

  final isManual = mode == 'MANUAL';
  final signatures = (a.leaseAgreementDocumentSignatures ?? [])
      .where((s) => s.documentId == a.leaseAgreementDocumentId)
      .toList();
  bool hasRole(String role) => signatures.any((s) => s.role == role);
  final signedCount = {
    'pm_witness': signatures.where((s) => s.role == 'PM_WITNESS').length,
    'tenant_witness': signatures
        .where((s) => s.role == 'TENANT_WITNESS')
        .length,
  };

  final seen = {'pm_witness': 0, 'tenant_witness': 0};
  final witnessItems = <bool>[];
  for (final node in getWitnessNodesFromContent(
    a.leaseAgreementDocument?.content,
  )) {
    final roleIdx = seen[node.role] ?? 0;
    seen[node.role] = roleIdx + 1;
    witnessItems.add(isManual || roleIdx < (signedCount[node.role] ?? 0));
  }

  return [
    mode == 'ONLINE'
        ? _has(a.leaseAgreementDocumentId)
        : _has(a.leaseAgreementDocumentUrl),
    isManual || hasRole('PROPERTY_MANAGER'),
    isManual || hasRole('TENANT'),
    ...witnessItems,
  ];
}

List<bool> _items(ChecklistSection section, TenantApplicationModel a) =>
    switch (section) {
      ChecklistSection.unit => _unitItems(a),
      ChecklistSection.tenant => _tenantItems(a),
      ChecklistSection.moveIn => _moveInItems(a),
      ChecklistSection.financial => _financialItems(a),
      ChecklistSection.docs => _docsItems(a),
    };

ApplicationChecklist computeApplicationChecklist(TenantApplicationModel a) {
  final approved = a.status == _completed;
  final unitTaken =
      a.status == _inProgress && a.desiredUnit?.status == _unitOccupied;
  final resolved = <ChecklistSection, ChecklistStep>{};
  var canApprove = true;

  for (final section in ChecklistSection.values) {
    final items = _items(section, a);
    final doneItems = items.where((i) => i).length;
    final complete = items.isNotEmpty && doneItems == items.length;
    final blocked = _dependsOn[section]!.any(
      (d) => !(resolved[d]?.isSatisfied ?? false),
    );

    final ChecklistStepState state;
    if (section == ChecklistSection.unit && unitTaken) {
      state = ChecklistStepState.attention;
    } else if (blocked) {
      state = ChecklistStepState.blocked;
    } else if (complete) {
      state = approved ? ChecklistStepState.locked : ChecklistStepState.done;
    } else if (doneItems > 0) {
      state = ChecklistStepState.progress;
    } else {
      state = ChecklistStepState.todo;
    }

    if (items.isNotEmpty && !complete) canApprove = false;

    resolved[section] = ChecklistStep(
      section: section,
      state: state,
      doneItems: doneItems,
      totalItems: items.length,
    );
  }

  final steps = [for (final s in ChecklistSection.values) resolved[s]!];
  final satisfied = steps.where((s) => s.isSatisfied).length;
  return ApplicationChecklist(
    steps: steps,
    progress: satisfied / steps.length,
    canApprove: canApprove,
  );
}
