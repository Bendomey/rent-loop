import 'dart:io';

import 'package:image_picker/image_picker.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:rentloop_go/src/shared/adaptive/menu.dart';
import 'root.dart';

class ManageAttachmentsWidget extends ConsumerStatefulWidget {
  const ManageAttachmentsWidget({
    super.key,
    required this.attachments,
    required this.setAttachments,
  });

  final List<AttachmentItem> attachments;
  final Function(List<AttachmentItem>) setAttachments;

  @override
  ConsumerState<ConsumerStatefulWidget> createState() =>
      _ManageAttachmentsWidget();
}

class _ManageAttachmentsWidget extends ConsumerState<ManageAttachmentsWidget> {
  final ImagePicker _picker = ImagePicker();
  String? imageType;

  // Pick image from gallery
  Future<void> _pickImageFromGallery() async {
    try {
      final List<XFile> pickedFiles = await _picker.pickMultiImage(
        maxWidth: 1800,
        maxHeight: 1800,
        imageQuality: 85,
      );

      final copyAttachments = List<AttachmentItem>.from(widget.attachments);

      for (var pickedFile in pickedFiles) {
        copyAttachments.add(
          AttachmentItem(file: File(pickedFile.path), type: 'image'),
        );
      }

      widget.setAttachments(copyAttachments);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error picking image: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  // Pick image from camera
  Future<void> _pickImageFromCamera() async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1800,
        maxHeight: 1800,
        imageQuality: 85,
      );

      if (pickedFile != null) {
        final copyAttachments = List<AttachmentItem>.from(widget.attachments);
        copyAttachments.add(
          AttachmentItem(file: File(pickedFile.path), type: 'image'),
        );
        widget.setAttachments(copyAttachments);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error capturing image: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _openViewer(int attachmentIndex) {
    Haptics.vibrate(HapticsType.selection);
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierColor: Colors.black,
        pageBuilder: (_, __, ___) => _LocalPhotoViewerScreen(
          attachments: widget.attachments,
          initialIndex: attachmentIndex,
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
      itemCount: widget.attachments.length + 1,
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
                await _pickImageFromCamera();
              } else if (value == 'picker') {
                await _pickImageFromGallery();
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

        final attachment = widget.attachments[index - 1];
        final attachmentIndex = index - 1;
        return GestureDetector(
          onTap: () => _openViewer(attachmentIndex),
          child: Stack(
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
              Positioned(
                top: 4,
                right: 4,
                child: GestureDetector(
                  onTap: () async {
                    await Haptics.vibrate(HapticsType.selection);
                    final copyAttachments = List<AttachmentItem>.from(
                      widget.attachments,
                    );
                    copyAttachments.removeAt(attachmentIndex);
                    widget.setAttachments(copyAttachments);
                  },
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
  final List<AttachmentItem> attachments;
  final int initialIndex;

  const _LocalPhotoViewerScreen({
    required this.attachments,
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
          '${_currentIndex + 1} / ${widget.attachments.length}',
          style: const TextStyle(color: Colors.white, fontSize: 15),
        ),
        centerTitle: true,
      ),
      body: PageView.builder(
        controller: _pageController,
        itemCount: widget.attachments.length,
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
                widget.attachments[index].file,
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
      bottomNavigationBar: widget.attachments.length > 1
          ? Container(
              color: Colors.black,
              padding: const EdgeInsets.only(bottom: 24, top: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  widget.attachments.length,
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
