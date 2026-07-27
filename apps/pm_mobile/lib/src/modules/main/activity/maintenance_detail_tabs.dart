import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/maintenance_utils.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_activity_log_model.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_comment_model.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_expense_model.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';
import 'package:rentloop_manager/src/repository/providers/activity/maintenance_detail_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// The three bodies behind the maintenance detail screen's segmented control:
// History (activity log timeline), Comments (thread) and Expenses (ledger).
//
// Each tab owns its own provider, loading state, empty state and error state,
// so a failure in one never blanks the screen around it. They are separated
// from maintenance_detail.dart purely to keep both files readable.
//
// Write actions (post comment, add expense) are out of scope for this pass —
// the controls render per the design and explain themselves via a toast rather
// than silently doing nothing.

String _timestamp(String? iso) {
  if (iso == null) return '';
  final date = DateTime.tryParse(iso);
  if (date == null) return '';
  return DateFormat('MMM d, y · h:mm a').format(date.toLocal());
}

void _notYet(WidgetRef ref, String what) {
  showRLToast(
    ref,
    tone: RLToastTone.info,
    title: 'Coming soon',
    body: '$what is not available in the app yet.',
  );
}

// ── History ───────────────────────────────────────────────────────────────────

/// Visual + copy treatment per activity-log action. Falls back to a neutral
/// note for any action the backend adds later, so an unknown enum renders as
/// a plain entry instead of crashing.
({IconData icon, RLTone tone, String title}) _actionStyle(String action) =>
    switch (action) {
      'CREATED' => (
        icon: Icons.add_rounded,
        tone: RLTone.success,
        title: 'Request created',
      ),
      'STATUS_CHANGED' => (
        icon: Icons.swap_horiz_rounded,
        tone: RLTone.info,
        title: 'Status changed',
      ),
      'WORKER_ASSIGNED' => (
        icon: Icons.handyman_outlined,
        tone: RLTone.warning,
        title: 'Worker assigned',
      ),
      'MANAGER_ASSIGNED' => (
        icon: Icons.person_outline_rounded,
        tone: RLTone.danger,
        title: 'Manager assigned',
      ),
      'RESOLVED' => (
        icon: Icons.check_rounded,
        tone: RLTone.success,
        title: 'Resolved',
      ),
      'CANCELED' => (
        icon: Icons.close_rounded,
        tone: RLTone.danger,
        title: 'Cancelled',
      ),
      _ => (
        icon: Icons.sticky_note_2_outlined,
        tone: RLTone.neutral,
        title: 'Note',
      ),
    };

class MaintenanceHistoryTab extends ConsumerWidget {
  const MaintenanceHistoryTab({
    super.key,
    required this.request,
    required this.propertyIdHint,
  });

  /// Assignment and creation entries read the person off the request rather
  /// than the log — see [_describe].
  final MaintenanceRequestModel request;
  final String? propertyIdHint;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final provider = maintenanceRequestActivityLogsProvider(
      request.id,
      propertyIdHint,
    );
    final logsAsync = ref.watch(provider);

    if (!logsAsync.hasValue && logsAsync.isLoading) {
      return const _TabSkeleton(rows: 4);
    }
    if (logsAsync.hasError && !logsAsync.hasValue) {
      return RLSectionError(
        title: "Couldn't load history",
        compact: true,
        onRetry: () => ref.invalidate(provider),
      );
    }

    final logs = logsAsync.valueOrNull ?? const [];
    if (logs.isEmpty) {
      return const _TabEmpty(message: 'No activity yet.');
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var i = 0; i < logs.length; i++)
          _HistoryEntry(
            log: logs[i],
            request: request,
            last: i == logs.length - 1,
          ),
      ],
    );
  }
}

/// Emphasis levels inside a history entry's sentence.
enum _Emph { normal, strong, subtle }

typedef _Seg = ({String text, _Emph emph});

/// The sentence under an entry's title, plus the person (if any) whose avatar
/// leads it.
///
/// Ported from the web portal's `ActivityTab` → `ActivityDetail`
/// (`apps/property-manager/.../request/activity-tab.tsx`) so both clients
/// narrate an identical history. Two things follow from that source:
///
/// * The backend never writes `description` on an activity log, so every
///   sentence is composed client-side from `action` + `metadata` + the
///   request. Composing rather than reading a string is also what lets
///   individual values carry emphasis.
/// * Assignment entries take the assignee from the **request**, not the log —
///   the log records only who performed the assignment. This means a request
///   reassigned twice shows its *current* assignee on both entries. That
///   imprecision is inherited deliberately: matching the web is worth more
///   than diverging here, and the alternative needs a backend change.
({List<_Seg> parts, String? person}) _describe(
  MaintenanceActivityLogModel log,
  MaintenanceRequestModel mr,
) {
  final performer = log.performedByClientUser?.name;
  final meta = log.metadata;

  ({List<_Seg> parts, String? person}) assigned(
    String? assigneeName,
    String? assigneeId,
    String fallback,
  ) {
    final isSelf =
        log.performedByClientUser?.id != null &&
        log.performedByClientUser?.id == assigneeId;
    return (
      parts: [
        (text: 'Assigned to ', emph: _Emph.normal),
        (text: assigneeName ?? fallback, emph: _Emph.strong),
        if (isSelf) (text: ' (assigned to themselves)', emph: _Emph.subtle),
      ],
      person: assigneeName,
    );
  }

  switch (log.action) {
    case 'CREATED':
      final byTenant = mr.createdByTenantId != null;
      final byManager = mr.createdByClientUserId != null;
      if (byTenant && byManager) {
        return (
          parts: [
            (text: 'Created by ', emph: _Emph.normal),
            (text: performer ?? 'a manager', emph: _Emph.strong),
            (text: ' on behalf of the tenant', emph: _Emph.normal),
          ],
          person: performer,
        );
      }
      if (byManager) {
        return (
          parts: [
            (text: 'Created by ', emph: _Emph.normal),
            (text: performer ?? 'a manager', emph: _Emph.strong),
          ],
          person: performer,
        );
      }
      final tenant = mr.createdByTenant?.fullName;
      return (
        parts: [
          (text: 'Submitted by ', emph: _Emph.normal),
          (text: tenant ?? 'a tenant', emph: _Emph.strong),
        ],
        person: tenant,
      );

    case 'STATUS_CHANGED':
      final from = meta?['from'] as String?;
      final to = meta?['to'] as String?;
      if (from != null && to != null) {
        return (
          parts: [
            (text: 'Changed from ', emph: _Emph.normal),
            (text: mrStatusLabel(from), emph: _Emph.strong),
            (text: ' to ', emph: _Emph.normal),
            (text: mrStatusLabel(to), emph: _Emph.strong),
          ],
          person: null,
        );
      }
      return (parts: _note(log), person: null);

    case 'WORKER_ASSIGNED':
      return assigned(mr.assignedWorker?.name, mr.assignedWorkerId, 'a worker');

    case 'MANAGER_ASSIGNED':
      return assigned(
        mr.assignedManager?.name,
        mr.assignedManagerId,
        'a manager',
      );

    default:
      return (parts: _note(log), person: performer);
  }
}

/// Falls back to the log's own `description` where the web portal does — it is
/// always null today, but rendering it costs nothing and means a future
/// backend that starts writing notes needs no client change.
List<_Seg> _note(MaintenanceActivityLogModel log) {
  final note = log.description;
  return note == null || note.isEmpty
      ? const <_Seg>[]
      : [(text: note, emph: _Emph.normal)];
}

class _HistoryEntry extends StatelessWidget {
  const _HistoryEntry({
    required this.log,
    required this.request,
    required this.last,
  });

  final MaintenanceActivityLogModel log;
  final MaintenanceRequestModel request;
  final bool last;

  @override
  Widget build(BuildContext context) {
    final style = _actionStyle(log.action);
    final described = _describe(log, request);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Node + connector rail down to the next entry.
          Column(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: style.tone.bg,
                  shape: BoxShape.circle,
                ),
                child: Icon(style.icon, size: 16, color: style.tone.fg),
              ),
              if (!last)
                Expanded(
                  child: Container(
                    width: 1.5,
                    margin: const EdgeInsets.symmetric(vertical: 3),
                    color: RLTokens.hairline,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 13),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: last ? 0 : 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    style.title,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 14.5,
                      fontWeight: RLTokens.bold,
                      color: RLTokens.ink,
                    ),
                  ),
                  if (described.parts.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    _EntrySentence(
                      parts: described.parts,
                      person: described.person,
                    ),
                  ],
                  const SizedBox(height: 5),
                  Text(
                    _timestamp(log.createdAt),
                    style: const TextStyle(
                      fontFamily: RLTokens.fontMono,
                      fontSize: 10.5,
                      color: RLTokens.micro,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Renders a composed sentence as one flowing paragraph: an optional inline
/// avatar for the person it names, then the segments with their emphasis.
///
/// Uses [Text.rich] with a [WidgetSpan] rather than a Row of separate widgets
/// so a long name wraps mid-sentence like text instead of overflowing or
/// forcing an awkward break.
class _EntrySentence extends StatelessWidget {
  const _EntrySentence({required this.parts, required this.person});

  final List<_Seg> parts;
  final String? person;

  @override
  Widget build(BuildContext context) {
    final name = person;
    return Text.rich(
      TextSpan(
        children: [
          if (name != null && name.isNotEmpty) ...[
            WidgetSpan(
              alignment: PlaceholderAlignment.middle,
              child: RLAvatar(name, size: 18, crimsonTone: true),
            ),
            const TextSpan(text: ' '),
          ],
          for (final part in parts)
            TextSpan(
              text: part.text,
              style: TextStyle(
                color: part.emph == _Emph.strong
                    ? RLTokens.ink
                    : RLTokens.muted,
                fontWeight: part.emph == _Emph.strong
                    ? RLTokens.semibold
                    : RLTokens.regular,
                fontStyle: part.emph == _Emph.subtle
                    ? FontStyle.italic
                    : FontStyle.normal,
              ),
            ),
        ],
      ),
      style: const TextStyle(
        fontFamily: RLTokens.fontSans,
        fontSize: 13,
        color: RLTokens.muted,
        height: 1.5,
      ),
    );
  }
}

// ── Comments ──────────────────────────────────────────────────────────────────

class MaintenanceCommentsTab extends ConsumerWidget {
  const MaintenanceCommentsTab({
    super.key,
    required this.requestId,
    required this.propertyIdHint,
  });

  final String requestId;
  final String? propertyIdHint;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final provider = maintenanceRequestCommentsProvider(
      requestId,
      propertyIdHint,
    );
    final commentsAsync = ref.watch(provider);

    if (!commentsAsync.hasValue && commentsAsync.isLoading) {
      return const _TabSkeleton(rows: 2);
    }
    if (commentsAsync.hasError && !commentsAsync.hasValue) {
      return RLSectionError(
        title: "Couldn't load comments",
        compact: true,
        onRetry: () => ref.invalidate(provider),
      );
    }

    final comments = commentsAsync.valueOrNull ?? const [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _CommentComposer(),
        const SizedBox(height: 12),
        if (comments.isEmpty)
          const _TabEmpty(message: 'No comments yet.')
        else
          for (final comment in comments) ...[
            _CommentCard(comment: comment),
            const SizedBox(height: 10),
          ],
      ],
    );
  }
}

/// Renders the design's composer so the tab reads correctly, but posting is
/// not wired this pass — the field is read-only and Post explains itself
/// rather than accepting text that would go nowhere.
class _CommentComposer extends ConsumerWidget {
  const _CommentComposer();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return RLCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          const SizedBox(
            width: double.infinity,
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 6),
              child: Text(
                'Write a comment...',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 14,
                  color: RLTokens.mutedSoft,
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          RLBtn(
            label: 'Post',
            icon: Icons.send_rounded,
            large: false,
            onPressed: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) _notYet(ref, 'Posting comments');
            },
          ),
        ],
      ),
    );
  }
}

class _CommentCard extends StatelessWidget {
  const _CommentCard({required this.comment});

  final MaintenanceCommentModel comment;

  @override
  Widget build(BuildContext context) {
    final author = comment.createdByClientUser?.name ?? 'Unknown';
    return RLCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              RLAvatar(author, size: 30, crimsonTone: true),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  author,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14.5,
                    fontWeight: RLTokens.bold,
                    color: RLTokens.ink,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            comment.content,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 14,
              color: RLTokens.inkSoft,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            _timestamp(comment.createdAt),
            style: const TextStyle(
              fontFamily: RLTokens.fontMono,
              fontSize: 10.5,
              color: RLTokens.micro,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Expenses ──────────────────────────────────────────────────────────────────

class MaintenanceExpensesTab extends ConsumerWidget {
  const MaintenanceExpensesTab({
    super.key,
    required this.requestId,
    required this.propertyIdHint,
  });

  final String requestId;
  final String? propertyIdHint;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final provider = maintenanceRequestExpensesProvider(
      requestId,
      propertyIdHint,
    );
    final expensesAsync = ref.watch(provider);

    if (!expensesAsync.hasValue && expensesAsync.isLoading) {
      return const _TabSkeleton(rows: 2);
    }
    if (expensesAsync.hasError && !expensesAsync.hasValue) {
      return RLSectionError(
        title: "Couldn't load expenses",
        compact: true,
        onRetry: () => ref.invalidate(provider),
      );
    }

    final expenses = expensesAsync.valueOrNull ?? const [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        RLBtn(
          label: 'Add expense',
          kind: RLBtnKind.light,
          icon: Icons.add_rounded,
          full: true,
          onPressed: () async {
            await Haptics.vibrate(HapticsType.selection);
            if (context.mounted) _notYet(ref, 'Adding expenses');
          },
        ),
        const SizedBox(height: 12),
        if (expenses.isEmpty)
          const _TabEmpty(message: 'No expenses recorded.')
        else
          _ExpenseList(expenses: expenses),
      ],
    );
  }
}

class _ExpenseList extends StatelessWidget {
  const _ExpenseList({required this.expenses});

  final List<MaintenanceExpenseModel> expenses;

  @override
  Widget build(BuildContext context) {
    // Expenses on one request share a currency in practice; the first row's
    // code labels the total rather than assuming a hardcoded currency.
    final currency = expenses.first.currency;
    final total = expenses.fold<num>(0, (sum, e) => sum + e.amount);

    return RLCard(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          for (var i = 0; i < expenses.length; i++)
            // The last row drops its divider — the Total's own top border
            // already separates it, and both would read as a double rule.
            _ExpenseRow(expense: expenses[i], last: i == expenses.length - 1),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 13),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: RLTokens.hairline)),
            ),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Total',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13.5,
                      fontWeight: RLTokens.bold,
                      color: RLTokens.ink,
                    ),
                  ),
                ),
                Text(
                  _money(total, currency),
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSerif,
                    fontSize: 18,
                    color: RLTokens.ink,
                    letterSpacing: -0.3,
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

class _ExpenseRow extends StatelessWidget {
  const _ExpenseRow({required this.expense, required this.last});

  final MaintenanceExpenseModel expense;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 13),
      decoration: BoxDecoration(
        border: last
            ? null
            : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  expense.description,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.ink,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${expense.code} · ${_timestamp(expense.createdAt)}',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 10.5,
                    color: RLTokens.micro,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text(
            _money(expense.amount, expense.currency),
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 14,
              fontWeight: RLTokens.semibold,
              color: RLTokens.ink,
            ),
          ),
        ],
      ),
    );
  }
}

/// Expense amounts arrive in major units already (unlike invoice/payment
/// figures, which are integer pesewas), and are shown to the pesewa rather
/// than rounded — a repair bill's decimals matter.
String _money(num amount, String currency) {
  final symbol = currency == 'GHS' ? 'GH₵' : currency;
  return '$symbol ${NumberFormat('#,##0.00').format(amount)}';
}

// ── Shared tab states ─────────────────────────────────────────────────────────

class _TabEmpty extends StatelessWidget {
  const _TabEmpty({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 28, 0, 8),
      child: Center(
        child: Text(
          message,
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13.5,
            color: RLTokens.muted,
          ),
        ),
      ),
    );
  }
}

class _TabSkeleton extends StatelessWidget {
  const _TabSkeleton({required this.rows});

  final int rows;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: Column(
        children: [
          for (var i = 0; i < rows; i++)
            Container(
              height: 58,
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(RLTokens.rMd),
              ),
            ),
        ],
      ),
    );
  }
}
