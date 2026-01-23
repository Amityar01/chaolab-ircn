const { chromium } = require('playwright');

async function scrape() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Fetching *Point0 page...');
  await page.goto('https://www.zenaschao.com/point0', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000); // Wait longer for all content to load

  // Get full HTML
  const html = await page.content();
  console.log('\n========== HTML ==========\n');
  console.log(html);

  // Get all text
  const text = await page.evaluate(() => document.body.innerText);
  console.log('\n========== TEXT ==========\n');
  console.log(text);

  // Try to get all links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({ href: a.href, text: a.innerText }));
  });
  console.log('\n========== LINKS ==========\n');
  console.log(JSON.stringify(links, null, 2));

  await browser.close();
}

scrape().catch(console.error);
