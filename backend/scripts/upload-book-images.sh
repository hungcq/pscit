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

# Function to determine file extension from MIME type
get_extension_from_mime() {
    local mime=$1
    case "$mime" in
        image/jpeg) echo ".jpg" ;;
        image/png) echo ".png" ;;
        image/gif) echo ".gif" ;;
        image/webp) echo ".webp" ;;
        image/bmp) echo ".bmp" ;;
        image/tiff) echo ".tiff" ;;
        *) echo "" ;;
    esac
}

# Install imagemagick first: brew install imagemagick
# Function to download a single image
download_image() {
    local book_id=$1
    local image_url=$2

    if [ -z "$image_url" ]; then
        echo "No image URL for book $book_id, skipping..."
        return
    fi

    local temp_file="$TEMP_DIR/$book_id"
    local final_file="$TEMP_DIR/${book_id}.jpg"

    # Skip download if final JPEG already exists
    if [ -f "$final_file" ]; then
        echo "Image for book $book_id already exists locally, skipping download."
        return
    fi

    echo "Downloading image for book $book_id"
    curl -s -L -A "Mozilla/5.0" -o "$temp_file" "$image_url"

    if [ ! -s "$temp_file" ]; then
        echo "Failed to download image for book $book_id - file is empty"
        return
    fi

    local mime_type
    mime_type=$(file -b --mime-type "$temp_file")
    if [[ ! "$mime_type" =~ ^image/ ]]; then
        echo "File is not a valid image for book $book_id - MIME: $mime_type"
        rm "$temp_file"
        return
    fi

    if [[ "$mime_type" == "image/jpeg" ]]; then
        echo "Image is JPEG, renaming to .jpg"
        mv "$temp_file" "$final_file"
    else
        echo "Converting image to JPEG for book $book_id"
        if magick "$temp_file" "$final_file"; then
            rm "$temp_file"
        else
            echo "Failed to convert image for book $book_id"
            rm "$temp_file"
            return
        fi
    fi

    # Resize image if larger than 200KB
    file_size_kb=$(du -k "$final_file" | awk '{print $1}')
    if (( file_size_kb > 100 )); then
        echo "Resizing image for book $book_id from ${file_size_kb}KB to max 100KB"
        if ! magick "$final_file" -define jpeg:extent=100kb "$final_file"; then
            echo "Failed to resize image for book $book_id"
        fi
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
#echo "Downloading all images..."
#echo "$books" | while read -r book; do
#    if [ -n "$book" ]; then
#        book_id=$(echo "$book" | jq -r '.id')
#        image_url=$(echo "$book" | jq -r '.main_image')
#        download_image "$book_id" "$image_url"
#    fi
#done

# Clean up existing book images in S3
echo "Cleaning up existing book images in S3..."
aws s3 rm "s3://$S3_BUCKET/book-images/" \
    --region "$AWS_REGION" \
    --recursive

# Sync all images to S3
echo "Syncing images to S3..."
aws s3 sync "$TEMP_DIR" "s3://$S3_BUCKET/book-images/" \
    --region "$AWS_REGION" \
    --delete

echo "Invalidate cloudfront distribution"
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  --no-cli-pager

echo "Done! Images are stored in $TEMP_DIR"