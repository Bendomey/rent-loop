import 'dart:io';

import 'package:image_picker/image_picker.dart';
import 'package:rentloop_go/src/api/r2_upload.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:rentloop_go/src/shared/adaptive/menu.dart';

enum UploadStatus { idle, uploading, done, failed }

class UploadableAttachment {
  final File file;
  UploadStatus status;
  String? uploadedUrl;
  String? error;

  UploadableAttachment({
    required this.file,
    this.status = UploadStatus.idle,
    this.uploadedUrl,
    this.error,
  });

  bool get isUploading => status == UploadStatus.uploading;
  bool get isDone => status == UploadStatus.done;
  bool get isFailed => status == UploadStatus.failed;
}

typedef UploadStateCallback =
    void Function({
      required bool hasOngoingUploads,
      required List<String> uploadedUrls,
    });

class ManageAttachmentsWidget extends ConsumerStatefulWidget {
  const ManageAttachmentsWidget({
    super.key,
    required this.onUploadStateChanged,
  });

  final UploadStateCallback onUploadStateChanged;

  @override
  ConsumerState<ManageAttachmentsWidget> createState() =>
      _ManageAttachmentsWidgetState();
}

class _ManageAttachmentsWidgetState
    extends ConsumerState<ManageAttachmentsWidget> {
  final ImagePicker _picker = ImagePicker();
  final List<UploadableAttachment> _attachments = [];

  void _notifyParent() {
    final hasOngoing = _attachments.any((a) => a.isUploading);
    final urls = _attachments
        .where((a) => a.isDone && a.uploadedUrl != null)
        .map((a) => a.uploadedUrl!)
        .toList();
    widget.onUploadStateChanged(
      hasOngoingUploads: hasOngoing,
      uploadedUrls: urls,
    );
  }

  Future<void> _uploadAttachment(UploadableAttachment attachment) async {
    setState(() {
      attachment.status = UploadStatus.uploading;
      attachment.error = null;
    });
    _notifyParent();
    try {
      final url = await ref
          .read(r2UploadServiceProvider)
          .uploadFile(attachment.file);
      if (mounted) {
        setState(() {
          attachment.status = UploadStatus.done;
          attachment.uploadedUrl = url;
        });
        _notifyParent();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          attachment.status = UploadStatus.failed;
          attachment.error = e.toString();
        });
        _notifyParent();
      }
    }
  }

  void _addFiles(List<File> files) {
    for (final file in files) {
      final attachment = UploadableAttachment(file: file);
      setState(() => _attachments.add(attachment));
      _uploadAttachment(attachment);
    }
  }

  Future<void> _pickFromGallery() async {
    try {
      final picked = await _picker.pickMultiImage(
        maxWidth: 1800,
        maxHeight: 1800,
        imageQuality: 85,
      );
      _addFiles(picked.map((x) => File(x.path)).toList());
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error picking image: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _pickFromCamera() async {
    try {
      final picked = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1800,
        maxHeight: 1800,
        imageQuality: 85,
      );
      if (picked != null) _addFiles([File(picked.path)]);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error capturing image: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _removeAttachment(int index) async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() => _attachments.removeAt(index));
    _notifyParent();
  }

  void _retryUpload(UploadableAttachment attachment) {
    _uploadAttachment(attachment);
  }

  void _openViewer(int index) {
    Haptics.vibrate(HapticsType.selection);
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierColor: Colors.black,
        pageBuilder: (_, __, ___) => _LocalPhotoViewerScreen(
          files: _attachments.map((a) => a.file).toList(),
          initialIndex: index,
        ),
        transitionsBuilder: (_, animation, __, child) =>
            FadeTransition(opacity: animation, child: child),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 10,
        mainAxisSpacing: 7,
        childAspectRatio: 1,
      ),
      itemCount: _attachments.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return AdaptiveMenu(
            title: 'Select an option',
            selected: '',
            items: [
              MenuItem(value: 'camera', label: 'Camera'),
              MenuItem(value: 'picker', label: 'Pick An Image'),
            ],
            onSelected: (value) async {
              await Haptics.vibrate(HapticsType.selection);
              if (value == 'camera') {
                await _pickFromCamera();
              } else if (value == 'picker') {
                await _pickFromGallery();
              }
            },
            icon: Card(
              color: Colors.black,
              child: Center(
                child: Icon(Icons.add_a_photo, color: Colors.white, size: 25),
              ),
            ),
          );
        }

        final attachment = _attachments[index - 1];
        final attachmentIndex = index - 1;

        return GestureDetector(
          onTap: attachment.isFailed
              ? null
              : () => _openViewer(attachmentIndex),
          child: Stack(
            fit: StackFit.expand,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.file(
                  attachment.file,
                  fit: BoxFit.cover,
                  width: double.infinity,
                  height: double.infinity,
                ),
              ),
              // Upload progress overlay
              if (attachment.isUploading)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    color: Colors.black45,
                    child: const Center(
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2.5,
                      ),
                    ),
                  ),
                ),
              // Failed state overlay
              if (attachment.isFailed)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    color: Colors.black54,
                    padding: const EdgeInsets.all(6),
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.error_outline,
                            color: Colors.red,
                            size: 24,
                          ),
                          const SizedBox(height: 4),
                          if (attachment.error != null)
                            Text(
                              attachment.error!,
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 9,
                              ),
                              textAlign: TextAlign.center,
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                            ),
                          const SizedBox(height: 4),
                          GestureDetector(
                            onTap: () => _retryUpload(attachment),
                            child: const Text(
                              'Retry',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              // Done checkmark badge
              if (attachment.isDone)
                Positioned(
                  bottom: 4,
                  left: 4,
                  child: Container(
                    decoration: const BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                    ),
                    padding: const EdgeInsets.all(2),
                    child: const Icon(
                      Icons.check,
                      color: Colors.white,
                      size: 12,
                    ),
                  ),
                ),
              // Remove button
              if (!attachment.isUploading)
                Positioned(
                  top: 4,
                  right: 4,
                  child: GestureDetector(
                    onTap: () => _removeAttachment(attachmentIndex),
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Colors.black54,
                        shape: BoxShape.circle,
                      ),
                      padding: const EdgeInsets.all(4),
                      child: const Icon(
                        Icons.close,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _LocalPhotoViewerScreen extends StatefulWidget {
  final List<File> files;
  final int initialIndex;

  const _LocalPhotoViewerScreen({
    required this.files,
    required this.initialIndex,
  });

  @override
  State<_LocalPhotoViewerScreen> createState() =>
      _LocalPhotoViewerScreenState();
}

class _LocalPhotoViewerScreenState extends State<_LocalPhotoViewerScreen> {
  late final PageController _pageController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle.light);
  }

  @override
  void dispose() {
    _pageController.dispose();
    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle.dark);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () {
            Haptics.vibrate(HapticsType.selection);
            Navigator.of(context).pop();
          },
        ),
        title: Text(
          '${_currentIndex + 1} / ${widget.files.length}',
          style: const TextStyle(color: Colors.white, fontSize: 15),
        ),
        centerTitle: true,
      ),
      body: PageView.builder(
        controller: _pageController,
        itemCount: widget.files.length,
        onPageChanged: (i) {
          Haptics.vibrate(HapticsType.light);
          setState(() => _currentIndex = i);
        },
        itemBuilder: (context, index) {
          return InteractiveViewer(
            minScale: 0.5,
            maxScale: 4.0,
            child: Center(
              child: Image.file(
                widget.files[index],
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => const Center(
                  child: Icon(
                    Icons.broken_image_outlined,
                    color: Colors.white38,
                    size: 64,
                  ),
                ),
              ),
            ),
          );
        },
      ),
      bottomNavigationBar: widget.files.length > 1
          ? Container(
              color: Colors.black,
              padding: const EdgeInsets.only(bottom: 24, top: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  widget.files.length,
                  (i) => AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: i == _currentIndex ? 20 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: i == _currentIndex ? Colors.white : Colors.white38,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              ),
            )
          : null,
    );
  }
}
