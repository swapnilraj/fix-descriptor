#!/bin/bash
set -e

echo "Building Lambda package..."
mvn clean package

echo ""
echo "Lambda JAR created at: target/sbe-lambda-encoder-1.0.0.jar"
echo ""
echo "To deploy to AWS Lambda:"
echo "  aws lambda create-function \\"
echo "    --function-name sbe-encoder \\"
echo "    --runtime java11 \\"
echo "    --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \\"
echo "    --handler com.example.FixEncoderHandler::handleRequest \\"
echo "    --zip-file fileb://target/sbe-lambda-encoder-1.0.0.jar \\"
echo "    --timeout 30 \\"
echo "    --memory-size 512"
echo ""
echo "To test locally with AWS SAM:"
echo "  sam local invoke -e test-event.json"

