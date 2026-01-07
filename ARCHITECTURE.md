# AlgoTrade Authentication Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                      │
│                      http://localhost:3000                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AuthContext (Global State)                                     │
│  ├── currentUser { id, email, createdAt }                      │
│  ├── isAuthenticated (boolean)                                 │
│  ├── isLoading (boolean)                                       │
│  └── error (string)                                            │
│                                                                 │
│  Pages:                                                         │
│  ├── / (Landing) → Redirects to /dashboard if logged in       │
│  ├── /auth/login (Public)                                      │
│  ├── /auth/signup (Public)                                     │
│  └── /dashboard (Protected by ProtectedRoute)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP
         ┌────────────────────────────────────────┐
         │      httpOnly Cookie with JWT Token    │
         │  (Max-Age: 7 days, Secure, HttpOnly)   │
         └────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (Express)                        │
│                     http://localhost:8000                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Auth Middleware (verifyAuth)                                  │
│  ├── Extract token from cookie                                 │
│  ├── Verify JWT signature                                      │
│  ├── Decode userId                                             │
│  ├── Attach to req.user                                        │
│  └── Pass to route handler                                     │
│                                                                 │
│  Auth Routes:                                                   │
│  ├── POST /auth/signup      → Create User, set cookie          │
│  ├── POST /auth/login       → Verify credentials, set cookie   │
│  ├── POST /auth/logout      → Clear cookie                     │
│  ├── GET  /auth/verify      → Check token (Protected)          │
│  ├── GET  /auth/me          → Get current user (Protected)     │
│  └── DELETE /auth/account   → Delete user (Protected)          │
│                                                                 │
│  Strategy Routes (All Protected):                              │
│  ├── POST /strategies/interpret                                │
│  │   └── Auto-attach owner: req.user.userId                   │
│  ├── GET  /strategies/my-strategies                            │
│  │   └── Filter: owner === req.user.userId                    │
│  ├── GET  /strategies/:id                                      │
│  │   └── Verify ownership before returning                    │
│  ├── PATCH /strategies/:id                                     │
│  │   └── Verify ownership before updating                     │
│  ├── DELETE /strategies/:id                                    │
│  │   └── Verify ownership before deleting                     │
│  └── POST /strategies/:id/duplicate                            │
│      └── Verify ownership, deep-clone, create new             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
         ┌────────────────────────────────────────┐
         │   MongoDB Connection (Mongoose)        │
         └────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE                             │
│              (Cloud: MongoDB Atlas)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Collections:                                                   │
│                                                                 │
│  Users                                                          │
│  ├── _id (ObjectId) - Primary Key                             │
│  ├── email (String, Unique)                                    │
│  ├── password (String, hashed with bcrypt)                    │
│  ├── createdAt (Date)                                          │
│  └── lastLogin (Date)                                          │
│                                                                 │
│  Strategies                                                     │
│  ├── _id (ObjectId) - Primary Key                             │
│  ├── owner (ObjectId) - References Users._id                  │
│  ├── symbol (String)                                           │
│  ├── userQuery (String)                                        │
│  ├── timeframe (String)                                        │
│  ├── entryNode (String)                                        │
│  ├── nodes (Array)                                             │
│  ├── isValid (Boolean)                                         │
│  ├── createdAt (Date)                                          │
│  └── updatedAt (Date)                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow Diagram

```
USER SIGNUP
───────────

┌─────────────────────┐
│ User visits         │
│ /auth/signup        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Enter email & password          │
│ Frontend validates              │
│ (6+ chars, passwords match)     │
└──────────┬──────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│ POST /api/v1/auth/signup                    │
│ {email, password, confirmPassword}          │
└──────────┬───────────────────────────────────┘
           │
           ▼ (Over HTTPS in production)
┌─────────────────────────────────────────────────────────┐
│ Backend: authController.signup()                       │
│ • Check if email already exists                        │
│ • Hash password with bcrypt (10 rounds)                │
│ • Create User document in MongoDB                      │
│ • Generate JWT token                                   │
│ • Set httpOnly cookie with token                       │
│ • Return user object                                   │
└──────────┬────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│ Frontend            │
│ • Store user state  │
│ • Redirect to       │
│   /dashboard        │
└─────────────────────┘
```

---

```
USER LOGIN
──────────

┌─────────────────────┐
│ User visits         │
│ /auth/login         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Enter email & password          │
└──────────┬──────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│ POST /api/v1/auth/login                 │
│ {email, password}                       │
└──────────┬───────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Backend: authController.login()         │
│ • Find user by email in MongoDB         │
│ • Compare password with bcrypt.compare()│
│ • If wrong: return 401 error            │
│ • If correct:                           │
│   - Update lastLogin timestamp          │
│   - Generate JWT token                  │
│   - Set httpOnly cookie                 │
│   - Return user object                  │
└──────────┬───────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│ Frontend            │
│ • Store user state  │
│ • Redirect to       │
│   /dashboard        │
└─────────────────────┘
```

---

```
CREATE STRATEGY (Authenticated)
──────────────────────────────

┌──────────────────────┐
│ User on /editor      │
│ Fills strategy form  │
└──────────┬───────────┘
           │
           ▼
┌────────────────────────────────────────┐
│ POST /api/v1/strategies/interpret      │
│ {userQuery, symbol, timeframe}         │
│ Cookie: authToken=<jwt>                │
└──────────┬─────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│ Backend: verifyAuth Middleware                   │
│ • Extract authToken from cookies                 │
│ • Verify JWT signature with JWT_SECRET           │
│ • Decode JWT to get userId                       │
│ • If invalid: return 401                         │
│ • If valid: attach userId to req.user            │
│ • Pass to route handler                          │
└──────────┬──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│ Backend: strategyController.interpretStrategy()  │
│ • Call LLM to interpret strategy                 │
│ • Auto-attach owner: req.user.userId             │
│ • Create Strategy document with:                 │
│   - symbol, nodes, entryNode, timeframe          │
│   - owner: userId                                │
│ • Save to MongoDB                                │
│ • Return strategy object                         │
└──────────┬──────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│ Frontend                               │
│ • Add strategy to state                │
│ • Show success message                 │
│ • Redirect to /dashboard               │
│   (Strategy now visible only to user)  │
└────────────────────────────────────────┘
```

---

```
GET USER'S STRATEGIES (Authenticated)
────────────────────────────────────

┌──────────────────────────┐
│ Dashboard page loads     │
└──────────┬───────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ GET /api/v1/strategies/my-strategies│
│ Cookie: authToken=<jwt>             │
└──────────┬────────────────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Backend: verifyAuth          │
│ • Validate token             │
│ • Extract userId from token  │
└──────────┬───────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│ Backend: getUserStrategies()           │
│ • Query MongoDB:                       │
│   Strategy.find({                      │
│     owner: req.user.userId             │
│   }).sort({ createdAt: -1 })           │
│ • Return only user's strategies        │
└──────────┬─────────────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Frontend                         │
│ • Display strategies in grid     │
│ • Each card shows:               │
│   - Symbol                       │
│   - Description                  │
│   - Valid/Invalid badge          │
│   - Buttons: View, Duplicate,    │
│     Delete                       │
└──────────────────────────────────┘
```

---

## Token Flow

```
INITIAL LOGIN/SIGNUP
────────────────────

Browser                          Server
   │                                │
   │ POST /auth/login              │
   ├──────────────────────────────►│
   │                                │
   │                    Generate JWT token
   │                    Create payload: { userId }
   │                    Sign with JWT_SECRET
   │                    Token = header.payload.signature
   │
   │ Set-Cookie: authToken=<jwt>  │
   │◄──────────────────────────────┤
   │ (httpOnly, secure, sameSite)   │
   │                                │


SUBSEQUENT REQUESTS
────────────────────

Browser                          Server
   │                                │
   │ GET /strategies/my-strategies  │
   │ Cookie: authToken=<jwt>       │
   ├──────────────────────────────►│
   │                                │
   │                    Extract token from cookies
   │                    Verify signature
   │                    Decode to get userId
   │                    Attach to req.user
   │
   │ [strategies data]             │
   │◄──────────────────────────────┤
   │                                │


TOKEN EXPIRY
────────────

Browser                          Server
   │                                │
   │ GET /strategies               │
   │ Cookie: authToken=<expired>   │
   ├──────────────────────────────►│
   │                                │
   │                    Verify JWT signature fails
   │                    Token expired (7 days)
   │
   │ 401 Unauthorized              │
   │◄──────────────────────────────┤
   │ Clear authToken cookie         │
   │                                │

Browser → Redirect to /auth/login
```

---

## Request Protection Pattern

```
Protected Route Request
───────────────────────

Frontend Request:
┌──────────────────────────────────────┐
│ fetch('/api/v1/strategies', {        │
│   credentials: 'include'  ← Includes │
│ })                         cookies   │
└──────────────────────────────────────┘
                │
                ▼
Browser sends:
┌──────────────────────────────────┐
│ GET /api/v1/strategies           │
│ Cookie: authToken=<jwt>          │
└──────────────────────────────────┘
                │
                ▼
Backend Middleware:
┌──────────────────────────────────┐
│ verifyAuth (req, res, next)       │
│                                  │
│ if (!req.cookies.authToken)       │
│   return 401 Unauthorized         │
│                                  │
│ try {                             │
│   decoded = jwt.verify(token)    │
│   req.user = decoded              │
│   next()  ← Continue to handler   │
│ } catch {                         │
│   return 401 Invalid token        │
│ }                                 │
└──────────────────────────────────┘
                │
                ▼
Route Handler:
┌──────────────────────────────────┐
│ getUserStrategies(req, res)       │
│                                  │
│ strategies = find({               │
│   owner: req.user.userId          │
│ })                                │
│                                  │
│ res.json({ strategies })          │
└──────────────────────────────────┘
```

---

## Data Ownership Verification

```
USER A                           USER B
   │                               │
   │ GET /strategies/:id           │
   │ (Strategy belongs to User B)  │
   ├──────────┐                    │
   │          │                    │
   │          └────────────────────┤
   │                               │ Strategy.owner = User B._id
   │                               │ req.user.userId = User A._id
   │                               │
   │                    ❌ OWNERSHIP CHECK FAILS
   │                               │
   │           403 Forbidden        │
   │◄──────────────────────────────┤
   │ "Unauthorized: You do not     │
   │  own this strategy"           │
   │                               │

USER A                           USER A
   │                               │
   │ GET /strategies/:id           │
   │ (Strategy belongs to User A)  │
   ├──────────┐                    │
   │          │                    │
   │          └──────────────────┤ │
   │                             │ │
   │                Strategy.owner = User A._id
   │                req.user.userId = User A._id
   │                             │ │
   │                ✅ OWNERSHIP CHECK PASSES
   │                             │ │
   │    [strategy data]           │ │
   │◄───────────────────────────┤ │
   │                               │
```

---

## User Isolation

```
DATABASE
────────

Users Collection:
┌─────────────────────┐
│ User A              │
│ _id: 111            │
│ email: a@test.com   │
│ password: hash1     │
└─────────────────────┘

┌─────────────────────┐
│ User B              │
│ _id: 222            │
│ email: b@test.com   │
│ password: hash2     │
└─────────────────────┘


Strategies Collection:
┌────────────────────────────┐
│ Strategy 1                 │
│ _id: s1                    │
│ symbol: AAPL               │
│ owner: 111  ← User A       │
│ nodes: [...]               │
└────────────────────────────┘

┌────────────────────────────┐
│ Strategy 2                 │
│ _id: s2                    │
│ symbol: AAPL               │
│ owner: 222  ← User B       │
│ nodes: [...]               │
└────────────────────────────┘


User A's Dashboard:
├── Strategy 1 (owner: 111 ✓)
└── [No access to Strategy 2]


User B's Dashboard:
├── Strategy 2 (owner: 222 ✓)
└── [No access to Strategy 1]
```

---

## Security Layers

```
                    ATTACK VECTORS
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ❌ Direct DB      ❌ Token         ❌ CORS
    access           forgery          Bypass
        │                │                │
        └────────┬───────┴────────┬───────┘
                 │                │
                 ▼                ▼
         FIRST DEFENSE          DATABASE
         • JWT signature        • Unique email
         • httpOnly cookies     • Ownership check
         • Secure flag          • Cascade delete
         • SameSite             • MongoDB indexes
         • Middleware check


              SUCCESSFUL REQUEST
                     │
                     ▼
         ┌─────────────────────────┐
         │ 1. Token validation     │
         │ 2. User verification    │
         │ 3. Ownership check      │
         │ 4. Data isolation       │
         │ 5. Response returned    │
         └─────────────────────────┘
```

---

This architecture ensures:
- ✅ Users can only see their own data
- ✅ Tokens are secure (httpOnly, signed, expiring)
- ✅ Passwords are hashed and never exposed
- ✅ Every request is authenticated
- ✅ Every data access is verified for ownership
- ✅ Cascade deletion prevents orphaned data
- ✅ CORS prevents unauthorized cross-origin requests
