import 'package:flutter/material.dart';

class UplomingPaymentCard extends StatelessWidget {
  const UplomingPaymentCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.grey.shade100, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(10.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Upcoming Payment',
              style: Theme.of(context).textTheme.titleLarge!.copyWith(
                fontSize: 17,
                fontFamily: "Shantell",
              ),
            ),
            SizedBox(height: 10),
            Card(
              elevation: 0,
              color: Colors.white,
              shadowColor: Colors.black26,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
                side: BorderSide(color: Colors.grey.shade200, width: 1),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      vertical: 16.0,
                      horizontal: 10.0,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'GHS 1,200.00',
                          style: Theme.of(context).textTheme.displaySmall!
                              .copyWith(fontWeight: FontWeight.bold),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          margin: const EdgeInsets.only(right: 10),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(5),
                            color: Colors.green.shade50,
                          ),
                          child: Text(
                            "Upcoming",
                            style: TextStyle(
                              fontWeight: FontWeight.w900,
                              color: Colors.green.shade900,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Divider(color: Colors.grey.shade100, height: 0),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 10.0),
                    color: Colors.grey.shade100,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(
                            'Expected Date',
                            style: Theme.of(
                              context,
                            ).textTheme.titleLarge!.copyWith(fontSize: 17),
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4.0),
                            child: Text(
                              'Due in 5 days',
                              style: Theme.of(context).textTheme.labelMedium!
                                  .copyWith(
                                    color: Colors.red.shade400,
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                          ),
                          leading: Icon(Icons.calendar_today_outlined),
                          trailing: Text(
                            "Aug 25",
                            style: Theme.of(
                              context,
                            ).textTheme.titleLarge!.copyWith(fontSize: 13),
                          ),
                        ),
                        ListTile(
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          title: Text(
                            'Payment Period',
                            style: Theme.of(
                              context,
                            ).textTheme.titleLarge!.copyWith(fontSize: 17),
                          ),
                          leading: Icon(Icons.calendar_month_outlined),
                          trailing: Text(
                            "Aug 2022",
                            style: Theme.of(
                              context,
                            ).textTheme.titleLarge!.copyWith(fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () {},
                child: Text("View Details"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
