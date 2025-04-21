import os
import logging
from flask import Flask, render_template, request, jsonify
from model import MovieRecommender

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Initialize the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")

# Initialize the recommender model
try:
    recommender = MovieRecommender()
    app.logger.info("Movie recommender initialized successfully")
except Exception as e:
    app.logger.error(f"Error initializing movie recommender: {e}")
    recommender = None

@app.route('/')
def index():
    """Render the main page of the application."""
    return render_template('index.html')

@app.route('/api/search', methods=['GET'])
def search_movies():
    """API endpoint to search for movies by title."""
    query = request.args.get('query', '')
    if not query or len(query) < 3:
        return jsonify({"error": "Query too short", "results": []}), 400
    
    try:
        results = recommender.search_movies(query)
        return jsonify({"results": results.to_dict(orient='records')})
    except Exception as e:
        app.logger.error(f"Error searching movies: {e}")
        return jsonify({"error": str(e), "results": []}), 500

@app.route('/api/recommend', methods=['GET'])
def recommend_movies():
    """API endpoint to get movie recommendations based on movie ID."""
    movie_id = request.args.get('movieId')
    if not movie_id:
        return jsonify({"error": "No movie ID provided", "recommendations": []}), 400
    
    try:
        movie_id = int(movie_id)
        recommendations = recommender.get_recommendations(movie_id)
        return jsonify({"recommendations": recommendations.to_dict(orient='records')})
    except ValueError:
        return jsonify({"error": "Invalid movie ID", "recommendations": []}), 400
    except Exception as e:
        app.logger.error(f"Error getting recommendations: {e}")
        return jsonify({"error": str(e), "recommendations": []}), 500

@app.route('/api/movies/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    """API endpoint to get details for a specific movie."""
    try:
        movie = recommender.get_movie(movie_id)
        if movie is not None:
            return jsonify({"movie": movie.to_dict()})
        else:
            return jsonify({"error": "Movie not found"}), 404
    except Exception as e:
        app.logger.error(f"Error getting movie details: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
