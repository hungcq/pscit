#!/bin/bash

# Load environment variables
WD="/Users/hungcq/projects/pscit/backend"
source $WD/.env

# Configuration
AWS_REGION="ap-southeast-1"
S3_BUCKET="pscit"

# Create temporary directory for images
TEMP_DIR="$WD/temp"
mkdir -p "$TEMP_DIR"

# Function to download and upload a single image
process_image() {
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

    # Upload to S3
    echo "Uploading image for book $book_id to S3"
    aws s3 cp "$temp_file" "s3://$S3_BUCKET/book-images/$book_id" \
        --region "$AWS_REGION" \
        --cache-control "max-age=31536000,public"

    # Clean up
    rm "$temp_file"
}

# Clean up existing book images in S3
echo "Cleaning up existing book images in S3..."
aws s3 rm "s3://$S3_BUCKET/book-images/" \
    --region "$AWS_REGION" \
    --recursive

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

# Process each book
echo "$books" | while read -r book; do
    if [ -n "$book" ]; then
        book_id=$(echo "$book" | jq -r '.id')
        image_url=$(echo "$book" | jq -r '.main_image')
        process_image "$book_id" "$image_url"
    fi
done

# Clean up
rm -rf "$TEMP_DIR"
echo "Done!" 