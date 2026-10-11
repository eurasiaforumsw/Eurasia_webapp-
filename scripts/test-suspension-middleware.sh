#!/bin/bash

# Load environment variables
source .env

# Run the test script
npx tsx scripts/test-suspension-middleware.ts
