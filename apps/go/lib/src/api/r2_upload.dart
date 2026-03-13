import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:flutter/cupertino.dart';
import 'package:http/http.dart' as http;
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/constants.dart';

part 'r2_upload.g.dart';

String _generateKey() {
  final rand = Random.secure();
  final bytes = List<int>.generate(8, (_) => rand.nextInt(256));
  return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
}

class R2UploadService {
  final String? tenantId;

  const R2UploadService({required this.tenantId});

  /// Uploads [file] to Cloudflare R2 via the property-manager proxy endpoint.
  ///
  /// Sends multipart/form-data with `file` + `objectKey` to [R2_UPLOAD_URL].
  /// The server uploads to R2 and returns `{"url": "..."}`.
  Future<String> uploadFile(File file) async {
    if (tenantId == null) {
      throw Exception('No tenant ID — make sure you are logged in');
    }

    final ext = file.path.contains('.') ? file.path.split('.').last : 'bin';
    final uniqueName =
        '${DateTime.now().millisecondsSinceEpoch}-${_generateKey()}.$ext';
    final objectKey = 'tenant-$tenantId-MRs/$uniqueName';

    final uri = Uri.parse(R2_UPLOAD_URL);
    final request = http.MultipartRequest('POST', uri)
      ..fields['objectKey'] = objectKey
      ..files.add(await http.MultipartFile.fromPath('file', file.path));

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);

    if (response.statusCode >= 400) {
      throw Exception(
        'Upload failed (${response.statusCode}): ${response.body}',
      );
    }

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    final url = decoded['url'] as String?;
    if (url == null) {
      throw Exception('No URL in upload response: ${response.body}');
    }
    return url;
  }
}

@riverpod
R2UploadService r2UploadService(R2UploadServiceRef ref) {
  final tenantId = ref.watch(currentUserNotifierProvider)?.tenantId;
  return R2UploadService(tenantId: tenantId);
}
