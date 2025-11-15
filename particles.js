class ParticleText {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 100 };
        this.textElements = [];
        this.paused = false;
        this.startForming = false;
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        this.resizeCanvas();
        
        // Wait for fonts to load, then delay particle creation
        document.fonts.ready.then(() => {
            this.createParticles();
            // Delay before particles start moving to their positions
            setTimeout(() => {
                this.startForming = true;
            }, 2000); // 2 second delay before particles start forming
        });
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = document.body.scrollHeight;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            // Don't recreate particles on resize, just let them adjust
        });

        // Throttle mouse movement for performance
        let mouseTimeout;
        window.addEventListener('mousemove', (e) => {
            if (!mouseTimeout) {
                mouseTimeout = setTimeout(() => {
                    this.mouse.x = e.x;
                    this.mouse.y = e.y;
                    mouseTimeout = null;
                }, 16); // ~60fps
            }
        });
        
        // Pause animation when page is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.paused = true;
            } else {
                this.paused = false;
            }
        });
    }

    createParticles() {
        this.particles = [];
        this.textElements = [];

        // Get all elements with particle text
        const elements = document.querySelectorAll('[data-particle-text]');
        
        elements.forEach(element => {
            const text = element.getAttribute('data-particle-text');
            const rect = element.getBoundingClientRect();
            const scrollY = window.pageYOffset;
            
            // Calculate font size based on element
            const computedStyle = window.getComputedStyle(element);
            const fontSize = parseFloat(computedStyle.fontSize);
            
            // Use absolute positioning relative to document (includes scroll)
            this.textElements.push({
                text,
                x: rect.left + rect.width / 2,
                y: rect.top + scrollY + rect.height / 2,
                fontSize,
                element
            });
        });

        // Create particles for each text element
        this.textElements.forEach(textData => {
            this.createTextParticles(textData);
        });
    }

    createTextParticles(textData) {
        // Create temporary canvas for text measurement
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.font = `bold ${textData.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        const metrics = tempCtx.measureText(textData.text);
        const textWidth = metrics.width;
        const textHeight = textData.fontSize;
        
        tempCanvas.width = textWidth;
        tempCanvas.height = textHeight * 1.5;
        
        tempCtx.font = `bold ${textData.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        tempCtx.fillStyle = 'white';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText(textData.text, 0, textHeight * 0.75);
        
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const pixels = imageData.data;
        
        // Optimized gap for performance vs quality
        const gap = Math.max(2, Math.floor(textData.fontSize / 25));
        
        // First pass: identify edge pixels with thicker borders
        const edgePixels = [];
        const fillPixels = [];
        
        for (let y = 0; y < tempCanvas.height; y += gap) {
            for (let x = 0; x < tempCanvas.width; x += gap) {
                const index = (y * tempCanvas.width + x) * 4;
                const alpha = pixels[index + 3];
                
                if (alpha > 128) {
                    // Check if this is an edge pixel (with thicker detection)
                    const isEdge = this.isEdgePixel(pixels, x, y, tempCanvas.width, tempCanvas.height, 2);
                    
                    const posX = textData.x - textWidth / 2 + x;
                    const posY = textData.y - textHeight / 2 + y;
                    
                    if (isEdge) {
                        edgePixels.push({ x: posX, y: posY });
                    } else {
                        fillPixels.push({ x: posX, y: posY });
                    }
                }
            }
        }
        
        // Create static border particles
        edgePixels.forEach(pos => {
            const particle = new Particle(pos.x, pos.y, textData.fontSize, true);
            this.particles.push(particle);
        });
        
        // Create moving fill particles
        fillPixels.forEach(pos => {
            const particle = new Particle(pos.x, pos.y, textData.fontSize, false);
            this.particles.push(particle);
        });
    }
    
    isEdgePixel(pixels, x, y, width, height, thickness = 2) {
        const getAlpha = (px, py) => {
            if (px < 0 || px >= width || py < 0 || py >= height) return 0;
            return pixels[(py * width + px) * 4 + 3];
        };
        
        const currentAlpha = getAlpha(x, y);
        if (currentAlpha < 128) return false;
        
        // Check in a larger radius for thicker borders
        for (let dy = -thickness; dy <= thickness; dy++) {
            for (let dx = -thickness; dx <= thickness; dx++) {
                if (dx === 0 && dy === 0) continue;
                const alpha = getAlpha(x + dx, y + dy);
                if (alpha < 128) {
                    return true;
                }
            }
        }
        
        return false;
    }

    animate() {
        if (!this.paused) {
            // Clear with black background
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Update and draw particles
            for (let i = 0; i < this.particles.length; i++) {
                this.particles[i].canForm = this.startForming;
                this.particles[i].update(this.mouse);
                this.particles[i].draw(this.ctx);
            }
        }

        requestAnimationFrame(() => this.animate());
    }
}

class Particle {
    constructor(x, y, fontSize, isEdge = false) {
        this.baseX = x;
        this.baseY = y;
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * (document.body.scrollHeight || window.innerHeight);
        this.vx = 0;
        this.vy = 0;
        this.isEdge = isEdge;
        this.size = isEdge ? Math.random() * 0.4 + 1.0 : Math.random() * 0.6 + 0.5;
        this.density = Math.random() * 10 + 3;
        this.friction = isEdge ? 0.85 : 0.82;
        this.ease = isEdge ? 0.008 : 0.006; // Much slower formation speed
        this.formed = false;
        this.formThreshold = 2;
        this.canForm = false; // New flag to control when particle can start forming
        
        // Chaotic movement parameters (only for non-edge particles)
        this.angle = Math.random() * Math.PI * 2;
        this.angleSpeed = (Math.random() - 0.5) * 0.015;
        this.orbitRadius = Math.random() * 2 + 1;
        
        // Dark green color variations - brighter for edges
        const greenShade = isEdge ? Math.floor(Math.random() * 20) + 110 : Math.floor(Math.random() * 40) + 75;
        const alpha = isEdge ? 1.0 : 0.6 + Math.random() * 0.3;
        this.color = `rgba(${Math.floor(greenShade * 0.3)}, ${greenShade}, ${Math.floor(greenShade * 0.4)}, ${alpha})`;
    }

    update(mouse) {
        // Only start moving to position if canForm is true
        if (this.canForm) {
            // Calculate distance to base position
            const dx = this.baseX - this.x;
            const dy = this.baseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if particle has formed
            if (!this.formed && distance < this.formThreshold) {
                this.formed = true;
            }
            
            // Mouse interaction - push away
            const mouseDx = mouse.x - this.x;
            const mouseDy = mouse.y - this.y;
            const mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
            
            if (mouseDistance < mouse.radius) {
                const force = (mouse.radius - mouseDistance) / mouse.radius;
                const directionX = mouseDx / mouseDistance;
                const directionY = mouseDy / mouseDistance;
                
                this.vx -= directionX * force * this.density * 0.3;
                this.vy -= directionY * force * this.density * 0.3;
                this.formed = false;
            }
            
            if (this.formed) {
                if (this.isEdge) {
                    // Edge particles stay completely static at their position
                    const pullStrength = 0.5;
                    this.vx += dx * pullStrength;
                    this.vy += dy * pullStrength;
                    
                    // Almost no movement for edges
                    const maxSpeed = 0.1;
                    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    if (speed > maxSpeed) {
                        this.vx = (this.vx / speed) * maxSpeed;
                        this.vy = (this.vy / speed) * maxSpeed;
                    }
                } else {
                    // Fill particles move chaotically but stay within bounds
                    this.angle += this.angleSpeed;
                    
                    // Smaller chaotic circular motion around base
                    const targetX = this.baseX + Math.cos(this.angle) * this.orbitRadius * 2;
                    const targetY = this.baseY + Math.sin(this.angle) * this.orbitRadius * 2;
                    
                    this.vx += (targetX - this.x) * 0.04;
                    this.vy += (targetY - this.y) * 0.04;
                    
                    // Reduced random jitter
                    this.vx += (Math.random() - 0.5) * 0.3;
                    this.vy += (Math.random() - 0.5) * 0.3;
                    
                    // Lower velocity limit
                    const maxSpeed = 1.2;
                    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    if (speed > maxSpeed) {
                        this.vx = (this.vx / speed) * maxSpeed;
                        this.vy = (this.vy / speed) * maxSpeed;
                    }
                }
            } else {
                // Return to base position when not formed
                this.vx += dx * this.ease;
                this.vy += dy * this.ease;
            }
            
            // Apply friction
            this.vx *= this.friction;
            this.vy *= this.friction;
        } else {
            // Before forming starts, particles just float randomly
            this.vx += (Math.random() - 0.5) * 0.1;
            this.vy += (Math.random() - 0.5) * 0.1;
            
            // Keep them drifting slowly
            const maxDriftSpeed = 0.5;
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > maxDriftSpeed) {
                this.vx = (this.vx / speed) * maxDriftSpeed;
                this.vy = (this.vy / speed) * maxDriftSpeed;
            }
            
            this.vx *= 0.98;
            this.vy *= 0.98;
        }
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Only add glow to edge particles for performance
        if (this.isEdge) {
            ctx.shadowBlur = 3;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ParticleText();
});
