# Deploying to Render.com

This guide will help you deploy your Next.js + Socket.io game to Render.

## Prerequisites

1.  Push your code to a GitHub repository.

## Steps to Deploy

1.  **Log in to Render**: Go to [dashboard.render.com](https://dashboard.render.com/) and log in.
2.  **New Web Service**: Click on the "New +" button and select **"Web Service"**.
3.  **Connect Repository**: Connect your GitHub account if you haven't already, and select the repository containing this game code.
4.  **Configure Service**:
    *   **Name**: Give your service a name (e.g., `my-game-app`).
    *   **Region**: Choose the region closest to your users.
    *   **Branch**: Select `main` (or your working branch).
    *   **Runtime**: Select **Node**.
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
5.  **Environment Variables**:
    *   You usually don't need to set `PORT` manually, Render sets it automatically. Our code now respects it.
    *   Add `NODE_ENV` with value `production`.
6.  **Create Web Service**: Click "Create Web Service".

## Troubleshooting

*   **Logs**: Check the logs tab in Render if the deployment fails.
*   **Port**: If the app doesn't start, ensure `server.js` is using `process.env.PORT` (we already patched this).
