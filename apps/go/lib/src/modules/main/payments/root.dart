import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';



class PaymentsScreen extends ConsumerStatefulWidget {
  const PaymentsScreen({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _PaymentsScreen();
}

class _PaymentsScreen extends ConsumerState<PaymentsScreen> {
  // Dummy Data
  final List<Transaction> _transactions = [
    Transaction(
      id: '1',
      title: 'Monthly Rent - Apt 4B',
      date: DateTime.now().subtract(const Duration(days: 2)),
      amount: 1200.00,
      status: 'Completed',
      isCredit: false,
    ),
    Transaction(
      id: '2',
      title: 'Utility Bill - Water',
      date: DateTime.now().subtract(const Duration(days: 5)),
      amount: 45.50,
      status: 'Completed',
      isCredit: false,
    ),
    Transaction(
      id: '3',
      title: 'Mobile Money Deposit',
      date: DateTime.now().subtract(const Duration(days: 10)),
      amount: 500.00,
      status: 'Failed',
      isCredit: true,
    ),
    Transaction(
      id: '4',
      title: 'Service Charge',
      date: DateTime.now().subtract(const Duration(days: 12)),
      amount: 150.00,
      status: 'Completed',
      isCredit: false,
    ),
  ];

  final List<PaymentMethod> _paymentMethods = [
    PaymentMethod(
      id: '1',
      name: 'MTN Mobile Money',
      detail: '024 ••• 1234',
      type: 'Momo',
      color: Colors.yellow.shade700,
    ),
    PaymentMethod(
      id: '2',
      name: 'Visa Card',
      detail: '•••• 4242',
      type: 'Card',
      color: Colors.blue.shade800,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'Payment Overview',
          style: Theme.of(context).textTheme.titleLarge!.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.history),
            tooltip: 'History',
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildBalanceCard(context),
            const SizedBox(height: 24),
            _buildSectionTitle(context, 'Payment Methods'),
            const SizedBox(height: 12),
            _buildPaymentMethodsList(context),
            const SizedBox(height: 24),
            _buildSectionTitle(context, 'Recent Transactions'),
            const SizedBox(height: 12),
            _buildTransactionsList(context),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium!.copyWith(
          fontWeight: FontWeight.w700,
          color: Colors.black87,
        ),
      ),
    );
  }

  Widget _buildBalanceCard(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).primaryColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).primaryColor.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Theme.of(context).primaryColor,
            Theme.of(context).primaryColor.withRed(200),
          ],
        ),
      ),
      child: Column(
        children: [
          const Text(
            'Total Outstanding Balance',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'GHS 1,245.50',
            style: TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Theme.of(context).primaryColor,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Pay Now',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethodsList(BuildContext context) {
    return SizedBox(
      height: 100, // Reduced height for compact look
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        scrollDirection: Axis.horizontal,
        itemCount: _paymentMethods.length + 1,
        separatorBuilder: (context, index) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          if (index == _paymentMethods.length) {
            return _buildAddPaymentMethodCard(context);
          }
          final method = _paymentMethods[index];
          return Container(
            width: 150,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  method.type == 'Card' ? Icons.credit_card : Icons.phone_android,
                  color: method.color,
                  size: 28,
                ),
                const Spacer(),
                Text(
                  method.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  method.detail,
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildAddPaymentMethodCard(BuildContext context) {
    return Container( 
      width: 80,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade300, style: BorderStyle.none),
      ),
      child: InkWell(
        onTap: () {},
         borderRadius: BorderRadius.circular(16),
        child: Center(
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
                color: Colors.grey.shade100,
                shape: BoxShape.circle
            ),
            child: Icon(Icons.add, color: Colors.grey.shade600),
          ),
        ),
      ),
    );
  }


  Widget _buildTransactionsList(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _transactions.length,
      separatorBuilder: (context, index) => Divider(
        height: 1,
        color: Colors.grey.shade100,
      ),
      itemBuilder: (context, index) {
        final tx = _transactions[index];
        return Container(
          color: Colors.white,
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 0),
            leading: CircleAvatar(
              backgroundColor: tx.isCredit
                  ? Colors.green.shade50
                  : (tx.status == 'Failed' ? Colors.red.shade50 : Colors.blue.shade50),
              child: Icon(
                tx.isCredit
                    ? Icons.arrow_downward
                    : (tx.status == 'Failed' ? Icons.error_outline : Icons.arrow_upward),
                color: tx.isCredit
                    ? Colors.green
                    : (tx.status == 'Failed' ? Colors.red : Colors.blue),
                size: 20,
              ),
            ),
            title: Text(
              tx.title,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            ),
            subtitle: Text(
              "${tx.date.day}/${tx.date.month}/${tx.date.year}",
              style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${tx.isCredit ? "+" : "-"} GHS ${tx.amount.toStringAsFixed(2)}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: tx.isCredit ? Colors.green : Colors.black87,
                  ),
                ),
                if (tx.status != 'Completed')
                  Text(
                    tx.status,
                    style: TextStyle(
                      fontSize: 10,
                      color: tx.status == 'Failed' ? Colors.red : Colors.orange,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class Transaction {
  final String id;
  final String title;
  final DateTime date;
  final double amount;
  final String status;
  final bool isCredit;

  Transaction({
    required this.id,
    required this.title,
    required this.date,
    required this.amount,
    required this.status,
    required this.isCredit,
  });
}

class PaymentMethod {
  final String id;
  final String name;
  final String detail;
  final String type;
  final Color color;

  PaymentMethod({
    required this.id,
    required this.name,
    required this.detail,
    required this.type,
    required this.color,
  });
}
