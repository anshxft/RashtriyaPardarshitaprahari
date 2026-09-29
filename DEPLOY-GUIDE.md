# Website ko live karne ki guide (GitHub + Vercel + Supabase)

Is folder mein website ka poora code hai. **Database (Supabase) pehle se tayyar hai.** Usme saari tables, 33 sections, 9 pages aur demo content maujood hai, aur security lock bhi laga hai. Aapko sirf GitHub par code daalna hai aur Vercel mein import karna hai.

> ⚠ **Secret file:** `.env.vercel` sirf aapke computer par hai:
> `C:\Users\alanl\news site claude code\prahari-news\.env.vercel`
> Yeh ZIP mein nahi hai aur kabhi GitHub par nahi jani chahiye. Isme database address aur secret key hain.

---

## Step 1: Supabase password badlein (zaroori, 3 minute)

Pichhli baar password ke kuch akshar screen par dikh gaye the, isliye naya bana lijiye.

1. Kholiye: https://supabase.com/dashboard/project/wuqqjerkjmuqyxumfmag/database/settings
2. **Reset database password**, phir **Generate a password** dabaiye aur password copy kariye.
3. VS Code mein `.env.vercel` kholiye. Line 4 par `SUPABASE_DB_PASSWORD=` ke baad purana password hata kar naya paste kariye aur **Ctrl + S** se save kariye.
4. Project folder mein terminal kholiye:
   ```
   cd "C:\Users\alanl\news site claude code\prahari-news"
   npm run db-url
   ```
5. `✓ Database connection OK` aana chahiye. Is script ne `.env.vercel` mein **DATABASE_URL** apne-aap sahi bana diya hai.

---

## Step 2: Code GitHub par daalein

**Option A (sabse aasaan):** code pehle se aapke private repo mein hai:
https://github.com/anshxft/rashtriya-pardarshita-prahari
Isi ko use karna chahein to seedha **Step 3** par jaiye.

**Option B (naya repo khud banana):**
1. https://github.com/new par jaiye. Naam dijiye (jaise `prahari-website`), **Private** chuniye, aur **README / .gitignore / license kuch bhi tick mat kariye**. **Create repository** dabaiye.
2. Naye repo page par **"uploading an existing file"** link dabaiye.
3. `rashtriya-pardarshita-prahari.zip` ko **pehle unzip kariye** (right-click, phir **Extract All**).
4. Extract hue folder ke **andar ki saari files aur folders** (`src`, `public`, `scripts`, `package.json`, `README.md` wagairah) select karke GitHub page par **drag-drop** kariye.
   - Folder khud mat daaliye, uske andar ka saaman daaliye.
5. Neeche **Commit changes** dabaiye.
6. Repo mein `package.json` sabse upar (root mein) dikhna chahiye. Agar sab kuch ek aur folder ke andar chala gaya, to Vercel mein **Root Directory** us folder ka naam set karna hoga.

---

## Step 3: Vercel mein import karein

> Pehle se `rashtriya-pardarshita-prahari` naam ka ek Vercel project bana hua hai. Naya banana hai to purane ko delete kar dijiye (Project → **Settings** → sabse neeche **Delete Project**), ya naye project ka alag naam rakhiye.

1. https://vercel.com/new kholiye. Apna GitHub repo dhoondhiye aur **Import** dabaiye.
2. **Framework Preset:** Next.js (apne-aap aa jayega). Build settings mat badaliye.
3. **Environment Variables** kholiye aur yeh 3 daaliye. Values VS Code mein `.env.vercel` se copy kariye: `=` ke baad click, **Shift + End**, **Ctrl + C**.

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | `.env.vercel` ki `DATABASE_URL=` wali line ka `=` ke baad wala **poora** hissa. Yeh `postgresql://postgres.wuqqjerkjmuqyxumfmag:` se shuru hota hai aur `:6543/postgres` par khatam hota hai. **Sirf password nahi.** |
   | `PAYLOAD_SECRET` | `.env.vercel` ki `PAYLOAD_SECRET=` wali line ka `=` ke baad wala hissa (64 akshar) |
   | `NEXT_PUBLIC_SITE_URL` | `https://<aapke-project-ka-naam>.vercel.app` (baad mein apna domain) |

4. **Deploy** dabaiye aur 2–3 minute rukiye.

---

## Step 4: Photo/file storage jodein

1. Vercel project mein **Storage** tab kholiye.
2. Pehle se bana **`prahari-media`** (Blob) store chuniye aur **Connect** kariye. Na dikhe to **Create**, phir **Blob** chuniye aur region **Mumbai (bom1)** rakhiye.
3. Isse `BLOB_READ_WRITE_TOKEN` apne-aap jud jata hai.
4. **Deployments** tab mein sabse upar wale deployment par **⋯**, phir **Redeploy** dabaiye.
   - Koi bhi setting badalne ke baad Redeploy zaroori hai.

---

## Step 5: Website kholiye aur Admin banaiye

1. `https://<aapka-project>.vercel.app/hi` kholiye. Website dikhni chahiye.
2. `https://<aapka-project>.vercel.app/admin` kholiye. **Pehla account jo aap banayenge wahi Admin hoga.** Apna asli email aur ek mazboot password daaliye.
3. Admin mein **Site Settings** bhariye: Trust registration, editor, address, contact wagairah.
4. Launch se pehle demo content hatana ho to project folder ke terminal mein chalaiye (PowerShell):
   ```
   $env:NODE_ENV='production'; $env:DATABASE_URL=(Select-String '^DATABASE_URL=' .env.vercel).Line.Substring(13); npx payload run src/seed/remove-demo.ts
   ```

---

## Problem aaye to

| Dikkat | Hal |
|---|---|
| Har page par **500 error** | `DATABASE_URL` galat hai. Poora `postgresql://…` hona chahiye, sirf password nahi. Theek karke **Redeploy** kariye. |
| Setting badli par kuch nahi hua | Vercel mein setting badalne ke baad **Redeploy** zaroori hai. |
| Photo upload nahi ho rahi | Step 4: Blob storage connect kariye, phir Redeploy. |
| Site Vercel login maang rahi hai | Project → **Settings → Deployment Protection**, phir **Vercel Authentication** band kariye. Yeh tabhi kariye jab public launch karna ho. |
| Admin login bhool gaye | Admin → Users mein doosra admin password badal sakta hai. Email (SMTP) set hone ke baad "Forgot password" bhi chalega. |

Code ke technical details ke liye `README.md` dekhiye.
