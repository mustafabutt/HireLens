#!/bin/bash

echo "🚀 HireLens OAuth Setup Script"
echo "================================"
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Generate NextAuth secret
echo "🔐 Generating NextAuth secret..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Create .env.local file
echo "📝 Creating .env.local file..."
cat > .env.local << EOF
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Supabase Configuration
SUPABASE_URL=your-supabase-project-url-here
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
EOF

echo ""
echo "✅ .env.local file created successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Go to https://console.cloud.google.com/"
echo "   - Create a new project or select existing one"
echo "   - Enable Google+ API"
echo "   - Go to Credentials → Create Credentials → OAuth 2.0 Client IDs"
echo "   - Set application type to 'Web application'"
echo "   - Add authorized redirect URIs:"
echo "     * http://localhost:3000/api/auth/callback/google (development)"
echo "     * https://yourdomain.com/api/auth/callback/google (production)"
echo "   - Copy Client ID and Client Secret to .env.local"
echo ""
echo "2. Go to https://supabase.com/"
echo "   - Create a new project or select existing one"
echo "   - Go to Settings → API"
echo "   - Copy Project URL, anon key, and service role key"
echo "   - Update .env.local with these values"
echo ""
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "📚 For detailed instructions, see README.md"
echo ""
echo "🔐 Your NextAuth secret has been generated and saved automatically."
echo "⚠️  Keep this secret secure and never commit it to version control!"
echo ""
echo "💾 User data will now be persisted in Supabase PostgreSQL database!" 