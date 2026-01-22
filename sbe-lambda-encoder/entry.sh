#!/bin/sh
# Entry script for Lambda function

# JVM flags for Agrona (SBE) to access unsafe APIs
JVM_FLAGS="--add-opens java.base/jdk.internal.misc=ALL-UNNAMED --add-opens java.base/java.nio=ALL-UNNAMED"

if [ -z "${AWS_LAMBDA_RUNTIME_API}" ]; then
  # Running locally with RIE
  exec /usr/local/bin/aws-lambda-rie java \
    $JVM_FLAGS \
    -cp /var/task/sbe-lambda-encoder-1.0.0.jar \
    com.amazonaws.services.lambda.runtime.api.client.AWSLambda \
    "$1"
else
  # Running in Lambda
  exec java \
    $JVM_FLAGS \
    -cp /var/task/sbe-lambda-encoder-1.0.0.jar \
    com.amazonaws.services.lambda.runtime.api.client.AWSLambda \
    "$1"
fi

