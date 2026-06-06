const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Set up console listener
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  await page.goto('http://localhost:5173/book/q4cmvb/world');
  await page.waitForTimeout(3000); // Wait for load

  // Get the HTML of the root element
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log("HTML:", html.substring(0, 1000));

  await browser.close();
})();
