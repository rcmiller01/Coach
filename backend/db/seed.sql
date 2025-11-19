-- Seed data for nutrition database
-- Mix of USDA generic foods and popular branded items

-- ============================================================================
-- GENERIC FOODS (USDA-based)
-- ============================================================================

INSERT INTO nutrition_generic_foods (name, locale, default_unit, grams_per_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g, source_label, source_url, is_official) VALUES
-- Fruits
('Apple, raw, with skin', 'en-US', 'g', 1.0, 52, 0.3, 14, 0.2, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Banana, raw', 'en-US', 'g', 1.0, 89, 1.1, 23, 0.3, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Orange, raw', 'en-US', 'g', 1.0, 47, 0.9, 12, 0.1, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Strawberries, raw', 'en-US', 'g', 1.0, 32, 0.7, 8, 0.3, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Blueberries, raw', 'en-US', 'g', 1.0, 57, 0.7, 14, 0.3, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),

-- Vegetables
('Broccoli, raw', 'en-US', 'g', 1.0, 34, 2.8, 7, 0.4, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Carrots, raw', 'en-US', 'g', 1.0, 41, 0.9, 10, 0.2, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Spinach, raw', 'en-US', 'g', 1.0, 23, 2.9, 3.6, 0.4, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Tomato, raw', 'en-US', 'g', 1.0, 18, 0.9, 3.9, 0.2, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Lettuce, romaine, raw', 'en-US', 'g', 1.0, 17, 1.2, 3.3, 0.3, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),

-- Proteins
('Chicken breast, skinless, cooked, roasted', 'en-US', 'g', 1.0, 165, 31, 0, 3.6, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Chicken thigh, skinless, cooked', 'en-US', 'g', 1.0, 209, 26, 0, 11, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Ground beef, 85% lean, cooked', 'en-US', 'g', 1.0, 250, 26, 0, 16, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Salmon, Atlantic, cooked', 'en-US', 'g', 1.0, 206, 23, 0, 12, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Egg, whole, cooked, scrambled', 'en-US', 'g', 1.0, 149, 10, 1.3, 11, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Turkey breast, cooked, roasted', 'en-US', 'g', 1.0, 135, 30, 0, 0.7, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Tuna, canned in water', 'en-US', 'g', 1.0, 116, 26, 0, 0.8, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),

-- Dairy
('Milk, whole, 3.25% fat', 'en-US', 'ml', 1.0, 61, 3.2, 4.8, 3.3, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Yogurt, plain, whole milk', 'en-US', 'g', 1.0, 61, 3.5, 4.7, 3.3, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Greek yogurt, plain, nonfat', 'en-US', 'g', 1.0, 59, 10, 3.6, 0.4, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Cheddar cheese', 'en-US', 'g', 1.0, 403, 25, 1.3, 33, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Mozzarella cheese, part skim', 'en-US', 'g', 1.0, 254, 24, 2.8, 16, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),

-- Grains & Carbs
('Rice, white, cooked', 'en-US', 'g', 1.0, 130, 2.7, 28, 0.3, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Rice, brown, cooked', 'en-US', 'g', 1.0, 112, 2.6, 24, 0.9, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Quinoa, cooked', 'en-US', 'g', 1.0, 120, 4.4, 21, 1.9, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Oats, rolled, dry', 'en-US', 'g', 1.0, 389, 17, 66, 6.9, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Bread, whole wheat', 'en-US', 'g', 1.0, 247, 13, 41, 3.4, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Bread, white', 'en-US', 'g', 1.0, 265, 9, 49, 3.2, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Pasta, cooked', 'en-US', 'g', 1.0, 131, 5, 25, 1.1, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Sweet potato, baked', 'en-US', 'g', 1.0, 90, 2, 21, 0.2, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Potato, baked, with skin', 'en-US', 'g', 1.0, 93, 2.5, 21, 0.1, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),

-- Nuts & Seeds
('Almonds', 'en-US', 'g', 1.0, 579, 21, 22, 50, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Peanut butter, smooth', 'en-US', 'g', 1.0, 588, 25, 20, 50, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Walnuts', 'en-US', 'g', 1.0, 654, 15, 14, 65, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Chia seeds', 'en-US', 'g', 1.0, 486, 17, 42, 31, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),

-- Legumes
('Black beans, cooked', 'en-US', 'g', 1.0, 132, 8.9, 24, 0.5, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Chickpeas, cooked', 'en-US', 'g', 1.0, 164, 8.9, 27, 2.6, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Lentils, cooked', 'en-US', 'g', 1.0, 116, 9, 20, 0.4, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),

-- Fats & Oils
('Olive oil', 'en-US', 'ml', 1.0, 884, 0, 0, 100, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Butter', 'en-US', 'g', 1.0, 717, 0.9, 0.1, 81, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Avocado, raw', 'en-US', 'g', 1.0, 160, 2, 8.5, 15, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),

-- Condiments & Common Additions
('Mayonnaise', 'en-US', 'g', 1.0, 680, 0.9, 0.6, 75, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Ketchup', 'en-US', 'g', 1.0, 101, 1, 27, 0.1, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE),
('Mustard', 'en-US', 'g', 1.0, 60, 3.7, 5.3, 3.3, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', TRUE);

-- ============================================================================
-- BRANDS
-- ============================================================================

INSERT INTO nutrition_brands (name, locale, source_label, source_url) VALUES
('Subway', 'en-US', 'Subway US Nutrition Calculator 2025', 'https://www.subway.com/en-US/MenuNutrition/Nutrition'),
('McDonald''s', 'en-US', 'McDonald''s USA Nutrition Facts 2025', 'https://www.mcdonalds.com/us/en-us/about-our-food/nutrition-calculator.html'),
('Chipotle', 'en-US', 'Chipotle Nutrition Calculator 2025', 'https://www.chipotle.com/nutrition-calculator'),
('Starbucks', 'en-US', 'Starbucks Menu & Nutrition 2025', 'https://www.starbucks.com/menu');

-- ============================================================================
-- BRANDED ITEMS - Subway
-- ============================================================================

INSERT INTO nutrition_brand_items (brand_id, name, locale, default_unit, grams_per_unit, calories_per_unit, protein_per_unit, carbs_per_unit, fats_per_unit, source_label, source_url, is_official) VALUES
-- Subway sandwiches (6-inch on 9-grain wheat)
(1, 'Italian B.M.T.® 6-inch on 9-Grain Wheat', 'en-US', 'serving', 230, 410, 19, 45, 16, 'Subway US Nutrition Calculator 2025', 'https://www.subway.com/en-US/MenuNutrition/Nutrition', TRUE),
(1, 'Turkey Breast 6-inch on 9-Grain Wheat', 'en-US', 'serving', 223, 280, 18, 46, 3.5, 'Subway US Nutrition Calculator 2025', 'https://www.subway.com/en-US/MenuNutrition/Nutrition', TRUE),
(1, 'Chicken & Bacon Ranch Melt 6-inch on 9-Grain Wheat', 'en-US', 'serving', 269, 570, 36, 47, 26, 'Subway US Nutrition Calculator 2025', 'https://www.subway.com/en-US/MenuNutrition/Nutrition', TRUE),
(1, 'Veggie Delite® 6-inch on 9-Grain Wheat', 'en-US', 'serving', 166, 230, 8, 44, 2.5, 'Subway US Nutrition Calculator 2025', 'https://www.subway.com/en-US/MenuNutrition/Nutrition', TRUE),
(1, 'Spicy Italian 6-inch on 9-Grain Wheat', 'en-US', 'serving', 220, 480, 19, 45, 24, 'Subway US Nutrition Calculator 2025', 'https://www.subway.com/en-US/MenuNutrition/Nutrition', TRUE),
(1, 'Tuna 6-inch on 9-Grain Wheat', 'en-US', 'serving', 245, 470, 22, 45, 22, 'Subway US Nutrition Calculator 2025', 'https://www.subway.com/en-US/MenuNutrition/Nutrition', TRUE);

-- ============================================================================
-- BRANDED ITEMS - McDonald's
-- ============================================================================

INSERT INTO nutrition_brand_items (brand_id, name, locale, default_unit, grams_per_unit, calories_per_unit, protein_per_unit, carbs_per_unit, fats_per_unit, source_label, source_url, is_official) VALUES
-- McDonald's burgers and sandwiches
(2, 'Big Mac®', 'en-US', 'serving', 219, 550, 25, 45, 30, 'McDonald''s USA Nutrition Facts 2025', 'https://www.mcdonalds.com/us/en-us/about-our-food/nutrition-calculator.html', TRUE),
(2, 'Quarter Pounder® with Cheese', 'en-US', 'serving', 194, 520, 30, 42, 26, 'McDonald''s USA Nutrition Facts 2025', 'https://www.mcdonalds.com/us/en-us/about-our-food/nutrition-calculator.html', TRUE),
(2, 'McChicken®', 'en-US', 'serving', 147, 400, 14, 39, 21, 'McDonald''s USA Nutrition Facts 2025', 'https://www.mcdonalds.com/us/en-us/about-our-food/nutrition-calculator.html', TRUE),
(2, '10 piece Chicken McNuggets®', 'en-US', 'serving', 171, 420, 24, 26, 24, 'McDonald''s USA Nutrition Facts 2025', 'https://www.mcdonalds.com/us/en-us/about-our-food/nutrition-calculator.html', TRUE),
(2, 'Medium French Fries', 'en-US', 'serving', 111, 320, 4, 43, 15, 'McDonald''s USA Nutrition Facts 2025', 'https://www.mcdonalds.com/us/en-us/about-our-food/nutrition-calculator.html', TRUE);

-- ============================================================================
-- BRANDED ITEMS - Chipotle
-- ============================================================================

INSERT INTO nutrition_brand_items (brand_id, name, locale, default_unit, grams_per_unit, calories_per_unit, protein_per_unit, carbs_per_unit, fats_per_unit, source_label, source_url, is_official) VALUES
-- Chipotle bowl components (approximated standard servings)
(3, 'Chicken Bowl (with rice, beans, cheese, sour cream)', 'en-US', 'serving', 500, 775, 51, 73, 30, 'Chipotle Nutrition Calculator 2025', 'https://www.chipotle.com/nutrition-calculator', TRUE),
(3, 'Steak Bowl (with rice, beans, cheese, sour cream)', 'en-US', 'serving', 500, 810, 51, 74, 32, 'Chipotle Nutrition Calculator 2025', 'https://www.chipotle.com/nutrition-calculator', TRUE),
(3, 'Veggie Bowl (with rice, beans, cheese, guacamole)', 'en-US', 'serving', 500, 710, 23, 96, 28, 'Chipotle Nutrition Calculator 2025', 'https://www.chipotle.com/nutrition-calculator', TRUE);

-- ============================================================================
-- BRANDED ITEMS - Starbucks
-- ============================================================================

INSERT INTO nutrition_brand_items (brand_id, name, locale, default_unit, grams_per_unit, calories_per_unit, protein_per_unit, carbs_per_unit, fats_per_unit, source_label, source_url, is_official) VALUES
-- Starbucks drinks and food
(4, 'Caffè Latte (Grande, 2% Milk)', 'en-US', 'serving', 473, 190, 13, 19, 7, 'Starbucks Menu & Nutrition 2025', 'https://www.starbucks.com/menu', TRUE),
(4, 'Iced Coffee (Grande, Sweetened)', 'en-US', 'serving', 473, 80, 1, 20, 0, 'Starbucks Menu & Nutrition 2025', 'https://www.starbucks.com/menu', TRUE),
(4, 'Egg & Cheddar Sandwich', 'en-US', 'serving', 113, 370, 19, 28, 18, 'Starbucks Menu & Nutrition 2025', 'https://www.starbucks.com/menu', TRUE),
(4, 'Blueberry Muffin', 'en-US', 'serving', 120, 350, 5, 58, 11, 'Starbucks Menu & Nutrition 2025', 'https://www.starbucks.com/menu', TRUE);
