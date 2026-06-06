import 'package:flutter/material.dart';

import '../theme.dart';

class BrandLogo extends StatelessWidget {
  const BrandLogo({super.key, this.size = 32});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(size * 0.28),
          ),
          alignment: Alignment.center,
          child: Icon(
            Icons.home_rounded,
            color: Colors.white,
            size: size * 0.6,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          'rentloop',
          style: TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.w800,
            fontSize: size * 0.7,
            letterSpacing: -0.3,
          ),
        ),
      ],
    );
  }
}
