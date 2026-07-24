import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';

import 'package:rentloop_manager/src/api/places_api.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

/// A resolved address — the human-readable line the user selected, plus
/// the city/region/country/lat/lng needed by `PropertyApi.createProperty`.
class ResolvedAddress {
  const ResolvedAddress({
    required this.description,
    required this.city,
    required this.region,
    required this.country,
    required this.latitude,
    required this.longitude,
  });
  final String description;
  final String city;
  final String region;
  final String country;
  final double latitude;
  final double longitude;
}

/// Debounced Google Places search field. Typing shows a dropdown of
/// predictions; selecting one resolves city/region/country/lat/lng via a
/// Place Details lookup and shows a "selected location" confirmation card
/// in place of a real map (no Maps SDK in this app).
class AddressSearchField extends ConsumerStatefulWidget {
  const AddressSearchField({super.key, this.initial, required this.onResolved});
  final ResolvedAddress? initial;
  final ValueChanged<ResolvedAddress?> onResolved;

  @override
  ConsumerState<AddressSearchField> createState() => _AddressSearchFieldState();
}

class _AddressSearchFieldState extends ConsumerState<AddressSearchField> {
  late final TextEditingController _controller;
  Timer? _debounce;
  List<PlacePrediction> _predictions = [];
  bool _searching = false;
  ResolvedAddress? _resolved;

  @override
  void initState() {
    super.initState();
    _resolved = widget.initial;
    _controller = TextEditingController(
      text: widget.initial?.description ?? '',
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onChanged(String value) {
    if (_resolved != null && value != _resolved!.description) {
      setState(() => _resolved = null);
      widget.onResolved(null);
    }
    _debounce?.cancel();
    if (value.trim().length < 3) {
      setState(() => _predictions = []);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 400), () async {
      setState(() => _searching = true);
      final results = await ref.read(placesApiProvider).autocomplete(value);
      if (!mounted) return;
      setState(() {
        _predictions = results;
        _searching = false;
      });
    });
  }

  Future<void> _select(PlacePrediction prediction) async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() {
      _predictions = [];
      _searching = true;
      _controller.text = prediction.description;
    });
    final place = await ref.read(placesApiProvider).details(prediction.placeId);
    if (!mounted) return;
    setState(() => _searching = false);
    if (place == null) return;
    final resolved = ResolvedAddress(
      description: prediction.description,
      city: place.city,
      region: place.region,
      country: place.country,
      latitude: place.latitude,
      longitude: place.longitude,
    );
    setState(() => _resolved = resolved);
    widget.onResolved(resolved);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _controller,
          onChanged: _onChanged,
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 15,
            color: RLTokens.ink,
          ),
          decoration: InputDecoration(
            hintText: 'Search address',
            hintStyle: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 15,
              color: RLTokens.mutedSoft,
            ),
            prefixIcon: const Icon(
              Icons.search_rounded,
              size: 18,
              color: RLTokens.mutedSoft,
            ),
            suffixIcon: _searching
                ? const Padding(
                    padding: EdgeInsets.all(14),
                    child: SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: RLTokens.crimson,
                      ),
                    ),
                  )
                : null,
            filled: true,
            fillColor: RLTokens.surface,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 14,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: RLTokens.hairline,
                width: 1.5,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: RLTokens.hairline,
                width: 1.5,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: RLTokens.crimson, width: 1.5),
            ),
          ),
        ),
        if (_predictions.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: RLTokens.surface,
              border: Border.all(color: RLTokens.hairline),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: _predictions.asMap().entries.map((e) {
                final last = e.key == _predictions.length - 1;
                return GestureDetector(
                  onTap: () => _select(e.value),
                  behavior: HitTestBehavior.opaque,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      border: last
                          ? null
                          : const Border(
                              bottom: BorderSide(color: RLTokens.hairlineSoft),
                            ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          size: 16,
                          color: RLTokens.mutedSoft,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            e.value.description,
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 13.5,
                              color: RLTokens.ink,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
        if (_resolved != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: RLTokens.fill,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: RLTokens.hairline),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.location_on_rounded,
                  size: 22,
                  color: RLTokens.crimson,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _resolved!.description,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 13.5,
                          fontWeight: RLTokens.semibold,
                          color: RLTokens.ink,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${_resolved!.city}, ${_resolved!.region}, ${_resolved!.country}',
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12,
                          color: RLTokens.muted,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ] else if (_controller.text.isNotEmpty &&
            _predictions.isEmpty &&
            !_searching) ...[
          const SizedBox(height: 8),
          const Text(
            'Search and select an address to continue',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12,
              color: RLTokens.mutedSoft,
            ),
          ),
        ],
      ],
    );
  }
}
