const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');

/* if (process.env.REDISTOGO_URL) {
    // TODO: redistogo connection
    var rtg   = require("url").parse(process.env.REDISTOGO_URL);
    var client = require("redis").createClient(rtg.port, rtg.hostname);
    client.auth(rtg.auth.split(":")[1]);
} else {
    var client = require("redis").createClient();
}
 */
if (process.env.REDISCLOUD_URL) {
    // rediscloud connection
    var redis = require('redis');
    var client = redis.createClient(process.env.REDISCLOUD_URL, {no_ready_check: true});
   
    //redistogo connection
    /* var rtg   = require("url").parse(process.env.REDISTOGO_URL);
    var client = require("redis").createClient(rtg.port, rtg.hostname);
    client.auth(rtg.auth.split(":")[1]); */
} else {
    var client = require("redis").createClient();
}


const Anime = mongoose.Schema({
    title: {type: String},
    img: {type: String},
    synopsis: {type: String},
    isAIContent: {type: Boolean, default: false }
  
},{ _id : false });

const SpotlightSchema = mongoose.Schema({
    spotlight: [Anime],
});
SpotlightSchema.plugin(beautifyUnique);

const Spotlight = module.exports = mongoose.model('Spotlight', SpotlightSchema);

module.exports.getSpotlight = async (callback) => {
    try {
        client.get('spotlight', (err, result) => {  
            if (result && result['spotlight'] !== undefined) {
                    const resultJSON = JSON.parse(result);
                    callback(null, resultJSON);
                } else {
                    Spotlight.find({},{_id: 0})
                        .then(
                            _result => {
                                client.setex('spotlight', 5400, JSON.stringify(_result));
                                callback(null, _result);
                            }
                        )
                }
            })
    } catch (error) {
        console.log(error);
        callback(null, false);
    }
}
