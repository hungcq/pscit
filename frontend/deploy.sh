#!/bin/bash

# Configuration
BUCKET_NAME="pscit"
DIST_DIR="dist"
REGION="ap-southeast-1"  # Change this to your desired AWS region

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
    echo "Usage: $0 [environment]"
    echo "Environments:"
    echo "  dev     - Development environment"
    echo "  staging - Staging environment"
    echo "  prod    - Production environment"
    exit 1
}

# Check if environment is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ No environment specified${NC}"
    usage
fi

ENV=$1
ENV_FILE=".env.${ENV}"

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Environment file $ENV_FILE not found${NC}"
    usage
fi

echo "🌍 Using environment: $ENV"
echo "📄 Using environment file: $ENV_FILE"

# Copy environment file to .env
cp "$ENV_FILE" .env

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application
echo "🔨 Building application..."
npm run build

echo "🚀 Starting S3 deployment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if bucket exists
if ! aws s3api head-bucket --bucket $BUCKET_NAME 2>/dev/null; then
    echo -e "${RED}❌ Bucket $BUCKET_NAME does not exist or you don't have access to it.${NC}"
    exit 1
fi

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
    echo -e "${RED}❌ Build directory ($DIST_DIR) not found. Please run 'npm run build' first.${NC}"
    exit 1
fi

# Upload files to S3
echo "📤 Uploading files to S3..."
aws s3 sync $DIST_DIR s3://$BUCKET_NAME \
    --region $REGION \
    --delete \
    --cache-control "max-age=31536000,public" \
    --exclude "*.html" \
    --exclude "*.json" \
    --exclude "*.xml"

# Upload HTML files with different cache control
echo "📤 Uploading HTML files..."
aws s3 sync $DIST_DIR s3://$BUCKET_NAME \
    --region $REGION \
    --delete \
    --cache-control "no-cache" \
    --include "*.html"

# Upload JSON and XML files with different cache control
echo "📤 Uploading JSON and XML files..."
aws s3 sync $DIST_DIR s3://$BUCKET_NAME \
    --region $REGION \
    --delete \
    --cache-control "no-cache" \
    --include "*.json" \
    --include "*.xml"

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your website is available at: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com${NC}"
