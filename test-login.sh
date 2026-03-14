#!/bin/bash

echo "====================================="
echo "Testing Backend Login Functionality"
echo "====================================="
echo ""

# Test 1: Health check
echo "1. Testing health endpoint..."
curl -s http://localhost:3001/api/health | python3 -m json.tool
echo ""
echo ""

# Test 2: Login with caregiver
echo "2. Testing login with caregiver credentials..."
echo "Email: nimal.perera@elderease.lk"
echo "Password: password123"
echo ""
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nimal.perera@elderease.lk","password":"password123"}' \
  | python3 -m json.tool
echo ""
echo ""

# Test 3: Login with admin
echo "3. Testing login with admin credentials..."
echo "Email: admin@elderease.lk"
echo "Password: admin123"
echo ""
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@elderease.lk","password":"admin123"}' \
  | python3 -m json.tool
echo ""
echo ""

# Test 4: Login with care receiver
echo "4. Testing login with care receiver credentials..."
echo "Email: kumudu.w@elderease.lk"
echo "Password: password123"
echo ""
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kumudu.w@elderease.lk","password":"password123"}' \
  | python3 -m json.tool
echo ""
echo ""

echo "====================================="
echo "Tests Complete"
echo "====================================="
