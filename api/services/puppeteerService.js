const puppeteer = require("puppeteer");

const minimal_args = [
  "--autoplay-policy=user-gesture-required",
  "--disable-background-networking",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-breakpad",
  "--disable-client-side-phishing-detection",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-dev-shm-usage",
  "--disable-domain-reliability",
  "--disable-extensions",
  "--disable-features=AudioServiceOutOfProcess,VizDisplayCompositor",
  "--disable-hang-monitor",
  "--disable-ipc-flooding-protection",
  "--disable-notifications",
  "--disable-offer-store-unmasked-wallet-cards",
  "--disable-popup-blocking",
  "--disable-print-preview",
  "--disable-prompt-on-repost",
  "--disable-renderer-backgrounding",
  "--disable-setuid-sandbox",
  "--disable-speech-api",
  "--disable-sync",
  "--disable-web-security",
  "--disable-features=TranslateUI",
  "--disable-blink-features=AutomationControlled",
  "--hide-scrollbars",
  "--ignore-gpu-blacklist",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-default-browser-check",
  "--no-first-run",
  "--no-pings",
  "--no-sandbox",
  "--no-zygote",
  "--password-store=basic",
  "--use-gl=swiftshader",
  "--use-mock-keychain",
];

async function launchBrowser() {
  let browser = await puppeteer.launch({
    headless: "new",
    args: minimal_args,
    protocolTimeout: 60000,
    // Add performance optimizations
    defaultViewport: { width: 1280, height: 720 }, // Smaller viewport for better performance
  });
  let page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3738.0 Safari/537.36"
  );
  return { browser, page };
}

// Specialized browser for data scraping (no images/styles needed)
async function launchBrowserForScraping() {
  let browser = await puppeteer.launch({
    headless: "new",
    args: [...minimal_args, "--disable-images"],
    protocolTimeout: 60000,
    defaultViewport: { width: 1280, height: 720 },
  });
  let page = await browser.newPage();

  // Block unnecessary resources for faster loading during data scraping
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const resourceType = req.resourceType();
    if (["stylesheet", "font", "image"].includes(resourceType)) {
      req.abort(); // Block CSS, fonts, and images for faster loading
    } else {
      req.continue();
    }
  });

  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3738.0 Safari/537.36"
  );
  return { browser, page };
}

async function closeBrowser(chromeBrowser) {
  if (chromeBrowser) {
    await chromeBrowser.close();
  }
}

module.exports = {
  launchBrowser,
  launchBrowserForScraping,
  closeBrowser,
};
