import 'package:flutter/material.dart';

import 'theme.dart';

class Workspace {
  const Workspace({
    required this.id,
    required this.initials,
    required this.name,
    required this.role,
    required this.units,
    required this.properties,
  });

  final String id;
  final String initials;
  final String name;
  final String role;
  final int units;
  final int properties;

  String get propertiesLabel =>
      '$properties ${properties == 1 ? 'property' : 'properties'}';
  String get unitsLabel => '$units units';
}

class ActiveWorkspace {
  ActiveWorkspace._();

  static const List<Workspace> all = [
    Workspace(
      id: 'owusu-estates',
      initials: 'OE',
      name: 'Owusu Estates',
      role: 'Manager',
      units: 64,
      properties: 5,
    ),
    Workspace(
      id: 'cantonments-property',
      initials: 'CP',
      name: 'Cantonments Property Co.',
      role: 'Staff',
      units: 24,
      properties: 1,
    ),
    Workspace(
      id: 'labadi-hospitality',
      initials: 'LH',
      name: 'Labadi Hospitality Group',
      role: 'Manager',
      units: 18,
      properties: 2,
    ),
  ];

  static final ValueNotifier<String> activeId =
      ValueNotifier<String>(all.first.id);

  static Workspace get active =>
      all.firstWhere((w) => w.id == activeId.value, orElse: () => all.first);

  static void setActive(String id) {
    if (all.any((w) => w.id == id)) {
      activeId.value = id;
    }
  }
}

class WorkspaceAvatar extends StatelessWidget {
  const WorkspaceAvatar({super.key, required this.initials, this.size = 44});

  final String initials;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.pinkTint,
        borderRadius: BorderRadius.circular(size * 0.27),
      ),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: TextStyle(
          color: AppColors.primary,
          fontWeight: FontWeight.w700,
          fontSize: size * 0.34,
        ),
      ),
    );
  }
}
