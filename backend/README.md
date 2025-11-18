# Backend Stub - AI Nutrition System

This directory contains **stub implementations** for the AI-powered nutrition backend.

## 📁 Structure

```
backend/
├── NutritionAiService.ts   # Service interface + stub implementation
├── routes.ts               # REST API endpoint handlers (pseudo-code)
└── README.md              # This file
```

## 🎯 Purpose

These files define:

1. **API Contract**: The shape of requests and responses for nutrition features
2. **Service Interface**: Methods for AI meal planning and food parsing
3. **Type Safety**: Full TypeScript types matching the frontend

## ⚙️ Current State

**Status**: Stub implementations only (no real backend)

- All API calls return dummy data
- No actual LLM integration
- No database persistence
- No authentication
- No rate limiting (quota checks are stubbed)

## 🚀 What's Needed for Production

### 1. Backend Framework

Choose one:
- **Express.js** (Node.js, most popular)
- **Fastify** (Node.js, faster)
- **FastAPI** (Python, ML-friendly)

### 2. Database

Store:
- Weekly meal plans
- Daily food logs
- User profiles
- AI usage quotas

Options: PostgreSQL, MongoDB, Supabase

### 3. AI Integration

#### LLM (for text understanding)
- OpenAI GPT-4
- Anthropic Claude
- Google Gemini

Tasks:
- Parse user food descriptions
- Generate meal plans matching targets
- Explain nutrition calculations

#### MCP Nutrition Server

Create or use an MCP server that wraps:
- **USDA FoodData Central API**
- **Nutritionix API**
- **Internal food database**

The MCP server provides:
- `search_food(query)` → list of foods
- `get_nutrition(food_id)` → calories, macros, etc.

### 4. Authentication

Options:
- **JWT tokens**
- **OAuth (Google, Apple)**
- **Supabase Auth**

Protect all API routes with auth middleware.

### 5. Rate Limiting & Abuse Prevention

- Track AI usage per user
- Daily limits on plan generation (e.g., 10/day)
- Daily limits on food parsing (e.g., 50/day)
- Store quotas in database
- Reset at midnight UTC

### 6. CORS & Security

- Enable CORS for frontend domain
- Validate all inputs
- Sanitize user text before sending to LLM
- Use environment variables for API keys

## 📝 Implementation Checklist

- [ ] Set up backend framework (Express/FastAPI)
- [ ] Configure database (schema + migrations)
- [ ] Implement authentication middleware
- [ ] Create NutritionAiService with real LLM calls
- [ ] Build or connect to MCP nutrition server
- [ ] Wire up API routes (routes.ts → real handlers)
- [ ] Add rate limiting middleware
- [ ] Write tests for critical paths
- [ ] Deploy backend (Railway, Render, AWS, etc.)
- [ ] Update frontend API client with real base URL

## 🔗 Frontend Integration

The frontend already has:
- `src/api/nutritionApiClient.ts` - API client (currently stubbed)
- All UI components wired up
- Full TypeScript types

To connect:
1. Deploy backend
2. Update `API_BASE` in `nutritionApiClient.ts`
3. Remove stub implementations in client
4. Replace with real `fetch()` calls

## 🧪 Testing the Stub

Even without a real backend, you can:
- Test all UI flows
- Verify data types
- Design user experience
- Prototype features

The stub returns realistic dummy data that matches production types.

## 📚 Related Files

Frontend:
- `src/features/nutrition/NutritionPage.tsx` - Meal plan UI
- `src/features/meals/MealsPage.tsx` - Food logging UI
- `src/api/nutritionApiClient.ts` - API client (stub)

Types:
- `src/features/nutrition/nutritionTypes.ts` - Shared types

## 🤝 Contributing

When implementing the real backend:

1. Keep the same API contract (routes, request/response shapes)
2. Use the defined TypeScript types
3. Add proper error handling
4. Log important events
5. Document environment variables
6. Write integration tests

## 📖 Example: Real Express Setup

```typescript
// backend/server.ts
import express from 'express';
import cors from 'cors';
import * as nutritionRoutes from './routes';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Nutrition endpoints
app.get('/api/nutrition/plan', nutritionRoutes.getNutritionPlan);
app.post('/api/nutrition/plan/week', nutritionRoutes.generateWeeklyPlan);
app.post('/api/nutrition/plan/day', nutritionRoutes.generateDailyPlan);
app.put('/api/nutrition/plan/day/:date', nutritionRoutes.updateDayPlan);
app.post('/api/nutrition/plan/copy', nutritionRoutes.copyDayPlan);

// Meals endpoints
app.get('/api/meals/log/:date', nutritionRoutes.getDayLog);
app.put('/api/meals/log/:date', nutritionRoutes.saveDayLog);

// AI parsing
app.post('/api/nutrition/parse-food', nutritionRoutes.parseFood);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend listening on port ${PORT}`);
});
```

## ⚠️ Security Notes

**Never commit**:
- API keys (OpenAI, Nutritionix, etc.)
- Database credentials
- JWT secrets

Use `.env` file and environment variables:
```
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
JWT_SECRET=...
```
