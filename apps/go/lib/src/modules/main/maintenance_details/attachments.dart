import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'root.dart';

class ViewAttachmentsWidget extends ConsumerStatefulWidget {
  const ViewAttachmentsWidget({super.key, required this.attachments});

  final List<AttachmentItemUrl> attachments;

  @override
  ConsumerState<ConsumerStatefulWidget> createState() =>
      _ViewAttachmentsWidget();
}

class _ViewAttachmentsWidget extends ConsumerState<ViewAttachmentsWidget> {
  void _openViewer(int initialIndex) {
    Haptics.vibrate(HapticsType.selection);
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierColor: Colors.black,
        pageBuilder: (_, __, ___) => _PhotoViewerScreen(
          attachments: widget.attachments,
          initialIndex: initialIndex,
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
        childAspectRatio: 0.8,
      ),
      itemCount: widget.attachments.length,
      itemBuilder: (context, index) {
        final attachment = widget.attachments[index];
        return GestureDetector(
          onTap: () => _openViewer(index),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              attachment.url,
              fit: BoxFit.cover,
              width: double.infinity,
              height: double.infinity,
            ),
          ),
        );
      },
    );
  }
}

class _PhotoViewerScreen extends StatefulWidget {
  final List<AttachmentItemUrl> attachments;
  final int initialIndex;

  const _PhotoViewerScreen({
    required this.attachments,
    required this.initialIndex,
  });

  @override
  State<_PhotoViewerScreen> createState() => _PhotoViewerScreenState();
}

class _PhotoViewerScreenState extends State<_PhotoViewerScreen> {
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
              child: Image.network(
                widget.attachments[index].url,
                fit: BoxFit.contain,
                loadingBuilder: (_, child, progress) {
                  if (progress == null) return child;
                  return const Center(
                    child: CircularProgressIndicator(color: Colors.white54),
                  );
                },
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
