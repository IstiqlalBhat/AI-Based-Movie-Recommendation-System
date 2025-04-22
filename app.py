# app.py  ― fully updated Flask backend for the movie‑recommender stack
# ---------------------------------------------------------------
import os
import logging
from flask import (
    Flask,
    request,
    jsonify,
    render_template,
    send_from_directory,
)
from flask_cors import CORS
from werkzeug.utils import safe_join         # Flask 3.x no longer re‑exports this
from model import MovieRecommender

# ────────────────────────────────────────────────────────────────
# basic logging config
logging.basicConfig(level=logging.INFO)

# create Flask app
app = Flask(__name__)  # Use default static folder
CORS(app)             # enable cross‑origin requests
app.secret_key = os.getenv("SESSION_SECRET", "dev_secret_key")

# instantiate the recommender once at startup
try:
    recommender = MovieRecommender()
    app.logger.info("MovieRecommender loaded 👍")
except Exception as exc:
    app.logger.error(f"Failed to init recommender: {exc}")
    recommender = None

# ───────────────────────────── API ROUTES ───────────────────────
@app.route("/api/search")
def search_movies():
    """Search movies by title substring (min 3 chars)."""
    query = request.args.get("query", "").strip()
    if len(query) < 3:
        # return 200 with empty list so the front‑end doesn’t treat it as an error
        return jsonify({"results": []})
    try:
        results = recommender.search_movies(query)
        return jsonify({"results": results.to_dict(orient="records")})
    except Exception as exc:
        app.logger.error(f"Search error: {exc}")
        return jsonify({"error": str(exc), "results": []}), 500


@app.route("/api/recommend")
def recommend_movies():
    """Get recommendations based on a seed movie."""
    movie_id = request.args.get('movieId')
    if not movie_id:
        return jsonify({"error": "No movie ID provided", "recommendations": []}), 400
    
    try:
        movie_id = int(movie_id)
        recs = recommender.get_recommendations(movie_id)
        return jsonify({"recommendations": recs.to_dict(orient="records")})
    except ValueError:
        return jsonify({"error": "Invalid movie ID", "recommendations": []}), 400
    except Exception as exc:
        app.logger.error(f"Recommendation error: {exc}")
        return jsonify({"error": str(exc), "recommendations": []}), 500


@app.route("/api/direct-recommend")
def direct_recommend():
    """Search for a movie by title and get recommendations in one call.
    This mimics the behavior of the Jupyter notebook."""
    query = request.args.get("query", "").strip()
    if len(query) < 3:
        return jsonify({"error": "Query too short", "current_movie": None, "recommendations": []}), 400
    
    try:
        # First search for the movie
        search_results = recommender.search_movies(query, max_results=1)
        if len(search_results) == 0:
            return jsonify({"error": "No movies found", "current_movie": None, "recommendations": []}), 404
        
        # Get the top movie from search results
        movie = search_results.iloc[0]
        movie_id = movie["movieId"]
        
        # Get recommendations based on that movie
        recommendations = recommender.get_recommendations(movie_id)
        
        # Return both the current movie and recommendations
        return jsonify({
            "current_movie": movie.to_dict(),
            "recommendations": recommendations.to_dict(orient="records")
        })
    except Exception as exc:
        app.logger.error(f"Direct recommendation error: {exc}")
        return jsonify({"error": str(exc), "current_movie": None, "recommendations": []}), 500


@app.route("/api/movies/<int:movie_id>")
def get_movie(movie_id: int):
    """Return metadata for a single movie."""
    try:
        movie = recommender.get_movie(movie_id)
        if movie is None:
            return jsonify({"error": "Movie not found"}), 404
        return jsonify({"movie": movie.to_dict()})
    except Exception as exc:
        app.logger.error(f"Get‑movie error: {exc}")
        return jsonify({"error": str(exc)}), 500


# ─────────────────────── FRONT‑END / FALLBACK ROUTE ─────────────
# If you have a React build in ./frontend/build, serve it; otherwise
# fall back to a Jinja template (index.html in ./templates).
frontend_build = os.path.join(os.path.dirname(__file__), "frontend", "build")


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path: str):
    """Serve React SPA or fallback template."""
    # prefer React build if it exists
    if os.path.exists(frontend_build):
        target = safe_join(frontend_build, path)
        if path and os.path.exists(target):
            return send_from_directory(frontend_build, path)
        return send_from_directory(frontend_build, "index.html")

    # fallback: render a simple Jinja template
    return render_template("index.html")


# ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Gunicorn will run this file as 'app:app' in production,
    # but running directly is convenient for local dev.
    app.run(host="0.0.0.0", port=5000, debug=True)
