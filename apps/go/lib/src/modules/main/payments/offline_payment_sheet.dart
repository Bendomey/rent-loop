import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/payment_account_model.dart';
import 'package:rentloop_go/src/repository/notifiers/payment/create_offline_payment_notifier/create_offline_payment_notifier.dart';
import 'package:rentloop_go/src/repository/providers/payment_accounts_provider.dart';

class OfflinePaymentSheet extends ConsumerStatefulWidget {
  final String invoiceId;
  final String leaseId;
  final int totalAmount;
  final String currency;
  final VoidCallback onSuccess;

  const OfflinePaymentSheet({
    super.key,
    required this.invoiceId,
    required this.leaseId,
    required this.totalAmount,
    required this.currency,
    required this.onSuccess,
  });

  @override
  ConsumerState<OfflinePaymentSheet> createState() =>
      _OfflinePaymentSheetState();
}

class _OfflinePaymentSheetState extends ConsumerState<OfflinePaymentSheet> {
  final _amountController = TextEditingController();
  final _referenceController = TextEditingController();
  PaymentAccountModel? _selectedAccount;

  @override
  void initState() {
    super.initState();
    // Pre-fill amount with total (in major currency units, e.g. cedis)
    _amountController.text = (widget.totalAmount / 100).toStringAsFixed(2);
  }

  @override
  void dispose() {
    _amountController.dispose();
    _referenceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final accountsAsync = ref.watch(
      leasePaymentAccountsProvider(widget.leaseId),
    );
    final notifier = ref.watch(createOfflinePaymentNotifierProvider.notifier);
    final state = ref.watch(createOfflinePaymentNotifierProvider);

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Record Payment',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Record an offline payment for this invoice. Your property manager will verify it.',
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 20),

            // Payment account selector
            Text(
              'Payment Account',
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const SizedBox(height: 8),
            accountsAsync.when(
              loading: () => const LinearProgressIndicator(),
              error: (_, __) => Text(
                'Could not load payment accounts',
                style: TextStyle(color: Colors.red.shade700, fontSize: 13),
              ),
              data: (accounts) {
                final offlineAccounts = accounts
                    .where((a) => a.rail == 'OFFLINE')
                    .toList();

                if (offlineAccounts.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.orange.shade200),
                    ),
                    child: Text(
                      'No offline payment accounts available. Contact your property manager.',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.orange.shade800,
                      ),
                    ),
                  );
                }

                // Auto-select first (or default) account
                if (_selectedAccount == null) {
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (!mounted) return;
                    final defaultAcc = offlineAccounts.firstWhere(
                      (a) => a.isDefault,
                      orElse: () => offlineAccounts.first,
                    );
                    setState(() => _selectedAccount = defaultAcc);
                  });
                }

                return DropdownButtonFormField<PaymentAccountModel>(
                  value: _selectedAccount,
                  isExpanded: true,
                  decoration: InputDecoration(
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 12,
                    ),
                  ),
                  hint: const Text('Select payment account'),
                  items: offlineAccounts
                      .map(
                        (a) => DropdownMenuItem(
                          value: a,
                          child: Text(
                            a.displayLabel,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      )
                      .toList(),
                  onChanged: (a) => setState(() => _selectedAccount = a),
                );
              },
            ),

            const SizedBox(height: 16),

            // Amount field
            Text(
              'Amount (${widget.currency})',
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
              ],
              decoration: InputDecoration(
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 12,
                ),
                hintText: '0.00',
              ),
            ),

            const SizedBox(height: 16),

            // Reference field
            Text(
              'Reference (optional)',
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _referenceController,
              decoration: InputDecoration(
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 12,
                ),
                hintText: 'Receipt number, transaction ID...',
              ),
            ),

            if (state.status.isFailed()) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  state.errorMessage ?? 'Something went wrong. Try again.',
                  style: TextStyle(fontSize: 13, color: Colors.red.shade700),
                ),
              ),
            ],

            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: state.status.isLoading()
                    ? null
                    : () => _submit(notifier),
                child: state.status.isLoading()
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Submit Payment'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit(CreateOfflinePaymentNotifier notifier) async {
    final account = _selectedAccount;
    if (account == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a payment account')),
      );
      return;
    }

    final amountText = _amountController.text.trim();
    final amountDouble = double.tryParse(amountText);
    if (amountDouble == null || amountDouble <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid amount')),
      );
      return;
    }

    // Convert to smallest currency unit (pesewas)
    final amountInt = (amountDouble * 100).round();

    await HapticFeedback.mediumImpact();

    final success = await notifier.submit(
      invoiceId: widget.invoiceId,
      paymentAccountId: account.id,
      provider: account.provider ?? 'CASH',
      amount: amountInt,
      reference: _referenceController.text.trim().isEmpty
          ? null
          : _referenceController.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      Navigator.of(context).pop();
      widget.onSuccess();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payment recorded. Awaiting verification.'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }
}
