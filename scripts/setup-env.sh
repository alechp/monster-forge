#!/bin/bash
# Generate .env file from 1Password vault
# Usage: ./scripts/setup-env.sh

set -e

echo "Fetching secrets from 1Password..."

ANTHROPIC_KEY=$(op read "op://monster-forge/anthropic-claude-vision/api-key")
GOOGLE_KEY=$(op read "op://monster-forge/google-ai-studio/api-key")

cat > .env << EOF
# Monster Forge Environment Variables
# Generated from 1Password vault: monster-forge

# Dev server port (avoid conflicts with other services)
PORT=3847

# Anthropic API (Claude Vision)
REACT_APP_ANTHROPIC_API_KEY=${ANTHROPIC_KEY}

# Google Cloud / Gemini API (Nano Banana)
REACT_APP_GOOGLE_API_KEY=${GOOGLE_KEY}
EOF

echo "Created .env file with API keys from 1Password"
