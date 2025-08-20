#!/bin/bash

# CV Search AI Tool Setup Script (Local Development)
echo "🚀 CV Search AI Tool Setup - Local Development"
echo "==============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first:"
    echo "   https://nodejs.org/en/download/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    echo "   Please upgrade Node.js: https://nodejs.org/en/download/"
    exit 1
fi

echo "✅ Node.js $(node -v) is installed"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm is available"
echo ""

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created"
fi

# Ensure backend has access to env as well
if [ ! -f backend/.env ]; then
    if [ -f .env ]; then
        echo "🔗 Copying .env to backend/.env for server access..."
        cp .env backend/.env
        echo "✅ backend/.env created"
    else
        echo "📝 Creating backend/.env from template..."
        cp env.example backend/.env
    fi
fi

echo ""
echo "⚠️  IMPORTANT: Please edit .env (and backend/.env) with your actual API keys:"
echo "   - OpenAI API key"
echo "   - Pinecone API key and environment"
echo "   - Pinecone index name"
echo ""
echo "   You can get these from:"
echo "   - OpenAI: https://platform.openai.com/api-keys"
echo "   - Pinecone: https://app.pinecone.io/"
echo ""

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p backend/uploads
echo "✅ Uploads directory created"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."

# Install backend dependencies
echo "🔧 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "🎨 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

echo "🚀 Starting the application..."

echo "🔧 Starting backend server..."
cd backend
npm run start:dev &
BACKEND_PID=$!
cd ..

sleep 3

echo "🎨 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

sleep 5

if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "🎉 CV Search is now running!"
    echo "📱 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:3001"
else
    echo "❌ Backend health check failed. Ensure OPENAI_API_KEY and Pinecone keys are set in .env."
fi

echo ""
echo "Press Ctrl+C to stop. Cleaning up on exit."
trap "echo ''; echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ Services stopped'; exit 0" INT TERM
wait 