require('dotenv').config();
const fs = require("fs");
const path = require("path");
const User = require("../models/user.model");
import { getFilesFromPath, Web3Storage } from 'web3.storage'
// Construct with token and endpoint
const client = new Web3Storage({ token: env.WEB3_STORAGE_API_KEY })


module.exports.Upload_User_Media= async (request) => {  
    try {
        const fileName = request.fileName;
        const accountID = request.accountID;
        const filePath = path.join(process.cwd()+ `/uploads/tmp-media/${fileName}`);
        //const contentBuffer = fs.readFileSync(filePath);

        // load files
        const files = await getFilesFromPath(filePath);
        // upload files
        const rootCid = await client.put(files);
        
        // remove tmp media after upload
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath, (err) => {
                if (err) {
                    console.log('error deleting file ', error);
                }
                console.log('tmp avatar file deleted');
            });
        }
    } catch (error) {
        console.error(" Error while uploading to the bucket HOST:skynet.net:" + error);
    }
}

module.exports.Delete_File = async (request) => {
    try {
        const fileID = request.fileID;
        const fileName = request.fileName;

        if (fileName !== '1.jpg') {
            await b2.authorize();
            let result = await b2.deleteFileVersion({
                fileId: fileID,
                fileName: fileName
            });
        }
    } catch (error) {
        console.log(error);
    }
}