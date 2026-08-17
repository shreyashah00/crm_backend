# Smart CRM Mulyaankan Backend

Production-ready Node.js & Express.js backend with PostgreSQL database and Prisma ORM 7, designed specifically to support the **Smart CRM Mulyaankan** frontend workspace.

---

## 🚀 Tech Stack

*   **Runtime**: Node.js (v20+)
*   **Web Framework**: Express.js
*   **Database**: PostgreSQL
*   **ORM**: Prisma ORM (v7.9.1) with driver adapter pools
*   **Authentication**: JWT (Access & Refresh tokens) + HTTP-only cookies
*   **Security**: bcrypt (password hashing), Helmet, CORS, Express Rate Limiter
*   **Request Validation**: Zod
*   **API Documentation**: OpenAPI / Swagger UI (served on `/api-docs`)

---

## 📂 Project Structure

```text
crm/
├── prisma/
│   ├── schema.prisma      # Prisma schema (driver adapter configured)
│   └── seed.js            # Seed script with 155 school leads and 325 activities
├── src/
│   ├── config/
│   │   └── swagger.js     # OpenAPI/Swagger configuration document
│   ├── controllers/       # Controller routers
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── leadController.js
│   │   ├── notificationController.js
│   │   ├── staffController.js
│   │   └── userController.js
│   ├── lib/
│   │   └── prisma.js      # Prisma 7 Client singleton with pg driver Pool
│   ├── middleware/        # Middlewares (Auth, Error handling, Val)
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── routes/            # Route maps (Both / and /api mounts)
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── leads.js
│   │   ├── notifications.js
│   │   ├── staff.js
│   │   └── users.js
│   ├── services/          # Scoped service calculations and logic
│   │   ├── authService.js
│   │   ├── dashboardService.js
│   │   ├── leadService.js
│   │   ├── notificationService.js
│   │   └── staffService.js
│   ├── utils/             # Helper utilities
│   │   ├── ApiError.js
│   │   ├── catchAsync.js
│   │   └── response.js
│   ├── validators/        # Zod validation schemas
│   │   ├── authValidator.js
│   │   ├── leadValidator.js
│   │   └── targetValidator.js
│   ├── app.js             # Express app setup and middleware routing
│   └── server.js          # Startup listener script
├── .env                   # Environment configurations (ignored by git)
├── .env.example           # Template environment config
├── package.json           # Scripts and dependencies
├── prisma.config.ts       # Prisma 7 configuration file
└── README.md              # Documentation
```

---

## 🛠️ Setup & Installation

### 1. Install Dependencies
In the workspace directory, run:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill out the variables in `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/smart_crm_mulyaankan?schema=public"
JWT_SECRET="smart-crm-mulyankan-super-secret-access-token-key-2026"
JWT_REFRESH_SECRET="smart-crm-mulyankan-super-secret-refresh-token-key-2026"
PORT=5000
FRONTEND_URL="https://crm-frontend-cz1a.vercel.app"
```

### 3. Setup PostgreSQL Database
Make sure PostgreSQL is running, then create the database:
```bash
createdb smart_crm_mulyaankan
```

### 4. Run Prisma Database Migrations
Create and apply database tables to your local PostgreSQL instance:
```bash
npx prisma migrate dev --name init
```
This syncs the tables and generates the local Prisma Client.

### 5. Seed Mock Demo Data
Pre-populate the database with the mock workspace dataset (6 users, 155 school leads, 325 activities, and 4 monthly targets):
```bash
npx prisma db seed
```

> [!NOTE]
> All users are seeded with the default password: **`password123`**.

---

## 🏃 Running the Application

### Start Development Server (with Auto-reload)
```bash
npm run dev
```

### Start Production Server
```bash
npm run start
```

The server listens on port `5000` by default. You can access:
*   API Status Overview: `http://localhost:5000/`
*   Swagger Documentation: `http://localhost:5000/api-docs`

---

## 🗃️ Database Schema

```mermaid
erDiagram
    User ||--o{ Lead : "manages"
    User ||--o{ Activity : "creates"
    User ||--o| Target : "has"
    Lead ||--o{ Activity : "contains"
    
    User {
        Int id PK
        String name
        String email UK
        String password
        Role role "ADMIN, MANAGER, SALES"
        Boolean active
        String designation
        DateTime createdAt
        DateTime updatedAt
    }

    Lead {
        Int id PK
        String organizationName
        String contactName
        String designation
        String phone
        String email
        String province
        String district
        String source
        String leadType
        DateTime dateAdded
        Priority priority "HIGH, MEDIUM, LOW"
        LeadStatus status "NEW_LEAD, IN_PROGRESS, LIKELY_WARM, CONVERTED, NOT_INTERESTED, ON_HOLD"
        DateTime nextActionDate
        String notes
        Int assignedToId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Activity {
        Int id PK
        ActivityType type "CALL, EMAIL, PHYSICAL_MEETING, ONLINE_MEETING, WHATSAPP_SMS, NOTE"
        DateTime occurredAt
        String remarks
        Int leadId FK
        Int createdById FK
        DateTime createdAt
        DateTime updatedAt
    }

    Target {
        Int id PK
        Int staffId FK "Unique"
        Int leadTarget
        Int followUpTarget
        Int meetingTarget
        Int conversionTarget
        Int revenueTarget
        DateTime createdAt
        DateTime updatedAt
    }
```

---

## 🔌 API Documentation Reference

All routes are mounted at both the root level (e.g. `/leads`) and standard API prefix (e.g. `/api/leads`) to prevent routing mismatches during integration.

### Authentication Endpoints
*   `POST /auth/login` - Authenticates user. Accepts email/password credentials or a showcase bypass `userId` to support the frontend's switch-role dropdown. Returns access `token` and `user` payload.
*   `POST /auth/refresh` - Generates a new access token using a refresh token.
*   `POST /auth/logout` - Clears session cookies.
*   `GET /auth/me` - Returns active session profile details. (Requires auth token).
*   `PUT /auth/change-password` - Changes password of logged-in user. (Requires auth token).

### Staff & Performance Endpoints
*   `GET /users` - Lists all staff members.
*   `GET /users/:id` - Gets profile details for a specific staff member.
*   `POST /users` - Adds a new user/staff member. (Requires auth + ADMIN role).
*   `PUT /users/:id` - Updates staff profile properties. (Requires auth + ADMIN/MANAGER role).
*   `GET /staff/leaderboard` - Returns team leaderboard, sorted by performance score descending.
*   `GET /staff/me/work` - Returns workspace due leads and performance score for logged-in user.
*   `GET /staff/:id/performance` - Gets monthly performance statistics for a specific user.
*   `PUT /staff/:id/target` - Sets monthly targets for a specific user. (Requires auth + ADMIN/MANAGER role).

### Leads & Sales Funnel Endpoints
*   `GET /leads` - Lists all leads. Supports query search (`q`), status filters, page numbers (`page`), and page sizing limits (`size`).
*   `POST /leads` - Adds a new lead. Scopes assignment to current user if role is `SALES`.
*   `GET /leads/:id` - Gets lead details, including nested logs and activity history.
*   `PUT /leads/:id` - Updates lead properties, priority, status, or owner assignment. (SALES role can only update assigned leads).
*   `POST /leads/:id/activities` - Logs a new activity (e.g. Call, Meeting, Note) for a lead, updating the next action date. (SALES role can only update assigned leads).

### Dashboard & Analytics Endpoints
*   `GET /dashboard` - Computes overview statistics, metrics by status, conversion rates, and owner distributions. Scopes data automatically to the user's ID if role is `SALES`.

### Alerts & Notifications Endpoints
*   `GET /notifications` - Calculates and returns overdue action items, due today alerts, and stale leads. Scopes data automatically to the user's ID if role is `SALES`.

---

## 🧪 Testing

We have built an automated integration test script that spawns the backend server on port `5999` in test mode, fires requests to check validation and database logic, and tears down the server gracefully.

To run the integration tests:
```bash
npm run test
```
The test runs:
1. Health check `/`
2. Login bypass `/auth/login` (logs in as Ramesh Chaudhary)
3. Profile retrieval `/auth/me`
4. Dashboard statistics computation `/dashboard` (scoped to Ramesh)
5. Leads query `/leads?size=5` (retrieves data, verifies pagination)
6. Leaderboard ranking `/staff/leaderboard` (verifies score math)
7. Notifications generation `/notifications`

---

## 🤝 Frontend API Integration Instructions

To connect your existing Next.js frontend deployed at `https://crm-frontend-cz1a.vercel.app/` to this real backend, follow these steps:

### 1. Update the base request utility
In your frontend source code, search for the `request` function utility (typically defined in `lib/api.js` or `utils/request.js`).
Change the local storage demo interception so that it directs requests to your backend server endpoint.

```javascript
// Example frontend lib/api.js replacement
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function request(path, options = {}) {
  // Check if token exists in localStorage
  const token = localStorage.getItem('crm_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  // Certain endpoints return the raw object directly, match response formats
  return response.json();
}
```

### 2. Update role-switching handlers
Ensure that the role selector dropdown or bypass buttons on the login screen call `POST /auth/login` with the chosen `userId` payload instead of manually calling local mocks:
```javascript
// Example login handler integration
async function handleBypassLogin(userId) {
  try {
    const response = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    
    // Save session details
    localStorage.setItem('crm_token', response.data.token);
    localStorage.setItem('smart_crm_demo_user', String(response.data.user.id));
    
    // Redirect to workspace
    router.push('/');
  } catch (error) {
    alert(`Login failed: ${error.message}`);
  }
}
```

This will replace the front-end local/demo mock database transparently with your real Postgres database without modifying the UI layouts.
