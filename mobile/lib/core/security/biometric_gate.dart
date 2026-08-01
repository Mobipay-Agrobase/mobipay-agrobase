/**
 * Biometric Gate
 * ──────────────
 * A widget that wraps financial operation buttons (disburse, approve loan, transfer)
 * and requires biometric authentication before executing the action.
 * 
 * Usage:
 *   BiometricGate(
 *     operationName: 'disburse loan',
 *     onAuthenticated: () => _disburseLoan(),
 *     child: Text('Disburse UGX 100,000'),
 *   )
 */

import 'package:flutter/material.dart';
import 'biometric_service.dart';
import 'device_security.dart';

class BiometricGate extends StatefulWidget {
  final String operationName;
  final Future<void> Function() onAuthenticated;
  final Widget child;
  final bool enabled; // Set to false to bypass (for testing only)

  const BiometricGate({
    super.key,
    required this.operationName,
    required this.onAuthenticated,
    required this.child,
    this.enabled = true,
  });

  @override
  State<BiometricGate> createState() => _BiometricGateState();
}

class _BiometricGateState extends State<BiometricGate> {
  final BiometricService _biometric = BiometricService();
  bool _authenticating = false;

  Future<void> _authenticate() async {
    if (_authenticating) return;
    setState(() => _authenticating = true);

    try {
      // ─── Security check: refuse on compromised devices ───
      if (await DeviceSecurity.shouldBlockFinancialOps()) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Device appears to be rooted/jailbroken. Financial operations are blocked.'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      // ─── Mandatory biometric prompt for financial operations ───
      final result = await _biometric.authenticateForFinancialOp(
        op: widget.operationName,
      );

      if (result) {
        await widget.onAuthenticated();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Biometric authentication failed. Operation cancelled.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Authentication error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _authenticating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) {
      return GestureDetector(
        onTap: () => widget.onAuthenticated(),
        child: widget.child,
      );
    }

    return GestureDetector(
      onTap: _authenticating ? null : _authenticate,
      child: Stack(
        children: [
          widget.child,
          if (_authenticating)
            const Positioned.fill(
              child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
            ),
        ],
      ),
    );
  }
}

/**
 * Helper function for one-off biometric checks (not tied to a widget)
 * Returns true if authenticated, false otherwise.
 */
Future<bool> requireBiometricForFinancialOp(String operationName) async {
  // Check device security first
  if (await DeviceSecurity.shouldBlockFinancialOps()) {
    return false;
  }
  
  final biometric = BiometricService();
  return await biometric.authenticateForFinancialOp(op: operationName);
}
