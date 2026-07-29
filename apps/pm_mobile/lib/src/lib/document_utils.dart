import 'dart:convert';

import 'package:flutter/foundation.dart';

/// A witness signature slot declared inside a lease agreement document's
/// Lexical content. Ported from the web's `getWitnessNodesFromContent`
/// (`apps/property-manager/app/lib/document.utils.ts`) — witness rows are
/// authored into the document body, so the only way to know how many a
/// document expects is to walk its content. Manager and tenant slots are
/// implicit and are NOT represented here.
@immutable
class WitnessNode {
  const WitnessNode({required this.role, required this.label});

  /// `pm_witness` or `tenant_witness`.
  final String role;
  final String label;
}

const _pmWitness = 'pm_witness';
const _tenantWitness = 'tenant_witness';

/// Walks [content] (a serialised Lexical editor state) and returns every
/// witness signature node in document order. Malformed or absent content
/// yields an empty list rather than throwing — a document we cannot parse is
/// treated as declaring no witnesses, matching the web's `try/catch`.
List<WitnessNode> getWitnessNodesFromContent(String? content) {
  final nodes = <WitnessNode>[];
  if (content == null || content.isEmpty) return nodes;

  void walk(Map<String, dynamic> node) {
    if (node['type'] == 'signature') {
      final role = node['role'];
      if (role == _pmWitness || role == _tenantWitness) {
        final label = node['label'];
        nodes.add(
          WitnessNode(
            role: role as String,
            label: (label is String && label.isNotEmpty)
                ? label
                : (role == _pmWitness
                      ? 'Property Manager Witness'
                      : 'Tenant Witness'),
          ),
        );
      }
    }

    final children = node['children'];
    if (children is List) {
      for (final child in children) {
        if (child is Map<String, dynamic>) walk(child);
      }
    }
  }

  try {
    final state = jsonDecode(content);
    if (state is! Map<String, dynamic>) return nodes;
    final root = state['root'];
    if (root is Map<String, dynamic>) walk(root);
  } catch (_) {
    // Unparseable content declares no witnesses.
  }

  return nodes;
}
