import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';

class MenuItem {
  final String value;
  final String label;
  final bool? isDefaultAction;
  final bool? isDestructiveAction;
  final bool? isSelected;

  MenuItem({
    required this.value,
    required this.label,
    this.isDefaultAction,
    this.isDestructiveAction,
    this.isSelected,
  });
}

class AdaptiveMenu extends StatelessWidget {
  final List<MenuItem> items;
  final String selected;
  final void Function(dynamic) onSelected;
  final Widget icon;
  final String? title;
  final String? message;

  const AdaptiveMenu({
    super.key,
    required this.items,
    required this.selected,
    required this.onSelected,
    required this.icon,
    this.title,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    if (defaultTargetPlatform == TargetPlatform.iOS ||
        defaultTargetPlatform == TargetPlatform.macOS) {
      return CupertinoButton(
        padding: EdgeInsets.zero,
        child: icon,
        onPressed: () {
          showCupertinoModalPopup(
            context: context,
            builder: (BuildContext context) {
              return CupertinoActionSheet(
                title: title != null ? Text(title!) : null,
                message: message != null ? Text(message!) : null,
                actions: items.map((item) {
                  final isDestructiveAction = item.isDestructiveAction ?? false;
                  return CupertinoActionSheetAction(
                    onPressed: () {
                      Navigator.pop(context);
                      onSelected(item.value);
                    },
                    isDefaultAction: item.value == selected,
                    isDestructiveAction: isDestructiveAction,
                    child: Text(
                      item.label,
                      style: TextStyle(
                        color: isDestructiveAction == false
                            ? Colors.blueAccent
                            : null,
                      ),
                    ),
                  );
                }).toList(),
              );
            },
          );
        },
      );
    }

    return PopupMenuButton(
      tooltip: title,
      itemBuilder: (BuildContext context) => items.map((item) {
        return PopupMenuItem(value: item.value, child: Text(item.label));
      }).toList(),
      onSelected: onSelected,
      icon: icon,
    );
  }
}
