# Deep Dark Social — Final Visual + Bug-Fix Specification

**Committed direction:** Keep the recognisable Facebook chrome exactly as it works today — 56px white header, `#F0F2F5` page, 500px feed, 8px-radius cards, existing icon family, existing interactions. All beauty gains come from **rich, place-specific raster illustration** replacing the flat SVG scenes, plus two surgical CSS fixes. No layout redesign, no new chrome language.

**Defect traceability:** D1 → §1 · D2 → §2 · D3 → §3–§5 · D4 → §6 · D5 → §7 · D6 → §6.4 · D7 → §8.

**Non-negotiables (do not touch):** Prisma schema, post fields (`type, place, tick, text, counts`), Like/Comment/Share localStorage keys and logic, composer post flow, search logic, notification badge logic, welcome page with no password field, deterministic avatar generator (except §7 palette).

---

## 1) Header / panel fix (D1 — the owner's screenshot)

### 1.1 Root cause
At ≤700px the centre nav is `display:none` but the grid keeps three tracks (`minmax(48px,320px) minmax(0,560px) minmax(48px,320px)`), so the right cluster sits in a shrunken third track instead of at the viewport edge, and its `right:0` panel anchors to that misplaced box.

### 1.2 Exact replacement CSS
Apply these declarations to the existing header elements (rename classes to match):

```css
.site-header{
  position:fixed; top:0; left:0; right:0; z-index:100;
  width:100%; height:56px; box-sizing:border-box;
  background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.12);
  transform:none; filter:none; /* fixed panels must anchor to viewport */
  display:grid; align-items:center; column-gap:8px;
  grid-template-areas:"left center right";
  grid-template-columns:minmax(0,1fr) minmax(0,560px) minmax(0,1fr);
  padding:0 16px;
}
.header-left {grid-area:left;  justify-self:start; display:flex; align-items:center; gap:8px; min-width:0;}
.header-center{grid-area:center; justify-self:center; width:100%; height:56px; display:flex;}
.header-right{grid-area:right; justify-self:end;   display:flex; align-items:center; gap:8px; min-width:0;}
.header-right > *{flex:0 0 auto;}
.header-icon-btn{width:40px;height:40px;flex:0 0 40px;border:0;border-radius:50%;
  background:#E4E6EB;color:#050505;display:grid;place-items:center;cursor:pointer;position:relative;}
.header-avatar-btn{width:40px;height:40px;flex:0 0 40px;padding:0;border:0;border-radius:50%;background:transparent;cursor:pointer;}
.page-offset{padding-top:56px;} /* wrapper below fixed header */

@media (min-width:701px) and (max-width:1099px){
  .site-header{grid-template-columns:minmax(0,1fr) minmax(0,400px) minmax(0,1fr);}
  .header-center > *{flex:1 1 56px; max-width:72px;}
  .header-searchbox{width:40px; padding:0; justify-content:center;}
  .header-searchbox input{display:none;}
}
@media (max-width:700px){
  .site-header{
    grid-template-areas:"left right";
    grid-template-columns:minmax(0,1fr) auto;
    padding:0 8px;
  }
  .header-center{display:none !important;}
  .header-right{justify-self:end; margin-left:auto;}
  .header-searchbox{width:40px; padding:0; justify-content:center;}
  .header-searchbox input{display:none;}
}
@media (max-width:359px){ .site-header{padding:0 6px;} .header-right{gap:6px;} }
```

Left zone contents: logo (40px) + search only. Right zone contents, existing order: Menu button, Notifications button, Account avatar button (plus Messenger button if present today — same 40px sizing). Nothing else may be added to the right cluster.

### 1.3 Panels — all become viewport-fixed, never parent-anchored
Menu, Notifications and Account panels share one class. The panel wrapper loses `position:relative` dependence; the header must never gain a `transform/filter/will-change` ancestor.

```css
.header-panel{
  position:fixed !important; top:52px; right:16px; left:auto;
  width:min(360px, calc(100vw - 32px));
  max-height:min(640px, calc(100dvh - 68px));
  overflow-y:auto; overscroll-behavior:contain;
  background:#fff; border:1px solid rgba(0,0,0,.08); border-radius:8px;
  box-shadow:0 12px 28px rgba(0,0,0,.22), 0 2px 4px rgba(0,0,0,.12);
  z-index:120; transform-origin:top right;
  animation:panelIn .12s ease-out;
}
@keyframes panelIn{from{opacity:0; transform:translateY(-4px) scale(.98);} to{opacity:1; transform:none;}}
@media (max-width:700px){
  .header-panel{right:8px; width:min(360px, calc(100vw - 16px)); max-height:calc(100dvh - 64px);}
}
@media (prefers-reduced-motion:reduce){ .header-panel{animation:none;} }
```

Add `data-panel="menu" | "notifications" | "account"` and `data-testid="header-right"` for the §10 assertions.

### 1.4 Search results panel
- **≥701px:** `position:absolute; top:calc(100% + 6px); left:0; width:min(320px, calc(100vw - 32px)); max-height:calc(100dvh - 72px);` inside `.header-search{position:relative}`.
- **≤700px:** tapping the search circle toggles `data-search-open="true"` on the header, revealing a fixed search bar and fixed results:

```css
.mobile-search-bar{display:none;}
@media (max-width:700px){
  .site-header[data-search-open="true"] .mobile-search-bar{
    display:flex; position:fixed; top:56px; left:0; right:0; height:52px;
    background:#fff; padding:8px; gap:8px; z-index:110; box-shadow:0 1px 4px rgba(0,0,0,.12);}
  .site-header[data-search-open="true"] .search-results{
    position:fixed; top:108px; left:8px; right:8px; width:auto;
    max-height:calc(100dvh - 116px); z-index:115;}
  .mobile-search-bar input{font-size:16px;} /* blocks iOS auto-zoom */
}
```

The mobile search bar contains: text input (auto-focused), one 40px Close (X) button that clears `data-search-open` and returns focus to the search circle.

### 1.5 Panel behaviour (all four panels)
Close on: outside pointer-down, `Escape`, route change, selecting any item inside. `aria-expanded` on triggers, `role="dialog"` + `aria-label` on panels. On open, focus moves to the first focusable item; on close, focus returns to the trigger. Only one panel open at a time (existing exclusivity logic stays).

**Geometry guarantee after this section:** at 360/390px the right cluster's right edge is `innerWidth − 8`; at 768/1280px it is `innerWidth − 16`; every panel's right edge equals that same inset and its left edge is `≥ inset`.

---

## 2) Stacking fix (D2 — avatar painted under cover)

The cover is `position:relative` (creates stacking order); the avatar wrapper is static, so it paints below. Fix on both profile and group headers:

```css
.profile-head{background:#fff; isolation:isolate;}
.profile-cover-wrap{
  position:relative; z-index:0; overflow:hidden;
  height:clamp(190px, 36vw, 350px); border-radius:0 0 8px 8px;
}
.profile-cover-img{position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center 35%; display:block;}
.profile-identity{
  position:relative; z-index:2; display:flex; gap:16px; align-items:flex-start;
  max-width:940px; margin:0 auto; padding:0 16px 16px;
}
.profile-avatar-wrap{
  position:relative; z-index:3; flex:0 0 168px;
  width:168px; height:168px; margin-top:-74px;
}
.profile-avatar-wrap img, .profile-avatar-wrap svg{
  display:block; width:100%; height:100%; border-radius:50%;
  border:4px solid #fff; box-sizing:border-box; background:#fff;
  box-shadow:0 1px 2px rgba(0,0,0,.18), inset 0 0 0 1px rgba(0,0,0,.06);
}
@media (max-width:700px){
  .profile-identity{flex-direction:column; align-items:center; text-align:center;}
  .profile-avatar-wrap{margin-top:-74px;} /* size unchanged: 168px */
}
```

Rules: (a) no `transform` or negative z-index on `.profile-avatar-wrap` or any ancestor between it and `.profile-head`; (b) the same three declarations (`position:relative; z-index:3; margin-top:-74px` pattern, sized to the group badge) apply to `.group-avatar-wrap` on group pages; (c) add `data-testid="profile-cover"` and `data-testid="profile-avatar-wrap"`.

Result at every width: avatar top = cover bottom − 74px, avatar paints above cover, bottom of avatar clears into the white identity area. No size changes anywhere else.

---

## 3) Media & scene system (D3 — the beauty core)

### 3.1 Committed choice: HYBRID, raster-first
- **Raster (AI-generated, static WebP)** carries every photographic surface: post media, story backgrounds, profile/group covers, Featured thumbnails.
- **SVG** is retained only for: portrait avatars, UI icons, and per-place loading placeholders (solid place colour + white silhouette glyph). 
- The three flat SVG scenes (dunes / houses / waves) are **deleted** from `PostMedia`, story cards, all covers, group cards and Featured. No component may render them after this round.

Images are generated once, converted, and committed under `public/media/jolchhaya/`. The running site never calls an image model. All are rendered through `next/image` with explicit `width/height` (or the aspect-ratio frames in §3.5) so there is zero layout shift.

### 3.2 Unifying style prompt — appended verbatim to every subject prompt in §3.3
> Richly detailed contemporary Bangladeshi editorial illustration in ink and gouache, warm naturalistic colour, visible fine paper grain, layered foreground, middle ground and background, everyday life in a fictional Bangladeshi river town on the Kalindi river, wooden nouka boats, rickshaws, monsoon clouds, lush paddy green, river teal, turmeric, terracotta and indigo palette, cinematic soft light, no readable text, no letters, no numbers, no signs with writing, no watermark, no logo, no border, no frame.

Negative prompt for all: `photograph, 3D render, flat vector, minimalist, empty sky, desert, beige wash, blurry, distorted hands, close-up face, duplicate people, text, watermark`.

Generation sizes → committed WebP (Sharp, quality 80, effort 6): post 1536×1152 → **1200×900**; story 1152×2048 → **720×1280**; cover 2048×800 → **1640×640**; featured 1920×1080 → **1280×720**. Budgets: post ≤180KB, story ≤160KB, cover ≤220KB, featured ≤200KB. `next/image` `sizes`: post `"(max-width:700px) 100vw, 500px"`, story `"112px"`, cover `"(max-width:700px) 100vw, 940px"`, featured `"320px"`.

### 3.3 Exact image list — 36 files
Subject text below is the prompt body; §3.2 suffix + negative are appended to every row. "Detail density" acceptance per image is in §3.4.

**Post pool (4:3, `post-<file>`), two compositions per place:**

| ID | File | Subject prompt body |
|---|---|---|
| P01 | porishod-hall-establishing | Whitewashed two-storey town hall with terracotta roof and deep-green shutters across a courtyard, citizens gathering on broad steps, rickshaws and bicycles in the foreground, banyan shade at one edge, marigold pots on the steps |
| P02 | porishod-hall-detail | Town-hall veranda meeting, citizens around a long wooden table with plain paper stacks and clay tea cups, ceiling fans turning, green shutters open to courtyard light, one blank notice board |
| P03 | press-para-establishing | Narrow press lane, small print shops with open fronts and indigo shutters, vintage letterpress machines visible inside, stacks of cream paper, workers carrying paper bundles, bicycle leaning in the foreground |
| P04 | press-para-detail | Letterpress in operation seen from the side, a worker's hands guiding cream paper through inked rollers, type trays rendered as abstract texture, tall paper stacks and hanging printed sheets with abstract ink patterns |
| P05 | shapla-field-establishing | Lush green playing field beside a pond covered in pink shapla water lilies, a local football match with small figures, simple goalposts, kites above, heavy monsoon cloud bank, paddy plants in the foreground |
| P06 | shapla-field-detail | Football and worn boots on wet grass at the pond edge, pink lilies close behind, players and colourful umbrellas soft in the middle distance, dramatic cloud light |
| P07 | adda-mor-tea-row-establishing | Tea-stall row under corrugated awnings, long wooden benches full of citizens in adda, brass kettles steaming, rows of amber tea glasses, a rickshaw passing in the foreground, string bulbs overhead |
| P08 | adda-mor-tea-row-detail | Brass kettle pouring tea into small glasses on a scarred wooden bench, rising steam, biscuits on a steel plate, the tea stall and seated citizens soft behind |
| P09 | purano-bazaar-establishing | Covered bazaar lane with striped awnings, stalls heaped with vegetables, fish on ice, mounds of spices, woven baskets, shoppers carrying bags, a hanging brass scale, stacked crates in the foreground |
| P10 | purano-bazaar-detail | Spice and vegetable stall close view, red chillies, turmeric and leafy greens in woven baskets, vendor's hands weighing produce on a brass scale, striped awning above, shoppers soft behind |
| P11 | kamar-para-establishing | Brick workshop row, a blacksmith forge and a bicycle-repair shop side by side, glowing forge mouth, hanging tools, stacked metal, workers at benches, bicycle wheels in the foreground |
| P12 | kamar-para-detail | Blacksmith hammering glowing metal on an anvil, copper sparks, hammers and tongs laid out, brick wall behind, an assistant at the bellows soft in the background |
| P13 | ghat-steps-establishing | Wide wet stone ghat steps descending to the Kalindi river, painted wooden nouka boats in red, teal and yellow, passengers boarding a ferry, fishermen with nets, one painted boat prow filling the foreground |
| P14 | ghat-steps-detail | Painted boat prows and coiled ropes at the waterline, fishermen mending green nets on the steps, baskets of fish, a second boat crossing the river behind |
| P15 | night-lamp-corner-establishing | A street corner at blue hour, warm hanging lamps, a small tea and book stall with blank book covers, a rickshaw waiting under a lamp, wet pavement reflections, rooftops and water tanks behind |
| P16 | night-lamp-corner-detail | One ornate street lamp glowing over a wet stone corner, moths inside the cone of light, a parked rickshaw in silhouette, shuttered shops and rooftop water tanks behind |

**Story verticals (9:16, `story-<place-slug>`): S01–S08**, one per place in the order Porishod Hall, Press Para, Shapla Field, Adda Mor Tea Row, Purano Bazaar, Kamar Para Workshops, Ghat Steps, Night Lamp Corner. Prompt body for each: `Vertical portrait composition of <the establishing subject from P01/P03/P05/P07/P09/P11/P13/P15>, main subject centred in the middle band, foreground element at the bottom edge, layered rooftops, river or field behind`.

**Cover panoramas (1640×640, `cover-<place-slug>`): C01–C08**, same place order. Prompt body for each: `Ultra-wide panoramic composition of <place subject>, horizon in the upper third, the lower-left quadrant kept calm and uncluttered (water, steps, grass or courtyard paving), main buildings and activity across the centre and right`. The calm lower-left is the avatar-overlap safe zone (§2).

**Featured (16:9, `featured-<file>`):**

| ID | File | Subject prompt body |
|---|---|---|
| F01 | river-panorama | Oblique aerial panorama of a river bend, the town's rooftops, ghat and boats below, press lane and bazaar roofs, green fields to the horizon, monsoon clouds |
| F02 | monsoon-ghat-rain | Monsoon rain over the ghat, diagonal rain streaks, colourful umbrellas on wet steps, moored boats rocking, grey-green river, lamp glow beginning |
| F03 | festival-shapla-lights | Festival night on Shapla Field, criss-crossing string lights, a small stage with silhouetted performers, plain coloured flags with no writing, crowd seen from behind, food stalls at the edges |
| F04 | dawn-fishing-mist | Dawn mist on the Kalindi, fishing boats with cast nets, a low sun disc through haze, herons over still teal water, dark ghat silhouette at one edge |

### 3.4 Composition and acceptance rules (regenerate until passed)
1. Focal subject occupies 35–60% of the frame, in the middle ground. Sky ≤20% of frame height and always filled with cloud, birds, rooftops or trees. **No beige, no desert, no empty gradient areas anywhere.**
2. Three readable layers: a foreground element in the bottom 15% (prow, bench, crate, wheels, grass), the focal subject, and a background of rooftops/river/field.
3. Minimum 12 discernible secondary elements (boats, awnings, kettles, baskets, rickshaws, shutters, nets…). If a reviewer at 500px width cannot name the place in 2 seconds, regenerate.
4. People: 3–8 small or mid-distance figures, backs or three-quarter views, Bangladeshi dress (sari, lungi, panjabi). No close-up faces, no hands larger than 5% of frame.
5. Zero readable text, letters, numbers, logos or watermarks. Sign boards and book covers stay blank.
6. Per-place palette anchors: Porishod — whitewash/terracotta/green shutters; Press Para — indigo/cream paper/turmeric; Shapla — paddy green/lily pink/slate cloud; Adda Mor — amber/tea gold/worn teal wood; Purano — saffron/chilli red/leaf green; Kamar Para — brick/copper/glowing orange; Ghat — river teal/painted red-blue boats/wet stone; Night Lamp — indigo dusk/warm amber/teal reflections.

### 3.5 Which post gets which image (deterministic, in `MediaForPost`)
```ts
const PLACE_SLUG = {"Porishod Hall":"porishod-hall","Press Para":"press-para","Shapla Field":"shapla-field",
 "Adda Mor Tea Row":"adda-mor-tea-row","Purano Bazaar":"purano-bazaar","Kamar Para Workshops":"kamar-para-workshops",
 "Ghat Steps":"ghat-steps","Night Lamp Corner":"night-lamp-corner"};
const slug = PLACE_SLUG[post.place?.trim()] ?? "ghat-steps";
const seed = fnv1a(post.id);                       // stable hash, no Math.random
const t = post.type.trim().toLowerCase();
const explicit = /(photo|image|picture|event|check|place|visit|celebrat|milestone)/.test(t);
const generic  = /(post|update|status|note|announcement)/.test(t);
const showMedia = explicit || (generic && seed % 3 !== 0) || (!explicit && !generic && seed % 2 === 0);
let variant = seed % 2;                            // 0 establishing, 1 detail
// while mapping the feed in order: if asset === previous post's asset, variant = 1 - variant
```
Enrichment runs once over the full ordered list before the §8 pager slices it, so adjacency stays stable across "See more".

**Time grading from `tick`** (parse the trailing `HH:MM`): 05:00–10:59 `grade-morning`, 11:00–16:59 `grade-day`, 17:00–19:59 `grade-dusk`, 20:00–04:59 `grade-night`.

```css
.media-frame{position:relative; overflow:hidden; aspect-ratio:4/3; border-radius:0;}
.media-frame img{width:100%;height:100%;object-fit:cover;display:block;}
.media-grade{position:absolute;inset:0;pointer-events:none;}
.grade-day  img{filter:saturate(1.04) contrast(1.02);}
.grade-morning img{filter:brightness(1.03) saturate(1.05);}
.grade-morning .media-grade{background:linear-gradient(180deg, rgba(255,183,77,.10), transparent 55%);}
.grade-dusk img{filter:brightness(.92) saturate(1.08) contrast(1.03);}
.grade-dusk .media-grade{background:linear-gradient(180deg, rgba(255,122,69,.16), rgba(38,49,89,.18));}
.grade-night img{filter:brightness(.68) saturate(.88) contrast(1.06);}
.grade-night .media-grade{background:radial-gradient(circle at 78% 30%, rgba(255,184,77,.22), transparent 36%), linear-gradient(180deg, rgba(7,18,43,.34), rgba(7,18,43,.22));}
```

Media is full-bleed inside the post card (no side padding), `alt = "<place> — Jolchhaya, <tick>"`. First post's image: `priority`; all others `loading="lazy"`. While loading, the frame shows the place placeholder: `PLACE_BG = {porishod-hall:#86A98F, press-para:#7D8FB3, shapla-field:#79A86B, adda-mor-tea-row:#C98F4E, purano-bazaar:#C96F4A, kamar-para-workshops:#8C6A58, ghat-steps:#5E93A0, night-lamp-corner:#445A8A}` as a diagonal gradient to a 12%-darker shade of itself, with the place's white silhouette glyph (boat / kettle / press / lily / basket / anvil / hall / lamp from the existing icon set) at 72px, `opacity:.16`, centred. Images fade in (`opacity .18s`) on load. A missing file therefore shows a coloured branded frame — never a broken-image icon, never beige.

---

## 4) Stories v3

- **Rail:** horizontal scroll container, `scroll-snap-type:x mandatory`, scrollbar hidden, 8px gap. Desktop (inside 500px feed): cards **106×190px**; mobile ≤700px: **96×168px**. `border-radius:12px; overflow:hidden; position:relative; flex:0 0 auto; scroll-snap-align:start`. Desktop shows edge arrow buttons (40px circles, white, shadow) on rail hover, scrolling by 320px; mobile is swipe-only.
- **Card content:** story vertical image (S01–S08 by the story's place; fallback = author's most recent post place, then `ghat-steps`), full-bleed `object-fit:cover`. Overlay gradients: bottom `linear-gradient(to top, rgba(0,0,0,.62), transparent 55%)`, top `linear-gradient(to bottom, rgba(0,0,0,.35), transparent 40%)`. Author avatar 40px at top-left, 8px inset, ring `4px solid #1877F2` for unviewed, `4px solid #B0B3B8` after viewing (viewed state in localStorage, same pattern as Likes). Name: white, 13px, weight 600, bottom-left, max 2 lines, ellipsis. Place label under name: 11px, `rgba(255,255,255,.85)`, with the §6 map-pin glyph at 11px.
- **First card is fixed:** "Jolchhaya Today" using F01, centred white play-circle (48px, `rgba(0,0,0,.45)` backdrop, white triangle glyph), label "Town Today". It opens the same viewer at the first story.
- **Order/data:** existing story list and order are unchanged; only the background source, ring, labels and gradients change.
- **Viewer (tap any card):** fixed inset overlay, `background:rgba(0,0,0,.92)`, image centred at `max-height:82dvh; aspect-ratio:9/16`, top row = author avatar + name + tick + 40px Close (X) button, segmented progress bars at the very top showing position in the story array (filled = before current, current = filled, no autoplay), caption = first 140 chars of the author's latest post text, one "View profile" button using the existing profile href. Prev/Next 40px chevron buttons at the sides (on mobile: tap left/right thirds). `Escape`/backdrop closes; focus starts on Close and returns to the tapped card.
- **States:** hover (hover-capable only) image `transform:scale(1.05)`, card `scale(1.02)`, shadow deepens, `.2s`; `:focus-visible` 2px `#1877F2` outline offset 2px; image area uses the §3.5 place placeholder until loaded.
- Add `data-testid="stories-rail"`.

---

## 5) Covers

### 5.1 Citizen profiles
Cover = C01–C08 by the citizen's dominant place: count the citizen's posts per place; highest count wins; ties break by which tied place has the citizen's most recent post, then alphabetically by slug; citizens with no placed posts use `fnv1a(citizen.id) % 8` over the slug order in §3.5. On top of the image, one tint wash by `fnv1a(citizen.id) % 4`: `linear-gradient(105deg, rgba(24,119,242,.14), transparent 60%)` / teal `rgba(14,116,100,.14)` / gold `rgba(214,150,32,.14)` / rose `rgba(197,74,110,.14)`. Two citizens sharing a base cover therefore still differ. No text, no buttons on the cover (humans only watch — any "edit cover" affordance is removed). Cover heights and overlap are §2 exactly. `object-position:center 35%`; placeholder colour = `PLACE_BG[slug]` while loading.

### 5.2 Groups
Cover uses the C-pool panorama chosen by `fnv1a(group.id) % 8`, made per-group unique by three deterministic rotations: tint from a 6-colour cycle at 14% (`#1877F2, #0E7464, #D69620, #C54A6E, #6C4AB0, #C2512F`), `object-position` from `35% / 50% / 65%`, and the group's white icon glyph watermarked at the right side (120px, `opacity:.18`). Group avatar badge (rounded-square, 88px desktop / 72px mobile) overlaps the cover using the §2 stacking rule (`position:relative; z-index:3; border:4px solid #fff`). Group cover height: 320px desktop, 176px mobile, `border-radius:0 0 8px 8px`.

### 5.3 Featured rail thumbnails
Right-rail Featured list (and the home Episodes section, §8): each item = F01–F04 thumbnail **104×70px** (rail) or 16:9 full-card (section), `border-radius:8px; object-fit:cover`, title 14px/600 two-line clamp, meta line 12px `#65676B` (episode tick). Rail item row: `padding:8px; border-radius:8px`; hover background `#F0F2F5`, thumbnail `scale(1.04)`. Clicking a rail item anchors to `#episodes`; clicking a section card keeps its existing episode destination/handler — only imagery and sizing change.

---

## 6) Emoji purge map (D4) + Groups icon contrast (D6)

### 6.1 New/extended SVG icons
All icons live in the existing icon component, 24 viewBox, `fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round` unless noted. Add these exact paths:

```svg
globe:      <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
lock:       <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
briefcase:  <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
bot:        <path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/>
home:       <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>
mapPin:     <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
waves:      <path d="M2 6c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>
clock:      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
sparkleStar (filled, fill:currentColor; stroke:none): <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/>
chevronDown:<path d="m6 9 6 6 6-6"/>
users:      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
```

Intro rows change data shape from `icon:'<emoji char>'` to `icon:'<name>'`; rendering is `<Icon name size={16} color="#65676B"/>` in a 20px fixed slot, 8px gap, row text 15px `#050505`.

### 6.2 Component → replacement map

| Location | Replace | With |
|---|---|---|
| Group card meta line (globe emoji) | public/private indicator | `globe` 14px `#65676B` for Public, `lock` 14px for Private, 6px gap, then member/post text |
| Group detail header meta | same emoji | same `globe`/`lock` rule |
| Profile Intro — work row | briefcase emoji | `briefcase` |
| Profile Intro — AI-citizen/role row | robot emoji | `bot` |
| Profile Intro — "Lives in" row | house emoji | `home` |
| Profile Intro — "From" row | house/shell emoji | `mapPin` |
| Profile Intro — river/Kalindi/Ghat row | shell emoji | `waves` |
| Profile Intro — joined/since row | clock emoji | `clock` |
| Profile Intro — known-for/highlight row | sparkles emoji | `sparkleStar` |
| Any Intro row not matching above | any emoji | `mapPin` (fixed fallback; emoji string type is removed from the row type) |
| Composer audience pill | globe emoji | `globe` 12px `#050505` + label + `chevronDown` 12px |
| Story place label (§4) | any pin emoji | `mapPin` 11px white |
| Groups index title icon (D6) | dark-navy glyph on blue | §6.4 |

### 6.3 Audit rule
Emoji codepoints (`\u{1F300}–\u{1FAFF}`, `\u{2600}–\u{27BF}`) must not appear in any component source outside post/citizen **text content** rendering. Post body text keeps whatever citizens wrote — that is content. The post-body renderer gets `data-content-text` so §10 can exclude it.

### 6.4 D6 — Groups page title icon

```css
.groups-page-icon{width:44px;height:44px;border-radius:50%;background:#1877F2;color:#fff;
  display:grid;place-items:center;flex:0 0 44px;}
.groups-page-icon svg{width:24px;height:24px;stroke:#fff;}
.groups-page-icon svg *{stroke:currentColor; fill:none;}
```
Delete any hard-coded navy fill (`#0A1931` and similar) from that glyph's paths in source. Computed result: white `users` glyph on `#1877F2`. The same rule applies to any other page-title icon chip.

---

## 7) Avatar palette rule (D5)

The portrait generator's background list is replaced wholesale. Banned: any background with HSL lightness <55%, relative luminance <0.30, or RGB channel sum <300 (kills every near-black/navy/charcoal disc).

```ts
export const AVATAR_BG = [
 "#F6C177","#F2A65A","#EE8F8F","#E7A6C9","#C4A7E0","#93C6DE",
 "#82BFAE","#A9C97E","#F0D060","#EFAE6B","#D9A05B","#BFD16D",
] as const;
export const avatarBg = (id:string) => AVATAR_BG[fnv1a(id + ":bg") % AVATAR_BG.length];
```

Rules: background index uses its own seed suffix (`":bg"`) so face/hair/clothing seeds are untouched. Clothing keeps its existing deep palette, with one guard: if a clothing colour's lightness is within 12 points of the chosen background's lightness, advance the clothing index by 2. Every avatar (any size, any surface) also carries `box-shadow: inset 0 0 0 1px rgba(0,0,0,.08)` so light pastels stay defined on white. Story rings, contact discs and comment avatars all read as coloured discs — a black or near-black avatar disc anywhere is a §10 failure.

---

## 8) Home structure decision (D7)

### 8.1 Layout grid

```css
.home-layout{display:grid; justify-content:center; align-items:start;
  gap:24px; padding:16px 16px 48px; max-width:1280px; margin:0 auto;}
@media (min-width:1280px){ .home-layout{grid-template-columns:300px minmax(0,500px) 320px;} }
@media (min-width:1100px) and (max-width:1279px){ .home-layout{grid-template-columns:minmax(0,500px) 320px;} .home-rail-left{display:none;} }
@media (max-width:1099px){ .home-layout{grid-template-columns:minmax(0,500px);} .home-rail-left,.home-rail-right{display:none;} }
@media (max-width:700px){ .home-layout{padding:8px 0 32px;} .home-feed{width:100%;} }
.home-feed{width:min(500px,100%); display:flex; flex-direction:column; gap:16px;}
.home-rail-left,.home-rail-right{position:sticky; top:72px; height:calc(100dvh - 88px);
  overflow-y:auto; scrollbar-width:none; display:flex; flex-direction:column; gap:16px;}
.home-rail-left::-webkit-scrollbar,.home-rail-right::-webkit-scrollbar{display:none;}
```

### 8.2 Feed column order (the decision)
1. Stories rail (§4)
2. Composer (unchanged)
3. Posts 1–3
4. **Explore Jolchhaya strip** — only below 1280px (`display:none` at ≥1280px, rails carry it): horizontal snap-scroll of 4 cards, 148×104px, `border-radius:12px`, image thumb top (F01 river, F04 dawn, citizens collage = S03 crop, F03 festival), icon + label bottom-left over the §4 bottom gradient. Destinations: Town → `#town`, Citizens → `#citizens`, Groups → `/groups`, Episodes → `#episodes`.
5. Posts 4–6
6. Expanded-posts container (posts 7+ when revealed)
7. "See more posts" control / "You're up to date in Jolchhaya" end-divider (with `waves` glyph)
8. `#town` section
9. `#citizens` section
10. `#episodes` section

**Paging:** a client `FeedPager` receives all 24 posts serialised plus the three sections as server-rendered children, renders `visibleCount = 6` post articles, and the button reveals +6 per click (6 → 12 → 18 → 24). Button: full feed width, 40px, `background:#E4E6EB; border-radius:6px; font-weight:600`, label exactly `See more posts (N remaining)`, `aria-expanded` tracking state. At 24 it is replaced by the end-divider. Expanded posts insert **above** the button; sections 8–10 are always in the DOM (anchors always work) and always sit after the button. Post articles carry `data-post-card`.

**Initial mobile document height target: ≤6,200px at 390px wide** (from ~16,000px).

### 8.3 Rails (desktop)
- **Left rail (≥1280px only):** shortcut list — Home, Town (`#town`), Citizens (`#citizens`), Groups (`/groups`), Episodes (`#episodes`) — each row 40px+, existing SVG icon 24px + 15px label, hover `#E4E6EB` radius 8.
- **Right rail:** (1) Town snapshot card — F02 image 100%×150px radius 8 top, three stat rows from existing data (citizens count, places count = 8, posts count), whole card anchors to `#town`; (2) Citizens card — first 8 citizens as 40px avatar + name rows linking to their existing profile hrefs, footer row anchors to `#citizens`; (3) Featured card — F01–F04 items per §5.3 anchoring to `#episodes`; (4) footer line `Deep Dark Social · Jolchhaya` 12px `#65676B`, no external links.

### 8.4 Town / Citizens / Episodes sections (restyled, moved, content unchanged)
- **Town:** one white card, C08 (ghat) panorama 16:9 top, stat chips row (24 citizens · 8 places · current Day/tick from existing data), existing town copy below. 
- **Citizens:** white card, grid of citizen tiles (2 cols mobile, 4 cols ≥701px): 64px avatar, name 15px/600, place line 13px `#65676B`. Shows 8 tiles; a `See all 24 citizens` 40px secondary button expands the same grid in place to all 24 (client toggle), label then `Show fewer`.
- **Episodes:** white card, episode cards in existing order with §5.3 16:9 thumbnails (F01–F03 assigned in order, F04 for a fourth if present), existing titles/metas/destinations untouched.

Existing section copy, data and link destinations do not change — only position, imagery, and the citizens cap change.

---

## 9) Micro-polish list

1. **Tokens:** `--fb-blue:#1877F2; --page:#F0F2F5; --text:#050505; --text2:#65676B; --divider:#CED0D4; --hover:#F2F2F2; --hover2:#E4E6EB;` card shadow `0 1px 2px rgba(0,0,0,.11)`; card radius 8px. `color-scheme: light` on `:root` (no forced-dark inversion).
2. **Focus:** every interactive element gets `:focus-visible{outline:2px solid #1877F2; outline-offset:2px; border-radius:inherit;}`. No `outline:none` without this replacement.
3. **Tap targets:** all buttons/icon-buttons/rail rows ≥40×40px at every width; post action bar buttons ≥44px tall on ≤700px, ≥36px above. Icon buttons get `active{transform:scale(.96)}` on touch.
4. **Hover (only `@media (hover:hover)`):** buttons → `--hover2`; list/rail rows → `--hover`; post author name → underline; media/story/featured images → `scale(1.03–1.05)` inside their `overflow:hidden` frames; cards get no lift (Facebook stays flat).
5. **Inputs:** `font-size:16px` at ≤700px on search, composer and comment inputs (prevents iOS zoom); desktop 15px. `-webkit-tap-highlight-color:transparent` globally.
6. **Text safety:** post text `white-space:pre-wrap; overflow-wrap:anywhere`; names/place labels single-line ellipsis in rows, two-line clamp in story cards; Bengali/English mixed strings inherit the existing system font stack — no webfont is added.
7. **Post card rhythm:** 16px vertical gap between feed cards (12px mobile); media touches card edges; action bar top border `1px solid var(--divider)`; liked state = filled blue thumb + blue label (existing logic, visual only).
8. **Badges/dots:** notification badge = red `#E41E3F`, white 11px/700, min 18px pill, positioned `top:-4px; right:-4px` on the bell button; unread notification dot 8px `#1877F2`.
9. **Skeletons:** only media frames skeletonise (§3.5 placeholder). No full-page skeleton is added. `prefers-reduced-motion` disables the panel animation, image scales and fades.
10. **Images:** `decoding="async"` everywhere; avatars are inline SVG (no change); no image may render without a reserved aspect box (§3.5, §4, §5) — CLS from media must be zero.
11. **D6 double-check:** after §6.4, no page-title icon chip anywhere pairs a dark glyph with a coloured background; glyphs on coloured chips are white.
12. **Test hooks added:** `data-testid` on header-right, panels, profile cover/avatar, stories rail, `data-post-card` on post articles, `data-content-text` on post body text. No logic attaches to them.
13. **Scroll behaviour:** `html{scroll-behavior:smooth}` for anchor jumps (#town etc.) with `scroll-margin-top:72px` on those sections so the fixed header never covers their headings; disabled under `prefers-reduced-motion`.

---

## 10) Zero-bug verification checklist

Run in a real browser, production build, at **360, 390, 768, 1280px** (device emulation + one real phone pass at its native width). Reset localStorage before interaction tests. Every box must pass at **both** 390 and 1280 unless a width is stated. Record screenshots: header-with-each-panel-open (390 + 1280), profile top (390 + 1280), home top/mid/bottom (390 + 1280).

### 10.1 Global geometry (every page, top and bottom of scroll)
- [ ] `document.documentElement.scrollWidth <= window.innerWidth` — no horizontal overflow anywhere.
- [ ] Header rect: `left:0, right:innerWidth, height:56`. Header-right rect (`[data-testid="header-right"]`): `right === innerWidth-8` at 360/390, `right === innerWidth-16` at 768/1280; `left >= 0`.
- [ ] Console: zero errors, zero failed network requests; every `<img>` on screen has `naturalWidth > 0`.

### 10.2 Header panels — the D1 regression (repeat at 360, 390, 768, 1280)
- [ ] Account panel rect: `left >= 8` (360/390) / `left >= 16` (768/1280), `right <= innerWidth-8` / `innerWidth-16` respectively, `top === 52`, `bottom <= innerHeight-8`. At 390 specifically: `left >= 8 && right <= 382` — fully readable, no off-screen slab (owner's screenshot case).
- [ ] Menu and Notifications panels: identical bounds assertions.
- [ ] Search results: desktop — `left` equals search box left, `right <= innerWidth-16`; mobile — after tapping search icon, bar spans `left:0/right:innerWidth` at `top:56`, results `left:8, right:innerWidth-8, top:108`.
- [ ] Each panel: opens on tap, closes on outside tap, on `Escape`, on item selection; only one open at a time; notification badge number equals the unread items rendered inside; focus lands in the panel on open and returns to its trigger on close.
- [ ] Centre nav visible at 768/1280, absent at 360/390, with the right cluster still flush right at 390 (grid fix, §1.2).

### 10.3 Pages (open each; scroll in `innerHeight*0.8` steps to bottom and back)
- [ ] **Welcome** — renders, no password field, no overflow, primary CTA tappable (≥40px).
- [ ] **Home** — §10.4; rails: at 