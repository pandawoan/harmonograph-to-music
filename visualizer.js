const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const circles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);

function createCircle(note) {
  const hue = ((note.charCodeAt(0) - 65) * 30) % 360; // Map note to color
  const saturation = 70 + Math.random() * 30;
  const lightness = 50 + Math.random() * 20;

  circles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: 10 + Math.random() * 40,
    color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    alpha: 1,
    velocity: {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
    },
  });
}

function updateAndDrawCircles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = circles.length - 1; i >= 0; i--) {
    const circle = circles[i];

    circle.x += circle.velocity.x;
    circle.y += circle.velocity.y;
    circle.alpha -= 0.01;

    if (circle.alpha <= 0) {
      circles.splice(i, 1);
      continue;
    }

    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    ctx.fillStyle = circle.color
      .replace(")", `, ${circle.alpha})`)
      .replace("rgb", "rgba");
    ctx.fill();
  }

  requestAnimationFrame(updateAndDrawCircles);
}

updateAndDrawCircles();

export function visualize(note) {
  createCircle(note);
}
