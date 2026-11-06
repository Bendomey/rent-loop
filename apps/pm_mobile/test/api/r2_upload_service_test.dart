import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:rentloop_manager/src/api/r2_upload_service.dart';

Future<String> _sentBody(Future<void> Function() upload) async {
  late String body;
  final client = MockClient((request) async {
    body = request.body.toLowerCase();
    return http.Response(jsonEncode({'url': 'https://cdn.example/x'}), 200);
  });
  await http.runWithClient(upload, () => client);
  return body;
}

void main() {
  test('uploadBytes sends the given content type on the file part', () async {
    final body = await _sentBody(
      () => const R2UploadService().uploadBytes(
        [1, 2, 3],
        objectKeyPrefix: 'p',
        ext: 'pdf',
        contentType: 'application/pdf',
      ),
    );
    expect(body, contains('content-type: application/pdf'));
  });

  test('uploadBytes without contentType keeps the default', () async {
    final body = await _sentBody(
      () => const R2UploadService().uploadBytes([1], objectKeyPrefix: 'p'),
    );
    expect(body, contains('content-type: application/octet-stream'));
  });
}
