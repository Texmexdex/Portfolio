// Animated side columns
class SideColumn {
    constructor(canvasId, side) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found:', canvasId);
            return;
        }
        
        console.log('Initializing side column:', canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.side = side;
        this.waves = [];
        this.spirals = [];
        this.time = 0;
        
        this.init();
        this.animate();
    }
    
    init() {
        this.canvas.width = 120;
        this.canvas.height = window.innerHeight;
        
        // Create multiple flowing waves
        for (let i = 0; i < 3; i++) {
            this.waves.push({
                offset: i * 100,
                speed: 0.02 + i * 0.01,
                amplitude: 20 + i * 10,
                frequency: 0.01 + i * 0.005
            });
        }
        
        // Create spiral points
        for (let i = 0; i < 5; i++) {
            this.spirals.push({
                y: i * 200,
                speed: 0.5 + i * 0.2,
                radius: 15 + i * 5
            });
        }
        
        window.addEventListener('resize', () => {
            this.canvas.height = window.innerHeight;
        });
    }
    
    animate() {
        this.time += 0.016;
        
        // Clear with fade effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw flowing waves
        this.waves.forEach((wave, index) => {
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(95, 175, 127, ${0.3 - index * 0.08})`;
            this.ctx.lineWidth = 2;
            
            for (let y = 0; y < this.canvas.height; y += 5) {
                const x = 60 + Math.sin((y + this.time * 100) * wave.frequency + wave.offset) * wave.amplitude;
                
                if (y === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.stroke();
        });
        
        // Draw spiraling particles
        this.spirals.forEach((spiral, index) => {
            const y = (spiral.y + this.time * spiral.speed * 50) % this.canvas.height;
            const angle = this.time * 2 + index;
            const x = 60 + Math.cos(angle) * spiral.radius;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(95, 175, 127, ${0.6 - index * 0.1})`;
            this.ctx.fill();
            
            // Draw connecting lines
            if (index > 0) {
                const prevSpiral = this.spirals[index - 1];
                const prevY = (prevSpiral.y + this.time * prevSpiral.speed * 50) % this.canvas.height;
                const prevAngle = this.time * 2 + (index - 1);
                const prevX = 60 + Math.cos(prevAngle) * prevSpiral.radius;
                
                const distance = Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2));
                
                if (distance < 150) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(prevX, prevY);
                    this.ctx.lineTo(x, y);
                    this.ctx.strokeStyle = `rgba(95, 175, 127, ${0.2 * (1 - distance / 150)})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        });
        
        // Draw vertical flowing lines
        for (let i = 0; i < 3; i++) {
            const x = 30 + i * 30;
            const offset = this.time * 50 + i * 100;
            
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(95, 175, 127, ${0.15 - i * 0.03})`;
            this.ctx.lineWidth = 1;
            
            for (let y = 0; y < this.canvas.height; y += 20) {
                const wave = Math.sin((y + offset) * 0.02) * 5;
                
                if (y === 0) {
                    this.ctx.moveTo(x + wave, y);
                } else {
                    this.ctx.lineTo(x + wave, y);
                }
            }
            
            this.ctx.stroke();
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// Simple script for smooth scrolling and parallax
document.addEventListener('DOMContentLoaded', () => {
    // Initialize side columns
    new SideColumn('leftColumn', 'left');
    new SideColumn('rightColumn', 'right');
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add subtle parallax effect to header
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const header = document.querySelector('.header');
                if (header) {
                    const scrolled = window.pageYOffset;
                    header.style.transform = `translateY(${scrolled * 0.3}px)`;
                    header.style.opacity = 1 - (scrolled / 500);
                }
                ticking = false;
            });
            ticking = true;
        }
    });
});
