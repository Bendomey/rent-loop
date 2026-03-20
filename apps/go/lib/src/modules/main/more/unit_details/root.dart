import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/providers/unit_provider.dart';

class UnitDetailsScreen extends ConsumerWidget {
  final String unitId;

  const UnitDetailsScreen({super.key, required this.unitId});

  static const double _heroHeight = 300;
  static const double _contentOverlap = 32;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unitAsync = ref.watch(unitProvider(unitId));
    final topPadding = MediaQuery.of(context).padding.top;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: Builder(
          builder: (context) {
            if (!unitAsync.hasValue && unitAsync.isLoading) {
              return _UnitDetailsSkeleton(topPadding: topPadding);
            }

            if (unitAsync.hasError && !unitAsync.hasValue) {
              return SafeArea(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 48,
                          color: Colors.grey.shade400,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Failed to load unit details',
                          style: TextStyle(color: Colors.grey.shade600),
                        ),
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: () => ref.invalidate(unitProvider(unitId)),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }

            final unit = unitAsync.value!;
            return Stack(
              children: [
                // Fixed hero image behind scrollable content
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: unit.images.isNotEmpty
                      ? Image.network(
                          unit.images.first,
                          height: _heroHeight,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) =>
                              _HeroPlaceholder(height: _heroHeight),
                        )
                      : _HeroPlaceholder(height: _heroHeight),
                ),

                // Scrollable content
                RefreshIndicator(
                  onRefresh: () => ref.refresh(unitProvider(unitId).future),
                  child: ListView(
                    padding: EdgeInsets.zero,
                    children: [
                      // Transparent spacer — shows hero behind
                      SizedBox(height: _heroHeight - _contentOverlap),

                      // Content card sliding over hero
                      Container(
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.vertical(
                            top: Radius.circular(24),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Drag handle
                            Center(
                              child: Container(
                                margin: const EdgeInsets.only(top: 12),
                                width: 36,
                                height: 4,
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade300,
                                  borderRadius: BorderRadius.circular(2),
                                ),
                              ),
                            ),

                            Padding(
                              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Name + type badge
                                  Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Expanded(
                                        child: Text(
                                          unit.name,
                                          style: Theme.of(context)
                                              .textTheme
                                              .headlineSmall
                                              ?.copyWith(
                                                fontWeight: FontWeight.w700,
                                                height: 1.2,
                                              ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      _TypeBadge(type: unit.type),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    unit.slug,
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: Colors.grey.shade500,
                                    ),
                                  ),

                                  // Additional images strip
                                  if (unit.images.length > 1) ...[
                                    const SizedBox(height: 16),
                                    SizedBox(
                                      height: 80,
                                      child: ListView.separated(
                                        scrollDirection: Axis.horizontal,
                                        itemCount: unit.images.length - 1,
                                        separatorBuilder: (_, __) =>
                                            const SizedBox(width: 8),
                                        itemBuilder: (context, i) => ClipRRect(
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                          child: Image.network(
                                            unit.images[i + 1],
                                            width: 110,
                                            height: 80,
                                            fit: BoxFit.cover,
                                            errorBuilder: (_, __, ___) => Container(
                                              width: 110,
                                              height: 80,
                                              color: Colors.grey.shade100,
                                              child: Icon(
                                                Icons
                                                    .image_not_supported_outlined,
                                                color: Colors.grey.shade400,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),

                            // Description — plain text, no card
                            if (unit.description != null &&
                                unit.description!.isNotEmpty) ...[
                              const Padding(
                                padding: EdgeInsets.fromLTRB(20, 24, 20, 8),
                                child: Text(
                                  'About',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF9E9E9E),
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                ),
                                child: Text(
                                  unit.description!,
                                  style: TextStyle(
                                    fontSize: 15,
                                    color: Colors.grey.shade800,
                                    height: 1.6,
                                  ),
                                ),
                              ),
                            ],

                            // Features — 2-column metadata grid
                            if (unit.features != null &&
                                unit.features!.isNotEmpty) ...[
                              const Padding(
                                padding: EdgeInsets.fromLTRB(20, 28, 20, 12),
                                child: Text(
                                  'Details',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF9E9E9E),
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                ),
                                child: LayoutBuilder(
                                  builder: (context, constraints) {
                                    final tileWidth =
                                        (constraints.maxWidth - 12) / 2;
                                    final entries = unit.features!.entries
                                        .toList();
                                    return Wrap(
                                      spacing: 12,
                                      runSpacing: 12,
                                      children: entries.map((e) {
                                        return SizedBox(
                                          width: tileWidth,
                                          child: Container(
                                            padding: const EdgeInsets.all(14),
                                            decoration: BoxDecoration(
                                              color: Colors.grey.shade50,
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              border: Border.all(
                                                color: Colors.grey.shade100,
                                              ),
                                            ),
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  _formatFeatureKey(e.key),
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    color: Colors.grey.shade500,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  e.value?.toString() ?? '—',
                                                  style: const TextStyle(
                                                    fontSize: 15,
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                ),
                                              ],
                                            ),
                                          ),
                                        );
                                      }).toList(),
                                    );
                                  },
                                ),
                              ),
                            ],

                            // Tags
                            if (unit.tags.isNotEmpty) ...[
                              const Padding(
                                padding: EdgeInsets.fromLTRB(20, 28, 20, 12),
                                child: Text(
                                  'Tags',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF9E9E9E),
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                ),
                                child: Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: unit.tags
                                      .map(
                                        (tag) => Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 6,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Colors.grey.shade100,
                                            borderRadius: BorderRadius.circular(
                                              20,
                                            ),
                                          ),
                                          child: Text(
                                            tag,
                                            style: TextStyle(
                                              fontSize: 13,
                                              color: Colors.grey.shade700,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ),
                                      )
                                      .toList(),
                                ),
                              ),
                            ],

                            SizedBox(
                              height:
                                  40 + MediaQuery.of(context).padding.bottom,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Overlaid back button
                Positioned(
                  top: topPadding + 8,
                  left: 16,
                  child: GestureDetector(
                    onTap: () => context.pop(),
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.35),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.arrow_back_ios_new_rounded,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  String _formatFeatureKey(String key) {
    return key
        .replaceAll('_', ' ')
        .split(' ')
        .map((w) => w.isEmpty ? '' : '${w[0].toUpperCase()}${w.substring(1)}')
        .join(' ');
  }
}

class _UnitDetailsSkeleton extends StatelessWidget {
  final double topPadding;
  const _UnitDetailsSkeleton({required this.topPadding});

  static const double _heroHeight = UnitDetailsScreen._heroHeight;
  static const double _contentOverlap = UnitDetailsScreen._contentOverlap;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Hero placeholder
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: Container(
            height: _heroHeight,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFFE0E0E0), Color(0xFFEEEEEE)],
              ),
            ),
          ),
        ),

        Shimmer.fromColors(
          baseColor: Colors.grey.shade200,
          highlightColor: Colors.grey.shade50,
          child: ListView(
            physics: const NeverScrollableScrollPhysics(),
            padding: EdgeInsets.zero,
            children: [
              SizedBox(height: _heroHeight - _contentOverlap),
              Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Handle
                      Center(
                        child: Container(
                          width: 36,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade300,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      // Title
                      Container(
                        height: 26,
                        width: 220,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Container(
                        height: 14,
                        width: 130,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 28),
                      // Section label
                      Container(
                        height: 13,
                        width: 60,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 10),
                      // Description lines
                      ...List.generate(
                        3,
                        (i) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Container(
                            height: 14,
                            width: i == 2 ? 180 : double.infinity,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),
                      // Features label
                      Container(
                        height: 13,
                        width: 60,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 12),
                      // Feature tiles 2-col
                      GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: 2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 2.2,
                        children: List.generate(
                          4,
                          (_) => Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        // Back button skeleton
        Positioned(
          top: topPadding + 8,
          left: 16,
          child: Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              shape: BoxShape.circle,
            ),
          ),
        ),
      ],
    );
  }
}

class _HeroPlaceholder extends StatelessWidget {
  final double height;
  const _HeroPlaceholder({required this.height});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Gradient background
          DecoratedBox(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF2C2C2E), Color(0xFF48484A)],
              ),
            ),
          ),
          // Subtle decorative circles
          Positioned(
            top: -40,
            right: -40,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.04),
              ),
            ),
          ),
          Positioned(
            bottom: -20,
            left: -30,
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.04),
              ),
            ),
          ),
          // Centered icon
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.home_work_outlined,
                    size: 30,
                    color: Colors.white54,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'No photos',
                  style: TextStyle(
                    color: Colors.white38,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TypeBadge extends StatelessWidget {
  final String type;
  const _TypeBadge({required this.type});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        type,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: Colors.blue.shade700,
        ),
      ),
    );
  }
}
