# Stack

- Node.js + Express backend
- Postgres database (pg)
- JWT authentication (stateless)
- Frontend: plain JS (fetch API)

---

# Description

This codebase is a Node.js Express application backed by a Postgres database, structured using a layered architecture.

The server entry point (`server.js`) is responsible for configuration, middleware setup, database initialisation, and mounting route modules.

The application is organised into routes, services, middleware, and a database layer:

- Routes define the HTTP API and handle request/response concerns
- Services contain all business logic and interact with the database
- Middleware handles cross-cutting concerns such as authentication
- The database layer provides a shared Postgres connection pool

Authentication is implemented using stateless JWT tokens. Tokens are passed via the `Authorization: Bearer <token>` header, verified by middleware, and the decoded user is attached to each request.

All data operations are scoped by `user_id` to enforce multi-user isolation.

This structure cleanly separates concerns and allows the backend to serve multiple clients (web, mobile, etc.) without modification.

The backend also integrates with external APIs via services. For example, the weather service fetches data from a third-party API (Open-Meteo), processes it (e.g. computing when the temperature reaches a user-defined threshold), and exposes it via the `/weather` endpoint.

---

# Architecture

/backend
  server.js
  /db/pool.js
  /middleware/auth.js
  /routes/authRoutes.js
  /routes/notesRoutes.js
  /routes/weatherRoutes.js
  /services/authService.js
  /services/notesService.js
  /services/weatherService.js

---

# API

POST   /auth/register  
POST   /auth/login  
GET    /notes  
POST   /notes  
PUT    /notes/:id  
DELETE /notes/:id  
GET    /weather

---

# Context Bootstrapping (for new threads)

To quickly re-establish context, provide:

- server.js
- /routes/authRoutes.js
- /services/authService.js
- /services/notesService.js