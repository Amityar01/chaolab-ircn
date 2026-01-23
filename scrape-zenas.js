const { chromium } = require('playwright');

async function scrape() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const results = {};

  // Scrape publications
  console.log('Fetching publications...');
  await page.goto('https://www.zenaschao.com/publications', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  results.publications = await page.evaluate(() => document.body.innerText);

  // Scrape teaching
  console.log('Fetching teaching...');
  await page.goto('https://www.zenaschao.com/teaching', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  results.teaching = await page.evaluate(() => document.body.innerText);

  // Scrape main page / about
  console.log('Fetching main page...');
  await page.goto('https://www.zenaschao.com', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  results.main = await page.evaluate(() => document.body.innerText);

  // Scrape contact
  console.log('Fetching contact...');
  await page.goto('https://www.zenaschao.com/contact', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  results.contact = await page.evaluate(() => document.body.innerText);

  await browser.close();

  // Output results
  console.log('\n\n========== PUBLICATIONS ==========\n');
  console.log(results.publications);
  console.log('\n\n========== TEACHING ==========\n');
  console.log(results.teaching);
  console.log('\n\n========== MAIN PAGE ==========\n');
  console.log(results.main);
  console.log('\n\n========== CONTACT ==========\n');
  console.log(results.contact);
}

scrape().catch(console.error);
