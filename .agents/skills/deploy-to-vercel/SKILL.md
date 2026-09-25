---
name: deploy-to-vercel
description: "Automated Vercel deployment workflows: environment variable synchronization, pre-flight build checks, preview branch deployments, and production rollouts."
---

# Deploy to Vercel Workflow

Guidelines for deploying Next.js applications to Vercel reliably.

---

## 1. Pre-Deployment Verification

Before triggering a Vercel deployment:

1. **Verify Environment Variables**:
   Ensure all required production variables exist:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

2. **Run Local Typecheck and Build**:
   ```powershell
   cd frontend
   npm run build
   ```
   Fix all TypeScript compiler errors and missing module warnings before pushing to Vercel.

---

## 2. Vercel CLI Commands

- **Preview Deployment (Branch preview)**:
  ```powershell
  npx vercel
  ```
- **Production Rollout**:
  ```powershell
  npx vercel --prod
  ```
- **Environment Variables Sync**:
  ```powershell
  npx vercel env pull .env.local
  ```

---

## 3. Post-Deployment Validation

1. Verify that headers, cookies, and SSR proxy routes resolve without 500 errors.
2. Check Supabase Auth redirect URLs in Supabase Dashboard (Auth > URL Configuration) to include the new Vercel deployment domain (`https://*.vercel.app/auth/callback`).
