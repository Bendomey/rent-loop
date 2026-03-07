---
id: DRAFT-5
title: Implement Unit Reviews module
status: Draft
assignee: []
created_date: '2026-03-04 18:56'
labels:
  - frontend
  - property-manager
  - stub
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Module at app/modules/properties/property/assets/units/unit/reviews/index.tsx shows placeholder message only. Needs full reviews UI with backend integration.

Context
Review Creation Workflow

Review submission is triggered at defined lease milestones. For example, the system might send a prompt 30 days after move-in, once at mid-lease, and once after the lease end. This aligns with property manager best practices: surveying tenants at 1 month and periodically thereafter. The workflow is:

Trigger milestone. When a tenant reaches a milestone (e.g. first-month anniversary, mid-term, or move-out), the system invites them to leave a review.

Check eligibility. The system verifies the lease is active (or just ended) and that the tenant is indeed on that lease. It enforces one review per lease per milestone, e.g. by querying for existing reviews with the same LeaseID and ReviewStage.

Collect review data. The tenant submits scores for each category (cleanliness, maintenance, location, etc.) plus an optional comment. These are stored in the Review table. We record the current timestamp (CreatedAt) and the lease context. Because the tenant is already authenticated and linked to the lease, we store their TenantID internally but do not expose it. This mirrors the idea that only registered/verified renters may review.

Moderation hold. New reviews begin with Flagged = FALSE, Removed = FALSE. Automated filters (for profanity, personal info, etc.) run on the content. If a review appears suspicious (e.g. content triggers a filter or the same user posts twice), it can be marked Flagged = TRUE. The review is not shown publicly until moderation completes. This follows common practice: reviews are not published immediately but go through review/filters.

Moderator and owner checks. A human moderator can review flagged content and either remove it (Removed = TRUE) or approve it (Removed = FALSE). Landlords or property managers can also see Flagged reviews for response if needed.

This ensures the review system mirrors trusted platforms that tie feedback to real transactions. For example, FastExpert (a real-estate review platform) enforces one review per transaction and uses both automated and manual moderation on flagged reviews. Similarly, our design includes moderation fields (Flagged, Removed) and an audit trail. The LandlordResponse field lets the landlord or manager reply publicly, as some sites allow landlord/developer responses.

Review Display Workflow

When showing reviews, we query all approved reviews for a given unit or building. The UI might aggregate the numeric scores (e.g. average cleanliness) and list individual feedback. Each displayed review includes:

The rating scores by category (cleanliness, maintenance, location, etc.) and the optional text comment.

The date/timestamp (CreatedAt) when the review was posted, and contextual lease dates from the Lease (e.g. “Leased Jan–Dec 2024”). This gives readers temporal context on the feedback.

A tenant descriptor, but no PII: for anonymity we do not show the tenant’s name or email. Instead, reviews can be labeled generically (e.g. “Verified Tenant” or “Past Resident”) to emphasize validity without identifying the person.

Any landlord response if present (e.g. a “Manager Reply” section from LandlordResponse).

The milestone label (post-move-in, mid-lease, or move-out) can also be indicated to clarify when during the tenancy the feedback was given.

For moderation fields: only reviews with Removed = FALSE and Flagged = FALSE are shown. Users can report content as well (setting Flagged = TRUE), echoing the “crowdsourced” flagging seen in review sites. The listing of reviews should allow sorting by date or rating if desired.

Finally, the summary display might include aggregate statistics (e.g. average rating per category) for the unit or building. All these elements ensure transparency and usability: by linking reviews to verified leases (and hence real tenancy data), using multiple rating dimensions, and concealing personal details, the design follows best practices from rental marketplaces. It accommodates the ongoing nature of rental feedback (not just one-time product reviews), and meets each requirement (milestone triggers, single review per stage, structured ratings, anonymity, moderation fields, multi-level properties, etc.) in a coherent data model.

Find out more here https://chatgpt.com/share/69ac333e-f768-8008-a652-19f671b22a72
<!-- SECTION:DESCRIPTION:END -->
