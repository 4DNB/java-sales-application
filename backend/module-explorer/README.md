# Backend Atlas

A standalone React + TypeScript catalog located at `backend/module-explorer` in the Java Sales Application project.

## Run locally

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. To create a production build:

```powershell
npm run build
```

## What's included

- A simple endpoint-first list for the user and product services.
- Click an endpoint to open a separate flow workspace with a plain-language decision tree.
- Drag the canvas to pan around the flow, or use the arrow keys; select Reset view to recenter it.
- Search by service, HTTP method, or endpoint path.

The catalog is a static inventory, so update the service data in `src/App.tsx` when the backend changes.
