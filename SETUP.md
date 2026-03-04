# AdVault Setup Guide

## 1. Get Your Meta Access Token (Free)

1. Go to https://developers.facebook.com
2. Log in with your Facebook account
3. Click **My Apps** → **Create App** → choose **Other** → **None**
4. Give it any name (e.g. "AdVault Personal")
5. In the app dashboard, go to **Tools** → **Graph API Explorer**
6. Click **Generate Access Token**
7. Add permission: `ads_read`
8. Copy the token

> **Note:** Free tokens expire in ~60 days. You'll need to regenerate it then.
> For a non-expiring token, create a System User in Business Manager.

## 2. Add the Token to Your Project

```bash
cp .env.local.example .env.local
```

Open `.env.local` and replace `your_meta_access_token_here` with your token.

## 3. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

## 4. Deploy to Vercel (with GitHub auto-deploy)

1. Push this project to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. Go to https://vercel.com → **Add New Project** → Import your GitHub repo

3. In Vercel project settings → **Environment Variables** → add:
   - Key: `META_ACCESS_TOKEN`
   - Value: your token

4. Deploy. Every push to `main` now auto-deploys. Done.

## Notes

- Swipe file is saved in your browser's localStorage (no database needed)
- The `.env.local` file is gitignored — your token is never pushed to GitHub
- For `Spy` feature: search the brand's exact name as it appears in their ads
