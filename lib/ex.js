const fs = require('fs');
const path = require('path');
const https = require('https');
const unzipper = require('unzipper');

class Extras {
    constructor(downloadFolder) {
        this.baseUrl = "https://www.nseindia.com/api";
        this.archiveUrl = "https://nsearchives.nseindia.com";
        this.dir = this.getPath(downloadFolder, true);
    }

    getPath(p, isFolder = false) {
        const resolvedPath = path.resolve(p);
        if (isFolder) {
            if (fs.existsSync(resolvedPath) && !fs.lstatSync(resolvedPath).isDirectory()) {
                throw new Error(`${resolvedPath}: must be a folder`);
            }
            if (!fs.existsSync(resolvedPath)) {
                fs.mkdirSync(resolvedPath, { recursive: true });
            }
        }
        return resolvedPath;
    }

    async download(url, folder) {
        const filePath = path.join(folder, path.basename(url));
        const file = fs.createWriteStream(filePath);

        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                    return;
                }

                response.pipe(file);

                file.on('finish', () => {
                    file.close(() => resolve(filePath));
                });
            }).on('error', (err) => {
                fs.unlink(filePath, () => reject(err));
            });
        });
    }

    async unzip(file, folder) {
        return new Promise((resolve, reject) => {
            fs.createReadStream(file)
                .pipe(unzipper.Extract({ path: folder }))
                .on('close', () => {
                    fs.unlinkSync(file);
                    resolve(folder);
                })
                .on('error', reject);
        });
    }

    async equityBhavcopy(date, folder = null) {
        folder = folder ? this.getPath(folder, true) : this.dir;

        const url = `${this.archiveUrl}/content/cm/BhavCopy_NSE_CM_0_0_0_${date.toFormat('yyyyMMdd')}_F_0000.csv.zip`;

        const file = await this.download(url, folder);

        if (!fs.existsSync(file)) {
            fs.unlinkSync(file);
            throw new Error(`Failed to download file: ${path.basename(file)}`);
        }

        return this.unzip(file, path.dirname(file));
    }

    async fnoBhavcopy(date, folder = null) {
        folder = folder ? this.getPath(folder, true) : this.dir;

        const dtStr = date.toFormat('yyyyMMdd');
        const url = `${this.archiveUrl}/content/fo/BhavCopy_NSE_FO_0_0_0_${dtStr}_F_0000.csv.zip`;

        const file = await this.download(url, folder);

        if (!fs.existsSync(file)) {
            fs.unlinkSync(file);
            throw new Error(`Failed to download file: ${path.basename(file)}`);
        }

        return this.unzip(file, path.dirname(file));
    }

    async prBhavcopy(date, folder = null) {
        folder = folder ? this.getPath(folder, true) : this.dir;

        const dtStr = date.toFormat('ddMMyy');
        const url = `${this.archiveUrl}/archives/equities/bhavcopy/pr/PR${dtStr}.zip`;

        const file = await this.download(url, folder);

        if (!fs.existsSync(file)) {
            fs.unlinkSync(file);
            throw new Error(`Failed to download file: ${path.basename(file)}`);
        }

        return file;
    }

    async deliveryBhavcopy(date, folder = null) {
        folder = folder ? this.getPath(folder, true) : this.dir;

        const dtStr = date.toFormat('ddMMyyyy');
        const url = `${this.archiveUrl}/products/content/sec_bhavdata_full_${dtStr}.csv`;

        const file = await this.download(url, folder);

        if (!fs.existsSync(file)) {
            fs.unlinkSync(file);
            throw new Error(`Failed to download file: ${path.basename(file)}`);
        }

        return file;
    }
}

module.exports = Extras;