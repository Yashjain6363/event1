# BMSCE Events Portal – Deployment Guide

## Sign-up and email behavior

### Sign-up works in all cases

- **When email is not configured** (no `EMAIL_USER` / `EMAIL_PASS` in backend `.env`):  
  Sign-up does **not** return 503. The user is created with `emailVerified: true` and the API returns **token + user**, so they are logged in immediately. No OTP is sent or required.

- **When email is configured**: The OTP flow runs: user is created, OTP is sent, and the response has `needsVerification: true` until they verify. If sending the OTP fails, the account is still created and the message tells them to use “Resend code” from Sign In.

So sign-up always succeeds: without email config it’s direct sign-up + login; with email config it’s sign-up + OTP to confirm the email.

### Email validation

- **Backend:** Emails are normalized (trim + lowercase) and validated with a strict regex. Invalid emails get a clear 400: “Please enter a valid email address.”
- **Frontend:** The same validation runs on the sign-up form before submit.

---

## Deployment setup

### Frontend API URL

- All API requests and image URLs use a single base from **`VITE_API_URL`**.
- **Local:** Default is `http://localhost:5000` (no env needed).
- **Deploy:** Set `VITE_API_URL` to your backend base URL (e.g. `https://api.yourdomain.com`) in the frontend build environment, then run `npm run build` and deploy the build output.

### Backend environment

In backend `.env`:

| Variable       | Required | Description |
|----------------|----------|-------------|
| `MONGO_URI`    | Yes      | MongoDB connection string |
| `JWT_SECRET`   | Yes      | Secret for JWT signing |
| `CLIENT_URL`   | Yes (prod) | Frontend origin for CORS (e.g. `https://yourapp.com`) |
| `PORT`         | No       | Server port (default 5000) |
| `JWT_EXPIRES_IN` | No    | Token expiry (e.g. `7d`) |
| `EMAIL_USER`   | No       | Gmail address for OTP / forgot-password |
| `EMAIL_PASS`   | No       | Gmail App Password (see [App Passwords](https://myaccount.google.com/apppasswords)) |

If `EMAIL_USER` and `EMAIL_PASS` are not set, sign-up works without OTP; users can use the site immediately. Set them to enable email verification and forgot-password.

### Frontend environment (build)

For production build:

- Set **`VITE_API_URL`** to your backend URL (e.g. `https://api.yourdomain.com`).
- Build: `npm run build` (in the `frontend` folder).
- Deploy the `dist` output to your static host.

### CORS

The backend uses `CLIENT_URL` for CORS. Set `CLIENT_URL` to your production frontend origin so the browser allows requests.

---

## Quick checklist

- [ ] Backend: `.env` has `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (and optional `EMAIL_USER` / `EMAIL_PASS`).
- [ ] Frontend: Build with `VITE_API_URL` set to your backend URL.
- [ ] Deploy backend and frontend; ensure backend is reachable at the URL used in `VITE_API_URL`.
