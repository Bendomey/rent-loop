import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:image_picker/image_picker.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/r2_upload_service.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

part 'application_form_widgets.g.dart';

bool isAdult(DateTime dob, DateTime now) {
  final cutoff = DateTime(now.year - 18, now.month, now.day);
  return !DateTime(dob.year, dob.month, dob.day).isAfter(cutoff);
}

class PickedImageBytes {
  const PickedImageBytes(this.bytes, this.ext);
  final Uint8List bytes;
  final String ext;
}

class ApplicationImagePicker {
  const ApplicationImagePicker();

  Future<PickedImageBytes?> pick(ImageSource source) async {
    final picked = await ImagePicker().pickImage(
      source: source,
      maxWidth: 1800,
      maxHeight: 1800,
      imageQuality: 85,
    );
    if (picked == null) return null;
    final name = picked.path;
    final ext = name.contains('.') ? name.split('.').last.toLowerCase() : 'jpg';
    return PickedImageBytes(await picked.readAsBytes(), ext);
  }
}

@riverpod
ApplicationImagePicker applicationImagePicker(ApplicationImagePickerRef ref) =>
    const ApplicationImagePicker();

enum _UploadStatus { idle, uploading, failed, done }

/// A photo field that uploads as soon as one is chosen. [onChanged] receives a
/// finished URL, or null on Remove — never a partial one; [onBlockingChanged]
/// reports whether an upload is running or has failed and not yet been
/// retried or removed.
class ApplicationUploadTile extends ConsumerStatefulWidget {
  const ApplicationUploadTile({
    super.key,
    required this.label,
    required this.objectKeyPrefix,
    required this.onChanged,
    required this.onBlockingChanged,
    this.initialUrl,
    this.optional = true,
    this.circular = false,
  });

  final String label;
  final String objectKeyPrefix;
  final String? initialUrl;
  final bool optional;
  final bool circular;
  final ValueChanged<String?> onChanged;
  final ValueChanged<bool> onBlockingChanged;

  @override
  ConsumerState<ApplicationUploadTile> createState() =>
      _ApplicationUploadTileState();
}

class _ApplicationUploadTileState extends ConsumerState<ApplicationUploadTile> {
  late _UploadStatus _status = widget.initialUrl == null
      ? _UploadStatus.idle
      : _UploadStatus.done;
  late String? _url = widget.initialUrl;
  PickedImageBytes? _image;

  @override
  void didUpdateWidget(ApplicationUploadTile old) {
    super.didUpdateWidget(old);
    if (widget.initialUrl != old.initialUrl &&
        _status != _UploadStatus.uploading &&
        _image == null) {
      _url = widget.initialUrl;
      _status = _url == null ? _UploadStatus.idle : _UploadStatus.done;
    }
  }

  @override
  void dispose() {
    if (_status == _UploadStatus.failed) {
      final onBlocking = widget.onBlockingChanged;
      WidgetsBinding.instance.addPostFrameCallback((_) => onBlocking(false));
    }
    super.dispose();
  }

  void _setStatus(_UploadStatus status) {
    setState(() => _status = status);
    widget.onBlockingChanged(
      status == _UploadStatus.uploading || status == _UploadStatus.failed,
    );
  }

  Future<void> _choose() async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted || _status == _UploadStatus.uploading) return;
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: RLTokens.surface,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: const Text('Take a photo'),
              onTap: () => Navigator.of(ctx).pop(ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Choose from gallery'),
              onTap: () => Navigator.of(ctx).pop(ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null || !mounted) return;
    PickedImageBytes? image;
    try {
      image = await ref.read(applicationImagePickerProvider).pick(source);
    } catch (_) {
      return;
    }
    if (image == null || !mounted) return;
    _image = image;
    await _upload();
  }

  Future<void> _upload() async {
    final image = _image;
    if (image == null) return;
    final onChanged = widget.onChanged;
    final onBlocking = widget.onBlockingChanged;
    _setStatus(_UploadStatus.uploading);
    String? url;
    try {
      url = await ref
          .read(r2UploadServiceProvider)
          .uploadBytes(
            image.bytes,
            objectKeyPrefix: widget.objectKeyPrefix,
            ext: image.ext,
          );
    } catch (_) {
      url = null;
    }
    // The tile may have left the tree mid-upload (the user moved to another
    // step); the form still has to learn the outcome. A failure keeps the
    // photo already on file rather than wiping it.
    if (url != null) onChanged(url);
    onBlocking(url == null && mounted);
    if (!mounted) return;
    setState(() {
      if (url != null) _url = url;
      _status = url == null ? _UploadStatus.failed : _UploadStatus.done;
    });
  }

  void _remove() {
    Haptics.vibrate(HapticsType.selection);
    _image = null;
    _url = null;
    _setStatus(_UploadStatus.idle);
    widget.onChanged(null);
  }

  Widget _thumb() {
    final size = widget.circular ? 92.0 : 84.0;
    final Widget content;
    if (_status == _UploadStatus.uploading) {
      content = const Center(
        child: SizedBox(
          width: 22,
          height: 22,
          child: CircularProgressIndicator(strokeWidth: 2.5),
        ),
      );
    } else if (_image != null && _status == _UploadStatus.done) {
      content = Image.memory(_image!.bytes, fit: BoxFit.cover);
    } else if (_url != null && _status == _UploadStatus.done) {
      content = Image.network(
        _url!,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => const Icon(
          Icons.image_outlined,
          size: 24,
          color: RLTokens.mutedSoft,
        ),
      );
    } else {
      content = const Icon(
        Icons.camera_alt_outlined,
        size: 24,
        color: RLTokens.mutedSoft,
      );
    }
    return Container(
      width: size,
      height: size,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        shape: widget.circular ? BoxShape.circle : BoxShape.rectangle,
        borderRadius: widget.circular
            ? null
            : BorderRadius.circular(RLTokens.rMd),
        color: RLTokens.fill,
        border: Border.all(color: RLTokens.hairlineSoft),
      ),
      child: content,
    );
  }

  @override
  Widget build(BuildContext context) {
    final failed = _status == _UploadStatus.failed;
    final hasPhoto = _status == _UploadStatus.done;
    final body = Row(
      children: [
        _thumb(),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              RLBtn(
                label: hasPhoto ? 'Change image' : 'Choose image',
                kind: RLBtnKind.light,
                large: false,
                onPressed: _status == _UploadStatus.uploading ? null : _choose,
              ),
              if (failed) ...[
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: _upload,
                  child: const Text(
                    'Upload failed — tap to retry',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12.5,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.danger,
                    ),
                  ),
                ),
              ],
              if (failed || hasPhoto) ...[
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: _remove,
                  child: const Text(
                    'Remove',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12.5,
                      color: RLTokens.muted,
                    ),
                  ),
                ),
              ] else if (widget.optional && !failed) ...[
                const SizedBox(height: 8),
                const Text(
                  'Optional',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 11.5,
                    color: RLTokens.mutedSoft,
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );

    if (widget.circular) return body;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        border: Border.all(color: RLTokens.hairline),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.label,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              fontWeight: RLTokens.semibold,
              color: RLTokens.ink,
            ),
          ),
          const SizedBox(height: 10),
          body,
        ],
      ),
    );
  }
}
