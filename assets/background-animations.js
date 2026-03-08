// Анимация вращающегося звездного неба на весь экран
class NightSkyAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.meteors = [];
        this.rotation = 0;
        this.rotationSpeed = 0.0002;
        
        this.init();
        this.animate();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.createStars();
        setInterval(() => this.createMeteor(), 3000);
    }
    
    resize() {
        // На весь экран всегда
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.createStars();
    }
    
    createStars() {
        this.stars = [];
        
        // Адаптивное количество звезд под любой экран
        const area = this.canvas.width * this.canvas.height;
        const starCount = Math.min(500, Math.floor(area / 4000));
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxDistance = Math.max(this.canvas.width, this.canvas.height) * 0.8;
        
        for (let i = 0; i < starCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * maxDistance;
            
            this.stars.push({
                angle: angle,
                distance: distance,
                radius: Math.random() * 3 + 1,
                brightness: 0.3 + Math.random() * 0.7,
                twinkleSpeed: 0.3 + Math.random() * 1,
                phase: Math.random() * Math.PI * 2,
                layer: 0.3 + Math.random() * 0.7
            });
        }
    }
    
    createMeteor() {
        if (this.meteors.length > 5) return;
        
        const directions = [
            { angle: Math.PI / 4 },
            { angle: 3 * Math.PI / 4 },
            { angle: Math.PI / 2 },
            { angle: Math.PI / 3 },
            { angle: 2 * Math.PI / 3 }
        ];
        
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        this.meteors.push({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height * 0.3,
            length: 50 + Math.random() * 80,
            speed: 5 + Math.random() * 8,
            angle: direction.angle,
            life: 0.8 + Math.random() * 0.3,
            width: 2 + Math.random() * 2,
            color: `rgba(255, ${200 + Math.random() * 55}, ${180 + Math.random() * 75}, `
        });
    }
    
    draw() {
        // Полная очистка каждым кадром
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Градиент на весь экран
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0f1a');
        gradient.addColorStop(0.5, '#1a1f2e');
        gradient.addColorStop(1, '#0f1420');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.rotation += this.rotationSpeed;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Звезды
        this.stars.forEach(star => {
            const starRotation = this.rotation * star.layer;
            const currentAngle = star.angle + starRotation;
            
            const x = centerX + Math.cos(currentAngle) * star.distance;
            const y = centerY + Math.sin(currentAngle) * star.distance;
            
            if (x >= 0 && x <= this.canvas.width && y >= 0 && y <= this.canvas.height) {
                const twinkle = Math.sin(Date.now() * star.twinkleSpeed * 0.001 + star.phase) * 0.2;
                const brightness = Math.max(0.2, star.brightness + twinkle);
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, star.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
                this.ctx.fill();
            }
        });
        
        // Метеоры
        this.meteors = this.meteors.filter(meteor => {
            const tailLength = meteor.length * meteor.life;
            const endX = meteor.x - Math.cos(meteor.angle) * tailLength;
            const endY = meteor.y - Math.sin(meteor.angle) * tailLength;
            
            const gradient = this.ctx.createLinearGradient(
                meteor.x, meteor.y, endX, endY
            );
            gradient.addColorStop(0, meteor.color + meteor.life + ')');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.beginPath();
            this.ctx.moveTo(meteor.x, meteor.y);
            this.ctx.lineTo(endX, endY);
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = meteor.width * meteor.life;
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.arc(meteor.x, meteor.y, meteor.width * 1.2, 0, Math.PI * 2);
            this.ctx.fillStyle = meteor.color + meteor.life + ')';
            this.ctx.fill();
            
            meteor.x += Math.cos(meteor.angle) * meteor.speed;
            meteor.y += Math.sin(meteor.angle) * meteor.speed;
            meteor.life -= 0.003;
            
            return meteor.life > 0.1 && 
                   meteor.x > -100 && 
                   meteor.x < this.canvas.width + 100 &&
                   meteor.y < this.canvas.height + 100;
        });
        
        requestAnimationFrame(() => this.draw());
    }
    
    animate() {
        this.draw();
    }
}

// Создаем анимацию
const nightSky = new NightSkyAnimation('stars');