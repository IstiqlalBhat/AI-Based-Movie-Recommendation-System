/**
 * DALL-E 3 Dynamic Background Generator
 * This script fetches or generates custom movie-themed backgrounds using OpenAI's DALL-E 3
 */

document.addEventListener('DOMContentLoaded', function() {
    // Background configuration
    const backgroundConfig = {
        // Initial background
        defaultBackground: "linear-gradient(135deg, rgba(255, 240, 245, 0.9) 0%, rgba(255, 228, 225, 0.8) 100%)",
        
        // Whether to use DALL-E generated backgrounds
        useDynamicBackgrounds: true,
        
        // Elements that will have the dynamic background
        backgroundElement: document.querySelector('.cinema-bg'),
        
        // Prompts for DALL-E to generate backgrounds themed around fuscia pink and red
        backgroundPrompts: [
            "Abstract cinematic background with flowing fuscia pink and deep red gradients, subtle film reel elements",
            "Modern movie theater atmosphere with elegant fuscia pink and red lighting, minimal abstract design",
            "Artistic representation of cinema experience with fuscia pink and red tones, subtle popcorn and movie elements",
            "Digital art of film elements with fuscia pink and bright red colors, abstract pattern for a movie website background",
            "Dreamy cinema-themed pattern with fuscia pink and cherry red colors, subtle film strip motifs"
        ],
        
        // Cache key for storing backgrounds in localStorage
        cacheKey: 'istiqlal_movie_backgrounds',
        
        // How long to cache backgrounds (in milliseconds) - 7 days
        cacheDuration: 7 * 24 * 60 * 60 * 1000,
    };
    
    /**
     * Initialize the dynamic backgrounds
     */
    function initDynamicBackgrounds() {
        // Skip if we shouldn't use dynamic backgrounds
        if (!backgroundConfig.useDynamicBackgrounds) {
            return;
        }
        
        // Try to get cached backgrounds first
        const cachedBackgrounds = getCachedBackgrounds();
        
        if (cachedBackgrounds && cachedBackgrounds.length > 0) {
            // Use a cached background
            applyRandomBackground(cachedBackgrounds);
        } else {
            // Set default background initially
            setDefaultBackground();
            
            // Generate new background
            generateNewBackground();
        }
    }
    
    /**
     * Apply the default gradient background
     */
    function setDefaultBackground() {
        if (backgroundConfig.backgroundElement) {
            backgroundConfig.backgroundElement.style.background = backgroundConfig.defaultBackground;
        }
    }
    
    /**
     * Apply a random background from the provided URLs
     */
    function applyRandomBackground(backgroundUrls) {
        if (!backgroundConfig.backgroundElement || !backgroundUrls || backgroundUrls.length === 0) {
            return;
        }
        
        // Select a random background
        const randomIndex = Math.floor(Math.random() * backgroundUrls.length);
        const selectedBackground = backgroundUrls[randomIndex];
        
        // Create a new image to preload
        const img = new Image();
        
        // When image loads, apply it as background
        img.onload = function() {
            backgroundConfig.backgroundElement.style.background = `linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4)), url(${selectedBackground})`;
            backgroundConfig.backgroundElement.style.backgroundSize = 'cover';
            backgroundConfig.backgroundElement.style.backgroundPosition = 'center';
            backgroundConfig.backgroundElement.style.opacity = 0;
            
            // Fade in the background
            setTimeout(() => {
                backgroundConfig.backgroundElement.style.transition = 'opacity 1s ease-in-out';
                backgroundConfig.backgroundElement.style.opacity = 1;
            }, 100);
        };
        
        // Handle load errors
        img.onerror = function() {
            console.error("Error loading background image");
            setDefaultBackground();
        };
        
        // Start loading the image
        img.src = selectedBackground;
    }
    
    /**
     * Generate a new background using the OpenAI DALL-E 3 API
     */
    function generateNewBackground() {
        // Select a random prompt
        const randomPrompt = backgroundConfig.backgroundPrompts[
            Math.floor(Math.random() * backgroundConfig.backgroundPrompts.length)
        ];
        
        // Make request to backend API endpoint (to be implemented on the server)
        fetch('/api/generate-background', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: randomPrompt
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Background generation failed');
            }
            return response.json();
        })
        .then(data => {
            if (data.url) {
                // Add the new background to cache
                addBackgroundToCache(data.url);
                
                // Apply the new background
                applyRandomBackground([data.url]);
            } else {
                setDefaultBackground();
            }
        })
        .catch(error => {
            console.error('Error generating background:', error);
            setDefaultBackground();
        });
    }
    
    /**
     * Get cached backgrounds from localStorage
     */
    function getCachedBackgrounds() {
        try {
            const cached = localStorage.getItem(backgroundConfig.cacheKey);
            
            if (!cached) {
                return null;
            }
            
            const cacheData = JSON.parse(cached);
            
            // Check if cache is still valid
            if (Date.now() > cacheData.expiry) {
                // Cache expired
                localStorage.removeItem(backgroundConfig.cacheKey);
                return null;
            }
            
            return cacheData.backgrounds;
        } catch (error) {
            console.error('Error getting cached backgrounds:', error);
            return null;
        }
    }
    
    /**
     * Add a background URL to the cache
     */
    function addBackgroundToCache(backgroundUrl) {
        try {
            // Get existing cache or create new
            let cacheData = {
                expiry: Date.now() + backgroundConfig.cacheDuration,
                backgrounds: []
            };
            
            const existingCache = getCachedBackgrounds();
            if (existingCache) {
                cacheData.backgrounds = existingCache;
            }
            
            // Add new background if not already cached
            if (!cacheData.backgrounds.includes(backgroundUrl)) {
                cacheData.backgrounds.push(backgroundUrl);
                
                // Save to localStorage
                localStorage.setItem(
                    backgroundConfig.cacheKey,
                    JSON.stringify(cacheData)
                );
            }
        } catch (error) {
            console.error('Error adding background to cache:', error);
        }
    }
    
    // Initialize background generation
    initDynamicBackgrounds();
});