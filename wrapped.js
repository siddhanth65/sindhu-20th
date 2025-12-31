// Sindhu Wrapped 2025 - Main JavaScript
class SindhuWrapped {
    constructor() {
        this.currentIndex = 0;
        this.cards = [];
        this.isFlipped = false;
        this.isAnimating = false;
        this.particles = [];
        this.audioEnabled = false;
        this.touchStartX = 0;
        this.touchEndX = 0;

        this.init();
    }

    init() {
        this.setupElements();
        this.createCards();
        this.setupEventListeners();
        this.initParticleSystem();
        this.initParallax();
        this.initAudio();
        this.startAnimations();
    }

    setupElements() {
        this.cardsTrack = document.querySelector('.cards-track');
        this.paginationDots = document.querySelector('.pagination-dots');
        this.prevBtn = document.querySelector('.carousel-nav.prev');
        this.nextBtn = document.querySelector('.carousel-nav.next');
        this.audioToggle = document.getElementById('audioToggle');
        this.backgroundAudio = document.getElementById('backgroundAudio');
        this.easterEgg = document.getElementById('easterEgg');
        this.particleCanvas = document.getElementById('particleCanvas');
    }

    createCards() {
        wrappedData.cards.forEach((cardData, index) => {
            const card = this.createCard(cardData, index);
            this.cards.push(card);
            this.cardsTrack.appendChild(card.element);
        });

        this.createPaginationDots();
        this.updateCarousel();
    }

    createCard(cardData, index) {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${cardData.type}`;
        cardElement.dataset.index = index;
        cardElement.setAttribute('tabindex', '0');
        cardElement.setAttribute('role', 'article');
        cardElement.setAttribute('aria-label', `${cardData.caption} - ${cardData.stat}`);

        cardElement.innerHTML = `
      <div class="card-face card-front">
        <div class="card-header">
          <div class="card-icon">${cardData.icon}</div>
          <div class="card-stat">
            <div class="stat-number">${cardData.stat}</div>
            <div class="stat-caption">${cardData.caption}</div>
          </div>
          <img class="card-supporting" src="${cardData.supportingImage}" alt="${cardData.caption}" loading="lazy">
        </div>
      </div>
      <div class="card-face card-back">
        <div class="card-back-content">
          <div class="back-story">${cardData.backStory}</div>
          <div class="back-thumbnails">
            ${cardData.thumbnails.map(thumb => `
              <img class="thumbnail" src="${thumb}" alt="Memory thumbnail" loading="lazy">
            `).join('')}
          </div>
        </div>
      </div>
    `;

        return {
            element: cardElement,
            data: cardData,
            isFlipped: false
        };
    }

    createPaginationDots() {
        this.cards.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'dot';
            dot.dataset.index = index;
            dot.setAttribute('aria-label', `Go to card ${index + 1}`);
            dot.addEventListener('click', () => this.goToCard(index));
            this.paginationDots.appendChild(dot);
        });
    }

    setupEventListeners() {
        // Navigation
        this.prevBtn.addEventListener('click', () => this.previousCard());
        this.nextBtn.addEventListener('click', () => this.nextCard());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Touch/swipe support
        this.cardsTrack.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.cardsTrack.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Card interactions
        this.cards.forEach(card => {
            card.element.addEventListener('click', () => this.flipCard(card));
            card.element.addEventListener('dblclick', () => this.showEasterEgg(card));
        });

        // Audio control
        this.audioToggle.addEventListener('click', () => this.toggleAudio());

        // Easter egg close
        const easterEggClose = document.querySelector('.easter-egg-close');
        easterEggClose.addEventListener('click', () => this.hideEasterEgg());

        // Window resize
        window.addEventListener('resize', () => this.handleResize());

        // Visibility change for performance
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    handleKeyboard(e) {
        if (this.isAnimating) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.previousCard();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextCard();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.flipCard(this.cards[this.currentIndex]);
                break;
            case 'Escape':
                if (this.easterEgg.classList.contains('active')) {
                    this.hideEasterEgg();
                }
                break;
        }
    }

    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
    }

    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
    }

    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                this.nextCard();
            } else {
                this.previousCard();
            }
        }
    }

    previousCard() {
        if (this.isAnimating) return;

        const newIndex = this.currentIndex === 0 ? this.cards.length - 1 : this.currentIndex - 1;
        this.goToCard(newIndex);
    }

    nextCard() {
        if (this.isAnimating) return;

        const newIndex = this.currentIndex === this.cards.length - 1 ? 0 : this.currentIndex + 1;
        this.goToCard(newIndex);
    }

    goToCard(index) {
        if (this.isAnimating || index === this.currentIndex) return;

        this.isAnimating = true;
        this.currentIndex = index;
        this.updateCarousel();

        // Auto-flip the card after a short delay to show the back story
        setTimeout(() => {
            this.autoFlipCard(this.cards[this.currentIndex]);
        }, 1000);

        setTimeout(() => {
            this.isAnimating = false;
        }, wrappedData.animations.carouselTransitionDuration);
    }

    updateCarousel() {
        // Update card positions
        this.cards.forEach((card, index) => {
            card.element.classList.remove('center', 'prev', 'next', 'hidden');

            if (index === this.currentIndex) {
                card.element.classList.add('center');
            } else if (index === this.currentIndex - 1 || (this.currentIndex === 0 && index === this.cards.length - 1)) {
                card.element.classList.add('prev');
            } else if (index === this.currentIndex + 1 || (this.currentIndex === this.cards.length - 1 && index === 0)) {
                card.element.classList.add('next');
            } else {
                card.element.classList.add('hidden');
            }
        });

        // Update pagination
        document.querySelectorAll('.dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });

        // Update navigation buttons
        this.prevBtn.disabled = false;
        this.nextBtn.disabled = false;

        // Focus current card for accessibility
        this.cards[this.currentIndex].element.focus();
    }

    flipCard(card) {
        if (this.isAnimating) return;

        // Only allow flipping the center card
        if (card !== this.cards[this.currentIndex]) return;

        this.isAnimating = true;
        card.isFlipped = !card.isFlipped;
        card.element.classList.toggle('flipped', card.isFlipped);

        // Create confetti burst when flipping
        if (card.isFlipped) {
            this.createConfettiBurst(card.element);
            this.playCardSound();
        }

        setTimeout(() => {
            this.isAnimating = false;
        }, wrappedData.animations.cardFlipDuration);
    }

    autoFlipCard(card) {
        if (this.isAnimating) return;

        // Only allow flipping the center card
        if (card !== this.cards[this.currentIndex]) return;

        this.isAnimating = true;
        card.isFlipped = true;
        card.element.classList.add('flipped');

        // Create confetti burst when flipping
        this.createConfettiBurst(card.element);
        this.playCardSound();

        setTimeout(() => {
            this.isAnimating = false;
        }, wrappedData.animations.cardFlipDuration);
    }

    createConfettiBurst(cardElement) {
        const burst = document.createElement('div');
        burst.className = 'confetti-burst';

        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'confetti-particle';

            const angle = (i / 12) * Math.PI * 2;
            const distance = 100 + Math.random() * 100;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.background = this.getRandomConfettiColor();
            particle.style.animationDelay = `${Math.random() * 0.2}s`;

            burst.appendChild(particle);
        }

        cardElement.appendChild(burst);

        setTimeout(() => {
            burst.remove();
        }, 1000);
    }

    getRandomConfettiColor() {
        const colors = ['#E0B06A', '#C9B4FF', '#F6B7D9', '#F3EAFE', '#FF3C66'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    showEasterEgg(card) {
        const easterEggText = wrappedData.easterEggs[card.data.id];
        if (!easterEggText) return;

        const textElement = this.easterEgg.querySelector('.easter-egg-text');
        textElement.textContent = easterEggText;

        this.easterEgg.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideEasterEgg() {
        this.easterEgg.classList.remove('active');
        document.body.style.overflow = '';
    }

    initParticleSystem() {
        const ctx = this.particleCanvas.getContext('2d');
        let animationId;

        const resizeCanvas = () => {
            this.particleCanvas.width = window.innerWidth;
            this.particleCanvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Create particles
        for (let i = 0; i < wrappedData.animations.particleCount; i++) {
            this.particles.push(this.createParticle());
        }

        const animate = () => {
            ctx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);

            this.particles.forEach(particle => {
                this.updateParticle(particle);
                this.drawParticle(ctx, particle);
            });

            animationId = requestAnimationFrame(animate);
        };

        // Only run particle animation if not reduced motion
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            animate();
        }

        // Cleanup
        return () => {
            cancelAnimationFrame(animationId);
        };
    }

    createParticle() {
        return {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: 2 + Math.random() * 4,
            opacity: 0.1 + Math.random() * 0.3,
            color: this.getRandomParticleColor()
        };
    }

    getRandomParticleColor() {
        const colors = ['rgba(246, 183, 217, ', 'rgba(201, 180, 255, ', 'rgba(224, 176, 106, '];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    updateParticle(particle) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around screen
        if (particle.x < 0) particle.x = window.innerWidth;
        if (particle.x > window.innerWidth) particle.x = 0;
        if (particle.y < 0) particle.y = window.innerHeight;
        if (particle.y > window.innerHeight) particle.y = 0;

        // Gentle floating motion
        particle.vx += (Math.random() - 0.5) * 0.01;
        particle.vy += (Math.random() - 0.5) * 0.01;

        // Limit speed
        particle.vx = Math.max(-1, Math.min(1, particle.vx));
        particle.vy = Math.max(-1, Math.min(1, particle.vy));
    }

    drawParticle(ctx, particle) {
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color + particle.opacity + ')';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    initParallax() {
        const layers = document.querySelectorAll('.layer');

        const handleMouseMove = (e) => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            const mouseX = e.clientX / window.innerWidth - 0.5;
            const mouseY = e.clientY / window.innerHeight - 0.5;

            layers.forEach(layer => {
                const depth = parseFloat(layer.dataset.depth) || 0.5;
                const moveX = mouseX * depth * wrappedData.animations.parallaxStrength * 100;
                const moveY = mouseY * depth * wrappedData.animations.parallaxStrength * 100;

                layer.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });
        };

        document.addEventListener('mousemove', handleMouseMove);
    }

    initAudio() {
        // Set initial audio state
        this.backgroundAudio.volume = wrappedData.audio.volume;
        this.backgroundAudio.muted = true;

        // Try to enable audio on first user interaction
        const enableAudio = () => {
            if (!this.audioEnabled) {
                this.backgroundAudio.muted = false;
                this.backgroundAudio.play().catch(() => {
                    // Auto-play was prevented, keep muted
                });
                this.audioEnabled = true;
                this.updateAudioButton();
            }
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
        };

        document.addEventListener('click', enableAudio);
        document.addEventListener('touchstart', enableAudio);
    }

    toggleAudio() {
        if (this.audioEnabled) {
            this.backgroundAudio.muted = !this.backgroundAudio.muted;
        } else {
            this.backgroundAudio.muted = false;
            this.backgroundAudio.play().catch(() => {
                // Auto-play was prevented
                this.backgroundAudio.muted = true;
            });
            this.audioEnabled = true;
        }

        this.updateAudioButton();
    }

    updateAudioButton() {
        const icon = this.audioToggle.querySelector('.audio-icon');
        if (this.backgroundAudio.muted) {
            icon.textContent = '🔇';
        } else {
            icon.textContent = '🎵';
        }
    }

    playCardSound() {
        // Create a simple chime sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Audio API not supported or blocked
        }
    }

    handleResize() {
        // Recalculate particle positions on resize
        this.particles.forEach(particle => {
            if (particle.x > window.innerWidth) particle.x = window.innerWidth;
            if (particle.y > window.innerHeight) particle.y = window.innerHeight;
        });
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Pause animations when tab is not visible
            this.backgroundAudio.pause();
        } else {
            // Resume when tab becomes visible
            if (!this.backgroundAudio.muted) {
                this.backgroundAudio.play().catch(() => { });
            }
        }
    }

    startAnimations() {
        // Add entrance animations
        setTimeout(() => {
            document.querySelector('.wrapped-header').style.opacity = '1';
            document.querySelector('.wrapped-header').style.transform = 'translateY(0)';
        }, 100);

        setTimeout(() => {
            this.cards.forEach((card, index) => {
                setTimeout(() => {
                    card.element.style.opacity = '1';
                    card.element.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }, 600);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SindhuWrapped();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SindhuWrapped;
}
