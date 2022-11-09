require('dotenv').config();
const fs = require("fs");
const path = require("path");
const User = require("../models/user.model");
const B2 = require("backblaze-b2");
const b2 = new B2({
    applicationKeyId: process.env.B2_KEY_ID, // accountId: 'accountId'
    applicationKey: process.env.B2_KEY, // masterApplicationKey
});

module.exports.Upload_User_Avatar= async (request) => {  
    try {
        const fileName = request.fileName;
        const accountID = request.accountID;
        const filePath = path.join(process.cwd()+ `/uploads/tmp-avatar/${fileName}`);
        const contentBuffer = fs.readFileSync(filePath);

        // auth
        await b2.authorize();
        // extract params
        let response = await b2.getUploadUrl({ bucketId: process.env.B2_AVATAR_BUCKET_ID });
        let uploadURL = response.data.uploadUrl;
        let authToken = response.data.authorizationToken;
        // upload file to bucket
        let result = await b2.uploadFile({
            uploadUrl: uploadURL,
            uploadAuthToken: authToken,
            fileName: fileName,
            mime: 'webp',
            data: contentBuffer,
        });

        const _fileID = result.data.fileId;
        const _fileName = result.data.fileName        
        const _request = {
            accountID: accountID,
            fileID: _fileID,
            fileName: _fileName
        }
        // update user avata fileID
        await User.setAvatarFileID(_request);
        
        // remove tmp img after upload
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath, (err) => {
                if (err) {
                    console.log('error deleting file ', error);
                }
                console.log('tmp avatar file deleted');
            });
        }
    } catch (error) {
        console.error(" Error while uploading to the bucket or updating DB:" + error);
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