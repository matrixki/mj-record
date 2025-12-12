# MJ Record

A web application to display player's records throughout the year.

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router v6
- GitHub Pages for hosting

## Development

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

```bash
npm install
```

### Local Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Deployment

This project is configured to automatically deploy to GitHub Pages when you push to the `main` branch.

### Setup GitHub Pages

1. Push this code to a GitHub repository named `mj-record` under the username `matrixki`
2. Go to your repository settings
3. Navigate to **Pages** in the left sidebar
4. Under **Build and deployment**:
   - Source: Select "GitHub Actions"
5. Push to the `main` branch - the GitHub Action will automatically build and deploy

### Access the deployed site

Once deployed, your site will be available at:
```
https://matrixki.github.io/mj-record/
```

## Project Structure

```
mj-record/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── src/
│   ├── pages/
│   │   └── Home.tsx           # Home page component
│   ├── App.tsx                # Main app component with routing
│   ├── main.tsx               # Entry point
│   └── ...
├── vite.config.ts             # Vite configuration
└── package.json
```

## Next Steps

- Integrate with Google Sheets API to fetch player records
- Design and implement the UI for displaying records
- Add additional pages/routes as needed
