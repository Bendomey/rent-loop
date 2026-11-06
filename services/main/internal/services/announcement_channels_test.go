package services

import "testing"

func TestAnnouncementChannels(t *testing.T) {
	cases := []struct {
		priority  string
		sms, mail bool
	}{
		{"NORMAL", true, false},
		{"IMPORTANT", true, false},
		{"URGENT", true, true},
		{"", true, false},
		{"urgent", true, false},
	}
	for _, c := range cases {
		sms, mail := announcementChannels(c.priority)
		if sms != c.sms || mail != c.mail {
			t.Errorf("announcementChannels(%q) = (%v, %v), want (%v, %v)", c.priority, sms, mail, c.sms, c.mail)
		}
	}
}
