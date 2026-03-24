const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

const TEMPLATE_PATH = path.resolve(__dirname, '..', 'assets', 'banner_template.png');
const EMPLOYEE_PATH = path.resolve(__dirname, '..', 'assets', 'employee.png');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'uploads', 'job-banners');
const FONT_REGULAR = path.resolve(__dirname, '..', 'assets', 'fonts', 'Poppins-Medium.ttf');
const FONT_BOLD = path.resolve(__dirname, '..', 'assets', 'fonts', 'Poppins-SemiBold.ttf');

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 1024;

const HEADER_HEIGHT = 80;
const HEADER_TITLE_X = 380;
const HEADER_TITLE_Y = 22;
const HEADER_TITLE_MAX_WIDTH = 500;
const HEADER_DATE_RIGHT_X = 875;
const HEADER_DATE_Y = 54;
const LEFT_X = 70;
const LEFT_Y = 155;
const TEXT_MAX_WIDTH = 520;
const IMAGE_X = 640;
const IMAGE_Y = 170;
const IMAGE_WIDTH = 300;
const IMAGE_HEIGHT = 720;
const CONTACT_BOX_Y = 610;

const ensureDir = async (dirPath) => {
  await fs.promises.mkdir(dirPath, { recursive: true });
};

const registerFonts = () => {
  if (fs.existsSync(FONT_REGULAR)) {
    registerFont(FONT_REGULAR, { family: 'Poppins', weight: '500' });
  }
  if (fs.existsSync(FONT_BOLD)) {
    registerFont(FONT_BOLD, { family: 'Poppins', weight: '600' });
  }
};

const loadFonts = async () => {
  registerFonts();
};

const formatEmploymentType = (jobType) => {
  const labels = {
    'full-time': 'Full Time',
    'part-time': 'Part Time',
    contract: 'Contract',
    internship: 'Internship',
    remote: 'Remote'
  };
  return labels[jobType] || jobType || 'Not specified';
};

const formatExperience = (experience) => {
  const labels = {
    entry: 'Entry Level (0-1 years)',
    mid: 'Mid Level (2-5 years)',
    senior: 'Senior Level (5+ years)',
    lead: 'Lead (7+ years)',
    executive: 'Executive (10+ years)'
  };
  return labels[experience] || experience || 'Not specified';
};

const drawLine = (ctx, text, x, y, font, color = '#1f2937', maxWidth = TEXT_MAX_WIDTH) => {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.fillText(String(text || ''), x, y, maxWidth);
};

const formatPostedDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const generateJobBanner = async (jobData) => {
  await loadFonts();
  await ensureDir(OUTPUT_DIR);

  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Banner template not found at ${TEMPLATE_PATH}`);
  }

  const hasTemplate = fs.existsSync(TEMPLATE_PATH);
  const template = hasTemplate ? await loadImage(TEMPLATE_PATH) : null;
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.textBaseline = 'top';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (template) {
    ctx.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#f7f7fb');
    gradient.addColorStop(1, '#eef2f7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  const companyName = jobData.company || jobData.companyName || 'Company';
  const title = jobData.title || 'Job Title';
  const openings = jobData.openings ? String(jobData.openings) : 'Not specified';
  const experience = formatExperience(jobData.experience);
  const location = jobData.location || 'Remote';
  const employmentType = formatEmploymentType(jobData.jobType);
  // Header text (yellow bar is already in the template)
  ctx.font = '600 28px "Poppins", Arial';
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'left';
  ctx.fillText('Fresher Hiring News from Jankoti.com', HEADER_TITLE_X, HEADER_TITLE_Y, HEADER_TITLE_MAX_WIDTH);
  const postedDate = formatPostedDate(jobData.createdAt);
  if (postedDate) {
    ctx.font = '500 18px "Poppins", Arial';
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'right';
    ctx.fillText(`Posted on ${postedDate}`, HEADER_DATE_RIGHT_X, HEADER_DATE_Y);
  }
  ctx.textAlign = 'left';

  // Candidate image is already part of the template. Only draw a separate image
  // when no template is available.
  if (!template && fs.existsSync(EMPLOYEE_PATH)) {
    const employeeImage = await loadImage(EMPLOYEE_PATH);
    ctx.save();
    ctx.beginPath();
    ctx.rect(IMAGE_X, IMAGE_Y, IMAGE_WIDTH, IMAGE_HEIGHT);
    ctx.clip();
    ctx.drawImage(employeeImage, IMAGE_X, IMAGE_Y, IMAGE_WIDTH, IMAGE_HEIGHT);
    ctx.restore();
  }

  // Company + Job Title
  drawLine(
    ctx,
    `${companyName} hiring for`,
    LEFT_X,
    LEFT_Y,
    '500 32px "Poppins", Arial',
    '#ffffff'
  );

  ctx.fillStyle = '#F4B400';
  ctx.font = '600 56px "Poppins", Arial';
  const titleY = 195;
  ctx.fillText(String(title || ''), LEFT_X, titleY, TEXT_MAX_WIDTH);

  // Job details section
  let detailY = 310;
  const lineGap = 48;
  ctx.fillStyle = '#1f2937';
  ctx.font = '500 24px "Poppins", Arial';
  drawLine(ctx, `No Of Position : ${openings}`, LEFT_X, detailY, ctx.font, '#1f2937', TEXT_MAX_WIDTH);
  detailY += lineGap;
  drawLine(ctx, `Experience Req : ${experience}`, LEFT_X, detailY, ctx.font, '#1f2937', TEXT_MAX_WIDTH);
  detailY += lineGap;
  drawLine(ctx, `Work Location : ${location}`, LEFT_X, detailY, ctx.font, '#1f2937', TEXT_MAX_WIDTH);
  detailY += lineGap;
  drawLine(ctx, `Employment Type : ${employmentType}`, LEFT_X, detailY, ctx.font, '#1f2937', TEXT_MAX_WIDTH);

  // Divider line
  const dividerY = 520;
  ctx.strokeStyle = '#F4B400';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(LEFT_X, dividerY);
  ctx.lineTo(LEFT_X + TEXT_MAX_WIDTH, dividerY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Kindly Note section (single line)
  drawLine(
    ctx,
    'Kindly Note: Immediate Joiners Preferred',
    LEFT_X,
    dividerY + 28,
    '600 22px "Poppins", Arial',
    '#1f2937'
  );

  // Contact box
  const boxX = LEFT_X;
  const boxY = CONTACT_BOX_Y;
  const boxW = 480;
  const boxH = 110;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#F4B400';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(boxX, boxY, boxW, boxH);
  ctx.fill();
  ctx.stroke();

  const contactX = boxX + 30;
  drawLine(
    ctx,
    `Email: ${jobData.email || 'Not provided'}`,
    contactX,
    boxY + 22,
    '600 22px "Poppins", Arial',
    '#1f2937',
    boxW - 60
  );
  drawLine(
    ctx,
    `Phone: ${jobData.phone || 'Not provided'}`,
    contactX,
    boxY + 58,
    '400 22px "Poppins", Arial',
    '#1f2937',
    boxW - 60
  );

  const safeId = String(jobData._id || jobData.id || Date.now()).replace(/[^a-z0-9-_]/gi, '');
  const fileName = `job-banner-${safeId || Date.now()}.png`;
  const outputPath = path.join(OUTPUT_DIR, fileName);
  await fs.promises.writeFile(outputPath, canvas.toBuffer('image/png'));

  return outputPath;
};

module.exports = {
  generateJobBanner
};
