# SBE Lambda Encoder with Runtime Code Generation

AWS Lambda function that **generates SBE codec classes at runtime**, compiles them, and uses them to encode messages. Uses [Simple Binary Encoding (SBE)](https://github.com/aeron-io/simple-binary-encoding) from aeron-io.

## Features

- ✅ **Runtime Code Generation**: Generates SBE classes from schema at runtime
- ✅ **Dynamic Compilation**: Compiles Java code using JDK in Lambda
- ✅ **Smart Caching**: Caches compiled classes by schema hash
- ✅ **Docker-based**: Uses Lambda Container Image with full JDK
- ✅ **SAM Local Testing**: Test locally before deploying

## How It Works

1. Receives FIX message (tag=value format) + SBE schema XML
2. Parses FIX message into tag→value pairs
3. Extracts field ID→name mapping from SBE schema
4. Maps FIX tags to SBE fields using schema field IDs
5. Generates SHA-256 hash of schema for caching
6. If cached: loads pre-compiled classes (~100ms)
7. If not cached:
   - Runs SBE code generator → generates Java files
   - Compiles Java files → `.class` files
   - Loads classes dynamically with ClassLoader
   - Caches for future use (~10-30s)
8. Uses reflection to encode message
9. Returns encoded bytes (Base64 + Hex)

## Performance

- **Cold start:** 15-30 seconds (first time with new schema)
- **Warm (cached schema):** 100-500ms
- **Warm (new schema):** 10-30 seconds
- **Memory:** 2GB recommended
- **Storage:** 2GB ephemeral storage

## Prerequisites

- Docker
- AWS SAM CLI
- Maven (for local Java builds)

## Build and Test Locally

```bash
# Build Docker image
sam build

# Test locally
sam local invoke SbeEncoderFunction -e test-event.json

# Or use convenience script
./test-local.sh
```

## Deploy to AWS

### First-Time Deployment

For the first deployment, use the guided mode which will walk you through the configuration:

```bash
# Build the Docker image
sam build

# Deploy with guided setup (interactive)
sam deploy --guided
```

During the guided setup, you'll be prompted for:
- **Stack Name**: Enter a name (e.g., `sbe-encoder-stack`)
- **AWS Region**: Choose your region (e.g., `us-east-1`)
- **Confirm changes before deploy**: `Y` (recommended for first time)
- **Allow SAM CLI IAM role creation**: `Y` (required)
- **Disable rollback**: `N` (recommended)
- **Save arguments to configuration file**: `Y` (saves to `samconfig.toml`)
- **SAM configuration file**: Press Enter (uses default `samconfig.toml`)
- **SAM configuration environment**: Press Enter (uses default `default`)

The guided deployment will:
1. Create an ECR repository for your Docker image
2. Build and push the Docker image to ECR
3. Create the Lambda function with 2GB memory and 5-minute timeout
4. Create necessary IAM roles
5. Save your configuration to `samconfig.toml` for future deployments

### Updating an Existing Deployment

After the first deployment, updating is simpler:

```bash
# Build the updated Docker image
sam build

# Deploy using saved configuration
sam deploy
```

This will:
- Use the settings saved in `samconfig.toml`
- Build and push the updated Docker image
- Update the Lambda function with the new image
- No prompts required

### Manual Deployment (Non-Interactive)

If you already know your configuration or want to script the deployment:

```bash
# Build
sam build

# Deploy directly
sam deploy \
  --stack-name sbe-encoder-stack \
  --region us-east-1 \
  --capabilities CAPABILITY_IAM \
  --resolve-image-repos \
  --no-confirm-changeset
```

### Deployment Verification

After deployment, verify the Lambda function:

```bash
# Get the function ARN from CloudFormation outputs
aws cloudformation describe-stacks \
  --stack-name sbe-encoder-stack \
  --query 'Stacks[0].Outputs'

# Test the deployed function
aws lambda invoke \
  --function-name sbe-encoder-stack-SbeEncoderFunction-XXXXX \
  --payload file://test-event.json \
  response.json

# View the response
cat response.json
```

### Cleanup

To delete the Lambda function and all resources:

```bash
sam delete --stack-name sbe-encoder-stack
```

This will:
- Delete the Lambda function
- Delete the IAM roles
- Delete the CloudFormation stack
- **Note**: The ECR repository will need to be manually deleted if you want to remove it

## Usage

### Input Format

Send a FIX message (tag=value format) with an SBE schema. The schema's field `id` attributes map directly to FIX tags:

```json
{
  "schema": "<sbe xml schema as string>",
  "messageId": 1,
  "fixMessage": "35=D|11=12345|38=100|44=99.50|55=AAPL"
}
```

**Parameters:**
- `schema` (required): SBE XML schema (can contain multiple message types)
- `messageId` (required for encode): Numeric SBE template ID (e.g., 1, 2, 3) from `<sbe:message id="1">`
- `messageId` (optional for decode): If not provided, extracts from SBE message header
- `fixMessage` (for encode): FIX message in tag=value format
- `encodedMessage` (for decode): Base64 or hex-encoded SBE message

**Key Point:** In your SBE schema, the field `id` attribute corresponds to the FIX tag number:

```xml
<field name="orderId" id="11" type="uint64"/>    <!-- FIX tag 11 -->
<field name="quantity" id="38" type="uint64"/>   <!-- FIX tag 38 -->
<field name="price" id="44" type="int64"/>       <!-- FIX tag 44 -->
<data name="symbol" id="55" type="varStringEncoding"/>  <!-- FIX tag 55 -->
```

### Response Format

```json
{
  "success": true,
  "messageId": 1,
  "fixMessage": "35=D|11=12345|38=100|44=99.50|55=AAPL",
  "parsedFields": {
    "11": "12345",
    "38": "100",
    "44": "99.50",
    "55": "AAPL"
  },
  "mappedFields": {
    "orderId": 12345,
    "quantity": 100,
    "price": 9950000000,
    "symbol": "AAPL"
  },
  "schemaHash": "3b743a2f362a1c7f",
  "encodedBytes": 24,
  "encodedBase64": "OTAAAAAAAABkAAAAAAAAAIDzEFECAAAA",
  "encodedHex": "3930000000000000640000000000000080f3105102000000"
}
```

## Schema Format

SBE XML schema with field `id` attributes matching FIX tag numbers. You can define **multiple message types** in a single schema:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sbe:messageSchema xmlns:sbe="http://fixprotocol.io/2016/sbe"
                   package="com.example.sbe"
                   id="1"
                   version="0"
                   byteOrder="littleEndian">
    <types>
        <composite name="messageHeader">
            <type name="blockLength" primitiveType="uint16"/>
            <type name="templateId" primitiveType="uint16"/>
            <type name="schemaId" primitiveType="uint16"/>
            <type name="version" primitiveType="uint16"/>
        </composite>
        <composite name="varStringEncoding">
            <type name="length" primitiveType="uint16"/>
            <type name="varData" primitiveType="uint8" length="0"/>
        </composite>
    </types>
    <sbe:message name="Order" id="1">
        <field name="orderId" id="11" type="uint64"/>      <!-- FIX tag 11 = ClOrdID -->
        <field name="quantity" id="38" type="uint64"/>     <!-- FIX tag 38 = OrderQty -->
        <field name="price" id="44" type="int64"/>         <!-- FIX tag 44 = Price -->
        <data name="symbol" id="55" type="varStringEncoding"/>  <!-- FIX tag 55 = Symbol -->
    </sbe:message>
    <sbe:message name="SecurityDefinition" id="2">
        <field name="SecurityIDSource" id="22" type="int64"/>
        <field name="SecurityType" id="167" type="int64"/>
        <data name="Symbol" id="55" type="varStringEncoding"/>
        <data name="SecurityID" id="48" type="varStringEncoding"/>
    </sbe:message>
</sbe:messageSchema>
```

**Important:** 
- The field `id` attribute directly maps to FIX tag numbers
- You can define multiple message types and specify which one to use with the `messageId` parameter
- The `messageId` corresponds to the `id` attribute in `<sbe:message id="1">`
- This ID is encoded in the SBE message header as `templateId`

## Caching Strategy

The Lambda caches compiled classes in two layers:

1. **In-Memory Cache**: Loaded classes persist across warm invocations
2. **Disk Cache (`/tmp`)**: Compiled classes persist until Lambda container is recycled

Schema hashing ensures:
- Same schema = reuse cached classes (fast)
- Different schema = regenerate and compile (slow)

## Lambda Configuration

Recommended settings:

- **Runtime**: Container Image (Amazon Corretto 11 JDK)
- **Memory**: 2048 MB (2GB)
- **Timeout**: 300 seconds (5 minutes)
- **Ephemeral Storage**: 2048 MB (2GB)

## Environment Variables

```yaml
JAVA_TOOL_OPTIONS: "-XX:+TieredCompilation -XX:TieredStopAtLevel=1"
```

Speeds up JIT compilation for Lambda cold starts.

## Architecture

```
┌─────────────────────────────────────────┐
│ Lambda Container (Amazon Corretto JDK)  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ 1. Receive Schema + Fields       │  │
│  └──────────────────────────────────┘  │
│              │                          │
│              ▼                          │
│  ┌──────────────────────────────────┐  │
│  │ 2. Hash Schema (SHA-256)         │  │
│  └──────────────────────────────────┘  │
│              │                          │
│              ▼                          │
│  ┌──────────────────────────────────┐  │
│  │ 3. Check Cache                   │  │
│  │    - In-memory (HashMap)         │  │
│  │    - Disk (/tmp/sbe-encoder)     │  │
│  └──────────────────────────────────┘  │
│         │              │                │
│    Cached?         Not Cached           │
│         │              │                │
│         ▼              ▼                │
│     Skip to 7   ┌──────────────────┐   │
│                 │ 4. Generate SBE  │   │
│                 │    Java classes  │   │
│                 └──────────────────┘   │
│                         │               │
│                         ▼               │
│                 ┌──────────────────┐   │
│                 │ 5. Compile with  │   │
│                 │    javac         │   │
│                 └──────────────────┘   │
│                         │               │
│                         ▼               │
│                 ┌──────────────────┐   │
│                 │ 6. Load Classes  │   │
│                 │    (ClassLoader) │   │
│                 └──────────────────┘   │
│                         │               │
│                         ▼               │
│  ┌──────────────────────────────────┐  │
│  │ 7. Encode using Reflection       │  │
│  └──────────────────────────────────┘  │
│              │                          │
│              ▼                          │
│  ┌──────────────────────────────────┐  │
│  │ 8. Return Encoded Bytes          │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Limitations

- **Cold start**: 15-30s for new schemas
- **Memory**: Requires 2GB minimum
- **JDK Required**: Must use container image (not zip deployment)
- **Reflection overhead**: Slightly slower than pre-compiled classes
- **Cache lifetime**: /tmp cleared when container is recycled

## Troubleshooting

### "No Java compiler available"
- Ensure Dockerfile uses JDK (not JRE)
- Check `ToolProvider.getSystemJavaCompiler()` returns non-null

### Out of Memory
- Increase Lambda memory to 2GB or higher
- Check /tmp usage: `du -sh /tmp/sbe-encoder`

### Compilation timeout
- Increase Lambda timeout to 300 seconds
- Check SBE schema complexity

### ClassNotFoundException
- Check generated class names match expected pattern
- Verify compilation succeeded (check logs)

## Files

- `Dockerfile` - Container image with JDK
- `template.yaml` - SAM template
- `src/main/java/com/example/FixEncoderHandler.java` - Main handler
- `test-event.json` - Sample test event
- `test-local.sh` - Local testing script

## Dependencies

- `uk.co.real-logic:sbe-all:1.37.0` - SBE from aeron-io
- `com.amazonaws:aws-lambda-java-core` - AWS Lambda runtime
- `com.google.code.gson:gson` - JSON processing

## License

Apache 2.0 (matching SBE license)

## References

- [SBE GitHub](https://github.com/aeron-io/simple-binary-encoding)
- [AWS Lambda Container Images](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html)
- [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/)
