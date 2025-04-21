import os
import pandas as pd
import numpy as np
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import logging

class MovieRecommender:
    """Movie recommendation system using TF-IDF and collaborative filtering."""
    
    def __init__(self):
        """Initialize the recommender with movie and rating data."""
        try:
            # Define common locations to check for data files
            data_locations = [".", "./data", "../data"]
            
            # First check if we're in a directory with the CSV files
            if os.path.exists("movies.csv") and os.path.exists("ratings.csv"):
                self.movies_path = "movies.csv"
                self.ratings_path = "ratings.csv"
                logging.info("Found movie data files in current directory")
            else:
                # Look for the data files in common locations
                for location in data_locations:
                    movies_path = os.path.join(location, "movies.csv")
                    ratings_path = os.path.join(location, "ratings.csv")
                    if os.path.exists(movies_path) and os.path.exists(ratings_path):
                        self.movies_path = movies_path
                        self.ratings_path = ratings_path
                        logging.info(f"Found movie data files in: {location}")
                        break
                else:
                    raise FileNotFoundError("Could not find movies.csv and ratings.csv in any expected location")
            
            # Load the data
            logging.info(f"Loading movies from {self.movies_path}")
            self.movies = pd.read_csv(self.movies_path)
            logging.info(f"Loading ratings from {self.ratings_path}")
            self.ratings = pd.read_csv(self.ratings_path)
            
            # Create clean titles for better search
            self.movies["clean_title"] = self.movies["title"].apply(self._clean_title)
            
            # Initialize the TF-IDF vectorizer
            self.vectorizer = TfidfVectorizer(ngram_range=(1, 2))
            self.tfidf = self.vectorizer.fit_transform(self.movies["clean_title"])
            
            logging.info("MovieRecommender initialized successfully")
        except Exception as e:
            logging.error(f"Error initializing MovieRecommender: {e}")
            raise
    
    def _clean_title(self, title):
        """Remove special characters from movie titles."""
        return re.sub("[^a-zA-Z0-9 ]", "", title)
    
    def search_movies(self, title, max_results=5):
        """Search for movies by title using TF-IDF and cosine similarity."""
        title = self._clean_title(title)
        query_vec = self.vectorizer.transform([title])
        similarity = cosine_similarity(query_vec, self.tfidf).flatten()
        indices = np.argpartition(similarity, -max_results)[-max_results:]
        # Sort results by similarity (highest first)
        indices = indices[np.argsort(-similarity[indices])]
        
        return self.movies.iloc[indices][["movieId", "title", "genres"]]
    
    def get_movie(self, movie_id):
        """Get details for a specific movie by ID."""
        movie = self.movies[self.movies["movieId"] == movie_id]
        if len(movie) == 0:
            return None
        return movie.iloc[0]
    
    def get_recommendations(self, movie_id, min_rating=4, similarity_threshold=0.10, max_recommendations=10):
        """Get movie recommendations based on user behavior."""
        try:
            # Find users who liked this movie
            similar_users = self.ratings[(self.ratings["movieId"] == movie_id) & 
                                        (self.ratings["rating"] > min_rating)]["userId"].unique()
            
            if len(similar_users) == 0:
                logging.warning(f"No similar users found for movie ID {movie_id}")
                return pd.DataFrame(columns=["score", "title", "genres"])
            
            # Find movies that these users also liked
            similar_user_recs = self.ratings[(self.ratings["userId"].isin(similar_users)) & 
                                            (self.ratings["rating"] > min_rating)]["movieId"]
            
            # Calculate the percentage of similar users who liked each movie
            similar_user_recs = similar_user_recs.value_counts() / len(similar_users)
            
            # Filter to movies that a significant percentage of similar users liked
            similar_user_recs = similar_user_recs[similar_user_recs > similarity_threshold]
            
            if len(similar_user_recs) == 0:
                logging.warning(f"No recommendations meet the threshold for movie ID {movie_id}")
                return pd.DataFrame(columns=["score", "title", "genres"])
            
            # Find all users who liked these recommended movies
            all_users = self.ratings[(self.ratings["movieId"].isin(similar_user_recs.index)) & 
                                    (self.ratings["rating"] > min_rating)]
            
            # Calculate the percentage of all users who liked each movie
            all_user_recs = all_users["movieId"].value_counts() / len(all_users["userId"].unique())
            
            # Combine the two metrics
            rec_percentages = pd.concat([similar_user_recs, all_user_recs], axis=1)
            rec_percentages.columns = ["similar", "all"]
            
            # Calculate a recommendation score (how much more similar users liked this movie)
            rec_percentages["score"] = rec_percentages["similar"] / rec_percentages["all"]
            
            # Sort by score and get the top recommendations
            rec_percentages = rec_percentages.sort_values("score", ascending=False)
            
            # Merge with movie data to get titles and genres
            recommendations = rec_percentages.head(max_recommendations).merge(
                self.movies, left_index=True, right_on="movieId")[["score", "movieId", "title", "genres"]]
            
            return recommendations
        except Exception as e:
            logging.error(f"Error getting recommendations for movie ID {movie_id}: {e}")
            raise
