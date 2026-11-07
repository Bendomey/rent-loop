import 'dart:async';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

void dismissKeyboard() => FocusManager.instance.primaryFocus?.unfocus();

/// Unfocuses the active field when a sheet or dialog opens, so the keyboard
/// does not sit over it.
class KeyboardUnfocusObserver extends NavigatorObserver {
  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    if (route is PopupRoute) dismissKeyboard();
  }
}

/// App-wide keyboard handling: tapping anything but a field closes the keyboard,
/// and on iOS, where number, phone and multiline keyboards have no dismiss
/// key, a Done bar rides above the keyboard.
class KeyboardDismissScope extends StatefulWidget {
  const KeyboardDismissScope({super.key, required this.child});

  final Widget child;

  @override
  State<KeyboardDismissScope> createState() => _KeyboardDismissScopeState();
}

class _KeyboardDismissScopeState extends State<KeyboardDismissScope> {
  @override
  void initState() {
    super.initState();
    FocusManager.instance.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    FocusManager.instance.removeListener(_onFocusChange);
    super.dispose();
  }

  Offset? _downAt;

  void _onPointerUp(PointerUpEvent event) {
    final down = _downAt;
    _downAt = null;
    final focused = FocusManager.instance.primaryFocus;
    if (down == null || focused == null) return;
    if ((event.position - down).distance > kTouchSlop) return;
    final hit = HitTestResult();
    WidgetsBinding.instance.hitTestInView(hit, event.position, event.viewId);
    if (hit.path.any((e) => e.target is RenderEditable)) return;
    // After the tap's own handlers, so a button that moves focus is not undone.
    scheduleMicrotask(() {
      if (FocusManager.instance.primaryFocus == focused) focused.unfocus();
    });
  }

  void _onFocusChange() {
    if (mounted) setState(() {});
  }

  bool get _needsDoneKey {
    final editable = FocusManager.instance.primaryFocus?.context
        ?.findAncestorWidgetOfExactType<EditableText>();
    if (editable == null) return false;
    final index = editable.keyboardType.index;
    return index == TextInputType.number.index ||
        index == TextInputType.phone.index ||
        index == TextInputType.multiline.index;
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final keyboard = mq.viewInsets.bottom;
    final onIos = Theme.of(context).platform == TargetPlatform.iOS;
    final showBar = onIos && keyboard > 0 && _needsDoneKey;
    return Listener(
      behavior: HitTestBehavior.translucent,
      onPointerDown: (e) => _downAt = e.position,
      onPointerUp: _onPointerUp,
      child: Stack(
        children: [
          // Always wrapped, so showing the bar never remounts the app below.
          MediaQuery(
            data: showBar
                ? mq.copyWith(
                    viewInsets: mq.viewInsets.copyWith(
                      bottom: keyboard + _doneBarHeight,
                    ),
                  )
                : mq,
            child: widget.child,
          ),
          if (showBar)
            Positioned(
              left: 0,
              right: 0,
              bottom: keyboard,
              child: _DoneBar(onDone: dismissKeyboard),
            ),
        ],
      ),
    );
  }
}

const _doneBarHeight = 48.0;

class _DoneBar extends StatelessWidget {
  const _DoneBar({required this.onDone});

  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: RLTokens.surface,
      elevation: 2,
      child: SizedBox(
        height: _doneBarHeight,
        child: Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: onDone,
            child: const Text(
              'Done',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ),
      ),
    );
  }
}
