#!/bin/bash

# Netlify Deployment Script

echo "Preparing to deploy application to Netlify..."

# Install Netlify CLI if not already installed
if ! command -v netlify &> /dev/null; then
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Set the Netlify token
export NETLIFY_AUTH_TOKEN="nfp_4HKBTijfETKDpSXC5yuqbj3TZjjvNLPr8e89"

# Build the application
echo "Building the application..."
npm install
npm run build

# Deploy to Netlify
echo "Deploying to Netlify..."
netlify deploy --prod

echo "Deployment completed!"