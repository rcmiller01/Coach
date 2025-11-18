# Contract Hardening & Error Handling

This document describes the contract validation system and error handling strategy for the Nutrition API.

## Philosophy

> "Until the stubs are contract-perfect, wiring a real LLM just means debugging two things at once."

We validate contracts BEFORE implementing real AI to ensure type safety and clear error semantics across the frontend/backend boundary.

## Contract Tests

### Running Tests

```bash
npm run test:contracts
```

This runs `tests/contractTests.ts` which validates:

1. **Type shapes match** between frontend and backend
2. **Required fields are present** (no unexpected nulls)
3. **Enums have valid values** (meal types, confidence levels, etc.)
4. **AI explanations are consistent** (fully present or fully absent, not half-populated)
5. **Error responses follow standard shape**

### Test Coverage

The contract tests cover:

- **parseFood()** - Simple, multi-item, and ambiguous queries
  - "1 apple" → should have valid nutrition data
  - "2 eggs and a slice of toast" → multi-item parsing
  - "my usual from Subway" → ambiguous, should have low confidence
- **generateMealPlanForWeek()** - Should return 7-day plan
- **fetchDayLog()** - Should return valid day log structure
- **Error responses** - Should have code, message, and retryable flag

### Edge Cases Tested

1. **Empty responses** - Empty week plan, empty day log
2. **Missing optional fields** - AI explanation may be absent
3. **User context** - Location data (city, zipCode) for personalization
4. **Confidence levels** - Must be 'low', 'medium', or 'high'
5. **Data sources** - Must be 'official' or 'estimated'

## Error Handling

### Error Response Shape

All API errors follow this standard shape:

```typescript
interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    retryable: boolean;
    details?: Record<string, unknown>;
  };
}
```

### Error Codes

| Code | Description | Retryable | User Action |
|------|-------------|-----------|-------------|
| `AI_TIMEOUT` | AI service took too long | ✅ Yes | Show "Try again" button |
| `AI_QUOTA_EXCEEDED` | Rate limit reached | ✅ Yes | Show retry or manual entry |
| `AI_PARSE_FAILED` | Could not parse input | ❌ No | Suggest manual entry |
| `NETWORK_ERROR` | Network connection issue | ✅ Yes | Show "Try again" button |
| `VALIDATION_ERROR` | Invalid input data | ❌ No | Show specific field errors |
| `NOT_FOUND` | Resource not found | ❌ No | Show error message |
| `UNKNOWN_ERROR` | Unexpected error | ✅ Yes | Show generic retry |

### Frontend Error Handling

Components use the `NutritionApiError` class to handle errors:

```typescript
try {
  const food = await parseFood(description, userContext);
  setResult(food);
} catch (err) {
  if (err instanceof NutritionApiError) {
    setError({
      message: err.message,
      retryable: err.retryable,
    });
  } else {
    setError({
      message: 'An unexpected error occurred.',
      retryable: true,
    });
  }
}
```

### Error UX Patterns

1. **Toast notifications** (future) - Brief error messages
2. **Inline error displays** - Show error in context
3. **"Try again" buttons** - Only for retryable errors
4. **Fallback to manual entry** - For non-retryable parse failures

## Data Provenance

### Official vs Estimated Data

All food items have a `dataSource` field:

- **`official`** - From brand menus or verified databases (USDA, MyFitnessPal, etc.)
  - Badge: Green "Official"
  - High confidence
  - Example: "Subway 6-inch Italian BMT"
  
- **`estimated`** - Calculated from generic ingredients
  - Badge: Amber "Estimate"
  - Variable confidence
  - Example: "Homemade chicken salad"

### Data Source Badges

Badges appear in:

1. **FoodSearchPanel** - When displaying AI-parsed results
2. **FoodLogList** - For all logged items
3. **MealPlanEditor** - For planned foods (future)

### AI Explanation

For AI-parsed foods, the `aiExplanation` field provides transparency:

```typescript
interface AiFoodExplanation {
  reasoning: string; // How the AI determined the values
  sources: Array<{
    label: string; // e.g., "USDA FoodData Central"
    url?: string; // Optional link to source
  }>;
  confidence: 'low' | 'medium' | 'high';
}
```

**Example:**

```json
{
  "reasoning": "Official Subway US menu data (2025-01) for 6-inch Italian BMT on 9-grain wheat, no cheese.",
  "sources": [
    {
      "label": "Subway US Nutrition Calculator",
      "url": "https://www.subway.com/en-US/MenuNutrition/Nutrition"
    }
  ],
  "confidence": "high"
}
```

## User Correction Tracking

### Purpose

Track when users edit AI-suggested values to:

1. **Build feedback loop** for AI accuracy improvement
2. **Audit AI performance** over time
3. **Distinguish user preferences** from AI errors

### Implementation

When a user edits any macro value:

1. **Store original values** (if not already stored):
   ```typescript
   originalCalories?: number;
   originalProteinGrams?: number;
   originalCarbsGrams?: number;
   originalFatsGrams?: number;
   ```

2. **Mark as adjusted**:
   ```typescript
   userAdjusted: boolean; // Set to true
   ```

3. **Update the actual value**:
   ```typescript
   calories = newValue; // User's correction
   ```

### Badge Display

Items with `userAdjusted: true` show a purple "Edited" badge in the UI.

### Future: Feedback Export

Later we can export user corrections for analysis:

```csv
food_id,original_calories,user_calories,data_source,confidence,timestamp
abc123,200,250,estimated,low,2025-01-13T10:30:00Z
```

## Implementation Status

### ✅ Completed (Tasks 1-3)

- [x] Contract test harness with 353 passing tests
- [x] Error response types (`ErrorCode`, `ApiErrorResponse`, `NutritionApiError`)
- [x] User correction tracking (`userAdjusted`, `original*` fields)
- [x] Data source badges (`dataSource: 'official' | 'estimated'`)
- [x] Error UI with retry buttons for retryable errors

### ⏳ In Progress (Task 4)

- [ ] Settings toggle for highlighting estimated items
- [ ] More comprehensive error scenarios in UI

### 🔜 Next Steps (Task 5)

- [ ] Real `parseFood()` implementation
  - [ ] Small nutrition database (in-memory or SQLite)
  - [ ] MCP server with search/lookup/calculate tools
  - [ ] LLM integration for text parsing
  - [ ] Test with real usage for 1-2 weeks

## Testing Philosophy

1. **Validate stubs first** - Ensure contracts are perfect
2. **One vertical slice** - Implement `parseFood()` before meal planning
3. **Real usage testing** - Use the app ourselves to find issues
4. **Iterate on accuracy** - Use correction data to improve AI

## Next Real AI Feature: parseFood()

Why `parseFood()` is the best first vertical slice:

1. **Biggest user pain point** - Manual entry is tedious
2. **Easier to test in isolation** - Single input → single output
3. **Foundation for meal planning** - Learn AI patterns first
4. **User corrections provide feedback** - Improve accuracy over time

### parseFood() Implementation Plan

1. **Build small nutrition DB**:
   - Generic foods (USDA FoodData Central subset)
   - Popular branded items (Subway, Chipotle, Starbucks, etc.)
   - SQLite or in-memory for v1

2. **Create MCP server** with tools:
   - `search_generic_food(query, locale)` → generic items
   - `search_branded_item(query, brand, locale)` → brand items
   - `get_nutrition_by_id(id)` → detailed nutrition data
   - `calculate_recipe_macros(ingredients[])` → sum ingredients

3. **Implement real parseFood()**:
   - LLM parses text → candidate items + portions
   - MCP tools look up in database
   - Calculate macros deterministically (no LLM hallucination)
   - Return `LoggedFoodItem` with full explanation

4. **Leave meal planning stubbed** until parseFood is proven

## Resources

- **Contract Tests**: `tests/contractTests.ts`
- **API Client**: `src/api/nutritionApiClient.v2.ts`
- **Error Types**: `src/features/nutrition/nutritionTypes.ts`
- **UI Components**:
  - `src/features/meals/FoodSearchPanel.tsx` - AI search with error handling
  - `src/features/meals/FoodLogList.tsx` - Badges and correction tracking
