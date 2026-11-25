# GameOn SEECS

A responsive one-page gaming stall website built with React, Vite, and Supabase. Ready for Vercel.

## What is connected

- Slot request form writes to the `booking_requests` table.
- Early-access form writes to the `waitlist_members` table.
- Public visitors can submit forms but cannot read or modify saved records.
- A slot request is not automatically confirmed. Confirm it with the visitor separately.

## 1. Create your free Supabase project

1. Open [Supabase](https://supabase.com/) and create a free account.
2. Create a new project. Choose a project name, database password, and region. Save the database password somewhere safe.
3. Wait for the project to finish provisioning.
4. In the project dashboard, open **SQL Editor** and choose **New query**.
5. Open `supabase/schema.sql` from this project, copy the entire file, paste it into the SQL Editor, and click **Run**. This creates both tables and the insert-only security policies.
6. In the Supabase dashboard, open **Project Settings → API Keys** (or the **Connect** panel). Copy the **Project URL** and the **Publishable key**. The publishable key may also be labelled as the legacy `anon` key.

## 2. Configure local environment variables

1. In the project root, make a copy of `.env.example` and name it `.env.local`. It must sit beside `package.json`.
2. Replace the example values with your real values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_actual_key
```

3. Do not add quotes around the values. Do not put spaces around `=`.
4. Keep `.env.local` private. It is ignored by Git. Never put a Supabase `service_role` or secret key in a Vite environment variable. Only use the publishable/anon key in this frontend; Row Level Security protects the tables.
5. Restart the local development server after changing environment variables.

## 3. Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Submit one test booking and one waitlist signup. In Supabase, open **Table Editor** and check `booking_requests` and `waitlist_members`.

## 4. Add environment variables to Vercel

1. Push this project to a GitHub repository. Do not commit `.env.local`.
2. In [Vercel](https://vercel.com/new), import the repository. Select **Vite** if asked.
3. Before deploying (or afterwards in **Project → Settings → Environment Variables**), add these two variables exactly:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = your Supabase Publishable key
4. Select the environments you use (at least **Production**; also **Preview** if you test preview deployments).
5. Save the variables and redeploy. Vite reads `VITE_` variables at build time, so a redeploy is required after changing them.
6. Open your deployed site and submit test entries. Confirm they appear in Supabase Table Editor.

Build command: `npm run build`

Output directory: `dist`

## 5. View and manage requests

In Supabase, open **Table Editor**:

- `booking_requests`: names, contact details, game, requested date/time, player count, creation time, and status. Change `status` to `confirmed` or `cancelled` after contacting the visitor.
- `waitlist_members`: names, email addresses, game interest, and signup time.

The public website has insert-only access. It cannot list records. Manage records from the Supabase dashboard.

## Free-plan notes

Supabase currently offers a Free plan with usage limits. Free projects can pause after a period of inactivity, so check the current [Supabase pricing](https://supabase.com/pricing) and billing documentation before relying on it for an event.

## Before taking real bookings

- Update the sample time slots in `src/App.jsx` and the matching allowed values in `supabase/schema.sql` to your actual stall schedule.
- Add your actual venue, operating dates, prices, and contact details.
- The form accepts requests; it does not check availability or prevent two people requesting the same slot. Confirm each request manually.
- Public forms can attract spam. For a public launch, consider adding CAPTCHA/rate limiting and a server-side validation layer.
- Do not store payment card details in these forms.

## Useful links

- [Supabase dashboard](https://supabase.com/dashboard)
- [Supabase React quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)
- [Vercel project dashboard](https://vercel.com/dashboard)
