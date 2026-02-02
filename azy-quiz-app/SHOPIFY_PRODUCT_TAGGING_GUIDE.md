# AZYR Product Tagging Guide
**Complete Reference for Tagging Eyewear Products**

---

## Quick Reference: Tag Format

All tags follow this format: **`category:value`**

Examples:
- ✅ `face_shape:oval`
- ✅ `material:wire`
- ❌ `oval face` (wrong format)
- ❌ `Face Shape: Oval` (wrong - use lowercase, underscores)

---

## TABLE OF CONTENTS

1. [Face Shape Guidelines](#1-face-shape-guidelines)
2. [Material Guidelines](#2-material-guidelines)
3. [Frame Style Guidelines](#3-frame-style-guidelines)
4. [Use Case Guidelines](#4-use-case-guidelines)
5. [Lens Preference Guidelines](#5-lens-preference-guidelines)
6. [Complete Tagging Examples](#6-complete-tagging-examples)
7. [Quick Tagging Checklist](#7-quick-tagging-checklist)

---

## 1. FACE SHAPE GUIDELINES

### Which Frames Work for Which Face Shapes?

| Face Shape | Best Frame Styles | Frame Characteristics |
|------------|-------------------|----------------------|
| **Heart** | Cat-eye, Round, Oval | Bottom-heavy frames balance wider forehead |
| **Oval** | **ANY style** | Lucky! Almost any frame works |
| **Round** | Rectangle, Square, Wayfarer | Angular frames add contrast |
| **Square** | Round, Oval, Cat-eye | Curved frames soften strong jawline |
| **Rectangle** | Round, Oval, Aviator | Curved frames balance long face |
| **Triangle** | Cat-eye, Round, Oval | Emphasize brow line, balance narrow chin |
| **Universal** | **Frames that work on everyone** | Classic shapes, versatile proportions |

### Face Shape Tagging Rules

```
face_shape:heart      → Brow-heavy frames, cat-eyes, rounds
face_shape:oval       → Any frame (oval faces are versatile)
face_shape:round      → Angular frames (rectangular, square, wayfarer)
face_shape:square     → Curved frames (round, oval, cat-eye)
face_shape:rectangle  → Curved frames (round, oval, aviator)
face_shape:triangle   → Brow-emphasizing frames (cat-eye, round)
face_shape:universal  → Frames that work on most face shapes
```

### How to Choose Face Shape Tags

**Ask yourself:**
- Would this frame look good on a heart-shaped face?
- Would this frame look good on a round face?
- Would this frame look good on ANY face shape?

**If yes to all** → Add `face_shape:universal` (and maybe 1-2 specific shapes)

**If selective** → Add only the face shapes it genuinely complements

---

## 2. MATERIAL GUIDELINES

### Material Types

| Tag | When to Use | Examples |
|-----|-------------|----------|
| `material:wire` | Thin metal frames, rimless, semi-rimless | Gold wire aviators, silver rimless frames |
| `material:acetate` | Thick plastic frames, bold colors | Black wayfarers, tortoise cat-eyes |
| `material:mixed` | Combination of metal + plastic | Metal frame with acetate temples |

### Material Tagging Rules

```
material:wire    → Metal frames (gold, silver, gunmetal, etc.)
material:acetate → Plastic/acrylic frames (tortoise, solid colors, patterns)
material:mixed   → Metal front + acetate temples, or vice versa
```

**Quick Test:**
- Is the frame thin and metallic? → `material:wire`
- Is the frame thick and plastic? → `material:acetate`
- Is it a combination? → `material:mixed`

---

## 3. FRAME STYLE GUIDELINES

### Frame Style Categories

| Style | Description | Key Characteristics |
|-------|-------------|---------------------|
| **Aviator** | Teardrop-shaped, double bridge | Classic pilot shape, usually wire |
| **Rectangle** | Rectangular lenses, straight top | Clean lines, professional look |
| **Square** | Equal width/height, bold corners | Strong, confident statement |
| **Wayfarer** | Trapezoidal, thick acetate | Classic 1950s style, bold |
| **Cat-eye** | Upswept outer corners | Vintage feminine, dramatic |
| **Round** | Circular lenses | John Lennon style, retro |
| **Oversized** | Larger than standard fit | Dramatic, celebrity-style |

### Style Tagging Rules

```
style:aviator    → Teardrop shape, double bridge, pilot-style
style:rectangle  → Rectangular, slightly longer than wide
style:square     → Roughly equal width and height, angular
style:wayfarer   → Trapezoidal, thick acetate, tapered corners
style:cat_eye    → Upswept outer corners, vintage feminine
style:round      → Circular or near-circular lenses
style:oversized  → Larger-than-average frames
```

**How to Choose:**
- Look at the lens shape first
- Consider the frame profile
- If uncertain, choose the dominant characteristic

---

## 4. USE CASE GUIDELINES

### When Would Someone Wear These Frames?

| Use Case | Description | Frame Characteristics |
|----------|-------------|---------------------|
| **Day** | Everyday daytime wear | Neutral colors, versatile styles |
| **Night** | Evening events, dinners | Darker colors, bolder styles |
| **Going Out** | Parties, events, social | Statement frames, eye-catching |
| **Casual** | Relaxed, everyday comfort | Simple styles, lightweight |
| **Sport** | Active, outdoor activities | Durable, secure fit, polarized |
| **At Desk** | Computer work, office | Blue light blocking, comfortable |
| **Versatile** | Works for multiple occasions | Classic styles, neutral colors |

### Use Case Tagging Rules

```
use:day        → Bright colors, neutral tones, everyday styles
use:night      → Dark frames, bold colors, statement pieces
use:going_out  → Eye-catching, unique, conversation-starters
use:casual     → Simple, comfortable, understated
use:sport      → Durable, rubberized, polarized options
use:at_desk    → Blue light available, comfortable for long wear
use:versatile  → Classic styles that work anywhere
```

**Quick Test:**
- Would you wear this to the office? → `use:day` or `use:at_desk`
- Would you wear this to a party? → `use:going_out` or `use:night`
- Would you wear this hiking/beach? → `use:sport`
- Does this work for everything? → `use:versatile`

---

## 5. LENS PREFERENCE GUIDELINES

### What Lens Options Does This Frame Offer?

| Lens Tag | When to Use | Description |
|----------|-------------|-------------|
| `lens:polarized` | Frame available with polarization | Reduces glare, great for driving/outdoors |
| `lens:custom` | Tinting/customization available | Can be made with colored tints |
| `lens:tinted` | Comes with colored tint options | Gradient, solid, or fashion tints |
| `lens:rx_ready` | Can accommodate prescription | Standard Rx compatibility |
| `lens:blue_light` | Blue light blocking available | For computer/digital eye strain |
| `lens:standard` | Basic lens option available | Standard clear or sunglass tint |

### Lens Tagging Rules

```
lens:polarized  → Offered with polarization (usually sunglasses)
lens:custom     → Can be customized (tints, coatings, etc.)
lens:tinted     → Comes with fashion/gradient tints
lens:rx_ready   → Prescription lenses can be added
lens:blue_light → Blue light blocking option available
lens:standard   → Basic clear or standard tint only
```

**Important:** Add ALL lens options available for this frame
- If it has polarized AND prescription → Add both tags
- If it's just basic sunglasses → Add `lens:standard`

---

## 6. COMPLETE TAGGING EXAMPLES

### Example 1: Classic Gold Wire Aviators

**Product:** Vintage Gold Wire Aviator Sunglasses
**Image:** Thin gold wire frame, teardrop lenses, double bridge

**Tags to add:**
```
face_shape:oval
face_shape:heart
face_shape:square
material:wire
style:aviator
use:day
use:casual
use:sport
lens:polarized
lens:rx_ready
```

**Why:**
- Works on oval, heart, square faces (classic aviator shape)
- Wire material (gold metal)
- Aviator style (teardrop, double bridge)
- Great for day, casual, sport use
- Available polarized and prescription-ready

---

### Example 2: Bold Black Tortoise Cat-Eye

**Product:** Vintage Black Tortoise Cat-Eye Frames
**Image:** Thick acetate, upswept corners, bold style

**Tags to add:**
```
face_shape:round
face_shape:heart
face_shape:triangle
material:acetate
style:cat_eye
use:going_out
use:night
lens:rx_ready
lens:blue_light
lens:custom
```

**Why:**
- Complements round, heart, triangle faces (balances features)
- Acetate material (thick plastic)
- Cat-eye style (upswept corners)
- Statement piece for going out, evening
- Prescription, blue light, and custom options available

---

### Example 3: Universal Round Metal Frames

**Product:** Classic Round Metal Frames
**Image:** Simple round wire frames, minimal design

**Tags to add:**
```
face_shape:universal
material:wire
style:round
use:versatile
lens:rx_ready
lens:blue_light
lens:standard
```

**Why:**
- Universal face shape (simple round works on everyone)
- Wire material (thin metal)
- Round style (circular lenses)
- Versatile for any occasion
- Basic lens options only

---

### Example 4: Bold Acetate Wayfarers

**Product:** Bold Black Acetate Wayfarer Sunglasses
**Image:** Thick black acetate, trapezoidal shape

**Tags to add:**
```
face_shape:round
face_shape:oval
material:acetate
style:wayfarer
use:casual
use:going_out
lens:polarized
lens:tinted
```

**Why:**
- Works on round, oval faces (angular contrast)
- Acetate material (thick plastic)
- Wayfarer style (trapezoidal, tapered)
- Casual and going_out appropriate
- Polarized and tinted options

---

## 7. QUICK TAGGING CHECKLIST

### Before Tagging Any Product:

#### Step 1: Examine the Frame
- [ ] What material is it made of? (wire/acetate/mixed)
- [ ] What is the lens shape? (aviator/rectangle/square/wayfarer/cat_eye/round/oversized)

#### Step 2: Consider Face Shapes
- [ ] Would this suit a heart face?
- [ ] Would this suit an oval face?
- [ ] Would this suit a round face?
- [ ] Would this suit a square face?
- [ ] Would this suit a rectangle face?
- [ ] Would this suit a triangle face?
- [ ] Does it work on everyone? (mark as universal)

#### Step 3: Determine Use Cases
- [ ] Is this everyday/daytime wear?
- [ ] Is this for evenings/nights out?
- [ ] Is this for parties/events?
- [ ] Is this casual/relaxed?
- [ ] Is this for sports/activities?
- [ ] Is this for computer work?
- [ ] Does it work everywhere? (mark as versatile)

#### Step 4: Check Lens Options
- [ ] Polarized available?
- [ ] Custom tints available?
- [ ] Comes with tints?
- [ ] Prescription-ready?
- [ ] Blue light blocking?
- [ ] Standard/basic only?

#### Step 5: Apply Tags in Shopify
1. Go to Products → All products
2. Click the product
3. Scroll to Tags section
4. Type each tag and press Enter
5. Click Save

---

## COMMON MISTAKES TO AVOID

❌ **WRONG:**
- `oval face` (missing category prefix)
- `Face Shape:Oval` (using spaces and capital letters)
- `face_shape: Oval` (space after colon)
- `material:metal` (not a valid tag)

✅ **RIGHT:**
- `face_shape:oval`
- `face_shape:oval`
- `face_shape:oval`
- `material:wire` or `material:acetate`

---

## NEED HELP?

### Quick Decision Tree:

**Not sure about face shape?**
- Is it a simple, classic shape? → `face_shape:universal`
- Is it bold and dramatic? → `face_shape:round`, `face_shape:heart` (balances features)
- Is it angular and sharp? → `face_shape:round`, `face_shape:oval` (adds contrast)

**Not sure about material?**
- Can you bend the frame easily? → `material:wire`
- Is it thick and rigid? → `material:acetate`
- Both? → `material:mixed`

**Not sure about use case?**
- Classic and simple? → `use:versatile`
- Bold and colorful? → `use:going_out`
- Dark and dramatic? → `use:night`

**Not sure about lens options?**
- Check the product description
- Check the lens options dropdown
- When in doubt, add `lens:standard` and `lens:rx_ready`

---

## PRINTABLE CHEAT SHEET

```
┌─────────────────────────────────────────────────────────────┐
│  AZYR PRODUCT TAGGING CHEAT SHEET                          │
├─────────────────────────────────────────────────────────────┤
│  FACE SHAPES:                                              │
│  □ heart    □ oval     □ round    □ square                 │
│  □ rectangle □ triangle □ universal                          │
├─────────────────────────────────────────────────────────────┤
│  MATERIALS:                                                │
│  □ wire      □ acetate   □ mixed                           │
├─────────────────────────────────────────────────────────────┤
│  STYLES:                                                   │
│  □ aviator   □ rectangle □ square   □ wayfarer              │
│  □ cat_eye   □ round     □ oversized                        │
├─────────────────────────────────────────────────────────────┤
│  USE CASES:                                                │
│  □ day       □ night     □ going_out □ casual               │
│  □ sport     □ at_desk   □ versatile                        │
├─────────────────────────────────────────────────────────────┤
│  LENSES:                                                   │
│  □ polarized □ custom    □ tinted   □ rx_ready              │
│  □ blue_light □ standard                                    │
└─────────────────────────────────────────────────────────────┘

TAG FORMAT: category:value  (example: face_shape:oval)
```

---

*Last Updated: January 2025*
*Questions? Contact the team lead or refer to product descriptions*
