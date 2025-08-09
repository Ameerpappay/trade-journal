const { retryAsyncFunction, waitForTimeout } = require("../utilityService");
const {
  launchBrowserForScraping,
  closeBrowser,
} = require("../puppeteerService");

async function getStocksFromScreener(screenerConfig) {
  let stocks = [];
  let chromeInstance = await retryAsyncFunction(
    () => launchBrowserForScraping(),
    3
  );
  let chromePage = chromeInstance.page;
  console.log(`started scraping for ${screenerConfig.scanName}`);

  await chromePage.goto(screenerConfig.stocksSourceUrl, {
    waitUntil: "domcontentloaded",
  });
  await chromePage.waitForSelector("#DataTables_Table_0 > tbody");
  await waitForTimeout(2000); // Increased from 1000ms to 2000ms
  await chromePage.click(
    "#root > div > div:nth-child(6) > div > div > div > div.row > div > div:nth-child(2) > div.row > div.col-xs-10 > p.text-lg.cursor-pointer.bg-yellow-300.rounded-lg.rounded-b-none.pt-1.px-2.-mt-3 > label > input[type=checkbox]"
  );
  await waitForTimeout(1000); // Increased from 500ms to 1000ms
  let loopCount = 0;
  let nextBtnExist = await isNextPaginationExist(chromePage);
  do {
    if (loopCount != 0) {
      await clickNextPagination(chromePage);
      await waitForTimeout(500); // Increased from 200ms to 500ms for better rate limiting
      nextBtnExist = await isNextPaginationExist(chromePage);
    }

    var urlsScrapped = await chromePage.$$eval(
      ".scan_results_table tr td:nth-child(2) a",
      (aTags) =>
        aTags.map((aTag) => {
          return {
            url: aTag.href,
            name: aTag.textContent,
          };
        })
    );
    stocks = stocks.concat(urlsScrapped);
    loopCount++;
  } while (nextBtnExist);

  console.log(`scraping for ${screenerConfig.scanName} ended`);
  var scrappedStocks = stocks.map((item) => {
    return {
      Name: item.name,
      AddedDate: new Date().toLocaleDateString("en"),
      Url: item.url,
      Code: item.url.split("/")[4]?.replace(".html", ""),
    };
  });
  await closeBrowser(chromeInstance.browser);
  console.log(
    `found ${scrappedStocks.length} stock in ${screenerConfig.scanName}`
  );
  return { screenerConfig, result: scrappedStocks };
}

const clickNextPagination = (chromePage) => {
  return chromePage.click("#DataTables_Table_0_next > a:not(.disabled)");
};

const isNextPaginationExist = async (chromePage) => {
  await chromePage.waitForSelector("#DataTables_Table_0_paginate");
  return (
    (
      await chromePage.$$(
        "#DataTables_Table_0_paginate ul li:last-child:not(.disabled)"
      )
    ).length != 0
  );
};

const downloadStockCharts = async (stockDetails, chromePage, downloadPath) => {
  let timeFrames = ["daily", "weekly"];
  return await setParamAndDownloadStockCharts(
    timeFrames,
    stockDetails,
    downloadPath,
    chromePage
  );
};

async function setParamAndDownloadStockCharts(
  timeFrames,
  stockDetails,
  downloadPath,
  chromePage
) {
  const ScrappingTimeFrames = [
    { name: "hourly", timeFrame: "60_minute", range: "44" },
    { name: "daily", timeFrame: "d", range: "121" },
    { name: "weekly", timeFrame: "w", range: "504" },
    { name: "monthly", timeFrame: "w", range: "1008" },
  ];

  var stockCode = !stockDetails[0] ? stockDetails[1] : stockDetails[0];
  var stockName = stockDetails[2];
  let stockUrl = `https://chartink.com/stocks/${stockCode}.html`;
  await chromePage.goto(stockUrl, { timeout: 0 });

  await setMovingAverages(chromePage);

  if (!timeFrames) {
    var timeFramesToScrap = ScrappingTimeFrames;
  } else {
    var timeFramesToScrap = ScrappingTimeFrames.filter((item) =>
      timeFrames.includes(item.name)
    );
  }

  let downloadedPaths = [];
  for (var timeFrame of timeFramesToScrap) {
    let filePath = `${downloadPath}/${stockCode}_${timeFrame.name}_${timeFrame.range}.png`;
    downloadedPaths.push(filePath);
    await setTimeFrame(timeFrame, chromePage);
    await waitForTimeout(100); // Reduced from 200ms
    await chromePage.click("#innerb");
    await chromePage.waitForSelector("#ChartImage");
    const element = await chromePage.$("#ChartImage");
    await waitForTimeout(300); // Reduced from 500ms
    await chromePage.evaluate((pageItem) => pageItem.scrollIntoView(), element);
    await waitForTimeout(200); // Reduced from 500ms
    await element.screenshot({ path: filePath });
    await waitForTimeout(100); // Reduced from 200ms

    console.log(
      `downloaded ${stockName}_${timeFrame.name}_${timeFrame.range}.png`
    );
  }
  return {
    stockDetails: stockDetails,
    downloadedPaths: downloadedPaths.join(","),
  };
}

const setTimeFrame = async (inputTimeFrame, chromePage) => {
  await chromePage.$eval(
    "#d",
    (selectBox, timeFrame) => (selectBox.value = timeFrame),
    inputTimeFrame.timeFrame
  );
  await chromePage.$eval(
    "#ti",
    (selectBox, range) => (selectBox.value = range),
    inputTimeFrame.range
  );
};

const setMovingAverages = async (page) => {
  const movingAverageRows = await page.$$("#moving_avgs tr:not(.limg)");
  for (var movingAverageRow = 0; movingAverageRow <= 3; movingAverageRow++) {
    await movingAverageRows[movingAverageRow].$eval(
      "td:first-child input",
      (checkbox) => (checkbox.checked = true)
    );
    await movingAverageRows[movingAverageRow].$eval(
      "td:nth-child(4) select",
      (selectBox) => (selectBox.value = "EMA")
    );

    let movingAverage = 10;
    switch (movingAverageRow) {
      case 0:
        movingAverage = 10;
        break;
      case 1:
        movingAverage = 20;
        break;
      case 2:
        movingAverage = 50;
        break;
      case 3:
        movingAverage = 200;
        break;
    }

    await movingAverageRows[movingAverageRow].$eval(
      "td:nth-child(5) input",
      (textfield, movingAverage) => {
        textfield.value = movingAverage;
      },
      movingAverage
    );
  }
};

module.exports = {
  getStocksFromScreener,
  downloadStockCharts,
};
