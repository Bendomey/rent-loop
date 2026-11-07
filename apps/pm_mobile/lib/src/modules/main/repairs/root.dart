import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/modules/main/activity/maintenance_board.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class RepairsScreen extends ConsumerWidget {
  const RepairsScreen({super.key, this.propertyId, this.propertyName});

  final String? propertyId;
  final String? propertyName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = propertyId;
    final roles = ref.watch(myPropertyRolesProvider).valueOrNull;
    final canAdd = roles == null
        ? false
        : id == null
        ? roles.values.any((r) => r == 'MANAGER')
        : roles[id] == 'MANAGER';
    return Scaffold(
      backgroundColor: RLTokens.surface,
      floatingActionButton: !canAdd
          ? null
          : FloatingActionButton.extended(
              heroTag: 'fab-repairs',
              onPressed: () async {
                await Haptics.vibrate(HapticsType.medium);
                if (!context.mounted) return;
                await context.push(
                  id == null
                      ? '/activity/maintenances/add'
                      : '/activity/maintenances/add?property_id=$id',
                );
              },
              backgroundColor: RLTokens.crimson,
              foregroundColor: Colors.white,
              elevation: 6,
              shape: const StadiumBorder(),
              icon: const Icon(Icons.add, size: 20),
              label: const Text(
                'Add repair',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontWeight: RLTokens.semibold,
                  fontSize: RLTokens.textAction,
                ),
              ),
            ),
      body: Column(
        children: [
          RLBackHeader(
            title: propertyName == null ? 'Repairs' : 'Repairs · $propertyName',
            showBack: context.canPop(),
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) context.pop();
            },
          ),
          Expanded(
            child: MaintenanceBoard(
              initialPropertyIds: [if (id != null) id],
              initialPropertyName: propertyName,
            ),
          ),
        ],
      ),
    );
  }
}
