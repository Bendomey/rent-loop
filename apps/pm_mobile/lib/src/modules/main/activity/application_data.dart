// Seed data for the Application Info screen.
//
// Field names deliberately mirror the tenant-application REST payload
// (`first_name`, `stay_duration_frequency`, `rent_fee` in pesewas, …) so
// swapping this for a real `TenantApplicationModel` later is a field-for-field
// change rather than a rewrite. Money is held as integer pesewas, matching the
// backend and the rest of this app — see lib/src/lib/money.dart.

import 'package:flutter/foundation.dart';
import 'package:rentloop_manager/src/lib/money.dart';

// ── Option sets (mirror the web zod enums) ───────────────────────────────────

const kGenderOptions = {'MALE': 'Male', 'FEMALE': 'Female'};

const kMaritalStatusOptions = {
  'SINGLE': 'Single',
  'MARRIED': 'Married',
  'DIVORCED': 'Divorced',
  'WIDOWED': 'Widowed',
};

const kIdTypeOptions = {
  'NATIONAL_ID': 'National ID',
  'PASSPORT': 'Passport',
  'DRIVER_LICENSE': "Driver's License",
  'GHANA_CARD': 'Ghana Card',
};

const kEmployerTypeOptions = {'STUDENT': 'Student', 'WORKER': 'Worker'};

const kStayFrequencyOptions = {
  'HOURLY': 'Hourly',
  'DAILY': 'Daily',
  'WEEKLY': 'Weekly',
  'MONTHLY': 'Monthly',
};

const kPaymentFrequencyOptions = {
  'DAILY': 'Daily',
  'WEEKLY': 'Weekly',
  'MONTHLY': 'Monthly',
  'QUARTERLY': 'Quarterly',
  'BIANNUALLY': 'Biannually',
  'ANNUALLY': 'Annually',
};

const kPaymentModeOptions = {
  'ONE_TIME_PAYMENT': 'Full stay payment',
  'CUSTOM': 'Custom periods',
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

/// `GH₵ 6,000.00` from an integer pesewas amount.
String formatPesewas(int? pesewas, {String currency = 'GH₵'}) {
  if (pesewas == null) return '—';
  final cedis = pesewasToCedis(pesewas);
  final parts = cedis.toStringAsFixed(2).split('.');
  final whole = parts[0].replaceAllMapped(
    RegExp(r'\B(?=(\d{3})+(?!\d))'),
    (_) => ',',
  );
  return '$currency $whole.${parts[1]}';
}

// ── Checklist ────────────────────────────────────────────────────────────────

@immutable
class ApplicationChecklistItem {
  const ApplicationChecklistItem(this.label, {required this.done});
  final String label;
  final bool done;
}

/// One row of the "Complete application info" card.
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

  /// An empty section passes vacuously (docs are optional until attached),
  /// but only a section with items counts as "complete" for progress.
  bool get complete => items.isNotEmpty && doneCount == items.length;
}

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
    this.securityDepositEnabled = false,
    this.securityDepositFee,
    this.paymentMode = 'ONE_TIME_PAYMENT',
    this.customPeriods = 1,
    this.invoiceGenerated = false,
    this.invoicePaid = false,
    this.unitDefaultRentFee,
  });

  /// Pesewas.
  final int? rentFee;
  final String? paymentFrequency;
  final bool securityDepositEnabled;

  /// Pesewas.
  final int? securityDepositFee;
  final String paymentMode;
  final int customPeriods;
  final bool invoiceGenerated;
  final bool invoicePaid;

  /// Pesewas — the unit's own rent, shown as "Unit default" on the web form.
  final int? unitDefaultRentFee;

  /// Number of rent periods the initial payment covers.
  int periodsFor(int? stayDuration) =>
      paymentMode == 'CUSTOM' ? customPeriods : (stayDuration ?? 1);

  /// Initial payment total in pesewas: rent × periods (+ deposit when on).
  int? initialTotalFor(int? stayDuration) {
    if (rentFee == null) return null;
    final base = rentFee! * periodsFor(stayDuration);
    return base + (securityDepositEnabled ? (securityDepositFee ?? 0) : 0);
  }

  ApplicationFinancial copyWith({
    int? Function()? rentFee,
    String? Function()? paymentFrequency,
    bool? securityDepositEnabled,
    int? Function()? securityDepositFee,
    String? paymentMode,
    int? customPeriods,
    bool? invoiceGenerated,
    bool? invoicePaid,
  }) {
    return ApplicationFinancial(
      rentFee: rentFee != null ? rentFee() : this.rentFee,
      paymentFrequency: paymentFrequency != null
          ? paymentFrequency()
          : this.paymentFrequency,
      securityDepositEnabled:
          securityDepositEnabled ?? this.securityDepositEnabled,
      securityDepositFee: securityDepositFee != null
          ? securityDepositFee()
          : this.securityDepositFee,
      paymentMode: paymentMode ?? this.paymentMode,
      customPeriods: customPeriods ?? this.customPeriods,
      invoiceGenerated: invoiceGenerated ?? this.invoiceGenerated,
      invoicePaid: invoicePaid ?? this.invoicePaid,
      unitDefaultRentFee: unitDefaultRentFee,
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

  /// True for the slot the signed-in manager fills themselves — that row
  /// gets "Sign document" instead of "Prompt to sign".
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
    this.imageUrl,
  });

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
  final String? imageUrl;

  bool get isAvailable => status == 'Unit.Status.Available';
}

// ── Root ─────────────────────────────────────────────────────────────────────

@immutable
class ApplicationDetailData {
  const ApplicationDetailData({
    required this.id,
    required this.code,
    required this.status,
    required this.submittedOn,
    required this.submittedBy,
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
  final String submittedBy;
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

  bool get isUnitChangeLocked =>
      financial.invoicePaid || doc.signers.any((s) => s.signed);

  String? get unitChangeLockReason {
    if (financial.invoicePaid) {
      return 'The initial payment has been paid, so the unit can no longer be '
          'changed.';
    }
    if (doc.signers.any((s) => s.signed)) {
      return 'The lease document has been signed, so the unit can no longer '
          'be changed.';
    }
    return null;
  }

  String get displayStatus => approved ? 'Completed' : status;

  // ── Derived checklist (mirrors the web's use-calculate-checklist) ──────────

  ApplicationChecklistSection get unitSection => ApplicationChecklistSection(
    key: 'unit',
    label: 'Select a unit',
    items: [
      ApplicationChecklistItem('Unit selected', done: desiredUnit != null),
    ],
  );

  ApplicationChecklistSection get tenantSection {
    bool has(String? v) => v != null && v.isNotEmpty;
    return ApplicationChecklistSection(
      key: 'tenant',
      label: 'Add tenant details',
      items: [
        ApplicationChecklistItem('First name', done: has(applicant.firstName)),
        ApplicationChecklistItem('Last name', done: has(applicant.lastName)),
        ApplicationChecklistItem('Phone', done: has(applicant.phone)),
        ApplicationChecklistItem('Gender', done: has(applicant.gender)),
        ApplicationChecklistItem(
          'Date of birth',
          done: applicant.dateOfBirth != null,
        ),
        ApplicationChecklistItem(
          'Nationality',
          done: has(identity.nationality),
        ),
        ApplicationChecklistItem(
          'Marital status',
          done: has(applicant.maritalStatus),
        ),
        ApplicationChecklistItem('ID type', done: has(identity.idType)),
        ApplicationChecklistItem('ID number', done: has(identity.idNumber)),
        ApplicationChecklistItem(
          'Current address',
          done: has(identity.currentAddress),
        ),
        ApplicationChecklistItem(
          'Emergency contact name',
          done: has(background.emergencyContactName),
        ),
        ApplicationChecklistItem(
          'Emergency contact phone',
          done: has(background.emergencyContactPhone),
        ),
        ApplicationChecklistItem(
          'Relationship to emergency contact',
          done: has(background.relationshipToEmergencyContact),
        ),
        ApplicationChecklistItem(
          'Employment type',
          done: has(background.employerType),
        ),
        ApplicationChecklistItem(
          'Occupation',
          done: has(background.occupation),
        ),
        ApplicationChecklistItem('Employer', done: has(background.employer)),
        ApplicationChecklistItem(
          'Occupation address',
          done: has(background.occupationAddress),
        ),
      ],
    );
  }

  ApplicationChecklistSection get moveInSection => ApplicationChecklistSection(
    key: 'movein',
    label: 'Move-in setup',
    items: [
      ApplicationChecklistItem(
        'Move-in date',
        done: moveIn.desiredMoveInDate != null,
      ),
      ApplicationChecklistItem(
        'Stay duration frequency',
        done: moveIn.stayDurationFrequency != null,
      ),
      ApplicationChecklistItem(
        'Stay duration',
        done: moveIn.stayDuration != null,
      ),
    ],
  );

  ApplicationChecklistSection get financialSection =>
      ApplicationChecklistSection(
        key: 'financial',
        label: 'Financial setup',
        items: [
          ApplicationChecklistItem('Rent fee', done: financial.rentFee != null),
          ApplicationChecklistItem(
            'Payment frequency',
            done: financial.paymentFrequency != null,
          ),
          ApplicationChecklistItem(
            'Invoice generated',
            done: financial.invoiceGenerated,
          ),
          ApplicationChecklistItem('Invoice paid', done: financial.invoicePaid),
        ],
      );

  /// Docs are optional — with nothing attached the section is empty and
  /// passes vacuously, exactly as the web treats it.
  ApplicationChecklistSection get docsSection {
    if (!doc.attached) {
      return const ApplicationChecklistSection(
        key: 'docs',
        label: 'Lease docs setup',
        items: [],
      );
    }
    return ApplicationChecklistSection(
      key: 'docs',
      label: 'Lease docs setup',
      items: [
        ApplicationChecklistItem('Document uploaded', done: true),
        for (final s in doc.signers)
          ApplicationChecklistItem(
            '${s.label} signed',
            done: doc.isManual || s.signed,
          ),
      ],
    );
  }

  List<ApplicationChecklistSection> get checklist => [
    unitSection,
    tenantSection,
    moveInSection,
    financialSection,
    docsSection,
  ];

  /// Percentage of the five sections that are fully complete. Empty sections
  /// count as incomplete for display (matching the web).
  double get progress =>
      checklist.where((s) => s.complete).length / checklist.length * 100;

  /// Approval gate — only sections that actually carry items must pass.
  bool get canApprove {
    final required = checklist.where((s) => s.items.isNotEmpty);
    return required.isEmpty || required.every((s) => s.complete);
  }

  // ── Seed lookup ───────────────────────────────────────────────────────────

  static ApplicationDetailData forId(String id) =>
      _seed.firstWhere((a) => a.id == id, orElse: () => _seed.first);
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

// ── Seeded applications (ids mirror the activity board) ──────────────────────

ApplicationDoc _leaseDoc(String code) => ApplicationDoc(
  name: '$code - Lease Agreement',
  source: 'Selected from library',
  status: 'Ready for Signing',
  mode: 'ONLINE',
  signers: const [
    ApplicationSigner(
      role: 'PROPERTY_MANAGER',
      label: 'Property Manager',
      signed: false,
      isSelf: true,
    ),
    ApplicationSigner(
      role: 'TENANT',
      label: 'Tenant',
      signed: false,
      isSelf: false,
    ),
    ApplicationSigner(
      role: 'PM_WITNESS',
      label: 'Property Manager Witness',
      signed: false,
      isSelf: false,
    ),
    ApplicationSigner(
      role: 'TENANT_WITNESS',
      label: 'Tenant Witness',
      signed: false,
      isSelf: false,
    ),
  ],
);

final List<ApplicationDetailData> _seed = [
  ApplicationDetailData(
    id: 'a1',
    code: '2607QUOWF0',
    status: 'In Progress',
    submittedOn: 'Fri, 10 Jul 2026 · 11:34',
    submittedBy: 'Benjamin Domey',
    applicant: ApplicationApplicant(
      firstName: 'Ebenezer',
      lastName: 'Adu',
      gender: 'MALE',
      maritalStatus: 'SINGLE',
      email: 'gideonbempong533@gmail.com',
      phone: '+233 27 709 9220',
      dateOfBirth: DateTime(1998, 3, 4),
    ),
    identity: const ApplicationIdentity(
      nationality: 'Ghanaian',
      idType: 'NATIONAL_ID',
      idNumber: 'GHA-14564-464',
    ),
    background: const ApplicationBackground(
      employerType: 'WORKER',
      occupation: 'Accountant',
    ),
    moveIn: const ApplicationMoveIn(
      stayDurationFrequency: 'MONTHLY',
      stayDuration: 12,
    ),
    financial: const ApplicationFinancial(
      rentFee: 50000,
      paymentFrequency: 'MONTHLY',
      unitDefaultRentFee: 50000,
    ),
    doc: _leaseDoc('2607QUOWF0'),
    desiredUnit: kApplicationSeedUnits[0],
  ),
  ApplicationDetailData(
    id: 'a2',
    code: '2607DNLOF2',
    status: 'In Progress',
    submittedOn: 'Wed, 8 Jul 2026 · 09:12',
    submittedBy: 'Benjamin Domey',
    applicant: ApplicationApplicant(
      firstName: 'Daniel',
      lastName: 'Ofori',
      gender: 'MALE',
      maritalStatus: 'MARRIED',
      email: 'daniel.ofori@example.com',
      phone: '+233 24 330 7781',
      dateOfBirth: DateTime(1991, 11, 19),
    ),
    identity: const ApplicationIdentity(
      nationality: 'Ghanaian',
      idType: 'GHANA_CARD',
      idNumber: 'GHA-72210-118',
      currentAddress: '14 Spintex Road, Accra',
    ),
    background: const ApplicationBackground(
      emergencyContactName: 'Akosua Ofori',
      relationshipToEmergencyContact: 'Spouse',
      emergencyContactPhone: '+233 24 118 9930',
      employerType: 'WORKER',
      occupation: 'Logistics Manager',
      employer: 'Bollore Transport',
      occupationAddress: 'Tema Industrial Area, Tema',
    ),
    moveIn: ApplicationMoveIn(
      desiredMoveInDate: DateTime(2026, 8, 1),
      stayDurationFrequency: 'MONTHLY',
      stayDuration: 12,
    ),
    financial: const ApplicationFinancial(
      rentFee: 350000,
      paymentFrequency: 'MONTHLY',
      securityDepositEnabled: true,
      securityDepositFee: 350000,
      unitDefaultRentFee: 350000,
      invoiceGenerated: true,
    ),
    doc: _leaseDoc('2607DNLOF2'),
    desiredUnit: kApplicationSeedUnits[2],
  ),
  ApplicationDetailData(
    id: 'a3',
    code: '2607NAADJ3',
    status: 'In Progress',
    submittedOn: 'Tue, 7 Jul 2026 · 16:48',
    submittedBy: 'Benjamin Domey',
    applicant: ApplicationApplicant(
      firstName: 'Naa',
      lastName: 'Adjeley',
      gender: 'FEMALE',
      email: 'naa.adjeley@example.com',
      phone: '+233 20 555 9921',
    ),
    identity: const ApplicationIdentity(nationality: 'Ghanaian'),
    background: const ApplicationBackground(),
    moveIn: const ApplicationMoveIn(stayDurationFrequency: 'MONTHLY'),
    financial: const ApplicationFinancial(
      rentFee: 600000,
      paymentFrequency: 'MONTHLY',
      unitDefaultRentFee: 600000,
    ),
    doc: const ApplicationDoc(),
    desiredUnit: kApplicationSeedUnits[4],
  ),
  ApplicationDetailData(
    id: 'a4',
    code: '2607SLRKD4',
    status: 'New',
    submittedOn: 'Mon, 6 Jul 2026 · 08:05',
    submittedBy: 'Benjamin Domey',
    applicant: ApplicationApplicant(
      firstName: 'Selorm',
      lastName: 'Kudjo',
      email: 'selorm.kudjo@example.com',
      phone: '+233 55 712 0034',
    ),
    identity: const ApplicationIdentity(),
    background: const ApplicationBackground(),
    moveIn: const ApplicationMoveIn(),
    financial: const ApplicationFinancial(unitDefaultRentFee: 350000),
    doc: const ApplicationDoc(),
  ),
];
