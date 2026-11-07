import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/repository/models/invoice_model.dart';

void mockHaptics() {
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(
        const MethodChannel('haptic_feedback'),
        (_) async => null,
      );
}

InvoicePaymentModel successfulPayment({int amount = 100000}) =>
    InvoicePaymentModel(
      id: 'pay0',
      amount: amount,
      status: 'SUCCESSFUL',
      rail: 'OFFLINE',
      provider: 'CASH',
      reference: 'RC-1',
      createdAt: '2026-10-01T00:00:00Z',
      successfulAt: '2026-10-02T00:00:00Z',
    );

InvoicePaymentModel pendingPayment({int amount = 30000}) => InvoicePaymentModel(
  id: 'pay1',
  amount: amount,
  status: 'PENDING',
  rail: 'OFFLINE',
  provider: 'MTN',
  reference: 'MM-77',
  createdAt: '2026-11-01T00:00:00Z',
);

InvoicePaymentModel failedPayment() => InvoicePaymentModel(
  id: 'pay2',
  amount: 5000,
  status: 'FAILED',
  rail: 'OFFLINE',
  createdAt: '2026-10-05T00:00:00Z',
);

InvoiceModel billFixture({
  List<InvoicePaymentModel>? payments,
  String? phone = '+233240000000',
  String? email = 'kofi@example.com',
}) => InvoiceModel(
  id: 'b1',
  code: 'INV-2041',
  status: 'PARTIALLY_PAID',
  totalAmount: 400000,
  currency: 'GHS',
  dueDate: '2030-01-01T00:00:00Z',
  propertyId: 'p1',
  property: InvoicePropertyModel(id: 'p1', name: 'Cantonments'),
  payerLease: InvoiceLeaseModel(
    id: 'l1',
    tenant: InvoiceTenantModel(
      id: 't1',
      firstName: 'Kofi',
      lastName: 'Boateng',
      phone: phone,
      email: email,
    ),
    unit: InvoiceUnitModel(
      id: 'u1',
      name: 'Unit 5A',
      propertyBlock: InvoiceBlockModel(name: 'Block B'),
    ),
  ),
  lineItems: [
    InvoiceLineItemModel(
      id: 'li1',
      label: 'Rent',
      category: 'RENT',
      quantity: 1,
      unitAmount: 400000,
      totalAmount: 400000,
    ),
  ],
  payments: payments ?? [successfulPayment(), pendingPayment()],
  contextType: 'LEASE',
);
