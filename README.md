# JARVIS AI Assistant — HTML/CSS/JavaScript

A responsive, installable-style web app starter. It includes a dashboard, local command console, browser speech input/output, quick tools, notes, focus timer, settings, and basic offline caching.

## Project structure

```text
JARVIS_AI_Assistant/
├── index.html
├── styles.css
├── app.js
├── manifest.webmanifest
├── sw.js
├── README.md
└── assets/
    └── icon.svg
```

## Run locally

**Option A — VS Code Live Server**
1. Extract the ZIP.
2. Open the folder in Visual Studio Code.
3. Install the Live Server extension.
4. Right-click `index.html` and choose **Open with Live Server**.

**Option B — Python local server**
Open a terminal in the project folder and run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

A local HTTP server is recommended because microphone recognition, notifications and service workers are restricted in some browsers when opening files directly with `file://`.

## Publish it

Upload the project files to a static HTTPS host such as GitHub Pages. Keep the folder structure unchanged. HTTPS is required for service workers and browser notifications, and is generally required for microphone access.

## Voice features

- Voice input uses the browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) when available.
- Speech output uses `speechSynthesis`.
- Browser and device support varies. Voice recognition may rely on a browser or operating-system speech service and may send audio to that service.
- The app does not listen continuously or run voice commands in the background.

## Built-in demo commands

Try:
- `help`
- `what time is it`
- `open dashboard`
- `open tools`
- `open settings`
- `calculate (12 + 8) * 3`
- `start timer`
- `tell me a joke`

The command engine intentionally handles a small set of local commands. It is not connected to a large language model and cannot control arbitrary device features, apps, accounts, files or websites. To add general AI conversation, create a server-side backend and keep any AI API key on the server — never place secret keys in `app.js` or other browser files.

## Testing checklist

1. Open the site on desktop and mobile widths.
2. Navigate through all four sidebar sections.
3. Submit `help` in the assistant console.
4. Try `calculate (12 + 8) * 3` in the console and calculator tool.
5. Save a note, refresh the page, and confirm it remains.
6. Start and pause/reset the focus timer.
7. Test voice input in a supported browser on HTTPS or localhost; grant microphone permission when prompted.
8. Test speech output by sending a command.
9. Enable notifications on HTTPS or localhost and check the permission prompt.
10. In DevTools, check the Console for errors and test offline caching after the first successful load.

## Customisation

- Visual design: edit `styles.css`.
- Layout and content: edit `index.html`.
- Commands and interactions: edit `app.js`.
- PWA metadata: edit `manifest.webmanifest`.
- Offline cache list: edit `sw.js`.

## Important

This is a functional front-end starter, not a full unrestricted AI assistant. Features that access external services or privileged device functions need explicit integrations, user permission and (where appropriate) a secure backend.
