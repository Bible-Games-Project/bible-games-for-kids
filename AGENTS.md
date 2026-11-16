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
- Coloring is free finger painting (`MarkerBoard.tsx`) on every page with
  `src/assets/coloring-marker/<slug>-lines.webp` (896x1152, dark brown lines on
  transparent), with no levels. Each stroke is locked to the closed shape it
  started in until the finger or mouse button is lifted (the maintainer's
  rule; it used to last until a colour or size change). Every story has one (feeding-5000 since Nov 2026,
  drawn from its old painting). To add one, also create an empty
  coloring-marker/<slug>-lines.webp first: story-assets.cjs only rewrites it
  when it exists. The drawing was made with
  gpt-image-2 (images/edits from the story painting, "children's coloring
  book page, bold closed outlines"), then thickened (blur 1.6 + steep alpha
  levels); scripts/story-assets.cjs rebuilds it from scripts/coloring-art/<slug>.png.
- Cut-out shapes (Nov 2026, the maintainer's choice over round crops): the
  things marked in story-items.ts are cut out of each painting by
  scripts/make-shapes.cjs (imgly ISNet on the CPU; setup in its header) into
  src/assets/shapes/<slug>/, loaded by src/lib/story-shapes.ts. Drag & Drop
  drops them onto their dark silhouette and the Seek & Find list shows them.
  A level with too few clean cuts keeps round pieces. Cutting all 50 takes
  ~2 h (2 things per process: the model leaks memory, the container has
  1.2 GB); bad cuts (hair-only heads, clouds, scenery) are only caught by eye
  on a contact sheet, so add them to SKIP. After repainting a story or moving
  its items, re-run `cut` and `save` for it.
- Long jobs: the maintainer can't see background work and has stopped the
  session thinking it was hung (that wipes /tmp and uncommitted work). Say
  how long it will take, post a short "% done" every ~10 minutes, keep
  outputs under ~ and commit in chunks.
- `bun run build` ends with a prerender error here (dist/server/server.js
  not found); that is local only. The check is three "✓ built in" lines.
- Player-coloured painted panels: add `paint-tint` plus
  `--paint-tint: PLAYER_TINT[color]` (SVG duotone filters in Token.tsx).
- Background music is broken on the Cloudflare site: `src/assets/music/*.asset.json`
  point to Lovable's `/__l5e/` file host, which only exists on Lovable.
- All 50 story paintings are in the new gouache storybook style (feeding-5000 since Nov 2026; red-sea is
  the maintainer's own Moses painting, not generated). The maintainer wants a
  flat, grainy, hand-made look like the reference — not Disney/Pixar, not
  glossy AI art; small dot eyes, few gradients. To save money,
  paintings use gpt-image-2 quality "medium" with scripts/style-reference.jpg
  (the maintainer's own reference image — the style every painting must match)
  as the style reference plus the old painting for content only (the
  maintainer rejects objects floating in the air, cut-off limbs and blood, so
  say so in every prompt), and the
  coloring-book drawings use quality "low" (about 1 cent, and
  they line up with the painting better than "high" did; check by overlaying,
  since coloring takes its colors from the painting under each area). Each new
  painting hides about nine small story objects, marked in story-items.ts for
  Seek & Find and Drag & Drop. After replacing a puzzle-<slug>.jpg, update
  its story-items.ts line and Guess Who traits by hand, put a gpt-image-2
  coloring-book drawing of it in scripts/coloring-art/<slug>.png, then run
  `NODE_PATH=~/imgtools/node_modules node scripts/story-assets.cjs <slug>...`
  (thumbs, Drag & Drop pieces, portraits, coloring pages).
- Wide screens (since Nov 2026): the maintainer wants every game to use the
  whole screen on a computer or a sideways tablet, with phones unchanged.
  The `wide:` Tailwind variant (styles.css) and `useWideScreen()` in
  `src/lib/use-fit.ts` share one test (min-width 900px, landscape). The pattern:
  controls in a ~20rem side column, the board in a second grid column sized by
  height (`w-[min(calc(100vw-27rem),calc((100dvh-Xrem)*W/H))]`); card grids
  use `useElementSize` + `fitGrid` to pick the columns that fit without
  scrolling. Only phones (landscape height < 600px) get the rotate hint.
- Checking layouts without a browser: `~/browser/shot.sh out.png W H "?screen=<id>" [clicks/wait:ms/eval:js]`
  (headless Chromium; needs its FONTCONFIG settings or text is blank). `?screen=`
  opens a game directly in dev only. Run at most two at once or navigation times out.
  `bun run build` wipes the browser libs in /tmp: run `~/browser/restore.sh` first.
- Player-count menus use `PlayerChoice` (Token.tsx): small painted boxes of
  coloured pawns. Choice 0 means one child against the computer (seat 1,
  `PlayerPawn color="robot"`, the maintainer's robot pawn; its colour is black:
  `PAWN_HEX.robot`, `PLAYER_TINT.robot`); texts are
  `dom.vsComputer`, `vs.yourTurn`/`vs.computerTurn`, `dom.youWin`/`dom.computerWins`.
  Domino, Goose, Parchís, Memory and Guess Who all have it; the computer
  plays from a `useEffect` on the turn state, and human moves are refused
  while it plays.
