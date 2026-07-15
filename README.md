# Data Engineering Study Guide

A Python-based coding interview study guide covering databases, APIs, S3, DataFrames, Airflow, and more. 

## Project Structure for GitHub Pages
- **`/docs`**: Contains the compiled production build of the React application. GitHub Pages can be configured to serve directly from the `/docs` directory on the `main` branch.
- **`/public/_config.yml`**: Included to configure GitHub Pages (and disable Jekyll processing via `.nojekyll` to natively serve the Vite SPA).
- **`/src`**: Contains the React application source code (TypeScript, Tailwind CSS).

## Contributing & Feedback
We welcome community contributions! This project uses a standard Open Source workflow:
- **Feedback & Bug Reports**: Find a typo or want to suggest a new topic? Open an **Issue** on the repository.
- **Adding Content**: Want to add a code snippet or new question yourself? 
  1. Fork the repository.
  2. Add your content to `src/data.ts`.
  3. Submit a **Pull Request**. 

Once your Pull Request is reviewed and merged into the `main` branch, GitHub Actions will automatically re-deploy the application to include your changes.

## Development
To run this application locally:
\`\`\`bash
npm install
npm run dev
\`\`\`

## Deployment
This project uses GitHub Actions to deploy to GitHub Pages. The workflow is located at `.github/workflows/deploy.yml`. Every push to `main` builds the Vite app into the `docs/` directory and deploys it automatically.
