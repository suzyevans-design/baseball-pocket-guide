---
name: Playoff Pocket Guide
description: A warm, compact Chicago baseball program for both sides of the city.
colors:
  paper: "#f6f2e8"
  white: "#fffdf7"
  ink: "#193746"
  muted: "#586465"
  line: "#d8d3c6"
  red: "#a04432"
  blue: "#194e7a"
  sox: "#343b3d"
  pale: "#e9ede9"
  note: "#efeee3"
  focus: "#b15b20"
typography:
  display:
    fontFamily: "GuideSerif, Georgia, serif"
    fontSize: "clamp(42px, 5vw, 64px)"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-.035em"
  headline:
    fontFamily: "GuideSerif, Georgia, serif"
    fontSize: "30px"
    fontWeight: 500
    lineHeight: 1.12
  title:
    fontFamily: "GuideSerif, Georgia, serif"
    fontSize: "23px"
    fontWeight: 500
    lineHeight: 1.12
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "17px"
    lineHeight: 1.5
  navigation:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "15px"
rounded:
  field: "6px"
  note: "10px"
  guide: "14px"
  pill: "20px"
spacing:
  compact: "8px"
  small: "12px"
  medium: "16px"
  section: "20px"
  roomy: "24px"
  panel: "30px"
  column: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "white"
    rounded: "{rounded.field}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.blue}"
  button-text:
    textColor: "{colors.blue}"
    padding: "8px 4px"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "8px 12px"
  note:
    backgroundColor: "{colors.note}"
    rounded: "{rounded.note}"
    padding: "22px"
  status:
    backgroundColor: "{colors.pale}"
    textColor: "#385047"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System: Playoff Pocket Guide

## Overview

**Creative North Star: "The Vintage Baseball Program"**

Warm ivory paper, dark printed ink, rust-colored italic headlines, and the supplied baseball-player illustration make this feel like a program kept close at the ballpark. The denim baseball pocket icon anchors the identity. This is a code-led first implementation of the supplied direction, without an approved visual comp.

The guide pairs expressive serif headings with plain sans-serif controls and data. Compact means easy to consult across computers, tablets, and phones, including for older readers. Cubs and White Sox receive the same space and the same navigation.

**Key Characteristics:**

- Warm paper and dark ink with restrained rust accents.
- Serif editorial headings, sans-serif controls, and tabular numeric data.
- Equal team selectors and a persistent six-section guide.
- Supplied baseball artwork and denim pocket identity.
- Flat surfaces, fine rules, explicit controls, and an optional larger-text mode.

## Colors

The palette combines aged-paper neutrals with rust print and team-sensitive link color. The frontmatter preserves the actual source values.

### Primary

Rust red emphasizes the italic display title and selected guide tab. Ink supplies the principal text and filled button surface.

### Secondary

Cubs blue and Sox charcoal supply the active team's links and selected team underline. The runtime accent follows the selected team; button hover and text-button tokens shown in frontmatter describe the default Cubs state.

### Neutral

Paper surrounds the warmer white guide surface. Muted gray-green carries supporting copy. Fine warm-gray rules separate sections; pale green-gray marks ordinary status, and the warmer note surface groups series context. The burnt-orange focus color is reserved for keyboard focus.

**The Equal Billing Rule.** Team choice changes the accent and content, never the selector width or navigation structure.

## Typography

Source Serif 4 is locally served under the CSS family name GuideSerif, with Georgia and serif fallbacks. Regular and italic font files use font-display swap. Arial, Helvetica, and sans-serif supply body copy, controls, and tables.

The display title uses a medium serif with a normal-weight rust italic phrase. Main headings and subheadings use the serif hierarchy in frontmatter. Data stays sans-serif: score names are bold, large scores are visually distinct, and tables use tabular numerals. Base body text is 17px; actual supporting copy varies by component. Do not treat the smallest incumbent metadata sizes as a target for new reading content.

The larger-text toggle persists its setting, raises the root size to 20px, and explicitly enlarges navigation, table data, game details, status, timezone controls, and supporting content. It is a targeted style mode; many source dimensions remain fixed rather than scaling uniformly.

**The Reading Roles Rule.** Use the serif for editorial headings and date emphasis; keep controls and statistical data in the sans-serif.

## Layout

The centered page is capped at 1120px with 32px side gutters. At 1400px and wider, its cap is 1180px with 50px gutters. The masthead, illustration introduction, guide, bookmark help, and footer share this alignment.

The desktop introduction uses a flexible text column and 360px illustration column; the illustration is contained at 330px height. The game panel uses a 1.55:1 two-column grid with a 32px gap. The guide panel has 30px horizontal padding. Fine rules and consistent row padding organize information without a card around every item.

At 800px and below, outer gutters become 18px, guide padding becomes 20px, and the illustration column becomes 240px. Schedule rows become two columns with broadcast details under the matchup.

At 560px and below, gutters become 14px, guide padding becomes 16px, and the game layout becomes one column. All six tabs remain visible in a three-column, two-row grid. The team selector retains two equal columns. The introduction retains text beside the smaller illustration with a feathered left edge. The time tools wrap, with team context occupying its own row. Postseason stages become a two-by-two grid, and the player search takes a full row.

The inning table has a 440px minimum width, a focusable horizontal-scroll region, a mobile scroll hint, and an aggregate score above it. The roster table uses a 460px minimum width on phones. Retain horizontal overflow for structured data rather than shrinking numeric columns.

Print styling removes navigation and decorative page areas, prints the current panel, and adds a simple guide title.

## Elevation & Depth

The system uses no box shadows. Depth comes from paper tones, a fine guide border, warm inset notes, and separators. The guide has a short reveal animation only when the user has not requested reduced motion; team and tab colors transition under the same condition.

## Shapes

Guide corners are gently rounded, fields and filled links are smaller rounded rectangles, and context notes sit between those scales. The phone guide uses 10px corners. Team monograms sit in circular outlines; status labels use rounded pill forms. Borders are generally one pixel, while selected team and tab underlines are four and three pixels respectively.

## Components

### Buttons and links

Filled external-action links use ink with white text, 44px minimum height, and a team-accent hover. Text actions have no filled container, 44px minimum height, and rust underlined hover. Quiet masthead controls follow the same unfilled language. Refresh disables while loading, changes to “Checking…”, and uses a wait cursor and reduced opacity.

All focusable controls receive a three-pixel burnt-orange focus outline with a four-pixel offset. Ordinary links remain underlined, with thicker underline on hover. External-link indicators are inline SVG.

### Fields

Search uses a visible label or accessible name, warm-white background, gray-green border, small rounded corners, and a 44px minimum height. Roster selects use the same height; the compact timezone select uses 40px. Preserve the select's accessible name even when its visible label is suppressed on phones.

### Team selection and navigation

The equal-width team controls are actual buttons in a labeled group with aria-pressed states. Their selected state uses a surface change and a team-color underline. The desktop “Selected” marker is hidden at narrower widths, while the underline and programmatic state remain.

Section buttons use tab semantics, aria-selected, roving tabindex, and a linked tabpanel. Left/right arrows cycle sections; Home and End reach the first and last tabs. Selection adds rust text, bold weight, and an underline. On phones the tabs wrap into two rows without horizontal scrolling.

### Guide and context notes

The warm-white guide is the main container, with a fine border and rounded corners. Notes use a subtly darker paper tone, serif headings, short explanatory copy, and text actions. Context is displayed beside the game on desktop and below it on phones.

### Status and data

Status pills carry explicit words such as Scheduled or Live. Live uses a warmer background and darker rust text. Feed messages use a live status region and show the last update time or retrieval problem. Empty states distinguish an unannounced detail from an unavailable feed.

Scoreboards pair team names with logos, align scores to the right, and use a serif game date. Inning totals are emphasized with a pale fill. Tables preserve column headings, row headings where applicable, and tabular numeric alignment.

## Do's and Don'ts

### Do:

- Do preserve equal team widths and identical section navigation.
- Do retain the supplied baseball-player artwork and denim pocket identity.
- Do pair serif editorial headings with sans-serif controls and statistics.
- Do preserve visible focus, labeled controls, tab keyboard behavior, and larger-text support.
- Do show all six tabs on phones and let wide data tables scroll.
- Do communicate pending information and feed failures in explicit text.

### Don't:

- Don't introduce shadows where paper tone and fine rules already establish grouping.
- Don't make team selection depend on color alone.
- Don't shrink statistical tables to force every column into a phone viewport.
- Don't replace user artwork with generic baseball decoration.
- Don't treat the smallest existing metadata text as a default for new reading content.

