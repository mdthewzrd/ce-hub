# AZYR Quiz App - Visual MC Funnel

A 5-step visual multiple-choice quiz that delivers personalized eyewear recommendations.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
azy-quiz-app/
├── app/
│   ├── page.tsx              # Landing page with CTA
│   ├── quiz/
│   │   └── page.tsx          # Quiz page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   └── quiz/
│       ├── QuizContainer.tsx # Main quiz component
│       ├── ProgressBar.tsx   # Progress indicator
│       └── OptionTile.tsx    # Reusable option button
├── lib/
│   └── types.ts              # Type definitions & config
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

## 🎨 Quiz Flow

1. **Landing Page** → User clicks "Start Quiz"
2. **Step 1**: Face Shape Selection (Heart, Oval, Round, Square, Diamond, Triangle, Not Sure)
3. **Step 2**: Frame Material (Wire/Metal, Acetate)
4. **Step 3**: Frame Style (Round, Cat-eye, Rectangle, Wayfarer, Square)
5. **Step 4**: Vibe Multi-select (Office Siren, Edgy, Trendy, etc.)
6. **Step 5**: Lens Preferences (Polarized, Prescription, Blue Light, etc.)
7. **Results Page** → Shows personalized product recommendations

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations (ready to integrate)

## 📊 Quiz Configuration

The quiz is configured in `lib/types.ts`:

```typescript
export const QUIZ_CONFIG: QuizStep[] = [
  {
    id: 'face_shape',
    type: 'single',
    question: "What's your face shape?",
    options: [...],
    required: false,
  },
  // ... more steps
];
```

## 🔄 Next Steps

1. **Integrate Shopify**: Add Shopify Admin API to fetch products
2. **Build Recommendation Engine**: Implement scoring algorithm
3. **Create Results Page**: Display matched products with bundle discounts
4. **Add Animations**: Polish with Framer Motion transitions
5. **Connect ManyChat**: Set up DM automation
6. **Deploy**: Push to Vercel

## 🔗 Integration Points

### ManyChat Integration
The quiz accepts UTM parameters for tracking:
```
/quiz?utm_source=instagram&utm_campaign=wishlist&utm_content=post123
```

### Shopify Integration (Coming Soon)
```typescript
// Will connect to Shopify Admin API
const products = await shopifyProducts.getInStock();
const recommendations = scoreProducts(products, userResponses);
```

## 🎯 Current Status

✅ Quiz UI complete
✅ All 5 steps implemented
✅ Progress tracking
✅ Responsive design
✅ Mobile-friendly

🟡 Shopify integration (Phase 3)
🟡 Recommendation engine (Phase 3)
🟡 Results page (Phase 4)
🟡 ManyChat setup (Phase 6)

## 📞 Support

Refer to `AZYR_QUIZ_IMPLEMENTATION_PLAN.md` for the complete implementation plan.
