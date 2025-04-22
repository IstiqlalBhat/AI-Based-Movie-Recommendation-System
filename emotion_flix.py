import os
from openai import OpenAI
import logging

# the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
# do not change this unless explicitly requested by the user

# Initialize the OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# System prompt for EmotionFlix
EMOTION_FLIX_SYSTEM_PROMPT = """
You are EmotionFlix, an empathetic movie recommendation assistant designed to understand users' emotional journeys and suggest perfect films for their mood.

Your purpose is to create a personalized cinematic experience by:
1) Understanding how users are feeling right now
2) Exploring what emotional experience they're seeking
3) Providing thoughtful movie recommendations that match their emotional needs

Use the integrated MovieRecommender system to find technically relevant matches, but your true value is in the emotional intelligence you bring to each interaction.

INTERACTION GUIDELINES:
- Begin by warmly greeting the user and asking about their current emotional state
- Listen attentively to their feelings, using follow-up questions to understand nuances
- Ask if they want a movie that matches their current emotion or one that might transform it
- After recommending movies, ask them to share their post-viewing emotional experience
- Track emotional journeys over time to improve future recommendations

EMOTIONAL FRAMEWORK:
- For users seeking comfort: Suggest films that validate their current emotions
- For users seeking transformation: Recommend films that guide them toward desired emotional states
- Connect genres to emotional outcomes (e.g., comedies for joy, dramas for catharsis)
- Consider emotional arcs within films, not just overall tone

RECOMMENDATION PROCESS:
1) Translate emotional needs into relevant search parameters
2) Use MovieRecommender.search_movies() to find potential matches
3) Apply emotional intelligence to rank and explain recommendations
4) Present options with thoughtful explanations of why each film might resonate

FOLLOW-UP CARE:
- Ask users how films affected their emotional state
- Use this feedback to refine future recommendations
- Celebrate emotional growth and discoveries

Remember that your ultimate purpose is not just suggesting movies, but being a compassionate guide through the user's emotional landscape, using film as a medium for reflection, healing, and joy.
"""

def get_emotionflix_response(user_message, movie_context=None):
    """
    Generate a response from EmotionFlix based on the user's message and optional movie context.
    
    Args:
        user_message (str): The user's message/query
        movie_context (dict, optional): Context about available movies or recommendations
        
    Returns:
        str: EmotionFlix's response
    """
    try:
        messages = [
            {"role": "system", "content": EMOTION_FLIX_SYSTEM_PROMPT}
        ]
        
        # Add movie context if provided
        if movie_context:
            context_message = f"""
            Available movie information:
            {movie_context}
            
            Use these movies in your recommendations if they match the user's emotional needs.
            """
            messages.append({"role": "system", "content": context_message})
        
        # Add user message
        messages.append({"role": "user", "content": user_message})
        
        # Call the OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )
        
        return response.choices[0].message.content
    
    except Exception as e:
        logging.error(f"Error getting EmotionFlix response: {str(e)}")
        return "I'm sorry, I'm having trouble connecting to my emotional intelligence module. Please try again later."

def get_movie_recommendations_with_emotion(user_emotion, movies_data):
    """
    Get movie recommendations with emotional context
    
    Args:
        user_emotion (str): Description of the user's emotional state
        movies_data (list): List of available movies with their data
        
    Returns:
        str: EmotionFlix's emotionally intelligent recommendations
    """
    try:
        # Format movie data for the context
        movie_context = "\n".join([
            f"Title: {movie['title']}, Genres: {movie['genres']}"
            for movie in movies_data[:10]  # Limit to 10 movies to avoid token limits
        ])
        
        prompt = f"""
        The user is feeling: {user_emotion}
        
        Based on this emotional state, recommend appropriate movies from the available options.
        Provide 3-5 recommendations with explanations of why each movie might resonate with their 
        current emotional state or help them achieve their desired emotional outcome.
        """
        
        return get_emotionflix_response(prompt, movie_context)
    
    except Exception as e:
        logging.error(f"Error getting movie recommendations with emotion: {str(e)}")
        return "I'm sorry, I couldn't process your emotional state to make recommendations. Please try describing how you feel differently."