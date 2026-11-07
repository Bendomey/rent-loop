import 'package:rentloop_manager/src/repository/models/property_block_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/block_options_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/options_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/property_options_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/unit_options_notifier.dart';

OptionsState<T> _page<T>(
  List<T> all,
  String Function(T) name,
  String search,
  bool hasNextPage,
) => OptionsState<T>(
  items: [
    for (final i in all)
      if (name(i).toLowerCase().contains(search.toLowerCase())) i,
  ],
  hasLoaded: true,
  hasNextPage: hasNextPage,
  search: search,
);

class FakePropertyOptions extends PropertyOptionsNotifier {
  FakePropertyOptions(
    this.all, {
    this.hasNextPage = false,
    this.searches,
    this.staleOnClear = false,
  });

  final List<PropertyModel> all;
  final bool hasNextPage;
  final List<String>? searches;
  final bool staleOnClear;

  @override
  OptionsState<PropertyModel> build({bool managerOnly = false}) =>
      _page(all, (p) => p.name, '', hasNextPage);

  @override
  void setSearch(String value) {
    searches?.add(value);
    if (staleOnClear && value.isEmpty) {
      state = state.copyWith(search: '', isLoading: true);
      return;
    }
    state = _page(all, (p) => p.name, value, hasNextPage);
  }

  @override
  Future<void> loadNextPage() async {}

  @override
  Future<void> refresh() async {}
}

class FakeBlockOptions extends BlockOptionsNotifier {
  FakeBlockOptions(this.all, {this.searches});

  final List<PropertyBlockModel> all;
  final List<String>? searches;

  @override
  OptionsState<PropertyBlockModel> build(String propertyId) =>
      _page(all, (b) => b.name, '', false);

  @override
  void setSearch(String value) {
    searches?.add(value);
    state = _page(all, (b) => b.name, value, false);
  }

  @override
  Future<void> loadNextPage() async {}

  @override
  Future<void> refresh() async {}
}

class FakeUnitOptions extends UnitOptionsNotifier {
  FakeUnitOptions(this.all, {this.searches});

  final List<UnitModel> all;
  final List<String>? searches;

  @override
  OptionsState<UnitModel> build(UnitOptionsQuery query) =>
      _page(all, (u) => u.name, '', false);

  @override
  void setSearch(String value) {
    searches?.add(value);
    state = _page(all, (u) => u.name, value, false);
  }

  @override
  Future<void> loadNextPage() async {}

  @override
  Future<void> refresh() async {}
}
