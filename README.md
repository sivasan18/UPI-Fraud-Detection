# UPI Fraud Detection and Risk Assessment System

**B.Tech Final-Year Project · Department of Computer Science & Engineering**

This project is a web application for reviewing UPI transactions and highlighting behavior that may indicate fraud. This README is organized as two short reviews so the project can be explained clearly during a guide or coordinator discussion.

## Review 1 — Security Review

### Overall assessment

The application uses Supabase Auth for sign-in and PostgreSQL Row Level Security (RLS) for database access. In the connected Supabase project reviewed on 16 November 2026, RLS was enabled on the application tables and the live policies restricted access to the project's four administrator accounts. The local migration file does not match that live restriction and should be corrected before it is run again.

### Findings and recommended actions

1. **Remove default credentials from documentation.** Earlier project documentation listed one shared default password for all administrator accounts. That password has been removed from this README. If any account still uses it, change it in Supabase Auth and give each administrator a unique password.
2. **Keep database rules restrictive.** The checked-in migration grants broad access to every authenticated Supabase user, while the live database currently limits access to the four intended administrators. Update the migration to preserve the live allowlist before running or sharing it.
3. **Do not rely on browser checks for administrative security.** The Active/Demo mode confirmation and demo controls compare a password in frontend code. These checks can be bypassed and should be treated as interface prompts, not as protection for database operations.
4. **Review the Supabase security advisories.** The live project reported a public `SECURITY DEFINER` function named `public.rls_auto_enable()` and disabled leaked-password protection. Review whether the function needs public execution and enable compromised-password checks for Auth.
5. **Treat risk scores as decision support.** Fraud scoring runs in the browser, and some monitoring metrics are fixed display values in the frontend. They are not a substitute for independently measured model performance or server-side enforcement.

### Security terms in plain language

- **Authentication** checks who has signed in.
- **Row Level Security (RLS)** makes the database check which rows that signed-in account may read or change. It still applies when someone calls the database API outside the website.
- A Supabase **publishable key** is designed to be used by a browser. RLS and database grants must protect the data; a browser key does not make a table private by itself.
- A password prompt or hidden page in the frontend is not an access-control boundary. Important permissions must be enforced by Supabase policies or a trusted server.

## Review 2 — Website Summary and Project Flow

### Project purpose

The site helps administrators inspect UPI payment records and spot suspicious behavior. It extracts transaction details, compares them with transaction history, and presents a risk score with an explanation and suggested next steps. It is a project demonstration and review tool; a risk score is an indicator for human review, not proof that a transaction is fraudulent or safe.

### Main components

| Component | Purpose |
| --- | --- |
| React 19 and Vite frontend | Provides the dashboard, transaction forms, history, alerts, reports, settings, and demo screens. |
| Tesseract.js WebAssembly OCR | Reads supported UPI screenshots and statements in the browser. App-specific parsing supports BHIM, PhonePe, and Google Pay layouts. |
| Behavioral risk engine | Applies 13 rule-based patterns to a transaction and available history, then returns a score, detected patterns, explanations, and recommendations. |
| Supabase Auth | Signs in the project administrators and maintains their sessions. |
| Supabase PostgreSQL | Stores transactions, fraud analyses, alerts, validated samples, and model-monitoring records. |
| Vercel | Hosts the web frontend. The browser connects directly to Supabase; there is no separate Flask or application server in this architecture. |

### End-to-end flow

```text
Upload a screenshot or statement, or enter a transaction manually
                         ↓
Run OCR and recognize the payment-app layout in the browser
                         ↓
Review and confirm extracted transaction details
                         ↓
Save confirmed data to Supabase PostgreSQL
                         ↓
Compare the transaction with available history using 13 rule-based patterns
                         ↓
Show a risk level, score, explanation, and recommended next steps
```

### What the 13-pattern engine looks for

The rules cover repeated same-amount payments, escalating amounts, transaction bursts, amounts that differ from a user's baseline, new recipients, rapid repeats to recipients, unusual timing or location, unfamiliar devices, sudden high-value activity, and unexpected AutoPay or recurring-payment behavior. Some checks need sufficient transaction history; results can be less informative when there is little data.

### Active and Demo modes

- **Active Mode** is intended for the project's working transaction records.
- **Demo Mode** uses separate synthetic examples for presentations and walkthroughs.
- The site has pages for the dashboard, transaction upload and history, fraud analysis, alerts, reports, settings, tutorials, behavior profiles, adaptive-learning demonstrations, and model monitoring.

## Local Development

1. Clone the repository and enter the `frontend` directory.
2. Copy `frontend/.env.example` to `frontend/.env`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project's Supabase URL and publishable key. Do not put a Supabase `service_role` key in frontend environment variables.
4. Install dependencies and start the development server:

   ```bash
   npm install
   npm run dev
   ```

## Deployment

The frontend is deployed on Vercel. Configure the project to build the `frontend` application with `npm run build` and publish its `dist` directory. Add the Supabase URL and publishable key as Vercel environment variables, then deploy. Database access remains controlled by Supabase grants and RLS policies.

## Database Files

- [`supabase/schema.sql`](supabase/schema.sql) — application table definitions and initial policies.
- [`supabase/supabase_auth_migration.sql`](supabase/supabase_auth_migration.sql) — migration for Supabase Auth and shared administrator access. **Review and align its policies with the restricted live database policies before running it.**

## Repository

[UPI-Fraud-Detection on GitHub](https://github.com/sivasan18/UPI-Fraud-Detection)
