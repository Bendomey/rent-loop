import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../shared/theme.dart';
import '../../shared/widgets/brand_logo.dart';
import '../../shared/workspace_model.dart';

class ChooseWorkspaceScreen extends StatelessWidget {
  const ChooseWorkspaceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const BrandLogo(size: 32),
              const SizedBox(height: 48),
              Text(
                'Choose a workspace',
                style: Theme.of(context).textTheme.displaySmall,
              ),
              const SizedBox(height: 8),
              Text(
                "You're a member of ${ActiveWorkspace.all.length} organisations.",
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: 28),
              for (final workspace in ActiveWorkspace.all) ...[
                _WorkspaceCard(
                  workspace: workspace,
                  onTap: () {
                    ActiveWorkspace.setActive(workspace.id);
                    context.go('/');
                  },
                ),
                const SizedBox(height: 12),
              ],
              const SizedBox(height: 12),
              const _CreateWorkspaceButton(),
            ],
          ),
        ),
      ),
    );
  }
}

class _WorkspaceCard extends StatelessWidget {
  const _WorkspaceCard({required this.workspace, required this.onTap});

  final Workspace workspace;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              WorkspaceAvatar(initials: workspace.initials),
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
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        _RolePill(role: workspace.role),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            '${workspace.propertiesLabel} · ${workspace.unitsLabel}',
                            style: Theme.of(context).textTheme.bodySmall,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(
                Icons.chevron_right_rounded,
                color: AppColors.textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RolePill extends StatelessWidget {
  const _RolePill({required this.role});
  final String role;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.pinkTint,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        role,
        style: const TextStyle(
          color: AppColors.primary,
          fontWeight: FontWeight.w700,
          fontSize: 11,
        ),
      ),
    );
  }
}

class _CreateWorkspaceButton extends StatelessWidget {
  const _CreateWorkspaceButton();

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: () {},
      icon: const Icon(Icons.add, size: 18),
      label: const Text('Create a new workspace'),
    );
  }
}
