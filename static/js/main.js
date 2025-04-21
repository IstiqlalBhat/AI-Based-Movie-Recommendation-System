document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const movieSearch = document.getElementById('movie-search');
    const searchButton = document.getElementById('search-button');
    const searchFeedback = document.getElementById('search-feedback');
    const searchResultsContainer = document.getElementById('search-results-container');
    const searchResults = document.getElementById('search-results');
    const selectedMovieContainer = document.getElementById('selected-movie-container');
    const selectedMovieTitle = document.getElementById('selected-movie-title');
    const selectedMovieGenres = document.getElementById('selected-movie-genres');
    const recommendationsContainer = document.getElementById('recommendations-container');
    const recommendations = document.getElementById('recommendations');
    const baseMovieTitle = document.getElementById('base-movie-title');
    const initialContent = document.getElementById('initial-content');
    const recommendationLoader = document.getElementById('recommendation-loader');
    
    // Templates
    const movieCardTemplate = document.getElementById('movie-card-template');
    const recommendationCardTemplate = document.getElementById('recommendation-card-template');
    
    // Global state
    let selectedMovie = null;
    let debounceTimeout = null;
    
    // Event listeners
    searchButton.addEventListener('click', performSearch);
    movieSearch.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        } else {
            // Debounce search as user types
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                if (movieSearch.value.length >= 3) {
                    performSearch();
                }
            }, 500);
        }
    });
    
    /**
     * Performs a search for movies based on the input value
     */
    function performSearch() {
        const query = movieSearch.value.trim();
        
        if (query.length < 3) {
            searchFeedback.textContent = 'Please enter at least 3 characters';
            return;
        }
        
        searchFeedback.textContent = 'Searching...';
        
        fetch(`/api/search?query=${encodeURIComponent(query)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Search failed');
                }
                return response.json();
            })
            .then(data => {
                if (data.results && data.results.length > 0) {
                    displaySearchResults(data.results);
                    searchFeedback.textContent = '';
                } else {
                    searchFeedback.textContent = 'No movies found. Try a different search term.';
                    searchResultsContainer.classList.add('d-none');
                }
            })
            .catch(error => {
                console.error('Error searching movies:', error);
                searchFeedback.textContent = 'An error occurred while searching. Please try again.';
            });
    }
    
    /**
     * Displays search results in the UI
     * @param {Array} results - List of movie results
     */
    function displaySearchResults(results) {
        // Clear previous results
        searchResults.innerHTML = '';
        
        // Create and append movie cards
        results.forEach(movie => {
            const movieCard = createMovieCard(movie);
            searchResults.appendChild(movieCard);
        });
        
        // Show results container, hide recommendations
        searchResultsContainer.classList.remove('d-none');
        selectedMovieContainer.classList.add('d-none');
        recommendationsContainer.classList.add('d-none');
        initialContent.classList.add('d-none');
        
        // Add animation
        searchResultsContainer.classList.add('fade-in');
    }
    
    /**
     * Creates a movie card element from the template
     * @param {Object} movie - Movie data
     * @returns {HTMLElement} The movie card element
     */
    function createMovieCard(movie) {
        const template = movieCardTemplate.content.cloneNode(true);
        const card = template.querySelector('.movie-card');
        
        card.dataset.movieId = movie.movieId;
        card.querySelector('.movie-title').textContent = cleanMovieTitle(movie.title);
        
        // Add genre tags
        const genresContainer = card.querySelector('.genres');
        addGenreTags(genresContainer, movie.genres);
        
        // Add click event to show recommendations
        card.addEventListener('click', () => selectMovie(movie));
        
        return template;
    }
    
    /**
     * Creates a recommendation card element from the template
     * @param {Object} movie - Movie data with recommendation score
     * @returns {HTMLElement} The recommendation card element
     */
    function createRecommendationCard(movie) {
        const template = recommendationCardTemplate.content.cloneNode(true);
        const card = template.querySelector('.movie-card');
        
        card.dataset.movieId = movie.movieId;
        card.querySelector('.movie-title').textContent = cleanMovieTitle(movie.title);
        
        // Add genre tags
        const genresContainer = card.querySelector('.genres');
        addGenreTags(genresContainer, movie.genres);
        
        // Calculate and display match score
        const scorePercentage = Math.min(100, Math.round(movie.score * 5)); // Normalize score for display
        card.querySelector('.score-fill').style.width = `${scorePercentage}%`;
        card.querySelector('.score-text').textContent = `${scorePercentage}% Match`;
        
        return template;
    }
    
    /**
     * Adds genre tags to a container element
     * @param {HTMLElement} container - The container to add tags to
     * @param {string} genresString - Pipe-delimited string of genres
     */
    function addGenreTags(container, genresString) {
        if (genresString && genresString !== '(no genres listed)') {
            const genres = genresString.split('|');
            genres.forEach(genre => {
                const tag = document.createElement('span');
                tag.classList.add('genre-tag');
                tag.textContent = genre;
                container.appendChild(tag);
            });
        } else {
            const tag = document.createElement('span');
            tag.classList.add('genre-tag');
            tag.textContent = 'Uncategorized';
            container.appendChild(tag);
        }
    }
    
    /**
     * Selects a movie and fetches recommendations
     * @param {Object} movie - The selected movie
     */
    function selectMovie(movie) {
        selectedMovie = movie;
        
        // Update UI for selected movie
        selectedMovieTitle.textContent = cleanMovieTitle(movie.title);
        selectedMovieGenres.innerHTML = '';
        addGenreTags(selectedMovieGenres, movie.genres);
        
        // Update UI visibility
        selectedMovieContainer.classList.remove('d-none');
        recommendationLoader.style.display = 'flex';
        recommendationsContainer.classList.add('d-none');
        initialContent.classList.add('d-none');
        
        // Scroll to selected movie
        selectedMovieContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Fetch recommendations
        fetchRecommendations(movie.movieId);
    }
    
    /**
     * Fetches movie recommendations based on a movie ID
     * @param {number} movieId - The movie ID to get recommendations for
     */
    function fetchRecommendations(movieId) {
        fetch(`/api/recommend?movieId=${encodeURIComponent(movieId)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to get recommendations');
                }
                return response.json();
            })
            .then(data => {
                if (data.recommendations && data.recommendations.length > 0) {
                    displayRecommendations(data.recommendations);
                } else {
                    recommendationLoader.style.display = 'none';
                    searchFeedback.textContent = 'No recommendations found for this movie.';
                }
            })
            .catch(error => {
                console.error('Error getting recommendations:', error);
                recommendationLoader.style.display = 'none';
                searchFeedback.textContent = 'An error occurred while getting recommendations. Please try again.';
            });
    }
    
    /**
     * Displays movie recommendations in the UI
     * @param {Array} recommendationsList - List of recommended movies
     */
    function displayRecommendations(recommendationsList) {
        // Clear previous results
        recommendations.innerHTML = '';
        
        // Create and append recommendation cards
        recommendationsList.forEach(movie => {
            const recommendationCard = createRecommendationCard(movie);
            recommendations.appendChild(recommendationCard);
        });
        
        // Update UI visibility
        recommendationLoader.style.display = 'none';
        recommendationsContainer.classList.remove('d-none');
        baseMovieTitle.textContent = cleanMovieTitle(selectedMovie.title);
        
        // Add animation
        recommendationsContainer.classList.add('fade-in');
        
        // Scroll to recommendations
        recommendationsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Cleans a movie title by removing the year in parentheses
     * @param {string} title - The movie title with year
     * @returns {string} The cleaned title
     */
    function cleanMovieTitle(title) {
        return title.replace(/\s*\(\d{4}\)$/, '');
    }
    
    // Initial animation for the page
    document.querySelectorAll('.feature-card').forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('fade-in');
        }, index * 200);
    });
});
