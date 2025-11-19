# Nutrition Database Setup

This guide explains how to set up the PostgreSQL database for the nutrition AI service.

## Prerequisites

- PostgreSQL 14+ installed
- Node.js 18+ with npm
- OpenAI API key

## Installation Steps

### 1. Install Dependencies

```bash
npm install pg openai
npm install --save-dev @types/pg
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE coach_nutrition;

# Connect to the new database
\c coach_nutrition
```

### 3. Run Schema Migration

```bash
psql -U postgres -d coach_nutrition -f backend/db/schema.sql
```

### 4. Seed Initial Data

```bash
psql -U postgres -d coach_nutrition -f backend/db/seed.sql
```

### 5. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/coach_nutrition

# OpenAI
OPENAI_API_KEY=sk-...your-key-here...
OPENAI_MODEL=gpt-4-turbo-preview

# Optional: Rate Limits
DAILY_PARSE_LIMIT=100
DAILY_PLAN_GENERATION_LIMIT=10
```

## Database Schema

### Tables

**nutrition_generic_foods**
- Generic foods from USDA (apples, chicken breast, etc.)
- ~50 items seeded

**nutrition_brands**
- Restaurant brands (Subway, McDonald's, Chipotle, Starbucks)
- 4 brands seeded

**nutrition_brand_items**
- Specific menu items from brands
- ~20 items seeded

**user_ai_quota**
- Track daily AI usage per user
- Auto-resets at midnight

## Testing the Setup

### 1. Test Database Connection

```bash
psql -U postgres -d coach_nutrition -c "SELECT COUNT(*) FROM nutrition_generic_foods;"
```

Expected output: ~50 rows

### 2. Test Nutrition Tools

Create a test script `test-tools.ts`:

```typescript
import { Pool } from 'pg';
import * as tools from './backend/nutritionTools';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

tools.initializeDb(pool);

async function test() {
  // Test generic food search
  const apples = await tools.searchGenericFood('apple');
  console.log('Apples:', apples);
  
  // Test branded item search
  const subway = await tools.searchBrandedItem('Italian', 'Subway');
  console.log('Subway items:', subway);
  
  await pool.end();
}

test();
```

Run: `npx tsx test-tools.ts`

### 3. Test parseFood API

```bash
curl -X POST http://localhost:3000/api/nutrition/parse-food \
  -H "Content-Type: application/json" \
  -d '{"text": "1 apple", "locale": "en-US"}'
```

Expected response:
```json
{
  "id": "parsed-...",
  "name": "Apple, raw, with skin",
  "quantity": 1,
  "unit": "piece",
  "calories": 95,
  "proteinGrams": 0.5,
  "carbsGrams": 25,
  "fatsGrams": 0.3,
  "sourceType": "search",
  "userAdjusted": false,
  "dataSource": "official",
  "aiExplanation": {
    "reasoning": "...",
    "sources": [{
      "label": "USDA FoodData Central",
      "url": "https://fdc.nal.usda.gov/"
    }],
    "confidence": "high"
  }
}
```

## Adding More Foods

### Generic Foods

```sql
INSERT INTO nutrition_generic_foods 
  (name, locale, default_unit, grams_per_unit, 
   calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g,
   source_label, source_url, is_official)
VALUES
  ('Your food name', 'en-US', 'g', 1.0,
   <calories>, <protein>, <carbs>, <fats>,
   'Source', 'URL', TRUE);
```

### Branded Items

```sql
-- First, get the brand ID
SELECT id FROM nutrition_brands WHERE name = 'Subway';

-- Then insert the item
INSERT INTO nutrition_brand_items
  (brand_id, name, locale, default_unit, grams_per_unit,
   calories_per_unit, protein_per_unit, carbs_per_unit, fats_per_unit,
   source_label, source_url, is_official)
VALUES
  (1, 'Item name', 'en-US', 'serving', 230,
   410, 19, 45, 16,
   'Source', 'URL', TRUE);
```

## Maintenance

### Reset User Quotas

Quotas auto-reset at midnight, but you can manually reset:

```sql
DELETE FROM user_ai_quota WHERE reset_at < NOW();
```

### View Usage Stats

```sql
SELECT 
  user_id,
  daily_food_parses_used,
  daily_plan_generations_used,
  reset_at
FROM user_ai_quota
ORDER BY daily_food_parses_used DESC;
```

### Update Nutrition Data

```sql
UPDATE nutrition_generic_foods
SET 
  calories_per_100g = <new_value>,
  updated_at = NOW()
WHERE id = <food_id>;
```

## Troubleshooting

### Error: "Database not initialized"

Make sure to call `nutritionTools.initializeDb(pool)` before using any tools.

### Error: "OPENAI_API_KEY not set"

Add your OpenAI API key to `.env` file.

### Error: "relation does not exist"

Run the schema migration:
```bash
psql -U postgres -d coach_nutrition -f backend/db/schema.sql
```

### Slow Queries

Add indexes if needed:
```sql
CREATE INDEX IF NOT EXISTS idx_generic_foods_name_trgm 
  ON nutrition_generic_foods USING gin(name gin_trgm_ops);
```

## Production Considerations

1. **Connection Pooling**: Use pg-pool with appropriate limits
2. **Caching**: Cache frequently accessed foods in Redis
3. **Rate Limiting**: Implement per-user rate limits at API gateway
4. **Monitoring**: Log all AI calls and track quota usage
5. **Backups**: Regular database backups
6. **Security**: Use connection string secrets, not plaintext
