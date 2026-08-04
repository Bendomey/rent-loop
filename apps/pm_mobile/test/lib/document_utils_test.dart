import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/document_utils.dart';

String _content(List<Map<String, dynamic>> children) => jsonEncode({
  'root': {'type': 'root', 'children': children},
});

void main() {
  group('getWitnessNodesFromContent', () {
    test('returns empty for null, empty and malformed content', () {
      expect(getWitnessNodesFromContent(null), isEmpty);
      expect(getWitnessNodesFromContent(''), isEmpty);
      expect(getWitnessNodesFromContent('{not json'), isEmpty);
    });

    test('ignores non-witness signature roles', () {
      final content = _content([
        {'type': 'signature', 'role': 'TENANT'},
        {'type': 'paragraph', 'children': <Map<String, dynamic>>[]},
      ]);
      expect(getWitnessNodesFromContent(content), isEmpty);
    });

    test('collects pm_witness and tenant_witness nodes', () {
      final content = _content([
        {'type': 'signature', 'role': 'pm_witness', 'label': 'Kofi'},
        {'type': 'signature', 'role': 'tenant_witness', 'label': 'Ama'},
      ]);
      final nodes = getWitnessNodesFromContent(content);
      expect(nodes.map((n) => n.role), ['pm_witness', 'tenant_witness']);
      expect(nodes.map((n) => n.label), ['Kofi', 'Ama']);
    });

    test('defaults the label per role when absent or blank', () {
      final content = _content([
        {'type': 'signature', 'role': 'pm_witness'},
        {'type': 'signature', 'role': 'tenant_witness', 'label': ''},
      ]);
      final nodes = getWitnessNodesFromContent(content);
      expect(nodes[0].label, 'Property Manager Witness');
      expect(nodes[1].label, 'Tenant Witness');
    });

    test('walks nested children in document order', () {
      final content = _content([
        {
          'type': 'paragraph',
          'children': [
            {'type': 'signature', 'role': 'pm_witness', 'label': 'First'},
          ],
        },
        {'type': 'signature', 'role': 'pm_witness', 'label': 'Second'},
      ]);
      expect(getWitnessNodesFromContent(content).map((n) => n.label), [
        'First',
        'Second',
      ]);
    });
  });
}
