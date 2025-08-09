const fs = require("fs");
const path = require("path");

const readFromJson = (fileName) => {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, "utf8", (err, jsonString) => {
      if (err) {
        reject(err);
      }
      resolve(JSON.parse(jsonString));
    });
  });
};

const writeJson = (fileName, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, JSON.stringify(data), (err) => {
      if (err) {
        reject(err);
      }
      resolve("success");
    });
  });
};

const todaysDate = () => {
  var nowDate = new Date();
  return (
    nowDate.getFullYear() +
    "-" +
    (nowDate.getMonth() + 1) +
    "-" +
    nowDate.getDate()
  );
};

const waitForTimeout = (timeOut) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, timeOut);
  });

// Optimized wait function that uses setImmediate for very short waits
const waitForTimeoutOptimized = (timeOut) => {
  if (timeOut <= 16) {
    // For very short waits, use setImmediate
    return new Promise((resolve) => setImmediate(resolve));
  }
  return waitForTimeout(timeOut);
};

const createFolder = (folderPath) => {
  return new Promise((resolve, reject) => {
    var dir = `${folderPath}`;

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    resolve(dir);
  });
};

const retryAsyncFunction = async (process, maxAttemptCount = 3) => {
  let retryCount = 0;
  while (retryCount < maxAttemptCount) {
    try {
      if (retryCount > 0) {
        console.log(`retrying ${getFunctionName(process)} ${retryCount} time`);
      }

      let result = await process();
      if (retryCount > 0) {
        console.log(
          `error resolved for ${getFunctionName(process)} on ${retryCount} time`
        );
      }
      return result;
    } catch (ex) {
      retryCount++;
      var functionName = getFunctionName(process);
      console.log(
        `Error in ${functionName} with err ${ex.toString()} and retrying ${retryCount} time `
      );
    }
  }
  console.log("retry exceeded");
  throw new Error("Max retry attempts exceeded");
};

async function removeFolderRecursive(folderPath) {
  try {
    await fs.promises.access(folderPath, fs.constants.F_OK);
    const files = await fs.promises.readdir(folderPath);

    for (const file of files) {
      const curPath = path.join(folderPath, file);
      const stat = await fs.promises.stat(curPath);

      if (stat.isDirectory()) {
        await removeFolderRecursive(curPath);
      } else {
        await fs.promises.unlink(curPath);
      }
    }
    await fs.promises.rmdir(folderPath);
  } catch (error) {
    // Handle error, like if the folder doesn't exist
    console.error("Error removing folder:", error.message);
  }
}

const getFunctionName = (currentFunction) => {
  var name = currentFunction.toString();
  return name;
};

function chunkArray(arr, chunkSize) {
  return arr.reduce((acc, items, index) => {
    const chunkIndex = Math.floor(index / chunkSize);
    acc[chunkIndex] = acc[chunkIndex] || [];
    acc[chunkIndex].push(items);
    return acc;
  }, []);
}

module.exports = {
  readFromJson,
  writeJson,
  todaysDate,
  waitForTimeout,
  waitForTimeoutOptimized,
  createFolder,
  retryAsyncFunction,
  removeFolderRecursive,
  chunkArray,
};
