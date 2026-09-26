# LNMIIT No Dues Portal

A web portal where final-year students of LNMIIT get their **No Dues clearance** online instead of
on paper. A student fills one profile and applies once; every department (labs, library, hostel,
accounts, HOD and others) clears or puts the application on hold from its own dashboard. When
everyone has cleared it, the student downloads the filled **No Dues certificate**.

- Frontend (Vercel): https://no-dues-gravity.vercel.app
- Backend API (Render): https://noduesgravity.onrender.com/api

## How an application moves

1. **Admin** adds eligible students (single or CSV) and gives staff access to their sections.
2. **Student** signs in with their LNMIIT Google account, completes the profile and applies.
3. The backend creates one **clearance step per department** for that student's branch:
   - independent departments (Medical, Sports, LUCS, Warden, Placement, Administration,
     every lab, Library Staff) start as **Pending**;
   - dependent ones start **Locked** and unlock automatically when their prerequisites approve:
     Librarian ← Library Staff · HOD ← all the student's labs + LUCS + Librarian ·
     NAD ← HOD · Store ← HOD + Warden · Accounts ← everything.
4. A department can **Approve** or **Put On Hold** (reason + details, shown to the student).
   HOD, NAD, Store and Accounts can also pick earlier departments to reset on reapply.
5. While on hold the student may edit the profile, then **Reapply** with an optional comment and
   proof document. Only the held (or chosen) departments review it again.
6. When every step is approved the application is **Completed** (final — it can no longer be put
   on hold) and the certificate becomes available on the student's Profile page.

The flowcharts in `Flowcharts.md` (rendered as the PNG files in this folder) show these journeys.

## Project structure

```
BACKEND/                     Node.js + Express + MongoDB (Mongoose) API
  server.js, app.js          entry point / Express app (security middleware, routes, errors)
  config/                    database, Cloudinary, uploads, permission codes, workflow rules
  controllers/               request handlers: auth, admin, clearance (departments), student
  middleware/                token + permission checks
  models/                    User, EligibleStudent, NoDuesRequest, ClearanceStep, StepActionLog
  routes/                    URL → controller mapping
  services/                  step creation, dependency engine (unlock/relock), certificate PDF
  scripts/                   maintenance scripts (run by hand, see below)
  assets/                    logo used on the certificate
FRONTEND/NoDues/             React (Vite) + Tailwind CSS single-page app
  src/main.jsx               routes for every page
  src/api/client.js          API client (adds the login token)
  src/components/            login, headers, shared lists/modals, and pages/ per section
  src/config/                branch list, application-number format
```

Every source file starts with a comment explaining what it is for.

## Running locally

```bash
cd BACKEND && npm install && npm run dev        # API on http://localhost:5000
cd FRONTEND/NoDues && npm install && npm run dev # site on http://localhost:5173
```

**BACKEND/.env**

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | secret that signs login tokens — **long and random (48+ characters)** |
| `JWT_EXPIRY` | optional, token lifetime (default `15h`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (same as the frontend's) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | document storage |
| `PORT` | optional, default 5000 (Render sets it) |

**FRONTEND/NoDues/.env**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | backend URL ending in `/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |

`.env` files are git-ignored — never commit them.

## Maintenance scripts (BACKEND/scripts)

Run from `BACKEND/`; they use the database in `BACKEND/.env`.

- `node scripts/reset-nodues-requests.js [--apply]` — deletes all applications, steps and timeline
  entries (keeps students, profiles and staff) after saving a backup to `BACKEND/backups/`.
  Without `--apply` it only reports what it would delete.
- `node scripts/deleteStudentRequest.js` — removes one student's unfinished application and its
  steps. Set `STUDENT_EMAIL` at the top of the file first; it deletes **immediately** (no dry run).

## Deployment

Pushing to `master` deploys automatically: Render builds `BACKEND/`, Vercel builds `FRONTEND/NoDues/`.
