# Quizzz Frontend

React/Vite frontend for Quizzz. This folder is intentionally deployable as an independent repository.
--
## Local development

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` to the backend API root, including `/api/v1`:

```text
VITE_API_BASE_URL=http://localhost:8787/api/v1
```

The app uses hash-based routing so deep links work on GitHub Pages.

## GitHub Pages

1. Create a repository containing the contents of this `frontend` folder.
2. In `.github/workflows/deploy-pages.yml`, set `VITE_API_BASE_URL` to the public backend URL.
3. Set `VITE_BASE_PATH` to `/<repository-name>/` for a project site. Use `/` for a `username.github.io` site.
4. Enable GitHub Pages with **GitHub Actions** as the source.

The API URL is public browser configuration. Never put database credentials or the OpenRouter key in this repository.
