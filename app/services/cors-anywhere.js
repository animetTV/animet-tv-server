const isReachable = require('is-reachable');
const CorsAnyWhereList = require('../../cors-anywhere-list.json');
var redis = require('redis');

if (process.env.REDISCLOUD_URL) {
    // rediscloud connection
    var client = redis.createClient(process.env.REDISCLOUD_URL, {no_ready_check: true});
  
  } else {
    var client = require("redis").createClient();
}

// Check links if alive 
let checkCorsAnyWhereNodes = async(callback) => {
    try {
        console.log('checking cors anywhere urls');
        let result = [];
        // test each url from list for status
        for (let i = 0; i < CorsAnyWhereList.length; i++) {
            let linkStatus = await isReachable(CorsAnyWhereList[i].url);
            if (linkStatus) {
                result.push({
                    lable: `${CorsAnyWhereList[i].label}`,
                    continent: `${CorsAnyWhereList[i].continent}`,
                    url: `${CorsAnyWhereList[i].url}`,
                });
            } else { // if fails add it anyways
                console.log({
                    lable: `${CorsAnyWhereList[i].label}`,
                    continent: `${CorsAnyWhereList[i].continent}`,
                    url: `${CorsAnyWhereList[i].url}`,
                    msg: `error this node did not repsonse and still added to list`
                });
            }
        }
        callback(null, result);
    } catch (error) {
        console.log(error);
        callback(null, false);
    }
}

let updateCorsAnyWhereNodeStatus = async(callback) => {
    checkCorsAnyWhereNodes((err, result) => {
       if (err) {
           console.log(err);
       } 
       if (result) {
        client.set('CorsAnyWhereList',JSON.stringify(result));
        callback(null, true);
       }
    })
}

module.exports = {
    checkCorsAnyWhereNodes,
    updateCorsAnyWhereNodeStatus
}