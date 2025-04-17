#!/bin/bash
# SMS Test Script Runner
# Usage: ./scripts/run-test-sms.sh +15551234567

if [ -z "$1" ]; then
  echo "Error: Phone number is required"
  echo "Usage: ./scripts/run-test-sms.sh +15551234567"
  exit 1
fi

PHONE_NUMBER=$1

echo "Testing SMS notification to $PHONE_NUMBER"
echo "----------------------------------------"

# Run the test inside the notification service container
docker exec aesthendamicroservices-notification-service-1 node scripts/test-sms.js "$PHONE_NUMBER" 