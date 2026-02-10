## SBE Lambda (encode/decode)

This package deploys serverless `/encode` and `/decode` endpoints backed by the TypeScript SBE encode/decode logic.

### Build and deploy (SAM)

From `apps/lambda/sam`:

```
sam build
sam deploy --guided
```

After deploy, grab the HTTP API base URL from the SAM outputs and set:

```
ENCODER_URL=https://<api-id>.execute-api.<region>.amazonaws.com
```

The frontend calls:

- `${ENCODER_URL}/encode`
- `${ENCODER_URL}/decode`

### Notes

- The Lambda image bundles Java and the SBE tool JAR; codegen writes to `/tmp/sbe-codecs`.
- Enable verbose logs by setting `SBE_LOG=1` in the function environment.
