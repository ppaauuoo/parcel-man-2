@echo off
echo Testing GET /api/parcels/:id endpoint
echo ========================================
echo.

echo Step 1: Login as staff...
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"staff01\",\"password\":\"staff123\",\"role\":\"staff\"}" > temp_token.json
echo Done.
echo.

echo Step 2: Extract token...
for /f "tokens=2 delims=:," %%a in ('findstr "token" temp_token.json') do set TOKEN=%%a
set TOKEN=%TOKEN:"=%
set TOKEN=%TOKEN: =%
echo Token extracted (first 50 chars): %TOKEN:~0,50%...
echo.

echo Step 3: Test GET /api/parcels/4 (should show TH123123123)...
curl -s -X GET "http://localhost:3000/api/parcels/4" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json"
echo.
echo.

echo Step 4: Test GET /api/parcels/1...
curl -s -X GET "http://localhost:3000/api/parcels/1" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json"
echo.
echo.

echo Step 5: Test GET /api/parcels/9999 (should 404)...
curl -s -X GET "http://localhost:3000/api/parcels/9999" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json"
echo.
echo.

del temp_token.json
echo ========================================
echo Tests complete!
pause
