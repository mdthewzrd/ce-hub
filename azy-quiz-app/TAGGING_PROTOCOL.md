# AZYR Product Tagging Protocol
## The Rules Behind Every Tag Assignment

This guide explains WHY certain products get certain tags based on eyewear styling principles.

---

## 🎯 Core Principle: Balance & Contrast

**Golden Rule of Eyewear Styling:**
> Frame shape should **contrast** with face shape to create balance.

| Face Shape | Best Frame Shapes | Why? |
|------------|------------------|------|
| **Round** | Angular frames (square, rectangle, wayfarer) | Adds definition and structure to soft curves |
| **Square** | Rounded frames (round, oval, cat-eye) | Softens strong jawline and angles |
| **Oval** | **Everything works** | Balanced proportions - most versatile |
| **Heart** | Bottom-heavy, wider-than-forehead (cat-eye, wayfarer, square) | Balances wider forehead, narrows chin |
| **Diamond** | Oval, cat-eye, rimless | Softens high cheekbones, balances width |
| **Triangle/Base-down** | Top-heavy, detailed browline (aviator, cat-eye, wayfarer) | Adds width to forehead, balances jaw |

---

## 1. STYLE TAGS (style:)

### Frame Shape Detection Rules

**style:aviator**
- ✅ Teardrop lens shape
- ✅ Double bridge
- ✅ Often has a brow bar
- Examples: Classic Ray-Ban Aviator, pilot sunglasses

**style:cat_eye**
- ✅ Upswept outer corners
- ✅ Often decorative/temples
- ✅ 1950s-1960s vintage aesthetic
- Examples: Marilyn Monroe style, vintage glamour

**style:round**
- ✅ Perfect circular or near-circular lenses
- ✅ John Lennon style
- ✅ Often thin wire frames
- Examples: Circle glasses, Harry Potter style

**style:rectangle**
- ✅ Elongated horizontal shape
- ✅ Longer than wide
- ✅ Clean, minimal lines
- Examples: Sport sunglasses, modern minimalist

**style:square**
- ✅ Equal or nearly equal width/height
- ✅ Bold, geometric shape
- ✅ Strong angular lines
- Examples: Bold thick frames, wayfarer-style squares

**style:wayfarer**
- ✅ Trapezoidal shape (wider at top)
- ✅ Thick acetate frames
- ✅ Slightly angled outer corners
- Examples: Ray-Ban Wayfarer classic

---

## 2. MATERIAL TAGS (material:)

### Material Detection Rules

**material:wire**
- ✅ Thin metal frames you can see through
- ✅ Lightweight, flexible
- ✅ Gold, silver, bronze, copper, titanium colors
- ✅ Often "half-rim" or "rimless"
- Examples: Gold wire aviators, titanium rimless

**material:acetate**
- ✅ Thick, solid frames
- ✅ Cannot see through the frame material
- ✅ Plastic, cellulose acetate, tortoiseshell
- ✅ Bold colors and patterns
- Examples: Black thick frames, tortoiseshell cat-eyes

---

## 3. VIBE TAGS (vibe:)

### Aesthetic Detection Rules

**vibe:retro**
- ✅ Decade keywords: 70s, 80s, 90s, vintage
- ✅ Classic shapes from past eras
- ✅ Nostalgic aesthetic
- Examples: 1990s aviators, 1980s wayfarers

**vibe:modern**
- ✅ Minimalist design
- ✅ Clean lines, no decoration
- ✅ Contemporary materials
- ✅ Sleek, simple
- Examples: Thin metal frames, rimless designs

**vibe:luxury**
- ✅ Designer brands: Chanel, Gucci, Dior, etc.
- ✅ Premium materials: titanium, gold
- ✅ High price point ($200+)
- ✅ Sophisticated aesthetic
- Examples: Designer frames, gold-plated wire

**vibe:edgy**
- ✅ Unusual shapes
- ✅ Bold colors (bright red, neon)
- ✅ Thick, dramatic frames
- ✅ Statement pieces
- Examples: Oversized squares, bright colors

**vibe:corporate**
- ✅ Subtle, professional
- ✅ Neutral colors (black, brown, silver)
- ✅ Conservative shapes
- ✅ Office-appropriate
- Examples: Simple wire aviators, brown rectangles

**vibe:trendy**
- ✅ Fashion-forward
- ✅ Current style keywords
- ✅ Influenced by fashion
- ✅ Statement but wearable
- Examples: Colored frames, current trends

**vibe:classic**
- ✅ Timeless designs
- ✅ Never go out of style
- ✅ Traditional shapes
- ✅ Elegant, refined
- Examples: Wayfarer, aviator, round wire

**vibe:athletic**
- ✅ Sport/active use
- ✅ Performance features
- ✅ Rubberized grips
- ✅ Polarized lenses common
- Examples: Oakley-style sport frames

**vibe:street**
- ✅ Urban aesthetic
- ✅ Casual, everyday wear
- ✅ Influenced by street culture
- ✅ Accessible pricing
- Examples: Bold casual frames, streetwear style

---

## 4. FACE SHAPE TAGS (face_shape:)

### Compatibility Matrix

| Frame Style | Best Face Shapes | Why It Works |
|-------------|------------------|--------------|
| **aviator** | oval, heart, square, triangle | Teardrop adds softness to angular faces; top-heavy balances heart/triangle |
| **cat_eye** | oval, round, diamond | Upswept corners lift round faces; balances diamond cheekbones |
| **round** | square, heart, triangle | Circular shape softens angular faces; adds contrast to strong features |
| **rectangle** | oval, round, heart | Elongated shape stretches round faces; adds structure |
| **square** | oval, round, heart | Angular shape provides contrast to soft features |
| **wayfarer** | oval, round, heart | Trapezoidal shape adds balance; top-heavy suits heart shapes |

### Face Shape Tagging Rules:

**Default Rule:**
> When uncertain, always include: `face_shape:oval, face_shape:heart, face_shape:square`

**Specific Rules:**

**For Angular Frames (square, rectangle, wayfarer):**
```
face_shape:oval      ✅ (balanced proportions)
face_shape:round     ✅ (softens angles)
face_shape:heart     ✅ (adds structure)
```

**For Rounded Frames (round, oval, cat-eye):**
```
face_shape:oval      ✅ (versatile)
face_shape:square    ✅ (adds contrast)
face_shape:heart     ✅ (balances width)
face_shape:diamond   ✅ (for cat-eye specifically)
```

**For Aviators:**
```
face_shape:oval        ✅ (classic choice)
face_shape:heart       ✅ (top-heavy balances)
face_shape:square      ✅ (softens angles)
face_shape:triangle    ✅ (adds width to forehead)
```

---

## 5. LENS TAGS (lens:)

### Lens Detection Rules

**lens:polarized**
- ✅ Explicitly mentions "polarized"
- ✅ Outdoor/sport use
- ✅ Glare reduction mentioned

**lens:rx**
- ✅ "Prescription available"
- ✅ "RX-ready"
- ✅ "Can be made with prescription"
- ✅ Optical frames (not just sunglasses)

**lens:blue_light**
- ✅ "Blue light blocking"
- ✅ "Computer glasses"
- ✅ "Screen protection"
- ✅ "Digital eye strain"

**lens:tinted**
- ✅ "Tinted lenses"
- ✅ "Gradient"
- ✅ "Colored lenses"
- ✅ Specific colors mentioned (green, brown, rose)

**lens:custom**
- ✅ "Interchangeable lenses"
- ✅ "Photochromic" (Transitions)
- ✅ "Customizable"
- ✅ Multiple lens options

---

## 🎯 Quick Reference: Tag Combinations by Frame Type

### Aviator Frames
```
style:aviator
material:wire OR material:acetate
vibe:retro OR vibe:luxury OR vibe:corporate
face_shape:oval, face_shape:heart, face_shape:square, face_shape:triangle
lens:polarized (if applicable)
lens:rx (if optical available)
```

### Cat-Eye Frames
```
style:cat_eye
material:acetate (usually)
vibe:retro OR vibe:luxury OR vibe:trendy
face_shape:oval, face_shape:round, face_shape:diamond
lens:rx (if optical available)
```

### Round Frames
```
style:round
material:wire OR material:acetate
vibe:retro OR vibe:modern OR vibe:classic
face_shape:oval, face_shape:square, face_shape:heart
lens:rx (if optical available)
```

### Square/Rectangle Frames
```
style:square OR style:rectangle
material:acetate OR material:wire
vibe:corporate OR vibe:modern OR vibe:edgy
face_shape:oval, face_shape:round, face_shape:heart
lens:rx (if optical available)
```

### Wayfarer Frames
```
style:wayfarer
material:acetate (usually)
vibe:retro OR vibe:classic OR vibe:trendy
face_shape:oval, face_shape:round, face_shape:heart
lens:polarized OR lens:rx (if applicable)
```

---

## 🧪 Tagging Decision Tree

```
START
  │
  ├─ What's the frame shape?
  │   ├─ Teardrop + double bridge? → style:aviator
  │   ├─ Upswept outer corners? → style:cat_eye
  │   ├─ Perfect circle? → style:round
  │   ├─ Elongated rectangle? → style:rectangle
  │   ├─ Equal width/height + angular? → style:square
  │   └─ Trapezoidal + thick? → style:wayfarer
  │
  ├─ What's the frame material?
  │   ├─ Can see through frame? → material:wire
  │   └─ Solid, cannot see through? → material:acetate
  │
  ├─ What's the aesthetic?
  │   ├─ Vintage decade mentioned? → vibe:retro
  │   ├─ Minimal, clean, simple? → vibe:modern
  │   ├─ Designer brand or luxury? → vibe:luxury
  │   ├─ Bold, unusual, dramatic? → vibe:edgy
  │   └─ (add 2-3 vibe tags total)
  │
  ├─ Who does this frame suit?
  │   ├─ Angular frame? → face_shape:oval, round, heart
  │   ├─ Rounded frame? → face_shape:oval, square, heart
  │   ├─ Aviator? → face_shape:oval, heart, square, triangle
  │   └─ (add 3-4 face shape tags)
  │
  └─ Any special lens features?
      ├─ Polarized? → lens:polarized
      ├─ Prescription available? → lens:rx
      ├─ Blue light blocking? → lens:blue_light
      ├─ Tinted/colored? → lens:tinted
      └─ Custom/interchangeable? → lens:custom
```

---

## 📋 Minimum Tag Requirements

Every product MUST have:

- [ ] **1-2 style tags** (frame shape)
- [ ] **1 material tag** (wire OR acetate)
- [ ] **2-3 vibe tags** (aesthetic descriptors)
- [ ] **3-4 face shape tags** (compatibility)
- [ ] **Relevant lens tags** (if applicable)

---

## 🎨 Examples: Complete Tagging

### Example 1: 1990s Polo Club Aviator
```
Product: "Structured Field" 1990s Polo Club Sunglasses
Description: Dark metal frame, double bridge, squared aviator, dark green lenses

Tags:
style:aviator
material:wire
vibe:retro
vibe:luxury
vibe:athletic
face_shape:oval
face_shape:heart
face_shape:square
face_shape:triangle
lens:tinted
```

**Why?**
- Aviator shape → `style:aviator`
- Dark metal → `material:wire`
- 1990s heritage → `vibe:retro`
- Polo Club brand → `vibe:luxury`
- Sporting heritage → `vibe:athletic`
- Aviator suits multiple face shapes → 4 face shape tags
- Dark green lenses → `lens:tinted`

### Example 2: 1980s Tortoiseshell Square
```
Product: "Measured Silence" 1990s Thom Browne Sunglasses
Description: Square frame, tortoiseshell plastic, gray lenses

Tags:
style:square
material:acetate
vibe:retro
vibe:modern
vibe:luxury
face_shape:oval
face_shape:round
face_shape:heart
lens:tinted
```

**Why?**
- Square shape → `style:square`
- Tortoiseshell plastic → `material:acetate`
- 1990s era → `vibe:retro`
- Minimalist design → `vibe:modern`
- Thom Browne brand → `vibe:luxury`
- Angular frame softens round faces → `face_shape:round`
- Works with balanced proportions → `face_shape:oval`
- Adds structure to heart shapes → `face_shape:heart`
- Gray lenses → `lens:tinted`

---

## ⚠️ Common Tagging Mistakes to Avoid

❌ **Don't:** Tag every possible face shape
✅ **Do:** Tag 3-4 most compatible face shapes

❌ **Don't:** Use both `material:wire` AND `material:acetate`
✅ **Do:** Choose ONE based on primary material

❌ **Don't:** Skip vibe tags
✅ **Do:** Always include 2-3 vibe descriptors

❌ **Don't:** Tag lenses as "polarized" unless explicitly stated
✅ **Do:** Only tag lens features that are confirmed

❌ **Don't:** Use style tags that don't match frame shape
✅ **Do:** Be precise about frame geometry

---

## 🔄 Quality Checklist

Before finalizing tags, ask:

- [ ] Are the style tags accurate to the frame shape?
- [ ] Is the material tag correct (wire vs acetate)?
- [ ] Do the vibe tags capture the product's aesthetic?
- [ ] Are face shape tags based on compatibility principles?
- [ ] Are lens tags only for confirmed features?
- [ ] Are there 8-15 total tags per product?

---

*This protocol ensures consistent, accurate tagging across all AZYR products.*
