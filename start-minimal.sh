#!/bin/bash

# Start MongoDB containers
echo "Starting MongoDB containers..."
docker-compose up -d mongo-user mongo-appointment mongo-payment mongo-calendar

# Wait for MongoDB to start
echo "Waiting for MongoDB to start..."
sleep 5

# Start RabbitMQ and Redis
echo "Starting RabbitMQ and Redis..."
docker-compose up -d rabbitmq redis

# Start the API gateway
echo "Starting API gateway..."
docker-compose up -d api-gateway

echo "Basic infrastructure is running!"
echo "API Gateway available at: http://localhost:4000"
echo "RabbitMQ Management UI: http://localhost:15672 (guest/guest)"

# Keep script running
echo "Press Ctrl+C to stop services"
read -r 