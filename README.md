# Daily News Summarizer

A lightweight web app that builds a same-day news digest from:

- CNN Top Stories RSS
- Morning Brew Daily RSS

## Features

- Pulls the latest items from both RSS feeds.
- Prioritizes items published **today (UTC)**.
- Generates short summary bullets per source.
- Shows the exact source headlines used in the digest.

## Run locally

Because this app is static HTML/CSS/JS, you can run it with any local server.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Notes

- RSS requests are proxied through `api.allorigins.win` to avoid browser CORS limitations.
- If no items are found for today, the app uses the most recent feed entries.
