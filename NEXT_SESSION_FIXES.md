# Next Session: Critical Bug Fixes

**Date Created:** November 19, 2025  
**Priority:** HIGH - Blocking live testers

---

## 🔴 Critical Issues to Fix

### 1. Generate Week - Does Not Create Meal Plan
**Status:** Broken  
**Expected:** Clicking "Generate this week" should create a 7-day meal plan  
**Actual:** Button clicked but no meal plan appears  

**Investigation needed:**
- Check browser console for errors
- Verify API call is reaching backend (`POST /api/nutrition/plan/week`)
- Check if response is being parsed correctly (recently changed to extract `.data`)
- Verify weekStartDate format and targets are valid
- Check if plan is being stored in state correctly

**Files to check:**
- `src/features/nutrition/NutritionPage.tsx` (handleGenerateWeek function)
- `src/api/nutritionApiClient.ts` (generateMealPlanForWeek - recently modified)
- `backend/routes.ts` (generateWeeklyPlan endpoint)
- `backend/RealNutritionAiService.ts` (generateMealPlanForWeek implementation)

---

### 2. Camera Access for Form Checker - Still Failing
**Status:** Broken  
**Expected:** Camera should activate when starting a workout with form checking enabled  
**Actual:** Camera fails to enable/throws error  

**Previous fix attempt:**
- Added `navigator.mediaDevices` null check in `CameraPreview.tsx`
- This only fixes one edge case - main issue may be different

**Investigation needed:**
- Check exact error message in browser console
- Test if `getUserMedia` is being called correctly
- Verify browser permissions (user may need to explicitly allow camera)
- Check if HTTPS is required (some browsers block camera on HTTP)
- Verify camera is not in use by another application

**Files to check:**
- `src/features/pose/CameraPreview.tsx`
- `src/features/workout/WorkoutSessionView.tsx`
- Browser console for specific error message

---

### 3. Regenerate Day - Fails After First Generation
**Status:** Broken  
**Expected:** After generating a meal plan, clicking "Regenerate" on a specific day should create a new plan for that day  
**Actual:** Regenerate fails (error or no response)

**Investigation needed:**
- Check if `generateMealPlanForDay` API call succeeds
- Verify date parameter format
- Check if backend endpoint exists (`POST /api/nutrition/plan/day`)
- Verify response handling (recently changed to extract `.data`)

**Files to check:**
- `src/features/nutrition/NutritionPage.tsx` (handleRegenerateDay function)
- `src/api/nutritionApiClient.ts` (generateMealPlanForDay)
- `backend/routes.ts` (check if day generation endpoint exists)

**Note:** API client was recently modified - `planProfile` now passed in `preferences` object instead of separate parameter.

---

### 4. Regenerate Meal - Fails
**Status:** Broken  
**Expected:** Within a day plan, clicking regenerate on a specific meal (breakfast/lunch/dinner) should replace just that meal  
**Actual:** Regenerate meal fails

**Recent changes:**
- Modified `src/api/nutritionApiClient.ts` to extract `.data` from response
- Modified `regenerateMeal` error handling

**Investigation needed:**
- Check browser console for specific error
- Verify API call format matches backend expectations
- Check backend route exists and works (`POST /api/nutrition/plan/day/regenerate-meal`)
- Test backend directly with curl

**Files to check:**
- `src/api/nutritionApiClient.ts` (regenerateMeal - recently modified)
- `backend/routes.ts` (regenerateMeal endpoint)
- `backend/RealNutritionAiService.ts` (regenerateMeal implementation)

---

### 5. Swap Food - Only Uses Dummy Data
**Status:** Incomplete Feature  
**Expected:** When swapping a food item in a meal plan, should search for real alternatives  
**Actual:** Shows "Use Demo Replacement" button with hardcoded dummy data

**Current implementation:**
```tsx
// Demo: swap with a dummy food
const dummyFood: PlannedFoodItem = {
  id: `replaced-${Date.now()}`,
  name: 'Replacement food (demo)',
  quantity: 1,
  unit: 'serving',
  calories: 300,
  proteinGrams: 25,
  carbsGrams: 30,
  fatsGrams: 10,
};
```

**Fix needed:**
- Implement real food search/swap functionality
- OR remove the demo button entirely if not critical for MVP
- Consider using the food search from Meals page (which works for logging)

**Files to check:**
- `src/features/nutrition/MealPlanEditor.tsx` (line ~303-318)

---

### 6. Food Search on Meals Page - Returns 404 Error
**Status:** Broken  
**Expected:** Searching for food (e.g., "chicken", "apple") should return nutrition data  
**Actual:** Returns 404 error

**Recent changes:**
- Fixed `src/api/nutritionApiClient.v2.ts` to call real backend instead of stub
- Changed from returning hardcoded 200 calories to calling `POST /api/nutrition/parse-food`

**Investigation needed:**
- Check exact 404 URL being requested
- Verify API_BASE path is correct in `nutritionApiClient.v2.ts`
- Check if endpoint exists on backend
- Test backend directly: `curl -X POST http://localhost:3001/api/nutrition/parse-food -H "Content-Type: application/json" -d '{"text":"apple"}'`
- Verify request body format matches backend expectations

**Files to check:**
- `src/api/nutritionApiClient.v2.ts` (parseFood function - recently modified)
- `src/features/meals/FoodSearchPanel.tsx` (calls parseFood)
- `backend/routes.ts` (parseFood endpoint)

**Known working:**
- Backend parseFood endpoint works when tested directly with curl
- Returns proper data with varying calories based on food
- Issue is likely in how frontend calls the API

---

## 🔧 Debugging Strategy

### Step 1: Check Backend Health
```powershell
# Verify backend is running as admin
curl.exe http://localhost:3001/health

# Test parseFood endpoint directly
$body = @{ text = "banana" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/nutrition/parse-food" -Method POST -Body $body -ContentType "application/json"
```

### Step 2: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try each broken feature
4. Note exact error messages, stack traces, and failed network requests

### Step 3: Check Network Tab
1. Open DevTools Network tab
2. Try each feature
3. Look for:
   - Failed requests (red)
   - 404 errors
   - Response payloads
   - Request payloads

### Step 4: Add Logging
Add `console.log` statements to track:
- API call parameters
- Response data
- State updates
- Error catches

---

## 📝 Notes from Previous Session

### What Was Fixed:
1. ✅ Location/zip inputs in onboarding
2. ✅ Rest time editable (30-300s)
3. ✅ getUserMedia null check (partial fix)
4. ✅ Workout completion navigation
5. ✅ Set recording
6. ✅ GLP-1 in diet dropdown
7. ✅ Backend runs as admin (Windows socket binding issue)
8. ✅ API responses extract `.data` field properly
9. ✅ Food parsing returns real data (not hardcoded 200 calories)

### Backend Configuration:
- **Must run as administrator** due to Windows socket binding restrictions
- OpenAI API key configured and working
- Database connected successfully
- Port 3001 (backend), Port 5173 (frontend)

### Recent Code Changes:
1. Modified `src/api/nutritionApiClient.ts`:
   - `generateMealPlanForWeek` extracts `.data`
   - `regenerateMeal` extracts `.data`
   - `parseFood` extracts `.data`
   - All error handling improved

2. Modified `src/api/nutritionApiClient.v2.ts`:
   - `parseFood` changed from stub to real API call
   - Changed request body from `{ description }` to `{ text }`

3. Modified `src/features/nutrition/NutritionPage.tsx`:
   - `handleGenerateWeek` passes `planProfile` in preferences object
   - `handleRegenerateDay` passes `planProfile` in preferences object

---

## ✅ Completion Checklist

- [ ] Generate week creates full 7-day meal plan
- [ ] Camera activates for form checking without errors
- [ ] Regenerate day works after initial generation
- [ ] Regenerate meal works for individual meals
- [ ] Food swap either works with real data OR demo button removed
- [ ] Food search on Meals page returns correct data (not 404)
- [ ] All changes tested with live users
- [ ] Code staged and committed

---

## 🚀 After Fixes Complete

```powershell
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Fix nutrition meal planning and food search APIs

- Fix generate week to properly create meal plans
- Fix camera permissions for form checker
- Fix regenerate day/meal endpoints
- Fix food search 404 error on Meals page
- Remove or implement proper food swap functionality

All features tested with live users and working correctly."
```

---

**Priority Order:**
1. Food search 404 (easiest to debug - check API path)
2. Generate week (blocking all nutrition features)
3. Regenerate day/meal (dependent on generate week working)
4. Camera access (separate concern - may need user permissions)
5. Food swap demo (lowest priority - cosmetic issue)
