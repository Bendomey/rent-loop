import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';

part 'rent_focus_provider.g.dart';

/// A request from elsewhere in the app to open the Rent tab on its Owing
/// view for one property (or all of them). The Rent tab lives in the shell's
/// indexed stack, so it may already be built and can't take route arguments;
/// it applies each new [RentFocus.seq] once.
class RentFocus {
  const RentFocus({required this.seq, this.property});

  final int seq;
  final ({String id, String name})? property;
}

@Riverpod(keepAlive: true)
class RentFocusNotifier extends _$RentFocusNotifier {
  @override
  RentFocus? build() {
    ref.watch(currentWorkspaceNotifierProvider.select((w) => w?.clientId));
    return null;
  }

  void showOwing({({String id, String name})? property}) =>
      state = RentFocus(seq: (state?.seq ?? 0) + 1, property: property);
}
