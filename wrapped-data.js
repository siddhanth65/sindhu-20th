// Sindhu Wrapped 2025 - Card Data
const wrappedData = {
    cards: [
        {
            id: 'restaurants',
            type: 'restaurants',
            icon: '🍜',
            stat: '12',
            caption: 'Korean nights & stolen fries',
            supportingImage: 'images/korean-food.jpg',
            backStory: 'From late-night kimchi cravings to that one time you "accidentally" finished my fries, every meal was an adventure. Remember the tiny Korean place that became our weekly ritual?',
            thumbnails: ['images/korean-1.jpg', 'images/korean-2.jpg', 'images/fries.jpg']
        },
        {
            id: 'travel',
            type: 'travel',
            icon: '✈️',
            stat: '3',
            caption: 'Venice canals, Swiss snow, Savannah sunsets',
            supportingImage: 'images/travel-collage.jpg',
            backStory: 'Three completely different worlds, each with its own magic. Venice where we got lost on purpose, Switzerland where the air felt like champagne, and Savannah where time decided to stand still just for us.',
            thumbnails: ['images/venice.jpg', 'images/switzerland.jpg', 'images/savannah.jpg']
        },
        {
            id: 'calories',
            type: 'calories',
            icon: '🍦',
            stat: '12,345',
            caption: 'Calories gained this year: 12,345 — worth it ;)',
            supportingImage: 'images/gelato.jpg',
            backStory: 'Approximately 12,345 calories consumed during "scientific" gelato experiments. Each scoop was research, every taste test was necessary. The conclusion? Happiness is calorie-free when shared.',
            thumbnails: ['images/gelato-1.jpg', 'images/gelato-2.jpg', 'images/desserts.jpg']
        },
        {
            id: 'projects',
            type: 'projects',
            icon: '🌙',
            stat: '7',
            caption: 'Projects finished at 11:59 PM — romance of deadlines',
            supportingImage: 'images/late-night.jpg',
            backStory: 'Seven projects completed in the final hour of deadlines. There\'s something magical about that 11:59 PM energy - coffee-fueled creativity and the quiet understanding that we\'re in this together, always.',
            thumbnails: ['images/project-1.jpg', 'images/project-2.jpg', 'images/coffee.jpg']
        },
        {
            id: 'ragebait',
            type: 'ragebait',
            icon: '🎯',
            stat: '82%',
            caption: 'Ragebait success % — you baited the algorithm 82% successfully',
            supportingImage: 'images/memes.jpg',
            backStory: '82% success rate in making the internet stop scrolling. Your memes weren\'t just content; they were cultural interventions. Each share was a small rebellion against the algorithm.',
            thumbnails: ['images/meme-1.jpg', 'images/meme-2.jpg', 'images/viral.jpg']
        },
        {
            id: 'photos',
            type: 'photos',
            icon: '📸',
            stat: '34',
            caption: 'Gorgeous photos taken — each one a story',
            supportingImage: 'images/photo-collage.jpg',
            backStory: 'Thirty-four moments frozen in time, each one more beautiful than the last. You don\'t just take pictures; you capture feelings, preserve laughter, and bottle sunlight.',
            thumbnails: ['images/photo-1.jpg', 'images/photo-2.jpg', 'images/photo-3.jpg']
        },
        {
            id: 'reasons',
            type: 'reasons',
            icon: '💝',
            stat: '∞',
            caption: 'Reasons you\'re loved — too many to count',
            supportingImage: 'images/heart.jpg',
            backStory: 'Infinite reasons, but here are a few: the way you laugh at my bad jokes, how you remember small details about everyone, your strength when things get tough, and the fact that you make ordinary moments feel extraordinary.',
            thumbnails: ['images/moment-1.jpg', 'images/moment-2.jpg', 'images/moment-3.jpg']
        }
    ],

    // Easter egg content for double-click
    easterEggs: {
        restaurants: 'That time you tried to teach me how to use chopsticks and I ended up wearing kimchi.',
        travel: 'Getting lost in Venice was the best thing that happened to us. Well, second best.',
        calories: 'Remember when we said "just one more scoop" seven times?',
        projects: '11:59 PM is basically your superpower.',
        ragebait: 'Your meme game is stronger than my will to be productive.',
        photos: 'You see beauty where others see ordinary moments.',
        reasons: 'The biggest reason: you\'re you, and that\'s more than enough.'
    },

    // Audio settings
    audio: {
        enabled: false, // Start muted
        volume: 0.3,
        fadeInDuration: 2000
    },

    // Animation settings
    animations: {
        cardFlipDuration: 600,
        carouselTransitionDuration: 800,
        particleCount: 30,
        parallaxStrength: 0.5
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = wrappedData;
}
