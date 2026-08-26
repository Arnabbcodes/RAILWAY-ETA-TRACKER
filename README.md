 📍 ETA Tracker — Full Stack Project

**Chain:** HTML → CSS → JavaScript → Supabase → ETA Algorithm → Vercel API → Groq AI → AI Explanation

---

## 📂 Folder Structure

```
eta-tracker/
├── public/                 ← Frontend (served by Vercel as static files)
│   ├── index.html           HTML structure
│   ├── style.css             CSS styling
│   ├── config.js             Supabase URL/Key config
│   ├── eta.js                 ETA algorithm (pure JS logic)
│   └── app.js                 Glue code: form -> ETA -> Supabase -> API -> Groq
│
├── api/                     ← Backend (Vercel Serverless Functions)
│   └── explain.js            Calls Groq AI, returns explanation
│
├── supabase.sql              SQL to create the `trips` table in Supabase
├── vercel.json                Vercel routing config
├── package.json                Node project manifest
├── .env.example                Template for your GROQ_API_KEY
├── .gitignore
└── README.md                   (this file)
```

---

## 🔗 How The Chain Works

```
1. HTML          -> public/index.html   -> form + result UI structure
2. CSS           -> public/style.css    -> visual styling
3. JavaScript    -> public/eta.js + app.js -> form logic, DOM updates
4. Supabase      -> saves trip data, loads trip history
5. ETA Algorithm -> public/eta.js       -> distance/speed/traffic math
6. Vercel API    -> api/explain.js      -> serverless function (Node.js)
7. Groq AI       -> called INSIDE api/explain.js -> generates explanation
8. AI Explanation-> sent back to app.js -> displayed to user
```

Step-by-step at runtime:
1. User fills the form (origin, destination, distance, speed, traffic) → **HTML**
2. Page looks the way it does because of → **CSS**
3. On submit, **JavaScript** (`app.js`) takes over
4. `app.js` calls `calculateETA()` from **`eta.js`** → the **ETA Algorithm** runs instantly in the browser
5. `app.js` saves the trip into **Supabase** (table `trips`)
6. `app.js` sends the trip + ETA to **`/api/explain`**, a **Vercel serverless function**
7. Inside that function, it calls **Groq AI** (`llama-3.3-70b-versatile`) with a prompt
8. Groq returns a natural-language explanation → sent back to the browser → shown as the **AI Explanation**
9. `app.js` updates the Supabase row with that explanation and refreshes the trip history list

---

## ✅ STEP-BY-STEP SETUP (Start to End)

### STEP 1 — Get the project on your machine
Download/copy the whole `eta-tracker/` folder to your computer.

```bash
cd eta-tracker
```

### STEP 2 — Create your Supabase project
1. Go to https://supabase.com → Sign in → **New Project**
2. Wait for it to finish provisioning (~2 min)
3. Go to **SQL Editor** → **New query**
4. Paste the entire contents of `supabase.sql` → click **Run**
   - This creates the `trips` table with the right columns and public access policies.
5. Go to **Project Settings → API**
6. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (a long JWT string)

### STEP 3 — Plug Supabase credentials into the frontend
Open `public/config.js` and replace:

```js
const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_PUBLIC_KEY";
```
with your actual values from Step 2.

> ⚠️ This is safe — the anon key is meant to be public. Row Level Security policies (already set up in `supabase.sql`) control what it can actually do.

### STEP 4 — Get a Groq API key
1. Go to https://console.groq.com/keys
2. Sign in → **Create API Key**
3. Copy the key (starts with `gsk_...`)

### STEP 5 — Set up environment variables locally
```bash
cp .env.example .env
```
Open `.env` and paste your key:
```
GROQ_API_KEY=gsk_your_real_key_here
```

### STEP 6 — Install Vercel CLI (if you don't have it)
```bash
npm install -g vercel
```

### STEP 7 — Run the project locally
```bash
vercel dev
```
- First run will ask you to log in / link a project — follow the prompts (choose "Link to existing project? No" → set up a new one, any name is fine).
- It will start a local server, usually at **http://localhost:3000**

### STEP 8 — Test it
1. Open http://localhost:3000
2. Fill in the form:
   - Origin: `Andheri, Mumbai`
   - Destination: `Bandra, Mumbai`
   - Distance: `8.5`
   - Speed: `28`
   - Traffic: `Medium`
3. Click **Calculate ETA**
4. You should see:
   - An arrival time + minutes (from the **ETA Algorithm**)
   - A trip saved (check **Supabase → Table Editor → trips**)
   - An AI-generated explanation appear a moment later (from **Groq**, via the **Vercel API**)
   - The trip appear in **Trip History**

### STEP 9 — Deploy to production
```bash
vercel --prod
```
- Follow prompts to link/create the project.
- Once deployed, go to your **Vercel Dashboard → Project → Settings → Environment Variables**
- Add:
  - `GROQ_API_KEY` = your real Groq key
- Redeploy if it asks (`vercel --prod` again) so the function picks up the new env variable.

### STEP 10 — Done
Visit your live `https://your-project.vercel.app` URL — the full chain (HTML → CSS → JS → Supabase → ETA Algorithm → Vercel API → Groq AI → Explanation) is now live end-to-end.

---

## 🛠 Customizing the ETA Algorithm
Open `public/eta.js`. The core formula:

```js
baseTimeHours = distance / speed
adjustedTimeHours = baseTimeHours * trafficMultiplier
etaMinutes = adjustedTimeHours * 60
```

Traffic multipliers (edit `TRAFFIC_MULTIPLIERS` in the same file):
```js
low: 1.0    // no delay
medium: 1.3 // +30%
high: 1.7   // +70%
```

## 🛠 Customizing the AI prompt / model
Open `api/explain.js` and edit:
- The `prompt` string (what info Groq gets)
- The `model` field (Groq's currently available models — check https://console.groq.com/docs/models if `llama-3.3-70b-versatile` becomes unavailable)

---

## 🩺 Troubleshooting

| Problem | Fix |
|---|---|
| "Failed to save trip to Supabase" | Check `config.js` URL/key are correct and `supabase.sql` was run |
| AI explanation never appears / errors | Check `GROQ_API_KEY` is set in `.env` (local) or Vercel env vars (prod) |
| 404 on `/api/explain` | Make sure you're running via `vercel dev`, not a plain static server — plain HTTP servers don't run `api/` functions |
| CORS errors | Shouldn't happen since frontend and API are same-origin on Vercel; if testing frontend elsewhere, adjust accordingly |
| Groq model error | Model names change over time — check https://console.groq.com/docs/models and update `api/explain.js` |
