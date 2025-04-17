#!/bin/bash

# Make sure we're in the project root
cd "$(dirname "$0")"

echo "Preparing Dockerfiles for dev mode..."

# Function to modify Dockerfile to use dev mode
modify_dockerfile() {
  local service_dir=$1
  if [ -f "$service_dir/Dockerfile" ]; then
    echo "Modifying $service_dir/Dockerfile"
    # Use sed to comment out build step and change CMD to use dev mode
    sed -i.bak -e 's/RUN npm run build/# RUN npm run build/g' \
               -e 's/CMD \["npm", "start"\]/CMD \["npm", "run", "dev"\]/g' \
               "$service_dir/Dockerfile"
    rm -f "$service_dir/Dockerfile.bak"
  fi
}

# Modify each service's Dockerfile
for service_dir in services/*/; do
  modify_dockerfile "$service_dir"
done

# Also modify API gateway
modify_dockerfile "api-gateway"

echo "Starting MongoDB and basic infrastructure..."
docker-compose up -d mongo-user mongo-appointment mongo-payment mongo-calendar rabbitmq redis

sleep 5

echo "Starting API Gateway and frontend services..."
docker-compose up -d api-gateway

echo "Infrastructure is now running!"
echo "API Gateway: http://localhost:4000"
echo "RabbitMQ Dashboard: http://localhost:15672 (guest/guest)"

# Start the frontend separately
cd frontend
npm install
npm start 