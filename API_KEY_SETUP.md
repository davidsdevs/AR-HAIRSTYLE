# API Key Setup Guide

## ✅ Security Fix Applied

The hardcoded API key has been **removed** from the source code for security. The application now requires the API key to be set via environment variables.

## 🔑 Setting Up Your API Key

### Step 1: Create `.env` File

Create a `.env` file in the root directory of the project with the following content:

```env
# OpenRouter API Configuration
OPENROUTER_API_KEY=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

# Server Configuration
PORT=3001
NODE_ENV=development

# Origin URL (for OpenRouter API headers)
ORIGIN=http://localhost:5173
```

### Step 2: Verify `.env` is in `.gitignore`

The `.env` file should already be in `.gitignore` to prevent committing your API key to version control. Verify this by checking that `.env` is listed in `.gitignore`.

### Step 3: Restart the Server

After creating the `.env` file, restart your Node.js server:

```bash
npm run server
```

## 🔒 Security Best Practices

✅ **DO:**
- Store API keys in `.env` file
- Add `.env` to `.gitignore`
- Use `.env.example` as a template (without real keys)
- Rotate keys if they're ever exposed

❌ **DON'T:**
- Commit `.env` files to Git
- Hardcode API keys in source code
- Share API keys in chat/email
- Use the same key for development and production

## 🚨 If Your API Key is Exposed

If your API key is ever exposed (e.g., committed to Git):

1. **Immediately revoke the key** at https://openrouter.ai/keys
2. Generate a new API key
3. Update your `.env` file with the new key
4. If using Git, remove the key from Git history (use `git filter-branch` or BFG Repo-Cleaner)

## 📝 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | ✅ Yes | None |
| `PORT` | Server port | No | 3001 |
| `NODE_ENV` | Environment (development/production) | No | development |
| `ORIGIN` | Origin URL for API headers | No | http://localhost:5173 |

## 🧪 Testing the Setup

After setting up your `.env` file, test that the API key is loaded correctly:

```bash
# Start the server
npm run server

# In another terminal, test the health endpoint
curl http://localhost:3001/api/health
```

You should see `openrouter_configured: true` in the response.

## 📚 Additional Resources

- OpenRouter API Documentation: https://openrouter.ai/docs
- Environment Variables Guide: https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs





