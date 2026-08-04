import 'package:flutter/foundation.dart';

import 'package:rentloop_manager/src/lib/document_utils.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';

/// The application completeness checklist, ported one-for-one from the web's
/// `use-calculate-checklist.ts` and its five `checklist-*.ts` builders. Both
/// clients must agree on what "complete" means, so this file is a deliberate
/// mirror — change it only alongside the web.
@immutable
class ApplicationChecklistItem {
  const ApplicationChecklistItem(this.label, {required this.done});

  final String label;
  final bool done;
}

@immutable
class ApplicationChecklistSection {
  const ApplicationChecklistSection({
    required this.key,
    required this.label,
    required this.items,
  });

  final String key;
  final String label;
  final List<ApplicationChecklistItem> items;

  int get doneCount => items.where((i) => i.done).length;

  /// An empty section passes the approval gate vacuously (docs are optional
  /// until a document is attached), but only a section with items counts as
  /// complete for display.
  bool get complete => items.isNotEmpty && doneCount == items.length;
}

bool _has(String? v) => v != null && v.isNotEmpty;

ApplicationChecklistSection getUnitSection(TenantApplicationModel a) =>
    ApplicationChecklistSection(
      key: 'unit',
      label: 'Select a unit',
      items: [
        ApplicationChecklistItem('Unit selected', done: a.desiredUnit != null),
      ],
    );

ApplicationChecklistSection getTenantDetailsSection(TenantApplicationModel a) =>
    ApplicationChecklistSection(
      key: 'tenant',
      label: 'Add tenant details',
      items: [
        ApplicationChecklistItem('First name', done: _has(a.firstName)),
        ApplicationChecklistItem('Last name', done: _has(a.lastName)),
        ApplicationChecklistItem('Phone', done: _has(a.phone)),
        ApplicationChecklistItem('Gender', done: _has(a.gender)),
        ApplicationChecklistItem('Date of birth', done: a.dateOfBirth != null),
        ApplicationChecklistItem('Nationality', done: _has(a.nationality)),
        ApplicationChecklistItem('Marital status', done: _has(a.maritalStatus)),
        ApplicationChecklistItem('ID type', done: _has(a.idType)),
        ApplicationChecklistItem('ID number', done: _has(a.idNumber)),
        ApplicationChecklistItem(
          'Current address',
          done: _has(a.currentAddress),
        ),
        ApplicationChecklistItem(
          'Emergency contact name',
          done: _has(a.emergencyContactName),
        ),
        ApplicationChecklistItem(
          'Emergency contact phone',
          done: _has(a.emergencyContactPhone),
        ),
        ApplicationChecklistItem(
          'Relationship to emergency contact',
          done: _has(a.relationshipToEmergencyContact),
        ),
        ApplicationChecklistItem('Employment type', done: _has(a.employerType)),
        ApplicationChecklistItem('Occupation', done: _has(a.occupation)),
        ApplicationChecklistItem('Employer', done: _has(a.employer)),
        ApplicationChecklistItem(
          'Occupation address',
          done: _has(a.occupationAddress),
        ),
      ],
    );

ApplicationChecklistSection getMoveInSection(TenantApplicationModel a) =>
    ApplicationChecklistSection(
      key: 'movein',
      label: 'Move-in setup',
      items: [
        ApplicationChecklistItem(
          'Move-in date',
          done: a.desiredMoveInDate != null,
        ),
        ApplicationChecklistItem(
          'Stay duration frequency',
          done: _has(a.stayDurationFrequency),
        ),
        ApplicationChecklistItem('Stay duration', done: a.stayDuration != null),
      ],
    );

ApplicationChecklistSection getFinancialSection(TenantApplicationModel a) {
  final invoice = a.applicationPaymentInvoice;
  return ApplicationChecklistSection(
    key: 'financial',
    label: 'Financial setup',
    items: [
      ApplicationChecklistItem('Rent fee', done: a.rentFee != null),
      ApplicationChecklistItem(
        'Payment frequency',
        done: _has(a.paymentFrequency),
      ),
      ApplicationChecklistItem('Invoice generated', done: invoice != null),
      ApplicationChecklistItem('Invoice paid', done: invoice?.isPaid ?? false),
    ],
  );
}

/// Docs are optional — with no document mode set the section is empty and
/// passes the approval gate vacuously. Witness rows are not fixed: they are
/// authored into the document body, so they are read out of its content.
ApplicationChecklistSection getDocsSection(TenantApplicationModel a) {
  const key = 'docs';
  const label = 'Lease docs setup';

  final mode = a.leaseAgreementDocumentMode;
  if (!_has(mode)) {
    return const ApplicationChecklistSection(key: key, label: label, items: []);
  }

  final isManual = mode == 'MANUAL';

  final signatures = (a.leaseAgreementDocumentSignatures ?? [])
      .where((s) => s.documentId == a.leaseAgreementDocumentId)
      .toList();
  bool hasRole(String role) => signatures.any((s) => s.role == role);
  final pmWitnessSignatures = signatures
      .where((s) => s.role == 'PM_WITNESS')
      .toList();
  final tenantWitnessSignatures = signatures
      .where((s) => s.role == 'TENANT_WITNESS')
      .toList();

  final witnessNodes = getWitnessNodesFromContent(
    a.leaseAgreementDocument?.content,
  );
  final pmWitnessCount = witnessNodes
      .where((n) => n.role == 'pm_witness')
      .length;
  final tenantWitnessCount = witnessNodes
      .where((n) => n.role == 'tenant_witness')
      .length;

  final witnessItems = <ApplicationChecklistItem>[];
  for (var i = 0; i < witnessNodes.length; i++) {
    final node = witnessNodes[i];
    // How many nodes of THIS role came before it — the index into that role's
    // signature rows.
    final roleIdx = witnessNodes
        .take(i)
        .where((n) => n.role == node.role)
        .length;
    final isPm = node.role == 'pm_witness';
    final sigs = isPm ? pmWitnessSignatures : tenantWitnessSignatures;
    final showTag = isPm ? pmWitnessCount > 1 : tenantWitnessCount > 1;
    final itemLabel = showTag ? '${node.label} #${roleIdx + 1}' : node.label;
    witnessItems.add(
      ApplicationChecklistItem(
        '$itemLabel signed',
        done: isManual || roleIdx < sigs.length,
      ),
    );
  }

  return ApplicationChecklistSection(
    key: key,
    label: label,
    items: [
      ApplicationChecklistItem(
        'Document uploaded',
        done: mode == 'ONLINE'
            ? _has(a.leaseAgreementDocumentId)
            : _has(a.leaseAgreementDocumentUrl),
      ),
      ApplicationChecklistItem(
        'Manager signed',
        done: isManual || hasRole('PROPERTY_MANAGER'),
      ),
      ApplicationChecklistItem(
        'Tenant signed',
        done: isManual || hasRole('TENANT'),
      ),
      ...witnessItems,
    ],
  );
}

/// The five sections, in the order the hub renders them.
List<ApplicationChecklistSection> buildApplicationChecklist(
  TenantApplicationModel a,
) => [
  getUnitSection(a),
  getTenantDetailsSection(a),
  getMoveInSection(a),
  getFinancialSection(a),
  getDocsSection(a),
];

/// Percentage of the five sections that are fully complete. Empty sections
/// count as incomplete for display, matching the web.
double applicationProgress(TenantApplicationModel a) {
  final sections = buildApplicationChecklist(a);
  final done = sections.where((s) => s.complete).length;
  return done / sections.length * 100;
}

/// Approval gate — only sections that actually carry items must pass.
bool canApproveApplication(TenantApplicationModel a) {
  final required = buildApplicationChecklist(
    a,
  ).where((s) => s.items.isNotEmpty);
  return required.isEmpty || required.every((s) => s.complete);
}
