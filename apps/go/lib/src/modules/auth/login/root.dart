import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _LoginScreen();
}

class _LoginScreen extends ConsumerState<LoginScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Text('Login Screen'),
    );
  }
}
