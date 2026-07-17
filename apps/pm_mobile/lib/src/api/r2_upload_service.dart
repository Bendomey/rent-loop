import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:http/http.dart' as http;
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/constants.dart';

part 'r2_upload_service.g.dart';

String _generateKey() {
  final rand = Random.secure();
  final bytes = List<int>.generate(8, (_) => rand.nextInt(256));
  return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
}

/// Uploads unit/property photos to Cloudflare R2 via the property-manager
/// web app's proxy endpoint (`kR2UploadUrl`) — mirrors apps/go's
/// `R2UploadService` exactly, same shared endpoint.
class R2UploadService {
  const R2UploadService();

  Future<String> uploadFile(File file) async {
    final ext = file.path.contains('.') ? file.path.split('.').last : 'jpg';
    final uniqueName =
        '${DateTime.now().millisecondsSinceEpoch}-${_generateKey()}.$ext';
    final objectKey = 'property/images/$uniqueName';

    final uri = Uri.parse(kR2UploadUrl);
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
R2UploadService r2UploadService(R2UploadServiceRef ref) =>
    const R2UploadService();
