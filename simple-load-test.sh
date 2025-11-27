#!/bin/bash

# Simple bash script to test 1000 registrations
# Run with: bash simple-load-test.sh

API_URL="http://localhost:3000/api/registrations/create"
TOTAL=1000
SUCCESS=0
FAILED=0

echo "Starting load test: $TOTAL registrations..."
echo "=================================="

for i in $(seq 1 $TOTAL); do
  # Generate unique employee ID using timestamp
  TIMESTAMP=$(date +%s%N | cut -b1-13)
  EMPLOYEE_ID="${TIMESTAMP:7:6}"
  
  # Send request
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"firstName\":\"ทดสอบ\",\"lastName\":\"คนที่${i}\",\"employeeId\":\"${EMPLOYEE_ID}\"}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    ((SUCCESS++))
  else
    ((FAILED++))
    echo "Failed request $i: HTTP $HTTP_CODE"
  fi
  
  # Progress indicator every 100 requests
  if [ $((i % 100)) -eq 0 ]; then
    echo "Progress: $i/$TOTAL (Success: $SUCCESS, Failed: $FAILED)"
  fi
done

echo "=================================="
echo "Test completed!"
echo "Total: $TOTAL"
echo "Success: $SUCCESS"
echo "Failed: $FAILED"
echo "Success rate: $(awk "BEGIN {printf \"%.2f\", ($SUCCESS/$TOTAL)*100}")%"
