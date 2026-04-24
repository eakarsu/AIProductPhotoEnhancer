#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   AI Product Photo Enhancer Startup   ${NC}"
echo -e "${BLUE}========================================${NC}"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
    echo -e "${RED}✗ .env file not found!${NC}"
    exit 1
fi

# Function to clean up ports
cleanup_ports() {
    echo -e "${YELLOW}Cleaning up ports...${NC}"

    # Kill processes on backend port
    if lsof -ti:$BACKEND_PORT > /dev/null 2>&1; then
        echo -e "${YELLOW}Killing process on port $BACKEND_PORT${NC}"
        lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null
        sleep 1
    fi

    # Kill processes on frontend port
    if lsof -ti:$FRONTEND_PORT > /dev/null 2>&1; then
        echo -e "${YELLOW}Killing process on port $FRONTEND_PORT${NC}"
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null
        sleep 1
    fi

    # Also clean up common ports that might conflict (excluding 5000)
    for port in 3002 3003 5173; do
        if lsof -ti:$port > /dev/null 2>&1; then
            echo -e "${YELLOW}Killing process on port $port${NC}"
            lsof -ti:$port | xargs kill -9 2>/dev/null
        fi
    done

    echo -e "${GREEN}✓ Ports cleaned${NC}"
}

# Function to check PostgreSQL
check_postgres() {
    echo -e "${YELLOW}Checking PostgreSQL...${NC}"

    if ! command -v psql &> /dev/null; then
        echo -e "${RED}PostgreSQL is not installed. Please install it first.${NC}"
        exit 1
    fi

    # Check if PostgreSQL is running
    if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
        echo -e "${YELLOW}Starting PostgreSQL...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null
        else
            sudo service postgresql start 2>/dev/null
        fi
        sleep 3
    fi

    # Verify PostgreSQL is now running
    if pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is running${NC}"
    else
        echo -e "${RED}✗ Failed to start PostgreSQL${NC}"
        exit 1
    fi
}

# Function to setup database
setup_database() {
    echo -e "${YELLOW}Setting up database...${NC}"

    # Create database if not exists
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>/dev/null | grep -q 1 || \
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME" 2>/dev/null

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database ready${NC}"
    else
        echo -e "${YELLOW}! Database may already exist, continuing...${NC}"
    fi
}

# Function to create required directories
create_directories() {
    echo -e "${YELLOW}Creating required directories...${NC}"
    mkdir -p backend/uploads
    echo -e "${GREEN}✓ Directories created${NC}"
}

# Function to install dependencies
install_dependencies() {
    echo -e "${YELLOW}Installing dependencies...${NC}"

    # Backend dependencies
    cd backend
    if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
        npm install
    else
        echo -e "${CYAN}  Backend dependencies up to date${NC}"
    fi
    cd ..

    # Frontend dependencies
    cd frontend
    if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
        npm install
    else
        echo -e "${CYAN}  Frontend dependencies up to date${NC}"
    fi
    cd ..

    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Function to seed database
seed_database() {
    echo -e "${YELLOW}Seeding database...${NC}"
    cd backend
    npm run seed
    cd ..
    echo -e "${GREEN}✓ Database seeded${NC}"
}

# Function to start services with hot reload
start_services() {
    echo -e "${YELLOW}Starting services with hot reload...${NC}"

    # Start backend with nodemon for hot reload
    cd backend
    echo -e "${CYAN}Starting backend with nodemon (hot reload enabled)...${NC}"
    npm run dev &
    BACKEND_PID=$!
    cd ..

    # Wait for backend to start
    sleep 3

    # Start frontend with Vite hot reload
    cd frontend
    echo -e "${CYAN}Starting frontend with Vite (HMR enabled)...${NC}"
    npm run dev &
    FRONTEND_PID=$!
    cd ..

    # Wait for frontend to start
    sleep 3

    echo ""
    echo -e "${GREEN}✓ Services started with hot reload${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}🚀 Backend running at: http://localhost:$BACKEND_PORT${NC}"
    echo -e "${GREEN}🌐 Frontend running at: http://localhost:$FRONTEND_PORT${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${CYAN}📝 Login credentials:${NC}"
    echo -e "${CYAN}   Email: demo@example.com${NC}"
    echo -e "${CYAN}   Password: password123${NC}"
    echo ""
    echo -e "${YELLOW}🔄 Hot reload is enabled!${NC}"
    echo -e "${YELLOW}   - Backend: Changes to .js files will auto-restart${NC}"
    echo -e "${YELLOW}   - Frontend: Changes to React files will hot-refresh${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
}

# Cleanup function for graceful shutdown
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"

    # Kill child processes
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi

    # Kill any remaining node processes on our ports
    cleanup_ports

    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Main execution
echo ""
cleanup_ports
check_postgres
setup_database
create_directories
install_dependencies
seed_database
start_services

# Wait for processes
wait
