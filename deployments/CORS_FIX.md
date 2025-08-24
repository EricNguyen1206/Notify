# CORS Configuration Fix

## Problem Summary

The frontend was experiencing CORS (Cross-Origin Resource Sharing) errors when making API requests to the backend through the Nginx proxy, even though authentication requests were reaching the backend successfully.

## Root Cause Analysis

### 1. **Conflicting CORS Headers**
- **Nginx**: Was adding its own CORS headers with `Access-Control-Allow-Origin: *`
- **Backend**: Was also setting CORS headers with specific origin validation
- **Result**: Duplicate/conflicting CORS headers causing browser rejection

### 2. **Origin Mismatch**
- **Frontend Origin**: `http://localhost` (when accessed through Nginx proxy)
- **Backend Allowed Origins**: Only `http://localhost:3000`, `https://localhost:3000`, etc.
- **Result**: Backend rejecting requests from `http://localhost` origin

### 3. **CORS Header Duplication**
- Both Nginx and backend were setting CORS headers
- Browsers reject responses with duplicate CORS headers
- This caused valid requests to fail with CORS errors

## Solution Implemented

### 1. **Removed CORS Headers from Nginx**

**Before:**
```nginx
# CORS headers for API
add_header Access-Control-Allow-Origin "*" always;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
# ... more CORS headers
```

**After:**
```nginx
# Pass through Origin header to backend for CORS handling
proxy_set_header Origin $http_origin;
```

### 2. **Updated Backend CORS Configuration**

**Before:**
```go
allowedOrigins := []string{
    "http://localhost:3000",
    "https://localhost:3000",
    "https://notify-chat.netlify.app",
    "http://127.0.0.1:3000",
}
```

**After:**
```go
allowedOrigins := []string{
    "http://localhost:3000",           // Frontend dev server
    "https://localhost:3000",          // Frontend dev server (HTTPS)
    "http://localhost",                // Nginx proxy (Docker)
    "https://localhost",               // Nginx proxy (HTTPS)
    "http://127.0.0.1:3000",           // Alternative localhost
    "http://127.0.0.1",                // Alternative localhost (Nginx)
    "https://notify-chat.netlify.app", // Production deployment
}
```

### 3. **Added Environment Variable Configuration**

Added `ALLOWED_ORIGINS` environment variable for flexible CORS configuration:

```bash
# .env
ALLOWED_ORIGINS=http://localhost,https://localhost

# .env.development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost
```

### 4. **Updated WebSocket CORS**

Applied the same origin updates to WebSocket connections in `handlers.go`.

## Configuration Files Modified

1. **`deployments/nginx.conf`**
   - Removed duplicate CORS headers
   - Added Origin header passthrough

2. **`chat-service/internal/api/middleware/cors.go`**
   - Added `http://localhost` and `https://localhost` to allowed origins
   - Enhanced origin validation

3. **`chat-service/internal/websocket/handlers.go`**
   - Updated WebSocket origin validation to match API CORS

4. **`deployments/docker/.env`**
   - Added `ALLOWED_ORIGINS` environment variable

5. **`deployments/docker/docker-compose.yml`**
   - Pass `ALLOWED_ORIGINS` to backend container

## Testing CORS Configuration

### 1. **Run CORS Test**
```bash
make docker-test-auth
```

### 2. **Manual CORS Testing**
```bash
# Test preflight request
curl -X OPTIONS http://localhost/api/auth/login \
  -H "Origin: http://localhost" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"

# Test actual request with Origin header
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost" \
  -d '{"email":"admin@notify.com","password":"123456"}'
```

### 3. **Browser Developer Tools**
- Open Network tab
- Look for CORS-related errors in console
- Check response headers for proper CORS headers

## Expected Behavior

### ✅ **Working CORS Response Headers**
```
Access-Control-Allow-Origin: http://localhost
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Origin, Content-Type, Authorization, X-Requested-With
Access-Control-Allow-Credentials: true
```

### ✅ **Successful Request Flow**
1. **Preflight Request** (OPTIONS) → `204 No Content`
2. **Actual Request** (POST) → `200 OK` with proper CORS headers
3. **Frontend** → No CORS errors in browser console

## Troubleshooting

### **If CORS errors persist:**

1. **Check container logs:**
   ```bash
   docker compose logs backend
   docker compose logs nginx
   ```

2. **Verify environment variables:**
   ```bash
   docker compose exec app printenv | grep ALLOWED_ORIGINS
   ```

3. **Test direct backend access:**
   ```bash
   curl -X POST http://localhost:8080/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -H "Origin: http://localhost" \
     -d '{"email":"admin@notify.com","password":"123456"}'
   ```

4. **Check browser network tab:**
   - Look for duplicate CORS headers
   - Verify Origin header is being sent
   - Check preflight request success

The CORS configuration now properly handles cross-origin requests from the frontend through the Nginx proxy to the backend API.
