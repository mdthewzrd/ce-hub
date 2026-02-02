# Shopify Product Tagging Guide for AZYR Quiz

This guide shows you exactly how to tag your products in Shopify so the quiz recommendation engine can match them to user preferences.

---

## 📋 Tagging Schema Overview

Each product needs tags in this format: `category:value`

### 5 Tag Categories:
1. **Style** - Frame shape/style
2. **Material** - Frame material
3. **Vibe** - Aesthetic/style category
4. **Face Shape** - Which face shapes suit this frame
5. **Lens** - Lens type (if applicable)

---

## 🎯 Complete Tag Reference

### 1. Style Tags (`style:`)

| Tag Value | When to Use | Examples |
|-----------|-------------|----------|
| `style:round` | Round frames | Classic circles, John Lennon style |
| `style:cat_eye` | Cat-eye frames | Upswept outer corners, 50s style |
| `style:rectangle` | Rectangle frames | Elongated rectangular shape |
| `style:wayfarer` | Wayfarer frames | Trapezoidal, Ray-Ban style |
| `style:square` | Square frames | Bold square shape |
| `style:aviator` | Aviator frames | Teardrop, double bridge |

**Example Product Tags:**
```
style:aviator
style:round
```

---

### 2. Material Tags (`material:`)

| Tag Value | When to Use | Examples |
|-----------|-------------|----------|
| `material:wire` | Metal/thin frames | Gold/silver wire, titanium |
| `material:acetate` | Thick plastic frames | Bold acetate, cellulose acetate |

**Example Product Tags:**
```
material:wire
material:acetate
```

---

### 3. Vibe Tags (`vibe:`)

| Tag Value | Description | Examples |
|-----------|-------------|----------|
| `vibe:corporate` | Office-appropriate, professional | Subtle frames, neutral colors |
| `vibe:edgy` | Bold, unconventional | Unusual shapes, thick frames |
| `vibe:trendy` | Fashion-forward | Current trends, statement pieces |
| `vibe:modern` | Contemporary, sleek | Minimalist, clean lines |
| `vibe:retro` | Vintage-inspired | 70s, 80s, 90s styles |
| `vibe:classic` | Timeless | Styles that never go out of fashion |
| `vibe:street` | Streetwear, casual | Urban, casual aesthetic |
| `vibe:luxury` | High-end, designer | Premium materials, branded |
| `vibe:athletic` | Sporty, functional | Performance frames, rubberized |

**Example Product Tags (can have multiple):**
```
vibe:retro
vibe:trendy
vibe:luxury
```

---

### 4. Face Shape Tags (`face_shape:`)

| Tag Value | Best For | Guidelines |
|-----------|----------|------------|
| `face_shape:heart` | Heart-shaped faces | Frames wider than forehead, bottom-heavy |
| `face_shape:oval` | Oval faces | Proportional faces (most frames work) |
| `face_shape:round` | Round faces | Angular/rectangular frames add contrast |
| `face_shape:square` | Square faces | Round/oval frames soften angles |
| `face_shape:diamond` | Diamond faces | Oval/cat-eye frames balance cheekbones |
| `face_shape:triangle` | Triangle/base-down faces | Frames wider at top, detail on browline |

**Example Product Tags (can have multiple):**
```
face_shape:oval
face_shape:heart
face_shape:round
```

---

### 5. Lens Tags (`lens:`)

| Tag Value | When to Use | Examples |
|-----------|-------------|----------|
| `lens:polarized` | Polarized lenses | Reduces glare, outdoor/sport |
| `lens:custom` | Customizable lenses | Interchangeable, prescription-ready |
| `lens:tinted` | Colored/tinted lenses | Gradient, colored lenses |
| `lens:rx` | Prescription available | Can be made with prescription |
| `lens:blue_light` | Blue light filtering | Computer glasses, screen protection |

**Example Product Tags (can have multiple):**
```
lens:polarized
lens:rx
```

---

## 📝 How to Tag Products in Shopify

### Method 1: Individual Product Tagging

1. Go to **Products** in Shopify Admin
2. Click on a product
3. Scroll to **Tags** section
4. Add tags one at a time (press Enter after each)
5. Click **Save**

**Example:**
```
style:aviator
material:wire
vibe:classic
vibe:corporate
face_shape:oval
face_shape:heart
face_shape:square
lens:polarized
lens:rx
```

---

### Method 2: Bulk Tagging (Recommended for Multiple Products)

#### Using Bulk Editor:

1. Go to **Products** → **All products**
2. Select multiple products (checkboxes)
3. Click **More actions** → **Add tags**
4. Add tags to all selected at once
5. Click **Add tags**

#### Using CSV Import/Export:

1. Go to **Products** → **All products**
2. Click **Export** → **Export products**
3. Open CSV in Excel/Google Sheets
4. Add tags to **Tags** column (comma-separated)
5. Save and **Import** back to Shopify

---

## 🎯 Example Product Tagging

### Example 1: Classic Aviator Sunglasses

```
Product: Gold Wire Aviator Sunglasses

Tags:
style:aviator
material:wire
vibe:classic
vibe:corporate
face_shape:oval
face_shape:heart
face_shape:square
lens:polarized
lens:rx
```

### Example 2: Bold Acetate Cat-Eye Frames

```
Product: Black Acetate Cat-Eye Vintage Glasses

Tags:
style:cat_eye
material:acetate
vibe:retro
vibe:trendy
face_shape:oval
face_shape:round
face_shape:diamond
lens:rx
lens:blue_light
```

### Example 3: Modern Round Metal Frames

```
Product: Round Titanium Frames

Tags:
style:round
material:wire
vibe:modern
vibe:luxury
face_shape:oval
face_shape:square
face_shape:heart
lens:custom
lens:rx
```

---

## ✅ Tagging Checklist

For each product, ensure you have:

- [ ] **At least 1 style tag** (`style:round`, `style:cat_eye`, etc.)
- [ ] **Exactly 1 material tag** (`material:wire` OR `material:acetate`)
- [ ] **At least 2 vibe tags** (describe the aesthetic)
- [ ] **At least 3 face shape tags** (which face shapes this suits)
- [ ] **Relevant lens tags** (only if applicable)

---

## 🔍 Quick Reference: Tag by Frame Type

### Round Frames
```
style:round
face_shape:square
face_shape:heart
face_shape:triangle
```

### Cat-Eye Frames
```
style:cat_eye
face_shape:oval
face_shape:round
face_shape:diamond
```

### Aviator Frames
```
style:aviator
face_shape:oval
face_shape:heart
face_shape:square
face_shape:triangle
```

### Rectangle/Square Frames
```
style:rectangle OR style:square
face_shape:oval
face_shape:round
face_shape:heart
```

### Wayfarer Frames
```
style:wayfarer
face_shape:oval
face_shape:round
face_shape:heart
```

---

## ⚠️ Important Notes

1. **Tag Format Must Be Exact**: Use `style:round` NOT `style-round` or `style round`
2. **Lowercase Values**: Use `style:aviator` NOT `style:Aviator`
3. **Underscores for Multi-Word**: Use `face_shape:base_down` NOT `face_shape:base-down`
4. **Multiple Values Allowed**: A product can have multiple vibe tags, face shape tags, and lens tags
5. **Consistent Tagging**: Tag similar products similarly for best recommendations

---

## 🚀 Next Steps After Tagging

1. Test the quiz with tagged products
2. Verify recommendation accuracy
3. Adjust tags if products aren't appearing as expected
4. Use analytics to see which tags are most popular

---

*Last updated: 2025-01-27*
