# Shopify Admin API Setup Guide for AZYR Quiz App

This guide walks you through generating the necessary Shopify Admin API credentials to enable the quiz app to fetch products, check inventory, and integrate with your store.

---

## 📋 Prerequisites

- Access to your Shopify Partners Dashboard
- A custom app created (you should see "Product Quiz Recommender App")
- Target store where the app will be installed

---

## 🔐 Step-by-Step Setup (Shopify Partners Dashboard)

### Step 1: Navigate to Your App Settings

1. Log in to [Shopify Partners](https://partners.shopify.com)
2. In the left sidebar, find your app: **Product Quiz Recommender App**
3. Click on the app name to open its dashboard
4. In the left sidebar, click **Settings**

> **[Screenshot Placeholder]**
> *Location: Partners Dashboard → App → Settings*

---

### Step 2: Configure Admin API Scopes

This is the critical step - you must grant the correct permissions.

1. On the **Overview** tab of Settings, find **API access** section
2. Click **Configure Admin API scopes**
3. Toggle ON the following scopes (use search to find them quickly):

#### Required Scopes for Quiz App:

| Scope | Purpose | Required For |
|-------|---------|--------------|
| `read_products` | Fetch product data | Getting inventory, pricing, images |
| `read_product_listings` | Access product listings | Product catalog access |
| `read_inventory` | Check stock levels | Inventory-aware recommendations |
| `read_product_inventory` | Track inventory per product | Stock status on results page |
| `write_discounts` | Create discount codes | Generating personalized codes |
| `read_discounts` | Read discount codes | Verifying code validity |
| `read_orders` | Read order data | Post-purchase analytics (optional) |
| `write_orders` | Create orders | Direct checkout (optional) |

4. Click **Save** at the top right

> **[Screenshot Placeholder]**
> *Admin API scopes configuration screen*

---

### Step 3: Install the App on Your Store

Now you need to install the app on your actual store:

1. In the right sidebar, find the **Installs** panel
2. Click **Install app** button
3. Select your target store from the dropdown (or create a dev store)
4. Click **Install** to confirm

> **[Screenshot Placeholder]**
> *Installs panel with Install app button*

---

### Step 4: Get Your Credentials

After installing, you'll receive your credentials in two ways:

#### Option A: From Installation Screen

After clicking **Install app**, Shopify will show:

**Admin API access token:**
```
shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Store URL:**
```
https://{your-store-name}.myshopify.com
```

> **[Screenshot Placeholder]**
> *Installation confirmation screen with access token*

#### Option B: From Installed App Location

1. Go to your store's Admin: `https://{your-store}.myshopify.com/admin`
2. Navigate to **Settings** → **Apps and sales channels**
3. Find your app and click on it
4. Scroll to **Admin API access token** section
5. Click **Reveal token** or **Copy token**

> **[Screenshot Placeholder]**
> *Store Admin → Apps → Your App → Access Token*

⚠️ **IMPORTANT**: Copy the **Admin API access token** now and save it securely. You may not be able to see the full token again after leaving the page.

---

## 🚀 Quick Start (From Your Current Screen)

Since you're already on the app dashboard screen:

1. **Click "Settings"** in the left sidebar (under your app name)
2. **Click "Configure Admin API scopes"** in the Overview tab
3. **Toggle ON** these scopes (search for each):
   - `read_products`
   - `read_inventory`
   - `write_discounts`
   - `read_discounts`
4. **Click "Install app"** in the right sidebar
5. **Select your store** and confirm install
6. **Copy the access token** when shown (starts with `shpat_`)

That's it! You now have your credentials.

---

## 🔧 Environment Variables Setup

Once you have your credentials, add them to your project's environment variables:

### Development (`.env.local`)

Create `.env.local` in the `azy-quiz-app` root directory:

```env
# Shopify Store Configuration
SHOPIFY_STORE_URL=https://azyr-specs.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Shopify API Version
SHOPIFY_API_VERSION=2024-01

# Discount Configuration
DISCOUNT_CODE_AZYR20=AZYRVIP20
BUNDLE_TIER_1=10
BUNDLE_TIER_2=15
BUNDLE_TIER_3=20

# App Configuration
NEXT_PUBLIC_SHOPIFY_DOMAIN=azyr-specs.myshopify.com
```

### Production (Vercel)

When deploying to Vercel:

1. Go to **Project Settings** → **Environment Variables**
2. Add each variable from above (except `NEXT_PUBLIC_` prefix is auto-handled)
3. **NEVER** commit `.env.local` to git (it's in `.gitignore`)

---

## ✅ Test Your Connection

After setting up credentials, verify the connection:

### Quick Test Script

Create a test file `test-shopify-api.js`:

```javascript
const query = `
  query {
    shop {
      name
    }
    products(first: 5) {
      edges {
        node {
          id
          title
          handle
          variants(first: 1) {
            edges {
              node {
                id
                availableForSale
              }
            }
          }
        }
      }
    }
  }
`;

fetch('https://azyr-specs.myshopify.com/admin/api/2024-01/graphql.json', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': 'shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  },
  body: JSON.stringify({ query })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Shopify API Connected!');
  console.log('Store:', data.data.shop.name);
  console.log('Products found:', data.data.products.edges.length);
})
.catch(err => console.error('❌ Connection failed:', err));
```

Run with: `node test-shopify-api.js`

---

## 🔒 Security Best Practices

### DO:
- ✅ Store access tokens in environment variables only
- ✅ Rotate tokens periodically (every 90 days)
- ✅ Use the minimum required scopes
- ✅ Monitor app usage in Shopify Admin

### DON'T:
- ❌ Commit tokens to git
- ❌ Share tokens in chat/email
- ❌ Use production tokens in development
- ❌ Expose tokens in client-side code

---

## 📚 Troubleshooting

### Error: "401 Unauthorized"
- Verify your access token is correct (starts with `shpat_`)
- Check the token hasn't been expired or revoked
- Ensure you're using the correct store URL

### Error: "403 Forbidden"
- Verify all required scopes are enabled
- Reinstall the app to update permissions
- Check your Shopify plan supports the API

### Error: "429 Too Many Requests"
- Shopify rate limit: 2 requests per second (bucket size: 40)
- Implement exponential backoff in your code
- Consider caching product data

### Can't find "Develop apps"
- Only store owners can develop custom apps
- Check you have the correct permissions
- Contact Shopify support if needed

---

## 📝 Next Steps

After completing this guide:

1. ✅ **Set up product tags** → See `SHOPIFY_TAGGING_SCHEMA.md`
2. ✅ **Test API connection** → Run the test script above
3. ✅ **Build recommendation engine** → Tasks 3-6
4. ✅ **Deploy to Vercel** → Configure production environment variables

---

## 🆘 Need Help?

- **Shopify Admin API Docs**: https://shopify.dev/docs/admin-api
- **Custom Apps Guide**: https://shopify.dev/docs/apps/build/custom-apps
- **Rate Limits**: https://shopify.dev/docs/api/usage/rate-limits

---

## 📸 Screenshot Checklist

Use this checklist to capture screenshots for documentation:

- [ ] Step 1: Apps and sales channels location
- [ ] Step 3: Create app modal
- [ ] Step 4: Admin API scopes configuration
- [ ] Step 6: Installed app with access token
- [ ] Test connection successful response

---

*Last updated: 2025-01-26*
