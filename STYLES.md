# Job Hunt — UI Styles & Creative Direction

**Purpose:** Visual reference for the Job Hunt MVP interface and 3D browser game.  
**Reference direction:** Colorful, friendly basketball arcade UI with bold rounded panels, playful character art, a warm urban court, and highly visible gameplay HUD.  
**Implementation stack:** React, TypeScript, Vite, Three.js, optional React Three Fiber, Supabase.

This document is a creative direction, not a pixel-perfect recreation of the reference screenshots. Use the screenshots to understand the energy, contrast, hierarchy, and arcade feel. Adapt all components to Job Hunt's career-themed gameplay.

---

## 1. Design Principles

### Playful, not childish
Use a cheerful arcade visual language with confident colors, rounded shapes, expressive character art, and punchy feedback. Keep the layout polished enough to feel like a real product.

### Gameplay first
The basketball court and player action are the visual focus. UI should explain the next action without covering the character, ball trajectory, or target hoop.

### Strong hierarchy
Players should be able to identify these items at a glance:
1. Current state: unemployed, employed, or on a break.
2. Primary action: Apply to Jobs, Continue Working, or Resume Work.
3. Current company/role when employed.
4. Coin balance.
5. Current shot or assignment feedback.

### Arcade feedback
Successful shots should feel satisfying through a short animation, sound-ready feedback, and a clear result panel. Misses should be understandable and light-hearted rather than punitive.

### Reuse visual language
Use the same card, button, HUD, modal, and feedback patterns throughout the game. Job hunting and working should feel like two modes of the same game.

---

## 2. Color System

The values below are suggested starting tokens sampled conceptually from the reference direction. Adjust after checking contrast in the actual UI.

### Core palette

| Token | Hex | Intended use |
|---|---|---|
| `--color-sunshine` | `#FFE85A` | Bright sky accents, highlights, celebratory surfaces |
| `--color-golden-yellow` | `#FFC629` | Main warm accent, coin highlights, progress accents |
| `--color-orange` | `#FF9F0A` | Basketball court accents, active indicators |
| `--color-coral` | `#F23855` | Primary CTA, modal headers, important feedback |
| `--color-coral-dark` | `#C92C47` | Pressed states, borders/shadows for coral surfaces |
| `--color-cyan` | `#08BFE8` | Secondary action, info, alternate company indicators |
| `--color-cyan-dark` | `#087F9B` | Cyan card depth and pressed state |
| `--color-green` | `#39CF61` | Success, completed work, positive progress |
| `--color-green-dark` | `#22964A` | Success card depth and pressed state |
| `--color-teal` | `#2E7185` | Main secondary surfaces and information cards |
| `--color-teal-dark` | `#174D5C` | Deep teal outlines, card depth, game UI framing |
| `--color-navy` | `#193A46` | HUD background, high-contrast text on light surfaces |
| `--color-ink` | `#102F3A` | Primary text on light backgrounds |
| `--color-paper` | `#FFFFFF` | Modal surfaces, cards, light panels |
| `--color-cloud` | `#F4F7F7` | Secondary light surfaces |
| `--color-muted` | `#D9E4E5` | Dividers, disabled surfaces, subtle outlines |
| `--color-success` | `#22964A` | Success text and states |
| `--color-warning` | `#E78A00` | Warning and pending states |
| `--color-danger` | `#C92C47` | Destructive actions and errors |

### Suggested CSS tokens

```css
:root {
  --color-sunshine: #FFE85A;
  --color-golden-yellow: #FFC629;
  --color-orange: #FF9F0A;
  --color-coral: #F23855;
  --color-coral-dark: #C92C47;
  --color-cyan: #08BFE8;
  --color-cyan-dark: #087F9B;
  --color-green: #39CF61;
  --color-green-dark: #22964A;
  --color-teal: #2E7185;
  --color-teal-dark: #174D5C;
  --color-navy: #193A46;
  --color-ink: #102F3A;
  --color-paper: #FFFFFF;
  --color-cloud: #F4F7F7;
  --color-muted: #D9E4E5;
}
```

### Color usage rules

- Use coral for the main action and important modal headers.
- Use cyan for secondary actions, informational cards, or a distinct company category.
- Use green for successful shots, completed assignments, and positive progress.
- Use yellow/orange for coins, active gameplay accents, and celebratory details.
- Use teal/navy for HUDs, labels, outlines, and dark surfaces.
- Use white for settings, confirmation dialogs, and readable content panels.
- Do not use all bright colors at equal intensity in one screen. Pick one dominant accent and one supporting accent per screen.
- Do not rely on color alone for status; pair color with text and/or an icon.

---

## 3. Typography

### Direction
Use a bold, rounded, friendly sans-serif with a game-like personality. The reference uses chunky display lettering; Job Hunt should retain that energy while keeping smaller interface text highly readable.

### Recommended font stack

Prefer a licensed, web-safe or project-approved font. Suggested direction:
- **Display / headings:** `Baloo 2`, `Nunito`, or another rounded display sans-serif.
- **Body / UI:** `Nunito Sans`, `Nunito`, or a clear system sans-serif.
- **Fallback:** `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

If using an external font, include only the weights needed and provide a system fallback. Do not block the game from loading while waiting for a font.

### Type scale

| Style | Desktop size | Weight | Use |
|---|---:|---:|---|
| Game distance / key metric | 44–64 px | 800–900 | Current target distance, major score |
| Screen title | 32–40 px | 800–900 | Settings, Leaderboard, Job Offer |
| Section heading | 22–28 px | 750–850 | Current job, company, assignment |
| Primary button | 18–22 px | 800 | Main actions |
| Body | 16–18 px | 600–700 | Instructions and status copy |
| Supporting text | 14–16 px | 500–650 | Explanations and metadata |
| HUD labels | 12–14 px | 700–800 | Compact status labels |

On small screens, scale display and screen headings down with `clamp()` rather than allowing text to overflow.

### Typography rules
- Keep gameplay instructions short.
- Use sentence case for most UI copy; reserve uppercase for short status labels and arcade emphasis.
- Avoid long all-caps paragraphs.
- Use tabular numerals for coin balances, distance, and rankings when available.
- Keep text on colored cards high-contrast.

---

## 4. Shape, Spacing, and Layout

### Corner radii

| Token | Value | Use |
|---|---:|---|
| `--radius-sm` | `8px` | Inputs, small tags |
| `--radius-md` | `14px` | Compact cards and HUD items |
| `--radius-lg` | `20px` | Main cards, buttons, settings panels |
| `--radius-xl` | `28px` | Large dialogs and hero panels |
| `--radius-pill` | `999px` | Status pills, coin chips, compact badges |

Favor generously rounded corners like the reference. Do not make every element pill-shaped; use pills for small status or count elements only.

### Spacing scale

Use a consistent 4 px base scale:
- `4px` — micro spacing
- `8px` — tight spacing
- `12px` — compact spacing
- `16px` — standard spacing
- `24px` — card padding / section gaps
- `32px` — major group spacing
- `48px` — large layout separation

### Layout principles
- Keep the game canvas dominant.
- Place compact HUD elements near the edges, where they do not block the player or hoops.
- Use a left-side panel for optional upgrades only if future scope introduces upgrades; do not reproduce the reference's strength/speed/bounce upgrade panel in the MVP.
- Use right-side cards sparingly for job details or current assignment information.
- On mobile, collapse secondary panels into compact overlays or drawers.
- Avoid placing essential text over visually busy skyline or fence textures unless a solid translucent panel provides sufficient contrast.

---

## 5. Elevation, Borders, and Button Depth

The reference uses bold outlines and a darker lower edge to make controls feel tactile.

### Surface treatment
- Use a clean fill color.
- Add a 2–3 px darker border or a short bottom edge for prominent arcade buttons.
- Use a restrained shadow to lift cards from the background.
- Reserve stronger shadows for primary CTAs, modal panels, and floating HUD elements.
- Avoid large blurry shadows that reduce clarity.

Suggested CSS:

```css
.arcade-button {
  border: 0;
  border-radius: var(--radius-lg);
  box-shadow: 0 5px 0 var(--button-depth, var(--color-teal-dark));
  transform: translateY(0);
  transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease;
}

.arcade-button:active {
  transform: translateY(3px);
  box-shadow: 0 2px 0 var(--button-depth, var(--color-teal-dark));
}

.arcade-card {
  border-radius: var(--radius-lg);
  border: 2px solid rgba(16, 47, 58, 0.08);
  box-shadow: 0 5px 0 rgba(16, 47, 58, 0.14);
}
```

Do not use motion as the only indicator of interaction. Respect `prefers-reduced-motion`.

---

## 6. Component Styling

### Primary CTA
- Coral fill (`#F23855`) with a deeper coral bottom edge.
- White, bold label.
- Large touch target (minimum 44 × 44 px; preferably taller for the main game CTA).
- Clear hover, focus, pressed, loading, and disabled states.

Examples:
- Apply to Jobs
- Continue Working
- Accept Job

### Secondary CTA
- Teal or cyan fill, with a darker depth edge.
- White bold label.
- Used for non-destructive secondary actions.

Examples:
- View Leaderboard
- Customize Character
- Keep Looking

### Destructive action
- Use a clear danger treatment, but avoid making the destructive action visually dominant.
- Require confirmation before quitting a job.

### Status cards
Use a colored label and plain-language status:
- **Unemployed** — warm yellow or neutral teal treatment.
- **Employed** — green treatment.
- **On a break** — cyan or warm amber treatment.
- **Application submitted** — teal/cyan treatment.
- **Offer received** — green/coral highlight depending on hierarchy.
- **Assignment complete** — green treatment.
- **Application rejected** — neutral explanatory treatment, not a harsh full-screen error.

Status must include text, not color alone.

### Company / job cards
Each card should show:
- Fictional company name
- Role title
- Difficulty label if needed
- Clear selection action

Use a simple brand-color accent or icon to distinguish companies. Do not create elaborate company logos for the MVP.

### Coin HUD
- Show a coin icon and total earned coins.
- Use a compact dark teal/navy rounded container.
- Use golden yellow for the coin symbol and key numeric highlight.
- Keep the count legible and avoid excessive glow.
- Do not include gems, paid currencies, ads, or store prompts in the MVP.

### Gameplay distance / progress HUD
- Use large, high-contrast text for current target distance or relevant shot status.
- Use a compact horizontal indicator when showing distance or progress.
- The indicator should explain a real game state; do not copy the reference's 200 ft unlock system unless that mechanic is explicitly added later.
- Keep the aiming guide and hoop visible.

### Feedback overlays
For a successful application shot:
- Short positive animation.
- Green or coral-accented feedback panel.
- Copy such as **Application submitted!**
- Clear next action.

For a missed shot:
- Short, non-punitive feedback.
- Copy such as **Not quite — try again.**
- Show remaining attempts.

For work completion:
- **Assignment complete!**
- Display the confirmed coin reward.
- Update the balance only after backend confirmation.

### Modal / settings panel
Inspired by the white, rounded settings dialog in the reference:
- White surface.
- Large rounded corners.
- Coral header band.
- Strong, clear close button.
- Dark teal text.
- Spacious controls with clear labels.
- Dim the game behind the modal with a dark translucent overlay.
- Ensure modal content fits on small screens and is keyboard accessible.

Use settings for sound, vibration where supported, and basic preferences only. Do not add unrequested settings.

### Tooltip / speech bubble
Use sparingly for first-time instructions and character feedback:
- White or pale-yellow fill.
- Rounded shape.
- Dark teal text.
- Small pointer/tail only when it clearly points to a target.
- Never use a speech bubble for essential instructions that disappear before the player can read them.

---

## 7. Game Canvas and 3D Art Direction

### Environment
Create a compact, stylized outdoor basketball court with the warmth and layered color of the reference:
- Golden-yellow/orange sky or warm sunset lighting.
- Simplified city skyline silhouettes.
- A readable court surface.
- Stylized fence or court boundary if it does not clutter the scene.
- Teal/navy environmental accents to balance warm backgrounds.
- Clear contrast around the player, ball, and hoops.

Do not recreate the reference screenshot exactly. Build a distinct Job Hunt environment and keep the scene lightweight.

### Character
- Friendly stylized 3D character with a clear silhouette.
- Simple, colorful clothing.
- Idle and throwing animations if feasible.
- A small number of customizable appearance properties supported by the model.
- Keep the face and body readable at typical game viewport sizes.
- Character colors must come from the internal `CharacterAppearance` configuration rather than being hardcoded in multiple places.

### Basketball and CV
- Use an easily recognizable orange basketball with dark seams.
- Represent the CV as a stylized paper/document object with a clear silhouette.
- In job-hunting mode, throw the CV object.
- In working mode, use a visually distinct deliverable object while reusing the same throwing system.
- Avoid detailed text or tiny UI on objects that cannot be read in 3D.

### Hoops and targets
- Make company hoops easy to identify and select.
- Attach a readable company/role label in the interface or a legible world-space label.
- Use a clear target highlight when selected.
- Provide visual feedback for a successful shot.
- Do not hide the target behind UI panels.

### Materials and lighting
- Favor flat or lightly shaded materials with clean color blocks.
- Use modest ambient and directional lighting.
- Avoid expensive real-time shadows, heavy post-processing, and complex reflective materials.
- Keep outlines and depth cues consistent.
- Ensure the character and ball remain visible against the warm background.

### Animation
- Short, responsive motion for aiming, throwing, hit feedback, and rewards.
- Keep camera motion minimal to preserve aim accuracy.
- Respect reduced-motion preferences for UI animation; offer reduced visual effects where practical.
- Never make animation the only source of status information.

---

## 8. Responsive Behavior

### Desktop
- Large game canvas as the main surface.
- Compact coin/status HUD at the top.
- Contextual job or assignment panel near a side edge.
- Keep the character and target hoop unobstructed.
- Dashboard content can use a two-column layout with character preview and status/action card.

### Tablet
- Reduce HUD spacing and panel width.
- Avoid overlapping the hoop and throw trajectory.
- Use a compact top status row.
- Allow contextual panels to collapse.

### Mobile
- Prioritize portrait layout unless testing shows landscape is better for the throwing mechanic.
- Keep touch controls large and reachable.
- Put coins and essential status in a compact top HUD.
- Show company/job details in a bottom sheet or compact card.
- Do not make users drag across obscuring panels.
- Handle safe areas and browser viewport resizing.
- Test actual touch interaction rather than relying only on CSS breakpoints.

Use responsive CSS and adapt the Three.js camera/scene framing at different aspect ratios. Do not simply scale the desktop canvas down until controls become unusable.

---

## 9. Accessibility and Usability

- Maintain readable contrast for text and controls.
- Use text labels as well as icons.
- Provide visible keyboard focus on interface controls.
- Ensure modals can be closed with keyboard interaction and do not trap focus incorrectly.
- Use at least 44 × 44 px touch targets for primary controls where practical.
- Do not use red/green alone to distinguish outcomes.
- Provide short, persistent-enough instructions for aiming and throwing.
- Respect `prefers-reduced-motion`.
- Provide a fallback message if WebGL is unavailable or the scene fails to load.
- Keep loading, error, success, and empty states designed rather than leaving blank areas.

---

## 10. Suggested CSS Token Set

```css
:root {
  /* Color */
  --color-sunshine: #FFE85A;
  --color-golden-yellow: #FFC629;
  --color-orange: #FF9F0A;
  --color-coral: #F23855;
  --color-coral-dark: #C92C47;
  --color-cyan: #08BFE8;
  --color-cyan-dark: #087F9B;
  --color-green: #39CF61;
  --color-green-dark: #22964A;
  --color-teal: #2E7185;
  --color-teal-dark: #174D5C;
  --color-navy: #193A46;
  --color-ink: #102F3A;
  --color-paper: #FFFFFF;
  --color-cloud: #F4F7F7;
  --color-muted: #D9E4E5;

  /* Shape */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-pill: 999px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;

  /* Elevation */
  --shadow-card: 0 5px 0 rgba(16, 47, 58, 0.14);
  --shadow-modal: 0 18px 48px rgba(10, 35, 44, 0.28);

  /* Motion */
  --motion-fast: 120ms;
  --motion-standard: 200ms;
  --motion-slow: 320ms;
}
```

---

## 11. What Not to Copy from the Reference

The screenshots are visual inspiration only. Do not add these unrelated systems to Job Hunt:
- Strength, speed, bounce, or bonus upgrade panels.
- Gems or a second premium currency.
- Ads or rewarded-ad buttons.
- Timed gift rewards.
- Lockers or missions.
- Distance-based character unlocks.
- Any unrequested shop, upgrade, or monetization system.

Use the reference for its color, hierarchy, rounded arcade panels, chunky controls, stylized court, and clear HUD—not for its unrelated gameplay features.

---

## 12. Visual Quality Checklist

Before considering the UI complete, verify:

- [ ] The 3D court is visually warm, playful, and uncluttered.
- [ ] The character, CV/deliverable, and hoops are easy to distinguish.
- [ ] The game canvas remains the primary focus during play.
- [ ] The coin balance is visible but not distracting.
- [ ] Primary actions use a consistent, high-contrast style.
- [ ] Cards and buttons use consistent radii and depth treatment.
- [ ] Success, miss, pending, and error states are understandable without relying on color alone.
- [ ] Modals are readable and accessible on desktop and mobile.
- [ ] Character appearance is driven by configuration and can later map to start.ng.
- [ ] Mobile controls are genuinely usable.
- [ ] No unrelated reference-game features have been introduced.
