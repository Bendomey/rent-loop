import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';

Map<String, dynamic>? _map(Object? v) => v as Map<String, dynamic>?;

class InvoicePropertyModel {
  InvoicePropertyModel({required this.id, required this.name});

  factory InvoicePropertyModel.fromJson(Map<String, dynamic> json) =>
      InvoicePropertyModel(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
      );

  final String id;
  final String name;
}

class InvoiceTenantModel {
  InvoiceTenantModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.otherNames,
    this.phone,
    this.email,
  });

  factory InvoiceTenantModel.fromJson(Map<String, dynamic> json) =>
      InvoiceTenantModel(
        id: json['id'] as String,
        firstName: json['first_name'] as String? ?? '',
        lastName: json['last_name'] as String? ?? '',
        otherNames: json['other_names'] as String?,
        phone: json['phone'] as String?,
        email: json['email'] as String?,
      );

  final String id;
  final String firstName;
  final String lastName;
  final String? otherNames;
  final String? phone;
  final String? email;
}

class InvoiceBlockModel {
  InvoiceBlockModel({required this.name});

  factory InvoiceBlockModel.fromJson(Map<String, dynamic> json) =>
      InvoiceBlockModel(name: json['name'] as String? ?? '');

  final String name;
}

class InvoiceUnitModel {
  InvoiceUnitModel({required this.id, required this.name, this.propertyBlock});

  factory InvoiceUnitModel.fromJson(Map<String, dynamic> json) {
    final block = _map(json['property_block']);
    return InvoiceUnitModel(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      propertyBlock: block == null ? null : InvoiceBlockModel.fromJson(block),
    );
  }

  final String id;
  final String name;
  final InvoiceBlockModel? propertyBlock;
}

class InvoiceLeaseModel {
  InvoiceLeaseModel({required this.id, this.code, this.tenant, this.unit});

  factory InvoiceLeaseModel.fromJson(Map<String, dynamic> json) {
    final tenant = _map(json['tenant']);
    final unit = _map(json['unit']);
    return InvoiceLeaseModel(
      id: json['id'] as String,
      code: json['code'] as String?,
      tenant: tenant == null ? null : InvoiceTenantModel.fromJson(tenant),
      unit: unit == null ? null : InvoiceUnitModel.fromJson(unit),
    );
  }

  final String id;
  final String? code;
  final InvoiceTenantModel? tenant;
  final InvoiceUnitModel? unit;
}

class InvoiceApplicantModel {
  InvoiceApplicantModel({required this.firstName, required this.lastName});

  factory InvoiceApplicantModel.fromJson(Map<String, dynamic> json) =>
      InvoiceApplicantModel(
        firstName: json['first_name'] as String? ?? '',
        lastName: json['last_name'] as String? ?? '',
      );

  final String firstName;
  final String lastName;
}

class InvoiceLineItemModel {
  InvoiceLineItemModel({
    required this.id,
    required this.label,
    required this.category,
    required this.quantity,
    required this.unitAmount,
    required this.totalAmount,
  });

  factory InvoiceLineItemModel.fromJson(Map<String, dynamic> json) =>
      InvoiceLineItemModel(
        id: json['id'] as String,
        label: json['label'] as String? ?? '',
        category: json['category'] as String? ?? '',
        quantity: (json['quantity'] as num?)?.toInt() ?? 1,
        unitAmount: (json['unit_amount'] as num?)?.toInt() ?? 0,
        totalAmount: (json['total_amount'] as num?)?.toInt() ?? 0,
      );

  final String id;
  final String label;
  final String category;
  final int quantity;
  final int unitAmount;
  final int totalAmount;
}

class InvoicePaymentModel {
  InvoicePaymentModel({
    required this.id,
    required this.amount,
    required this.status,
    required this.rail,
    this.provider,
    this.reference,
    required this.createdAt,
    this.successfulAt,
    this.failedAt,
    this.metadata,
  });

  factory InvoicePaymentModel.fromJson(Map<String, dynamic> json) =>
      InvoicePaymentModel(
        id: json['id'] as String,
        amount: (json['amount'] as num).toInt(),
        status: json['status'] as String,
        rail: json['rail'] as String? ?? '',
        provider: json['provider'] as String?,
        reference: json['reference'] as String?,
        createdAt: json['created_at'] as String? ?? '',
        successfulAt: json['successful_at'] as String?,
        failedAt: json['failed_at'] as String?,
        metadata: _map(json['metadata']),
      );

  final String id;
  final int amount;
  final String status;
  final String rail;
  final String? provider;
  final String? reference;
  final String createdAt;
  final String? successfulAt;
  final String? failedAt;
  final Map<String, dynamic>? metadata;

  bool get reportedByTenant =>
      (metadata?['initiated_by'] as Map<String, dynamic>?)?['client_user_id'] ==
      null;
}

class InvoiceModel {
  InvoiceModel({
    required this.id,
    required this.code,
    required this.status,
    required this.totalAmount,
    this.subTotal,
    this.taxes = 0,
    required this.currency,
    this.payerType = '',
    this.allowedPaymentRails = const [],
    this.voidedReason,
    this.dueDate,
    this.issuedAt,
    this.paidAt,
    this.propertyId,
    this.property,
    this.payerLeaseId,
    this.payerLease,
    this.financialAccountId,
    this.applicant,
    this.lineItems = const [],
    this.payments = const [],
    required this.contextType,
  });

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    final property = _map(json['property']);
    final lease = _map(json['payer_lease']);
    final applicant = _map(
      _map(json['financial_account'])?['tenant_application'],
    );
    return InvoiceModel(
      id: json['id'] as String,
      code: json['code'] as String? ?? '',
      status: json['status'] as String,
      totalAmount: (json['total_amount'] as num).toInt(),
      subTotal: (json['sub_total'] as num?)?.toInt(),
      taxes: (json['taxes'] as num?)?.toInt() ?? 0,
      currency: json['currency'] as String? ?? 'GHS',
      payerType: json['payer_type'] as String? ?? '',
      allowedPaymentRails: [
        for (final r
            in (json['allowed_payment_rails'] as List<dynamic>? ?? const []))
          r as String,
      ],
      voidedReason: json['voided_reason'] as String?,
      dueDate: json['due_date'] as String?,
      issuedAt: json['issued_at'] as String?,
      paidAt: json['paid_at'] as String?,
      propertyId: json['property_id'] as String?,
      property: property == null
          ? null
          : InvoicePropertyModel.fromJson(property),
      payerLeaseId: json['payer_lease_id'] as String?,
      payerLease: lease == null ? null : InvoiceLeaseModel.fromJson(lease),
      financialAccountId: json['financial_account_id'] as String?,
      applicant: applicant == null
          ? null
          : InvoiceApplicantModel.fromJson(applicant),
      lineItems: [
        for (final e in (json['line_items'] as List<dynamic>? ?? const []))
          InvoiceLineItemModel.fromJson(e as Map<String, dynamic>),
      ],
      payments: [
        for (final e in (json['payments'] as List<dynamic>? ?? const []))
          InvoicePaymentModel.fromJson(e as Map<String, dynamic>),
      ],
      contextType: json['context_type'] as String? ?? '',
    );
  }

  final String id;
  final String code;
  final String status;
  final int totalAmount;

  /// Null when the payload omits it; fall back to [totalAmount] less [taxes].
  final int? subTotal;
  final int taxes;
  final String currency;
  final String payerType;
  final List<String> allowedPaymentRails;
  final String? voidedReason;
  final String? dueDate;
  final String? issuedAt;
  final String? paidAt;
  final String? propertyId;
  final InvoicePropertyModel? property;
  final String? payerLeaseId;
  final InvoiceLeaseModel? payerLease;
  final String? financialAccountId;
  final InvoiceApplicantModel? applicant;
  final List<InvoiceLineItemModel> lineItems;
  final List<InvoicePaymentModel> payments;
  final String contextType;
}

class InvoicesPage {
  InvoicesPage({required this.rows, required this.meta});

  final List<InvoiceModel> rows;
  final PaginationMetaModel meta;
}
