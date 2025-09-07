#!/bin/bash

# =============================================================================
# Notify Chat Application - Complete Deployment Test
# =============================================================================
# This script performs comprehensive testing of the entire deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Notify Chat Application - Complete Deployment Test${NC}"
echo "============================================================="

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}🔍 Testing: ${test_name}${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED: ${test_name}${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED: ${test_name}${NC}"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Check if Docker is running
echo -e "${BLUE}🐳 Checking Docker environment...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Check if containers are running
echo -e "${BLUE}📦 Checking container status...${NC}"
docker compose ps
echo ""

# Test 1: Container Health
run_test "All containers are running" "docker compose ps | grep -q 'Up'"

# Test 2: Frontend Health
run_test "Frontend health check" "curl -f http://localhost:3000/api/health"

# Test 3: Backend Health
run_test "Backend health check" "curl -f http://localhost:8080/kaithhealthcheck"

# Test 4: Nginx Proxy
run_test "Nginx proxy health" "curl -f http://localhost/health"

# Test 5: Database Connection
run_test "PostgreSQL connection" "docker compose exec db pg_isready -U postgres"

# Test 6: Redis Connection
run_test "Redis connection" "docker compose exec redis redis-cli ping"

# Test 7: API Endpoint
run_test "API endpoint accessible" "curl -f http://localhost/api/auth/login -X POST -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"invalid\"}'"

# Test 8: WebSocket Endpoint
run_test "WebSocket endpoint accessible" "curl -f http://localhost/ws"

# Test 9: Swagger Documentation
run_test "Swagger documentation" "curl -f http://localhost/swagger/"

# Test 10: Static Assets
run_test "Static assets serving" "curl -f http://localhost/_next/static/"

# Test 11: CORS Headers
echo -e "${BLUE}🔍 Testing: CORS headers${NC}"
CORS_RESPONSE=$(curl -s -I -X OPTIONS http://localhost/api/auth/login \
  -H "Origin: http://localhost" \
  -H "Access-Control-Request-Method: POST")

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✅ PASSED: CORS headers${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED: CORS headers${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 12: Authentication Flow
echo -e "${BLUE}🔍 Testing: Authentication flow${NC}"
AUTH_RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost" \
  -d '{"email":"admin@notify.com","password":"123456"}')

HTTP_CODE="${AUTH_RESPONSE: -3}"
AUTH_BODY="${AUTH_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PASSED: Authentication flow${NC}"
    ((TESTS_PASSED++))
    
    # Extract token and test authenticated endpoint
    TOKEN=$(echo "$AUTH_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        PROFILE_RESPONSE=$(curl -s -w "%{http_code}" http://localhost/api/users/profile \
          -H "Authorization: Bearer $TOKEN")
        PROFILE_HTTP_CODE="${PROFILE_RESPONSE: -3}"
        
        if [ "$PROFILE_HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✅ PASSED: Authenticated endpoint access${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}❌ FAILED: Authenticated endpoint access${NC}"
            ((TESTS_FAILED++))
        fi
    fi
else
    echo -e "${RED}❌ FAILED: Authentication flow (HTTP $HTTP_CODE)${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 13: Environment Variables
echo -e "${BLUE}🔍 Testing: Environment variables${NC}"
FRONTEND_ENV=$(docker compose exec frontend printenv | grep NEXT_PUBLIC_API_URL)
if [ -n "$FRONTEND_ENV" ]; then
    echo -e "${GREEN}✅ PASSED: Frontend environment variables${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED: Frontend environment variables${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 14: Database Migrations
echo -e "${BLUE}🔍 Testing: Database migrations${NC}"
DB_TABLES=$(docker compose exec db psql -U postgres -d notify_chat -c "\dt" | grep -c "table")
if [ "$DB_TABLES" -gt 0 ]; then
    echo -e "${GREEN}✅ PASSED: Database migrations (found $DB_TABLES tables)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED: Database migrations${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 15: Log Files
echo -e "${BLUE}🔍 Testing: Log files${NC}"
if docker compose logs --tail=10 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED: Log files accessible${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED: Log files accessible${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Performance Test
echo -e "${BLUE}⚡ Performance Test${NC}"
echo "Testing response times..."

# Test API response time
API_TIME=$(curl -o /dev/null -s -w "%{time_total}" http://localhost/api/auth/login -X POST -H 'Content-Type: application/json' -d '{"email":"test@example.com","password":"invalid"}')
echo -e "   API Response Time: ${API_TIME}s"

# Test Frontend response time
FRONTEND_TIME=$(curl -o /dev/null -s -w "%{time_total}" http://localhost/)
echo -e "   Frontend Response Time: ${FRONTEND_TIME}s"

if (( $(echo "$API_TIME < 2.0" | bc -l) )); then
    echo -e "${GREEN}✅ PASSED: API performance${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  WARNING: API response time is slow (${API_TIME}s)${NC}"
    ((TESTS_FAILED++))
fi

if (( $(echo "$FRONTEND_TIME < 3.0" | bc -l) )); then
    echo -e "${GREEN}✅ PASSED: Frontend performance${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  WARNING: Frontend response time is slow (${FRONTEND_TIME}s)${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Summary
echo -e "${BLUE}📊 Test Summary${NC}"
echo "=================="
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo -e "📈 Success Rate: $(( TESTS_PASSED * 100 / (TESTS_PASSED + TESTS_FAILED) ))%"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Deployment is working correctly.${NC}"
    echo ""
    echo -e "${BLUE}🌐 Application URLs:${NC}"
    echo -e "   Frontend: http://localhost"
    echo -e "   API: http://localhost/api"
    echo -e "   Docs: http://localhost/swagger/"
    echo ""
    echo -e "${BLUE}🔐 Test Credentials:${NC}"
    echo -e "   Email: admin@notify.com"
    echo -e "   Password: 123456"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the logs and configuration.${NC}"
    echo ""
    echo -e "${BLUE}🔧 Troubleshooting:${NC}"
    echo -e "   Check logs: docker compose logs -f"
    echo -e "   Check status: docker compose ps"
    echo -e "   Restart services: docker compose restart"
    exit 1
fi
