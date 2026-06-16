import os
import requests
import feedparser
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request
from datetime import datetime

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

# In-memory cache for the parsed feed
cache = {
    "data": None,
    "last_fetched": None
}

def parse_release_notes():
    try:
        response = requests.get(FEED_URL, timeout=10)
        if response.status_code != 200:
            print(f"Failed to fetch feed, status code: {response.status_code}")
            return None
        
        feed = feedparser.parse(response.content)
        parsed_entries = []
        
        for entry in feed.entries:
            entry_id = entry.get("id", "")
            title_date = entry.get("title", "Unknown Date")
            link = entry.get("link", "")
            updated = entry.get("updated", "")
            
            # The HTML content is in the summary or content field
            html_content = entry.get("summary", "")
            if not html_content and entry.get("content"):
                html_content = entry.get("content", [{}])[0].get("value", "")
            
            if not html_content:
                continue

            # Parse individual update blocks using BeautifulSoup
            soup = BeautifulSoup(html_content, "html.parser")
            updates = []
            
            current_category = "General"
            current_html_nodes = []
            
            for child in soup.contents:
                # If child is a tag and it's an h3, it marks a new category block
                if getattr(child, 'name', None) == 'h3':
                    # Save preceding update if it has content
                    if current_html_nodes:
                        content_html = "".join(str(node) for node in current_html_nodes).strip()
                        # Clean up text representation for tweeting
                        temp_soup = BeautifulSoup(content_html, "html.parser")
                        content_text = temp_soup.get_text(separator=" ").strip()
                        # Clean multiple spaces/newlines
                        content_text = " ".join(content_text.split())
                        
                        updates.append({
                            "category": current_category,
                            "content_html": content_html,
                            "content_text": content_text
                        })
                        current_html_nodes = []
                    current_category = child.get_text().strip()
                else:
                    current_html_nodes.append(child)
            
            # Add the last block
            if current_html_nodes:
                content_html = "".join(str(node) for node in current_html_nodes).strip()
                temp_soup = BeautifulSoup(content_html, "html.parser")
                content_text = temp_soup.get_text(separator=" ").strip()
                content_text = " ".join(content_text.split())
                
                updates.append({
                    "category": current_category,
                    "content_html": content_html,
                    "content_text": content_text
                })
                
            parsed_entries.append({
                "id": entry_id,
                "title_date": title_date,
                "link": link,
                "updated": updated,
                "updates": updates
            })
            
        return parsed_entries
    except Exception as e:
        print(f"Error parsing feed: {e}")
        return None

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/releases")
def get_releases():
    force_refresh = request.args.get("refresh", "false").lower() == "true"
    
    if force_refresh or cache["data"] is None:
        data = parse_release_notes()
        if data is not None:
            cache["data"] = data
            cache["last_fetched"] = datetime.now().strftime("%b %d, %Y at %I:%M %p")
        elif cache["data"] is None:
            return jsonify({"error": "Failed to fetch release notes from Google Cloud"}), 500
            
    return jsonify({
        "last_fetched": cache["last_fetched"],
        "entries": cache["data"]
    })

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
