import 'dart:async';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:rentloop_manager/src/api/r2_upload_service.dart';

part 'document_picker.g.dart';

const kMaxLeaseDocumentBytes = 5242880;
const kLeaseDocumentPrefix = 'tenant-applications/lease-documents';
const kLeaseDocumentTooLarge =
    'That file is bigger than 5MB. Pick a smaller one.';

String contentTypeForExtension(String ext) {
  switch (ext.toLowerCase()) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    default:
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
}

class PickedDocument {
  const PickedDocument({
    required this.name,
    required this.bytes,
    required this.extension,
    required this.contentType,
  });

  final String name;
  final List<int> bytes;
  final String extension;
  final String contentType;
}

abstract class LeaseDocumentPicker {
  Future<PickedDocument?> pick();
}

class FilePickerLeaseDocumentPicker implements LeaseDocumentPicker {
  const FilePickerLeaseDocumentPicker();

  @override
  Future<PickedDocument?> pick() async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'doc', 'docx'],
      withData: true,
    );
    final file = result?.files.single;
    if (file == null) return null;
    final bytes =
        file.bytes ??
        (file.path == null ? null : await File(file.path!).readAsBytes());
    if (bytes == null) return null;
    final ext =
        file.extension?.toLowerCase() ??
        (file.name.contains('.')
            ? file.name.split('.').last.toLowerCase()
            : '');
    return PickedDocument(
      name: file.name,
      bytes: bytes,
      extension: ext,
      contentType: contentTypeForExtension(ext),
    );
  }
}

@riverpod
LeaseDocumentPicker leaseDocumentPicker(LeaseDocumentPickerRef ref) =>
    const FilePickerLeaseDocumentPicker();

Future<({String? url, String? error})> uploadLeaseDocument(
  R2UploadService service,
  PickedDocument? document,
) async {
  if (document == null) return (url: null, error: null);
  if (document.bytes.length > kMaxLeaseDocumentBytes) {
    return (url: null, error: kLeaseDocumentTooLarge);
  }
  final url = await service
      .uploadBytes(
        document.bytes,
        objectKeyPrefix: kLeaseDocumentPrefix,
        ext: document.extension,
        contentType: document.contentType,
      )
      .timeout(const Duration(seconds: 60));
  return (url: url, error: null);
}

typedef UrlOpener = Future<bool> Function(Uri url);

@riverpod
UrlOpener urlOpener(UrlOpenerRef ref) =>
    (url) => launchUrl(url, mode: LaunchMode.externalApplication);
