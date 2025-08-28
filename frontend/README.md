# HireLens Frontend - AI-Powered CV Search

A modern, responsive web application for AI-powered CV search and candidate discovery, featuring Google OAuth authentication with Supabase persistence and a beautiful landing page.

## ✨ Features

- **🎨 Beautiful Landing Page**: Engaging design with clear call-to-action
- **🔐 Google OAuth Authentication**: Secure login with Google accounts
- **💾 Persistent User Storage**: User data stored in Supabase PostgreSQL
- **🔍 AI-Powered Search**: Intelligent CV search with filters
- **📤 CV Upload**: Drag & drop CV upload with AI processing
- **📱 Responsive Design**: Works perfectly on all devices
- **🎯 Smart Filters**: Filter by skills, experience, education, and location

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the frontend directory:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Supabase Configuration
SUPABASE_URL=your-supabase-project-url-here
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy Client ID and Client Secret to your `.env.local`

### 4. Supabase Setup

1. Go to [Supabase](https://supabase.com/)
2. Create a new project or select existing one
3. Wait for the project to be set up (this may take a few minutes)
4. Go to "Settings" → "API"
5. Copy the following values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`
6. Update your `.env.local` with these values

### 5. Generate NextAuth Secret

Generate a secure random string for NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## 🏗️ Project Structure

```
frontend/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   │   └── auth/          # Authentication endpoints
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Landing page
│   ├── search/            # Search page (protected)
│   └── upload/            # Upload page (protected)
├── components/             # React components
│   ├── LandingPage.tsx    # Main landing page
│   ├── Providers.tsx      # NextAuth session provider
│   ├── EnhancedSearchBar.tsx
│   ├── SearchFilters.tsx
│   └── CvSearchResults.tsx
├── lib/                    # Utility libraries
│   ├── auth.ts            # NextAuth configuration
│   └── supabase.ts        # Supabase client utilities
├── middleware.ts           # Route protection
└── types/                  # TypeScript type definitions
```

## 🔐 Authentication Flow

1. **Landing Page**: Users see the beautiful landing page with "Sign in with Google" button
2. **OAuth Flow**: Clicking the button redirects to Google OAuth
3. **Authentication**: After successful Google login, users are redirected to `/search`
4. **Protected Routes**: `/search` and `/upload` are protected by authentication middleware
5. **Session Management**: NextAuth handles session persistence and token refresh
6. **User Storage**: User data is automatically stored in Supabase PostgreSQL

## 💾 Data Persistence

### What Gets Stored in Supabase

- **Users**: Basic profile information (name, email, image)
- **Accounts**: OAuth provider details and tokens
- **Sessions**: Active user sessions
- **Verification Tokens**: Email verification (if enabled)

### Database Tables (Auto-created by NextAuth)

- `users` - User profiles
- `accounts` - OAuth account links
- `sessions` - Active sessions
- `verification_tokens` - Email verification

## 🎨 Landing Page Features

- **Hero Section**: Compelling headline and description
- **Feature Showcase**: Highlights AI-powered search capabilities
- **Multiple CTAs**: Both "Get Started" and "Sign in with Google" buttons
- **Responsive Design**: Optimized for all screen sizes
- **Professional Branding**: Clean, modern design with HireLens branding

## 🛡️ Security Features

- **Route Protection**: Middleware protects sensitive routes
- **Session Validation**: Server-side session verification
- **Secure OAuth**: Google OAuth 2.0 implementation
- **Environment Variables**: Sensitive data stored securely
- **Database Security**: Supabase Row Level Security (RLS)

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Self-hosted servers

## 🔧 Customization

### Styling
- Uses Tailwind CSS for styling
- Easy to customize colors, fonts, and layouts
- Component-based design for easy modifications

### Branding
- Update logo and colors in components
- Modify landing page content
- Customize authentication flow

### Database
- Extend user profiles with custom fields
- Add application-specific tables
- Implement Row Level Security policies

## 📊 Performance

- **Next.js 13+**: Latest React framework with App Router
- **Optimized Images**: Automatic image optimization
- **Code Splitting**: Automatic code splitting for better performance
- **Static Generation**: Where possible for fast loading
- **Supabase**: Fast PostgreSQL database with edge functions

## 🐛 Troubleshooting

### Common Issues

1. **OAuth Redirect Error**: Ensure redirect URIs are correctly configured in Google Console
2. **Environment Variables**: Check that all required env vars are set
3. **Supabase Connection**: Verify Supabase URL and keys are correct
4. **Port Conflicts**: Ensure port 3000 is available
5. **Build Errors**: Clear `.next` folder and reinstall dependencies

### Debug Mode

Enable debug logging by adding to `.env.local`:

```bash
NEXTAUTH_DEBUG=true
```

### Supabase Issues

- Check if your Supabase project is active
- Verify API keys are correct
- Ensure database is not paused (free tier limitation)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review NextAuth.js documentation
- Review Supabase documentation
- Open an issue on GitHub

---

**Built with ❤️ using Next.js, NextAuth.js, Supabase, and Tailwind CSS** 