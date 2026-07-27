# Authentication

This describes how authentication works across the Rent-Loop backend, independent of any particular implementation detail.

## Three separate realms

The system authenticates three distinct kinds of accounts, and treats them as entirely independent:

- **Admin** — internal Rent-Loop staff (superadmin).
- **Client User** — property managers. This is what the property-manager web portal and the property-manager mobile app authenticate as.
- **Tenant Account** — tenants. Used by the tenant-facing mobile app.

Each realm has its own signing secret and its own credentials. A token issued for one realm means nothing to another — there is no shared session or single sign-on across them.

## Access tokens

Every request to a protected endpoint carries a short-lived access token (`Authorization: Bearer <token>`). It identifies who's calling and nothing else of substance — no role or permission list is baked into it, because that information can change (a property manager's role or membership can be revoked) and re-checking it from the database on every request means a permission change takes effect immediately rather than waiting for the token to expire.

Access tokens are deliberately short-lived (currently one hour for the client-user realm) so that if one ever leaks — in a log line, a misconfigured proxy, a browser extension, a crash report — the window in which it's useful to an attacker is small.

## Refresh tokens

A short-lived access token by itself would mean forcing users to re-enter their password every hour, which is unacceptable. Instead, login also hands the client a second, longer-lived credential — a refresh token — whose only job is to be exchanged for a new access token when the old one expires. This exchange happens silently, invisible to the user.

A refresh token is not self-verifying the way the access token is. It's a reference to a record the server keeps for that specific signed-in session, which is what allows the server to actually reason about a refresh token after the fact rather than just trusting whatever it's handed — the same way a hotel key card only works because the front desk still has it on file, not because the card itself proves anything.

That server-side record is what enables everything else described below:

- **Sliding expiration.** A refresh token has its own expiration, much longer than the access token's (on the order of months), but that expiration resets every time it's actually used. A person who opens the app regularly never hits it. A device that's abandoned — lost, replaced, forgotten — eventually stops working on its own, without anyone having to do anything.
- **Rotation.** Every time a refresh token is used, it's retired and replaced with a new one in the same moment. A refresh token is therefore single-use. This isn't just paranoia — it's what makes theft detectable at all: if a retired refresh token is ever presented again, that can only mean two different parties are holding what was supposed to be a single, unique credential — and that's the point.
- **Explicit revocation.** Unlike the token's own expiration, revocation is something the server can trigger immediately — on logout, or in response to a session being flagged as suspicious. There's no waiting for a stale token to time out on its own.
- **Theft response.** If a refresh token that has already been rotated away gets used again, the system doesn't just reject that one attempt — it invalidates every token descended from it, ending that entire signed-in session outright and requiring a real login to recover. This is the one case where a genuine user might legitimately get signed out, and it's the correct outcome: it means something is actively wrong with that session.

## The replay grace window

Rotation creates a problem the theory doesn't anticipate: a single honest client can present the same refresh token twice, at nearly the same instant, through no fault of its own. Two browser tabs waking up together, or a page load racing a background request, both notice the access token expired and both try to refresh. One wins; the other arrives holding a token that was valid when it was picked up and retired a few milliseconds later.

Judged purely on the rule above, that second request looks exactly like theft — and the response, ending the whole session, would be a spurious logout for someone who did nothing wrong.

So a replayed token is only treated as theft once a short grace window has passed. Inside that window, the server remembers what it handed back the first time and returns the same thing again. The late request gets the same answer as the early one, both tabs carry on, and nothing is revoked. After the window closes, the original rule applies in full: a replayed token kills the chain.

The window is deliberately short — seconds, not minutes. It's sized to cover the physical simultaneity of one client racing itself, which is inherently brief. A genuine attacker replaying a stolen token minutes, hours, or days later falls well outside it and is still caught. The trade-off is narrow and explicit: a very small period in which a replayed token is answered rather than punished, bought in exchange for not logging people out for using two tabs.

Because the server stores only a fingerprint of each refresh token and never the token itself, it cannot re-derive what it previously issued. The remembered answer is therefore held briefly in a short-lived cache keyed by the retired token's fingerprint, and expires on its own when the window closes.

## The practical experience

1. Log in once → get a short access token and a refresh token.
2. The app uses the access token normally.
3. Roughly every hour, the access token expires. The app exchanges the refresh token for a new access token (and a new refresh token, per rotation) without the user noticing anything.
4. Step 3 repeats indefinitely, for as long as the person keeps using the app at least once within the refresh token's sliding window.
5. Logging out — or the system detecting theft — revokes the session for real, and only then does the person have to sign in again.

## What this achieves

- An attacker who captures an access token gets a small, short window, not a permanent foothold.
- A legitimate, actively-used session effectively never expires, without ever issuing a credential that is *permanently* unrevocable.
- A stolen or duplicated session is something the system can actually detect and shut down, rather than something that silently persists for as long as the token's fixed lifetime allows.

## Current status

- **Client User (property manager) realm**: implemented as described, with one exception — the replay grace window above is **designed but not yet built**. Until it is, two tabs racing a refresh can trip the theft response and force a spurious logout. This matters most for the web portal, where multiple tabs are normal.
- **Admin and Tenant Account realms**: still authenticate with a bare access token only — no refresh, no server-side revocation, no sliding session. Extending the same model to these realms is a natural next step but is not yet scheduled.
