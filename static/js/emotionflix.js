document.addEventListener('DOMContentLoaded', function() {
    // Tab navigation elements
    const standardTab = document.getElementById('standard-tab');
    const emotionTab = document.getElementById('emotion-tab');
    const standardSearch = document.getElementById('standard-search');
    const emotionSearch = document.getElementById('emotion-search');
    
    // EmotionFlix elements
    const emotionInput = document.getElementById('emotion-input');
    const emotionRecommendButton = document.getElementById('emotion-recommend-button');
    const emotionFeedback = document.getElementById('emotion-feedback');
    const emotionRecommendationsContainer = document.getElementById('emotion-recommendations-container');
    const emotionResponse = document.getElementById('emotion-response');
    const emotionRecommendations = document.getElementById('emotion-recommendations');
    const emotionChatContinue = document.getElementById('emotion-chat-continue');
    
    // Templates
    const chatTemplate = document.getElementById('chat-template');
    const chatInputTemplate = document.getElementById('chat-input-template');
    const movieCardTemplate = document.getElementById('movie-card-template');
    
    // Chat history
    let chatHistory = [];
    
    // Tab navigation
    standardTab.addEventListener('click', function() {
        standardTab.classList.add('active');
        emotionTab.classList.remove('active');
        standardSearch.classList.remove('d-none');
        emotionSearch.classList.add('d-none');
        
        // Hide emotion recommendations if visible
        emotionRecommendationsContainer.classList.add('d-none');
    });
    
    emotionTab.addEventListener('click', function() {
        emotionTab.classList.add('active');
        standardTab.classList.remove('active');
        emotionSearch.classList.remove('d-none');
        standardSearch.classList.add('d-none');
        
        // Focus on emotion input
        emotionInput.focus();
    });
    
    // EmotionFlix recommendation button
    emotionRecommendButton.addEventListener('click', function() {
        getEmotionalRecommendations();
    });
    
    // Enter key on emotion input
    emotionInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            getEmotionalRecommendations();
        }
    });
    
    // EmotionFlix chat continue button
    emotionChatContinue.addEventListener('click', function() {
        // Show chat input
        showChatInput();
    });
    
    /**
     * Get emotional recommendations based on user input
     */
    function getEmotionalRecommendations() {
        const emotion = emotionInput.value.trim();
        
        if (emotion.length < 3) {
            emotionFeedback.textContent = 'Please tell us more about how you feel';
            return;
        }
        
        emotionFeedback.textContent = 'Finding the perfect movies for your mood...';
        
        // Store user message in chat history
        addToChatHistory('user', emotion);
        
        // Make request to EmotionFlix API
        fetch('/api/emotionflix', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                emotion: emotion
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('EmotionFlix API request failed');
            }
            return response.json();
        })
        .then(data => {
            // Reset the input field
            emotionInput.value = '';
            
            // Hide feedback
            emotionFeedback.textContent = '';
            
            // Display the emotional response
            displayEmotionalResponse(data);
            
            // Add AI response to chat history
            addToChatHistory('assistant', data.emotional_response);
        })
        .catch(error => {
            console.error('EmotionFlix error:', error);
            emotionFeedback.textContent = 'An error occurred while getting emotional recommendations. Please try again.';
        });
    }
    
    /**
     * Display emotional response from EmotionFlix
     */
    function displayEmotionalResponse(data) {
        // Hide initial content
        document.getElementById('initial-content').classList.add('d-none');
        
        // Display the emotional response
        emotionResponse.innerHTML = formatEmotionText(data.emotional_response);
        
        // Add available movies to recommendations
        displayAvailableMovies(data.available_movies);
        
        // Show the recommendations container
        emotionRecommendationsContainer.classList.remove('d-none');
        emotionRecommendationsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Display available movies in the recommendations section
     */
    function displayAvailableMovies(movies) {
        // Clear existing recommendations
        emotionRecommendations.innerHTML = '';
        
        // Add the movies to the recommendation section
        movies.forEach(movie => {
            const template = movieCardTemplate.content.cloneNode(true);
            const card = template.querySelector('.movie-card');
            
            card.dataset.movieId = movie.movieId;
            card.querySelector('.movie-title').textContent = cleanMovieTitle(movie.title);
            
            // Add genre tags
            const genresContainer = card.querySelector('.genres');
            addGenreTags(genresContainer, movie.genres);
            
            emotionRecommendations.appendChild(template);
        });
    }
    
    /**
     * Format the emotion text with line breaks
     */
    function formatEmotionText(text) {
        return text.replace(/\n/g, '<br>');
    }
    
    /**
     * Show the chat input for continuing conversation
     */
    function showChatInput() {
        // Check if chat input already exists
        if (document.getElementById('chat-message-input')) {
            document.getElementById('chat-message-input').focus();
            return;
        }
        
        // Create a new chat input from template
        const template = chatInputTemplate.content.cloneNode(true);
        emotionRecommendationsContainer.appendChild(template);
        
        // Add event listener to send button
        document.getElementById('chat-send-button').addEventListener('click', sendChatMessage);
        
        // Add event listener to input for Enter key
        document.getElementById('chat-message-input').addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                sendChatMessage();
            }
        });
        
        // Focus on the input
        document.getElementById('chat-message-input').focus();
    }
    
    /**
     * Send a chat message to EmotionFlix
     */
    function sendChatMessage() {
        const chatInput = document.getElementById('chat-message-input');
        const message = chatInput.value.trim();
        
        if (message.length === 0) {
            return;
        }
        
        // Add message to chat history
        addToChatHistory('user', message);
        
        // Clear input
        chatInput.value = '';
        
        // Show thinking indicator
        const thinkingMessage = document.createElement('div');
        thinkingMessage.classList.add('thinking-indicator', 'mb-3', 'text-center');
        thinkingMessage.innerHTML = '<div class="spinner-grow spinner-grow-sm text-primary me-2"></div> EmotionFlix is thinking...';
        emotionRecommendationsContainer.insertBefore(thinkingMessage, document.querySelector('.emotion-chat-input'));
        
        // Make request to EmotionFlix chat API
        fetch('/api/emotionflix/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('EmotionFlix chat request failed');
            }
            return response.json();
        })
        .then(data => {
            // Remove thinking indicator
            emotionRecommendationsContainer.removeChild(thinkingMessage);
            
            // Add AI response to chat history
            addToChatHistory('assistant', data.response);
        })
        .catch(error => {
            console.error('EmotionFlix chat error:', error);
            
            // Remove thinking indicator
            emotionRecommendationsContainer.removeChild(thinkingMessage);
            
            // Add error message
            addToChatHistory('assistant', 'I\'m sorry, I\'m having trouble connecting to my emotional intelligence. Please try again.');
        });
    }
    
    /**
     * Add a message to the chat history and display it
     */
    function addToChatHistory(role, message) {
        // Add to chat history
        chatHistory.push({ role, message });
        
        // Create a new chat message element
        const template = chatTemplate.content.cloneNode(true);
        const chatContainer = template.querySelector('.emotion-chat-container');
        const avatar = chatContainer.querySelector('.emotion-avatar i');
        
        // Set the avatar icon based on the role
        if (role === 'user') {
            avatar.classList.remove('fa-robot');
            avatar.classList.add('fa-user');
        } else {
            avatar.classList.remove('fa-user');
            avatar.classList.add('fa-robot');
        }
        
        // Set the message text
        chatContainer.querySelector('.chat-message').innerHTML = formatEmotionText(message);
        
        // Add to container before the chat input or continue button
        const chatInput = document.querySelector('.emotion-chat-input');
        if (chatInput) {
            emotionRecommendationsContainer.insertBefore(chatContainer, chatInput);
        } else {
            // Insert before the continue button container
            const continueBtn = document.getElementById('emotion-chat-continue').parentElement;
            emotionRecommendationsContainer.insertBefore(chatContainer, continueBtn);
        }
        
        // Scroll to the new message
        chatContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Clean movie title by removing year in parentheses
     */
    function cleanMovieTitle(title) {
        return title.replace(/\s*\(\d{4}\)$/, '');
    }
    
    /**
     * Add genre tags to a container
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
});