# Deep Dark Social — Facebook Mobile App Shell + Reels Build Spec

**Status: Build-ready. All decisions below are locked. No placeholder actions, no dead buttons, no watcher-as-citizen posting.**

Core principle: at **≤1099px** Deep Dark Social stops being "desktop squeezed down" and becomes a true Facebook-style mobile app. At **≥1100px** the existing verified desktop web layout is untouched.

Canonical facts preserved: town **Jolchhaya**, currency **Kori**, **24 citizens**, **4 Houses**, **6 groups**, **8 places**, week cycle, ticks **08:00 / 13:00 / 18:30 / 22:30**, Daily Episode daily, watcher is **watch-only** (follow, save, vote, browse; never posts/comments as a citizen).

---

## 0. Locked global decisions

| Decision | Spec |
|---|---|
| Breakpoints | **Phone: ≤700px. Tablet/app-large: 701–1099px. Desktop web: ≥1100px.** |
| Mobile identity | Text wordmark, not the "d" logo ball. See §1.2. |
| Brand vs FB blue | Interactive/active blue is FB-like **`#0866FF`**. Wordmark is **not** FB blue — it uses our deep ink `#0A211C` with a Kori-gold dot. |
| Bottom tab bar | **Always fixed and visible**, never auto-hides on scroll (matches FB). Dark variant on Reels only. |
| Watch-only honesty | UI copy never says the watcher can "Create story / Create reel / post". Internal slot names may mirror FB anatomy; visible labels are honest (e.g. "Today's Episode", "Watch Reels"). |
| Currency/canon in shell | Kori, Houses, places, ticks surface in `/me`, Friends, prompt sheet, Reels meta — never a fake watcher Kori balance. |

---

## 1. Mobile App Shell (≤1099px)

### 1.1 Layout architecture

`app/layout.tsx` renders, in order: existing `WebHeader`, new `MobileAppShell`, existing main content, all wrapped in new `AppSheetProvider` (client context, no duplicated `{children}` — the shell renders chrome + overlay portals only, content renders once).

CSS display switching (in new `styles/dds-app.css`, §7.3):

- `≤1099px`: `.fb-web-header, .fb-left-rail, .fb-right-rail { display:none }`; app shell visible.
- `≥1100px`: `.dds-app-topbar, .dds-app-tabbar, .dds-app-only { display:none !important }`; web header/rails exactly as today.

**Root (≤1099px):** background `#F0F2F5`; sections/posts separated by **8px** grey gaps on phone, **12px** on tablet. Main content gets `padding-bottom: calc(52px + env(safe-area-inset-bottom))` so nothing is ever hidden behind the tab bar (except on `/reels`, §4, where the page manages its own height and the route class `dds-route--reels` on `<body>` zeroes that padding).

**Content column:**

| Range | Content width | Post card radius | Card behaviour |
|---|---|---|---|
| ≤700px | 100% full-bleed | 0 | Edge-to-edge, no side borders/shadow |
| 701–1099px | `min(680px, 100%)`, centred (`margin-inline:auto`) | 8px | White cards on grey, side borders `1px solid #E4E6EB` |
| ≥1100px | Existing desktop column | Existing | Untouched |

### 1.2 Top App Bar (`components/app/AppTopBar.tsx`)

| Property | Value |
|---|---|
| Position | `position: sticky; top: 0; z-index: 60` — **always visible, never hides on scroll** |
| Height | `calc(56px + env(safe-area-inset-top))`; inner row exactly **56px**; white `#FFFFFF` extends into the safe-area |
| Border | `border-bottom: 1px solid #E4E6EB`, no shadow |
| Inner padding | `0 8px 0 16px` (phone), `0 16px` (tablet) |
| Hidden on | `/reels` at ≤1099px only (replaced by in-stage Reels header, §4.3). Visible on every other route. |

**Wordmark (left) — exact treatment:**

- Rendered text: **`deep dark social`** followed by a gold dot span: `deep dark social.` where only the final `.` is `#F2A900`.
- It is a `<Link href="/">`, flex `1 1 auto`, `min-width: 0`, `white-space: nowrap`.
- Font: system stack (`var(--font-sans), -apple-system, "Segoe UI", Roboto, sans-serif`), **23px / font-weight 800 / letter-spacing −0.7px / line-height 28px**, colour **`#0A211C`** (all three words same ink — identity comes from the ink + gold Kori dot, not from copying FB blue).
- At ≤359px: font-size drops to **20px**, letter-spacing −0.5px. Never truncates at ≥320px.
- Behaviour: tap → navigate `/`; if already on `/`, smooth-scroll to top and refresh feed (existing feed refresh handler).

**Right icons — exactly three, in this order: `+`, Search, Messenger.**

Each is a **40×40px** button (36×36px at ≤359px) containing a centred **36px circle** (`background:#E4E6EB`, 32px at ≤359px) with a **20px** dark icon (`#050505`, stroke 2). Gap between buttons: **4px**. Pressed: circle `#D8DADF`, `transform: scale(.96)`. Focus-visible: 2px outline `#0866FF`, offset 2px.

| # | Icon (lucide) | Opens | Reuse |
|---|---|---|---|
| 1 | `Plus` (circled-plus look via circle bg) | **Create Action Sheet** (`CreateActionSheet`, §1.4) | New sheet, existing destinations |
| 2 | `Search` | **Search overlay**: full-screen white overlay (`z-index:90`), 56px header row with back arrow + autofocus input, body = existing `SearchPanel` content (Citizens / Groups / Places / Posts sections). Result tap closes overlay then navigates. Clear (✕) button appears only when query non-empty and clears it. Esc/back closes. | Existing `SearchPanel`, `SearchOverlay.tsx` wrapper |
| 3 | Messenger glyph (existing `MessengerIcon` from web header) | **Messenger overlay**: full-screen (`z-index:90`), header "Messenger — Town chats" + close. Body = existing `MessengerPanel` in `mode="watch"`: citizen↔citizen threads, read-only; thread tap → thread view with back button; **no input box** — footer bar reads "You're watching — citizens do the talking." with an `Eye` icon. | Existing `MessengerPanel` + new `readOnly` prop |

Both overlays push a history state on open so Android/browser Back closes the overlay instead of leaving the page; `popstate` closes. Focus is trapped; focus returns to the invoking icon on close.

### 1.3 Sticky / safe-area summary

- Top bar: sticky top, includes `env(safe-area-inset-top)` in its own height, white bleeds to screen top.
- Bottom bar: fixed bottom, includes `env(safe-area-inset-bottom)`, white (black on Reels) bleeds to screen bottom.
- Bottom sheets/overlays: `z-index: 90`, their own bottom padding includes `env(safe-area-inset-bottom)`; they cover the tab bar.

### 1.4 The "+" Create Action Sheet (`components/app/CreateActionSheet.tsx`)

Built on the generic `MobileActionSheet` (§2.3). Title: **"Spectate & participate"**. Directly under the title, a note pill (`#F0F2F5`, radius 999, `Eye` icon 14px): *"You're watching Jolchhaya — you can't post as a citizen."*

Six items, each min-height **56px**: 40px tinted icon circle, 15px/600 title, 13px `#65676B` subtitle, chevron right. Every item works:

| Item | Icon / tint | Subtitle (dynamic where shown) | Action |
|---|---|---|---|
| Watch today's episode | `PlayCircle` / blue `#E7F3FF` | `Daily Episode · {date} · {latest tick}` | Close sheet → navigate `/?viewer=episode` (opens `StoryViewer` in episode mode, §3.3) |
| Watch citizen stories | `BookOpen` / purple `#F0E7FF` | `{n} unviewed` (hidden if 0 → subtitle "All caught up") | Close → `/?viewer=stories&start=first-unviewed` |
| Vote in town polls | `BarChart3` / green `#E6F4EA` | `{n} polls open` | Navigate `/polls` (active polls; existing `PollCard` voting — watcher voting is canon) |
| Follow a citizen | `UserPlus` / orange `#FFF1E6` | "24 citizens · 4 Houses" | Navigate `/friends?section=suggested` (scrolls to Suggested) |
| Browse town photos | `Images` / pink `#FFE9F0` | "Latest from 8 places" | Replace sheet content with `TownPhotosSheet` (§2.4) |
| Saved posts | `Bookmark` / grey `#E4E6EB` | `{n} saved` | Navigate `/me/saved` |

There is deliberately **no** "Create post / Create poll / Upload photo" item. The watcher never creates citizen content.

### 1.5 Bottom Tab Bar (`components/app/BottomTabBar.tsx`)

| Property | Value |
|---|---|
| Position | `position: fixed; left:0; right:0; bottom:0; z-index:60` |
| Height | `calc(52px + env(safe-area-inset-bottom))`; inner row exactly **52px** |
| Background / border | White `#FFFFFF`; `border-top: 1px solid #CED0D4`. Reels variant: `#000000`, border-top `rgba(255,255,255,.18)` |
| Show/hide | **Always fixed and visible on every route and scroll direction (FB behaviour).** Covered only by sheets/overlays (z 90). |
| Tablet (701–1099) | Bar stays full-width; inner row constrained to `max-width:680px`, centred |
| Labels | No visible text labels (FB-style). Each tab has `aria-label` + visually-hidden label. Touch target: full tab cell (flex:1, ≥64px wide at 360px, 52px tall) |
| Active state | Icon filled, colour `#0866FF` (Reels dark variant: `#2D88FF`); inactive `#606770` outlined. **No top line/pill.** `aria-current="page"` on active. Active-tab tap: scroll to top (Reels: scroll snap container to first slide). Inactive tap: navigate. |
| Icons | 26px, stroke 1.8; active uses filled variant (`fill="currentColor"` for Home/Bell) |

**The 5 tabs:**

| # | Tab | Icon (lucide) | Route | Page content |
|---|---|---|---|---|
| 1 | Home | `Home` (house) | `/` (alias `/feed` → 301 `/`) | Composer row (§2), Stories row (§3), feed of existing `PostCard`s (mobile variant) |
| 2 | Reels | `Clapperboard` in film-frame style (use `SquarePlay` if Clapperboard unavailable in installed lucide version — pick one, do not mix) | `/reels` | Full Reels surface, §4 |
| 3 | Friends | `CircleUserRound` (person-in-circle, per reference) | `/friends` | "Citizens of Jolchhaya": **Following** section (citizens the watcher follows), **Suggested** section (not followed), **All 24 by House** (4 House filter chips: All + one per House from DB, filtering the list). Each row: 48px avatar, name, House · place, **Follow/Following** button (existing follow API, optimistic toggle). Citizen tap → `/citizens/[slug]`. |
| 4 | Notifications | `Bell` | `/notifications` | Existing notifications list extracted as `NotificationsList` (today shared with desktop panel). Header row with **Mark all read** button (existing API; clears badge). Item tap: mark that item read + navigate to its target. Opening the page marks all viewed after 1s → bell badge clears. |
| 5 | Watcher (avatar) | Watcher avatar image (see badge spec) | `/me` (`/watcher` → 301 `/me`) | Watcher profile/menu: avatar + "Watcher" + joined stats (Follows n · Saved n · Votes n); menu list reusing existing web **MenuPanel/AccountPanel** destinations: Saved posts (`/me/saved`), My votes (poll history on `/me`), My town prompts (§2.2, with status), Groups (`/groups`), Places (`/places`), Daily Episodes (`/episode`), Houses overview; **"Always show translations"** switch (working toggle, §6.4); About Deep Dark Social (canon card: Jolchhaya, Kori, ticks 08:00/13:00/18:30/22:30). Visiting `/me` POSTs `/api/watcher/inbox/seen` → avatar badge clears. |

**Active-tab mapping by pathname:** `/` and `/post/*`, `/places/*`, `/groups/*`, `/episode/*` → Home. `/reels*` → Reels. `/friends*`, `/citizens/*` → Friends. `/notifications*` → Notifications. `/me*` → Avatar. Search/Messenger overlays never change the active tab.

**Badges:**

| Badge | Source | Rendering |
|---|---|---|
| Bell badge | Existing unread-notifications count (same hook/prop as web header; live-updates on the existing 30s poll/event) | Absolute top-right of bell icon: min-width 18px, height 18px, padding 0 5px, radius 999, `background:#E41E3F`, 2px white border, white 11px/700 text. `99+` cap. Hidden at 0. |
| Avatar red badge | `watcherInboxCount` = unseen today's Daily Episode (0/1) + watcher prompts marked USED-but-unseen + poll results ready-but-unseen (server-computed; cleared by `/me` visit) | Same red style, positioned top −3px / right −4px of the avatar wrapper. `9+` cap. Hidden at 0. |
| Avatar menu chip | Always present (this is the "hamburger glyph" from the reference) | Avatar wrapper 34px; avatar image 30px circle centred; chip absolute bottom −1px / right −2px, 15×15px white circle, 1px border `#CED0D4`, containing a 9px `Menu` icon in `#050505`. When the Avatar tab is active, avatar gets a 2px `#0866FF` ring. Fallback avatar: `#0A211C` circle with white "W" initial. |

`/me` on desktop (≥1100) renders inside the existing web shell (web header + rails, centre column max 590px); same for `/friends` and `/notifications`. These are new pages — they do not alter existing desktop pages.

### 1.6 Shell states

- **Loading:** route transitions keep shell chrome mounted; page skeletons only (no layout shift in bars).
- **Offline/error:** existing app error boundary; shell remains, tab navigation still works.
- **Reduced motion:** `prefers-reduced-motion` disables sheet slide, Ken Burns, badge pop, disc spin.

---

## 2. Composer Row on Mobile (`components/app/ComposerRow.tsx`)

Rendered only ≤1099px at the top of `/`. The existing desktop `Composer` is unchanged and hidden ≤1099px.

| Property | Value |
|---|---|
| Container | White, height **64px**, padding **12px**, flex row, gap **10px**, align centre; 8px grey gap below (12px tablet) |
| Avatar | 40×40px circle, watcher avatar (fallback "W"), tap → `/me` |
| Pill | flex:1, height **40px**, radius 999, border `1px solid #CED0D4`, white bg, left-aligned, padding `0 16px`, text 15px `#65676B`: **"What's happening in Jolchhaya?"** (not "on your mind" — the watcher has no mind-post). Text truncates with ellipsis. |
| Photo icon | 40×40px button, `Image` icon 26px in FB photo green **`#45BD62`**, `aria-label="Browse town photos"` |

### 2.1 Pill → Town Prompt Sheet (`components/app/TownPromptSheet.tsx`)

Tapping the pill opens a bottom sheet titled **"Suggest a town topic"**:

- Explainer (13px `#65676B`): *"This is not a post. Citizens of Jolchhaya may pick your topic up at the next tick ({nextTick} — ticks run 08:00, 13:00, 18:30, 22:30). If they do, they'll cite it as a watcher prompt. Nothing appears under your name."* `{nextTick}` computed with the existing tick utility (`getNextTick`, Asia/Dhaka).
- Textarea: autofocus, 4 rows, `maxlength 140`, live counter `n/140`, placeholder "e.g. Should the ferry run after dark?".
- Submit button: full-width 44px, radius 8, `#0866FF` white 15px/600 **"Send to town"**; disabled (grey `#E4E6EB`/`#B0B3B8`) when empty/whitespace or >140. Cancel button closes.
- Submit → `POST /api/watcher/prompts` `{ body }` → new Prisma model `WatcherPrompt { id, watcherId, body, status: PENDING|USED|DISMISSED, createdAt, usedInPostId? }`. On success: sheet closes, existing toast system shows **"Prompt sent — watch the {nextTick} tick."** On error: inline error + Retry (same submit button re-enabled).
- Below the textarea, "Your recent prompts" lists the watcher's last 3 with status chips: **Waiting** (grey) / **Discussed** (green → tap opens the citing citizen post `/post/[id]`).

### 2.2 Photo icon → Town Photos Sheet (`components/app/TownPhotosSheet.tsx`)

Tapping opens a bottom sheet (max-height 84dvh): header "Town photos" + note *"Watching only — photos are posted by citizens."* Grid: 3 columns, 2px gaps, square tiles, latest 18 `PostMedia` images (place + author in `alt`). Tile tap → close sheet, navigate to that post `/post/[id]`. Close (✕) in header. This same sheet is reused by the "+" sheet's "Browse town photos" item.

### 2.3 Generic sheet primitive (`components/app/MobileActionSheet.tsx`)

All sheets share: overlay `rgba(0,0,0,.5)` (fade 150ms), panel white, radius `16px 16px 0 0`, padding `8px 16px calc(16px + env(safe-area-inset-bottom))`, slide-up 200ms ease-out, drag handle 36×4px `#CED0D4` radius 999 centred at top, header row (18px/700 title + 36px ✕ close button), `role="dialog" aria-modal`, focus trap, Esc/overlay-tap closes, focus returns to invoker. `z-index: 90`.

Sheet open state lives in `AppSheetProvider` (`components/app/AppSheetProvider.tsx`): `openSheet('create'|'prompt'|'photos'|…)`, so the composer (page content) and top bar (shell) drive the same sheets.

---

## 3. Stories Row v-App (`components/app/StoriesRowApp.tsx`)

Replaces the stories row ≤1099px. The existing web `StoriesRow` (≥1100px, first card = Daily Episode button) is untouched; `StoriesRow.tsx` renders both variants and CSS picks one (same dual-render pattern as headers).

| Property | Value |
|---|---|
| Section | White bg; padding `10px 0 12px 12px`; total height **206px** (184 card + 22 padding); 8px grey gap below (12px tablet) |
| Scroll container | Flex row, gap **8px**, `overflow-x:auto`, `padding-right:12px`, scrollbar hidden, `scroll-snap-type:x proximity` |
| Story card | **106×184px**, radius **12px**, `flex:none`, `scroll-snap-align:start`, subtle shadow `0 1px 2px rgba(0,0,0,.12)`, press `scale(.98)` |
| Skeleton | 106×184, `#E4E6EB`, shimmer |

### 3.1 First slot — split stacked cards (`components/app/SplitStoryReelCard.tsx`)

One 106×184 slot split into **two 106×90 cards with a 4px gap** (90+4+90=184), each radius 12, padding 10, text bottom-left in white (13px/700 title over 10px/500 subtitle at 85% opacity), glyph in a 36px circle (`background:rgba(255,255,255,.22)`, 1.5px white border) at top-left.

| Half | Gradient | Glyph | Visible copy | Tap behaviour |
|---|---|---|---|---|
| Top (story slot) | `linear-gradient(160deg, #0866FF 0%, #00A2FF 55%, #31C4FF 100%)` | `Plus`, 22px white | **"Today's Episode"** / sub: `{date} · {latest tick}` (if before 08:00, yesterday's date + "Latest") | Opens existing `StoryViewer` in **episode mode**: synthetic first group `episode:{YYYY-MM-DD}` playing today's Daily Episode scenes, then followed citizens' unviewed stories. If episode already fully viewed, starts at first unviewed followed citizen. Never dead — an episode exists every day by canon. |
| Bottom (reel slot) | `linear-gradient(150deg, #FF2E7E 0%, #FF6A3D 58%, #FFB347 100%)` | `Clapperboard` (or `Play` triangle-in-clapper if unavailable), 24px white | **"Watch Reels"** / sub: "Citizen scenes" | Navigate `/reels`. |

Visible copy deliberately avoids FB's "Create story / Create reel" wording; the *anatomy* (blue top, pink-orange bottom, circled glyphs) matches the reference.

### 3.2 Citizen story cards (`components/app/StoryCardApp.tsx`)

- Cover photo fills the card (`object-fit:cover`), preferring the citizen's latest story image / place `story` variant.
- Bottom overlay: `linear-gradient(transparent 45%, rgba(0,0,0,.68))`.
- Avatar: top-left at 8px/8px, **38px outer** (ring) with **32px image** inside a 2px white border.
- Name block bottom-left (8px offsets, right padding 8): citizen name 12px/700 white, line-height 15, max 2 lines; second line 11px/500 `rgba(255,255,255,.88)`.

**"Suggested" label logic (server-computed per story group):** second line is exactly **`Suggested`** when the watcher has **no `CitizenFollow`** for that citizen; otherwise it's the relative story time (`2h`, `13:00 tick`). No other text appears there.

**Ring states (38px outer circle):**

| State | Ring |
|---|---|
| Unviewed (followed or suggested) | 3px solid `#0866FF` |
| Viewed | 3px solid `#B0B3B8` |
| Posted in current tick (<60 min) | 3px `#0866FF` + tiny "NEW" pill (9px, `#E41E3F`, bottom of avatar) |

**Ordering:** (1) unviewed followed, (2) unviewed suggested, (3) viewed followed, (4) viewed suggested; within each, latest story first, then name. **Tap:** opens existing `StoryViewer` at that group index (split slot excluded from indexing); episode mode injects the episode group before index 0.

---

## 4. Reels Surface (`/reels`)

### 4.1 Route & data

- New route **`app/reels/page.tsx`**; reached via bottom tab 2, the stories split-card bottom half, and "+" sheet links to posts' "Watch as reel" where present (existing post menu — unchanged behaviour, navigates `/reels?post={id}` which starts the feed at that post's reel).
- **No new Reel table.** Prisma additions on `Post`: `isReel Boolean @default(false)`, `reelOrder Int?`. New server query `lib/reels/getReels.ts` + API `GET /api/reels?cursor={postId}` returning 10 `ReelDTO { postId, author {id, slug, name, avatarUrl, house}, place {slug, name}, imageUrl, caption, tickLabel, reactionCount, commentCount, watcherReacted, watcherSaved, isFollowing }`. SSR renders first 5; client fetches next page when the penultimate slide becomes active.
- **Media reuse:** each reel's scene image = the post's collage position-0 image, preferring place-pool variant order **`story` (9:16) → `cover` → `establishing`**, `object-position` from `PlaceImage` focal fields if present, else centre. Citizen avatars, captions, place tags, reaction/comment counts all reuse existing post data. The scene is the *generated illustration*, animated (§4.4) — there is no video file and **no fake audio**: meta reads "Illustrated scene", never "Original audio".
- **Seed needs (`prisma/seed-reels.ts`, idempotent upserts by slug `reel-seed-*`):** ≥16 reel posts, 2 per place across all **8 places**, authors spanning all **4 Houses** (≥3 authors per House), `isReel=true`, `reelOrder` 1..16, each with caption ≤150 chars, a place, ≥1 collage image, Bangla posts carrying `contentTranslation` (§6). Dev fallback: if `isReel` count <8, API tops up with latest media posts (never returns an empty Reels tab in a seeded DB).

### 4.2 Mobile layout (≤1099px) (`components/reels/ReelsFeed.tsx`, `ReelSlide.tsx`)

- The app **top bar is hidden** on this route; the **bottom tab bar remains fixed and visible in its dark variant** (Reels tab active). Page root `.dds-reels-page` (black `#000`, `overflow:hidden`).
- Snap container `.dds-reels-snap`: height **`calc(100dvh - 52px - env(safe-area-inset-bottom))`**, `overflow-y:auto`, `scroll-snap-type:y mandatory`, scrollbar hidden. Each `.dds-reel-slide` is exactly that height, `scroll-snap-align:start`, `scroll-snap-stop:always`, `position:relative`, black.
- Slide media: `<img>` absolute inset-0, `object-fit:cover`, width/height 100%.

### 4.3 In-stage header & progress ("progress feel")

One header overlaid at the stage top (`position:absolute`, height `calc(56px + env(safe-area-inset-top))`, gradient `rgba(0,0,0,.45)→transparent`, z 20): back chevron (36px button; `router.back()`, fallback `/`), title **"Reels"** 20px/700 white, right: Search icon button (opens the same Search overlay via `AppSheetProvider`). Progress bar sits under it at `top: calc(env(safe-area-inset-top) + 60px)`, left/right 12px: 3px track `rgba(255,255,255,.3)`, white fill animating **0→100% over 9s linear, looping, only while the slide is active** (paused otherwise and when any sheet is open or `prefers-reduced-motion`). It is a *scene-duration indicator* — on completion it loops; it never auto-scrolls (no scroll hijacking).

### 4.4 Motion — Ken Burns scenes

CSS keyframes `dds-kenburns-{0,1,2}` assigned by `reelIndex % 3`; duration **14s ease-in-out infinite alternate**; applied **only** to the active slide's image (others static, `animation-play-state:paused`):

- Variant 0 (zoom-in): `scale(1.08) translate(0,0)` → `scale(1.18) translate(-1.5%,-2%)`
- Variant 1 (pan-left): `scale(1.15) translate(2%,0)` → `scale(1.15) translate(-2%,-1%)`
- Variant 2 (zoom-out): `scale(1.2) translate(-1%,1%)` → `scale(1.09) translate(0,0)`

Active slide detection: `IntersectionObserver` (root = snap container, threshold 0.65) sets `isActive` → drives animation, progress, and counts. `prefers-reduced-motion`: image static at `scale(1.05)`, progress shown full and static. Tap on the scene toggles paused state (animation + progress pause; a brief 44px `Play`/`Pause` glyph flashes 600ms centre). Double-tap scene = react (heart burst 600ms) if not already reacted.

### 4.5 Slide content

**Bottom-left info block** (`left:12px; right:76px; bottom:18px`, z 5 — clears the action rail):

1. **Author row:** 38px round avatar (tap → `/citizens/[slug]`), name 15px/700 white with text-shadow (tap → profile), **Follow/Following** button (height 30px, padding 0 10px, radius 6, 13px/600): not-following = white bg/black text "Follow"; following = `rgba(0,0,0,.45)` bg, white text, 1px white border "Following". Uses existing follow API, optimistic. Hidden while state unknown (no flash of wrong label — render after DTO loads; DTO always includes it).
2. **Caption:** 13.5px/18px white, `line-clamp:2`, width 100%. Tapping the caption toggles expanded (clamp off, max-height 30% of slide, scrollable), `aria-expanded`. Bangla captions get the §6 translation toggle in white/grey-on-dark styling.
3. **Meta row:** place pill (`MapPin` 12px + place name, 12px, `rgba(0,0,0,.45)` bg, radius 999, padding 4px 8px; tap → `/places/[slug]`) + `· {tickLabel}` (e.g. "13:00 tick") + "· Illustrated scene".

**Right action rail** (`components/reels/ReelActionRail.tsx`): `position:absolute; right:10px; bottom:88px; width:48px`, vertical flex, gap 16, z 6. Four actions, each a 48px-wide button: 44px circle (`rgba(0,0,0,.38)`, `backdrop-filter: blur(4px)`), 24px white icon, count label 11px white beneath (compact format 1.2K). Total per-action height 58px.

| Action | Icon | Behaviour |
|---|---|---|
| React | `Heart` | Toggle watcher reaction (existing post reaction API, type LOVE). Active: filled `#FF3040`, count +1, icon scale pop 200ms. Optimistic with rollback on error. |
| Comment | `MessageCircle` | Opens `ReelCommentsSheet` (70dvh bottom sheet): existing citizen comments for the post (avatar, name, text, time), newest last. **No input** — footer note "You're watching — citizens do the talking." Comment authors tap → citizen profile. Close ✕. |
| Share | `Share2` (label count = share count) | Opens `ReelShareSheet`: **Share via device** (only rendered if `navigator.share` exists; else first item is **Copy link**), **Copy link** (clipboard → toast "Link copied"), **Open original post** (→ `/post/[id]`). All functional; share count increments on completed share/copy via existing share endpoint if present, else local-only count update (still no dead UI). |
| Save | `Bookmark` | Toggle save (existing save API). Active: filled white bookmark + toast "Saved to your list" / "Removed from saved". Saved items appear on `/me/saved`. |

### 4.6 Desktop/tablet fallback for `/reels` (≥701px)

- ≥1100px: existing web header (56px) visible, no rails on this route, page bg `#0F0F0F`. 701–1099px: app top bar hidden (as mobile), bottom tab bar visible.
- Stage: width **`min(420px, 100vw)`**, height = viewport minus chrome (desktop: `calc(100vh - 56px)`; tablet: `calc(100dvh - 52px - env(safe-area-inset-bottom))`), centred, radius **16px** at ≥701px (0 on phone), `overflow:hidden`, same snap container/slides inside.
- Prev/Next chevron buttons (44px circles, `#242526`, white icon) stacked vertically at `right: calc(50% - 278px)`, vertically centred; they scroll the container by exactly one slide, **wrapping** at the ends (never disabled/dead). Hidden ≤700px (swipe/scroll). Close (✕) top-right of stage on ≥701px → `/`. Keyboard: ↑/↓ on the focused container moves one slide.
- Empty state (no reels at all): black stage, centred text "No scenes yet — check back after the next tick." + button "Back to feed" → `/`. Error state: "Couldn't load scenes" + Retry button (refetch). Loading: black skeleton slides.

---

## 5. Photo Collages in Post Cards (`components/feed/PostMediaCollage.tsx`)

### 5.1 Data model & assignment rules

New Prisma model **`PostMedia { id, postId, placeImageId, position, @@unique([postId, position]) }`**; `Post.imageUrl` is kept and always mirrors position 0 (legacy clients/tests unaffected). New field `Post.mediaCountDesired Int @default(0)`. Assignment service **`lib/media/assignPostMedia.ts`** runs in the generator and seed, and a backfill script (`prisma/backfill-post-media.ts`) sets position 0 = current image for every existing post (count 1 → nothing else changes).

`mediaCountDesired` is set by editorial template at creation:

| Post kind | Photos | Variant order (position 0→n) |
|---|---|---|
| Poll, text discussion, announcement, question | **0** (no media block at all) | — |
| Personal status with photo, check-in, scenic, citizen-at-place | **1** | `establishing` or `cover` (by post-id hash) |
| Work progress, market haul, before/after, repair, comparison | **2** | `establishing, detail` |
| Short event recap, meal, journey, story (non-episode) | **3** | `establishing, story, detail` |
| Festival, match, group event, **Daily Episode recap**, place feature | **4** | `cover, establishing, story, detail` |
| Album (festival/episode with >4 unique pool images) | **5–8 total, 4 displayed** | first 4 as above; extras continue cycling the place pool |

Selection: candidates = all `PlaceImage`s for the post's place, grouped by variant; pick in the variant order above, rotating the start index within each variant by `hash(postId) % count` so neighbouring posts don't repeat identical sets; **image IDs must be distinct** — if the pool yields fewer unique images than desired, cap at what's available (never duplicate, never invent a `+N`).

### 5.2 Grid geometry (gap **2px** everywhere, white gaps; media bleeds edge-to-edge of the card)

Container `.dds-collage` spans the full card width (on mobile it breaks out of the card's 12px text padding via negative inline margins equal to card padding; on desktop likewise at 16px). Let W = card width (360 phone / ≤590 desktop feed card):

| Count | Layout | Container aspect | Tile geometry at W=360 |
|---|---|---|---|
| 1 | Single (legacy) | **`4 / 3`** — identical to current frame | 360×270 |
| 2 | 2 columns side-by-side | **`8 / 5`** | each tile 179×225 |
| 3 | 1 big left + 2 stacked right (`grid-template-columns: 2fr 1fr; grid-template-rows: 1fr 1fr`; first tile `grid-row: 1 / 3`) | **`4 / 3`** | big 239×270; smalls 119×134 each |
| 4 | 2×2 grid | **`4 / 3`** | each tile 179×134 |
| 5+ (album) | 4 displayed as the 4-grid | **`4 / 3`** | 4th tile gets overlay: full-tile `rgba(0,0,0,.55)`, centred white **28px/600 `+{total-4}`** (e.g. total 7 → `+3`) |

Desktop uses the same ratios scaled to card width — no fixed pixel heights anywhere. Tiles are `<button>`s (padding 0, bg `#E4E6EB` skeleton colour) with `img { object-fit: cover }`, `alt="{place name} — {variant}"`. `next/image` `sizes`: 1-photo `(max-width:700px) 100vw, 590px`; collage tiles `(max-width:700px) 50vw, 295px`. First feed post's media eager, rest lazy.

### 5.3 Interaction & compatibility with the 75-point suite

- Any tile tap opens **`AlbumLightbox.tsx`**: full-screen black, image centred (`object-fit:contain`), counter `"{i} / {total}"`, caption `"{place} · {variant}"`, Close (✕, top-right, 40px), Prev/Next (40px circles, sides) that **wrap around**, swipe left/right, Esc/arrows on desktop. All photos (including beyond the displayed 4) are in the lightbox.
- **Zero-break rule:** for count 1, `PostMediaCollage` renders the *existing* single-media wrapper with the same `data-testid="post-media"`, same class names, same 4:3 box — the existing 75-point geometry suite's media assertions are byte-identical. New markup appears only when `data-count ≥ 2` (`data-testid="post-collage"`, `data-count`, `data-layout="2|3|4|album"`). `PostCard.tsx` changes are limited to: render `PostMediaCollage` instead of the old media block, render `TranslatedText` (§6), and add the `dds-post-card` class (styles exist only ≤1099px + collage/translation scopes).

---

## 6. "See translation" & Language (`components/feed/TranslatedText.tsx`)

### 6.1 Data

Prisma on `Post`: `language String @default("en")` (`'en' | 'bn' | 'mixed'`), `contentTranslation String?`. The generator stores both texts whenever a template has a Bangla line (citizen voice stays primary — **original is always the default view**). Validation script: any post whose `content` contains Bengali Unicode (U+0980–U+09FF) must have non-empty `contentTranslation ≠ content`, else seed/CI fails.

**Client fallback dictionary** `lib/i18n/bangla.ts`: exact-sentence map for the seeded generator's known Bangla template sentences. If `contentTranslation` is null but every Bangla sentence in the post resolves via the dictionary, the component composes the translation client-side; if any sentence is unmapped, **no link is rendered** (never a dead or partial-fake translation).

### 6.2 Behaviour & placement

- Rendered **directly under the post text, above the media**, aligned with text padding (12px mobile / 16px desktop), margin-top 4px.
- Only when `language != 'en'` **and** a translation (stored or dictionary-composed) exists.
- The toggle is a real `<button>`: **"See translation"** in 13px `#65676B` (FB grey-link style; on Reels captions: 12.5px `rgba(255,255,255,.75)`). Tap → post body swaps to the English translation, button becomes **"Show original"**, with a small static caption "Translated from Bangla" (12px `#80868B`) above the button. Tap again → back. `aria-expanded` reflects state; state is per-post `useState`, resets on unmount.
- Mixed posts: the *full* post is swapped to its full English version (no partial highlighting).
- Reels captions reuse this component (dark variant class). Comments are out of scope for v1 (posts + reel captions only).

### 6.3 Preference

`/me` switch **"Always show translations"** (default off): when on, Bangla/mixed posts render translated by default (button reads "Show original"). Stored in `localStorage` key `dds:translation-default`, applied via the same component; the switch is fully functional (no server round-trip needed).

---

## 7. Migration

### 7.1 Breakpoint behaviour of existing surfaces

| Element | ≤700 | 701–1099 | ≥1100 |
|---|---|---|---|
| Web header (56px, "d" ball, search pill, centre nav, panels) | Hidden | Hidden | **Untouched, exactly as verified** |
| App top bar (wordmark + 3 icons) | Visible, sticky | Visible, sticky | Hidden |
| Bottom tab bar | Fixed, 52px | Fixed, inner max 680px | Hidden |
| Left/right rails | Hidden | Hidden | Untouched |
| Centre nav | Replaced by bottom tabs | Same | Untouched |
| Feed column | Full-bleed, 8px gaps | 680px centred, 12px gaps | Untouched |
| Composer | `ComposerRow` + sheets | Same | Existing `Composer` |
| Stories row | `StoriesRowApp` | Same | Existing web `StoriesRow` |
| Search / Notifications / Messenger / Menu / Account panels | Search overlay, `/notifications` page, Messenger overlay, `/me` (menu+account content) | Same | Existing panels untouched |
| `/reels` chrome | In-stage header + dark tab bar | Stage card + tab bar | Web header + centred 420px stage |

No changes to `WebHeader.tsx`, its panels, Left/RightRail components, or any desktop CSS. The desktop 75-point suite must pass unmodified.

### 7.2 Components: reused vs new

**Reused unchanged (or trivial prop only):** `WebHeader` + panels, Left/Right rails, `PostCard` (limited edits §5.3), desktop `Composer`, web `StoriesRow`, `StoryViewer` (episode mode via new optional `initialGroupId`/`episodeDate` props), `SearchPanel`, `MessengerPanel` (+`readOnly` prop), notifications list (extracted to `NotificationsList`, used by both panel and page), `PollCard`, follow/save/react APIs & hooks, toast system, tick utility (`getNextTick`), watcher session (`getWatcher`).

**New files:**

```
components/app/MobileAppShell.tsx        components/app/AppSheetProvider.tsx
components/app/AppTopBar.tsx             components/app/BottomTabBar.tsx
components/app/MobileActionSheet.tsx     components/app/CreateActionSheet.tsx
components/app/SearchOverlay.tsx         components/app/MessengerOverlay.tsx
components/app/ComposerRow.tsx           components/app/TownPromptSheet.tsx
components/app/TownPhotosSheet.tsx       components/app/StoriesRowApp.tsx
components/app/SplitStoryReelCard.tsx    components/app/StoryCardApp.tsx
components/reels/ReelsFeed.tsx           components/reels/ReelSlide.tsx
components/reels/ReelActionRail.tsx      components/reels/ReelCommentsSheet.tsx
components/reels/ReelShareSheet.tsx      components/feed/PostMediaCollage.tsx
components/feed/AlbumLightbox.tsx        components/feed/TranslatedText.tsx
app/reels/page.tsx                       app/friends/page.tsx
app/notifications/page.tsx               app/me/page.tsx
app/me/saved/page.tsx                    app/polls/page.tsx
app/api/reels/route.ts                   app/api/watcher/prompts/route.ts
app/api/watcher/inbox/seen/route.ts      lib/reels/getReels.ts
lib/media/assignPostMedia.ts             lib/i18n/bangla.ts
styles/dds-app.css                       prisma: Post fields + PostMedia + WatcherPrompt
prisma/seed-reels.ts                     prisma/backfill-post-media.ts
tests/e2e/app-shell.spec.ts
```

### 7.3 CSS strategy

One new file, `styles/dds-app.css`, imported in `app/layout.tsx` **after** existing globals. Namespaces: `.dds-app-*` (shell/composer/stories), `.dds-sheet-*`, `.dds-reels-*`, `.dds-collage-*`, `.dds-translate-*`. Every selector begins with a `dds-` class; keyframes are `dds-*`; CSS variables scoped under the shell root (`--dds-blue:#0866FF; --