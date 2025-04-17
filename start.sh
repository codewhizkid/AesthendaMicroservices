#!/bin/bash

# Start MongoDB container
echo "Starting MongoDB container..."
docker compose up -d mongo-calendar

# Wait for MongoDB to start
echo "Waiting for MongoDB to start..."
sleep 5

# Start the calendar service
echo "Starting calendar service..."
cd services/calendar-service && npm run dev &
CALENDAR_PID=$!

# Wait for calendar service to start
echo "Waiting for calendar service to start..."
sleep 5

# Start the client
echo "Starting client application..."
cd ../../client && npm start &
CLIENT_PID=$!

echo "All services started!"
echo "Calendar API available at: http://localhost:5005/graphql"
echo "Client application available at: http://localhost:3000"

# Handle termination
trap "kill $CALENDAR_PID $CLIENT_PID; exit" SIGINT SIGTERM

# Keep script running
wait 