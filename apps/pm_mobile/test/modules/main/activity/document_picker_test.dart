import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/r2_upload_service.dart';
import 'package:rentloop_manager/src/modules/main/activity/document_picker.dart';

class _FakeUpload extends R2UploadService {
  _FakeUpload();
  final calls = <Map<String, Object?>>[];

  @override
  Future<String> uploadBytes(
    List<int> bytes, {
    required String objectKeyPrefix,
    String ext = 'png',
    String? contentType,
  }) async {
    calls.add({
      'prefix': objectKeyPrefix,
      'ext': ext,
      'contentType': contentType,
    });
    return 'https://cdn.example/lease.$ext';
  }
}

PickedDocument _doc(String name, String ext, int size) => PickedDocument(
  name: name,
  bytes: List<int>.filled(size, 1),
  extension: ext,
  contentType: contentTypeForExtension(ext),
);

void main() {
  const docxType =
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  test('rejects files over 5MB without uploading', () async {
    final upload = _FakeUpload();
    final result = await uploadLeaseDocument(
      upload,
      _doc('big.pdf', 'pdf', 6 * 1024 * 1024),
    );
    expect(result.url, isNull);
    expect(result.error, 'That file is bigger than 5MB. Pick a smaller one.');
    expect(upload.calls, isEmpty);
  });

  test('uploads a docx with prefix, extension and content type', () async {
    final upload = _FakeUpload();
    final result = await uploadLeaseDocument(
      upload,
      _doc('lease.docx', 'docx', 1024 * 1024),
    );
    expect(result.error, isNull);
    expect(result.url, 'https://cdn.example/lease.docx');
    expect(upload.calls.single, {
      'prefix': 'tenant-applications/lease-documents',
      'ext': 'docx',
      'contentType': docxType,
    });
  });

  test('a cancelled pick gives no error and no upload', () async {
    final upload = _FakeUpload();
    final result = await uploadLeaseDocument(upload, null);
    expect(result.url, isNull);
    expect(result.error, isNull);
    expect(upload.calls, isEmpty);
  });

  test('maps extensions to content types', () {
    expect(contentTypeForExtension('pdf'), 'application/pdf');
    expect(contentTypeForExtension('doc'), 'application/msword');
    expect(contentTypeForExtension('docx'), docxType);
  });

  testWidgets('an upload that never completes times out after 60 seconds', (
    tester,
  ) async {
    final future = uploadLeaseDocument(
      _HangingUpload(),
      _doc('a.pdf', 'pdf', 10),
    );
    final expectation = expectLater(future, throwsA(isA<TimeoutException>()));
    await tester.pump(const Duration(seconds: 61));
    await expectation;
  });
}

class _HangingUpload extends R2UploadService {
  @override
  Future<String> uploadBytes(
    List<int> bytes, {
    required String objectKeyPrefix,
    String ext = 'png',
    String? contentType,
  }) => Completer<String>().future;
}
