# Secure OAuth backend setup

The GitHub Pages APK Creator now uses OAuth instead of asking for a Personal Access Token.

## 1. Deploy this same repository to Vercel
Create a Vercel project from `klav0628-droid/Website-to-APK` and use the project URL as the backend URL.

The current frontend expects:
`https://apk-creator-backend.vercel.app`

If your Vercel project uses another URL, change `BACKEND_URL` in `APK-Creator.html` and `oauth-callback.html`.

## 2. Vercel Environment Variables
Add these in Vercel Project Settings → Environment Variables:

`GITHUB_CLIENT_ID` = your OAuth App Client ID

`GITHUB_CLIENT_SECRET` = the new client secret (keep this secret; never put it in HTML)

`GITHUB_REDIRECT_URI` = `https://klav0628-droid.github.io/Website-to-APK/oauth-callback.html`

`FRONTEND_URL` = `https://klav0628-droid.github.io/Website-to-APK/`

`GITHUB_OWNER` = `klav0628-droid`

`GITHUB_REPO` = `Website-to-APK`

## 3. GitHub OAuth App
The OAuth App Redirect URI must remain exactly:
`https://klav0628-droid.github.io/Website-to-APK/oauth-callback.html`

The OAuth flow asks for the `repo` scope because the creator writes the app configuration and logo to the APK build repository and starts the build through a Git push.

## 4. Important security rule
Never commit `GITHUB_CLIENT_SECRET` to GitHub and never put it into `APK-Creator.html`. Store it only as a Vercel environment variable.
