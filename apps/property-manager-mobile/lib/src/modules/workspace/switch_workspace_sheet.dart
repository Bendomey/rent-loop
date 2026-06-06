import 'package:flutter/material.dart';

import '../../shared/theme.dart';
import '../../shared/workspace_model.dart';

Future<void> showSwitchWorkspaceSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: AppColors.surface,
    isScrollControlled: true,
    showDragHandle: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (sheetContext) => const SwitchWorkspaceSheet(),
  );
}

class SwitchWorkspaceSheet extends StatelessWidget {
  const SwitchWorkspaceSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Switch workspace',
                    style: Theme.of(context).textTheme.headlineLarge,
                  ),
                ),
                _CloseButton(onTap: () => Navigator.of(context).pop()),
              ],
            ),
            const SizedBox(height: 16),
            ValueListenableBuilder<String>(
              valueListenable: ActiveWorkspace.activeId,
              builder: (context, activeId, _) {
                return Column(
                  children: [
                    for (final workspace in ActiveWorkspace.all) ...[
                      _WorkspaceRow(
                        workspace: workspace,
                        isSelected: workspace.id == activeId,
                        onTap: () {
                          ActiveWorkspace.setActive(workspace.id);
                          Navigator.of(context).pop();
                        },
                      ),
                      if (workspace != ActiveWorkspace.all.last)
                        const Divider(height: 1, indent: 64),
                    ],
                  ],
                );
              },
            ),
            const SizedBox(height: 16),
            _CreateWorkspaceButton(
              onTap: () => Navigator.of(context).pop(),
            ),
          ],
        ),
      ),
    );
  }
}

class _CloseButton extends StatelessWidget {
  const _CloseButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Container(
          width: 32,
          height: 32,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.border),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.close_rounded,
            size: 16,
            color: AppColors.textPrimary,
          ),
        ),
      ),
    );
  }
}

class _WorkspaceRow extends StatelessWidget {
  const _WorkspaceRow({
    required this.workspace,
    required this.isSelected,
    required this.onTap,
  });

  final Workspace workspace;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        child: Row(
          children: [
            WorkspaceAvatar(initials: workspace.initials, size: 44),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    workspace.name,
                    style: Theme.of(context).textTheme.titleMedium,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${workspace.role} · ${workspace.unitsLabel}',
                    style: Theme.of(context).textTheme.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            _RadioDot(isSelected: isSelected),
          ],
        ),
      ),
    );
  }
}

class _RadioDot extends StatelessWidget {
  const _RadioDot({required this.isSelected});
  final bool isSelected;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 22,
      height: 22,
      child: DecoratedBox(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: isSelected ? AppColors.primary : Colors.transparent,
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: 2,
          ),
        ),
        child: isSelected
            ? const Center(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                  ),
                  child: SizedBox(width: 8, height: 8),
                ),
              )
            : null,
      ),
    );
  }
}

class _CreateWorkspaceButton extends StatelessWidget {
  const _CreateWorkspaceButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFFF1EEE8),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          height: 52,
          alignment: Alignment.center,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              Icon(Icons.add, size: 18, color: AppColors.textPrimary),
              SizedBox(width: 8),
              Text(
                'Create a new workspace',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
