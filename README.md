# 🌿 Caregiver Agent

> An AI-powered delegation platform that allows caregivers to act securely on behalf of elderly or disabled care recipients — using Auth0 Token Vault, Fine-Grained Authorization (FGA), and CIBA step-up approval.

Built for the **Auth0 "Authorized to Act" Hackathon**.

---

## What Does This Project Do?

Caregiver Agent solves a real problem: **how do you safely let someone else act on your behalf?**

A care recipient (e.g. an elderly parent) can invite a trusted caregiver (e.g. an adult child) and grant them specific delegated permissions — like paying bills or booking medical appointments. The agent then executes those actions on behalf of the care recipient, using securely stored credentials and enforcing fine-grained authorization at every step.

### Key Features

| Feature | Description |
|---|---|
| **Token Vault** | Google OAuth tokens stored securely in Auth0 — the agent never sees raw credentials |
| **FGA Permissions** | Auth0 Fine-Grained Authorization enforces what each caregiver can and cannot do |
| **CIBA Step-Up** | High-stakes actions (payments over $200) pause and require explicit approval from the care recipient |
| **Multi-User Invite Flow** | Care recipients invite caregivers via shareable links — permissions provisioned automatically |
| **Google Calendar Booking** | Agent books medical appointments directly via Token Vault refresh token exchange |
| **Bill Payment** | Agent pays bills with FGA permission checks and CIBA approval for large amounts |
| **Audit Log** | Immutable PostgreSQL-backed log of every action taken by every caregiver |
| **Emerald Care Theme** | Clean, accessible UI designed for caregiving contexts |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Care Recipient                           │
│                   (logs in, manages caregivers)                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ invites caregiver via link
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 16 Application                       │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Dashboard   │  │  ChatBox     │  │  Invite / Caregivers │  │
│  │  /dashboard  │  │  Agent UI    │  │  /invite             │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                           │                                     │
│              ┌────────────┼────────────┐                        │
│              ▼            ▼            ▼                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  /api/agent  │  │/api/tools/   │  │  /api/invites        │  │
│  │  (routing)   │  │  bills/pay   │  │  (invite flow)       │  │
│  └──────────────┘  │  calendar/   │  └──────────────────────┘  │
│                    │  book        │                             │
│                    └──────────────┘                             │
└──────┬──────────────────┬──────────────────┬────────────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌────────────┐   ┌─────────────────┐   ┌──────────────┐
│  Auth0     │   │  Auth0 Token    │   │  Auth0 FGA   │
│  (Auth)    │   │  Vault          │   │  (Perms)     │
│            │   │                 │   │              │
│  Session   │   │  Google OAuth   │   │  can_pay     │
│  Tokens    │   │  tokens stored  │   │  can_book    │
│  CIBA      │   │  securely       │   │  per user    │
└────────────┘   └────────┬────────┘   └──────────────┘
                          │
                          ▼
                ┌─────────────────┐
                │  Google APIs    │
                │  Calendar       │
                └─────────────────┘
       │
       ▼
┌────────────────────┐
│  PostgreSQL (Neon) │
│                    │
│  audit_logs        │
│  approvals         │
│  invites           │
│  caregivers        │
└────────────────────┘
```

### How Token Vault Works

```
1. Care recipient visits /connect
2. App calls POST /me/v1/connected-accounts/connect
   → Auth0 returns auth_session + ticket
3. User approves Google consent screen
4. Auth0 redirects back with connect_code
5. App calls POST /me/v1/connected-accounts/complete
   → Auth0 stores Google refresh token in Token Vault
6. When agent needs Google Calendar:
   App calls POST /oauth/token with Auth0 refresh token
   grant_type: urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token
   → Auth0 returns fresh Google access token
7. App calls Google Calendar API with the token
   → Event created, user's credentials never exposed
```

### How CIBA Step-Up Works

```
1. Caregiver requests payment of $1000
2. Agent detects amount > $200 threshold
3. Approval record created in PostgreSQL (status: pending)
4. CIBA card shown in UI — care recipient sees Approve / Deny
5. Care recipient clicks Approve
6. PATCH /api/approvals/:id → status: approved
7. Agent re-submits payment with approvalId
8. Payment executes, audit log updated
```

### How FGA Works

```
Auth0 FGA Model:

type user {}

type bill {
  relations {
    owner: user
    caregiver: user
  }
  permissions {
    can_pay: owner or caregiver
  }
}

type appointment {
  relations {
    owner: user
    caregiver: user
  }
  permissions {
    can_book: owner or caregiver
  }
}

Every API action checks:
  fgaClient.check({
    user: `user:${caregiverUserId}`,
    relation: "can_pay",
    object: `bill:${billId}`
  })
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Auth | Auth0 v4 SDK (`@auth0/nextjs-auth0`) |
| Token Storage | Auth0 Token Vault (Connected Accounts) |
| Authorization | Auth0 Fine-Grained Authorization (FGA) |
| Step-Up Auth | CIBA (Client-Initiated Backchannel Authentication) |
| Database | PostgreSQL via Neon (serverless) |
| External API | Google Calendar API |
| Styling | Tailwind CSS (Emerald Care theme) |
| Language | TypeScript |

---

## Project Structure

```
caregiver-agent/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── agent/route.ts          # Intent routing
│   │   │   ├── approvals/route.ts      # List/create approvals
│   │   │   ├── approvals/[id]/route.ts # Get/update approval
│   │   │   ├── audit/route.ts          # Audit log
│   │   │   ├── auth/connect/route.ts   # Token Vault connect initiation
│   │   │   ├── invites/route.ts        # Invite management
│   │   │   ├── invites/[id]/route.ts   # Accept/revoke invites
│   │   │   ├── migrate/route.ts        # DB migration
│   │   │   └── tools/
│   │   │       ├── bills/pay/route.ts  # Bill payment with CIBA
│   │   │       └── calendar/book/      # Google Calendar booking
│   │   ├── auth/connect/callback/      # Token Vault callback
│   │   ├── approvals/page.tsx          # Approvals UI
│   │   ├── audit/page.tsx              # Audit log UI
│   │   ├── connect/page.tsx            # Connect Google page
│   │   ├── dashboard/page.tsx          # Main dashboard
│   │   └── invite/
│   │       ├── page.tsx                # Manage caregivers
│   │       └── accept/page.tsx         # Accept invite
│   ├── components/
│   │   └── ChatBox.tsx                 # Agent chat interface
│   ├── lib/
│   │   ├── auth0.ts                    # Auth0 client config
│   │   ├── audit.ts                    # Audit log functions
│   │   ├── approvals.ts                # Approval CRUD
│   │   ├── authz.ts                    # FGA permission checks
│   │   ├── db-postgres.ts              # PostgreSQL pool
│   │   ├── fga.ts                      # FGA client
│   │   ├── invites.ts                  # Invite + caregiver management
│   │   ├── migrate.ts                  # DB schema creation
│   │   └── token-vault.ts              # Token Vault integration
│   └── proxy.ts                        # Auth0 middleware
├── .env.local                          # Environment variables (not committed)
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- An Auth0 account (free at [auth0.com](https://auth0.com))
- A Google Cloud project with Calendar API enabled
- A Neon PostgreSQL database (free at [neon.tech](https://neon.tech))

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/caregiver-agent.git
cd caregiver-agent
npm install
```

### 2. Set up Auth0

1. Go to [manage.auth0.com](https://manage.auth0.com) and create a new application (**Regular Web Application**)
2. Set **Allowed Callback URLs**: `http://localhost:3000/auth/callback`
3. Set **Allowed Logout URLs**: `http://localhost:3000`
4. Set **Allowed Web Origins**: `http://localhost:3000`
5. Under **Advanced Settings → Grant Types**, enable **Refresh Token**

#### Enable Token Vault

1. Go to **Auth0 Dashboard → Applications → APIs**
2. Activate the **My Account API**
3. Under **Application Access**, authorize your app with all Connected Accounts scopes
4. Go to **Applications → your app → Multi-Resource Refresh Token** and enable **My Account API**
5. Go to **Authentication → Social → Google**
6. Under **Purpose**, select **Authentication and Connected Accounts for Token Vault**
7. Enable **Offline Access**
8. Add scope: `https://www.googleapis.com/auth/calendar.events`

#### Set up Auth0 FGA

1. Go to [dashboard.fga.dev](https://dashboard.fga.dev) and create a store
2. Create a new FGA application with permissions:
   - Read and query
   - Write and delete tuples
3. Create the authorization model:

```python
model
  schema 1.1

type user

type bill
  relations
    define owner: [user]
    define caregiver: [user]
    define can_pay: owner or caregiver

type appointment
  relations
    define owner: [user]
    define caregiver: [user]
    define can_book: owner or caregiver
```

4. Add initial tuples for your user:
   - `user:<your-auth0-user-id>` → `caregiver` → `bill:electric_march`
   - `user:<your-auth0-user-id>` → `caregiver` → `appointment:checkup_apr_10`

### 3. Set up PostgreSQL

1. Create a free database at [neon.tech](https://neon.tech)
2. Copy the connection string

### 4. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Auth0
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_SECRET=your-random-secret-min-32-chars
APP_BASE_URL=http://localhost:3000

# Auth0 FGA
FGA_API_URL=https://api.us1.fga.dev
FGA_STORE_ID=your-fga-store-id
FGA_MODEL_ID=your-fga-model-id
FGA_CLIENT_ID=your-fga-client-id
FGA_CLIENT_SECRET=your-fga-client-secret
FGA_AUDIENCE=https://api.us1.fga.dev/

# PostgreSQL
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

Generate `AUTH0_SECRET`:
```bash
openssl rand -hex 32
```

### 5. Run database migrations

```bash
npm run dev
```

Then visit: `http://localhost:3000/api/migrate`

You should see: `{ "success": true, "message": "Database migrated" }`

### 6. Start the app

```bash
npm run dev
```

Visit `http://localhost:3000` and log in with your Google account.

---

## Demo Flow

### 1. Connect Google Calendar
- Visit `/connect`
- Click **Connect Google Calendar**
- Approve Google consent screen
- You're redirected to `/dashboard?connected=true`

### 2. Pay a bill (under threshold)
- In the agent chat, type: **"Pay Alice's electric bill"**
- FGA checks permission → allowed
- Bill paid immediately, logged to audit

### 3. Pay a large bill (CIBA approval)
- Type: **"Pay Alice's electric bill for $1000"**
- Agent detects $1000 > $200 threshold
- CIBA approval card appears
- Click **✓ Approve Payment**
- Payment executes with full audit trail

### 4. Book a medical appointment
- Type: **"Book Alice's appointment"**
- FGA checks permission → allowed
- Token Vault exchanges refresh token for Google access token
- Google Calendar event created
- Event link shown in UI

### 5. Invite a caregiver
- Visit `/invite`
- Enter caregiver's email, select permissions
- Copy the shareable invite link
- Caregiver opens link, logs in, accepts
- FGA tuples automatically provisioned

### 6. Review audit log
- Visit `/audit`
- See immutable record of every action

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `AUTH0_DOMAIN` | Your Auth0 tenant domain |
| `AUTH0_CLIENT_ID` | Your Auth0 application client ID |
| `AUTH0_CLIENT_SECRET` | Your Auth0 application client secret |
| `AUTH0_SECRET` | Random secret for session encryption (min 32 chars) |
| `APP_BASE_URL` | Base URL of your app (`http://localhost:3000` for local) |
| `FGA_API_URL` | Auth0 FGA API URL (`https://api.us1.fga.dev`) |
| `FGA_STORE_ID` | Your FGA store ID |
| `FGA_MODEL_ID` | Your FGA authorization model ID |
| `FGA_CLIENT_ID` | Your FGA application client ID |
| `FGA_CLIENT_SECRET` | Your FGA application client secret |
| `FGA_AUDIENCE` | FGA API audience (`https://api.us1.fga.dev/`) |
| `DATABASE_URL` | PostgreSQL connection string |

---

## The "Secret Zero" Problem — Solved

Traditional approaches to delegated access require storing API keys or OAuth tokens in your database — creating a "secret zero" that, if leaked, exposes all user data.

Caregiver Agent solves this using **Auth0 Token Vault**:

- Google refresh tokens are stored **inside Auth0's vault**, never in your app
- When the agent needs to call Google Calendar, it exchanges an Auth0 refresh token for a fresh Google access token via a secure backchannel
- Your application **never stores, logs, or sees** the raw Google credentials
- If a caregiver's access is revoked, their FGA tuples are deleted immediately — no tokens to rotate

This is the model for how AI agents should handle delegated API access.

---

## Hackathon

Built for the **Auth0 "Authorized to Act" Hackathon** on Devpost.

Auth0 features used:
- ✅ Token Vault (Connected Accounts)
- ✅ Fine-Grained Authorization (FGA)
- ✅ CIBA step-up authentication
- ✅ Auth0 v4 Next.js SDK
- ✅ My Account API
- ✅ Multi-Resource Refresh Token (MRRT)

---

## License

MIT
