const centerX = 100; // h
const centerY = -100; // k
const radius = 100; // r

const dots = [];

for (let i = 0; i < 12; i++) {
  const angle = (2 * Math.PI * i) / 12;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  dots.push({ x, y });
}

console.log(dots);