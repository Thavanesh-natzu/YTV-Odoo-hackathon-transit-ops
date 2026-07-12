TransitOps Backend
Node.js + Express + MySQL backend for TransitOps.
> **Specifications are fixed. Implementations may change.**
> The single source of truth for this project is the
> [Specification_For_Odoo](https://github.com/nayanip2001-max/Specification_For_Odoo)
> repository - `DATABASE_SCHEMA.md`, `API_SPEC.md`, `BUSINESS_RULES.md`,
> `STATUS_TRANSITIONS.md`, `PROJECT_STRUCTURE.md`, and `TEAM_ASSIGNMENTS.md`.
> If anything in this backend appears to contradict those documents, the
> documents win - open an issue rather than changing behavior silently.
Requirements
Node.js 18+
MySQL 8+ (database name: `transitops`, per `DATABASE_SCHEMA.md`)
Environment variables
Create a `.env` file in `backend/` with:
```
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=transitops

JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRY=8h

CORS_ORIGIN=http://localhost:5173
```
All of these are validated at startup by `src/config/env.js` - the server
will refuse to boot rather than run with missing configuration.
Install & run
```bash
npm install
npm run dev     # nodemon, auto-restarts on file change
npm start       # production start
```
Seeding data
`API_SPEC.md` defines no `/auth/register` endpoint - user accounts (one
per role: Fleet Manager, Dispatcher, Safety Officer, Financial Analyst)
must be provisioned via the project-root `scripts/seed.js`, not created
through the running API.
```bash
npm run seed
```
Project structure
Follows `PROJECT_STRUCTURE.md` exactly:
```
backend/
├── src/
│   ├── config/      # env.js, db.js
│   ├── controllers/ # request handling, business logic execution
│   ├── middleware/   # auth, RBAC, validation
│   ├── models/       # database models, data access
│   ├── routes/       # endpoint definitions
│   ├── utils/        # shared helpers, status transition logic
│   └── app.js        # app assembly + startup
├── tests/
├── package.json
└── README.md
```
Module ownership
Per `TEAM_ASSIGNMENTS.md`:
Developer	Owns
1	Authentication & Users
2	Vehicle & Driver Management
3	Trips & Maintenance
4	Dashboard, Fuel & Reports
Open gap: `API_SPEC.md` defines `/expenses` and `/dashboard`, but
`TEAM_ASSIGNMENTS.md` does not assign an owner for `expense.controller.js`,
`expense.routes.js`, `dashboard.controller.js`, or `dashboard.routes.js`.
`src/app.js` leaves these routes commented out until this is resolved.
`app.js` and `.../services/api.js` (frontend) are shared files -
per `TEAM_ASSIGNMENTS.md`, changes to them require team discussion first.
API
Base URL: `/api`. Full endpoint list, request/response shapes, and status
codes are defined in `API_SPEC.md` - not duplicated here to avoid drift
between this README and the source of truth.
