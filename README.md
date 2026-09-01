# RC Endurance Series
Supabase-connected Next.js app.

## Because the base schema is already installed
Run `supabase/upgrade.sql` in Supabase SQL Editor. It adds the automatic profile trigger required for registration.

## Vercel
Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then redeploy.

## Test
Open `/api/health`. Expected: `{"ok":true,"supabase":"connected","rounds":4}`.

Register a driver at `/register`. To make a driver appear under `/drivers`, add availability with status `looking_for_team` or `reserve` in the `driver_availability` table (the next iteration can add the full self-service availability UI).
