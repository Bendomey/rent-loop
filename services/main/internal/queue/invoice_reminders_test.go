package queue

import (
	"slices"
	"strings"
	"testing"
)

func TestOverdueReminderCatchUpSendsOnlyTheLatestReached(t *testing.T) {
	// INV-2610-DU5V4C: due Oct 13, first reminder run on Oct 18.
	var sent []string
	runs := []struct {
		day         string
		daysPastDue int
		want        string
	}{
		{"Oct 18", 5, "overdue_3d"},
		{"Oct 19", 6, ""},
		{"Oct 20", 7, "overdue_7d"},
		{"Oct 21", 8, ""},
		{"Oct 27", 14, "overdue_14d"},
	}

	for _, run := range runs {
		key, marks := nextOverdueReminder(run.daysPastDue, sent)
		if key != run.want {
			t.Fatalf("%s (%d days past due): sent %q, want %q", run.day, run.daysPastDue, key, run.want)
		}
		sent = append(sent, marks...)
	}
}

func TestOverdueReminderMarksSkippedThresholdsAsSent(t *testing.T) {
	_, marks := nextOverdueReminder(5, nil)

	for _, key := range []string{"overdue_1d", "overdue_3d"} {
		if !slices.Contains(marks, key) {
			t.Fatalf("expected %s to be marked, got %v", key, marks)
		}
	}
	if slices.Contains(marks, "overdue_7d") {
		t.Fatalf("a threshold not yet reached was marked: %v", marks)
	}
}

func TestOverdueReminderOnScheduleSendsEachThresholdOnce(t *testing.T) {
	var sent []string
	var delivered []string
	for day := 1; day <= 14; day++ {
		key, marks := nextOverdueReminder(day, sent)
		if key != "" {
			delivered = append(delivered, key)
		}
		sent = append(sent, marks...)
	}

	want := []string{"overdue_1d", "overdue_3d", "overdue_7d", "overdue_14d"}
	if !slices.Equal(delivered, want) {
		t.Fatalf("delivered %v, want %v", delivered, want)
	}
}

func TestOverdueReminderIgnoresLowerThresholdsLeftUnsentByOldData(t *testing.T) {
	key, _ := nextOverdueReminder(9, []string{"overdue_7d"})
	if key != "" {
		t.Fatalf("expected nothing once 7d is sent, got %q", key)
	}
}

func TestDaysOverdueLabel(t *testing.T) {
	if got := daysOverdueLabel(1); got != "1 day" {
		t.Fatalf("got %q", got)
	}
	if got := daysOverdueLabel(8); got != "8 days" {
		t.Fatalf("got %q", got)
	}
}

func TestOverdueSMSFitsOneSegment(t *testing.T) {
	fill := strings.NewReplacer(
		"{{tenant_name}}", "Ama",
		"{{invoice_code}}", "INV-2610-DU5V4C",
		"{{unit_name}}", "Audz Studios",
		"{{currency}}", "GHS",
		"{{amount}}", "999999.99",
		"{{due_date}}", "30 Sep 2026",
		"{{days_overdue}}", "14 days",
	)

	for _, threshold := range overdueThresholds {
		_, _, body := overdueTemplate(threshold.key)
		if sms := fill.Replace(body); len(sms) > 160 {
			t.Errorf("%s is %d chars, over one 160-char SMS: %q", threshold.key, len(sms), sms)
		}
	}
}
