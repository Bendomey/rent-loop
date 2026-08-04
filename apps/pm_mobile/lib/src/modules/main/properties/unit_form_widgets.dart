// Shared field widgets/constants for the unit create (add_unit.dart) and
// edit (edit_unit.dart) forms — both ported field-for-field from the web
// add/edit unit pages and share most of their UI.

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:image_picker/image_picker.dart';

import 'package:rentloop_manager/src/api/r2_upload_service.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

const kUnitTypes = [
  (
    type: 'APARTMENT',
    title: 'Apartment',
    desc:
        'Multi-room unit in a shared building, with separate living and sleeping areas.',
    icon: Icons.apartment_rounded,
  ),
  (
    type: 'HOUSE',
    title: 'House',
    desc: 'Standalone building with its own entrance, yard, or compound.',
    icon: Icons.house_rounded,
  ),
  (
    type: 'STUDIO',
    title: 'Studio',
    desc: 'Single open-plan room combining bedroom and living space.',
    icon: Icons.grid_view_rounded,
  ),
  (
    type: 'OFFICE',
    title: 'Office',
    desc: 'Workspace for professional or business use, not residential.',
    icon: Icons.business_center_rounded,
  ),
  (
    type: 'RETAIL',
    title: 'Retail',
    desc: 'Shopfront or commercial space for selling goods or services.',
    icon: Icons.storefront_rounded,
  ),
];

const kRentFeeLabels = {
  'DAILY': 'Price per Day',
  'WEEKLY': 'Price per Week',
  'MONTHLY': 'Price per Month',
  'QUARTERLY': 'Price per Quarter',
  'BIANNUALLY': 'Price per 6 Months',
  'ANNUALLY': 'Price per Year',
};

const kBillingCycleLabels = {
  'DAILY': 'Daily',
  'WEEKLY': 'Weekly',
  'MONTHLY': 'Monthly',
};

// ── Section heading ───────────────────────────────────────────────────────────

class USectionHeading extends StatelessWidget {
  const USectionHeading(this.title, this.subtitle, {super.key});
  final String title, subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13.5,
            fontWeight: RLTokens.semibold,
            color: RLTokens.ink,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          subtitle,
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 12.5,
            color: RLTokens.muted,
          ),
        ),
      ],
    );
  }
}

// ── Selectable row (unit type / status) ────────────────────────────────────────

class USelectRow extends StatelessWidget {
  const USelectRow({
    super.key,
    this.icon,
    required this.title,
    required this.desc,
    required this.selected,
    required this.onTap,
  });
  final IconData? icon;
  final String title, desc;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? RLTokens.crimsonTint : RLTokens.surface,
          border: Border.all(
            color: selected ? RLTokens.crimson : RLTokens.hairline,
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (icon != null) ...[
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: selected ? RLTokens.surface : RLTokens.fill,
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(
                  icon,
                  size: 20,
                  color: selected ? RLTokens.crimson : RLTokens.inkSoft,
                ),
              ),
              const SizedBox(width: 13),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 14.5,
                      fontWeight: RLTokens.semibold,
                      color: selected ? RLTokens.crimson : RLTokens.ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    desc,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12,
                      color: RLTokens.muted,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Field label / text input ────────────────────────────────────────────────────

class UFieldLabel extends StatelessWidget {
  const UFieldLabel(this.text, {super.key, this.optional = false});
  final String text;
  final bool optional;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            text,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              fontWeight: RLTokens.semibold,
              color: RLTokens.ink,
            ),
          ),
          if (optional)
            const Text(
              'Optional',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 11.5,
                color: RLTokens.mutedSoft,
              ),
            ),
        ],
      ),
    );
  }
}

class UTextInput extends StatelessWidget {
  const UTextInput({
    super.key,
    required this.controller,
    required this.placeholder,
    this.keyboardType,
  });
  final TextEditingController controller;
  final String placeholder;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      style: const TextStyle(
        fontFamily: RLTokens.fontSans,
        fontSize: 15,
        color: RLTokens.ink,
      ),
      decoration: InputDecoration(
        hintText: placeholder,
        hintStyle: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 15,
          color: RLTokens.mutedSoft,
        ),
        filled: true,
        fillColor: RLTokens.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: RLTokens.hairline, width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: RLTokens.hairline, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: RLTokens.crimson, width: 1.5),
        ),
      ),
    );
  }
}

// ── Image picker (real R2 upload) ──────────────────────────────────────────────

enum UImageStatus { idle, uploading, done, failed }

class UPickedImage {
  UPickedImage({this.file, this.url, this.status = UImageStatus.idle});

  /// Null for images that arrived already-uploaded via [UImagePicker.initialImages]
  /// (edit mode) — those never re-upload, just display via [url].
  final File? file;
  String? url;
  UImageStatus status;

  bool get isUploading => status == UImageStatus.uploading;
  bool get isDone => status == UImageStatus.done;
  bool get isFailed => status == UImageStatus.failed;
}

/// Multi-image picker + uploader for unit photos. Mirrors apps/go's
/// ManageAttachmentsWidget: each picked image uploads immediately via
/// [r2UploadServiceProvider], with per-tile progress/retry/remove.
class UImagePicker extends ConsumerStatefulWidget {
  const UImagePicker({
    super.key,
    this.initialImages = const [],
    required this.onImagesChanged,
    required this.onUploadingChanged,
    this.maxImages,
  });
  final List<String> initialImages;
  final ValueChanged<List<String>> onImagesChanged;
  final ValueChanged<bool> onUploadingChanged;

  /// Null (default) = unlimited, used by units. Blocks cap at 1 (web
  /// restricts block photos to a single image, unlike units' bulk upload).
  final int? maxImages;

  @override
  ConsumerState<UImagePicker> createState() => _UImagePickerState();
}

class _UImagePickerState extends ConsumerState<UImagePicker> {
  final _picker = ImagePicker();
  late final List<UPickedImage> _images = widget.initialImages
      .map((url) => UPickedImage(url: url, status: UImageStatus.done))
      .toList();

  void _notify() {
    widget.onUploadingChanged(_images.any((i) => i.isUploading));
    widget.onImagesChanged(
      _images
          .where((i) => i.isDone && i.url != null)
          .map((i) => i.url!)
          .toList(),
    );
  }

  Future<void> _upload(UPickedImage image) async {
    setState(() => image.status = UImageStatus.uploading);
    _notify();
    try {
      final url = await ref
          .read(r2UploadServiceProvider)
          .uploadFile(image.file!);
      if (!mounted) return;
      setState(() {
        image.status = UImageStatus.done;
        image.url = url;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => image.status = UImageStatus.failed);
    }
    _notify();
  }

  void _addFiles(List<File> files) {
    final max = widget.maxImages;
    final remaining = max == null ? files.length : max - _images.length;
    for (final file in files.take(remaining)) {
      final image = UPickedImage(file: file);
      setState(() => _images.add(image));
      _upload(image);
    }
  }

  void _showPickError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: RLTokens.danger),
    );
  }

  Future<void> _pickFromGallery() async {
    try {
      if (widget.maxImages == 1) {
        final picked = await _picker.pickImage(
          source: ImageSource.gallery,
          maxWidth: 1800,
          maxHeight: 1800,
          imageQuality: 85,
        );
        if (picked != null) _addFiles([File(picked.path)]);
        return;
      }
      final picked = await _picker.pickMultiImage(
        maxWidth: 1800,
        maxHeight: 1800,
        imageQuality: 85,
      );
      _addFiles(picked.map((x) => File(x.path)).toList());
    } catch (_) {
      _showPickError('Couldn\'t open photo library.');
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
    } catch (_) {
      _showPickError('Couldn\'t open camera.');
    }
  }

  Future<void> _showSourceSheet() async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;
    final source = await showModalBottomSheet<_ImageSource>(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
      builder: (_) => const _ImageSourceSheet(),
    );
    if (source == _ImageSource.camera) {
      await _pickFromCamera();
    } else if (source == _ImageSource.gallery) {
      await _pickFromGallery();
    }
  }

  Future<void> _removeAt(int index) async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() => _images.removeAt(index));
    _notify();
  }

  Future<void> _openViewer(int index) async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;
    await Navigator.of(context).push(
      PageRouteBuilder<void>(
        opaque: false,
        barrierColor: Colors.black,
        pageBuilder: (_, _, _) =>
            _ImageViewerScreen(images: _images, initialIndex: index),
        transitionsBuilder: (_, animation, _, child) =>
            FadeTransition(opacity: animation, child: child),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final atCap =
        widget.maxImages != null && _images.length >= widget.maxImages!;
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        ..._images.asMap().entries.map(
          (e) => _ImageTile(
            image: e.value,
            onTap: e.value.isFailed ? null : () => _openViewer(e.key),
            onRemove: () => _removeAt(e.key),
            onRetry: () => _upload(e.value),
          ),
        ),
        if (!atCap)
          GestureDetector(
            onTap: _showSourceSheet,
            child: Container(
              width: 84,
              height: 84,
              decoration: BoxDecoration(
                border: Border.all(color: RLTokens.hairline, width: 1.5),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add_rounded, size: 20, color: RLTokens.mutedSoft),
                  SizedBox(height: 4),
                  Text(
                    'Add',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 11,
                      color: RLTokens.mutedSoft,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _ImageTile extends StatelessWidget {
  const _ImageTile({
    required this.image,
    required this.onTap,
    required this.onRemove,
    required this.onRetry,
  });
  final UPickedImage image;
  final VoidCallback? onTap;
  final VoidCallback onRemove;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 84,
        height: 84,
        child: Stack(
          fit: StackFit.expand,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: image.file != null
                  ? Image.file(image.file!, fit: BoxFit.cover)
                  : Image.network(image.url!, fit: BoxFit.cover),
            ),
            if (image.isUploading)
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  color: Colors.black45,
                  child: const Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            if (image.isFailed)
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  color: Colors.black54,
                  padding: const EdgeInsets.all(4),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.error_outline,
                          color: Colors.white,
                          size: 18,
                        ),
                        const SizedBox(height: 2),
                        GestureDetector(
                          onTap: onRetry,
                          child: const Text(
                            'Retry',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: RLTokens.semibold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            if (!image.isUploading)
              Positioned(
                top: 4,
                right: 4,
                child: GestureDetector(
                  onTap: onRemove,
                  child: Container(
                    decoration: const BoxDecoration(
                      color: Colors.black54,
                      shape: BoxShape.circle,
                    ),
                    padding: const EdgeInsets.all(3),
                    child: const Icon(
                      Icons.close_rounded,
                      color: Colors.white,
                      size: 14,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

enum _ImageSource { camera, gallery }

class _ImageSourceSheet extends StatelessWidget {
  const _ImageSourceSheet();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(RLTokens.rXl)),
        boxShadow: RLTokens.elevSheet,
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 10),
            Container(
              width: 38,
              height: 5,
              decoration: BoxDecoration(
                color: RLTokens.hairline,
                borderRadius: BorderRadius.circular(5),
              ),
            ),
            const SizedBox(height: 8),
            _SourceRow(
              icon: Icons.camera_alt_outlined,
              label: 'Take Photo',
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (context.mounted) {
                  Navigator.of(context).pop(_ImageSource.camera);
                }
              },
            ),
            _SourceRow(
              icon: Icons.photo_library_outlined,
              label: 'Choose from Library',
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (context.mounted) {
                  Navigator.of(context).pop(_ImageSource.gallery);
                }
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class _SourceRow extends StatelessWidget {
  const _SourceRow({
    required this.icon,
    required this.label,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
        child: Row(
          children: [
            Icon(icon, size: 20, color: RLTokens.ink),
            const SizedBox(width: 14),
            Text(
              label,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 15,
                fontWeight: RLTokens.semibold,
                color: RLTokens.ink,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ImageViewerScreen extends StatefulWidget {
  const _ImageViewerScreen({required this.images, required this.initialIndex});
  final List<UPickedImage> images;
  final int initialIndex;

  @override
  State<_ImageViewerScreen> createState() => _ImageViewerScreenState();
}

class _ImageViewerScreenState extends State<_ImageViewerScreen> {
  late final _controller = PageController(initialPage: widget.initialIndex);
  late int _index = widget.initialIndex;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle.light);
  }

  @override
  void dispose() {
    _controller.dispose();
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
          onPressed: () async {
            await Haptics.vibrate(HapticsType.selection);
            if (context.mounted) Navigator.of(context).pop();
          },
        ),
        title: Text(
          '${_index + 1} / ${widget.images.length}',
          style: const TextStyle(color: Colors.white, fontSize: 15),
        ),
        centerTitle: true,
      ),
      body: PageView.builder(
        controller: _controller,
        itemCount: widget.images.length,
        onPageChanged: (i) async {
          await Haptics.vibrate(HapticsType.light);
          setState(() => _index = i);
        },
        itemBuilder: (context, index) {
          final image = widget.images[index];
          return InteractiveViewer(
            minScale: 0.5,
            maxScale: 4,
            child: Center(
              child: image.file != null
                  ? Image.file(image.file!, fit: BoxFit.contain)
                  : Image.network(
                      image.url!,
                      fit: BoxFit.contain,
                      errorBuilder: (_, _, _) => const Icon(
                        Icons.broken_image_outlined,
                        color: Colors.white38,
                        size: 64,
                      ),
                    ),
            ),
          );
        },
      ),
      bottomNavigationBar: widget.images.length > 1
          ? Container(
              color: Colors.black,
              padding: const EdgeInsets.only(bottom: 24, top: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  widget.images.length,
                  (i) => AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: i == _index ? 20 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: i == _index ? Colors.white : Colors.white38,
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

// ── Chip toggle (occupancy / billing cycle) ────────────────────────────────────

class UChip extends StatelessWidget {
  const UChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
        decoration: BoxDecoration(
          color: selected ? RLTokens.crimson : RLTokens.surface,
          border: Border.all(
            color: selected ? RLTokens.crimson : RLTokens.hairline,
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(RLTokens.rMd),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13.5,
            fontWeight: RLTokens.semibold,
            color: selected ? Colors.white : RLTokens.ink,
          ),
        ),
      ),
    );
  }
}

// ── Occupants stepper ────────────────────────────────────────────────────────

class UOccupantsStepper extends StatelessWidget {
  const UOccupantsStepper({
    super.key,
    required this.value,
    required this.onDecrement,
    required this.onIncrement,
  });
  final int value;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Text(
          'Number of tenants',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13.5,
            fontWeight: RLTokens.semibold,
            color: RLTokens.ink,
          ),
        ),
        const Spacer(),
        _UStepBtn(
          icon: Icons.remove_rounded,
          onTap: value > 2 ? onDecrement : null,
        ),
        SizedBox(
          width: 32,
          child: Center(
            child: Text(
              '$value',
              style: const TextStyle(
                fontFamily: RLTokens.fontMono,
                fontSize: 15,
                fontWeight: RLTokens.semibold,
                color: RLTokens.ink,
              ),
            ),
          ),
        ),
        _UStepBtn(icon: Icons.add_rounded, onTap: onIncrement),
      ],
    );
  }
}

class _UStepBtn extends StatelessWidget {
  const _UStepBtn({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap == null
          ? null
          : () async {
              await Haptics.vibrate(HapticsType.selection);
              onTap!();
            },
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: RLTokens.surface,
          border: Border.all(
            color: onTap == null ? RLTokens.hairlineSoft : RLTokens.hairline,
          ),
          borderRadius: BorderRadius.circular(RLTokens.rSm),
        ),
        child: Icon(
          icon,
          size: 16,
          color: onTap == null ? RLTokens.micro : RLTokens.ink,
        ),
      ),
    );
  }
}

// ── Bottom action bar ────────────────────────────────────────────────────────

class UBottomActionBar extends StatelessWidget {
  const UBottomActionBar({
    super.key,
    required this.submitLabel,
    required this.isSubmitting,
    required this.onCancel,
    required this.onSubmit,
  });
  final String submitLabel;
  final bool isSubmitting;
  final VoidCallback onCancel;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Container(
      padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + bottom),
      decoration: const BoxDecoration(
        color: RLTokens.surface,
        border: Border(top: BorderSide(color: RLTokens.hairline)),
        boxShadow: RLTokens.elevBar,
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: isSubmitting ? null : onCancel,
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 4, vertical: 12),
              child: Text(
                'Cancel',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 14.5,
                  fontWeight: RLTokens.semibold,
                  color: RLTokens.muted,
                ),
              ),
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: isSubmitting ? null : onSubmit,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
              decoration: BoxDecoration(
                color: isSubmitting
                    ? RLTokens.crimson.withAlpha(180)
                    : RLTokens.crimson,
                borderRadius: BorderRadius.circular(RLTokens.rMd),
              ),
              child: isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      submitLabel,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 14.5,
                        fontWeight: RLTokens.semibold,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
