#!/bin/bash

# Exit on error
set -e

echo "=== Starting Aesthenda Unified Frontend & Backend ==="

# Step 1: Start the backend services using docker
echo "Starting backend services..."
docker-compose up -d mongo-calendar mongo-user mongo-appointment mongo-payment rabbitmq redis calendar-service

# Step 2: Build and integrate the React app
echo "Building and integrating React app..."
./build-and-integrate.sh

# Step 3: Start the unified frontend server
echo "Starting frontend server..."
cd frontend
npm install
npm start

echo "=== All Services Started ==="
echo "Frontend available at: http://localhost:8080"
echo "Calendar available at: http://localhost:8080/calendar" 