import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

async function run() {
  const outputDir = path.resolve(process.cwd(), '.playwright-cli');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Launching Chromium for 3D Lab verification...');
  const executablePath =
    '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

  // Step 1: Load Global Moon on 3D Lab route
  console.log('Navigating to http://localhost:3000/scenario/3d-lab...');
  await page.goto('http://localhost:3000/scenario/3d-lab', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(outputDir, 'lab-3d-1-initial-nadir.png') });
  console.log('Saved lab-3d-1-initial-nadir.png');

  // Step 2: Switch to Global Preset
  console.log('Selecting Global preset...');
  const globalBtn = page.getByRole('button', { name: 'Global', exact: true });
  await globalBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outputDir, 'lab-3d-2-global.png') });
  console.log('Saved lab-3d-2-global.png');

  // Step 3: Switch to Mode A: South Pole preset
  console.log('Selecting South Pole preset (Mode A)...');
  const poleBtn = page.getByRole('button', { name: 'South Pole', exact: true });
  await poleBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outputDir, 'lab-3d-3-southpole.png') });
  console.log('Saved lab-3d-3-southpole.png');

  // Step 4: Zoom into Candidate Site (Mode B: Candidate Overview)
  console.log('Selecting Candidate preset (Mode B)...');
  const siteBtn = page.getByRole('button', { name: 'Candidate', exact: true });
  await siteBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outputDir, 'lab-3d-4-candidate-overview.png') });
  console.log('Saved lab-3d-4-candidate-overview.png');

  // Step 5: Continue zooming into Local Inspection (Mode C: Local Inspection)
  console.log('Selecting Inspect preset (Mode C: Deep Zoom)...');
  const inspectBtn = page.getByRole('button', { name: 'Inspect', exact: true });
  await inspectBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outputDir, 'lab-3d-5-local-inspection.png') });
  console.log('Saved lab-3d-5-local-inspection.png');

  // Step 6: Orbit left/right at deepest zoom
  console.log('Simulating orbit drag at deep zoom...');
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (box) {
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 120, startY - 30, { steps: 10 });
    await page.mouse.up();
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outputDir, 'lab-3d-6-deep-orbit.png') });
  console.log('Saved lab-3d-6-deep-orbit.png');

  // Step 7: Select a different candidate (Malapert Mountain) while in inspection mode
  console.log('Selecting Malapert Mountain...');
  const selectDropdown = page.locator('select');
  await selectDropdown.selectOption('malapert-massif');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outputDir, 'lab-3d-7-malapert-inspection.png') });
  console.log('Saved lab-3d-7-malapert-inspection.png');

  // Step 8: Toggle layers (Labels, Footprint)
  console.log('Testing independent layer toggles...');
  const labelsBtn = page.getByRole('button', { name: 'Labels', exact: true });
  await labelsBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outputDir, 'lab-3d-8-layer-toggles.png') });
  console.log('Saved lab-3d-8-layer-toggles.png');
  // Re-enable labels
  await labelsBtn.click();

  // Step 9: Step time forward by 6 hours
  console.log('Stepping time forward 6 hours...');
  const stepFwdBtn = page.getByTitle('Step Forward 6 Hours');
  await stepFwdBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outputDir, 'lab-3d-9-time-step.png') });
  console.log('Saved lab-3d-9-time-step.png');

  // Step 10: Reset camera to overview
  console.log('Resetting camera to overview...');
  const resetBtn = page.getByTitle(/Reset Camera/);
  await resetBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outputDir, 'lab-3d-10-reset-camera.png') });
  console.log('Saved lab-3d-10-reset-camera.png');

  // Step 11: Also verify main observatory page has 3D Lab button and renders properly
  console.log('Navigating to main observatory / ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, 'observatory-with-3d-lab-btn.png') });
  console.log('Saved observatory-with-3d-lab-btn.png');

  await browser.close();
  console.log('All browser verification steps completed successfully!');
}

run().catch((err) => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
