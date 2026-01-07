# Quick Reference - Key Code Snippets

## Backend Auth Flow

### Signup Request
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Login Request
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get User Strategies
```bash
curl -X GET http://localhost:8000/api/v1/strategies/my-strategies \
  -H "Cookie: authToken=<token>"
```

### Duplicate Strategy
```bash
curl -X POST http://localhost:8000/api/v1/strategies/<strategy_id>/duplicate \
  -H "Cookie: authToken=<token>"
```

---

## Frontend Usage

### Using Auth Context
```jsx
import { useAuth } from '@/context/AuthContext'

function MyComponent() {
  const { 
    currentUser,      // { id, email, createdAt }
    isAuthenticated,  // boolean
    isLoading,        // boolean
    signup,           // async function
    login,            // async function
    logout,           // async function
    deleteAccount     // async function
  } = useAuth()

  // Check if user is logged in
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />
  }

  return <div>Welcome {currentUser.email}!</div>
}
```

### Login Example
```jsx
const handleLogin = async () => {
  const result = await login(email, password)
  
  if (result.success) {
    router.push('/dashboard')
  } else {
    setError(result.error)  // "Invalid email or password"
  }
}
```

### Using Protected Route
```jsx
import ProtectedRoute from '@/components/ProtectedRoute'

export default function PrivatePage() {
  return (
    <ProtectedRoute>
      <div>Only logged-in users see this</div>
    </ProtectedRoute>
  )
}
```

---

## Backend Auth Middleware

### How It Works
```javascript
import verifyAuth from "@/middleware/authMiddleware.js"

// Use on routes that need authentication
router.get("/my-strategies", verifyAuth, getUserStrategies)

// Inside the route handler:
export const getUserStrategies = async (req, res) => {
  // req.user is now available (set by middleware)
  console.log(req.user.userId)  // User's MongoDB ID
  
  // Filter strategies by this user
  const strategies = await Strategy.find({
    owner: req.user.userId
  })
}
```

### Middleware Code Flow
```
1. Extract authToken from cookies
2. Verify JWT signature with JWT_SECRET
3. Decode to get userId
4. Attach to req.user
5. Call next() to proceed to route handler
6. If invalid, return 401 Unauthorized
```

---

## Database Queries

### Find User by Email
```javascript
const user = await User.findOne({ email: "user@example.com" })
```

### Get User's Strategies (sorted by newest first)
```javascript
const strategies = await Strategy.find({
  owner: userId
}).sort({ createdAt: -1 })
```

### Check if User Owns Strategy
```javascript
const strategy = await Strategy.findById(strategyId)

if (strategy.owner.toString() !== userId) {
  // User doesn't own this strategy
  return res.status(403).json({ 
    success: false,
    message: "Unauthorized: You do not own this strategy"
  })
}
```

### Delete All User's Strategies
```javascript
await Strategy.deleteMany({ owner: userId })
```

---

## Error Handling

### Common Backend Errors
```javascript
// Missing auth
401 - "No authentication token found"

// Invalid token
401 - "Invalid or expired token"

// Wrong credentials
401 - "Invalid email or password"

// User not found
404 - "User not found"

// Unauthorized access
403 - "Unauthorized: You do not own this strategy"

// Email already exists
400 - "Email already registered"

// Password mismatch
400 - "Passwords do not match"
```

### Frontend Error Handling
```jsx
const { login } = useAuth()

const result = await login(email, password)

if (result.success) {
  // Good to go
  router.push('/dashboard')
} else {
  // result.error contains the error message
  console.log(result.error)
  setError(result.error)
}
```

---

## Cookie Management

### How Cookies Work
```javascript
// Backend sets cookie on login
res.cookie("authToken", token, {
  httpOnly: true,  // JavaScript cannot access this
  secure: true,    // Only sent over HTTPS (in production)
  sameSite: "strict",  // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
})

// Frontend automatically sends cookie with requests
fetch('/api/v1/strategies', {
  credentials: 'include'  // Include cookies in request
})

// Cookie is cleared on logout
res.clearCookie("authToken", { 
  httpOnly: true,
  secure: true,
  sameSite: "strict"
})
```

---

## User Registration vs Login Response

### Signup Response
```json
{
  "success": true,
  "message": "Signup successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "createdAt": "2026-01-07T10:30:00Z"
  }
}
```

### Login Response
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "createdAt": "2026-01-07T10:30:00Z"
  }
}
```

### Verify Token Response
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "createdAt": "2026-01-07T10:30:00Z",
    "lastLogin": "2026-01-07T12:45:00Z"
  }
}
```

---

## Getting Current User

### On Frontend
```jsx
const { currentUser } = useAuth()

// Wait for auth to load
const { isLoading } = useAuth()

useEffect(() => {
  if (!isLoading && !currentUser) {
    // Not logged in, redirect
    router.push('/auth/login')
  }
}, [isLoading, currentUser])
```

### On Backend
```javascript
// Inside a protected route
export const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.userId)
  
  return res.json({
    success: true,
    user: {
      id: user._id,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }
  })
}
```

---

## Testing the Full Flow

### Step 1: Signup
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "confirmPassword": "Test123456"
  }'
```

### Step 2: Create Strategy (should have owner now!)
```bash
curl -X POST http://localhost:8000/api/v1/strategies/interpret \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "userQuery": "Enter when RSI < 30, exit when RSI > 70",
    "symbol": "AAPL",
    "timeframe": "1H"
  }'
```

### Step 3: Get Your Strategies
```bash
curl -X GET http://localhost:8000/api/v1/strategies/my-strategies \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

### Step 4: Logout
```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

---

## Troubleshooting

### "No authentication token found"
- Make sure credentials: 'include' is in fetch
- Check if authToken cookie is set
- Try clearing cookies and logging in again

### "Invalid or expired token"
- Token expired (7 days)
- JWT_SECRET doesn't match
- Token was corrupted

### "Unauthorized: You do not own this strategy"
- You're trying to access someone else's strategy
- Make sure strategy._owner is set to current user

### Strategies showing 0 results
- Make sure strategies have owner field set
- Check MongoDB: `db.strategies.find({ owner: null })`
- Run migration to add owner to existing strategies

---

## Quick Deploy Checklist

- [ ] Change JWT_SECRET to production value
- [ ] Update CORS_ORIGIN to production domain
- [ ] Set NODE_ENV=production
- [ ] Update MongoDB URI to production DB
- [ ] Test auth flow end-to-end
- [ ] Test strategy creation saves with owner
- [ ] Test dashboard only shows user's strategies
- [ ] Test logout and login cycle
- [ ] Verify cookies are httpOnly in production
- [ ] Check HTTPS is enabled
- [ ] Monitor logs for errors
- [ ] Backup database before going live
