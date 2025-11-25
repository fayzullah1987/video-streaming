#!/bin/bash

# Video Streaming App - Automated Setup Script

# This script sets up both backend and frontend

set -e # Exit on error

echo "🎬 Video Streaming App Setup"
echo "=============================="
echo ""

# Colors for output

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed

if ! command -v node &> /dev/null; then
echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"

# Check if npm is installed

if ! command -v npm &> /dev/null; then
echo -e "${RED}❌ npm is not installed.${NC}"
exit 1
fi

echo -e "${GREEN}✅ npm found: $(npm --version)${NC}"

# Check if FFmpeg is installed

if ! command -v ffmpeg &> /dev/null; then
echo -e "${YELLOW}⚠️  FFmpeg is not installed. Installing...${NC}"

    # Detect OS and install FFmpeg
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install ffmpeg
        else
            echo -e "${RED}❌ Homebrew is not installed. Please install FFmpeg manually.${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update && sudo apt-get install -y ffmpeg
    else
        echo -e "${YELLOW}⚠️  Please install FFmpeg manually for your system.${NC}"
    fi

fi

echo -e "${GREEN}✅ FFmpeg found: $(ffmpeg -version | head -n 1)${NC}"
echo ""

# ==========================================

# Backend Setup

# ==========================================

echo "📦 Setting up Backend..."
echo ""

# Create backend directory structure

mkdir -p backend/src/{controllers,models,routes,services,tests}
mkdir -p backend/uploads/thumbnails

cd backend

# Initialize package.json if it doesn't exist

if [ ! -f package.json ]; then
npm init -y
fi

# Install backend dependencies

echo "Installing backend dependencies..."
npm install express cors multer sequelize pg pg-hstore fluent-ffmpeg ffmpeg-static ffprobe-static dotenv

# Install dev dependencies

npm install --save-dev nodemon jest supertest

echo -e "${GREEN}✅ Backend dependencies installed${NC}"

# Create .env file

if [ ! -f .env ]; then
echo "Creating backend .env file..."
cat > .env << EOF
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=video_streaming
DB_USER=postgres
DB_PASSWORD=password
EOF
echo -e "${GREEN}✅ Backend .env created${NC}"
echo -e "${YELLOW}⚠️  Please update database credentials in backend/.env${NC}"
else
echo -e "${YELLOW}⚠️  Backend .env already exists, skipping...${NC}"
fi

# Update package.json scripts

echo "Updating package.json scripts..."
npm pkg set scripts.start="node src/server.js"
npm pkg set scripts.dev="nodemon src/server.js"
npm pkg set scripts.test="jest --coverage"

echo -e "${GREEN}✅ Backend setup complete${NC}"
echo ""

cd ..

# ==========================================

# Frontend Setup

# ==========================================

echo "🎨 Setting up Frontend..."
echo ""

# Check if frontend directory exists

if [ ! -d "frontend" ]; then
echo "Creating React app..."
npx create-react-app frontend
else
echo -e "${YELLOW}⚠️  Frontend directory already exists${NC}"
fi

cd frontend

# Install frontend dependencies

echo "Installing frontend dependencies..."
npm install lucide-react

# Install Tailwind CSS

echo "Installing Tailwind CSS..."
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Create .env file

if [ ! -f .env ]; then
echo "Creating frontend .env file..."
cat > .env << EOF
REACT_APP_API_URL=http://localhost:3000/api
EOF
echo -e "${GREEN}✅ Frontend .env created${NC}"
else
echo -e "${YELLOW}⚠️  Frontend .env already exists, skipping...${NC}"
fi

# Update tailwind.config.js

cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} \*/
module.exports = {
content: [
"./src/**/\*.{js,jsx,ts,tsx}",
],
theme: {
extend: {},
},
plugins: [],
}
EOF

# Update index.css

cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
margin: 0;
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
sans-serif;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
}

code {
font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
monospace;
}
EOF

echo -e "${GREEN}✅ Frontend setup complete${NC}"
echo ""

cd ..

# ==========================================

# Database Setup

# ==========================================

echo "🗄️ Database Setup"
echo ""

# Check if PostgreSQL is installed

if command -v psql &> /dev/null; then
echo -e "${GREEN}✅ PostgreSQL found${NC}"

    read -p "Do you want to create the database now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Creating database 'video_streaming'..."
        createdb video_streaming 2>/dev/null || echo -e "${YELLOW}⚠️  Database might already exist${NC}"
    fi

else
echo -e "${YELLOW}⚠️  PostgreSQL not found. Please install and configure it manually.${NC}"
echo " macOS: brew install postgresql"
echo " Ubuntu: sudo apt-get install postgresql"
fi

echo ""

# ==========================================

# Create README

# ==========================================

cat > README.md << 'EOF'

# Video Streaming Application

## Quick Start

### Start Backend

```bash
cd backend
npm run dev
```

Backend will run on http://localhost:3000

### Start Frontend

```bash
cd frontend
npm start
```

Frontend will run on http://localhost:3000 or http://localhost:3001

## Configuration

### Backend (.env)

- Update database credentials in `backend/.env`
- Default database: PostgreSQL

### Frontend (.env)

- API URL is set to `http://localhost:3000/api`
- Change if using different backend port

## Features

- ✅ Video upload with progress tracking
- ✅ Automatic thumbnail generation
- ✅ Chunked video streaming (HTTP Range Requests)
- ✅ Video seeking and instant playback
- ✅ Delete functionality
- ✅ Responsive design

# Available Scripts

## Setup & Maintenance

npm run setup - Create all required directories
npm run check - Verify setup and configuration
npm run fix - Quick fix for directory issues
npm run clean - Remove all uploaded files (keeps structure)

## Development

npm run dev - Start server with auto-reload
npm start - Start server in production mode

## Database

npm run db:create - Create database (PostgreSQL)
npm run db:migrate - Run migrations (creates tables)

## Testing

npm test - Run tests with coverage

## Pre-hooks

prestart - Runs setup before start
predev - Runs setup before dev

# Troubleshooting

If you get upload errors:

1. npm run check (diagnose issues)
2. npm run fix (create directories)
3. npm run dev (start server)

If database connection fails:

1. Check .env file exists
2. Verify credentials are correct
3. npm run db:create (create database)
4. npm run dev (start server)
