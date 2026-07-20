#!/bin/bash
# Setup Africa's Talking environment variables in Vercel
# Run: bash scripts/setup-africas-talking-env.sh

echo "Setting up Africa's Talking env vars in Vercel..."
echo ""

# These are the credentials Eric shared
echo "AT_USERNAME=mobisms"
echo "AT_API_KEY=4bb94a4c20df59e4ae439def3c49e64829e4ec68ce667d7bfa0dfa3e31380723"
echo "AT_SENDER_ID=KILIMO"
echo ""

echo "To set these in Vercel, run:"
echo "  npx vercel env add AT_USERNAME production"
echo "  (enter: mobisms)"
echo ""
echo "  npx vercel env add AT_API_KEY production"
echo "  (enter: 4bb94a4c20df59e4ae439def3c49e64829e4ec68ce667d7bfa0dfa3e31380723)"
echo ""
echo "  npx vercel env add AT_SENDER_ID production"
echo "  (enter: KILIMO)"
echo ""
echo "Or set them via Vercel dashboard:"
echo "  https://vercel.com/karthick-sivaraj-s-projects/mobipay-agrobase/settings/environment-variables"
echo ""
echo "After setting, redeploy:"
echo "  git commit --allow-empty -m 'trigger redeploy for AT env vars' && git push"
