# Vibration Foundations Quick-Start Kit
## Harmonatica Freebie Landing Page

Complete landing page for Instagram lead magnet. Delivered via ManyChat when users comment "VIBE" or "FREQUENCY" on posts.

---

## **What This Is**

A single-page HTML application that serves as a free educational resource on vibration healing. It builds trust, collects emails, and drives affiliate/book sales.

**Purpose:**
- Get comments on Instagram posts (algorithm boost)
- Build email list
- Generate affiliate income
- Sell book ($27 Chapter 5 / $47 full book)
- Provide real value upfront

---

## **File Structure**

```
vibration-starter-kit/
├── index.html                      # Main landing page
├── VIBRATION_CHEAT_SHEET_CONTENT.md # PDF content source
├── VIDEO_CURATION_LIST.md          # Video selection guide
└── README.md                       # This file
```

---

## **Quick Start**

### 1. **Review the Landing Page**
Open `index.html` in your browser to see the complete page.

### 2. **Embed the Videos**
Use `VIDEO_CURATION_LIST.md` to find and embed 7 YouTube videos:
- Search for each video topic
- Copy the video ID from URL
- Replace placeholders in HTML with embed code
- Test each video plays correctly

### 3. **Create the PDF Cheat Sheet**
Convert `VIBRATION_CHEAT_SHEET_CONTENT.md` to PDF:
- Use Canva, Google Docs, or Markdown to PDF converter
- Add your branding
- Make it visually appealing
- Upload to your server/cloud storage
- Update the download link in `index.html`

### 4. **Set Up Email Capture**
Choose an email provider and integrate:
- **Free Options**: MailerLite (free for 1K subs), ConvertKit (free tier)
- **Paid Options**: ActiveCampaign, Drip, AWeber

**Integration Steps:**
1. Create account and list
2. Get form embed code or API endpoint
3. Replace `alert()` in email form with actual integration
4. Test subscription flow

### 5. **Add Affiliate Links**
Replace placeholder links with actual affiliate URLs:
- Amazon Associates
- ShareASale
- Etsy Affiliate
- Direct partnerships

**Sections to Update:**
- Tools & Resources section (6 products)
- Book purchase buttons

### 6. **Deploy the Page**

**Option A: Netlify (Free & Easiest)**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd vibration-starter-kit
netlify deploy --prod
```

**Option B: Vercel (Free)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd vibration-starter-kit
vercel --prod
```

**Option C: GitHub Pages (Free)**
1. Create GitHub repository
2. Push files
3. Enable GitHub Pages in settings
4. Access at `yourname.github.io/repo-name`

**Option D: Custom Domain**
1. Buy domain (Namecheap, Google Domains)
2. Point DNS to hosting provider
3. Update base URL if needed

---

## **ManyChat Integration**

### Growth Tool Setup

1. **Create Growth Tool** in ManyChat:
   - Type: "Comment Auto-DM"
   - Trigger Keywords: VIBE, FREQUENCY, START, HEALING
   - Auto-reply message with link

2. **Auto-DM Message Template:**
```
🎵 You're in!

Here's your free Vibration Foundations Quick-Start Kit:

🔗 [Link to your landing page]

Inside you'll find:
✓ 7 expert videos (47 min total)
✓ Healing frequencies cheat sheet (PDF)
✓ Tools & resources guide
✓ Free 7-day email course

No email required. Start learning now! 💫

Questions? Just reply here!
- Harmonatica
```

3. **Set Up Tags:**
- Add tag: `starter_kit_delivered`
- Create follow-up sequence (24hrs later)
- Track clicks/conversions

### Rate Limits
- Instagram: ~200 DMs/hour
- ManyChat: 10 RPS (requests per second)
- 24-hour messaging window after user replies

---

## **Customization Guide**

### Branding
Update these elements in `index.html`:

**Colors (CSS Variables):**
```css
:root {
    --primary: #6B46C1;      /* Purple */
    --secondary: #06B6D4;    /* Cyan */
    --accent: #F59E0B;       /* Amber */
}
```

**Fonts:**
Currently using:
- Headings: 'Cormorant Garamond' (elegant serif)
- Body: 'Montserrat' (clean sans-serif)

Change Google Fonts link in `<head>` to substitute.

### Content Updates

**Hero Section:**
- Main headline (line 120)
- Subheadline (line 128)
- What's Inside checklist (line 140-156)

**Video Section:**
- Video titles and descriptions (lines 213-350)
- Add actual YouTube embeds

**Book Section:**
- Book description and pricing (lines 447-479)
- Update purchase links

**Email Section:**
- Form action (line 544)
- Success message (line 548)

---

## **Analytics & Tracking**

Add tracking scripts before closing `</body>` tag:

**Google Analytics:**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Meta Pixel:**
```html
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
```

---

## **Performance Optimization**

### Current Stats
- Single HTML file: ~25KB
- No external dependencies (except Google Fonts)
- Mobile-first responsive design
- Lazy loading ready

### Optimization Steps
1. Compress images (use TinyPNG or Squoosh)
2. Enable gzip compression on server
3. Use CDN for static assets
4. Minify HTML/CSS/JS (optional)
5. Test with Google PageSpeed Insights

---

## **Testing Checklist**

Before going live:

**Functionality:**
- [ ] All videos play correctly
- [ ] Email form submits
- [ ] Download button works
- [ ] All links are correct
- [ ] Mobile menu works (if added)
- [ ] Smooth scrolling works

**Cross-Browser:**
- [ ] Chrome (desktop + mobile)
- [ ] Safari (desktop + iOS)
- [ ] Firefox
- [ ] Edge
- [ ] Samsung Internet (Android)

**Devices:**
- [ ] iPhone (various models)
- [ ] Android phones
- [ ] iPad/tablets
- [ ] Desktop (1920x1080)
- [ ] Desktop (1366x768)

**Performance:**
- [ ] Page loads under 3 seconds
- [ ] Lighthouse score 90+
- [ ] No console errors
- [ ] Images optimized

---

## **Maintenance**

**Weekly:**
- Check for broken video links
- Monitor email signups
- Track affiliate clicks
- Review ManyChat metrics

**Monthly:**
- Update video selections if needed
- Refresh content based on feedback
- Check affiliate links still active
- Review analytics and optimize

**Quarterly:**
- Full content audit
- Design refresh (if needed)
- New video curation
- A/B test variations

---

## **Legal Pages to Add**

Before driving traffic, add:

1. **Privacy Policy** (required for GDPR/CCPA)
2. **Terms of Service**
3. **Affiliate Disclosure** (FTC requirement)
4. **Disclaimer** (health-related content)

Create separate pages or link to existing ones.

---

## **Support & Questions**

**File Locations:**
- Main Page: `/Users/michaeldurante/ai dev/ce-hub/vibration-starter-kit/index.html`
- Cheat Sheet Content: `VIBRATION_CHEAT_SHEET_CONTENT.md`
- Video Guide: `VIDEO_CURATION_LIST.md`

**Next Steps:**
1. Find and embed 7 YouTube videos
2. Create PDF cheat sheet
3. Set up email provider
4. Add affiliate links
5. Deploy to hosting
6. Configure ManyChat flow
7. Test end-to-end
8. Launch!

---

## **Success Metrics**

Track these KPIs:

**Engagement:**
- Page views
- Time on page
- Video completion rate
- PDF downloads

**Conversion:**
- Email signups
- Affiliate clicks
- Book purchases
- Comment-to-visit rate

**Growth:**
- Instagram follower growth
- Email list growth
- ManyChat automation stats

---

*Built with love for Harmonatica*
*© 2026 - All rights reserved*