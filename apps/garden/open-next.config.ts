import type { OpenNextConfig } from "open-next/types/open-next";

/**
 * AWS Lambda + CloudFront (Function URL origin).
 * @see https://open-next.js.org
 */
const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "aws-lambda-streaming",
      converter: "aws-apigw-v2",
    },
  },
  // Omit separate image Lambda (avoids `sharp` native install during local builds; app has no next/image usage).
  // We run `next build` ourselves in the package script to control/patch the standalone output
  // before OpenNext bundles it. Keep OpenNext's internal "build" step as a no-op.
  buildCommand: 'node -e "process.exit(0)"',
  // Avoid default S3/SQS/Dynamo OpenNext peripherals until wired; sync `.open-next/cache` to S3 via workflow for static cache files only.
  dangerous: {
    disableTagCache: true,
    disableIncrementalCache: true,
  },
};

export default config;
