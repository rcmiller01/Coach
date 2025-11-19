# Real AI Implementation Guide - parseFood

This document describes the complete implementation of the real AI-powered `parseFood` feature.

## Overview

**Status:** ✅ Implementation Complete (Ready for Testing)

The parseFood pipeline uses:
1. **PostgreSQL database** with ~50 generic foods + 20 branded items
2. **Nutrition tools** for pure DB operations (search, lookup, calculate)
3. **OpenAI GPT-4** with function calling for LLM orchestration
4. **Contract-validated error handling** with proper retry semantics

## Architecture

```
User Input ("1 apple")
    ↓
Frontend (FoodSearchPanel.tsx)
    ↓
API Client (nutritionApiClient.v2.ts)
    ↓
Backend Route (POST /api/nutrition/parse-food)
    ↓
RealNutritionAiService.parseFood()
    ↓
┌─────────────────────────────────┐
│ LLM Orchestration (OpenAI GPT-4)│
│  - Interprets user text          │
│  - Calls nutrition tools         │
│  - Generates explanation         │
└─────────────────────────────────┘
    ↓ (function calls)
┌─────────────────────────────────┐
│ Nutrition Tools                  │
│  - searchGenericFood()           │
│  - searchBrandedItem()           │
│  - calculateRecipeMacros()       │
└─────────────────────────────────┘
    ↓
PostgreSQL Database
    ↓
LoggedFoodItem (with AI explanation)
```

## Files Created

### Database Layer
- `backend/db/schema.sql` - PostgreSQL schema (4 main tables)
- `backend/db/seed.sql` - Initial data (~50 generic foods, 20 branded items)
- `backend/db/README.md` - Setup instructions

### Tool Server
- `backend/nutritionTools.ts` - MCP-style food database interface
  - `searchGenericFood()` - Fuzzy search USDA foods
  - `searchBrandedItem()` - Search restaurant menu items
  - `getNutritionById()` - Get specific food by ID
  - `calculateRecipeMacros()` - Compute macros from ingredients
  - Helper functions for unit conversion

### AI Service
- `backend/RealNutritionAiService.ts` - LLM-driven food parser
  - OpenAI GPT-4 with function calling
  - Tool execution loop (up to 5 iterations)
  - Quota management (in-memory for now)
  - Error handling with proper codes
  - Confidence scoring

### API Layer
- `backend/routes.ts` (updated) - Error-aware endpoint
  - Proper ApiErrorResponse mapping
  - HTTP status codes by error type
  - Environment-based service selection

## Setup Instructions

### 1. Install Dependencies

```bash
npm install pg openai
npm install --save-dev @types/pg
```

### 2. Configure Environment

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/coach_nutrition

# OpenAI
OPENAI_API_KEY=sk-...your-key-here...
OPENAI_MODEL=gpt-4-turbo-preview

# Enable real AI (set to 'false' to use stubs)
USE_REAL_AI=true

# Optional: Rate Limits
DAILY_PARSE_LIMIT=100
DAILY_PLAN_GENERATION_LIMIT=10
```

### 3. Initialize Database

```bash
# Create database
createdb coach_nutrition

# Run migrations
psql -d coach_nutrition -f backend/db/schema.sql

# Seed data
psql -d coach_nutrition -f backend/db/seed.sql

# Verify
psql -d coach_nutrition -c "SELECT COUNT(*) FROM nutrition_generic_foods;"
# Expected: ~50 rows
```

### 4. Initialize Tools in Your Backend

In your server startup:

```typescript
import { Pool } from 'pg';
import * as nutritionTools from './backend/nutritionTools';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize tools with DB connection
nutritionTools.initializeDb(pool);
```

### 5. Run Contract Tests

```bash
npm run test:contracts
```

**Expected:** All 353 tests pass ✅

## API Contract

### Request

```http
POST /api/nutrition/parse-food
Content-Type: application/json

{
  "text": "1 apple",
  "city": "Seattle",      // optional
  "zipCode": "98101",     // optional
  "locale": "en-US"       // optional, defaults to en-US
}
```

### Success Response (200 OK)

```json
{
  "data": {
    "id": "parsed-1234567890-xyz",
    "name": "Apple, raw, with skin",
    "quantity": 1,
    "unit": "piece",
    "calories": 95,
    "proteinGrams": 0.5,
    "carbsGrams": 25.0,
    "fatsGrams": 0.3,
    "sourceType": "search",
    "userAdjusted": false,
    "dataSource": "official",
    "aiExplanation": {
      "reasoning": "I interpreted '1 apple' as a medium-sized raw apple with skin. Based on USDA data, a typical medium apple (182g) contains approximately 95 calories. This is official USDA data with high confidence.",
      "sources": [
        {
          "label": "USDA FoodData Central",
          "url": "https://fdc.nal.usda.gov/"
        }
      ],
      "confidence": "high"
    }
  }
}
```

### Error Responses

**Quota Exceeded (429)**
```json
{
  "error": {
    "code": "AI_QUOTA_EXCEEDED",
    "message": "Daily food parse limit reached (100 per day). Resets at midnight.",
    "retryable": true
  }
}
```

**Timeout (504)**
```json
{
  "error": {
    "code": "AI_TIMEOUT",
    "message": "The AI service took too long to respond. Please try again.",
    "retryable": true
  }
}
```

**Parse Failed (500)**
```json
{
  "error": {
    "code": "AI_PARSE_FAILED",
    "message": "Could not interpret that food description. Try something simpler like '1 apple' or 'chicken breast, 6oz'.",
    "retryable": false
  }
}
```

## Test Scenarios

### 1. Simple Generic Food

```bash
curl -X POST http://localhost:3000/api/nutrition/parse-food \
  -H "Content-Type: application/json" \
  -d '{"text": "1 apple"}'
```

**Expected:**
- Name: "Apple, raw, with skin"
- Calories: ~95
- Provenance: "official"
- Confidence: "high"
- Source: USDA FoodData Central

### 2. Branded Item

```bash
curl -X POST http://localhost:3000/api/nutrition/parse-food \
  -H "Content-Type: application/json" \
  -d '{"text": "Subway Italian BMT 6 inch"}'
```

**Expected:**
- Name: "Italian B.M.T.® 6-inch on 9-Grain Wheat"
- Calories: 410
- Provenance: "official"
- Confidence: "high"
- Source: Subway US Nutrition Calculator 2025

### 3. Composite Food (Recipe)

```bash
curl -X POST http://localhost:3000/api/nutrition/parse-food \
  -H "Content-Type: application/json" \
  -d '{"text": "turkey sandwich with cheese and mayo"}'
```

**Expected:**
- Name: "Turkey sandwich with cheese and mayonnaise"
- Calories: ~450 (calculated from ingredients)
- Provenance: "estimated"
- Confidence: "medium"
- Sources: Multiple USDA sources

### 4. Ambiguous Query

```bash
curl -X POST http://localhost:3000/api/nutrition/parse-food \
  -H "Content-Type: application/json" \
  -d '{"text": "my usual from Subway", "city": "Seattle", "zipCode": "98101"}'
```

**Expected:**
- LLM may ask for clarification or make reasonable assumption
- Confidence: "low"
- Reasoning should mention the ambiguity

### 5. Error: Invalid Input

```bash
curl -X POST http://localhost:3000/api/nutrition/parse-food \
  -H "Content-Type: application/json" \
  -d '{"text": ""}'
```

**Expected:** 400 Bad Request with VALIDATION_ERROR

### 6. Error: Quota Exceeded

```bash
# Make 101 requests in rapid succession
for i in {1..101}; do
  curl -X POST http://localhost:3000/api/nutrition/parse-food \
    -H "Content-Type: application/json" \
    -d '{"text": "apple"}' &
done
wait
```

**Expected:** Some requests return 429 with AI_QUOTA_EXCEEDED

## LLM Behavior

### System Prompt

The LLM is instructed to:
- Never guess macros - always use tools
- Prefer official branded data when available
- Use generic foods + calculateRecipeMacros for composites
- Be conservative with portion sizes
- Provide clear reasoning (2-6 sentences)

### Tool Usage Patterns

**Pattern 1: Simple Generic Food**
```
User: "1 apple"
LLM: search_generic_food(query="apple raw")
→ Returns USDA apple data
LLM: Calculate for 182g medium apple
→ Return structured result
```

**Pattern 2: Branded Item**
```
User: "Big Mac"
LLM: search_branded_item(query="Big Mac", brand="McDonald's")
→ Returns official McDonald's data
LLM: Use per-serving values
→ Return structured result
```

**Pattern 3: Composite Food**
```
User: "turkey sandwich with cheese"
LLM: search_generic_food(query="turkey breast")
LLM: search_generic_food(query="bread whole wheat")
LLM: search_generic_food(query="cheese cheddar")
LLM: calculate_recipe_macros(ingredients=[...])
→ Returns summed macros
LLM: Build explanation
→ Return structured result
```

### Confidence Levels

- **high**: Exact brand match or well-defined generic food
- **medium**: Generic food with reasonable portion estimate or clean recipe
- **low**: Ambiguous description, multiple assumptions needed

## Frontend Integration

The frontend components are already updated to handle:

1. **FoodSearchPanel.tsx**
   - Calls `nutritionApiClient.v2.parseFood()`
   - Shows AI explanation with sources
   - Displays confidence badge
   - Shows Official/Estimate badge based on `dataSource`
   - Retry UI for retryable errors

2. **FoodLogList.tsx**
   - Displays logged items with all badges
   - Inline macro editing with correction tracking
   - Sets `userAdjusted = true` when edited
   - Stores original values for feedback loop

3. **Error Handling**
   - Catches `NutritionApiError`
   - Shows retry button for `retryable = true`
   - Suggests simplification for `AI_PARSE_FAILED`

## Monitoring & Debugging

### Log AI Calls

```typescript
// In RealNutritionAiService.parseFood()
console.log('parseFood request:', {
  userId,
  text,
  userContext,
  timestamp: new Date().toISOString(),
});

// After LLM response
console.log('parseFood response:', {
  userId,
  foodName: item.name,
  confidence: item.aiExplanation?.confidence,
  provenance: item.dataSource,
  toolCalls: messages.filter(m => m.role === 'tool').length,
});
```

### Track Quota Usage

```sql
SELECT 
  user_id,
  daily_food_parses_used,
  reset_at,
  (100 - daily_food_parses_used) as remaining
FROM user_ai_quota
ORDER BY daily_food_parses_used DESC
LIMIT 10;
```

### Analyze User Corrections

```sql
-- TODO: Add logging table for corrections
CREATE TABLE user_food_corrections (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  food_item_id TEXT NOT NULL,
  original_calories INTEGER,
  corrected_calories INTEGER,
  original_protein FLOAT,
  corrected_protein FLOAT,
  -- ... other fields
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Production Checklist

- [ ] Set up PostgreSQL with connection pooling
- [ ] Configure OpenAI API key in secrets manager
- [ ] Set up Redis for caching frequently accessed foods
- [ ] Implement rate limiting at API gateway level
- [ ] Add user authentication and get real user IDs
- [ ] Move quota tracking to database (not in-memory)
- [ ] Set up monitoring for AI calls (cost, latency, errors)
- [ ] Add logging for all parseFood requests
- [ ] Implement feedback loop for user corrections
- [ ] Add more foods to database (expand from 50 to 500+)
- [ ] Fine-tune LLM prompts based on usage patterns
- [ ] Set up alerts for quota thresholds
- [ ] Add database backups
- [ ] Load test with concurrent users
- [ ] Optimize slow queries with indexes

## Cost Estimation

**OpenAI API Costs (GPT-4 Turbo):**
- Input: ~$10 per 1M tokens
- Output: ~$30 per 1M tokens

**Typical parseFood call:**
- System prompt: ~500 tokens
- User input: ~50 tokens
- Tool results: ~200 tokens per tool call
- Output: ~300 tokens
- **Total: ~1,500 tokens per request**

**At 100 requests/day:**
- 150,000 tokens/day
- ~$2-3/day
- ~$60-90/month per user

**Optimization strategies:**
1. Cache common foods in Redis
2. Use cheaper model (GPT-3.5) for simple queries
3. Implement client-side pre-filtering
4. Batch similar requests

## Next Steps

After parseFood is stable:

1. **Test with real users** for 1-2 weeks
2. **Collect correction data** to improve accuracy
3. **Add more foods** to database
4. **Fine-tune prompts** based on patterns
5. **Implement meal plan generation** using same tools
6. **Add recipe suggestions** feature
7. **Integrate barcode scanning** (future)
8. **Add voice input** with STT (future)

## Troubleshooting

See `backend/db/README.md` for database setup issues.

**Common issues:**

1. **"Database not initialized"**
   - Call `nutritionTools.initializeDb(pool)` on startup

2. **"OPENAI_API_KEY not set"**
   - Add to `.env` file

3. **429 Too Many Requests**
   - Check OpenAI rate limits
   - Verify quota tracking is working

4. **Poor accuracy**
   - Check LLM logs for tool call patterns
   - Refine system prompt
   - Add more foods to database

5. **Slow responses**
   - Optimize database queries
   - Cache common foods
   - Consider using streaming responses
