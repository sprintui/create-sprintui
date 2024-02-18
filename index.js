const { Console } = require('console');
const https = require('https');
const fs = require('node:fs');
const path = require('path');
const readline = require("readline");
const versionFileURL = 'https://raw.githubusercontent.com/sprintui/SprintUi-Framework/main/version.txt';
const AdmZip = require('adm-zip');
function downloadFile(url, localPath) {
    return new Promise((resolve, reject) => {
        https.get(url, { followRedirect: true }, (response) => {
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(localPath);
                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    resolve();
                });

                file.on('error', (err) => {
                    fs.unlinkSync(localPath);
                    reject(err);
                });
            } else if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                // Redirect
                downloadFile(response.headers.location, localPath)
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(new Error(`Failed to download file. Status code: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            reject(err);
        });
    });
}


function getVersion(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get version. Status code: ${response.statusCode}`));
        return;
      }

      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        resolve(data.trim()); // Trim to remove leading/trailing whitespaces
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}



async function main() {
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    
  try {
    let keepPages = true;
    console.log("Welcome to SprintUi Framework");
    console.log("Current Version: " + await getVersion(versionFileURL));
    rl.question("Do you want to keep the default pages? (yes/no) ", async function(answer) {
        if (answer == "yes") {
            console.log("Keeping default pages");
        }
        else {
            console.log("Removing default pages");
            keepPages = false;
        }
        console.log("Downloading SprintUi Framework");
        const zipFilePath = path.join(__dirname, 'sprintui-framework.zip');
        await downloadFile("https://github.com/sprintui/SprintUi-Framework/archive/refs/heads/main.zip", zipFilePath);
        console.log("Downloaded SprintUi Framework");
        console.log("Extracting SprintUi Framework");
        const zip = new AdmZip(zipFilePath);
        zip.extractAllToAsync(__dirname, true, function (err) {
            if (!err) {
                console.log("Extracted SprintUi Framework");
                console.log("Cleaning up");
                fs.unlinkSync(zipFilePath);
                // Move the extracted folder to the current directory
                const extractedFolder = path.join(__dirname, 'SprintUi-Framework-main');
                const files = fs.readdirSync(extractedFolder);
                for (const file of files) {
                    fs.renameSync(path.join(extractedFolder, file), path.join(__dirname, file));
                }
                fs.rmdirSync(extractedFolder);
                console.log("Cleaned up");
                if (keepPages) {
                    console.log("Keeping default pages");
                }
                else {
                    //delete any default pages but not the folder
                    const defaultPages = path.join(__dirname, 'pages');
                    const files = fs.readdirSync(defaultPages);
                    for (const file of files) {
                        fs.unlinkSync(path.join
                        (defaultPages, file));
                    }

                }
                console.log("SprintUi Framework has been installed");
                console.log("You can now start building your website");
                console.log("run 'npm install' to install the dependencies");
                console.log("You can start the server by running 'npm run start' in the terminal");
                console.log("You can access your website at http://localhost:3000");
                console.log("Thank you for using SprintUi Framework");

            }
            else {
                console.log("An error occurred while extracting SprintUi Framework");
            }
        });
        rl.close();
    }
    );
  } catch (err) {
    console.error('An error occurred while getting the version:', err);
  }
}

main();