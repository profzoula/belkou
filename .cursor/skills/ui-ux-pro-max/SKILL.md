---
name: ui-ux-pro-max
description: Execute proactive UI/UX polish sweeps across related pages after any visual change. Use when the user asks to improve design, spacing, navbar overlap, visual consistency, polish, or "make it clean/professional".
---

# UI UX Pro Max

## Mission

Deliver production-level visual polish, not isolated one-off fixes.

When a request touches UI, layout, spacing, typography, cards, hero sections, navbar overlap, or visual quality, treat it as a related-surface task and clean all affected pages in one pass.

## Required Workflow

1. Identify the primary target area the user requested.
2. Find all related pages/components that share the same pattern (hero spacing, top padding, card style, CTA shape, section rhythm, etc.).
3. Apply fixes to the target and related surfaces in the same run.
4. Validate consistency across breakpoints (mobile/tablet/desktop).
5. Run lints on edited files and fix issues introduced by the changes.
6. Report what was fixed globally, not only the first file.

## Proactive Sweep Rules

- Do not stop at a single-page patch when shared UI primitives are involved.
- If navbar/content overlap appears in one page, check every page that uses the same top-spacing pattern.
- If a hero component is changed, verify neighboring sections so spacing rhythm remains coherent.
- If a card/button style is updated, ensure matching components are aligned visually across marketing pages.
- Prefer shared tokens/utilities (global spacing vars, shared classes) over repeated local overrides.

## Quality Bar

- Spacing feels intentional and consistent.
- No text touching navbar or fixed headers.
- CTA hierarchy is clear and balanced.
- Mobile touch targets remain accessible.
- No visual regressions on related pages.

## Deliverable Format

In the final response:

- State the main fix.
- List related surfaces also polished proactively.
- Mention validation done (lint/typecheck or equivalent checks run).
- Call out anything left intentionally unchanged.
