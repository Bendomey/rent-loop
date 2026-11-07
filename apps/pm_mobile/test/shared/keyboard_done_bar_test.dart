import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/shared/keyboard_done_bar.dart';

Widget _app(
  Widget body, {
  TargetPlatform platform = TargetPlatform.iOS,
  double keyboard = 300,
  List<NavigatorObserver> observers = const [],
}) {
  return MaterialApp(
    theme: ThemeData(platform: platform),
    navigatorObservers: observers,
    builder: (context, child) {
      final mq = MediaQuery.of(context);
      return MediaQuery(
        data: mq.copyWith(viewInsets: EdgeInsets.only(bottom: keyboard)),
        child: KeyboardDismissScope(child: child!),
      );
    },
    home: Scaffold(body: body),
  );
}

void main() {
  testWidgets('showing the Done bar does not remount the screen', (
    tester,
  ) async {
    _Probe.mounts = 0;
    await tester.pumpWidget(_app(const _Probe()));
    expect(_Probe.mounts, 1);

    await tester.tap(find.byType(TextField));
    await tester.pump();
    await tester.pump();
    expect(find.text('Done'), findsOneWidget);
    expect(_Probe.mounts, 1);
    expect(
      tester
          .state<EditableTextState>(find.byType(EditableText))
          .widget
          .focusNode
          .hasFocus,
      isTrue,
    );
    expect(tester.testTextInput.isVisible, isTrue);
  });

  testWidgets('tapping outside a field unfocuses it', (tester) async {
    final node = FocusNode();
    await tester.pumpWidget(
      _app(
        Column(
          children: [
            TextField(focusNode: node),
            const SizedBox(height: 200, width: 200),
          ],
        ),
      ),
    );
    await tester.tap(find.byType(TextField));
    await tester.pump();
    expect(node.hasFocus, isTrue);

    await tester.tapAt(const Offset(100, 400));
    await tester.pump();
    expect(node.hasFocus, isFalse);
  });

  testWidgets('tapping a button fires it and closes the keyboard', (
    tester,
  ) async {
    final node = FocusNode();
    var taps = 0;
    await tester.pumpWidget(
      _app(
        Column(
          children: [
            TextField(focusNode: node),
            TextButton(onPressed: () => taps++, child: const Text('go')),
          ],
        ),
      ),
    );
    await tester.tap(find.byType(TextField));
    await tester.pump();
    expect(node.hasFocus, isTrue);
    await tester.tap(find.text('go'));
    await tester.pump();
    expect(taps, 1);
    expect(node.hasFocus, isFalse);
  });

  testWidgets('tapping another field keeps focus on it', (tester) async {
    final a = FocusNode();
    final b = FocusNode();
    await tester.pumpWidget(
      _app(
        Column(
          children: [
            TextField(focusNode: a),
            TextField(focusNode: b),
          ],
        ),
      ),
    );
    await tester.tap(find.byType(TextField).first);
    await tester.pump();
    await tester.tap(find.byType(TextField).last);
    await tester.pump();
    expect(b.hasFocus, isTrue);
  });

  testWidgets('a footer button stays visible and tappable with the bar up', (
    tester,
  ) async {
    var taps = 0;
    await tester.pumpWidget(
      _app(
        Column(
          children: [
            const TextField(keyboardType: TextInputType.number),
            const Spacer(),
            TextButton(onPressed: () => taps++, child: const Text('Next')),
          ],
        ),
      ),
    );
    await tester.tap(find.byType(TextField));
    await tester.pump();
    expect(find.text('Done'), findsOneWidget);

    final next = tester.getRect(find.text('Next'));
    final done = tester.getRect(find.byType(Material).last);
    expect(next.bottom, lessThanOrEqualTo(done.top));

    await tester.tap(find.text('Next'));
    await tester.pump();
    expect(taps, 1);
  });

  testWidgets('Done bar shows for a number field on iOS and unfocuses', (
    tester,
  ) async {
    final node = FocusNode();
    await tester.pumpWidget(
      _app(TextField(focusNode: node, keyboardType: TextInputType.number)),
    );
    expect(find.text('Done'), findsNothing);

    await tester.tap(find.byType(TextField));
    await tester.pump();
    expect(find.text('Done'), findsOneWidget);

    await tester.tap(find.text('Done'));
    await tester.pump();
    expect(node.hasFocus, isFalse);
    expect(find.text('Done'), findsNothing);
  });

  testWidgets('Done bar shows for phone and multiline fields', (tester) async {
    await tester.pumpWidget(
      _app(
        const Column(
          children: [
            TextField(keyboardType: TextInputType.phone),
            TextField(keyboardType: TextInputType.multiline, maxLines: 3),
          ],
        ),
      ),
    );
    await tester.tap(find.byType(TextField).first);
    await tester.pump();
    expect(find.text('Done'), findsOneWidget);
    await tester.tap(find.byType(TextField).last);
    await tester.pump();
    expect(find.text('Done'), findsOneWidget);
  });

  testWidgets('no Done bar for a plain text field or on Android', (
    tester,
  ) async {
    await tester.pumpWidget(_app(const TextField()));
    await tester.tap(find.byType(TextField));
    await tester.pump();
    expect(find.text('Done'), findsNothing);

    await tester.pumpWidget(
      _app(
        const TextField(keyboardType: TextInputType.number),
        platform: TargetPlatform.android,
      ),
    );
    await tester.tap(find.byType(TextField));
    await tester.pump();
    expect(find.text('Done'), findsNothing);
  });

  testWidgets('no Done bar when the keyboard is hidden', (tester) async {
    await tester.pumpWidget(
      _app(const TextField(keyboardType: TextInputType.number), keyboard: 0),
    );
    await tester.tap(find.byType(TextField));
    await tester.pump();
    expect(find.text('Done'), findsNothing);
  });

  testWidgets('opening a bottom sheet unfocuses the current field', (
    tester,
  ) async {
    final node = FocusNode();
    await tester.pumpWidget(
      _app(
        Builder(
          builder: (context) => Column(
            children: [
              TextField(focusNode: node),
              TextButton(
                onPressed: () => showModalBottomSheet<void>(
                  context: context,
                  builder: (_) => const SizedBox(height: 100),
                ),
                child: const Text('open'),
              ),
            ],
          ),
        ),
        observers: [KeyboardUnfocusObserver()],
      ),
    );
    await tester.tap(find.byType(TextField));
    await tester.pump();
    expect(node.hasFocus, isTrue);
    node.requestFocus();
    await tester.pump();

    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    expect(node.hasFocus, isFalse);
  });
}

class _Probe extends StatefulWidget {
  const _Probe();

  static int mounts = 0;

  @override
  State<_Probe> createState() => _ProbeState();
}

class _ProbeState extends State<_Probe> {
  @override
  void initState() {
    super.initState();
    _Probe.mounts++;
  }

  @override
  Widget build(BuildContext context) =>
      const TextField(keyboardType: TextInputType.multiline, maxLines: 4);
}
