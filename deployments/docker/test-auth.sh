#!/bin/bash

# Test script to verify authentication flow
# Usage: ./test-auth.sh

echo "🔐 Testing Notify Application Authentication Flow..."
echo "=================================================="

# Test credentials (from seeding script)
EMAIL="admin@notify.com"
PASSWORD="123456"

echo "📋 Test credentials:"
echo "  Email: $EMAIL"
echo "  Password: $PASSWORD"
echo ""

echo "🔧 Testing backend authentication directly..."
DIRECT_RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

DIRECT_HTTP_CODE="${DIRECT_RESPONSE: -3}"
DIRECT_BODY="${DIRECT_RESPONSE%???}"

if [ "$DIRECT_HTTP_CODE" = "200" ]; then
    echo "✅ Direct backend auth successful (HTTP $DIRECT_HTTP_CODE)"
    echo "   Response: ${DIRECT_BODY:0:100}..."
else
    echo "❌ Direct backend auth failed (HTTP $DIRECT_HTTP_CODE)"
    echo "   Response: $DIRECT_BODY"
fi

echo ""
echo "🔀 Testing authentication through nginx proxy..."
PROXY_RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

PROXY_HTTP_CODE="${PROXY_RESPONSE: -3}"
PROXY_BODY="${PROXY_RESPONSE%???}"

if [ "$PROXY_HTTP_CODE" = "200" ]; then
    echo "✅ Nginx proxy auth successful (HTTP $PROXY_HTTP_CODE)"
    echo "   Response: ${PROXY_BODY:0:100}..."
    
    # Extract token for further testing
    TOKEN=$(echo "$PROXY_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        echo "   Token extracted: ${TOKEN:0:20}..."
        
        echo ""
        echo "🔑 Testing authenticated endpoint with token..."
        PROFILE_RESPONSE=$(curl -s -w "%{http_code}" http://localhost/api/users/profile \
          -H "Authorization: Bearer $TOKEN")
        
        PROFILE_HTTP_CODE="${PROFILE_RESPONSE: -3}"
        PROFILE_BODY="${PROFILE_RESPONSE%???}"
        
        if [ "$PROFILE_HTTP_CODE" = "200" ]; then
            echo "✅ Authenticated request successful (HTTP $PROFILE_HTTP_CODE)"
            echo "   Profile: ${PROFILE_BODY:0:100}..."
        else
            echo "❌ Authenticated request failed (HTTP $PROFILE_HTTP_CODE)"
            echo "   Response: $PROFILE_BODY"
        fi
    fi
else
    echo "❌ Nginx proxy auth failed (HTTP $PROXY_HTTP_CODE)"
    echo "   Response: $PROXY_BODY"
fi

echo ""
echo "🌐 Testing CORS preflight request..."
CORS_RESPONSE=$(curl -s -w "%{http_code}" -X OPTIONS http://localhost/api/auth/login \
  -H "Origin: http://localhost" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")

CORS_HTTP_CODE="${CORS_RESPONSE: -3}"
if [ "$CORS_HTTP_CODE" = "204" ] || [ "$CORS_HTTP_CODE" = "200" ]; then
    echo "✅ CORS preflight successful (HTTP $CORS_HTTP_CODE)"
else
    echo "❌ CORS preflight failed (HTTP $CORS_HTTP_CODE)"
fi

echo ""
echo "🚫 Testing invalid credentials..."
INVALID_RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost" \
  -d '{"email":"invalid@example.com","password":"wrongpassword"}')

INVALID_HTTP_CODE="${INVALID_RESPONSE: -3}"
INVALID_BODY="${INVALID_RESPONSE%???}"

if [ "$INVALID_HTTP_CODE" = "401" ]; then
    echo "✅ Invalid credentials properly rejected (HTTP $INVALID_HTTP_CODE)"
else
    echo "❌ Invalid credentials test unexpected result (HTTP $INVALID_HTTP_CODE)"
    echo "   Response: $INVALID_BODY"
fi

echo ""
echo "📋 Authentication test completed!"
echo ""
echo "🌐 Frontend should now be able to authenticate using:"
echo "   URL: http://localhost/api/auth/login"
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD"
