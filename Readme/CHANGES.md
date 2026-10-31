# What changed

The API addresses, request formats, database queries and the `career_token` storage key are all unchanged, so the frontend still talks to the backend exactly as before.

## New files
- `pages/login.html` – the sign-in page (it used to be `index.html`); demo text and the dead "Forgot password" link are removed
- `css/home.css`, `js/home.js` – the public home page

## Rewritten or updated (frontend, deploy to Vercel)
- `index.html` – now the public home page
- `pages/job-details.html`, `js/job-details.js` – public; Apply sends signed-out visitors to sign in, then back to the application
- `css/common.css`, `app.css`, `login.css`, `auth-pages.css` – blue and white design, bigger and consistent text and fields, styled popups, danger button, status colours
- `js/common.js` – redirects to sign-in with the page to return to, session-ended message, loading state on every submit button, Escape closes popups, shared job helpers
- `js/login.js`, `register.js`, `jobs.js`, `dashboard.js`, `apply.js`, `applications.js`, `admin.js` – small updates (redirects, 1 second redirect after applying, resume download keeps its file extension, Delete button style, location filter built from real jobs)
- All other pages – neutral placeholders instead of sample text, sentence-case labels, labelled fields in the edit-job popup, password-manager friendly sign-in

## Server (deploy to Railway)
- `server.js` – trust the Railway proxy so rate limiting counts each visitor separately; debug routes `/api/protected` and `/api/admin/test` removed
- `routes/applicationsRoutes.js` – an uploaded resume is deleted if the application is rejected or fails
- `routes/adminRoutes.js` – safe file name in the resume download header

## Your own checklist
- If a demo admin account exists in your live database (the old README listed one), change its password now.
- Deploy the server and the frontend in either order; they do not depend on each other.
