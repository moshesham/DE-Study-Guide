# Data Engineering Study Guide

A Python-based coding interview study guide covering databases, APIs, S3, DataFrames, Airflow, and more. 

## Project Structure for GitHub Pages
- **`/docs`**: Contains the compiled production build of the React application. GitHub Pages can be configured to serve directly from the `/docs` directory on the `main` branch.
- **`/public/_config.yml`**: Included to configure GitHub Pages (and disable Jekyll processing via `.nojekyll` to natively serve the Vite SPA).
- **`/src`**: Contains the React application source code (TypeScript, Tailwind CSS).

## Development
To run this application locally:
\`\`\`bash
npm install
npm run dev
\`\`\`

## Deployment
This project uses GitHub Actions to deploy to GitHub Pages. The workflow is located at \`.github/workflows/deploy.yml\`. Every push to \`main\` builds the Vite app into the \`docs/\` directory and deploys it automatically.
