# No Dues Portal — Frontend

React 19 + Vite + Tailwind CSS single-page app, deployed on Vercel. See the root `README.md` for the
whole project, the approval flow and environment variables.

```bash
npm install
npm run dev      # http://localhost:5173 (needs .env with VITE_API_URL and VITE_GOOGLE_CLIENT_ID)
npm run lint
npm run build
```

Where things are:

- `src/main.jsx` — every route / page
- `src/api/client.js` — API calls (adds the login token; a 401 returns to the login page)
- `src/components/Login.jsx`, `GoogleSignInButton.jsx` — sign-in
- `src/components/pages/<section>/` — student portal, admin panel and each department's dashboard
- `src/components/Request/` — the shared Pending / Approved / On Hold lists
- `src/components/Modal/` — dialogs (details, put on hold, confirmations, access management)
- `vercel.json` — sends every path to `index.html` and sets the sign-in popup header
