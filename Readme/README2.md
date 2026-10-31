# Northstar Careers

A job portal. Visitors browse jobs and read details without an account; candidates sign in to apply with a resume; admins post jobs and manage applications.

## Structure

- `index.html` – public home page (hero, search, filters, job list)
- `pages/` – sign in, register, job details (public), and the candidate and admin pages
- `css/`, `js/` – plain CSS and JavaScript, no build step
- `server/` – Node.js, Express and MySQL API

## Run locally

1. Copy `server/.env.example` to `server/.env` and fill in your MySQL details and a long random `JWT_SECRET`.
2. In `server/`: `npm install`, then `npm run dev` (API on port 5000).
3. Open `index.html` with a local web server (for example the VS Code Live Server extension).

## Deploy

- Frontend: Vercel (static files).
- API and database: Railway. Set `FRONTEND_ORIGIN` to your Vercel address and keep `UPLOAD_DIR` on a persistent volume.

Never commit `.env` files or the `server/uploads` folder (they hold secrets and candidates' resumes).
