# Lab Website Starter

A bilingual (English/Japanese) academic lab website built with Next.js 15.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Structure

```
├── src/
│   ├── app/           # Next.js pages
│   ├── components/    # React components
│   ├── contexts/      # Language context
│   ├── lib/           # Content loading
│   └── types/         # TypeScript types
├── content/           # All content (YAML/Markdown)
│   ├── members/       # Team members by category
│   ├── publications/  # Publications
│   ├── news/          # News posts
│   ├── research/      # Research themes
│   └── settings/      # Site settings
└── public/
    ├── uploads/       # Images
    └── config.yml     # Decap CMS config
```

## Adding Content

### Members
Create `content/members/{category}/{slug}.yaml`:
```yaml
id: john-doe
slug: john-doe
name:
  en: John Doe
  ja: ジョン・ドウ
role:
  en: Professor
  ja: 教授
```

### Publications
Create `content/publications/{id}.yaml`:
```yaml
id: 2024-paper-title
title: "Paper Title"
authors: [Author One, Author Two]
year: 2024
journal: Journal Name
doi: "10.1234/example"
type: journal
```

### News
Create `content/news/{date}-{slug}.md`:
```markdown
---
id: 2024-01-15-news-title
title:
  en: News Title
  ja: ニュースタイトル
date: "2024-01-15"
category: announcement
---
Content here...
```

## Customization

### Colors
Edit CSS variables in `src/app/globals.css`:
```css
:root {
  --accent: #3b82f6;  /* Change accent color */
  --bg: #0a0a0a;      /* Change background */
}
```

### Navigation
Edit `src/components/Navigation.tsx`

### Translations
Edit `content/translations.yaml`

## CMS Admin

1. Update `public/config.yml`:
   - Set `repo` to your GitHub repo
   - Set `base_url` to your deployed URL

2. Create a GitHub OAuth App for authentication

3. Access admin at `/admin`

## Deploy to Vercel with CMS

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create YOUR_REPO_NAME --public --source=. --push
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Click **Deploy**
4. Note your URL (e.g., `https://your-site.vercel.app`)

### Step 3: Set Up GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name:** Your Lab CMS
   - **Homepage URL:** `https://your-site.vercel.app`
   - **Authorization callback URL:** `https://your-site.vercel.app/api/auth/callback`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it

### Step 4: Add Environment Variables to Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add these variables:
   - `GITHUB_CLIENT_ID` = your client ID
   - `GITHUB_CLIENT_SECRET` = your client secret
   - `NEXT_PUBLIC_SITE_URL` = `https://your-site.vercel.app`
3. Click **Redeploy** (from Deployments tab)

### Step 5: Update CMS Config

Edit `public/config.yml` and change:
```yaml
backend:
  repo: YOUR_USERNAME/YOUR_REPO  # Your actual GitHub repo
  base_url: https://your-site.vercel.app  # Your Vercel URL
```

Commit and push. Once deployed, access the CMS at `/admin`.
