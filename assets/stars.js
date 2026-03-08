// Анимация звездного неба
const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');

let stars = [];
let shootingStars = [];

function initStars() {
    const starCount = 200;
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2,
            brightness: Math.random(),
            speed: 0.05 + Math.random() * 0.1
        });
    }
}

function createShootingStar() {
    if (Math.random() < 0.005 && shootingStars.length < 3) {
        shootingStars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.3,
            length: 50 + Math.random() * 50,
            speed: 5 + Math.random() * 5,
            angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
            life: 1
        });
    }
}

function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем обычные звезды
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
        
        // Мерцание звезд
        const brightness = star.brightness + Math.sin(Date.now() * star.speed) * 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.3, brightness)})`;
        ctx.fill();
        
        // Добавляем свечение для ярких звезд
        if (star.radius > 1) {
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            ctx.shadowBlur = 5;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });
    
    // Рисуем падающие звезды
    shootingStars = shootingStars.filter(star => {
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(
            star.x + Math.cos(star.angle) * star.length,
            star.y + Math.sin(star.angle) * star.length
        );
        ctx.strokeStyle = `rgba(255, 255, 255, ${star.life})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Обновляем позицию
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.life -= 0.01;
        
        return star.life > 0 && star.x < canvas.width + 100 && star.y < canvas.height + 100;
    });
}

function animate() {
    drawStars();
    createShootingStar();
    requestAnimationFrame(animate);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = [];
    initStars();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
initStars();
animate();