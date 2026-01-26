#!/bin/bash
set -e

echo "=== Testing SBE Lambda Encoder Docker Image ==="
echo ""
echo "Starting Docker container..."

# Run the Lambda function in Docker
docker run --rm \
  -e AWS_LAMBDA_FUNCTION_NAME=sbe-encoder \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=test \
  -e AWS_SECRET_ACCESS_KEY=test \
  -v $(pwd)/test-event.json:/tmp/event.json \
  sbe-encoder:latest \
  bash -c "cat /tmp/event.json | java -jar ${LAMBDA_TASK_ROOT}/lib/sbe-lambda-encoder-1.0.0.jar com.example.FixEncoderHandler"

echo ""
echo "=== Test Complete ==="

