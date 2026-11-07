import 'package:rentloop_manager/src/repository/models/invoice_model.dart';

InvoicePaymentModel paidOn(
  int amount,
  String at, {
  String status = 'SUCCESSFUL',
}) => InvoicePaymentModel(
  id: 'pay$amount$at',
  amount: amount,
  status: status,
  rail: 'OFFLINE',
  createdAt: at,
  successfulAt: status == 'SUCCESSFUL' ? at : null,
);

InvoiceLineItemModel lineItem(
  String label, {
  String category = 'EXPENSE',
  int amount = 200000,
  int quantity = 1,
}) => InvoiceLineItemModel(
  id: label,
  label: label,
  category: category,
  quantity: quantity,
  unitAmount: amount,
  totalAmount: amount * quantity,
);

InvoiceModel printBill({
  String status = 'ISSUED',
  int total = 200000,
  int? subTotal,
  int taxes = 0,
  String? due,
  String? issued = '2026-04-27T10:00:00Z',
  String contextType = 'GENERAL_EXPENSE',
  List<String> rails = const ['OFFLINE'],
  List<InvoicePaymentModel> payments = const [],
  List<InvoiceLineItemModel>? lines,
  String? voidedReason,
  bool withLease = true,
  InvoiceApplicantModel? applicant,
}) => InvoiceModel(
  id: 'b1',
  code: 'INV-2604-3DYMMV',
  status: status,
  totalAmount: total,
  subTotal: subTotal ?? total - taxes,
  taxes: taxes,
  currency: 'GHS',
  payerType: 'TENANT',
  allowedPaymentRails: rails,
  voidedReason: voidedReason,
  dueDate: due,
  issuedAt: issued,
  property: InvoicePropertyModel(id: 'p1', name: "Domey's Residence"),
  payerLease: withLease
      ? InvoiceLeaseModel(
          id: 'l1',
          code: '2603TMJH7H',
          tenant: InvoiceTenantModel(
            id: 't1',
            firstName: 'Benjamin',
            otherNames: 'Armah-Kessey',
            lastName: 'Domey',
            phone: '+233201080802',
          ),
          unit: InvoiceUnitModel(
            id: 'u1',
            name: "Domey's Residence",
            propertyBlock: InvoiceBlockModel(name: 'Main'),
          ),
        )
      : null,
  applicant: applicant,
  lineItems: lines ?? [lineItem('security, waste management')],
  payments: payments,
  contextType: contextType,
);
