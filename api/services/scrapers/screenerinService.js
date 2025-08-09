const { waitForTimeout, retryAsyncFunction } = require("../utilityService");
const {
  launchBrowserForScraping,
  closeBrowser,
} = require("../puppeteerService");

const screenerLoginUrl = "https://www.screener.in/login/?/";

const getStocksFromScreener = async (screenerConfig) => {
  console.log(`started scraping process for ${screenerConfig.scanName}`);
  let screenerData;
  let chromeInstance = await retryAsyncFunction(
    () => launchBrowserForScraping(),
    3
  );
  let chromePage = chromeInstance.page;
  await loginToScreener(chromePage);
  screenerData = await scrapDataFromScreener(
    screenerConfig.stocksSourceUrl,
    chromePage
  );
  await closeBrowser(chromeInstance.browser);
  console.log(`scraping process for ${screenerConfig.scanName} ended`);
  console.log(
    `found ${screenerData.length} stock in ${screenerConfig.scanName}`
  );
  return { screenerConfig, result: screenerData };
};

const mapScrappedStocks = function (x) {
  return [x.Name, isNaN(x.Code) ? x.Code : "BOM:" + x.Code, x.Url, x.AddedDate];
};

async function scrapDataFromScreener(screenerUrl, chromePage) {
  await chromePage.goto(screenerUrl, { waitUntil: "domcontentloaded" });
  let totalPages = await getTotalPages(chromePage);
  console.log(`total pages for ${screenerUrl} is ${totalPages}`);
  let scrappedStocks = [];
  for (let i = 1; i <= totalPages; i++) {
    console.log(`scraping ${i} page`);
    await waitForTimeout(2000); // Increased from 800ms to 2000ms for better rate limiting
    await chromePage.goto(`${screenerUrl}?page=${i}`, {
      waitUntil: "domcontentloaded",
    });
    let tableRows = await chromePage.$$("table tbody tr");
    for (
      let tableRowIndex = 0;
      tableRowIndex < tableRows.length;
      tableRowIndex++
    ) {
      if (tableRowIndex == 0) continue;

      let tr = tableRows[tableRowIndex];
      let tdsInRow = await tr.$$("td");
      if (!tdsInRow && tdsInRow.length == 0) continue;
      let stockNameTd = tdsInRow[1];

      if (!stockNameTd) continue;

      let nameATag = await stockNameTd.$("a");

      if (!nameATag) continue;

      let aTagTextContent = await chromePage.evaluate(
        (el) => el.innerText,
        nameATag
      );
      let stockName = aTagTextContent.replace(/(\r\n|\n|\r)/gm, "");
      let stockHref = await chromePage.evaluate((el) => el.href, nameATag);
      let stockCode = stockHref.split("/")[4];
      let rowData = {};
      rowData.Name = stockName?.trim();
      rowData.Code = stockCode?.trim();
      rowData.Url = stockHref?.trim();
      rowData.AddedDate = new Date().toLocaleDateString("en");
      scrappedStocks.push(rowData);
    }
  }
  return scrappedStocks;
}

async function getTotalPages(chromePage) {
  let totalPages = 0;
  try {
    let spanElement = await chromePage.$(
      "body > main > div.card.card-large > div.flex-row.flex-gap-8.flex-space-between.flex-align-center > div.sub"
    );
    let paginationInfo = await chromePage.evaluate(
      (el) => el.innerText,
      spanElement
    );
    totalPages = parseInt(
      paginationInfo.split("of")[1].replace(".", "").trim()
    );
  } catch (err) {
    console.error("Error getting total pages:", err);
  } finally {
    return totalPages;
  }
}

async function loginToScreener(chromePage) {
  await chromePage.goto(screenerLoginUrl, { waitUntil: "domcontentloaded" });
  await chromePage.type("#id_username", "upsndips@gmail.com");
  await chromePage.type("#id_password", "Ameer321*/");
  await chromePage.click('button[type="submit"]');
  await waitForTimeout(3000);
}

module.exports = {
  getStocksFromScreener,
  mapScrappedStocks,
};
