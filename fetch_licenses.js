const fs = require('fs');
const util = require('util');
const sourceUrl = "https://download.microsoft.com/download/e/3/e/e3e9faf2-f28b-490a-9ada-c6089a1fc5b0/Product%20names%20and%20service%20plan%20identifiers%20for%20licensing.csv"
const jsonPath = "./licenses.json"
let m365Licenses = [];
let ready = false;

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

async function fetchM365Licenses() {
  try {
    const response = await fetch(sourceUrl);

    if (response.ok) {
      const content = await response.text();
      m365Licenses = csvToJson(content);
      const jsonStr = JSON.stringify(m365Licenses);
      await writeFile(jsonPath, jsonStr);
    } else {
      // Rely on locally stored file until successful response
      try {
        const content = await readFile(jsonPath, "utf8");
        m365Licenses = csvToJson(content);
      } catch (readErr) {
        console.error(readErr);
      }
    }
  } catch (fetchErr) {
    console.error(fetchErr);
  }
  ready = true;
}

async function getLicenses() {
    if (!ready) {
        await new Promise((resolve) => {
          const interval = setInterval(() => {
            if (ready) {
              clearInterval(interval);
              resolve();
            }
          }, 100); // Poll every 100ms until ready
        });
      }
      return m365Licenses;
}

function csvToJson(csvData, separator = ',') {
    const csv = csvData.split(/\r?\n/);
    const headers = csv.shift().split(separator);
    const json = [];
    
    for(const line of csv){
        const csvSplit = line.split(separator);
        let jsonObj = {};

        for (let i = 0; i < csvSplit.length; i++){
            jsonObj[headers[i]] = csvSplit[i].trim();
        }
        json.push(jsonObj);
    }
    return json;
}

fetchM365Licenses()
// Update file once per hour
const hours = 1;
const intervalInMillis = hours * 3600 * 1000;
setInterval(fetchM365Licenses, intervalInMillis)

module.exports = { getLicenses }