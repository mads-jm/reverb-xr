#!/bin/bash

# Reverb XR Webpack Build & Run Script
# -----------------------------------

# Text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo -e "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    echo -e "Please install npm (it usually comes with Node.js)"
    exit 1
fi

# Check if required packages are installed
echo -e "${BLUE}Checking dependencies...${NC}"
MISSING_DEPS=0

for pkg in webpack webpack-cli webpack-dev-server; do
    if ! npm list -g $pkg &> /dev/null && ! npm list $pkg &> /dev/null; then
        echo -e "${YELLOW}Warning: $pkg is not installed.${NC}"
        MISSING_DEPS=1
    fi
done

if [ $MISSING_DEPS -eq 1 ]; then
    echo -e "${YELLOW}Some dependencies are missing. Would you like to install them? (y/n)${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Installing dependencies...${NC}"
        npm install webpack webpack-cli webpack-dev-server chalk --save-dev
    else
        echo -e "${YELLOW}Continuing without installing dependencies. This may cause errors.${NC}"
    fi
fi

# Check if chalk is installed (for the Node.js script)
if ! npm list chalk &> /dev/null; then
    echo -e "${YELLOW}Installing chalk for better console output...${NC}"
    npm install chalk --save-dev
fi

# Function to display help
show_help() {
    echo -e "${BLUE}Reverb XR Webpack Build Script${NC}"
    echo
    echo -e "Usage:"
    echo -e "  ${YELLOW}./build.sh [command]${NC}"
    echo
    echo -e "Commands:"
    echo -e "  ${GREEN}dev${NC}     - Build for development"
    echo -e "  ${GREEN}prod${NC}    - Build for production"
    echo -e "  ${GREEN}serve${NC}   - Start development server"
    echo -e "  ${GREEN}start${NC}   - Build for development and start server"
    echo -e "  ${GREEN}help${NC}    - Show this help message"
    echo
    echo -e "Examples:"
    echo -e "  ${BLUE}./build.sh dev${NC}     - Build project for development"
    echo -e "  ${BLUE}./build.sh prod${NC}    - Build project for production"
    echo -e "  ${BLUE}./build.sh serve${NC}   - Start webpack-dev-server"
    echo -e "  ${BLUE}./build.sh start${NC}   - Build and start server"
}

# Process command line arguments
COMMAND=${1:-help}

case $COMMAND in
    dev)
        echo -e "${GREEN}Building for development...${NC}"
        node webpack-scripts.js dev
        ;;
    prod)
        echo -e "${GREEN}Building for production...${NC}"
        node webpack-scripts.js prod
        ;;
    serve)
        echo -e "${GREEN}Starting development server...${NC}"
        node webpack-scripts.js serve
        ;;
    start)
        echo -e "${GREEN}Building and starting development server...${NC}"
        node webpack-scripts.js start
        ;;
    help)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        show_help
        exit 1
        ;;
esac 