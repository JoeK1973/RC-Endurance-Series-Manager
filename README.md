# RC Endurance Series — Complete Navigation Build

## Deploy
1. Replace the existing repository contents with this project.
2. Keep your two Vercel variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Run `supabase/upgrade.sql` in Supabase SQL Editor after the original schema.
4. Commit and deploy.

## First admin
Register your account, then run:
`update public.profiles set role='admin' where email='YOUR_EMAIL';`

## Test
Open `/api/health`. Expected: `{"ok":true,"supabase":"connected","rounds":4}`.
