set dotenv-load

# Build and sign the extension, submitting it to addons.mozilla.org
# The bundle is minified, so AMO review needs the readable source alongside it
# (built from the committed tree; see readme "Development" for build steps).
push:
    npm run publish
    git archive --format=zip -o web-ext-artifacts/better-email-source.zip HEAD
    npx web-ext sign --api-key="$AMO_JWT_ISSUER" --api-secret="$AMO_JWT_SECRET" --channel=listed --upload-source-code=web-ext-artifacts/better-email-source.zip
    @echo "Manage: https://addons.mozilla.org/en-US/developers/addon/better-email/edit"
    @echo "Listing: https://addons.mozilla.org/en-US/firefox/addon/better-email/"

# What CI runs on every PR (.github/workflows/ci.yml); run it before pushing.
ci:
    npm ci
    npm run publish
    npx web-ext lint --warnings-as-errors
    npm run check
