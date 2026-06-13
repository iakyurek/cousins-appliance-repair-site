# Deployment Checklist

This project is ready to deploy as one Render Web Service. The Node backend serves the website files and the `/api/chat` endpoint.

## Do not upload secrets
Do not commit `backend/.env` to GitHub. Add the same values in Render Environment Variables instead:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.4-mini
```

## Render settings
- Service type: Web Service
- Runtime/language: Node
- Root directory: leave blank
- Build command: `npm install && npm run build`
- Start command: `npm start`

## Local testing
Terminal 1:
```bash
cd backend
npm install
node server.js
```

Then open:
```txt
http://localhost:3001/index.html
```

You can also run the static frontend separately with `python3 -m http.server 5500`, but the final deployed Render version serves everything from one URL.
