# QatarMatch AI MVP

A working Next.js MVP for QatarMatch AI.

## What it does

- Connects to Supabase
- Fetches rows from a `properties` table
- Lets users type natural language searches
- Parses simple property intent from text
- Filters and ranks matches
- Shows the top ranked properties with explanations

## Supabase table expected

Table name: `properties`

Columns:
- id
- title
- area
- price
- bedrooms
- bathrooms
- furnished
- lat
- lng
- description
- near_schools

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your Supabase details into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Then open:

```text
http://localhost:3000
```

## Example searches

- 2-bed in Lusail under 9k near schools furnished
- 2-bed in Lusail under 8500
- family apartment in Lusail near schools
- 1-bed in Lusail under 7k
