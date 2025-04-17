#!/bin/bash

# Exit on error
set -e

echo "=== Starting Aesthenda Frontend ==="

# Start the frontend server
cd frontend
npm install
npm start

echo "=== Frontend Started ==="
echo "Frontend available at: http://localhost:8080"
echo "Calendar available at: http://localhost:8080/calendar"