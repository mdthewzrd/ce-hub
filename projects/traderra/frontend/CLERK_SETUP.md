# Clerk Authentication Setup Guide

This guide will help you set up Clerk authentication for Traderra so that users can securely sign in and their imported trading data will be saved to their profiles.

## Prerequisites

All the code infrastructure for Clerk is already set up in the application. You just need to:
1. Create a Clerk account
2. Get your API keys
3. Update environment variables

## Step-by-Step Setup

### 1. Create a Clerk Application

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Sign up for a free account or sign in
3. Click "Create Application"
4. Choose a name like "Traderra"
5. Select "Email" and "Google" as sign-in options (recommended)
6. Choose "Development" environment

### 2. Get Your API Keys

Once your application is created:

1. In the Clerk dashboard, go to "API Keys" in the left sidebar
2. Copy the **Publishable Key** (starts with `pk_test_`)
3. Copy the **Secret Key** (starts with `sk_test_`)

### 3. Update Environment Variables

Edit your `.env.local` file and uncomment/update these lines:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
```

Replace the placeholder values with your actual keys from the Clerk dashboard.

### 4. Configure Sign-in Options (Optional)

In the Clerk dashboard, you can configure:

- **Sign-in methods**: Email, Phone, Social providers (Google, GitHub, etc.)
- **User profile fields**: Name, email, profile picture
- **Session settings**: Session length, multi-session handling
- **Security**: Password requirements, 2FA options

Recommended settings for Traderra:
- Enable Email + Password
- Enable Google OAuth (for quick sign-in)
- Require email verification
- Set session timeout to 30 days

### 5. Test the Setup

1. Restart your development server: `npm run dev`
2. Visit `http://localhost:6565/trades`
3. If Clerk is working, you should be redirected to the sign-in page
4. Create a test account and verify you can sign in

### 6. Configure Webhooks (Optional - for production)

For production deployment, you may want to set up webhooks to sync user data:

1. In Clerk dashboard, go to "Webhooks"
2. Add endpoint: `https://yourdomain.com/api/webhook/clerk`
3. Select events: `user.created`, `user.updated`

## Features Already Implemented

✅ **Authentication Pages**: Sign-in and sign-up pages with Traderra branding
✅ **User Profile**: User avatar and profile display in navigation
✅ **Settings Page**: Complete user profile management
✅ **Protected Routes**: All trading pages require authentication
✅ **Route Middleware**: Automatic redirection for unauthorized users
✅ **Dark Theme**: Clerk UI matches Traderra's dark theme

## What This Enables

Once Clerk is set up:

1. **Secure User Accounts**: Each user has their own secure account
2. **Persistent Data**: Imported trades and journal entries are saved per user
3. **User Profiles**: Users can manage their profile, preferences, and settings
4. **Social Sign-in**: Users can sign in with Google, GitHub, etc.
5. **Session Management**: Secure session handling with customizable timeouts

## Troubleshooting

### Common Issues

**"Clerk publishable key not found"**
- Make sure you've added the keys to `.env.local`
- Ensure the key starts with `pk_test_` for development
- Restart your development server after adding keys

**Infinite redirect loop**
- Check that your middleware.ts is correctly configured
- Ensure all required routes are in the `isPublicRoute` matcher

**UI styling issues**
- The Clerk components should automatically match the dark theme
- Custom styling is already configured in the ClerkProvider

### Getting Help

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Discord Community](https://discord.com/invite/b5rXHjAg7A)
- [Next.js + Clerk Guide](https://clerk.com/docs/nextjs/get-started-with-nextjs)

## Cost Information

- **Free Tier**: 10,000 monthly active users
- **Pro Tier**: $25/month for up to 100,000 MAU
- **Enterprise**: Custom pricing for larger scales

For most trading journal applications, the free tier is sufficient to start.

## Next Steps After Setup

Once Clerk is working:

1. **Test import functionality**: Import your TraderVue data and verify it persists after signing out/in
2. **Configure user settings**: Set up trading preferences in the settings page
3. **Add real trading data**: Import your historical trades to start using Traderra with real data
4. **Explore integrations**: Set up Discord, Telegram, or other notification integrations