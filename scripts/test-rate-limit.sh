#!/bin/bash

# Load environment variables from .env file
export $(grep -v '^#' /Users/rischen/Documents/GitHub/Eurasia_webapp/.env | xargs)

# Run the test script
npx tsx scripts/test-rate-limit.ts
