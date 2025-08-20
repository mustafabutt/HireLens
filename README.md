# CV Search - AI-Powered HR Tool

A complete RAG-based AI tool for HR teams to search and filter CVs using natural language queries.

## Features

- **Bulk CV Upload**: Upload multiple PDF CVs at once
- **AI-Powered Parsing**: Automatically extract candidate information using OpenAI
- **Vector Search**: Find relevant CVs using semantic similarity
- **Smart Filtering**: Filter by skills, location, experience, and more
- **Clean UI**: Simple, intuitive interface built with Next.js and Tailwind

## Tech Stack

- **Frontend**: Next.js 14 + Tailwind CSS
- **Backend**: NestJS
- **Vector Database**: Pinecone
- **AI Provider**: OpenAI
- **File Storage**: Local uploads folder
- **Development**: Local Node.js development

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key
- Pinecone API key

### 1. Clone and Setup

```bash
git clone <your-repo>
cd cv-search
```

### 2. Environment Configuration

Copy the example environment file and fill in your API keys:

```bash
cp env.example .env
```

Edit `.env` with your actual API keys:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=cv-search-index

# Backend
BACKEND_PORT=3001
FRONTEND_PORT=3000
```

### 3. Automated Setup (Recommended)

```bash
./setup.sh
```

This script will:
- Check Node.js installation
- Install all dependencies
- Start both backend and frontend servers
- Open the application in your browser

### 4. Manual Setup (Alternative)

#### Backend
```bash
cd backend
npm install
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Usage

### 1. Upload CVs

- Navigate to the upload page
- Drag and drop PDF files or click to select
- CVs are automatically processed and indexed

### 2. Search CVs

- Use natural language queries like:
  - "React developer in Toronto with 5+ years experience"
  - "Python developer with machine learning skills"
  - "Frontend developer in New York"

### 3. Filter Results

- Results are automatically filtered based on your query
- View candidate details, skills, and experience
- Download original CVs as needed

## API Endpoints

### CV Management
- `POST /api/cv/upload` - Upload single CV
- `POST /api/cv/upload-bulk` - Upload multiple CVs
- `GET /api/cv/search` - Search CVs with query and filters

### Health Check
- `GET /api/health` - API health status

## Project Structure

```
cv-search/
├── frontend/                 # Next.js frontend application
│   ├── components/          # React components
│   ├── pages/              # Next.js pages
│   └── styles/             # Tailwind CSS styles
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── cv/            # CV-related modules
│   │   ├── upload/        # File upload handling
│   │   └── search/        # Search and filtering logic
│   └── uploads/           # Local CV storage
├── setup.sh                # Automated setup script
└── README.md              # This file
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for LLM operations | Yes |
| `PINECONE_API_KEY` | Pinecone API key for vector database | Yes |
| `PINECONE_ENVIRONMENT` | Pinecone environment (e.g., us-east1-aws) | Yes |
| `PINECONE_INDEX_NAME` | Pinecone index name for CV storage | Yes |
| `BACKEND_PORT` | Backend API port | No (default: 3001) |
| `FRONTEND_PORT` | Frontend port | No (default: 3000) |

## Example Search Queries

- "Software engineer with React and Node.js experience"
- "Data scientist with Python and machine learning skills"
- "Product manager in San Francisco with 3+ years experience"
- "Frontend developer with TypeScript and CSS expertise"
- "DevOps engineer with AWS and Docker experience"

## Development

### Running in Development Mode

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Building for Production

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm run start
```

## Troubleshooting

### Common Issues

1. **CV upload fails**: Check file format (PDF only) and file size
2. **Search returns no results**: Verify OpenAI and Pinecone API keys
3. **Port already in use**: Change ports in .env file or kill existing processes

### Logs

Check application logs in the terminal where you started each service:

```bash
# Backend logs
cd backend && npm run start:dev

# Frontend logs
cd frontend && npm run dev
```

### Process Management

```bash
# Find running processes
lsof -i :3000  # Frontend
lsof -i :3001  # Backend

# Kill processes
kill -9 <PID>
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details 