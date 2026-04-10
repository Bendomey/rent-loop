# Pricing Structure Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the pricing structure across the website pricing page and blog posts to reflect the new 4-tier model (Free / Starter / Growth / Enterprise).

**Architecture:** Pure content update — no new components or routes needed. Changes are confined to the `tiers` and `faqs` data arrays in the pricing module, the route meta description, and two MDX blog posts.

**Tech Stack:** React Router v7, TypeScript, MDX (blog content)

---

## Pricing Change Summary

| Plan | Old | New |
|---|---|---|
| Free | Up to 5 units, GH₵ 0/month | 1–3 units, GH₵ 0/month (limited features, onboarding) |
| Starter | 6–50 units, GH₵ 70/month | 4–50 units, GHS 199–499/month |
| Growth | 51–150 units, GH₵ 200/month | 51–150 units, GHS 500–1,299/month |
| Enterprise | 150+ units, custom | 150+ units, custom (unchanged) |

## Files to Modify

- Modify: `apps/website/app/modules/pricing/index.tsx` — `tiers` array, feature lists, FAQ answers
- Modify: `apps/website/app/routes/pricing.tsx` — meta description
- Modify: `apps/website/app/content/blog/understanding-asset-management.mdx` — billing table + body text
- Modify: `apps/website/app/content/blog/what-is-rentloop.mdx` — pricing blurb in "Getting Started"

---

### Task 1: Update `tiers` data in pricing module

**Files:**
- Modify: `apps/website/app/modules/pricing/index.tsx:204-231`

- [ ] **Step 1: Update the `tiers` array**

Replace the existing `tiers` const (lines 204–231) with:

```tsx
const freePlanFeatures = [
	'Up to 3 units',
	'Tenant management',
	'Lease tracking',
	'Maintenance requests',
	'Rent collection & payment tracking',
]

const paidPlanFeatures = [
	'Tenant management',
	'Lease tracking',
	'Maintenance requests',
	'Rent collection & payment tracking',
	'Analytics & reporting',
	'Document management',
	'Team member access',
	'Email & chat support',
]

const tiers = [
	{
		name: 'Free',
		range: '1 – 3 units',
		price: 'GH₵ 0',
		priceSuffix: '/month',
		description:
			'Get started at no cost. Designed for onboarding and early adoption.',
		highlighted: false,
		features: freePlanFeatures,
	},
	{
		name: 'Starter',
		range: '4 – 50 units',
		price: 'GHS 199 – 499',
		priceSuffix: '/month',
		description:
			'Flat monthly rate applied automatically once you add a 4th unit.',
		highlighted: true,
		features: paidPlanFeatures,
	},
	{
		name: 'Growth',
		range: '51 – 150 units',
		price: 'GHS 500 – 1,299',
		priceSuffix: '/month',
		description: 'Flat monthly rate applied automatically at 51 units.',
		highlighted: false,
		features: paidPlanFeatures,
	},
]
```

- [ ] **Step 2: Remove the old `allFeatures` const**

Delete this block (lines 193–202):

```tsx
const allFeatures = [
	'Tenant management',
	'Lease tracking',
	'Maintenance requests',
	'Rent collection & payment tracking',
	'Analytics & reporting',
	'Document management',
	'Team member access',
	'Email & chat support',
]
```

- [ ] **Step 3: Update the feature list render in the JSX**

In the tier card JSX (around line 110–118), change `allFeatures` to `tier.features`:

Old:
```tsx
<ul className="flex flex-col gap-y-3">
	{allFeatures.map((feature) => (
		<li key={feature} className="flex items-start gap-x-3">
			<CheckIcon className="mt-0.5 size-5 shrink-0 text-rose-600" />
			<span className="text-sm text-gray-600">{feature}</span>
		</li>
	))}
</ul>
```

New:
```tsx
<ul className="flex flex-col gap-y-3">
	{tier.features.map((feature) => (
		<li key={feature} className="flex items-start gap-x-3">
			<CheckIcon className="mt-0.5 size-5 shrink-0 text-rose-600" />
			<span className="text-sm text-gray-600">{feature}</span>
		</li>
	))}
</ul>
```

- [ ] **Step 4: Verify TypeScript compiles without errors**

```bash
cd apps/website && yarn types:check
```

Expected: no type errors

- [ ] **Step 5: Commit**

```bash
git add apps/website/app/modules/pricing/index.tsx
git commit -m "feat: update pricing tiers to new Free/Starter/Growth structure"
```

---

### Task 2: Update FAQ answers in pricing module

**Files:**
- Modify: `apps/website/app/modules/pricing/index.tsx` — `faqs` array

The FAQ answers reference specific old prices (GH₵ 70, GH₵ 200). Update them to match the new structure.

- [ ] **Step 1: Replace the `faqs` const**

Replace the existing `faqs` array with:

```tsx
const faqs = [
	{
		question: 'Do I need to choose a pricing plan?',
		answer:
			'No. There is nothing to select. You simply create an account, add your properties and units, and Rentloop automatically applies the correct billing rate based on your total unit count. As your portfolio grows or shrinks, your rate updates at the start of the next billing cycle.',
	},
	{
		question: 'How does billing work?',
		answer:
			'You pay a flat monthly fee based on your total unit count. Your first 3 units are completely free. From 4 to 50 units you move to the Starter plan (GHS 199–499/month), and from 51 to 150 units you move to the Growth plan (GHS 500–1,299/month). Your plan updates automatically as you add or remove units.',
	},
	{
		question: 'What counts as a unit?',
		answer:
			'Each individually rentable space counts as one unit — a single apartment, a room, a commercial space, or a standalone house. Common areas and shared facilities do not count.',
	},
	{
		question: 'What happens when I cross a tier threshold?',
		answer:
			'When your unit count crosses into a new plan range (e.g. from 3 to 4 units, or from 50 to 51 units), the new monthly rate applies from the next billing cycle. You do not pay two different rates within a single cycle.',
	},
	{
		question: 'Is there a long-term contract?',
		answer:
			'No. Rentloop is month-to-month. You can cancel anytime and you will not be charged after your current billing period ends.',
	},
	{
		question: 'What payment methods do you accept?',
		answer:
			'We accept mobile money (MTN, Vodafone, AirtelTigo), bank transfer, and card payments. Invoices are issued monthly.',
	},
]
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/website && yarn types:check
```

Expected: no type errors

- [ ] **Step 3: Commit**

```bash
git add apps/website/app/modules/pricing/index.tsx
git commit -m "feat: update billing FAQ to reference new pricing ranges"
```

---

### Task 3: Update route meta description

**Files:**
- Modify: `apps/website/app/routes/pricing.tsx:14-16`

- [ ] **Step 1: Update the meta description**

Old:
```tsx
description:
	'Simple, transparent pricing for property managers. Start free with up to 5 units. Scale as you grow with flat monthly plans from GH₵ 70/month.',
```

New:
```tsx
description:
	'Simple, transparent pricing for property managers. Start free with up to 3 units. Scale as you grow with flat monthly plans from GHS 199/month.',
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/app/routes/pricing.tsx
git commit -m "feat: update pricing page meta description for new pricing"
```

---

### Task 4: Update billing table in understanding-asset-management blog post

**Files:**
- Modify: `apps/website/app/content/blog/understanding-asset-management.mdx:92-102`

- [ ] **Step 1: Update the billing table and surrounding text**

Replace the billing table and the paragraph below it (lines 92–102):

Old:
```markdown
| Scenario                               | Properties | Blocks   | Units | Monthly Cost |
| -------------------------------------- | ---------- | -------- | ----- | ------------ |
| Landlord renting out a single house    | 1          | 1 (auto) | 1     | Free         |
| 4 houses in different locations        | 4          | 4 (auto) | 4     | Free         |
| Small apartment block with 8 units     | 1          | 1        | 8     | GH₵ 70       |
| Two apartment complexes, 30 units each | 2          | 4        | 60    | GH₵ 200      |
| Large hostel with 120 rooms            | 1          | 6        | 120   | GH₵ 200      |

Your first 5 units are free. From 6 to 50 units, it's a flat GH₵ 70/month. From 51 to 150 units, it's a flat GH₵ 200/month. For portfolios above 150 units, reach out for a custom plan.
```

New:
```markdown
| Scenario                               | Properties | Blocks   | Units | Monthly Cost      |
| -------------------------------------- | ---------- | -------- | ----- | ----------------- |
| Landlord renting out a single house    | 1          | 1 (auto) | 1     | Free              |
| 3 houses in different locations        | 3          | 3 (auto) | 3     | Free              |
| Small apartment block with 8 units     | 1          | 1        | 8     | GHS 199 – 499     |
| Two apartment complexes, 30 units each | 2          | 4        | 60    | GHS 500 – 1,299   |
| Large hostel with 120 rooms            | 1          | 6        | 120   | GHS 500 – 1,299   |

Your first 3 units are free. From 4 to 50 units, you're on the Starter plan (GHS 199–499/month). From 51 to 150 units, you move to the Growth plan (GHS 500–1,299/month). For portfolios above 150 units, reach out for a custom Enterprise plan.
```

- [ ] **Step 2: Update the "Individual Landlord" real-world example**

The example says Kofi has 3 houses (under 5 units so free). It's still valid under the new plan (3 units = Free). Update only the free threshold reference at line 108:

Old:
```markdown
paying nothing since his total is under 5 units.
```

New:
```markdown
paying nothing since his total is 3 units or fewer.
```

- [ ] **Step 3: Update the "Apartment Complex Owner" example**

Old:
```markdown
Her 30 total units fall in the 6–50 range, so she pays a flat GH₵ 70/month.
```

New:
```markdown
Her 30 total units fall in the 4–50 Starter range, so she pays GHS 199–499/month.
```

- [ ] **Step 4: Update the "University Hostel" example**

Old:
```markdown
At 150 units total, the portfolio falls in the 51–150 range, so they pay a flat GH₵ 200/month.
```

New:
```markdown
At 150 units total, the portfolio falls in the 51–150 Growth range, so they pay GHS 500–1,299/month.
```

- [ ] **Step 5: Update the footer call-to-action line**

Old:
```markdown
[Create your account](https://pm.rentloopapp.com/apply) and start building your portfolio today. The first 5 units are free, forever.
```

New:
```markdown
[Create your account](https://pm.rentloopapp.com/apply) and start building your portfolio today. The first 3 units are free, forever.
```

- [ ] **Step 6: Commit**

```bash
git add apps/website/app/content/blog/understanding-asset-management.mdx
git commit -m "feat: update asset management blog billing table and examples for new pricing"
```

---

### Task 5: Update pricing blurb in what-is-rentloop blog post

**Files:**
- Modify: `apps/website/app/content/blog/what-is-rentloop.mdx`

- [ ] **Step 1: Update the unit count in "Who is Rentloop for?" section**

Old (line 22):
```markdown
Whether you have 2 units or 200, Rentloop scales with you. The first 5 units are completely free — no credit card required.
```

New:
```markdown
Whether you have 2 units or 200, Rentloop scales with you. The first 3 units are completely free — no credit card required.
```

- [ ] **Step 2: Update the "Getting Started" pricing summary**

Old (line 112):
```markdown
**The first 5 units are free — forever.** As your portfolio grows, pricing moves to flat monthly plans — GH₵ 70/month for up to 50 units, GH₵ 200/month for up to 150 units. No contracts, no surprises.
```

New:
```markdown
**The first 3 units are free — forever.** As your portfolio grows, pricing moves to flat monthly plans — GHS 199–499/month for up to 50 units, GHS 500–1,299/month for up to 150 units. No contracts, no surprises.
```

- [ ] **Step 3: Commit**

```bash
git add apps/website/app/content/blog/what-is-rentloop.mdx
git commit -m "feat: update what-is-rentloop blog pricing references"
```

---

## Self-Review

**Spec coverage:**
- Free plan: 1–3 units, limited features → Task 1 (tier data + free-only feature list)
- Starter: 4–50 units, GHS 199–499/month → Tasks 1, 2, 3, 4, 5
- Growth: 51–150 units, GHS 500–1,299/month → Tasks 1, 2, 3, 4, 5
- Enterprise: 150+, custom → unchanged (already correct in pricing module)
- Blogs that calculate pricing → Tasks 4, 5

**All tasks covered. No placeholders. No type inconsistencies.**
