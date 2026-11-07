import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/r2_upload_service.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_data.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_detail_pages.dart';
import 'package:rentloop_manager/src/modules/main/activity/document_picker.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/update_application_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _url = 'https://cdn.example/lease.pdf';

TenantApplicationModel _app({
  String status = 'TenantApplication.Status.InProgress',
  String? mode,
  String? url,
  String? docStatus,
  Map<String, dynamic>? document,
}) => TenantApplicationModel.fromJson({
  'id': 'a1',
  'code': 'APP-1',
  'status': status,
  'property_id': 'p1',
  'first_name': 'Ama',
  'last_name': 'Mensah',
  if (mode != null) 'lease_agreement_document_mode': mode,
  if (url != null) 'lease_agreement_document_url': url,
  if (docStatus != null) 'lease_agreement_document_status': docStatus,
  if (document != null) 'lease_agreement_document': document,
});

class _FakeUpdate extends UpdateApplicationNotifier {
  static final patches = <Map<String, dynamic>>[];
  static bool fail = false;

  @override
  Future<void> submit({
    required String propertyId,
    required String id,
    required Map<String, dynamic> patch,
    String? accountId,
  }) async {
    patches.add(patch);
    state = fail
        ? UpdateApplicationState(
            status: ApiStatus.failed,
            errorMessage: 'Could not save that',
          )
        : UpdateApplicationState(status: ApiStatus.success);
  }
}

class _FakePicker implements LeaseDocumentPicker {
  static int picks = 0;
  static bool throws = false;

  @override
  Future<PickedDocument?> pick() async {
    picks++;
    if (throws) throw Exception('picker');
    return const PickedDocument(
      name: 'lease.pdf',
      bytes: [1, 2, 3],
      extension: 'pdf',
      contentType: 'application/pdf',
    );
  }
}

class _FakeUpload extends R2UploadService {
  static bool fail = false;
  static int uploads = 0;
  static Completer<String>? gate;

  @override
  Future<String> uploadBytes(
    List<int> bytes, {
    required String objectKeyPrefix,
    String ext = 'png',
    String? contentType,
  }) async {
    uploads++;
    if (gate != null) return gate!.future;
    if (fail) throw Exception('network');
    return _url;
  }
}

Future<List<Uri>> _pump(
  WidgetTester tester,
  TenantApplicationModel app, {
  String role = 'MANAGER',
  bool opens = true,
  bool loadFails = false,
}) async {
  tester.view.physicalSize = const Size(800, 2400);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  final opened = <Uri>[];
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        applicationDetailProvider('p1', 'a1').overrideWith((ref) async {
          if (loadFails) throw Exception('offline');
          return app;
        }),
        myPropertyRolesProvider.overrideWith((ref) async => {'p1': role}),
        updateApplicationNotifierProvider.overrideWith(_FakeUpdate.new),
        leaseDocumentPickerProvider.overrideWithValue(_FakePicker()),
        r2UploadServiceProvider.overrideWithValue(_FakeUpload()),
        urlOpenerProvider.overrideWithValue((uri) async {
          opened.add(uri);
          return opens;
        }),
      ],
      child: MaterialApp(
        home: ApplicationDocsPage(
          data: ApplicationDetailData.fromApplicationModel(app),
          propertyId: 'p1',
        ),
      ),
    ),
  );
  await tester.pump();
  await tester.pump();
  return opened;
}

void main() {
  setUp(() {
    _FakeUpdate.patches.clear();
    _FakeUpdate.fail = false;
    _FakeUpload.fail = false;
    _FakeUpload.uploads = 0;
    _FakeUpload.gate = null;
    _FakePicker.picks = 0;
    _FakePicker.throws = false;
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  testWidgets('no document shows the empty text and Add for a manager', (
    tester,
  ) async {
    await _pump(tester, _app());

    expect(
      find.text('No lease document yet. Adding one is optional.'),
      findsOneWidget,
    );
    expect(find.text('Add the lease document'), findsOneWidget);
  });

  testWidgets('staff cannot add', (tester) async {
    await _pump(tester, _app(), role: 'STAFF');

    expect(find.text('Add the lease document'), findsNothing);
  });

  testWidgets('MANUAL without a URL is treated as no document', (tester) async {
    await _pump(tester, _app(mode: 'MANUAL'));

    expect(find.text('Add the lease document'), findsOneWidget);
    expect(find.text('Uploaded document'), findsNothing);
  });

  testWidgets('pick, upload, then Attach sends the attach patch', (
    tester,
  ) async {
    await _pump(tester, _app());
    await tester.tap(find.text('Add the lease document'));
    await tester.pumpAndSettle();

    expect(
      find.text(
        'Upload your own lease or tenancy document. PDF or Word, up to 5MB.',
      ),
      findsOneWidget,
    );
    await tester.tap(find.text('Choose document'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Attach'));
    await tester.pumpAndSettle();

    expect(_FakeUpdate.patches.single, {
      'lease_agreement_document_url': _url,
      'lease_agreement_document_mode': 'MANUAL',
      'lease_agreement_document_id': null,
      'lease_agreement_document_status': null,
    });
    expect(find.text('Choose document'), findsNothing);
  });

  testWidgets('Attach stays disabled until a file is uploaded', (tester) async {
    await _pump(tester, _app());
    await tester.tap(find.text('Add the lease document'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Attach'));
    await tester.pumpAndSettle();

    expect(_FakeUpdate.patches, isEmpty);
  });

  testWidgets('a failed upload offers a retry and a failed save keeps the '
      'sheet open with the error', (tester) async {
    await _pump(tester, _app());
    await tester.tap(find.text('Add the lease document'));
    await tester.pumpAndSettle();

    _FakeUpload.fail = true;
    await tester.tap(find.text('Choose document'));
    await tester.pumpAndSettle();
    expect(find.text('Upload failed — try again'), findsOneWidget);

    _FakeUpload.fail = false;
    _FakeUpdate.fail = true;
    await tester.tap(find.text('Try again'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Attach'));
    await tester.pumpAndSettle();

    expect(find.text('Could not save that'), findsOneWidget);
    expect(find.text('Uploaded document'), findsNothing);
  });

  testWidgets('a failed load shows the error state with Try again', (tester) async {
    await _pump(tester, _app(), loadFails: true);

    expect(find.text("Couldn't load the lease document"), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);
  });

  testWidgets('Cancel is disabled while uploading', (tester) async {
    await _pump(tester, _app());
    await tester.tap(find.text('Add the lease document'));
    await tester.pumpAndSettle();
    _FakeUpload.gate = Completer<String>();
    await tester.tap(find.text('Choose document'));
    await tester.pump();

    final cancel = tester.widget<RLBtn>(find.widgetWithText(RLBtn, 'Cancel'));
    expect(cancel.onPressed, isNull);
    _FakeUpload.gate!.complete(_url);
    await tester.pumpAndSettle();
  });

  testWidgets('Try again retries the same file; Choose another file re-picks', (
    tester,
  ) async {
    await _pump(tester, _app());
    await tester.tap(find.text('Add the lease document'));
    await tester.pumpAndSettle();

    _FakeUpload.fail = true;
    await tester.tap(find.text('Choose document'));
    await tester.pumpAndSettle();
    expect(_FakePicker.picks, 1);

    await tester.tap(find.text('Try again'));
    await tester.pumpAndSettle();
    expect(_FakePicker.picks, 1);
    expect(_FakeUpload.uploads, 2);

    await tester.tap(find.text('Choose another file'));
    await tester.pumpAndSettle();
    expect(_FakePicker.picks, 2);
  });

  testWidgets('a picker error says the file could not be opened', (
    tester,
  ) async {
    await _pump(tester, _app());
    await tester.tap(find.text('Add the lease document'));
    await tester.pumpAndSettle();

    _FakePicker.throws = true;
    await tester.tap(find.text('Choose document'));
    await tester.pumpAndSettle();

    expect(find.text("Couldn't open that file. Try another."), findsOneWidget);
    expect(find.text('Upload failed — try again'), findsNothing);
  });

  testWidgets('Open launches the document URL', (tester) async {
    final opened = await _pump(tester, _app(mode: 'MANUAL', url: _url));

    expect(find.text('Uploaded document'), findsOneWidget);
    await tester.tap(find.text('Open'));
    await tester.pump();

    expect(opened.single, Uri.parse(_url));
  });

  testWidgets('Open tells the user when the document cannot be opened', (
    tester,
  ) async {
    await _pump(tester, _app(mode: 'MANUAL', url: _url), opens: false);
    await tester.tap(find.text('Open'));
    await tester.pump();

    final container = ProviderScope.containerOf(
      tester.element(find.byType(ApplicationDocsPage)),
    );
    expect(
      container.read(rlToastProvider)?.title,
      "Couldn't open the document.",
    );
    await tester.pump(const Duration(seconds: 5));
  });

  testWidgets('Remove confirms, then sends four nulls', (tester) async {
    await _pump(tester, _app(mode: 'MANUAL', url: _url));
    await tester.tap(find.text('Remove'));
    await tester.pumpAndSettle();

    expect(find.text('You can add another one later.'), findsOneWidget);
    expect(_FakeUpdate.patches, isEmpty);
    await tester.tap(find.text('Remove').last);
    await tester.pumpAndSettle();

    expect(_FakeUpdate.patches.single, {
      'lease_agreement_document_url': null,
      'lease_agreement_document_mode': null,
      'lease_agreement_document_id': null,
      'lease_agreement_document_status': null,
    });
  });

  testWidgets('Replace opens the upload sheet and patches the new URL', (
    tester,
  ) async {
    await _pump(tester, _app(mode: 'MANUAL', url: 'https://old/doc.pdf'));
    await tester.tap(find.text('Replace'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Choose document'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Attach'));
    await tester.pumpAndSettle();

    expect(_FakeUpdate.patches.single['lease_agreement_document_url'], _url);
  });

  testWidgets('an online document links to the web and has no edits', (
    tester,
  ) async {
    final opened = await _pump(
      tester,
      _app(mode: 'ONLINE', document: {'id': 'd1', 'title': 'Standard tenancy'}),
    );

    expect(find.text('Standard tenancy'), findsOneWidget);
    expect(
      find.text('This document was written on the web. Finish it there.'),
      findsOneWidget,
    );
    expect(find.text('Replace'), findsNothing);
    expect(find.text('Remove'), findsNothing);
    await tester.tap(find.text('Open on the web'));
    await tester.pump();

    expect(opened.single.host, 'pm.rentloopapp.com');
    expect(opened.single.path, '/properties/p1/occupancy/applications/a1/docs');
  });

  testWidgets('a signed online document says it cannot change', (tester) async {
    await _pump(
      tester,
      _app(
        mode: 'ONLINE',
        docStatus: 'SIGNED',
        document: {'id': 'd1', 'title': 'Standard tenancy'},
      ),
    );

    expect(
      find.text('The agreement is signed, so it cannot change now.'),
      findsOneWidget,
    );
    expect(find.text('Open on the web'), findsOneWidget);
  });

  testWidgets('a signed document is Open only with a note', (tester) async {
    await _pump(tester, _app(mode: 'MANUAL', url: _url, docStatus: 'SIGNED'));

    expect(
      find.text('The agreement is signed, so it cannot change now.'),
      findsOneWidget,
    );
    expect(find.text('Open'), findsOneWidget);
    expect(find.text('Replace'), findsNothing);
    expect(find.text('Remove'), findsNothing);
  });

  testWidgets('a completed tenant setup allows no writes', (tester) async {
    await _pump(
      tester,
      _app(
        status: 'TenantApplication.Status.Completed',
        mode: 'MANUAL',
        url: _url,
      ),
    );

    expect(find.text('Open'), findsOneWidget);
    expect(find.text('Replace'), findsNothing);
    expect(find.text('Remove'), findsNothing);
    expect(find.text('Add the lease document'), findsNothing);
  });
}
