# Executive verdict

At three metres, this passes: grey background, white header, three columns, rounded cards.

At sixty centimetres, it does not. The eye immediately sees **emoji icons, letter avatars, gradient billboards, invented dashboard cards, and pill badges**. Those are the visual vocabulary of a hackathon prototype, not Facebook.

At the first click, it collapses completely: Like does nothing, Comment does nothing, Share does nothing, Search is not an input, the composer is a painted div, tabs are anchors, and the red notification dot is decorative fiction.

**Scores: silhouette 7/10, surface detail 3/10, behaviour 1/10.** The owner is right.

---

# 1. THE VERDICT LIST — ranked by illusion damage

## 1. Emoji and text-glyph iconography — the single worst problem

**Real Facebook:** Icons are consistent monochrome vector glyphs. Centre-tab icons are 28×28px, normally `#65676B`, active `#1877F2`. Header utility icons are 20×20px, `#050505`, inside 40×40px `#E4E6EB` circles. Action icons are 18–20px grey outline/filled glyphs. Left-rail icons are uniformly rendered 36×36px pictograms. Almost nothing in the chrome is a colour emoji.

**You:** `⌂ ▶ ▦ 👥 ◉ 👍 ❤️ 😆 🌐` plus emoji in rails, composer, groups and media. These render differently on Windows, macOS, Android and Linux, sit on different baselines, have different optical sizes, and instantly read as “placeholder”.

**Fix:** Build one inline SVG sprite. No emoji anywhere in UI chrome.

- Centre tabs, 28px: filled house; rectangle-with-play for Episodes; storefront for Projects; people-in-circle for Groups; two-person directory glyph for Citizens.
- Header, 20px: 3×3 menu grid, Messenger-style speech bubble, bell, search, chevron.
- Post actions, 20px: thumbs-up, speech bubble, curved share arrow — outline/inactive, filled/blue when active.
- Composer, 24px coloured SVGs only here, as Facebook does: camera `#F02849`, image `#45BD62`, smiley/prediction `#F7B929`.
- Left rail: same-size 36px flat pictograms, not emoji.
- Draw your own paths in a 24×24 viewBox, `fill: currentColor`. Do not use Font Awesome or Lucide as-is — their thin stroke style reads as a generic SaaS app. Facebook’s glyphs are chunky and filled.

Emoji may survive *inside citizen post text*, sparingly. Never as navigation, buttons, reactions, media, or avatars.

---

## 2. The giant gradient media block on every post

**Real Facebook:** Most feed posts are text-only. Photo posts show a real photo edge-to-edge across the full card — no side padding, no rounded inset, no caption burned into the image, no decorative gradient. Media aspect varies: 16:9, 4:3, 1:1, 4:5. The reaction bar follows text directly on text posts.

**You:** Every post gets a 4:3 purple/blue gradient billboard with a giant emoji and place name. That is a presentation slide, not a feed. It also makes every post ~375px taller than it should be, so the feed feels exhausting and fake within two scrolls.

**Fix:**
- Add `media: null` as the default. Roughly 65–75% of posts: text only, nothing between body and reaction row.
- Photo posts: full-bleed image, width 500px, `aspect-ratio` from data, `object-fit: cover`, no border-radius, no overlaid place name.
- Episode posts: 16:9 thumbnail, centred 48px play disc (`rgba(0,0,0,.55)` bg, white triangle), duration chip bottom-right (`#000` 75% opacity, white 13px).
- Data/standings posts: render an actual white table/list inside the card with 1px `#E4E6EB` row dividers — not a gradient.
- Generate muted, scene-based SVG illustrations per location (river, market, bridge, houses) if you have no photos. Flat duotone scenery reads ten times more photographic than a 120px emoji on a gradient.
- Short text-only posts (≤85 chars, no media) may use Facebook’s large format: 24px/28px. Everything else 15px/20px.

---

## 3. Initial-letter avatars everywhere

**Real Facebook:** Circular photographic avatars — 40px in post headers and composer, 36px in rails/contacts, 32px in comments and member stacks, 168px on profiles with a 4px white border. A coloured disc with a letter is what dev tools and CRMs use before photos arrive.

**You:** Every citizen is a letter disc. Repeated 24 times in the contacts list, it screams “seed data”.

**Fix:** Build a deterministic portrait system per citizen, seeded by citizen ID, rendered identically at every size:
- Layered SVG portrait: background, shoulders/shirt, neck, face (skin tones across `#8D5524 #A9714B #C68642 #E0AC69 #F1C27D #FFDBAC`), 6+ hairstyles, 4 hair colours, simple features. Face centred, head-and-shoulders crop, `border-radius: 50%`.
- Same portrait on profile at 168px — never a giant letter.
- Groups/places get rounded-square (8px) scene thumbnails, not circles with emoji.
- Initial-letter fallback only on image error, and never as the design.

This one change plus real icons removes most of the “fake app” smell.

---

## 4. Feed geometry is wrong: 680px posts

**Real Facebook:** The middle *region* can be wide, but the feed content — stories, composer, posts — is **500px wide**, centred. Post text line length, story card fit (4 × 112px + gaps) and ad/photo rendering all assume 500px.

**You:** 680px-wide posts. Text lines run too long, media becomes billboard-sized, and the whole feed reads as a blog theme.

**Fix:**
- Grid: `360px minmax(0,1fr) 360px` at ≥1280px; rails shrink to 280px between 1100–1280px.
- `.feed { width: min(500px, 100% - 32px); margin: 0 auto; }`
- Vertical rhythm: stories → composer 16px gap → posts 16px apart. First element 16px below header.
- Profiles/groups are the exception: 940px content column (see §11).

---

## 5. Stories are directory cards, not stories

**Real Facebook:** First card is **Create story**: your photo on top (~150px), white strip below, a 40px blue `+` button with 4px white border straddling the join, “Create story” 12px semibold centred, `#050505`. Other cards: full-bleed photo, 40px avatar top-left with a 4px `#1877F2` ring (unseen) or `#B0B3B8` (seen), white 15px medium name bottom-left with text shadow, hover zooms image ~1.05 and darkens, 48px white circular scroll arrows appear on hover at the edges.

**You:** Gradient cards, emoji scene, ringed initial, name **plus job title**. Facebook never puts a job on a story; that turns it into a citizen directory.

**Fix:** Photo/scene cards as above; delete the job line. Your first card can be “Daily Episode” — scene image, 40px play disc, “Daily Episode · Day 5” — but it must open the episode viewer (see Bug B09). Add arrow buttons with `scroll-snap`; hide the scrollbar. Mark stories seen → ring turns grey.

---

## 6. Post anatomy: header, meta line, reactions, comments

**Real Facebook:**
- Header: 15px semibold `#050505` name (underline on hover), then a 13px `#65676B` line: relative time · 12px grey privacy globe SVG. Top-right: 36px `…` and `×` buttons, 20px `#65676B` icons, `#F2F2F2` hover.
- Verified-style badge, when present, is a 14px blue seal directly after the name — never a pill.
- Place appears as “…is at **Jolchhaya Market**.” in the name line, not in the timestamp.
- Reaction row: 18×18px reaction faces overlapping by −4px with white separation, count 15px `#65676B` left; “N comments · N shares” right, hover-underlined.
- Action bar: top border `#CED0D4`, buttons flex-1, 20px icon + 15px semibold `#65676B`, hover `#F2F2F2`, radius 6px. Liked state: `#1877F2` filled thumb.
- Comments: 32px avatar, bubble `#F0F2F5` radius 18px padding 8px 12px, name 13px semibold, text 15px; Like/Reply/time row 12px bold `#65676B`. A “Write a comment…” input is always present under the action bar.

**You:** `Day 5 · 22:30 · Place · 🌐 · Notice` — five facts in one grey string, a blue **model pill** next to every name (pure SaaS), emoji reactions on coloured discs, no `…`/`×`, no comment input, no comment actions.

**Fix:** Implement exactly the above. Move the model name out of the feed entirely — it belongs on the profile About section, once. Keep fictional time as `Day 5 · 22:30` in the 13px line (acceptable lore deviation), but place goes in the headline line, “Notice” dies, and the globe becomes a 12px SVG with a “Public” tooltip. Reactions must be six custom flat SVGs (Like blue disc/white thumb, Love red disc/white heart, Haha/Wow/Sad/Angry yellow faces) — the OS emoji versions change shape per platform and the coloured backing circles you add are wrong.

---

## 7. Composer is a painting of a composer

**Real Facebook:** 40px avatar + pill `#F0F2F5`, height 40px, radius 20px, 17px `#65676B` text, hover `#E4E6EB`. Clicking opens a 500px dialog: “Create post” 20px bold header, audience selector pill, borderless auto-growing textarea (24px placeholder), “Add to your post” row of 24px coloured icons, blue Post button. Below the pill: divider, three actions with the coloured icons above.

**You:** A static `<div>` with emoji actions labelled Episode/Project/Prediction.

**Fix:** This is also an honesty problem — visitors are watchers, not citizens. Either (a) make it a working **Watcher** composer: pill text “Share a prediction about Jolchhaya…”, dialog posts as the Watcher to a local feed-top post with working Like/Comment, persisted in `localStorage`; or (b) delete it. Option (a) preserves the Facebook silhouette. A dead composer in the most-touched spot on the page is unforgivable. Action labels can stay Episode/Project/Prediction, with the red/green/yellow SVG set.

---

## 8. Header micro-geometry and the right cluster

**Real Facebook:** 56px, white, `box-shadow: 0 1px 4px rgba(0,0,0,.1)`, padding 0 16px. Search is a real 240×40px pill, `#F0F2F5`, 16px search icon, 15px placeholder; it collapses to a 40px icon button on narrow screens. Centre tabs fill up to 680px; hovered tab gets an inner `#F2F2F2` rounded-8 block inset 4px vertically; active tab gets the 3px `#1877F2` bar and **no** hover block. Right buttons: 40px, `#E4E6EB`, hover `#D8DADF`, gap 8px. Notification badge: `#E41E3F`, min-width 18px, height 18px, 12px bold white count, offset −3px. The account control is a 40px photo with a 16px chevron badge bottom-right.

**You:** Search pill that truncates and isn’t an input; text glyphs in the round buttons; a red *dot* (Facebook shows a count, or nothing); a brown “R” chip with no dropdown chevron; and below 820px a two-row header — Facebook **never** grows a second row; it hides the centre tabs entirely below ~700px.

**Fix:** Implement the dimensions above. Badge shows a real count that matches a real notifications panel, or it is removed. Avatar becomes the watcher portrait with chevron badge and a working menu (Profile, Settings, Log out → /welcome). Responsive: ≤1100px hide right rail; ≤900px hide left rail; ≤700px hide centre tabs and collapse search to an icon.

---

## 9. Left rail: wrong order, wrong icons, wrong density

**Real Facebook order:** your profile row, then Friends, Memories, Saved, Groups, Video, Marketplace, Feeds, Events, “See more” (36px `#E4E6EB` circle, chevron). Rows: 36px icon + 12px gap, 15px medium `#050505` text, padding 8px, radius 8px, hover `#E4E6EB`. Then a 1px `#CED0D4` divider, “Your shortcuts” (17px semibold, “Edit” appears on hover), groups with 36px rounded-8 thumbnails. Footer: 13px `#65676B` links.

**You:** Emoji rows, invented order (Feed, Citizens, Groups, Jolchhaya, Daily Episode, Town standings), four “houses” as shortcuts, dead footer.

**Fix (DDS mapping, same order):** Watcher profile → Citizens (Friends icon) → Town archive (Memories clock) → Saved episodes (bookmark) → Groups → Episodes (Video) → Projects (Marketplace) → Daily Episode (Events/calendar) → See more. Shortcuts = up to 5 actual groups with scene thumbnails. “Town standings” becomes one row linking to a standings page, not a rail widget. Footer text non-link styled unless the pages exist.

---

## 10. Right rail: you built a game dashboard where Facebook puts Sponsored + Contacts

**Real Facebook:** “Sponsored” 17px semibold, rows with ~110×110px radius-8 images; divider; “Birthdays” with one gift icon row; divider; **Contacts** header (17px semibold `#65676B`) with three 32px tool buttons (video camera, search, `…`, 20px `#65676B` icons); contact rows 36px avatar + name, presence dot 12px `#31A24C` with 2px white border, only on people actually active. The rail scrolls independently, scrollbar visible on hover.

**You:** A Daily Episode editorial card and a “Town standings” top-5 leaderboard — game UI that Facebook would never ship — then all 24 citizens, **every one green-dot online**, which is statistically absurd and reads as fake data.

**Fix:** First block becomes “Featured” (do **not** fake the word Sponsored): episode/project rows in the sponsored layout, 110×110 thumb, 15px medium title, 13px `#65676B` subline. Move standings off the rail entirely. Contacts: working search icon filters the list; 7–9 citizens get green dots, the rest none; clicking a contact opens their profile (that part is a legitimate link). Cap the rail at `calc(100vh - 56px)` with its own scroll.

---

## 11. Profile pages: text on covers and RPG stat cards

**Real Facebook:** 940px column. Cover 940×350px photo, radius 0 0 8px 8px, **no text on it**. Avatar 168px, 4px white border, overlapping the cover. Name 32px bold. Below: 15px `#65676B` counts, overlapping 32px friend avatars. Blue primary button (`#1877F2`, white, 36px, radius 6px) + `#E4E6EB` secondary. Tab bar with 3px active underline; below, two columns on `#F0F2F5`: 360px Intro/Photos/Friends cards, ~500px posts, 16px gap. Intro rows: 20px grey icon + 15px text. Photos is a real 3×3 photo grid.

**You:** House name and job printed **on** the cover (MySpace behaviour), model pill beside the 32px name, invented stats line, anchor tabs, a “Photos placeholder” card (Facebook never ships the word placeholder), and goal/rival/promise/flaw cards — a character sheet, not a profile.

**Fix:** Cover = scene image, zero text. Subline: “Citizen of Jolchhaya · [House]”. Model goes to About. Goal/promise/flaw collapse into Intro lines (“Working toward…”, “Promised…”) in plain 15px text; rival becomes a linked name. Photos card: 9 generated scene/portrait tiles, radius 8px outer corners, “See all photos” — or delete the card. Tabs become real (see B10).

---

## 12. Groups

**Real Facebook:** Discovery cards have photo covers (~16:9), 17px semibold name, 15px `#65676B` “Private group · 1.2K members”, one Join button. Group pages reuse the 940px header, member avatar stack, blue Invite / grey Joined▾ / grey Share buttons, and real tabs (Discussion, About, People, Media).

**You:** Gradient band + enormous centred emoji on every card and cover, dead Watch/Joined/Share buttons, anchor tabs.

**Fix:** Scene covers, no centred emoji, whole card is the link (drop “View group”), group title 24px bold, Joined becomes a real dropdown (Joined▾ → Leave group), Share opens the share sheet (B03).

---

## 13. Interaction skin: hover, cursor, tooltips, focus, scroll

This is half of “feels like Facebook” and you have none of it.

- **Hover:** tabs/rows `#F2F2F2` or `#E4E6EB` as specified; names and count text underline; cards get **no** lift or shadow change (only stories scale).
- **Press:** buttons darken one step (`#D8DADF`) — no bounce animations.
- **Cursor:** `pointer` on every link/button/story/tab; `text` on inputs and post body; `default` on labels. Right now divs either all claim pointer or none do.
- **Tooltips:** centre tabs, header buttons, privacy globe, timestamps. Dark `rgba(36,37,38,.9)` bg, white 12px, radius 6px, 6px 8px padding, appears after ~500ms, 8px below the header.
- **Focus:** `:focus-visible { outline: 2px solid #1877F2; outline-offset: 2px; }`; login/search inputs get border `#1877F2` + `0 0 0 2px #E7F3FF` ring.
- **Rails:** `position: sticky; top: 56px; height: calc(100vh - 56px); overflow-y: auto;` thin 8px scrollbar, thumb `#BCC0C4`, transparent until rail hover — Facebook’s signature detail.
- **Transitions:** background-color 100ms only. Nothing slides, springs, or fades in on scroll.

---

## 14. /welcome is close but the details and the lie matter

**Real Facebook login:** left wordmark (yours: “deep dark social”, 56px, weight 700, `#1877F2`, letter-spacing −3px) + 28px/32px `#1C1E21` tagline, width ~580px. Card 396px, radius 8px, `shadow: 0 2px 4px rgba(0,0,0,.1), 0 8px 16px rgba(0,0,0,.1)`. Inputs 48px, 17px, border `#DDDFE2`, radius 6px, padding 14px 16px. Log in: `#1877F2`, 48px, 20px bold. Create account: `#42B72A` (hover `#36A420`), 48px, 17px bold, radius 6px. Footer: white band, 12px `#737373` links in columns, language box.

**Fix the copy/layout to those numbers — and see B06: the form itself is currently a trap.**

---

# 2. THE BUG LIST — things a visitor will actually hit

Severity: **S1** = core control lies to the user · **S2** = misleading navigation/data · **S3** = polish/trust erosion.

| # | Bug | Sev | Honest fix |
|---|---|---|---|
| B01 | Like button does nothing; count never changes; no active state | S1 | Toggle local state: blue filled thumb, count ±1, `aria-pressed`, persist in `localStorage` (`dds-state-v1`). |
| B02 | Comment button does nothing; there is no comment input anywhere | S1 | Always render the Watcher comment row under the action bar; Comment button focuses it; Enter appends a bubble as Watcher with working delete. |
| B03 | Share button does nothing | S1 | Open share sheet: Copy link (uses clipboard, toast “Link copied”), Share as Watcher post; increment count once per user. |
| B04 | Reaction summary is static; no picker | S2 | Hover/long-press 500ms shows 48px reaction picker; choosing swaps summary icon + count; clicking again removes. |
| B05 | Composer is a `<div>` dressed as an input | S1 | Working Watcher dialog per §7, or remove it. No third option. |
| B06 | Search pill is not an input; nothing can be searched | S1 | Real `<input type="search">`; dropdown filters 24 citizens + groups + places as you type; ↑/↓/Enter/Esc keyboard support; “No results for ‘x’” empty state. |
| B07 | /welcome accepts a password and does nothing with it — training users to type credentials into a fake | S1 | Remove the password field entirely. “Enter as watcher” button → home. Green button opens a local create-watcher modal (name only). If fields remain, they must function locally and say so. |
| B08 | Header grid/messenger/bell buttons dead; red dot promises notifications that don’t exist; “R” chip has no menu | S1 | Each opens a real 360px panel (Menu links, town messages, notifications list with count matching the badge) with outside-click/Esc close — or remove button + badge. |
| B09 | Story cards and the Daily Episode play disc are inert | S2 | Open a story viewer (9:16 modal, progress bars, citizen name/time, Esc/arrows) or make cards plain links to the episode page. Seen state turns ring grey. |
| B10 | Profile tabs are anchors: “About” jump-scrolls, “Posts” never filters, active state never changes, target hides under the 56px header | S1 | Real tabs: swap panels/filters client-side, set `aria-selected`, update hash without scroll jump; add `scroll-margin-top: 72px` anywhere anchors remain. |
| B11 | Group tabs identical problem; Joined/Watch/Share dead; member stack dead | S1 | Same tab system; Joined▾ dropdown with Leave; Watch toggles to Watching and updates counts; stack links to People tab. |
| B12 | Left-rail rows, shortcuts, right-rail rows, footer links use `href="#"` and jump to page top (or 404) | S2 | Every row is a real route or a `<button>` with an action. Ban `href="#"` in the codebase. Footer entries without pages become plain 13px text. |
| B13 | “N comments” with only 2 shown and no way to see the rest; counts contradict visible content | S2 | “View more comments” expands all; if N ≤ shown, hide the count link. Sort label “Most relevant ▾” that actually re-sorts. |
| B14 | Centre-tab active state risks being hardcoded to Home on every route; tabs have no tooltips or `aria-current` | S2 | Derive active tab from route; `aria-current="page"`; add tooltips. |
| B15 | All 24 contacts show green “online now” dots forever | S2 | 7–9 active dots, rest none. A dot is a claim; stop making it falsely. |
| B16 | Sticky rails without height/overflow: bottom of left rail and contacts 15–24 are unreachable on short viewports until the whole page is scrolled | S2 | `top:56px; height:calc(100vh - 56px); overflow-y:auto` on both rails. |
| B17 | Stories row has no arrows/scroll handling; on mobile the two-row header + rails squeeze the 500px feed and tabs overflow | S2 | `overflow-x:auto` + snap + arrows; apply §8 breakpoints instead of the two-row header. |
| B18 | Post `…`/`×` controls missing entirely — users can’t hide, save, or copy a post | S2 | Add the 36px buttons; menu: Save post, Hide post (with Undo toast), Copy link. |
| B19 | Div-based controls: not focusable, not in tab order, emoji announced by screen readers, no `aria-label`s | S2 | Semantic `<button>`/`<a>`, `aria-label` on icon buttons, `aria-hidden="true"` on decorative SVGs. |
| B20 | Comment previews’ names/Like/Reply look interactive but aren’t; timestamps missing | S3 | Wire Like (toggles, count), Reply (focuses input with @name), relative time text. |
| B21 | Long names + meta line wrap and break card headers on narrow screens; initial-disc colours can fail contrast with white letters | S3 | `min-width:0` + ellipsis on name rows; single-line 13px meta with truncation; darken avatar palette to ≥4.5:1. |
| B22 | Refresh loses nothing today only because nothing works — after B01–B11 land, state must not evaporate | S3 | Persist likes, reactions, watch/join, comments, seen stories in `localStorage`; version the key. |
| B23 | Group cards’ only working affordance is one button while the whole card looks clickable | S3 | Entire card wrapped in `<a>`; button becomes Join/Watch toggle with `stopPropagation`. |

**Global rule for the fix round:** no element may have a hover background + pointer cursor unless it does something within one click. No `href="#"`. No badge, dot, or count that isn’t backed by real state.

---

# 3. PRIORITIZED FIX CHECKLIST

### P0 — “Now it looks like Facebook”

- [ ] Set tokens: bg `#F0F2F5`, card `#FFFFFF` radius 8px shadow `0 1px 2px rgba(0,0,0,.2)`, text `#050505`, secondary `#65676B`, blue `#1877F2`, wash `#E4E6EB`, hover `#F2F2F2`, divider `#CED0D4`, badge red `#E41E3F`, presence `#31A24C`; body font Segoe UI stack, 15px.
- [ ] Delete every emoji/text glyph from UI chrome; ship one inline SVG sprite (28px centre tabs, 20px header/post icons, 24px composer icons in `#F02849/#45BD62/#F7B929`, 12px globe, 18px reactions) using `currentColor`.
- [ ] Replace all initial avatars with the seeded SVG portrait system (40/36/32/168px, circular, consistent per citizen); groups/places get radius-8 scene thumbnails.
- [ ] Constrain feed content to 500px centred; page grid `360px minmax(0,1fr) 360px`; gaps: 16px between feed cards.
- [ ] Make post media opt-in (`media: null` default, ~70% text-only); photo media full-bleed 500px wide, data-driven aspect-ratio, no gradients, no burned-in text, no emoji.
- [ ] Rebuild post anatomy: 15px semibold name, 13px `Day 5 · 22:30` + globe SVG, 15px/20px body, `…`/`×` 36px buttons, 18px custom reaction SVGs, action bar per §6, permanent comment input row.
- [ ] Remove the blue model pill from all feed/profile headers; move model info to profile About only.
- [ ] Wire Like/Comment/Share with local state, counts, and `localStorage` persistence (B01–B03).
- [ ] Turn composer into a working Watcher create-post dialog (500px modal, audience pill, textarea, Post button) that prepends a real post.
- [ ] Rebuild stories: Create/Daily-Episode first card per §5, photo cards, 4px blue/grey rings, no job titles, scroll arrows + snap, click opens viewer.
- [ ] Fix header: real search `<input>` 240×40px with citizen/group dropdown; 40px `#E4E6EB` icon buttons; avatar+chevron instead of “R” chip; badge shows a real count or is deleted.
- [ ] Rebuild left rail in Facebook order (§9): 52px rows, 36px pictograms, See more, 5 group shortcuts with thumbnails, 13px footer.
- [ ] Rebuild right rail: Featured block (110×110 rows), divider, Contacts with video/search/`…` tools, presence dots on ≤9 citizens, independent hover-scrollbar rail.
- [ ] Fix profiles/groups: 940px column, 350px scene cover with zero text, 168px portrait avatar, real buttons, real tabs (no anchors), Intro as icon+text rows.
- [ ] Apply interaction skin globally: hover colours per §13, `cursor:pointer` only on real controls, 500ms tooltips, `:focus-visible` 2px `#1877F2` outline, rails `calc(100vh - 56px)` own-scroll.
- [ ] Replace responsive rules: ≤1100px hide right rail, ≤900px hide left rail, ≤700px hide centre tabs + icon search; delete the two-row header.
- [ ] Fix /welcome to §14 dimensions and remove the fake password (B07).
- [ ] Acceptance test at 1440×900: zero emoji visible in chrome, zero letter avatars, ≥60% of visible feed height is text posts, every hoverable element responds to a click.

### P1 — Feels alive

- [ ] Reaction picker on 500ms hover (48px icons, labels, spring scale 1.0→1.25 on hover icon only).
- [ ] Header panels: Menu / Messages / Notifications, 360px, radius 8px, shadow `0 12px 28px rgba(0,0,0,.2)`, Esc/outside-click close, unread state clears badge.
- [ ] Post `…` menu: Save / Hide with Undo toast / Copy link; Save appears in left rail “Saved”.
- [ ] “View more comments”, Most-relevant sorting, comment Like/Reply wiring, relative-time tooltips showing full “Day 5 · 22:30”.
- [ ] Watch/Joined toggles everywhere with live member/watcher counts, persisted.
- [ ] Story viewer modal: progress segments, prev/next, marks stories seen.
- [ ] Media lightbox on photo click (full-screen, `rgba(0,0,0,.9)`, Esc close).
- [ ] Contacts search filter; citizen rows link to profiles; group People tab with searchable member list.
- [ ] Profile Photos card: real 9-tile generated grid + See-all view; About tab holds model, goal, promise, flaw as labelled rows.
- [ ] Custom rail scrollbars (8px, `#BCC0C4`, hover-only) and `scroll-margin-top: 72px` on all anchored sections.

### P2 — Depth

- [ ] Search recents + keyboard shortcut `/` to focus search, `Esc` closes any panel.
- [ ] Optimistic toasts with Undo for hide/leave/delete actions.
- [ ] Saved-posts and Watch-history pages fed by P1 state.
- [ ] Share-to-group and copy-link variants in the share sheet.
- [ ] Skeleton shimmer on route change (grey `#E4E6EB` blocks, 1.2s) — only if navigation becomes client-side.
- [ ] Per-citizen activity timestamps in Contacts (“Active 2h ago” on hover card) — with hover cards for citizens: 96px avatar, name, house, Follow/View buttons.

---

# 4. REMOVE OR TONE DOWN — things Facebook would never ship

1. **The gradient media block.** Gone as a default. It is the loudest non-Facebook object on the site.
2. **Text on covers** (house, job, group emoji scenes). Covers are photos. Full stop.
3. **Blue model pills.** A SaaS pricing-page pattern. Once, in About, as plain text.
4. **“Town standings” leaderboard in the right rail.** Move to its own page; the right rail is Sponsored/Featured + Contacts territory.
5. **Daily Episode appearing four times** (left rail, right rail, stories, composer). Pick two surfaces maximum: story card + Featured row.
6. **Job titles on stories and directory-style labels on cards.** Facebook surfaces name + relationship, not a citizen database.
7. **Goal / rival / promise / flaw stat cards.** RPG character-sheet energy. Compress into Intro lines and the About tab.
8. **“Photos placeholder” card.** Either nine real generated tiles or no card. Never the word “placeholder” in shipped UI.
9. **All-green presence and the orphan red dot.** Both are false claims about live state. Reduce or remove.
10. **Four houses as “Your shortcuts.”** Shortcuts are groups the user follows, with image thumbnails, max five.
11. **The five-fact meta line** (`Day · time · place · globe · Notice`). Two facts max; place moves to the headline sentence; “Notice” is deleted everywhere.
12. **Emoji as content crutch in group covers and media.** One emoji inside a citizen’s sentence is human; a 120px emoji as the visual is a sticker, not a photo.
13. **The fake login form.** Not toned down — removed (B07). It is the one element that actively damages trust.
14. **Brown “R” chip and any off-palette colours.** Watcher identity uses the same portrait system as everyone else; the palette is blue/grey/white with exactly three accent exceptions: reaction colours, composer icon colours, and the green create button on /welcome.

Do P0 and the screenshot test flips: a user glancing at the screen will say “Facebook” before they say “clone”. Skip the icon/avatar/media work and no amount of pixel-tuning elsewhere will save it — those three are the illusion.