const browserService = require("./browserService");
const chartinkService = require("./scrapers/chartinkService");
const screenerinService = require("./scrapers/screenerinService");
const utilityService = require("./utilityService");
const {
  Stock,
  Screener,
  StockScreenerResult,
  StockChart,
} = require("../models");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs").promises;

const SCRAPING_TIMEFRAMES = [
  { name: "hourly", timeFrame: "60_minute", range: "44" },
  { name: "daily", timeFrame: "d", range: "121" },
  { name: "weekly", timeFrame: "w", range: "504" },
  { name: "monthly", timeFrame: "w", range: "1008" },
];

const sharedVariables = {
  chartinkName: "chartink",
  screenerinName: "screenerin",
};

class StockScrapingService {
  // Main scraping function that routes to appropriate scraper
  async getStocksFromScreener(screenerConfig) {
    console.log(
      `Starting to scrape ${screenerConfig.scanName} from ${screenerConfig.sourceName}`
    );

    try {
      let result = null;

      if (screenerConfig.sourceName === sharedVariables.chartinkName) {
        result = await chartinkService.getStocksFromScreener(screenerConfig);
      } else if (screenerConfig.sourceName === sharedVariables.screenerinName) {
        result = await screenerinService.getStocksFromScreener(screenerConfig);
      } else {
        throw new Error(
          `Unsupported scraper source: ${screenerConfig.sourceName}`
        );
      }

      if (result && result.result) {
        console.log(
          `✅ ${screenerConfig.scanName}: Found ${result.result.length} stocks`
        );
        return result;
      } else {
        console.log(`⚠️ ${screenerConfig.scanName}: No data returned`);
        return null;
      }
    } catch (error) {
      console.error(
        `❌ Failed to process ${screenerConfig.scanName}: ${error.message}`
      );
      throw error;
    }
  }

  // Batch process multiple screeners with staggered delays
  async processMultipleScreeners(screeners, progressCallback = null) {
    const scrapePromises = screeners.map(async (screener, index) => {
      // Add staggered delay before starting each request
      const delayMs =
        screener.sourceName == sharedVariables.screenerinName
          ? index * 5000 // 5 second delays between screener.in requests
          : index * 1500; // 1.5 second delays between other requests

      if (delayMs > 0) {
        const message = `⏳ Waiting ${delayMs / 1000}s before starting ${
          screener.scanName
        }...`;
        console.log(message);
        if (progressCallback) progressCallback(message);
        await utilityService.waitForTimeout(delayMs);
      }

      const message = `🚀 Starting ${screener.scanName}...`;
      console.log(message);
      if (progressCallback) progressCallback(message);

      try {
        const result = await this.getStocksFromScreener(screener);
        if (result && result.result) {
          const successMessage = `✅ ${screener.scanName}: Found ${result.result.length} stocks`;
          console.log(successMessage);
          if (progressCallback) progressCallback(successMessage);
        } else {
          const warningMessage = `⚠️ ${screener.scanName}: No data returned`;
          console.log(warningMessage);
          if (progressCallback) progressCallback(warningMessage);
        }
        return result;
      } catch (error) {
        const errorMessage = `❌ Failed to process ${screener.scanName}: ${error.message}`;
        console.error(errorMessage);
        if (progressCallback) progressCallback(errorMessage);
        return null;
      }
    });

    const results = await Promise.all(scrapePromises);
    return results.filter((result) => result !== null);
  }
  // Legacy method for compatibility with chartink scraper
  async getStocksFromScreenerLegacy(screenerConfig) {
    let stocks = [];
    let chromeInstance = await browserService.retryAsyncFunction(
      () => browserService.launchBrowserForScraping(),
      3
    );
    let chromePage = chromeInstance.page;

    console.log(`Started scrapping for ${screenerConfig.scanName}`);

    try {
      await chromePage.goto(screenerConfig.sourceUrl, {
        waitUntil: "domcontentloaded",
      });

      await chromePage.waitForSelector("#DataTables_Table_0 > tbody", {
        timeout: 10000,
      });
      await browserService.waitForTimeout(2000);

      // Click the checkbox to show all results
      try {
        await chromePage.click(
          "#root > div > div:nth-child(6) > div > div > div > div.row > div > div:nth-child(2) > div.row > div.col-xs-10 > p.text-lg.cursor-pointer.bg-yellow-300.rounded-lg.rounded-b-none.pt-1.px-2.-mt-3 > label > input[type=checkbox]"
        );
        await browserService.waitForTimeout(1000);
      } catch (error) {
        console.log("Checkbox click failed, continuing anyway:", error.message);
      }

      let loopCount = 0;
      let nextBtnExist = await this.isNextPaginationExist(chromePage);

      do {
        if (loopCount !== 0) {
          await this.clickNextPagination(chromePage);
          await browserService.waitForTimeout(500);
          nextBtnExist = await this.isNextPaginationExist(chromePage);
        }

        const urlsScrapped = await chromePage.$$eval(
          ".scan_results_table tr td:nth-child(2) a",
          (aTags) =>
            aTags.map((aTag) => ({
              url: aTag.href,
              name: aTag.textContent,
            }))
        );

        stocks = stocks.concat(urlsScrapped);
        loopCount++;

        // Safety limit to prevent infinite loops
        if (loopCount > 100) {
          console.log("Reached pagination limit, stopping...");
          break;
        }
      } while (nextBtnExist);

      console.log(`Scrapping for ${screenerConfig.scanName} ended`);

      const scrappedStocks = stocks.map((item) => ({
        name: item.name,
        addedDate: new Date().toISOString().split("T")[0],
        url: item.url,
        code: item.url.split("/")[4]?.replace(".html", ""),
      }));

      console.log(
        `Found ${scrappedStocks.length} stocks in ${screenerConfig.scanName}`
      );

      return { screenerConfig, result: scrappedStocks };
    } finally {
      await browserService.closeBrowser(chromeInstance.browser);
    }
  }

  async clickNextPagination(chromePage) {
    return chromePage.click("#DataTables_Table_0_next > a:not(.disabled)");
  }

  async isNextPaginationExist(chromePage) {
    await chromePage.waitForSelector("#DataTables_Table_0_paginate");
    const nextButtons = await chromePage.$$(
      "#DataTables_Table_0_paginate ul li:last-child:not(.disabled)"
    );
    return nextButtons.length !== 0;
  }

  async downloadStockCharts(stockDetails, timeFrames = ["daily", "weekly"]) {
    const downloadPath = path.join(__dirname, "../public/charts");

    // Ensure charts directory exists
    await fs.mkdir(downloadPath, { recursive: true });

    return await chartinkService.downloadStockCharts(
      stockDetails,
      null,
      downloadPath
    );
  }

  // Batch download charts for multiple stocks
  async downloadChartsForMultipleStocks(
    stockDetailsList,
    maxConcurrent = 8,
    progressCallback = null
  ) {
    const chunkSize = Math.max(
      1,
      Math.ceil(stockDetailsList.length / maxConcurrent)
    );
    const chunkedArray = utilityService.chunkArray(stockDetailsList, chunkSize);

    const message = `📊 Processing ${stockDetailsList.length} stocks in ${chunkedArray.length} chunks`;
    console.log(message);
    if (progressCallback) progressCallback(message);

    const downloadProcesses = chunkedArray.map((chunk, index) => {
      return this.chartDownloadProcess(
        chunk,
        index + 1,
        chunkedArray.length,
        progressCallback
      );
    });

    const results = await Promise.all(downloadProcesses);
    return results.reduce((acc, subArray) => acc.concat(subArray), []);
  }

  async chartDownloadProcess(
    stockDetailsArray,
    chunkIndex,
    totalChunks,
    progressCallback = null
  ) {
    const message = `Processing chunk ${chunkIndex}/${totalChunks} (${stockDetailsArray.length} stocks)...`;
    console.log(message);
    if (progressCallback) progressCallback(message);

    let chromeInstance = await utilityService.retryAsyncFunction(
      () => browserService.launchBrowser(),
      3
    );
    let chromePage = chromeInstance.page;
    let downloadPaths = [];

    try {
      for (let i = 0; i < stockDetailsArray.length; i++) {
        try {
          const stockMessage = `Downloading charts for ${
            stockDetailsArray[i].stockName || stockDetailsArray[i][2]
          } (${i + 1}/${stockDetailsArray.length} in chunk ${chunkIndex})...`;
          console.log(stockMessage);
          if (progressCallback) progressCallback(stockMessage);

          let downloadedPaths = await utilityService.retryAsyncFunction(
            () =>
              this.downloadStockChartsWithPage(
                stockDetailsArray[i],
                chromePage
              ),
            5
          );
          downloadPaths.push(downloadedPaths);
        } catch (ex) {
          downloadPaths.push("");
          const warningMessage = `Failed to download chart for ${
            stockDetailsArray[i].stockName || stockDetailsArray[i][2]
          }: ${ex.message}`;
          console.warn(warningMessage);
          if (progressCallback) progressCallback(warningMessage);
        }
      }
    } finally {
      await browserService.closeBrowser(chromeInstance.browser);
    }

    const completionMessage = `Chunk ${chunkIndex}/${totalChunks} completed!`;
    console.log(completionMessage);
    if (progressCallback) progressCallback(completionMessage);

    return downloadPaths;
  }

  async downloadStockChartsWithPage(stockDetails, chromePage) {
    const downloadPath = path.join(__dirname, "../public/charts");

    // Ensure charts directory exists
    await fs.mkdir(downloadPath, { recursive: true });

    // Convert stockDetails object to array format expected by chartinkService
    const stockDetailsArray = [
      stockDetails.bseCode || "",
      stockDetails.nseCode || "",
      stockDetails.stockName || "Unknown",
      stockDetails.industry || "Unknown",
    ];

    return await chartinkService.downloadStockCharts(
      stockDetailsArray,
      chromePage,
      downloadPath
    );
  }

  // Get stocks eligible for chart download (non-debt + at least one other screener)
  async getStocksEligibleForChartDownload() {
    try {
      const today = new Date().toISOString().split("T")[0];

      const stocks = await Stock.findAll({
        include: [
          {
            model: StockScreenerResult,
            as: "screenerResults",
            include: [
              {
                model: Screener,
                as: "screener",
              },
            ],
            where: {
              scanDate: today,
              isMatch: true,
            },
          },
        ],
        where: {
          isActive: true,
        },
      });

      // Filter stocks that have at least one screener other than "non-debt"
      const eligibleStocks = stocks.filter((stock) => {
        const screeners = stock.screenerResults.map(
          (result) => result.screener.scanName
        );
        const nonDebtScreeners = screeners.filter(
          (name) => name !== "non-debt"
        );
        return nonDebtScreeners.length > 0;
      });

      console.log(
        `Found ${eligibleStocks.length} stocks eligible for chart download`
      );

      return eligibleStocks.map((stock) => ({
        id: stock.id,
        bseCode: stock.bseCode,
        nseCode: stock.nseCode,
        stockName: stock.stockName,
        industry: stock.industry,
        screeners: stock.screenerResults
          .map((result) => result.screener.scanName)
          .join(","),
      }));
    } catch (error) {
      console.error("Error getting eligible stocks for chart download:", error);
      throw error;
    }
  }

  // Update screener results in database
  async updateStockScreenerResults(screenersData, userId = null) {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Clear existing results for today
      await StockScreenerResult.destroy({
        where: {
          scanDate: today,
        },
      });

      console.log("📊 Updating stock screener results in database...");

      let updatedCount = 0;

      for (const screenerData of screenersData) {
        const screenerConfig = screenerData.screenerConfig;
        const results = screenerData.result;

        // Get or create screener
        let screener = await Screener.findOne({
          where: { scanName: screenerConfig.scanName },
        });

        if (!screener) {
          screener = await Screener.create({
            scanName: screenerConfig.scanName,
            description: screenerConfig.description || null,
            sourceName:
              screenerConfig.stocksSourceName || screenerConfig.sourceName,
            sourceUrl:
              screenerConfig.stocksSourceUrl || screenerConfig.sourceUrl,
            userId: userId,
          });
        }

        // Process each stock result
        for (const stockResult of results) {
          try {
            // Get or create stock
            let stock = await Stock.findOne({
              where: {
                [Op.or]: [
                  { nseCode: stockResult.Code || stockResult.code },
                  { bseCode: stockResult.Code || stockResult.code },
                ],
              },
            });

            if (!stock) {
              // Create new stock entry
              stock = await Stock.create({
                stockName: stockResult.Name || stockResult.name || "Unknown",
                nseCode: (
                  stockResult.Code ||
                  stockResult.code ||
                  ""
                ).toUpperCase(),
                bseCode: (
                  stockResult.Code ||
                  stockResult.code ||
                  ""
                ).toUpperCase(),
                industry: "Unknown",
                userId: userId,
                lastUpdated: new Date(),
              });
            }

            // Insert screener result
            await StockScreenerResult.create({
              stockId: stock.id,
              screenerId: screener.id,
              isMatch: true,
              scanDate: today,
            });

            updatedCount++;
          } catch (error) {
            console.error(
              `Failed to process stock ${
                stockResult.Code || stockResult.code
              }:`,
              error
            );
          }
        }

        console.log(
          `✅ Processed ${results.length} stocks for screener: ${screenerConfig.scanName}`
        );
      }

      console.log(`📈 Total updated screener results: ${updatedCount}`);
      return updatedCount;
    } catch (error) {
      console.error("Failed to update stock screener results:", error);
      throw error;
    }
  }

  // Update stock charts information in database
  async updateStockCharts(stockChartsData) {
    try {
      console.log("🎨 Updating stock charts in database...");

      let updatedCount = 0;

      for (const chartData of stockChartsData) {
        if (!chartData.stockDetails || chartData.stockDetails.length < 3)
          continue;

        const bseCode = chartData.stockDetails[0];
        const nseCode = chartData.stockDetails[1];
        const stockName = chartData.stockDetails[2];

        try {
          // Get or create stock
          let stock = await Stock.findOne({
            where: {
              [Op.or]: [{ bseCode: bseCode }, { nseCode: nseCode }],
            },
          });

          if (!stock) {
            stock = await Stock.create({
              bseCode: bseCode,
              nseCode: nseCode,
              stockName: stockName,
              industry: "Unknown",
            });
          }

          // Clear existing charts for this stock
          await StockChart.destroy({
            where: { stockId: stock.id },
          });

          // Process chart paths
          if (chartData.downloadedPaths) {
            const chartPaths = chartData.downloadedPaths.split(",");

            for (const chartPath of chartPaths) {
              if (chartPath.trim()) {
                // Extract chart info from filename
                const fileName = path.basename(chartPath);
                const parts = fileName.replace(".png", "").split("_");

                if (parts.length >= 3) {
                  const chartType = parts[1]; // daily, weekly, etc.
                  const chartRange = parts[2]; // 121, 504, etc.

                  // Get file stats
                  let fileSize = null;
                  try {
                    const stats = await fs.stat(chartPath);
                    fileSize = stats.size;
                  } catch (err) {
                    console.warn(
                      `Could not get file stats for ${chartPath}: ${err.message}`
                    );
                  }

                  await StockChart.create({
                    stockId: stock.id,
                    chartType: chartType,
                    chartRange: chartRange,
                    filePath: chartPath
                      .replace(/\\/g, "/")
                      .replace(/.*\/public\//, "/"),
                    fileSize: fileSize,
                  });

                  updatedCount++;
                }
              }
            }
          }
        } catch (error) {
          console.error(
            `Failed to update charts for stock ${stockName}:`,
            error
          );
        }
      }

      console.log(`📊 Updated ${updatedCount} chart records`);
      return updatedCount;
    } catch (error) {
      console.error("Failed to update stock charts:", error);
      throw error;
    }
  }

  // Save screener results to database
  async saveScreenerResults(screenerConfig, scrapedStocks, userId) {
    const scanDate = new Date().toISOString().split("T")[0];
    const results = [];

    for (const scrapedStock of scrapedStocks) {
      try {
        // Find or create stock
        let stock = await Stock.findOne({
          where: {
            [Op.or]: [
              { nseCode: scrapedStock.code },
              { bseCode: scrapedStock.code },
            ],
          },
        });

        if (!stock) {
          // Create new stock entry
          stock = await Stock.create({
            stockName: scrapedStock.name,
            nseCode: scrapedStock.code.toUpperCase(),
            userId: userId,
            lastUpdated: new Date(),
          });
        }

        // Create screener result
        const result = await StockScreenerResult.create({
          stockId: stock.id,
          screenerId: screenerConfig.id,
          isMatch: true,
          scanDate: scanDate,
        });

        results.push(result);
      } catch (error) {
        console.error(`Error saving stock ${scrapedStock.name}:`, error);
      }
    }

    return results;
  }

  // Save chart information to database
  async saveChartInfo(stockId, downloadedPaths) {
    const chartEntries = [];

    for (const chartPath of downloadedPaths) {
      try {
        // Check if file exists and get size
        const stats = await fs.stat(chartPath.filePath);

        const chartEntry = await StockChart.create({
          stockId: stockId,
          chartType: chartPath.timeFrame,
          chartRange: chartPath.range,
          filePath: `charts/${chartPath.fileName}`,
          fileSize: stats.size,
        });

        chartEntries.push(chartEntry);
      } catch (error) {
        console.error(
          `Error saving chart info for ${chartPath.fileName}:`,
          error
        );
      }
    }

    return chartEntries;
  }
}

module.exports = new StockScrapingService();
