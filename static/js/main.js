document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const movieSearch = document.getElementById('movie-search');
    const recommendButton = document.getElementById('recommend-button');
    const searchFeedback = document.getElementById('search-feedback');
    const currentMovieContainer = document.getElementById('current-movie-container');
    const currentMovieTitle = document.getElementById('current-movie-title');
    const currentMovieGenres = document.getElementById('current-movie-genres');
    const recommendationsContainer = document.getElementById('recommendations-container');
    const recommendations = document.getElementById('recommendations');
    const baseMovieTitle = document.getElementById('base-movie-title');
    const initialContent = document.getElementById('initial-content');
    const recommendationLoader = document.getElementById('recommendation-loader');
    
    // Templates
    const movieCardTemplate = document.getElementById('movie-card-template');
    const recommendationCardTemplate = document.getElementById('recommendation-card-template');
    
    // Global state
    let currentMovie = null;
    let debounceTimeout = null;
    
    // Event listeners
    recommendButton.addEventListener('click', getDirectRecommendations);
    movieSearch.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            getDirectRecommendations();
        } else {
            // Debounce recommendations as user types (like Jupyter widget)
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                if (movieSearch.value.length >= 3) {
                    getDirectRecommendations();
                }
            }, 800); // 800ms delay to avoid too many requests
        }
    });
    
    /**
     * Gets direct recommendations based on the movie title input
     * This mimics the Jupyter notebook's behavior where typing a title
     * immediately shows recommendations for the best-matching movie
     */
    function getDirectRecommendations() {
        const query = movieSearch.value.trim();
        
        if (query.length < 3) {
            searchFeedback.textContent = 'Please enter at least 3 characters';
            return;
        }
        
        searchFeedback.textContent = 'Finding recommendations...';
        recommendationLoader.style.display = 'flex';
        initialContent.classList.add('d-none');
        
        fetch(`/api/direct-recommend?query=${encodeURIComponent(query)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Recommendation failed');
                }
                return response.json();
            })
            .then(data => {
                if (data.current_movie && data.recommendations && data.recommendations.length > 0) {
                    // Update the current movie and display recommendations
                    currentMovie = data.current_movie;
                    displayCurrentMovie(currentMovie);
                    displayRecommendations(data.recommendations);
                    searchFeedback.textContent = '';
                } else {
                    searchFeedback.textContent = 'No recommendations found. Try a different movie title.';
                    recommendationLoader.style.display = 'none';
                    initialContent.classList.remove('d-none');
                }
            })
            .catch(error => {
                console.error('Error getting recommendations:', error);
                searchFeedback.textContent = 'An error occurred. Please try again.';
                recommendationLoader.style.display = 'none';
                initialContent.classList.remove('d-none');
            });
    }
    
    /**
     * Displays the current movie in the UI
     * @param {Object} movie - The current movie data
     */
    function displayCurrentMovie(movie) {
        // Update UI for current movie
        currentMovieTitle.textContent = cleanMovieTitle(movie.title);
        currentMovieGenres.innerHTML = '';
        addGenreTags(currentMovieGenres, movie.genres);
        
        // Update UI visibility
        currentMovieContainer.classList.remove('d-none');
        
        // Scroll to current movie
        currentMovieContainer.scrollIntoView({ behavior: 'smooth' });
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
        baseMovieTitle.textContent = cleanMovieTitle(currentMovie.title);
        
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
    
    // Auto-focus the search input on page load
    movieSearch.focus();
});
