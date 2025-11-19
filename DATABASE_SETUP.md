# Database Setup Instructions

## Prerequisites
- PostgreSQL 17 is installed at: `C:\Program Files\PostgreSQL\17\bin`
- PostgreSQL service is running

## Step 1: Set PostgreSQL password (if needed)

You'll need to know your PostgreSQL `postgres` user password. If you don't remember it:

1. Open **pgAdmin** (installed with PostgreSQL)
2. Or reset the password using Windows authentication
3. Or check your PostgreSQL installation notes

## Step 2: Create Database

Open PowerShell and run:

```powershell
# Add PostgreSQL to path for this session
$env:Path += ";C:\Program Files\PostgreSQL\17\bin"

# Set password (replace 'your-password' with actual password)
$env:PGPASSWORD = "your-password"

# Create database
psql -U postgres -c "CREATE DATABASE coach_nutrition;"

# Verify database was created
psql -U postgres -c "\l" | Select-String "coach_nutrition"
```

## Step 3: Run Schema Migration

```powershell
# Still in PowerShell with path and password set from above
psql -U postgres -d coach_nutrition -f backend/db/schema.sql
```

Expected output: Multiple `CREATE TABLE` messages

## Step 4: Seed Data

```powershell
psql -U postgres -d coach_nutrition -f backend/db/seed.sql
```

Expected output: Multiple `INSERT` messages

## Step 5: Verify Setup

```powershell
# Check that tables exist
psql -U postgres -d coach_nutrition -c "\dt"

# Check row counts
psql -U postgres -d coach_nutrition -c "SELECT COUNT(*) FROM nutrition_generic_foods;"
# Expected: ~45 rows

psql -U postgres -d coach_nutrition -c "SELECT COUNT(*) FROM nutrition_brand_items;"
# Expected: ~20 rows
```

## Step 6: Update .env File

Update the `.env` file in the project root with your actual credentials:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/coach_nutrition
OPENAI_API_KEY=sk-your-actual-openai-key-here
USE_REAL_AI=true
```

## Alternative: Using Docker

If you prefer Docker instead of local PostgreSQL:

```powershell
# Run PostgreSQL in Docker
docker run --name coach-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=coach_nutrition -p 5432:5432 -d postgres:17

# Then use this DATABASE_URL in .env:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coach_nutrition

# Run migrations
docker exec -i coach-postgres psql -U postgres -d coach_nutrition < backend/db/schema.sql
docker exec -i coach-postgres psql -U postgres -d coach_nutrition < backend/db/seed.sql
```

## Troubleshooting

### "password authentication failed"
- Check your PostgreSQL password in pgAdmin
- Or use `psql -U postgres` and enter password when prompted

### "database already exists"
- That's fine! Just run the schema and seed scripts

### "relation already exists"
- Drop and recreate: `psql -U postgres -c "DROP DATABASE coach_nutrition;" then recreate

### "psql: command not found"
- Add to path: `$env:Path += ";C:\Program Files\PostgreSQL\17\bin"`
- Or use full path: `& "C:\Program Files\PostgreSQL\17\bin\psql.exe"`

## Next Steps

Once database is set up, continue with testing:
1. Run contract tests: `npm run test:contracts`
2. Start dev server: `npm run dev`
3. Test parseFood endpoint manually
