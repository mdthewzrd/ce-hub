# 🎯 AZYR Visual MC Funnel - Implementation Plan v1

## 📋 Project Overview
Build a 5-step visual multiple-choice quiz that delivers personalized eyewear recommendations by matching user preferences against Shopify inventory using an AI-powered scoring algorithm.

---

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + useState/useReducer
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation

### Backend Stack
- **API Routes**: Next.js API routes (serverless)
- **Shopify Integration**: Shopify Admin REST API
- **Database**:
  - Phase 1: JSON file / localStorage (speed)
  - Phase 2: PostgreSQL / MongoDB (scale)
- **AI/ML**: Custom scoring algorithm (Phase 1), can add OpenAI embeddings later

### Deployment
- **Hosting**: Vercel (Next.js optimized)
- **Environment Variables**: Shopify credentials, API keys

---

## 📱 Component 1: Visual MC Form (5-Step Quiz)

### Step Structure
```
Step 1: Face Shape (Single Select)
├── Heart, Oval, Round, Square, Diamond, Triangle, Not Sure
└── Visual icons + labels

Step 2: Frame Material (Single Select)
├── Wire, Acetate
└── Material swatches

Step 3: Frame Style (Single Select)
├── Round, Cat-eye, Rectangle, Wayfarer, Square
└── Frame silhouette icons

Step 4: Vibe (Multi-Select)
├── Office Siren, Edgy, Trendy, Modern, Retro, Classic, Street, Luxury, Athletic
└── Pill-style toggle buttons

Step 5: Lenses (Multi-Select)
├── Polarized, Customizable, Colored Tint, Prescription, Blue Light, Empty
└── Feature icons
```

### UX Requirements
- Progress bar at top (20% per step)
- Big touch-friendly tiles (minimum 44x44px)
- "Next" button disabled until selection made
- "Back" button to previous step
- "Skip" button for uncertain users
- Selection summary pill at top
- Smooth transitions between steps
- Mobile-first responsive design

---

## 🤖 Component 2: AI Product Recommendation Engine

### Scoring Algorithm
```typescript
interface ProductMatch {
  product: ShopifyProduct;
  score: number;
  matches: {
    style: number;
    material: number;
    vibe: number;
    faceShape: number;
    lenses: number;
  };
}

function scoreProduct(
  product: ShopifyProduct,
  userResponses: UserResponses
): ProductMatch {
  const weights = { style: 3, material: 2, vibe: 2, faceShape: 2, lenses: 1 };
  const threshold = 4;

  let score = 0;
  const matches = { style: 0, material: 0, vibe: 0, faceShape: 0, lenses: 0 };

  // Style match (exact match = weight * 1)
  if (product.tags.includes(`style:${userResponses.style}`)) {
    score += weights.style;
    matches.style = weights.style;
  }

  // Material match
  if (product.tags.includes(`material:${userResponses.material}`)) {
    score += weights.material;
    matches.material = weights.material;
  }

  // Vibe matches (count matches, cap at weight)
  const vibeMatches = userResponses.vibe.filter(v =>
    product.tags.includes(`vibe:${v}`)
  ).length;
  const vibeScore = Math.min(vibeMatches, weights.vibe);
  score += vibeScore;
  matches.vibe = vibeScore;

  // Face shape match
  if (product.tags.includes(`face_shape:${userResponses.faceShape}`)) {
    score += weights.faceShape;
    matches.faceShape = weights.faceShape;
  }

  // Lenses matches (count matches, cap at weight)
  const lensMatches = userResponses.lenses.filter(l =>
    product.tags.includes(`lens:${l}`)
  ).length;
  const lensScore = Math.min(lensMatches, weights.lenses);
  score += lensScore;
  matches.lenses = lensScore;

  return { product, score, matches };
}
```

### Shopify Integration Points
```typescript
// API Route: /api/recommendations
export async function POST(req: Request) {
  const { responses } = await req.json();

  // 1. Fetch products from Shopify Admin API
  const products = await shopifyProducts.getInStock();

  // 2. Score each product
  const scored = products.map(p => scoreProduct(p, responses));

  // 3. Filter by threshold + sort by score
  const recommendations = scored
    .filter(s => s.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // 4. Fallback: if < 10 results, add "close matches"
  if (recommendations.length < 10) {
    const closeMatches = scored
      .filter(s => s.score >= 2 && s.score < 4)
      .slice(0, 10 - recommendations.length);
    recommendations.push(...closeMatches.map(m => ({...m, isCloseMatch: true})));
  }

  return Response.json(recommendations);
}
```

---

## 🎨 Component 3: Results Page

### Layout Structure
```
┌─────────────────────────────────────────┐
│  Your Personalized Eyewear Picks        │
│  Based on your: Oval face, Acetate...   │
├─────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Product │ │ Product │ │ Product │   │
│  │  #1     │ │  #2     │ │  #3     │   │
│  │  ⭐⭐⭐  │ │  ⭐⭐    │ │  ⭐⭐    │   │
│  │ [Add]   │ │ [Add]   │ │ [Add]   │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│  Bundle: 3+ items = 20% off            │
├─────────────────────────────────────────┤
│  [Browse Full Collection]               │
│  [Book Consultation]                    │
└─────────────────────────────────────────┘
```

### Features
- Top 10 recommended products with match scores
- "Add to Cart" with instant feedback
- Bundle discount indicator (1=10%, 2=15%, 3+=20%)
- "Browse All" button with 20% auto-applied discount
- Consultation booking CTA
- Share/save wishlist functionality
- Mobile-responsive grid

---

## 📂 Project File Structure
```
azy-quiz-app/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── quiz/
│   │   └── page.tsx                # Quiz entry point
│   ├── results/
│   │   └── page.tsx                # Results page
│   └── api/
│       ├── recommendations/
│       │   └── route.ts            # Recommendation engine
│       ├── shopify/
│       │   └── route.ts            # Shopify proxy
│       └── submit/
│           └── route.ts            # Form submission
├── components/
│   ├── quiz/
│   │   ├── QuizContainer.tsx       # Main quiz wrapper
│   │   ├── ProgressBar.tsx         # Progress indicator
│   │   ├── Step1_FaceShape.tsx     # Face shape selection
│   │   ├── Step2_Material.tsx      # Material selection
│   │   ├── Step3_Style.tsx         # Style selection
│   │   ├── Step4_Vibe.tsx          # Vibe multi-select
│   │   └── Step5_Lenses.tsx        # Lenses multi-select
│   ├── results/
│   │   ├── ProductCard.tsx         # Individual product
│   │   ├── BundleIndicator.tsx     # Discount display
│   │   └── ShareButtons.tsx        # Share/save
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── shopify.ts                  # Shopify API client
│   ├── scoring.ts                  # Recommendation algorithm
│   ├── types.ts                    # TypeScript interfaces
│   └── utils.ts                    # Helper functions
├── public/
│   └── images/                     # Quiz option icons
└── .env.local                      # Environment variables
```

---

## ⚡ Implementation Phases (Speed to Market)

### Phase 1: Foundation (Day 1-2)
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Tailwind CSS + shadcn/ui
- [ ] Create file structure
- [ ] Set up environment variables
- [ ] Build Shopify API client wrapper

### Phase 2: Quiz UI (Day 2-3)
- [ ] Create QuizContainer component
- [ ] Build ProgressBar component
- [ ] Implement all 5 quiz steps
- [ ] Add state management for responses
- [ ] Implement navigation (Next/Back/Skip)
- [ ] Add animations with Framer Motion

### Phase 3: Recommendation Engine (Day 3-4)
- [ ] Build scoring algorithm
- [ ] Create Shopify API integration
- [ ] Implement `/api/recommendations` endpoint
- [ ] Add inventory filtering
- [ ] Test with sample products

### Phase 4: Results Page (Day 4-5)
- [ ] Design results layout
- [ ] Create ProductCard component
- [ ] Implement bundle discount logic
- [ ] Add "Browse All" with discount
- [ ] Add consultation CTA
- [ ] Mobile responsiveness

### Phase 5: Integration & Testing (Day 5-6)
- [ ] Connect quiz → recommendations → results
- [ ] Test end-to-end flow
- [ ] Add error handling
- [ ] Implement loading states
- [ ] Add analytics tracking

### Phase 6: Deploy & Launch (Day 6-7)
- [ ] Deploy to Vercel
- [ ] Configure custom domain
- [ ] Set up ManyChat integration
- [ ] Test UTM parameter passing
- [ ] Launch monitoring

---

## 🔧 Environment Variables Required
```env
# Shopify Admin API
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx

# Discount Configuration
DISCOUNT_CODE_AZYR20=AZYRVIP20
BUNDLE_TIER_1=10
BUNDLE_TIER_2=15
BUNDLE_TIER_3=20

# Analytics (Optional)
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 🎯 Success Metrics Tracking
```typescript
// Track these events:
- quiz_started
- quiz_step_completed (step_number)
- quiz_completed
- recommendations_generated (count, avg_score)
- product_added_to_cart (product_id, score)
- browse_all_clicked
- consultation_booked
```

---

## 📋 Quiz Configuration Schema

```json
{
  "steps": [
    {
      "id": "face_shape",
      "type": "single",
      "question": "What's your face shape?",
      "options": [
        {"value": "heart", "label": "Heart", "icon": "heart-icon.svg"},
        {"value": "oval", "label": "Oval", "icon": "oval-icon.svg"},
        {"value": "round", "label": "Round", "icon": "round-icon.svg"},
        {"value": "square", "label": "Square", "icon": "square-icon.svg"},
        {"value": "diamond", "label": "Diamond", "icon": "diamond-icon.svg"},
        {"value": "triangle", "label": "Base-down Triangle", "icon": "triangle-icon.svg"},
        {"value": "not_sure", "label": "Not Sure", "icon": "question-icon.svg"}
      ]
    },
    {
      "id": "material",
      "type": "single",
      "question": "What frame material do you prefer?",
      "options": [
        {"value": "wire", "label": "Wire/Metal", "swatch": "wire-swatch.jpg"},
        {"value": "acetate", "label": "Acetate (Thick)", "swatch": "acetate-swatch.jpg"}
      ]
    },
    {
      "id": "style",
      "type": "single",
      "question": "What frame style catches your eye?",
      "options": [
        {"value": "round", "label": "Round", "icon": "round-frame.svg"},
        {"value": "cat_eye", "label": "Cat-eye", "icon": "cat-eye.svg"},
        {"value": "rectangle", "label": "Rectangle", "icon": "rectangle.svg"},
        {"value": "wayfarer", "label": "Wayfarer", "icon": "wayfarer.svg"},
        {"value": "square", "label": "Square", "icon": "square-frame.svg"}
      ]
    },
    {
      "id": "vibe",
      "type": "multi",
      "question": "What's your vibe? (Select all that apply)",
      "options": [
        {"value": "office_siren", "label": "Office Siren"},
        {"value": "edgy", "label": "Edgy"},
        {"value": "trendy", "label": "Trendy"},
        {"value": "modern", "label": "Modern"},
        {"value": "retro", "label": "Retro"},
        {"value": "classic", "label": "Classic"},
        {"value": "street", "label": "Street"},
        {"value": "luxury", "label": "Luxury"},
        {"value": "athletic", "label": "Athletic"}
      ]
    },
    {
      "id": "lenses",
      "type": "multi",
      "question": "Any lens preferences? (Select all that apply)",
      "options": [
        {"value": "polarized", "label": "Polarized"},
        {"value": "custom", "label": "Customizable"},
        {"value": "tinted", "label": "Colored Tint"},
        {"value": "rx", "label": "Prescription"},
        {"value": "blue_light", "label": "Blue Light"},
        {"value": "empty", "label": "No preference"}
      ]
    }
  ],
  "weights": {
    "style": 3,
    "material": 2,
    "vibe": 2,
    "face_shape": 2,
    "lenses": 1
  },
  "threshold": 4,
  "maxResults": 10
}
```

---

## 🔄 Update Log

- **2025-01-09**: Initial plan created v1
  - Defined 5-step quiz structure
  - Established scoring algorithm
  - Mapped out phases for 7-day launch

---

## 📞 Contact & Support

For questions or updates to this plan, refer to this living document.
