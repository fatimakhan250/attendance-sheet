ATTENDEASE — SUPABASE CLOUD ATTENDANCE SYSTEM

This is the Supabase version of the attendance project. It uses:
- HTML, CSS and JavaScript for the website
- Supabase Auth for teacher signup/login
- Supabase Postgres database for student and attendance records
- Row Level Security (RLS) so each signed-in user can access only their own records

NO Node.js or Python installation is required for this static website.

SETUP INSTRUCTIONS

1. Create a Supabase project
   - Go to https://supabase.com/
   - Sign in and create a new project.
   - Choose a project name and database password.
   - Wait for the project to finish provisioning.

2. Get your project credentials
   - In your Supabase project, open Project Settings -> API.
   - Copy the Project URL.
   - Copy the anon/public key (sometimes shown as publishable key).
   - Open app.js and replace:
       PASTE_YOUR_SUPABASE_PROJECT_URL
       PASTE_YOUR_SUPABASE_ANON_KEY
   - Do NOT use the service_role/secret key in frontend code.

3. Create the database tables
   - Open SQL Editor in Supabase.
   - Open setup_supabase.sql from this folder.
   - Copy all its SQL into a new query and click Run.
   - This creates the students and attendance tables and their security policies.

4. Configure email confirmation (if needed)
   - Supabase Dashboard -> Authentication -> Providers -> Email.
   - Email/password authentication is enabled by default in many new projects.
   - For a simple classroom demo, you may turn off Confirm email in Authentication settings so sign-up can log in immediately. If confirmation remains enabled, the user must confirm the email before signing in.

5. Run the website
   - Extract this ZIP.
   - Open the folder in VS Code.
   - Install the Live Server extension if needed.
   - Right-click index.html -> Open with Live Server.
   - Create an account, then add students and mark attendance.

DEMO MODE
- To preview without setting up Supabase, open app.js and change DEMO_MODE = false to true.
- Demo mode saves data only in the current browser's local storage. It is NOT cloud storage.
- Change DEMO_MODE back to false after adding your Supabase details.

IMPORTANT
- Supabase has a free tier with usage limits; check the current Supabase pricing page for exact limits.
- Keep Row Level Security enabled.
- Never paste a Supabase service_role/secret key into app.js or any public frontend file.
- Use fictional student information for testing unless you have permission to use real records.
- This is an educational starter project, not a production school management system.
