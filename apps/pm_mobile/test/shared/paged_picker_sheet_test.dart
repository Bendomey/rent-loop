import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/repository/notifiers/options/options_state.dart';
import 'package:rentloop_manager/src/shared/paged_picker_sheet.dart';

final _stateProvider = StateProvider<OptionsState<String>>(
  (ref) => const OptionsState(),
);

List<String> _names(int from, int count) => [
  for (var i = from; i < from + count; i++) 'Item $i',
];

void main() {
  late List<String> searches;
  var loadMores = 0;
  var retries = 0;
  List<String>? result;
  var resolved = false;

  setUp(() {
    searches = [];
    loadMores = 0;
    retries = 0;
    result = null;
    resolved = false;
  });

  Future<ProviderContainer> open(
    WidgetTester tester, {
    bool multi = false,
    OptionsState<String> initialState = const OptionsState(hasLoaded: true),
  }) async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    container.read(_stateProvider.notifier).state = initialState;
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          home: Builder(
            builder: (context) => Scaffold(
              body: TextButton(
                onPressed: () async {
                  result = await showPagedPickerSheet<String>(
                    context: context,
                    title: 'Pick',
                    state: _stateProvider,
                    onSearch: searches.add,
                    onLoadMore: () => loadMores++,
                    onRetry: () => retries++,
                    label: (s) => s,
                    id: (s) => s,
                    multi: multi,
                  );
                  resolved = true;
                },
                child: const Text('open'),
              ),
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    return container;
  }

  testWidgets('sheet loads more on scroll', (tester) async {
    await open(
      tester,
      initialState: OptionsState(
        items: _names(0, 20),
        hasLoaded: true,
        hasNextPage: true,
      ),
    );
    expect(loadMores, 0);

    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pump();

    expect(loadMores, greaterThan(0));
  });

  testWidgets('short list with more pages shows a tappable Load more', (
    tester,
  ) async {
    await open(
      tester,
      initialState: OptionsState(
        items: _names(0, 3),
        hasLoaded: true,
        hasNextPage: true,
      ),
    );

    await tester.tap(find.text('Load more'));
    expect(loadMores, 1);
  });

  testWidgets('empty list with more pages offers Load more, not empty text', (
    tester,
  ) async {
    await open(
      tester,
      initialState: const OptionsState(hasLoaded: true, hasNextPage: true),
    );
    expect(find.text('Nothing found'), findsNothing);

    await tester.tap(find.text('Load more'));
    expect(loadMores, 1);
  });

  testWidgets('a failed load more is not retried by scrolling', (tester) async {
    await open(
      tester,
      initialState: OptionsState(
        items: _names(0, 20),
        hasLoaded: true,
        hasNextPage: true,
        loadMoreFailed: true,
      ),
    );

    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pump();

    expect(loadMores, 0);
  });

  testWidgets('shows the failed footer and retries', (tester) async {
    await open(
      tester,
      initialState: OptionsState(
        items: _names(0, 3),
        hasLoaded: true,
        hasNextPage: true,
        loadMoreFailed: true,
      ),
    );
    expect(find.text("Couldn't load more."), findsOneWidget);

    await tester.tap(find.text('Try again'));
    expect(loadMores, 1);
  });

  testWidgets('retries a failed first load', (tester) async {
    await open(
      tester,
      initialState: const OptionsState(hasLoaded: true, error: 'Network down'),
    );
    expect(find.text('Network down'), findsOneWidget);

    await tester.tap(find.text('Try again'));
    expect(retries, 1);
  });

  testWidgets('search is debounced', (tester) async {
    await open(
      tester,
      initialState: OptionsState(items: _names(0, 3), hasLoaded: true),
    );

    await tester.enterText(find.byType(TextField), 'a');
    await tester.pump(const Duration(milliseconds: 100));
    await tester.enterText(find.byType(TextField), 'ab');
    await tester.pump(const Duration(milliseconds: 299));
    expect(searches, isEmpty);

    await tester.pump(const Duration(milliseconds: 2));
    expect(searches, ['ab']);
  });

  testWidgets('multi-select keeps picks across searches', (tester) async {
    final container = await open(
      tester,
      multi: true,
      initialState: OptionsState(items: _names(0, 3), hasLoaded: true),
    );

    await tester.tap(find.text('Item 1'));
    await tester.pump();
    container.read(_stateProvider.notifier).state = OptionsState(
      items: const ['Other'],
      hasLoaded: true,
      search: 'oth',
    );
    await tester.pump();
    await tester.tap(find.text('Other'));
    await tester.pump();
    expect(find.text('Done (2)'), findsOneWidget);

    await tester.tap(find.text('Done (2)'));
    await tester.pumpAndSettle();

    expect(resolved, isTrue);
    expect(result, unorderedEquals(['Item 1', 'Other']));
  });

  testWidgets('Clear unticks every pick, including off-page ones', (
    tester,
  ) async {
    final container = await open(
      tester,
      multi: true,
      initialState: OptionsState(items: _names(0, 3), hasLoaded: true),
    );

    await tester.tap(find.text('Item 1'));
    await tester.pump();
    container.read(_stateProvider.notifier).state = OptionsState(
      items: const ['Other'],
      hasLoaded: true,
      search: 'oth',
    );
    await tester.pump();
    await tester.tap(find.text('Other'));
    await tester.pump();
    expect(find.text('Done (2)'), findsOneWidget);

    await tester.tap(find.text('Clear'));
    await tester.pump();
    expect(find.text('Done (0)'), findsOneWidget);
    expect(find.text('Clear'), findsNothing);

    await tester.tap(find.text('Done (0)'));
    await tester.pumpAndSettle();
    expect(result, isEmpty);
  });

  testWidgets('single select returns the tapped item', (tester) async {
    await open(
      tester,
      initialState: OptionsState(items: _names(0, 3), hasLoaded: true),
    );

    await tester.tap(find.text('Item 2'));
    await tester.pumpAndSettle();

    expect(result, ['Item 2']);
  });
}
