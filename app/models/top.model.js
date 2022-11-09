const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');


if (process.env.REDISCLOUD_URL) {
    // rediscloud connection
    var redis = require('redis');
    var client = redis.createClient(process.env.REDISCLOUD_URL, {no_ready_check: true});

} else {
    var client = require("redis").createClient();
}

/* 
if (process.env.REDISTOGO_URL) {
    // TODO: redistogo connection
    var rtg   = require("url").parse(process.env.REDISTOGO_URL);
    var client = require("redis").createClient(rtg.port, rtg.hostname);
    client.auth(rtg.auth.split(":")[1]);
} else {
    var client = require("redis").createClient();
} */


const Anime = mongoose.Schema({
    title: { type: String },
    id: { type: String, default: 'na' },
    img_url: { type: String },
    episodeNumber: { type: Number },
    episodes: { type: Number, default: 0 },
    type: { type: String, default: 'TV' },
    score: { type: Number }
},{ _id : false });


const TopSchema = mongoose.Schema({
    TRENDING: [Anime],
    ALL_TIME_POPULAR: [Anime],
    UPCOMING: [Anime],
    TOP_OF_THE_WEEK: [Anime],
   
});
TopSchema.plugin(beautifyUnique);

const Top = module.exports = mongoose.model('Top', TopSchema);

module.exports.update_TOP_OF_THE_WEEK = async(newList, callback) => {
    try {
        console.log(newList);
        Top.findOneAndUpdate({},
            {
                $set : {
                    'TOP_OF_THE_WEEK': newList
                }
            }, (err, res) => {
                if (err) {
                    console.log(err);
                    callback(null, err);
                }
                callback(null, true);
            }
        )
    } catch (error) {
        console.log(error);
    }
}

module.exports.getTrending = async (callback) => {
    try {
        client.get('TRENDING', (err, result) => {
                if (result && result['TRENDING'] !== undefined) {
                    const resultJSON = JSON.parse(result);
                    callback(null, resultJSON);
                } else {
                    Top.find({},{'TRENDING': 1})
                        .then(
                            _result => {
                                client.setex('TRENDING', 5400, JSON.stringify(_result));

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

module.exports.getPopular = async (callback) => {
    try {
        client.get('ALL_TIME_POPULAR', (err, result) => {
                if (result && result['ALL_TIME_POPULAR'] !== undefined) {
                    const resultJSON = JSON.parse(result);
                    callback(null, resultJSON);
                } else {
                    Top.find({},{'ALL_TIME_POPULAR': 1})
                        .then(
                            _result => {
                                client.setex('ALL_TIME_POPULAR', 5400, JSON.stringify(_result));
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

module.exports.getUpcoming = async (callback) => {
    try {
        client.get('UPCOMING', (err, result) => {
                if (result && result['UPCOMING'] !== undefined) {
                    const resultJSON = JSON.parse(result);
                    callback(null, resultJSON);
                } else {
                    Top.find({},{'UPCOMING': 1})
                        .then(
                            _result => {
                                client.setex('UPCOMING', 5400, JSON.stringify(_result));
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

module.exports.getAll = async (callback) => {
    try {
        client.get('TOPS', (err, result) => {
            if (result && result['TOPS'] !== undefined) {
                const resultJSON = JSON.parse(result);
                callback(null, resultJSON);
            } else {
                Top.find({},{})
                .then(
                    _result => {
                        client.setex('TOPS', 5400, JSON.stringify(_result));
                        callback(null, _result);
                    }
                );
            }
        });
    } catch (error) {
        console.log(error);
        callback(null, false);
    }
}