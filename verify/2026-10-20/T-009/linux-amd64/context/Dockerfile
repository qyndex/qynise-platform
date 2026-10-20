FROM node@sha256:85a395c77b811fa7f5b5e4aa69cd6eb4c3b80c7f1a8e34704dc0ce061e5b404e

# Candidate dependencies are installed afresh at verification time, offline.
# Only their public immutable lockfile tarballs and browser runtime are seeded.
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers \
    npm_config_cache=/opt/npm-cache \
    npm_config_logs_dir=/tmp/npm-logs \
    npm_config_offline=true \
    npm_config_update_notifier=false \
    npm_config_audit=false \
    npm_config_fund=false \
    HOME=/tmp
WORKDIR /opt/public-seed
COPY package.json package-lock.json ./
RUN npm ci --offline=false --ignore-scripts --no-audit --no-fund \
    && node node_modules/playwright/cli.js install --with-deps chromium \
    && chmod -R a+rX /opt/npm-cache /opt/playwright-browsers \
    && rm -rf /opt/public-seed/node_modules /var/lib/apt/lists/* /tmp/npm-logs
RUN apt-get update \
    && apt-get install -y --no-install-recommends git tar ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /tmp
USER 65532:65532
