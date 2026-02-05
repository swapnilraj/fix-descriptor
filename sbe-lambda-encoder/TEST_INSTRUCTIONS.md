# Testing Instructions

## Prerequisites

Install Maven:
```bash
brew install maven
```

## Testing Options

### Option 1: Build and Test with AWS SAM (Recommended)

1. **Install AWS SAM CLI** (if not already installed):
```bash
brew install aws-sam-cli
```

2. **Build the project**:
```bash
mvn clean package
```

3. **Test locally with SAM**:
```bash
sam local invoke SbeEncoderFunction -e test-event.json
```

### Option 2: Deploy to AWS Lambda

1. **Build**:
```bash
mvn clean package
```

2. **Deploy**:
```bash
aws lambda create-function \
  --function-name sbe-encoder \
  --runtime java11 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler com.example.FixEncoderHandler::handleRequest \
  --zip-file fileb://target/sbe-lambda-encoder-1.0.0.jar \
  --timeout 30 \
  --memory-size 512
```

3. **Test**:
```bash
aws lambda invoke \
  --function-name sbe-encoder \
  --payload file://test-event.json \
  output.json

cat output.json
```

### Option 3: Quick Build Script

```bash
./test.sh
```

## Test Event

The `test-event.json` file contains a sample request with:
- Custom SBE schema
- templateId: 1
- Sample order fields

Modify it to test your own schemas and data.

## Expected Output

```json
{
  "success": true,
  "templateId": 1,
  "encodedBytes": 45,
  "encodedBase64": "...",
  "encodedHex": "..."
}
```

## Troubleshooting

- **Maven not found**: Run `brew install maven`
- **SAM not found**: Run `brew install aws-sam-cli`
- **Build fails**: Check Java version (needs Java 11+)
- **Runtime error**: Check schema XML syntax and field names match

