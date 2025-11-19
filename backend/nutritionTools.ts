/**
 * Nutrition Tools - MCP-style food database interface
 * 
 * Pure database operations for food lookup and macro calculation.
 * No LLM calls here - these are the tools that the LLM will use.
 * 
 * Functions:
 * - searchGenericFood: Find foods in USDA database
 * - searchBrandedItem: Find branded restaurant items
 * - getNutritionById: Get specific food by ID
 * - calculateRecipeMacros: Compute macros from ingredient list
 */

import type { Pool, QueryResult } from 'pg';

// ============================================================================
// TYPES
// ============================================================================

export interface GenericFood {
  id: number;
  name: string;
  locale: string;
  defaultUnit: string;
  gramsPerUnit: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  sourceLabel: string;
  sourceUrl?: string;
  isOfficial: boolean;
}

export interface Brand {
  id: number;
  name: string;
  locale: string;
  sourceLabel: string;
  sourceUrl?: string;
}

export interface BrandItem {
  id: number;
  brandId: number;
  brandName: string;
  name: string;
  locale: string;
  defaultUnit: string;
  gramsPerUnit?: number;
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatsPerUnit: number;
  sourceLabel: string;
  sourceUrl?: string;
  isOfficial: boolean;
}

export interface RecipeIngredient {
  foodId: number;
  grams: number;
}

export interface RecipeMacros {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  provenance: 'estimated';
  sources: Array<{ label: string; url?: string }>;
}

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

// In production, initialize from environment variables
let dbPool: Pool | null = null;

export function initializeDb(pool: Pool): void {
  dbPool = pool;
}

function getDb(): Pool {
  if (!dbPool) {
    throw new Error('Database not initialized. Call initializeDb(pool) first.');
  }
  return dbPool;
}

// ============================================================================
// GENERIC FOOD SEARCH
// ============================================================================

/**
 * Search for generic foods by name
 * Uses fuzzy matching (ILIKE) for flexible search
 * 
 * @param query - Search term (e.g., "apple", "chicken breast")
 * @param locale - Locale for localization (default: 'en-US')
 * @param limit - Maximum results to return (default: 10)
 * @returns Array of matching generic foods
 */
export async function searchGenericFood(
  query: string,
  locale: string = 'en-US',
  limit: number = 10
): Promise<GenericFood[]> {
  const db = getDb();
  
  const result: QueryResult = await db.query(
    `SELECT 
      id, name, locale, default_unit as "defaultUnit", grams_per_unit as "gramsPerUnit",
      calories_per_100g as "caloriesPer100g", protein_per_100g as "proteinPer100g",
      carbs_per_100g as "carbsPer100g", fats_per_100g as "fatsPer100g",
      source_label as "sourceLabel", source_url as "sourceUrl", is_official as "isOfficial"
    FROM nutrition_generic_foods
    WHERE name ILIKE $1 AND locale = $2
    ORDER BY 
      CASE 
        WHEN name ILIKE $3 THEN 1  -- Exact match first
        WHEN name ILIKE $4 THEN 2  -- Starts with query
        ELSE 3                      -- Contains query
      END,
      name
    LIMIT $5`,
    [`%${query}%`, locale, query, `${query}%`, limit]
  );
  
  return result.rows as GenericFood[];
}

/**
 * Get a specific generic food by ID
 */
export async function getGenericFoodById(id: number): Promise<GenericFood | null> {
  const db = getDb();
  
  const result: QueryResult = await db.query(
    `SELECT 
      id, name, locale, default_unit as "defaultUnit", grams_per_unit as "gramsPerUnit",
      calories_per_100g as "caloriesPer100g", protein_per_100g as "proteinPer100g",
      carbs_per_100g as "carbsPer100g", fats_per_100g as "fatsPer100g",
      source_label as "sourceLabel", source_url as "sourceUrl", is_official as "isOfficial"
    FROM nutrition_generic_foods
    WHERE id = $1`,
    [id]
  );
  
  return result.rows[0] || null;
}

// ============================================================================
// BRANDED ITEM SEARCH
// ============================================================================

/**
 * Search for branded food items
 * 
 * @param query - Search term (e.g., "Big Mac", "Italian BMT")
 * @param brand - Optional brand name to filter by (e.g., "McDonald's", "Subway")
 * @param locale - Locale for localization (default: 'en-US')
 * @param limit - Maximum results to return (default: 10)
 * @returns Array of matching branded items
 */
export async function searchBrandedItem(
  query: string,
  brand?: string,
  locale: string = 'en-US',
  limit: number = 10
): Promise<BrandItem[]> {
  const db = getDb();
  
  let sql = `SELECT 
    bi.id, bi.brand_id as "brandId", b.name as "brandName", bi.name, bi.locale,
    bi.default_unit as "defaultUnit", bi.grams_per_unit as "gramsPerUnit",
    bi.calories_per_unit as "caloriesPerUnit", bi.protein_per_unit as "proteinPerUnit",
    bi.carbs_per_unit as "carbsPerUnit", bi.fats_per_unit as "fatsPerUnit",
    bi.source_label as "sourceLabel", bi.source_url as "sourceUrl", bi.is_official as "isOfficial"
  FROM nutrition_brand_items bi
  JOIN nutrition_brands b ON bi.brand_id = b.id
  WHERE bi.name ILIKE $1 AND bi.locale = $2`;
  
  const params: any[] = [`%${query}%`, locale];
  
  if (brand) {
    sql += ` AND b.name ILIKE $3`;
    params.push(`%${brand}%`);
  }
  
  sql += ` ORDER BY 
    CASE 
      WHEN bi.name ILIKE $${params.length + 1} THEN 1  -- Exact match first
      WHEN bi.name ILIKE $${params.length + 2} THEN 2  -- Starts with query
      ELSE 3                                            -- Contains query
    END,
    bi.name
  LIMIT $${params.length + 3}`;
  
  params.push(query, `${query}%`, limit);
  
  const result: QueryResult = await db.query(sql, params);
  
  return result.rows as BrandItem[];
}

/**
 * Get a specific branded item by ID
 */
export async function getBrandItemById(id: number): Promise<BrandItem | null> {
  const db = getDb();
  
  const result: QueryResult = await db.query(
    `SELECT 
      bi.id, bi.brand_id as "brandId", b.name as "brandName", bi.name, bi.locale,
      bi.default_unit as "defaultUnit", bi.grams_per_unit as "gramsPerUnit",
      bi.calories_per_unit as "caloriesPerUnit", bi.protein_per_unit as "proteinPerUnit",
      bi.carbs_per_unit as "carbsPerUnit", bi.fats_per_unit as "fatsPerUnit",
      bi.source_label as "sourceLabel", bi.source_url as "sourceUrl", bi.is_official as "isOfficial"
    FROM nutrition_brand_items bi
    JOIN nutrition_brands b ON bi.brand_id = b.id
    WHERE bi.id = $1`,
    [id]
  );
  
  return result.rows[0] || null;
}

// ============================================================================
// UNIFIED LOOKUP (by ID)
// ============================================================================

/**
 * Get nutrition data by ID (works for both generic and branded items)
 * Attempts to find in brand items first, then falls back to generic foods
 * 
 * @param id - Food ID (numeric string like "brand:123" or "generic:456")
 * @returns Food data or null if not found
 */
export async function getNutritionById(id: string): Promise<GenericFood | BrandItem | null> {
  // Parse ID format: "brand:123" or "generic:456"
  const [type, numId] = id.split(':');
  const numericId = parseInt(numId, 10);
  
  if (isNaN(numericId)) {
    throw new Error(`Invalid food ID format: ${id}. Expected "brand:123" or "generic:456"`);
  }
  
  if (type === 'brand') {
    return await getBrandItemById(numericId);
  } else if (type === 'generic') {
    return await getGenericFoodById(numericId);
  } else {
    throw new Error(`Invalid food type: ${type}. Expected "brand" or "generic"`);
  }
}

// ============================================================================
// RECIPE MACRO CALCULATION
// ============================================================================

/**
 * Calculate total macros from a list of ingredients
 * Used for composite foods (e.g., "turkey sandwich with mayo and lettuce")
 * 
 * @param ingredients - Array of {foodId, grams} pairs
 * @returns Combined macros with sources
 */
export async function calculateRecipeMacros(
  ingredients: RecipeIngredient[]
): Promise<RecipeMacros> {
  const db = getDb();
  
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFats = 0;
  const sources: Array<{ label: string; url?: string }> = [];
  const seenSources = new Set<string>();
  
  for (const ingredient of ingredients) {
    const food = await getGenericFoodById(ingredient.foodId);
    
    if (!food) {
      throw new Error(`Food not found: ${ingredient.foodId}`);
    }
    
    // Calculate macros for this ingredient
    const gramsToUse = ingredient.grams;
    const factor = gramsToUse / 100; // Convert per-100g to actual grams
    
    totalCalories += food.caloriesPer100g * factor;
    totalProtein += food.proteinPer100g * factor;
    totalCarbs += food.carbsPer100g * factor;
    totalFats += food.fatsPer100g * factor;
    
    // Track unique sources
    if (!seenSources.has(food.sourceLabel)) {
      sources.push({
        label: food.sourceLabel,
        url: food.sourceUrl,
      });
      seenSources.add(food.sourceLabel);
    }
  }
  
  return {
    calories: Math.round(totalCalories),
    proteinGrams: Math.round(totalProtein * 10) / 10, // Round to 1 decimal
    carbsGrams: Math.round(totalCarbs * 10) / 10,
    fatsGrams: Math.round(totalFats * 10) / 10,
    provenance: 'estimated',
    sources,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert macros from per-100g to per-unit
 */
export function convertMacrosPer100gToUnit(
  food: GenericFood,
  quantity: number
): {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
} {
  const totalGrams = quantity * food.gramsPerUnit;
  const factor = totalGrams / 100;
  
  return {
    calories: Math.round(food.caloriesPer100g * factor),
    proteinGrams: Math.round(food.proteinPer100g * factor * 10) / 10,
    carbsGrams: Math.round(food.carbsPer100g * factor * 10) / 10,
    fatsGrams: Math.round(food.fatsPer100g * factor * 10) / 10,
  };
}

/**
 * Convert macros from per-unit to actual quantity
 */
export function convertMacrosPerUnitToQuantity(
  item: BrandItem,
  quantity: number
): {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
} {
  return {
    calories: Math.round(item.caloriesPerUnit * quantity),
    proteinGrams: Math.round(item.proteinPerUnit * quantity * 10) / 10,
    carbsGrams: Math.round(item.carbsPerUnit * quantity * 10) / 10,
    fatsGrams: Math.round(item.fatsPerUnit * quantity * 10) / 10,
  };
}
