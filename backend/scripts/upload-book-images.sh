#!/bin/bash

# Load environment variables
WD="/Users/hungcq/projects/pscit/backend"
source $WD/.env

# Configuration
AWS_REGION="ap-southeast-1"
S3_BUCKET="pscit"
CLOUDFRONT_DISTRIBUTION_ID="E1YQD9PMKB2G7W"

# Create temporary directory for images
TEMP_DIR="$WD/temp"
mkdir -p "$TEMP_DIR"

# Function to download a single image
download_image() {
    local book_id=$1
    local image_url=$2
    
    if [ -z "$image_url" ]; then
        echo "No image URL for book $book_id, skipping..."
        return
    fi

    # Download image
    local temp_file="$TEMP_DIR/$book_id"
    echo "Downloading image for book $book_id"
    
    # Download with basic user agent
    curl -s -L -A "Mozilla/5.0" -o "$temp_file" "$image_url"

    # Check if download was successful and file is not empty
    if [ ! -s "$temp_file" ]; then
        echo "Failed to download image for book $book_id - file is empty"
        return
    fi

    # Check if file is a valid image
    if ! file "$temp_file" | grep -q "image"; then
        echo "Failed to download image for book $book_id - file is not a valid image"
        rm "$temp_file"
        return
    fi
}

# Query books from database
echo "Fetching books from database..."
books=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
    SELECT json_build_object(
        'id', id,
        'main_image', main_image
    )::text
    FROM books
    WHERE main_image IS NOT NULL AND main_image != '';
")

# Download all images first
echo "Downloading all images..."
echo "$books" | while read -r book; do
    if [ -n "$book" ]; then
        book_id=$(echo "$book" | jq -r '.id')
        image_url=$(echo "$book" | jq -r '.main_image')
        download_image "$book_id" "$image_url"
    fi
done

# Clean up existing book images in S3
echo "Cleaning up existing book images in S3..."
aws s3 rm "s3://$S3_BUCKET/book-images/" \
    --region "$AWS_REGION" \
    --recursive

# Sync all images to S3
echo "Syncing images to S3..."
aws s3 sync "$TEMP_DIR" "s3://$S3_BUCKET/book-images/" \
    --region "$AWS_REGION" \
    --cache-control "max-age=31536000,public"

echo "Invalidate cloudfront distribution"
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*"

echo "Done! Images are stored in $TEMP_DIR" 