#!/bin/bash

# Exit on error
set -e

echo "=== Building and Integrating the React Client App ==="

# Step 1: Build the React app
echo "Building React app..."
cd client
npm install
npm run build

# Step 2: Create the target directory in frontend
echo "Creating target directory in frontend..."
mkdir -p ../frontend/react-app

# Step 3: Copy the build files
echo "Copying build files to frontend/react-app..."
cp -r build/* ../frontend/react-app/

# Step 4: Update the React app's index.html to use relative paths
echo "Updating asset paths in index.html..."
cd ../frontend/react-app
sed -i.bak 's/src="\//src="\/react-app\//g' index.html
sed -i.bak 's/href="\//href="\/react-app\//g' index.html
rm index.html.bak

echo "=== Integration Complete ==="
echo "You can now run the unified frontend with: cd frontend && npm start" 