// Seed data for the Application Info screen.
//
// Field names deliberately mirror the tenant-application REST payload
// (`first_name`, `stay_duration_frequency`, `rent_fee` in pesewas, …) so
// swapping this for a real `TenantApplicationModel` later is a field-for-field
// change rather than a rewrite. Money is held as integer pesewas, matching the
// backend and the rest of this app — see lib/src/lib/money.dart.

import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:rentloop_manager/src/lib/application_checklist.dart';
import 'package:rentloop_manager/src/lib/application_utils.dart';
import 'package:rentloop_manager/src/lib/document_utils.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';

// ── Option sets (mirror the web zod enums) ───────────────────────────────────

const kGenderOptions = {'MALE': 'Male', 'FEMALE': 'Female'};

const kMaritalStatusOptions = {
  'SINGLE': 'Single',
  'MARRIED': 'Married',
  'DIVORCED': 'Divorced',
  'WIDOWED': 'Widowed',
};

const kIdTypeOptions = {
  'PASSPORT': 'Passport',
  'DRIVER_LICENSE': "Driver's License",
  'GHANA_CARD': 'Ghana Card',
};

String? idTypeDisplay(String? apiValue) =>
    kIdTypeOptions[apiValue == 'NATIONAL_ID' ? 'GHANA_CARD' : apiValue];

/// The backend stamps SELF on every non-bulk application, including ones a
/// manager enters, so only a file upload can be named.
String? submittedByLabel(String? source) =>
    source == 'CSV_BULK' ? 'from a file upload' : null;

const kEmployerTypeOptions = {'STUDENT': 'Student', 'WORKER': 'Worker'};

const kStayFrequencyOptions = {
  'HOURLY': 'Hourly',
  'DAILY': 'Daily',
  'WEEKLY': 'Weekly',
  'MONTHLY': 'Monthly',
};

/// Singular/plural period noun for a stay frequency — mirrors the web's
/// `getPaymentFrequencyPeriodLabel`.
String periodLabel(String? frequency, int count) {
  final one = switch (frequency) {
    'HOURLY' => 'hour',
    'DAILY' => 'day',
    'WEEKLY' => 'week',
    'MONTHLY' => 'month',
    'QUARTERLY' => 'quarter',
    'BIANNUALLY' => 'half-year',
    'ANNUALLY' => 'year',
    _ => 'period',
  };
  return count == 1 ? one : '${one}s';
}

// ── Formatting ───────────────────────────────────────────────────────────────

const _months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

String formatApplicationDate(DateTime d) =>
    '${_months[d.month - 1]} ${d.day}, ${d.year}';

// ── Sub-models ───────────────────────────────────────────────────────────────

@immutable
class ApplicationApplicant {
  const ApplicationApplicant({
    required this.firstName,
    required this.lastName,
    this.otherNames,
    this.gender,
    this.maritalStatus,
    required this.email,
    this.phone,
    this.dateOfBirth,
    this.profilePhotoUrl,
  });

  final String firstName;
  final String lastName;
  final String? otherNames;
  final String? gender;
  final String? maritalStatus;
  final String email;
  final String? phone;
  final DateTime? dateOfBirth;
  final String? profilePhotoUrl;

  String get fullName =>
      [firstName, lastName].where((s) => s.isNotEmpty).join(' ');

  ApplicationApplicant copyWith({
    String? firstName,
    String? lastName,
    String? Function()? otherNames,
    String? Function()? gender,
    String? Function()? maritalStatus,
    String? email,
    String? Function()? phone,
    DateTime? Function()? dateOfBirth,
  }) {
    return ApplicationApplicant(
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      otherNames: otherNames != null ? otherNames() : this.otherNames,
      gender: gender != null ? gender() : this.gender,
      maritalStatus: maritalStatus != null
          ? maritalStatus()
          : this.maritalStatus,
      email: email ?? this.email,
      phone: phone != null ? phone() : this.phone,
      dateOfBirth: dateOfBirth != null ? dateOfBirth() : this.dateOfBirth,
      profilePhotoUrl: profilePhotoUrl,
    );
  }
}

@immutable
class ApplicationIdentity {
  const ApplicationIdentity({
    this.nationality,
    this.idType,
    this.idNumber,
    this.currentAddress,
    this.idFrontUrl,
    this.idBackUrl,
  });

  final String? nationality;
  final String? idType;
  final String? idNumber;
  final String? currentAddress;
  final String? idFrontUrl;
  final String? idBackUrl;

  ApplicationIdentity copyWith({
    String? Function()? nationality,
    String? Function()? idType,
    String? Function()? idNumber,
    String? Function()? currentAddress,
  }) {
    return ApplicationIdentity(
      nationality: nationality != null ? nationality() : this.nationality,
      idType: idType != null ? idType() : this.idType,
      idNumber: idNumber != null ? idNumber() : this.idNumber,
      currentAddress: currentAddress != null
          ? currentAddress()
          : this.currentAddress,
      idFrontUrl: idFrontUrl,
      idBackUrl: idBackUrl,
    );
  }
}

/// Emergency contact + employment — the web keeps these on one form
/// ("Emergency Contact & Background").
@immutable
class ApplicationBackground {
  const ApplicationBackground({
    this.emergencyContactName,
    this.relationshipToEmergencyContact,
    this.emergencyContactPhone,
    this.employerType,
    this.occupation,
    this.employer,
    this.occupationAddress,
    this.proofOfIncomeUrl,
  });

  final String? emergencyContactName;
  final String? relationshipToEmergencyContact;
  final String? emergencyContactPhone;
  final String? employerType;
  final String? occupation;
  final String? employer;
  final String? occupationAddress;
  final String? proofOfIncomeUrl;

  bool get isStudent => employerType == 'STUDENT';

  ApplicationBackground copyWith({
    String? Function()? emergencyContactName,
    String? Function()? relationshipToEmergencyContact,
    String? Function()? emergencyContactPhone,
    String? Function()? employerType,
    String? Function()? occupation,
    String? Function()? employer,
    String? Function()? occupationAddress,
  }) {
    return ApplicationBackground(
      emergencyContactName: emergencyContactName != null
          ? emergencyContactName()
          : this.emergencyContactName,
      relationshipToEmergencyContact: relationshipToEmergencyContact != null
          ? relationshipToEmergencyContact()
          : this.relationshipToEmergencyContact,
      emergencyContactPhone: emergencyContactPhone != null
          ? emergencyContactPhone()
          : this.emergencyContactPhone,
      employerType: employerType != null ? employerType() : this.employerType,
      occupation: occupation != null ? occupation() : this.occupation,
      employer: employer != null ? employer() : this.employer,
      occupationAddress: occupationAddress != null
          ? occupationAddress()
          : this.occupationAddress,
      proofOfIncomeUrl: proofOfIncomeUrl,
    );
  }
}

@immutable
class ApplicationMoveIn {
  const ApplicationMoveIn({
    this.desiredMoveInDate,
    this.stayDurationFrequency,
    this.stayDuration,
  });

  final DateTime? desiredMoveInDate;
  final String? stayDurationFrequency;
  final int? stayDuration;

  ApplicationMoveIn copyWith({
    DateTime? Function()? desiredMoveInDate,
    String? Function()? stayDurationFrequency,
    int? Function()? stayDuration,
  }) {
    return ApplicationMoveIn(
      desiredMoveInDate: desiredMoveInDate != null
          ? desiredMoveInDate()
          : this.desiredMoveInDate,
      stayDurationFrequency: stayDurationFrequency != null
          ? stayDurationFrequency()
          : this.stayDurationFrequency,
      stayDuration: stayDuration != null ? stayDuration() : this.stayDuration,
    );
  }
}

@immutable
class ApplicationFinancial {
  const ApplicationFinancial({
    this.rentFee,
    this.paymentFrequency,
    this.securityDepositFee,
    this.hasFinancialAccount = false,
  });

  /// Pesewas.
  final int? rentFee;
  final String? paymentFrequency;

  /// Pesewas.
  final int? securityDepositFee;
  final bool hasFinancialAccount;

  ApplicationFinancial copyWith({
    int? Function()? rentFee,
    String? Function()? paymentFrequency,
  }) {
    return ApplicationFinancial(
      rentFee: rentFee != null ? rentFee() : this.rentFee,
      paymentFrequency: paymentFrequency != null
          ? paymentFrequency()
          : this.paymentFrequency,
      securityDepositFee: securityDepositFee,
      hasFinancialAccount: hasFinancialAccount,
    );
  }
}

/// A signature slot on the lease agreement document.
@immutable
class ApplicationSigner {
  const ApplicationSigner({
    required this.role,
    required this.label,
    required this.signed,
    required this.isSelf,
  });

  final String role;
  final String label;
  final bool signed;

  /// True for the slot the signed-in manager fills themselves.
  final bool isSelf;

  ApplicationSigner copyWith({bool? signed}) => ApplicationSigner(
    role: role,
    label: label,
    signed: signed ?? this.signed,
    isSelf: isSelf,
  );
}

@immutable
class ApplicationDoc {
  const ApplicationDoc({
    this.name,
    this.source,
    this.status,
    this.mode,
    this.signers = const [],
  });

  final String? name;
  final String? source;
  final String? status;

  /// `ONLINE` | `MANUAL` | null when nothing is attached yet.
  final String? mode;
  final List<ApplicationSigner> signers;

  bool get attached => mode != null;
  bool get isManual => mode == 'MANUAL';
}

@immutable
class ApplicationUnit {
  const ApplicationUnit({
    required this.id,
    required this.name,
    required this.type,
    required this.status,
    this.rentFee,
    this.paymentFrequency,
    this.rentFeeCurrency,
    this.imageUrl,
  });

  factory ApplicationUnit.fromModel(UnitModel u) => ApplicationUnit(
    id: u.id,
    name: u.name,
    type: u.type,
    status: u.status,
    rentFee: u.rentFee,
    paymentFrequency: u.paymentFrequency,
    rentFeeCurrency: u.rentFeeCurrency,
    imageUrl: u.images?.firstOrNull,
  );

  final String id;
  final String name;

  /// API enum — APARTMENT/HOUSE/STUDIO/OFFICE/RETAIL. Render via
  /// `unitTypeLabel` from lib/src/lib/unit_status.dart.
  final String type;

  /// Dotted API status, e.g. `Unit.Status.Available`. Render via
  /// `propertyStatusLabel`.
  final String status;

  /// Market rent in pesewas.
  final int? rentFee;
  final String? paymentFrequency;
  final String? rentFeeCurrency;
  final String? imageUrl;

  bool get isAvailable => status == 'Unit.Status.Available';
  bool get isOccupied => status == 'Unit.Status.Occupied';
  bool get isBookable =>
      isAvailable || status == 'Unit.Status.PartiallyOccupied';
}

// ── Root ─────────────────────────────────────────────────────────────────────

@immutable
class ApplicationDetailData {
  const ApplicationDetailData({
    required this.id,
    required this.code,
    required this.status,
    required this.submittedOn,
    this.submittedBy,
    required this.applicant,
    required this.identity,
    required this.background,
    required this.moveIn,
    required this.financial,
    required this.doc,
    this.desiredUnit,
    this.approved = false,
    this.isSingleUnitProperty = false,
  });

  final String id;
  final String code;
  final String status;
  final String submittedOn;
  final String? submittedBy;
  final ApplicationApplicant applicant;
  final ApplicationIdentity identity;
  final ApplicationBackground background;
  final ApplicationMoveIn moveIn;
  final ApplicationFinancial financial;
  final ApplicationDoc doc;
  final ApplicationUnit? desiredUnit;
  final bool approved;

  /// A single-unit property has nothing to pick between, so the web hides
  /// the assign/change affordances entirely. Mirrored here.
  final bool isSingleUnitProperty;

  ApplicationDetailData copyWith({
    ApplicationApplicant? applicant,
    ApplicationIdentity? identity,
    ApplicationBackground? background,
    ApplicationMoveIn? moveIn,
    ApplicationFinancial? financial,
    ApplicationDoc? doc,
    ApplicationUnit? desiredUnit,
    bool? approved,
  }) {
    return ApplicationDetailData(
      id: id,
      code: code,
      status: status,
      submittedOn: submittedOn,
      submittedBy: submittedBy,
      applicant: applicant ?? this.applicant,
      identity: identity ?? this.identity,
      background: background ?? this.background,
      moveIn: moveIn ?? this.moveIn,
      financial: financial ?? this.financial,
      doc: doc ?? this.doc,
      desiredUnit: desiredUnit ?? this.desiredUnit,
      approved: approved ?? this.approved,
      isSingleUnitProperty: isSingleUnitProperty,
    );
  }

  /// Selecting a unit cascades into the financial and move-in setup: the web's
  /// change-unit flow PATCHes `desired_unit_id` together with `rent_fee`,
  /// `rent_fee_currency`, `payment_frequency` and `stay_duration_frequency`
  /// copied off the unit, so the application inherits the unit's terms.
  ApplicationDetailData withUnit(ApplicationUnit unit) {
    return copyWith(
      desiredUnit: unit,
      financial: financial.copyWith(
        rentFee: () => unit.rentFee,
        paymentFrequency: () => unit.paymentFrequency,
      ),
      moveIn: moveIn.copyWith(
        stayDurationFrequency: () => unit.paymentFrequency,
      ),
    );
  }

  /// The web locks unit changes once money or signatures are committed, and
  /// only offers them while the application is still in progress.
  bool get canChangeUnit => !isSingleUnitProperty && !approved;

  bool get isUnitChangeLocked => doc.signers.any((s) => s.signed);

  String? get unitChangeLockReason {
    if (doc.signers.any((s) => s.signed)) {
      return 'The lease document has been signed, so the unit can no longer '
          'be changed.';
    }
    return null;
  }

  String get displayStatus => approved ? 'Completed' : status;

  // ── Derived checklist ─────────────────────────────────────────────────────
  //
  // Computed by the shared lib (lib/src/lib/application_checklist.dart), the
  // same code the real applications list uses, so the seeded screen and the
  // live list can never disagree about what "complete" means.

  /// Projects the seed onto the REST shape the checklist lib reads. Witness
  /// labels live in a document's Lexical content under the web's rules rather
  /// than on the signature rows, so seeded witnesses are re-emitted as
  /// synthetic content nodes.
  TenantApplicationModel toApplicationModel() {
    final witnessSigners = doc.signers.where(
      (s) => s.role == 'PM_WITNESS' || s.role == 'TENANT_WITNESS',
    );
    final content = witnessSigners.isEmpty
        ? null
        : jsonEncode({
            'root': {
              'type': 'root',
              'children': [
                for (final s in witnessSigners)
                  {
                    'type': 'signature',
                    'role': s.role == 'PM_WITNESS'
                        ? 'pm_witness'
                        : 'tenant_witness',
                    'label': s.label,
                  },
              ],
            },
          });

    const docId = 'seed-doc';
    return TenantApplicationModel(
      id: id,
      code: code,
      status: status,
      firstName: applicant.firstName,
      otherNames: applicant.otherNames,
      lastName: applicant.lastName,
      email: applicant.email,
      phone: applicant.phone,
      gender: applicant.gender,
      dateOfBirth: applicant.dateOfBirth,
      maritalStatus: applicant.maritalStatus,
      profilePhotoUrl: applicant.profilePhotoUrl,
      nationality: identity.nationality,
      idType: identity.idType,
      idNumber: identity.idNumber,
      currentAddress: identity.currentAddress,
      emergencyContactName: background.emergencyContactName,
      emergencyContactPhone: background.emergencyContactPhone,
      relationshipToEmergencyContact: background.relationshipToEmergencyContact,
      employerType: background.employerType,
      occupation: background.occupation,
      employer: background.employer,
      occupationAddress: background.occupationAddress,
      desiredUnitId: desiredUnit?.id,
      desiredUnit: desiredUnit == null
          ? null
          : UnitModel(
              id: desiredUnit!.id,
              name: desiredUnit!.name,
              type: desiredUnit!.type,
              status: desiredUnit!.status,
              rentFee: desiredUnit!.rentFee ?? 0,
              rentFeeCurrency: defaultCurrencyCode,
              paymentFrequency: desiredUnit!.paymentFrequency,
            ),
      desiredMoveInDate: moveIn.desiredMoveInDate,
      stayDuration: moveIn.stayDuration,
      stayDurationFrequency: moveIn.stayDurationFrequency,
      rentFee: financial.rentFee,
      paymentFrequency: financial.paymentFrequency,
      securityDepositFee: financial.securityDepositFee,
      financialAccount: financial.hasFinancialAccount
          ? FinancialAccountSummaryModel(id: 'seed-account')
          : null,
      leaseAgreementDocumentMode: doc.mode,
      leaseAgreementDocumentId: doc.attached ? docId : null,
      leaseAgreementDocumentUrl: doc.attached ? 'seed://lease.pdf' : null,
      leaseAgreementDocument: doc.attached
          ? ApplicationDocumentModel(id: docId, content: content)
          : null,
      leaseAgreementDocumentSignatures: [
        for (final s in doc.signers)
          if (s.signed)
            ApplicationDocumentSignatureModel(
              id: '${s.role}-sig',
              documentId: docId,
              role: s.role,
            ),
      ],
    );
  }

  ApplicationChecklist get checklist =>
      computeApplicationChecklist(toApplicationModel());

  ChecklistStep stepFor(ChecklistSection section) => checklist.step(section);

  /// Percentage (0-100) of steps done or locked.
  double get progress => checklist.progress * 100;

  bool get canApprove => checklist.canApprove;

  /// Builds the screen's view model from a real API row — the inverse of
  /// [toApplicationModel]. Used when the applications list pushes the row it
  /// was already showing, so a tapped card opens that application rather than
  /// falling through to a fixture. Fields the detail screen renders but the
  /// list payload does not carry (document name/source/status) stay null.
  factory ApplicationDetailData.fromApplicationModel(TenantApplicationModel a) {
    final signatures = a.leaseAgreementDocumentSignatures ?? const [];
    final witnessNodes = getWitnessNodesFromContent(
      a.leaseAgreementDocument?.content,
    );

    // Manager and tenant slots are implicit; witness slots come from the
    // document body, matching the checklist's own reading of a document.
    var pmWitnessSeen = 0;
    var tenantWitnessSeen = 0;
    final signers = <ApplicationSigner>[
      ApplicationSigner(
        role: 'PROPERTY_MANAGER',
        label: 'Property Manager',
        signed: signatures.any((s) => s.role == 'PROPERTY_MANAGER'),
        isSelf: true,
      ),
      ApplicationSigner(
        role: 'TENANT',
        label: 'Tenant',
        signed: signatures.any((s) => s.role == 'TENANT'),
        isSelf: false,
      ),
      for (final node in witnessNodes)
        if (node.role == 'pm_witness')
          ApplicationSigner(
            role: 'PM_WITNESS',
            label: node.label,
            signed:
                pmWitnessSeen++ <
                signatures.where((s) => s.role == 'PM_WITNESS').length,
            isSelf: false,
          )
        else
          ApplicationSigner(
            role: 'TENANT_WITNESS',
            label: node.label,
            signed:
                tenantWitnessSeen++ <
                signatures.where((s) => s.role == 'TENANT_WITNESS').length,
            isSelf: false,
          ),
    ];

    return ApplicationDetailData(
      id: a.id,
      code: a.code,
      status: applicationStatusLabel(a.status),
      submittedOn: a.createdAt == null
          ? '—'
          : formatApplicationDate(a.createdAt!),
      submittedBy: submittedByLabel(a.source),
      applicant: ApplicationApplicant(
        firstName: a.firstName ?? '',
        lastName: a.lastName ?? '',
        otherNames: a.otherNames,
        gender: a.gender,
        maritalStatus: a.maritalStatus,
        email: a.email ?? '',
        phone: a.phone,
        dateOfBirth: a.dateOfBirth,
        profilePhotoUrl: a.profilePhotoUrl,
      ),
      identity: ApplicationIdentity(
        nationality: a.nationality,
        idType: a.idType,
        idNumber: a.idNumber,
        currentAddress: a.currentAddress,
        idFrontUrl: a.idFrontUrl,
        idBackUrl: a.idBackUrl,
      ),
      background: ApplicationBackground(
        emergencyContactName: a.emergencyContactName,
        relationshipToEmergencyContact: a.relationshipToEmergencyContact,
        emergencyContactPhone: a.emergencyContactPhone,
        employerType: a.employerType,
        occupation: a.occupation,
        employer: a.employer,
        occupationAddress: a.occupationAddress,
        proofOfIncomeUrl: a.proofOfIncomeUrl,
      ),
      moveIn: ApplicationMoveIn(
        desiredMoveInDate: a.desiredMoveInDate,
        stayDurationFrequency: a.stayDurationFrequency,
        stayDuration: a.stayDuration,
      ),
      financial: ApplicationFinancial(
        rentFee: a.rentFee,
        paymentFrequency: a.paymentFrequency,
        securityDepositFee: a.securityDepositFee,
        hasFinancialAccount: a.financialAccount != null,
      ),
      doc: ApplicationDoc(
        mode: a.leaseAgreementDocumentMode,
        signers: a.leaseAgreementDocumentMode == null ? const [] : signers,
      ),
      desiredUnit: a.desiredUnit == null
          ? null
          : ApplicationUnit(
              id: a.desiredUnit!.id,
              name: a.desiredUnit!.name,
              type: a.desiredUnit!.type,
              status: a.desiredUnit!.status,
              rentFee: a.desiredUnit!.rentFee,
              paymentFrequency: a.desiredUnit!.paymentFrequency,
              rentFeeCurrency: a.desiredUnit!.rentFeeCurrency,
              imageUrl: a.desiredUnit!.images?.firstOrNull,
            ),
      approved: a.status == 'TenantApplication.Status.Completed',
    );
  }
}

// ── Seeded units available to pick from ──────────────────────────────────────

/// Stand-in for `GET .../units?property_id=…`. Non-available units are listed
/// but not selectable, exactly as the web's change-unit list renders them.
const kApplicationSeedUnits = <ApplicationUnit>[
  ApplicationUnit(
    id: 'u1',
    name: 'Unit 1C · Cantonments Court',
    type: 'APARTMENT',
    status: 'Unit.Status.Available',
    rentFee: 50000,
    paymentFrequency: 'MONTHLY',
  ),
  ApplicationUnit(
    id: 'u2',
    name: 'Unit 2A · Cantonments Court',
    type: 'APARTMENT',
    status: 'Unit.Status.Available',
    rentFee: 65000,
    paymentFrequency: 'MONTHLY',
  ),
  ApplicationUnit(
    id: 'u3',
    name: 'Unit 12 · Spintex Heights',
    type: 'APARTMENT',
    status: 'Unit.Status.Occupied',
    rentFee: 350000,
    paymentFrequency: 'MONTHLY',
  ),
  ApplicationUnit(
    id: 'u4',
    name: 'Studio 4 · Osu Loft',
    type: 'STUDIO',
    status: 'Unit.Status.Available',
    rentFee: 180000,
    paymentFrequency: 'MONTHLY',
  ),
  ApplicationUnit(
    id: 'u5',
    name: 'Shop 5 · Osu Retail Block',
    type: 'RETAIL',
    status: 'Unit.Status.Maintenance',
    rentFee: 600000,
    paymentFrequency: 'MONTHLY',
  ),
];
