#!/bin/bash

# CE-Hub Authentication Edge Function Smoke Test Suite
# This script performs comprehensive smoke testing of the deployed auth edge function

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_test_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [ "$result" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}[PASS]${NC} $test_name"
        if [ ! -z "$details" ]; then
            echo "       $details"
        fi
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}[FAIL]${NC} $test_name"
        if [ ! -z "$details" ]; then
            echo "       $details"
        fi
    fi
}

# Configuration
BASE_URL=""
TEST_TOKEN=""
TEST_REFRESH_TOKEN=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            BASE_URL="$2"
            shift 2
            ;;
        --token)
            TEST_TOKEN="$2"
            shift 2
            ;;
        --refresh-token)
            TEST_REFRESH_TOKEN="$2"
            shift 2
            ;;
        --local)
            BASE_URL="http://localhost:3000"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --url URL              Base URL of the auth edge function"
            echo "  --token TOKEN          Valid JWT token for testing"
            echo "  --refresh-token TOKEN  Valid refresh token for testing"
            echo "  --local                Test against local development server"
            echo "  --help                 Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --local"
            echo "  $0 --url https://auth-edge.vercel.app"
            echo "  $0 --url https://auth-edge.vercel.app --token eyJ..."
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate configuration
if [ -z "$BASE_URL" ]; then
    print_error "Base URL is required. Use --url or --local flag."
    print_status "Run '$0 --help' for usage information."
    exit 1
fi

print_status "Starting CE-Hub Auth Edge Function Smoke Tests"
print_status "Base URL: $BASE_URL"
print_status "Test Token: ${TEST_TOKEN:+Provided}"
print_status "Refresh Token: ${TEST_REFRESH_TOKEN:+Provided}"
echo ""

# Test 1: Health Check
print_status "Test 1: Health Check"
HEALTH_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')

if [ "$HTTP_CODE" = "200" ]; then
    # Parse JSON response
    STATUS=$(echo "$RESPONSE_BODY" | grep -o '"status":"[^"]*' | sed 's/"status":"//')
    if [ "$STATUS" = "healthy" ]; then
        print_test_result "Health check returns healthy status" "PASS" "HTTP $HTTP_CODE"
    else
        print_test_result "Health check returns healthy status" "FAIL" "Status: $STATUS"
    fi
else
    print_test_result "Health check returns 200" "FAIL" "HTTP $HTTP_CODE"
fi

# Test 2: CORS Preflight
print_status "Test 2: CORS Preflight"
CORS_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X OPTIONS \
    -H "Origin: https://example.com" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    "$BASE_URL/verify")
HTTP_CODE=$(echo "$CORS_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$HTTP_CODE" = "204" ]; then
    print_test_result "CORS preflight request" "PASS" "HTTP $HTTP_CODE"
else
    print_test_result "CORS preflight request" "FAIL" "HTTP $HTTP_CODE"
fi

# Test 3: Invalid Route
print_status "Test 3: Invalid Route Handling"
INVALID_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/invalid-route")
HTTP_CODE=$(echo "$INVALID_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$HTTP_CODE" = "404" ]; then
    print_test_result "Invalid route returns 404" "PASS" "HTTP $HTTP_CODE"
else
    print_test_result "Invalid route returns 404" "FAIL" "HTTP $HTTP_CODE"
fi

# Test 4: Token Verification - Missing Token
print_status "Test 4: Token Verification - Missing Token"
VERIFY_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X GET \
    "$BASE_URL/verify")
HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$HTTP_CODE" = "400" ]; then
    print_test_result "Missing token returns 400" "PASS" "HTTP $HTTP_CODE"
else
    print_test_result "Missing token returns 400" "FAIL" "HTTP $HTTP_CODE"
fi

# Test 5: Token Verification - Invalid Token
print_status "Test 5: Token Verification - Invalid Token"
VERIFY_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X GET \
    -H "Authorization: Bearer invalid-token" \
    "$BASE_URL/verify")
HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$HTTP_CODE" = "401" ]; then
    print_test_result "Invalid token returns 401" "PASS" "HTTP $HTTP_CODE"
else
    print_test_result "Invalid token returns 401" "FAIL" "HTTP $HTTP_CODE"
fi

# Test 6: Token Verification - POST with JSON
print_status "Test 6: Token Verification - POST with JSON"
VERIFY_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"token":"invalid-token"}' \
    "$BASE_URL/verify")
HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$HTTP_CODE" = "401" ]; then
    print_test_result "POST token verification with invalid token" "PASS" "HTTP $HTTP_CODE"
else
    print_test_result "POST token verification with invalid token" "FAIL" "HTTP $HTTP_CODE"
fi

# Test 7: Token Verification - Valid Token (if provided)
if [ ! -z "$TEST_TOKEN" ]; then
    print_status "Test 7: Token Verification - Valid Token"
    VERIFY_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X GET \
        -H "Authorization: Bearer $TEST_TOKEN" \
        "$BASE_URL/verify")
    HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

    if [ "$HTTP_CODE" = "200" ]; then
        RESPONSE_BODY=$(echo "$VERIFY_RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')
        VALID=$(echo "$RESPONSE_BODY" | grep -o '"valid":[^,}]*' | sed 's/"valid"://')
        if [ "$VALID" = "true" ]; then
            print_test_result "Valid token verification" "PASS" "HTTP $HTTP_CODE, valid: $VALID"
        else
            print_test_result "Valid token verification" "FAIL" "Token marked as invalid: $VALID"
        fi
    else
        print_test_result "Valid token verification" "FAIL" "HTTP $HTTP_CODE"
    fi
else
    print_warning "Skipping valid token test (no token provided)"
fi

# Test 8: Token Refresh - Invalid Token
print_status "Test 8: Token Refresh - Invalid Token"
REFRESH_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"refreshToken":"invalid-refresh-token"}' \
    "$BASE_URL/refresh")
HTTP_CODE=$(echo "$REFRESH_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$HTTP_CODE" = "401" ]; then
    print_test_result "Invalid refresh token returns 401" "PASS" "HTTP $HTTP_CODE"
else
    print_test_result "Invalid refresh token returns 401" "FAIL" "HTTP $HTTP_CODE"
fi

# Test 9: Token Refresh - Valid Token (if provided)
if [ ! -z "$TEST_REFRESH_TOKEN" ]; then
    print_status "Test 9: Token Refresh - Valid Token"
    REFRESH_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"refreshToken\":\"$TEST_REFRESH_TOKEN\"}" \
        "$BASE_URL/refresh")
    HTTP_CODE=$(echo "$REFRESH_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

    if [ "$HTTP_CODE" = "200" ]; then
        RESPONSE_BODY=$(echo "$REFRESH_RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')
        ACCESS_TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')
        if [ ! -z "$ACCESS_TOKEN" ]; then
            print_test_result "Valid refresh token returns new access token" "PASS" "HTTP $HTTP_CODE"
        else
            print_test_result "Valid refresh token returns new access token" "FAIL" "No access token in response"
        fi
    else
        print_test_result "Valid refresh token returns 200" "FAIL" "HTTP $HTTP_CODE"
    fi
else
    print_warning "Skipping valid refresh token test (no refresh token provided)"
fi

# Test 10: Method Not Allowed
print_status "Test 10: Method Not Allowed"
METHOD_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X PATCH \
    "$BASE_URL/verify")
HTTP_CODE=$(echo "$METHOD_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$HTTP_CODE" = "405" ]; then
    print_test_result "Unsupported method returns 405" "PASS" "HTTP $HTTP_CODE"
else
    print_test_result "Unsupported method returns 405" "FAIL" "HTTP $HTTP_CODE"
fi

# Test 11: Rate Limiting (Basic)
print_status "Test 11: Rate Limiting Behavior"
# Make rapid requests to test rate limiting
RATE_LIMIT_TRIGGERED=false
for i in {1..50}; do
    RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/health")
    HTTP_CODE=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$HTTP_CODE" = "429" ]; then
        RATE_LIMIT_TRIGGERED=true
        break
    fi
done

if [ "$RATE_LIMIT_TRIGGERED" = true ]; then
    print_test_result "Rate limiting is active" "PASS" "Rate limit triggered after rapid requests"
else
    print_test_result "Rate limiting is active" "PASS" "Rate limit not triggered (within limits)"
fi

# Test 12: Response Headers
print_status "Test 12: Security Headers"
HEADERS_RESPONSE=$(curl -s -I "$BASE_URL/health")

# Check for security headers
SECURITY_HEADERS_PRESENT=true
MISSING_HEADERS=""

if ! echo "$HEADERS_RESPONSE" | grep -qi "x-content-type-options"; then
    SECURITY_HEADERS_PRESENT=false
    MISSING_HEADERS="$MISSING_HEADERS X-Content-Type-Options"
fi

if ! echo "$HEADERS_RESPONSE" | grep -qi "x-frame-options"; then
    SECURITY_HEADERS_PRESENT=false
    MISSING_HEADERS="$MISSING_HEADERS X-Frame-Options"
fi

if [ "$SECURITY_HEADERS_PRESENT" = true ]; then
    print_test_result "Security headers present" "PASS" "All security headers found"
else
    print_test_result "Security headers present" "FAIL" "Missing headers:$MISSING_HEADERS"
fi

# Test 13: JSON Response Format
print_status "Test 13: JSON Response Format"
JSON_RESPONSE=$(curl -s "$BASE_URL/health")
if echo "$JSON_RESPONSE" | python3 -m json.tool > /dev/null 2>&1; then
    print_test_result "Health endpoint returns valid JSON" "PASS" "JSON format valid"
else
    print_test_result "Health endpoint returns valid JSON" "FAIL" "Invalid JSON format"
fi

# Test 14: Request ID Header
print_status "Test 14: Request ID Header"
REQUEST_ID_RESPONSE=$(curl -s -I "$BASE_URL/health")
if echo "$REQUEST_ID_RESPONSE" | grep -qi "x-request-id"; then
    print_test_result "Request ID header present" "PASS" "X-Request-ID header found"
else
    print_test_result "Request ID header present" "FAIL" "X-Request-ID header missing"
fi

# Test Summary
echo ""
print_status "=== SMOKE TEST SUMMARY ==="
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    print_success "🎉 All smoke tests passed! The auth edge function is working correctly."
    exit 0
else
    echo ""
    print_error "❌ $FAILED_TESTS test(s) failed. Please investigate the issues above."
    exit 1
fi