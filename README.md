# Playoff Pocket Guide

Responsive baseball guide for desktops, tablets and phones. Uses plain browser JavaScript and CSS, a small Worker for live public feeds, and no build dependencies.

## Run locally

`npm run dev` serves http://127.0.0.1:4173. `npm test` checks game selection, unannounced start times, broadcasts and proxy boundaries. `npm run build` packages Sites output in dist.

## Updates between rounds

The guide queries each Chicago team's schedule and the full MLB postseason schedule. Opponents and opponent roster selectors derive from the next game, with the latest game as fallback. No qualification or opponent is hard-coded. Final results remain in the guide when no next game is scheduled.

`public/editorial.json` contains the notice and optional broadcast corrections keyed by MLB gamePk. A correction uses `{ "label": "Confirmed network", "source": "https://official-source.example/listing" }`. Only enter verified listings. The UI renders unknown values as pending. Active rosters are explicitly not postseason rosters.

## Data

MLB StatsAPI supplies schedules, game feeds and active rosters. MLB team RSS supplies headlines. Open-Meteo supplies daily forecasts for confirmed venue coordinates, within its forecast range. Worker paths are allowlisted and have bounded timeouts. Feed errors are distinct from an empty successful response. Last-loaded schedules may be retained locally and their age is displayed if refreshing fails. API responses are not stored offline as fresh data.

Matchup statistics are a future enhancement. Social accounts are links, not embedded feeds. The home-screen manifest is included; no offline claim is made.

## Publishing

Sites metadata lives in .openai/hosting.json. Build output is dist/client plus dist/server/index.js. Custom domain baseball.pkt.guide is reserved for a later user-managed DNS step; do not invent CNAME or TXT values.

## Artwork

Suzy illustration and original pocket art were supplied by the user. The baseball icon is derived using the built-in image generation tool. See ASSETS.md for origin and prompt.
