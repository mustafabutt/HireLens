# 🚀 Quick Start Guide

Get CV Search running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn available
- OpenAI API key
- Pinecone API key

## Step 1: Clone and Setup

```bash
git clone <your-repo>
cd cv-search
```

## Step 2: Run Setup Script

```bash
./setup.sh
```

The setup script will:
- ✅ Check Node.js installation
- 📝 Create `.env` file from template
- ⚠️  Prompt you to add your API keys
- 📦 Install all dependencies
- 🚀 Start both backend and frontend servers

## Step 3: Add Your API Keys

Edit the `.env` file with your actual keys:

```env
OPENAI_API_KEY=sk-your-actual-openai-key
PINECONE_API_KEY=your-actual-pinecone-key
PINECONE_ENVIRONMENT=us-east1-aws
PINECONE_INDEX_NAME=cv-search-index
```

## Step 4: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## Step 5: Upload Your First CV

1. Go to http://localhost:3000/upload
2. Drag & drop a PDF CV
3. Wait for AI processing
4. Go to search page and try a query!

## Example Search Queries

- "React developer in Toronto with 5+ years experience"
- "Python developer with machine learning skills"
- "Frontend developer in New York"

## Troubleshooting

### Services won't start?
```bash
# Check if ports are in use
lsof -i :3000  # Frontend
lsof -i :3001  # Backend

# Kill processes if needed
kill -9 <PID>
```

### Need to restart?
```bash
# Stop the setup script with Ctrl+C
# Then run again
./setup.sh
```

### Check service status?
```bash
# Backend health
curl http://localhost:3001/api/health

# Frontend
curl http://localhost:3000
```

## Manual Setup (Alternative)

If you prefer not to use the setup script:

```bash
# 1. Copy environment template
cp env.example .env

# 2. Edit .env with your API keys

# 3. Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Start services
cd backend && npm run start:dev &
cd frontend && npm run dev &
```

## Next Steps

- 📚 Read the full [README.md](README.md) for detailed documentation
- 🔧 Customize the application for your needs
- 🚀 Deploy to production when ready

---

**Need help?** Check the [README.md](README.md) or create an issue in the repository. 