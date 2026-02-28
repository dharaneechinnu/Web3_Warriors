/**
 * Certificate Generator — renders a professional certificate on an HTML5 Canvas
 * and triggers a PNG download. No external libraries required.
 */

const CERT_WIDTH = 1600;
const CERT_HEIGHT = 1130;

/**
 * Draw & download a certificate image.
 *
 * @param {object} opts
 * @param {string} opts.learnerName
 * @param {string} opts.courseName
 * @param {string} opts.mentorName
 * @param {string} opts.certificateId
 * @param {string} opts.completedDate   ISO date string
 * @param {string} [opts.grade]
 */
export function downloadCertificate({
  learnerName = 'Learner',
  courseName = 'Course',
  mentorName = 'Instructor',
  certificateId = '',
  completedDate = new Date().toISOString(),
  grade = 'Pass',
}) {
  const canvas = document.createElement('canvas');
  canvas.width = CERT_WIDTH;
  canvas.height = CERT_HEIGHT;
  const ctx = canvas.getContext('2d');

  /* ── background ─────────────────────────────────────────────── */
  // Outer fill
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, CERT_WIDTH, CERT_HEIGHT);

  // Inner cream area
  const pad = 32;
  roundRect(ctx, pad, pad, CERT_WIDTH - pad * 2, CERT_HEIGHT - pad * 2, 24);
  ctx.fillStyle = '#fefce8';
  ctx.fill();

  /* ── decorative border ──────────────────────────────────────── */
  const bPad = 52;
  roundRect(ctx, bPad, bPad, CERT_WIDTH - bPad * 2, CERT_HEIGHT - bPad * 2, 16);
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner thin border
  const bPad2 = 62;
  roundRect(ctx, bPad2, bPad2, CERT_WIDTH - bPad2 * 2, CERT_HEIGHT - bPad2 * 2, 12);
  ctx.strokeStyle = '#daa520';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  /* ── corner accents ─────────────────────────────────────────── */
  drawCornerAccents(ctx, bPad + 6, bPad + 6, CERT_WIDTH - (bPad + 6) * 2, CERT_HEIGHT - (bPad + 6) * 2);

  /* ── top decoration line ────────────────────────────────────── */
  const grad = ctx.createLinearGradient(300, 0, CERT_WIDTH - 300, 0);
  grad.addColorStop(0, 'rgba(184,134,11,0)');
  grad.addColorStop(0.3, '#b8860b');
  grad.addColorStop(0.5, '#daa520');
  grad.addColorStop(0.7, '#b8860b');
  grad.addColorStop(1, 'rgba(184,134,11,0)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, 115);
  ctx.lineTo(CERT_WIDTH - 200, 115);
  ctx.stroke();

  /* ── header: "CERTIFICATE OF COMPLETION" ────────────────────── */
  const cx = CERT_WIDTH / 2;

  // Small top label
  ctx.fillStyle = '#b8860b';
  ctx.font = '600 18px "Segoe UI", "Helvetica Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '8px';
  ctx.fillText('★  Govt Certificate  ★', cx, 160);

  // Main heading
  ctx.fillStyle = '#1e293b';
  ctx.font = '700 52px "Georgia", "Times New Roman", serif';
  ctx.fillText('Certificate of Completion', cx, 240);

  // Decorative divider
  const grad2 = ctx.createLinearGradient(500, 0, CERT_WIDTH - 500, 0);
  grad2.addColorStop(0, 'rgba(184,134,11,0)');
  grad2.addColorStop(0.5, '#daa520');
  grad2.addColorStop(1, 'rgba(184,134,11,0)');
  ctx.strokeStyle = grad2;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(500, 265);
  ctx.lineTo(CERT_WIDTH - 500, 265);
  ctx.stroke();

  /* ── "This is awarded to" ───────────────────────────────────── */
  ctx.fillStyle = '#64748b';
  ctx.font = '400 20px "Segoe UI", "Helvetica Neue", sans-serif';
  ctx.fillText('This certificate is proudly awarded to', cx, 320);

  /* ── learner name ───────────────────────────────────────────── */
  ctx.fillStyle = '#1e3a5f';
  ctx.font = '700 56px "Georgia", "Times New Roman", serif';
  ctx.fillText(learnerName, cx, 400);

  // Underline below name
  const nameWidth = ctx.measureText(learnerName).width;
  ctx.strokeStyle = '#daa520';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - nameWidth / 2 - 30, 418);
  ctx.lineTo(cx + nameWidth / 2 + 30, 418);
  ctx.stroke();

  /* ── "for successfully completing" ──────────────────────────── */
  ctx.fillStyle = '#64748b';
  ctx.font = '400 20px "Segoe UI", "Helvetica Neue", sans-serif';
  ctx.fillText('for successfully completing the course', cx, 470);

  /* ── course name ────────────────────────────────────────────── */
  ctx.fillStyle = '#7c3aed';
  ctx.font = '700 40px "Georgia", "Times New Roman", serif';
  // Wrap if too long
  const maxCourseWidth = CERT_WIDTH - 300;
  const courseLines = wrapText(ctx, courseName, maxCourseWidth);
  let courseY = 530;
  courseLines.forEach((line) => {
    ctx.fillText(line, cx, courseY);
    courseY += 50;
  });

  /* ── date and grade ─────────────────────────────────────────── */
  const infoY = courseY + 40;
  ctx.fillStyle = '#475569';
  ctx.font = '400 18px "Segoe UI", "Helvetica Neue", sans-serif';
  const dateStr = new Date(completedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  ctx.fillText(`Completed on ${dateStr}  •  Grade: ${grade}`, cx, infoY);

  /* ── bottom section: signature lines ────────────────────────── */
  const sigY = CERT_HEIGHT - 220;

  // Divider line
  const grad3 = ctx.createLinearGradient(200, 0, CERT_WIDTH - 200, 0);
  grad3.addColorStop(0, 'rgba(184,134,11,0)');
  grad3.addColorStop(0.5, '#daa520');
  grad3.addColorStop(1, 'rgba(184,134,11,0)');
  ctx.strokeStyle = grad3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, sigY - 30);
  ctx.lineTo(CERT_WIDTH - 200, sigY - 30);
  ctx.stroke();

  // Mentor signature (left)
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(280, sigY + 40);
  ctx.lineTo(560, sigY + 40);
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.font = '600 22px "Georgia", "Times New Roman", serif';
  ctx.fillText(mentorName, 420, sigY + 30);

  ctx.fillStyle = '#64748b';
  ctx.font = '400 16px "Segoe UI", "Helvetica Neue", sans-serif';
  ctx.fillText('Course Instructor', 420, sigY + 66);

  // Platform signature (right)
  ctx.strokeStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(CERT_WIDTH - 560, sigY + 40);
  ctx.lineTo(CERT_WIDTH - 280, sigY + 40);
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.font = '600 22px "Georgia", "Times New Roman", serif';
  ctx.fillText('HackVerse Academy', CERT_WIDTH - 420, sigY + 30);

  ctx.fillStyle = '#64748b';
  ctx.font = '400 16px "Segoe UI", "Helvetica Neue", sans-serif';
  ctx.fillText('Platform', CERT_WIDTH - 420, sigY + 66);

  /* ── certificate ID ─────────────────────────────────────────── */
  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 14px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Certificate ID: ${certificateId}`, cx, CERT_HEIGHT - 80);

  /* ── seal / badge ───────────────────────────────────────────── */
  drawSeal(ctx, cx, sigY - 5, 42);

  /* ── download ───────────────────────────────────────────────── */
  const link = document.createElement('a');
  link.download = `Certificate_${courseName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ── utility: rounded rectangle ───────────────────────────────── */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/* ── utility: corner accent decorations ───────────────────────── */
function drawCornerAccents(ctx, x, y, w, h) {
  const len = 30;
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 3;
  const corners = [
    [x, y, x + len, y, x, y + len],           // top-left
    [x + w, y, x + w - len, y, x + w, y + len],   // top-right
    [x, y + h, x + len, y + h, x, y + h - len],   // bottom-left
    [x + w, y + h, x + w - len, y + h, x + w, y + h - len], // bottom-right
  ];
  corners.forEach(([cx, cy, hx, hy, vx, vy]) => {
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(vx, vy);
    ctx.stroke();
  });
}

/* ── utility: draw a gold seal / badge ────────────────────────── */
function drawSeal(ctx, x, y, r) {
  const points = 16;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.72;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  const sealGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
  sealGrad.addColorStop(0, '#ffd700');
  sealGrad.addColorStop(0.7, '#daa520');
  sealGrad.addColorStop(1, '#b8860b');
  ctx.fillStyle = sealGrad;
  ctx.fill();
  ctx.strokeStyle = '#8b6914';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner circle
  ctx.beginPath();
  ctx.arc(x, y, r * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = '#fef3c7';
  ctx.fill();
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Check mark inside
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 1);
  ctx.lineTo(x - 2, y + 8);
  ctx.lineTo(x + 10, y - 6);
  ctx.stroke();
  ctx.restore();
}

/* ── utility: word-wrap text ──────────────────────────────────── */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines;
}
