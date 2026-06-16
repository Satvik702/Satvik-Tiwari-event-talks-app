# BigQuery Release Pulse 📊✨

A modern, fast, and responsive web dashboard that aggregates Google Cloud BigQuery release notes and makes sharing them on X (Twitter) seamless.

## 🚀 Features

- **Automated XML Parsing**: Fetches the official Google Cloud BigQuery RSS/Atom feed and breaks down combined daily updates into individual cards (Features, Issues, Changes, and Deprecations).
- **In-Memory Caching**: Minimizes api network latency and respects feed source rate limits, with support for forced refresh queries.
- **Dynamic Filter & Search**: Instantly filter updates by type (e.g. Features, Issues) or search for specific keywords (e.g. Gemini, SQL, JSON) on the fly.
- **Glassmorphic UI Design**: Tailored with custom radial gradient glowing background spheres, micro-animations, and responsive CSS grids.
- **Interactive X (Twitter) Composer**: Click any card to select and review it. Automatically drafts a post formatted to fit within 280 characters, properly factoring in the weighted cost of shortened URLs (`t.co`).

---

## 🛠️ Tech Stack

- **Backend**: Python, [Flask](https://flask.palletsprojects.com/)
- **Libraries**: `requests` (HTTP client), `feedparser` (XML feed parser), `beautifulsoup4` (HTML extraction)
- **Frontend**: Plain Vanilla HTML5, CSS3 (variables, transitions, keyframe animations), JavaScript (ES6+, Fetch API)
- **Icons**: FontAwesome & FontAwesome brands (for X logo)
- **Typography**: Google Fonts (Outfit & Plus Jakarta Sans)

---

## 💻 Getting Started

### 1. Prerequisites
Make sure you have Python 3 installed.

### 2. Installation & Setup
Clone the repository (or navigate to the project directory) and install dependencies:

```bash
pip install Flask requests feedparser beautifulsoup4
```

### 3. Run the Server
Start the Flask application:

```bash
python app.py
```

The application will run locally at:
👉 **[http://127.0.0.1:8080](http://127.0.0.1:8080)**

---

## 📂 Project Structure

```
├── app.py                  # Flask application server
├── templates/
│   └── index.html          # Main HTML structure
├── static/
│   ├── css/
│   │   └── styles.css      # Dark mode styling and layouts
│   └── js/
│       └── main.js         # API requests, filter states & X share composer
└── .gitignore              # Ignored files (virtual environments, OS configuration)
```
