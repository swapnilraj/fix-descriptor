# Testing the SBE Lambda Encoder

## What Was Built

✅ Docker image: `sbe-encoder:latest` (successfully built with Java 17)
✅ Runtime code generation: Generates & compiles SBE classes at runtime
✅ Smart caching: Caches compiled classes by schema hash

## Testing Options

### Option 1: Deploy to AWS Lambda and Test

```bash
# 1. Build the image
docker build -t sbe-encoder:latest .

# 2. Tag for ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker tag sbe-encoder:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/sbe-encoder:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/sbe-encoder:latest

# 3. Create Lambda function
aws lambda create-function \
  --function-name sbe-encoder \
  --package-type Image \
  --code ImageUri=YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/sbe-encoder:latest \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --timeout 300 \
  --memory-size 2048 \
  --ephemeral-storage Size=2048

# 4. Test
aws lambda invoke \
  --function-name sbe-encoder \
  --payload file://test-event.json \
  output.json

cat output.json
```

### Option 2: Local Testing (Maven)

If SAM isn't working, test the code locally with Maven:

```bash
# Build
mvn clean package

# The generated JAR contains all the runtime code generation logic
# You can test the handler class directly with a Java test
```

### Option 3: Fix SAM and Test Locally

If Docker is running but SAM can't detect it:

```bash
# Check Docker socket
ls -la /var/run/docker.sock

# Try restarting Docker Desktop

# Then:
sam build
sam local invoke SbeEncoderFunction -e test-event.json
```

## Expected Behavior

### First Invocation (Cold Start with New Schema)
- Duration: 15-30 seconds
- Generates Java classes from schema XML
- Compiles classes with javac
- Loads classes dynamically
- Encodes message
- Caches compiled classes

### Subsequent Invocations (Same Schema)
- Duration: 100-500ms
- Uses cached compiled classes
- Encodes message

### New Schema
- Duration: 15-30 seconds
- Generates new classes (cached by schema hash)

## Test Event Format

```json
{
  "schema": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
  "templateId": 1,
  "fields": {
    "orderId": 12345,
    "quantity": 100,
    "price": 9950000000,
    "symbol": "AAPL"
  }
}
```

## Success Response

```json
{
  "success": true,
  "templateId": 1,
  "schemaHash": "a3f2c8e1b9d4f6a7",
  "encodedBytes": 45,
  "encodedBase64": "...",
  "encodedHex": "..."
}
```

## Error Response

```json
{
  "success": false,
  "error": "Error message here",
  "errorType": "RuntimeException"
}
```

## Logs to Check

When testing, check CloudWatch Logs for:
- "Schema hash: XXXXX" - confirms schema was hashed
- "Using cached encoder class" - confirms cache hit
- "Generating new SBE codec classes" - confirms code generation
- "Running SBE code generator..." - confirms SBE tool execution
- "Compiling generated classes..." - confirms javac compilation
- "Compilation successful" - confirms classes compiled
- "Successfully encoded message: X bytes" - confirms encoding worked

## Troubleshooting

### Out of Memory
- Increase Lambda memory to 3GB
- Check /tmp usage

### Compilation Failed
- Check schema XML syntax
- Verify SBE schema is valid
- Check CloudWatch logs for javac errors

### ClassNotFoundException
- Verify compilation succeeded
- Check generated class names match expected pattern
- May need to adjust class loading logic

## Next Steps

1. **Test locally**: Fix SAM or deploy to AWS
2. **Monitor performance**: Check cold start vs warm times
3. **Optimize**: Add more aggressive caching if needed
4. **Production**: Consider pre-warming Lambdas for known schemas

