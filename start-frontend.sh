#!/bin/bash
export PATH="/Users/mkh/.nvm/versions/node/v22.22.0/bin:$PATH"
cd ai-chat-frontend
npx ng serve --port "${PORT:-4200}" --host 0.0.0.0
