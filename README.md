# Study Lab Next.js

A subject-independent resource finder and teach-back workspace. Students explain what they learned, answer a follow-up question, and see their mastery and review dates. Teachers create a class and see aggregate concept scores for students who enroll using its code. The previous Study Lab lessons and Algebra Tutor remain accessible from the new navigation.

## Run locally

Use Node.js 22 or 24.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local`. Set `AUTH_SECRET` to a randomly generated value, for example the output of `openssl rand -hex 32`.
3. Run `npm run dev` and open the URL printed in the terminal.
4. Create a student account. To create a teacher account, configure a private `TEACHER_INVITE_CODE` and enter it during registration. The workspace will show the teacher's class enrollment code. Students can enter it when registering.

Local development falls back to persistent embedded PostgreSQL under `.data/postgres` when `DATABASE_URL` is blank. With `ANTHROPIC_API_KEY` configured, Claude grades a teach-back submission and generates a follow-up. Without a key, the app saves typed practice and offers a generic follow-up without recording scores.

## Deploy to Vercel

Import this project with the Next.js preset and point its root directory at this app. If deploying via Vercel CLI, run it from this directory. Configure these as private server-side environment variables in the Vercel project.

| Variable | Use |
|---|---|
| `AUTH_SECRET` | Required. A long random secret for Auth.js |
| `AUTH_TRUST_HOST` | Set to `true` on the trusted Vercel host |
| `DATABASE_URL` | Required. A PostgreSQL connection URL. Use a pooled URL for a Neon-hosted app |
| `ANTHROPIC_API_KEY` | Enables live Claude feedback and handwriting analysis |
| `ANTHROPIC_MODEL` | Optional Claude model override |
| `TEACHER_INVITE_CODE` | Private code required when registering a teacher account |
| `OPENALEX_API_KEY` | Optional key for a larger OpenAlex search budget |

Apply `db/schema.sql` to the configured PostgreSQL database before serving sign-ups. The schema only defines the new app's tables and can be reapplied. It is already installed in the provisioned Neon project named `study-lab-next`. Copy the connection string directly from Neon to the hosting environment. The new accounts and teach-back records live in PostgreSQL. Existing Algebra Tutor accounts and mastery data remain in the legacy app.

Browser dictation requires a browser with Speech Recognition and microphone permission. The read-aloud button uses browser Speech Synthesis. The mobile camera control uses the browser's capture input. Typed input and file upload are also available. Images are sent to Claude when grading is enabled and the binary files are discarded after analysis. Feedback, explanations and mastery are saved. Configure object storage only if you decide that image retention is needed.

## Verification

Run `npm test` for mastery, review, and PostgreSQL tests. Run `npm run build` for the production build. After building, run `bash scripts/verify-local.sh` to exercise authentication, class isolation, ungraded practice, and the photo contract against a local simulated Claude endpoint using disposable test accounts.
