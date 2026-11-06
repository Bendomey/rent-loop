import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/application_checklist.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';

const _inProgress = 'TenantApplication.Status.InProgress';
const _completed = 'TenantApplication.Status.Completed';

Map<String, dynamic> _unit([String status = 'Unit.Status.Available']) => {
  'id': 'u1',
  'name': 'Unit 1C',
  'type': 'APARTMENT',
  'status': status,
  'rent_fee': 300000,
  'rent_fee_currency': 'GHS',
};

const _contact = {
  'first_name': 'A',
  'last_name': 'B',
  'phone': '+233200000000',
  'gender': 'FEMALE',
  'date_of_birth': '1990-01-01T00:00:00Z',
  'nationality': 'GH',
  'marital_status': 'SINGLE',
  'current_address': 'addr',
};

const _rest = {
  'id_type': 'GHANA_CARD',
  'id_number': '1',
  'employer_type': 'WORKER',
  'occupation': 'o',
  'employer': 'emp',
  'occupation_address': 'oa',
  'emergency_contact_name': 'e',
  'emergency_contact_phone': '+233200000001',
  'relationship_to_emergency_contact': 'r',
};

const _moveIn = {
  'desired_move_in_date': '2026-08-01T00:00:00Z',
  'stay_duration_frequency': 'MONTHLY',
  'stay_duration': 12,
};

const _financial = {
  'rent_fee': 300000,
  'financial_account': {'id': 'fa', 'charge_count': 3},
};

TenantApplicationModel _app(Map<String, dynamic> fields) =>
    TenantApplicationModel.fromJson({
      'id': 'a',
      'code': 'TA-1',
      'status': _inProgress,
      ...fields,
    });

ChecklistStep _step(ApplicationChecklist c, ChecklistSection s) =>
    c.steps.firstWhere((x) => x.section == s);

void main() {
  test('a fresh application: unit todo, move-in blocked, progress 0', () {
    final c = computeApplicationChecklist(_app({}));
    expect(c.steps, hasLength(5));
    expect(_step(c, ChecklistSection.unit).state, ChecklistStepState.todo);
    expect(_step(c, ChecklistSection.moveIn).state, ChecklistStepState.blocked);
    expect(c.progress, 0);
  });

  test('unit only: unit done, move-in todo', () {
    final c = computeApplicationChecklist(_app({'desired_unit': _unit()}));
    expect(_step(c, ChecklistSection.unit).state, ChecklistStepState.done);
    expect(_step(c, ChecklistSection.moveIn).state, ChecklistStepState.todo);
    expect(c.progress, closeTo(0.2, 1e-9));
  });

  test('an occupied desired unit on an in-progress application', () {
    final c = computeApplicationChecklist(
      _app({'desired_unit': _unit('Unit.Status.Occupied')}),
    );
    expect(_step(c, ChecklistSection.unit).state, ChecklistStepState.attention);
  });

  test('an occupied unit is not attention once completed', () {
    final c = computeApplicationChecklist(
      _app({
        'desired_unit': _unit('Unit.Status.Occupied'),
        'status': _completed,
      }),
    );
    expect(_step(c, ChecklistSection.unit).state, ChecklistStepState.locked);
  });

  test('only the contact group complete: tenant progress 1 of 4', () {
    final c = computeApplicationChecklist(_app(_contact));
    final tenant = _step(c, ChecklistSection.tenant);
    expect(tenant.state, ChecklistStepState.progress);
    expect(tenant.doneItems, 1);
    expect(tenant.totalItems, 4);
  });

  test('an empty string does not count as filled', () {
    final c = computeApplicationChecklist(_app({..._contact, 'phone': ''}));
    expect(_step(c, ChecklistSection.tenant).doneItems, 0);
  });

  test('completed with everything filled locks every step with items', () {
    final c = computeApplicationChecklist(
      _app({
        'status': _completed,
        'desired_unit': _unit(),
        ..._contact,
        ..._rest,
        ..._moveIn,
        ..._financial,
      }),
    );
    for (final s in [
      ChecklistSection.unit,
      ChecklistSection.tenant,
      ChecklistSection.moveIn,
      ChecklistSection.financial,
    ]) {
      expect(_step(c, s).state, ChecklistStepState.locked);
    }
    expect(_step(c, ChecklistSection.docs).totalItems, 0);
  });

  group('canApprove', () {
    final filled = {'desired_unit': _unit(), ..._contact, ..._rest, ..._moveIn};

    test('false while financial is incomplete and docs has no items', () {
      final c = computeApplicationChecklist(_app(filled));
      expect(c.canApprove, isFalse);
    });

    test('true when everything with items is complete', () {
      final c = computeApplicationChecklist(_app({...filled, ..._financial}));
      expect(c.canApprove, isTrue);
    });

    test('false when a docs mode is set but nothing is attached', () {
      final c = computeApplicationChecklist(
        _app({
          ...filled,
          ..._financial,
          'lease_agreement_document_mode': 'ONLINE',
        }),
      );
      expect(c.canApprove, isFalse);
      expect(_step(c, ChecklistSection.docs).totalItems, 3);
    });
  });
}
