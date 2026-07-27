set dotenv-load

# Build and sign the extension, submitting it to addons.mozilla.org
push:
    npm run publish
    npx web-ext sign --api-key="$AMO_JWT_ISSUER" --api-secret="$AMO_JWT_SECRET" --channel=listed
