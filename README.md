# RC Endurance Series

A GitHub-ready Next.js application for managing an RC endurance championship, driver availability and teams.

## Deploy to Vercel
1. Extract this ZIP.
2. Create a new GitHub repository.
3. Upload all extracted files to the repository.
4. In Vercel, click Add New → Project and import the GitHub repository.
5. Vercel should detect Next.js automatically.
6. Build command: `npm run build`.
7. Deploy.

## Local development
```bash
npm install
npm run dev
```

## Built-in driver registration
There is no Google Form or Google Sheets dependency. `/register` contains the built-in registration form.

## Supabase
For persistent multi-user accounts, profiles, availability, shortlists and contact requests:
1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel.

The project runs immediately with sample data without Supabase.
