# Authentication Fix Documentation

## Problem Summary

The login form in the frontend was receiving **404 Not Found** responses when making POST requests to `/api/auth/login` through the Nginx proxy in the containerized environment.

## Root Cause Analysis

### 1. **Path Mismatch Issue**
- **Frontend**: Making requests to `/auth/login` via axios
- **Environment**: `NEXT_PUBLIC_API_URL=http://localhost/api`
- **Resulting URL**: `http://localhost/api/auth/login`
- **Backend Routes**: Configured under `/api/v1/` prefix
- **Expected Backend URL**: `/api/v1/auth/login`

### 2. **Nginx Proxy Configuration**
- Nginx was proxying `/api/` directly to backend without path rewriting
- Backend expected `/api/v1/` prefix but received `/api/`
- This caused 404 errors for all API endpoints

## Solution Implemented

### 1. **Updated Nginx Configuration** (`deployments/nginx.conf`)

**Before:**
```nginx
location /api/ {
    proxy_pass http://backend;
}
```

**After:**
```nginx
location /api/ {
    proxy_pass http://backend/api/v1/;
}
```

### 2. **Fixed All Affected Endpoints**

- **API Routes**: `/api/` → `/api/v1/`
- **WebSocket**: `/ws` → `/api/v1/ws`
- **Swagger**: `/swagger/` → `/api/v1/swagger/`
- **Health Check**: `/health` → `/kaithhealthcheck`

### 3. **Enhanced Testing Infrastructure**

Created comprehensive test scripts:
- `test-connection.sh` - Basic connectivity testing
- `test-auth.sh` - Authentication flow testing

Added Makefile commands:
- `make docker-test` - Test connectivity
- `make docker-test-auth` - Test authentication

## Authentication Flow

### 1. **Frontend Request**
```typescript
// LoginEmailForm.tsx uses generated API client
const loginMutation = usePostAuthLogin({
  mutation: {
    onSuccess: (res) => {
      // Handle successful login
    }
  }
});

// Generated client makes request to:
// POST http://localhost/api/auth/login
```

### 2. **Nginx Proxy**
```nginx
# Nginx rewrites the path:
# /api/auth/login → /api/v1/auth/login
location /api/ {
    proxy_pass http://backend/api/v1/;
}
```

### 3. **Backend Handler**
```go
// Backend receives request at:
// POST /api/v1/auth/login
authRoutes.POST("/login", r.authHandler.Login)
```

## Test Credentials

Default users created by seeding:
- **Admin**: `admin@notify.com` / `123456`
- **Test Users**: `test@notify.com`, `alice@notify.com`, `bob@notify.com`, `charlie@notify.com` / `123456`

## Verification Steps

1. **Start the application:**
   ```bash
   make docker-up
   ```

2. **Test connectivity:**
   ```bash
   make docker-test
   ```

3. **Test authentication:**
   ```bash
   make docker-test-auth
   ```

4. **Access frontend:**
   - URL: http://localhost
   - Login with: `admin@notify.com` / `123456`

## Files Modified

1. `deployments/nginx.conf` - Fixed proxy path rewriting
2. `deployments/docker/test-connection.sh` - Updated test endpoints
3. `deployments/docker/test-auth.sh` - New authentication test
4. `Makefile` - Added test commands
5. `deployments/README.md` - Updated documentation

## Expected Behavior

- ✅ Frontend login form successfully authenticates users
- ✅ JWT tokens are properly returned and stored
- ✅ Authenticated API requests work correctly
- ✅ All API endpoints accessible through Nginx proxy
- ✅ WebSocket connections work for real-time features

The authentication flow now works seamlessly in the containerized environment with proper path routing through the Nginx reverse proxy.
