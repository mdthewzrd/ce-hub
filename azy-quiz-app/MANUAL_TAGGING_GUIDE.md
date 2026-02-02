# AZYR Manual Product Tagging Guide

## Status: 558/923 Products Auto-Tagged (60% Complete)

**Remaining:** 365 products need manual frame style classification

---

## 📋 Quick Reference: Frame Style Identification

Use this visual guide to classify products by their frame shape:

### AVIATOR
**Visual cues:**
- Teardrop shape (wider top, narrower bottom)
- Double bridge (two bars connecting lenses)
- Often wire/metal frames
- Look like "pilot" glasses

**Examples to look for:**
- Words: "aviator", "pilot", "teardrop", "double bridge"
- Shape: ↓ wider top, narrow bottom ↓
- Vendors: Polo Club, Valentino, Randolph

---

### CAT-EYE
**Visual cues:**
- Upswept outer corners (wings pointing up)
- Often thicker top rim
- Angular or dramatic shape
- Vintage 1950s-60s feminine style

**Examples to look for:**
- Words: "cat-eye", "cateye", "upswept", "winged"
- Shape: /‾‾‾\ (corners angle upward)
- Vendors: Brendel, many 1990s brands

---

### ROUND
**Visual cues:**
- Perfect circles or very close to circles
- Often wire/metal (John Lennon style)
- No sharp angles
- Symmetrical all around

**Examples to look for:**
- Words: "round", "circle", "circular"
- Shape: ○ (perfect circle)
- Vendors: Many 1980s minimalist styles

---

### RECTANGLE
**Visual cues:**
- Elongated horizontally
- Wider than tall (aspect ratio > 1.5)
- Clean, straight horizontal lines
- NOT squared (corners less than 90°)

**Examples to look for:**
- Words: "rectangle", "horizontal", "oblong"
- Shape: ▭ (wider than tall)
- Often: "architectural", "minimalist"

---

### SQUARE
**Visual cues:**
- Bold, geometric shape
- Equal or near-equal width/height
- Sharp 90° corners
- Boxy, structured appearance

**Examples to look for:**
- Words: "square", "geometric", "angular"
- Shape: ■ (balanced box)
- Often Thom Browne, Bellagio, Cazal

---

### WAYFARER
**Visual cues:**
- Trapezoidal shape (wider at top)
- Very thick frames (usually acetate)
- Slanted outer edges
- Classic Ray-Ban style

**Examples to look for:**
- Words: "wayfarer", "trapezoid", "thick plastic"
- Shape: /‾‾‾\ (top wider than bottom)
- Often: "sport", "casual", "thick frame"

---

## 🔍 How to Use the Tagged CSV

Your tagged products CSV (`tagged_products.csv`) has these columns:

| Column | Description |
|--------|-------------|
| `handle` | Product handle/ID |
| `title` | Product title |
| `style` | Frame style (empty if not detected) |
| `material` | Wire or Acetate |
| `face_shapes` | Compatible face shapes |
| `use_cases` | Recommended use cases |
| `vibes` | Style vibes (retro, luxury, etc.) |
| `lens_types` | Available lens options |
| `tags` | Complete tag string for Shopify |

---

## ✅ Manual Tagging Steps

For each untagged product:

### Step 1: Find the Product
1. Copy the handle from the untagged list
2. Search in Shopify admin or your CSV
3. Look at product images

### Step 2: Identify Frame Style
Use the visual guide above to identify:
- Primary frame shape
- Material (wire vs acetate)

### Step 3: Add Tags
Add these tags to the product in Shopify:

```
style:[aviator|cat_eye|round|rectangle|square|wayfarer]
material:[wire|acetate]
face_shape:[heart|oval|round|square|rectangle|diamond] (use compatibility table below)
vibe:[retro|luxury|modern|classic|trendy|edgy]
```

### Step 4: Verify Face Shapes
Use Maureen's compatibility table:

| Frame Style | Add These Face Shape Tags |
|-------------|---------------------------|
| Aviator | `face_shape:heart`, `face_shape:oval`, `face_shape:square`, `face_shape:diamond` |
| Cat-Eye | `face_shape:heart`, `face_shape:oval`, `face_shape:round`, `face_shape:square`, `face_shape:diamond` |
| Round | `face_shape:heart`, `face_shape:square`, `face_shape:diamond` |
| Rectangle | `face_shape:heart`, `face_shape:oval`, `face_shape:round`, `face_shape:diamond` |
| Square | `face_shape:oval`, `face_shape:round` |
| Wayfarer | `face_shape:heart`, `face_shape:oval`, `face_shape:round`, `face_shape:square` |

---

## 🎯 Pro Tips

1. **Check the images first** - titles can be misleading
2. **When unsure, check similar products** by the same vendor
3. **Oval frames** are often called "oval" but might be rectangle or cat-eye - measure the aspect ratio
4. **"Architectural"** usually means rectangle or square
5. **"Minimalist"** often means round or rectangle wire frames

---

## 📦 Bulk Import to Shopify

Once you've manually tagged all products:

1. Open your Shopify admin
2. Go to Products → All Products
3. Click "Import" → "Import with CSV"
4. Upload the original CSV with added tags
5. Map the Tags column to product tags
6. Review and confirm

---

## 🚀 Next Steps After Tagging

Once all 923 products are tagged:

1. **Update the quiz app** to use real product data
2. **Connect Shopify API** for live recommendations
3. **A/B test** the recommendation algorithm
4. **Track conversion** from quiz to purchase

---

*Generated based on Maureen Ryza's expert questionnaire responses*
