<!-- BGP-ADMIN:BEGIN -->
<!-- Managed by bgp-admin (templates/agent-docs). Edits inside this block are overwritten on the next sync. Add project-specific notes below the END marker. -->

# AGENTS.md

Instructions for AI coding agents working on this repository.

This repo is a **web game**. It is published as an iOS/Android app by a separate
control plane called **bgp-admin** — see "Native boundary" below, it is the rule
that matters most here.

Read also:

- [docs/agents/working-style.md](./docs/agents/working-style.md) — how the maintainer likes to work

## Native boundary

bgp-admin owns everything native. It generates the Capacitor setup, the signing
config and the release workflows from outside this repo, without modifying it.

**Never add or edit any of the following here:**

- `capacitor.config.*`, `ios/`, `android/`
- Capacitor or native plugin dependencies in `package.json`
- `.github/workflows/deploy*.yml`, `.github/workflows/preview-deploy.yml`
- Build config (`vite.config.*`, router config, base paths) changed *for the sake
  of the mobile build*

If something only breaks inside the app shell — blank screen in the WebView,
asset paths, deep links, splash screen, versioning, signing — the fix belongs in
bgp-admin, not here. Say so instead of patching around it. A local fix will be
silently overwritten on the next sync and will hide the real bug.

Normal web work (game logic, UI, assets, web build config for web reasons) is
entirely yours.

## Language

Everything you write into the repository MUST be in English:

- Source code (variables, functions, classes, file names)
- Comments of any kind
- Documentation, README files, guides
- Commit messages, branch names, PR and issue titles and descriptions
- Log messages and error messages
- Tests (descriptions, assertions, fixtures)
- Comments inside config files (YAML, JSON, TOML)
- Database schemas and API route names

Only end-user-facing content may be localized: UI strings in i18n files, store
listings, and marketing copy.

The maintainer communicates in Spanish. You may reply in Spanish in
conversation, but anything committed to the repository stays in English.

## Keeping this file current

At the end of a working session, update `AGENTS.md` with everything important
you learned that day. Worth recording:

- Conventions and patterns of this codebase that were not obvious up front
- Commands that actually work (build, test, lint, run) and their gotchas
- Decisions the maintainer made, and the reasoning behind them
- Traps you fell into, so the next agent does not repeat them

Do not record what the code already says, one-off details of a single task, or a
changelog of what you did. This file is for what the next agent needs to know
before starting, nothing else. Keep it edited down — replace stale entries
instead of appending to them.

Write project-specific notes **below the `BGP-ADMIN:END` marker**. Anything
inside the managed block is shared across all game repos and gets overwritten on
the next sync; if a rule you are adding applies to every game, it belongs in
bgp-admin at `templates/agent-docs/`, so ask before adding it.

<!-- BGP-ADMIN:END -->

<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project notes

- Visual style (since Nov 2026, "Bibledoo"): warm textured gouache paintings,
  seen from above. The palette lives in `.theme-bedtime` / `:root` in
  `src/styles.css` (deep brown text, parchment boxes, teal main buttons, gold
  highlights); avoid hard-coding other colours in components. Fonts: Baloo 2
  for headings, Nunito for body (Google Fonts link in `__root.tsx`).
- Home game cards use 4:5 crops (512x640) of each game's painting, so the
  card and the game's background match.
- The container has no Python, ImageMagick or curl. For image work, install
  `sharp` in a scratch folder outside the repo (`npm i sharp` in /tmp) and use
  `bun` for HTTP calls (it honours the egress proxy; plain `node` fetch doesn't).
- Coloring has a marker mode on trial (`MarkerBoard.tsx`): free finger
  painting where each stroke is clipped to the closed shape it started in.
  It is used on Easy for any page with `src/assets/coloring-marker/<slug>-lines.webp`
  (896x1152, dark brown lines on transparent); other pages and levels stay
  paint by numbers. The drawing was made with gpt-image-2 (images/edits from
  the story painting, "children's coloring book page, bold closed outlines"),
  then thickened (blur 1.6 + steep alpha levels); scripts/story-assets.cjs rebuilds it from scripts/coloring-art/<slug>.png.
- Story paintings are moving to a new gouache storybook style, in batches of
  10 (done: noahs-ark, david-goliath, nativity, good-shepherd, jonah-fish,
  blessing-children, walking-water, calming-storm, good-samaritan, creation,
  moses-basket, david-shepherd, burning-bush, rainbow-promise, tower-babel;
  red-sea waits for the maintainer's own Moses painting). To save money,
  paintings use gpt-image-2 quality "medium" with scripts/style-reference.jpg
  (the maintainer's own reference image — the style every painting must match)
  as the style reference plus the old painting for content only, and the
  coloring-book drawings use quality "low" (about 1 cent, and
  they line up with the painting better than "high" did; check by overlaying,
  since coloring takes its colors from the painting under each area). Each new
  painting hides about nine small story objects, marked in story-items.ts for
  Seek & Find and Drag & Drop. After replacing a puzzle-<slug>.jpg, update
  its story-items.ts line and Guess Who traits by hand, put a gpt-image-2
  coloring-book drawing of it in scripts/coloring-art/<slug>.png, then run
  `NODE_PATH=~/imgtools/node_modules node scripts/story-assets.cjs <slug>...`
  (thumbs, Drag & Drop pieces, portraits, coloring pages).
