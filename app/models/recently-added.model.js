const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');
const Jikan = require('jikan4.js');
const { delay } = require('bluebird');
const mal = new Jikan.Client();
require('dotenv').config();

/* if (process.env.REDISTOGO_URL) {
    // TODO: redistogo connection
    var rtg   = require("url").parse(process.env.REDISTOGO_URL);
    var client = require("redis").createClient(rtg.port, rtg.hostname);
    client.auth(rtg.auth.split(":")[1]);
} else {
    var client = require("redis").createClient();
} */

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


const RecentlyAddedEntity = mongoose.Schema({
    title: { type: String },
    id: { type: String },
    img_url: { type: String },
    episodeNumber: { type: Number},
    type: { type : String, default: 'TV'},
    score: { type: Number }
},{ _id : false });

const RecentlyAddedSchema = mongoose.Schema({
    SUB: [RecentlyAddedEntity],
    DUB: [RecentlyAddedEntity]
});
RecentlyAddedSchema.plugin(beautifyUnique);

const RecentlyAdded = module.exports = mongoose.model('RecentlyAdded', RecentlyAddedSchema);

/* module.exports.getRecentlyAdded = async (callback) => {
    try {
        RecentlyAdded.find({},{_id: 0})
                        .then(
                            _result => {
                                
                                callback(null, _result);
                            }
                        )
    } catch (error) {
        console.log(error);
        callback(null, false);
    }
} */

module.exports.getRecentlyAdded = async (callback) => {
    try {
        client.get('RecentlyAdded', (err, result) => { 
            // check if redis have any data store if not fetch from DB
            if ((result !== undefined) && (result !== null)) {
                    const resultJSON = JSON.parse(result);
                    callback(null, resultJSON);
                } else {
                    RecentlyAdded.find({},{_id: 0})
                        .then(
                            _result => {
                                client.setex('RecentlyAdded', 14400, JSON.stringify(_result));
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


module.exports.populateRatingsWithJikan = async(callback) => {
    try {
        let result = await RecentlyAdded.find({}, {_id:0});
        console.log(result);
                let SUB = result[0].SUB;
                let DUB = result[0].DUB;
                populateRatings(SUB,DUB,SUB.length, DUB.length);
    
            async function populateRatings(_sub, _dub, sublen, dublen) {
                try {
                    let NEW_SUB = [], NEW_DUB = [];
                    // for SUB
                    let i = 0;
                    while(i<sublen) {
                        const targetTitle = _sub[i].title; 
                        const animeResult = await mal.anime.search(targetTitle);
                        const _score = animeResult[0].score;
                        NEW_SUB[i] = {
                            type: _sub[i].type,
                            title: _sub[i].title,
                            id: _sub[i].id,
                            img_url: _sub[i].img_url,
                            episodeNumber: Number(_sub[i].episodeNumber),
                            score: _score 
                        }
                        console.log(`recently added score update: SUB | ${(i/sublen)}`);
                        await delay(2000);
                        i++;
                    }

                    // for dub
                    let j = 0;
                    while(j<dublen) {
                        const targetTitle = _dub[j].title; 
                        const animeResult = await mal.anime.search(targetTitle);
                        const _score = animeResult[0].score;
                        NEW_DUB[j] = {
                            type: _dub[j].type,
                            title: _dub[j].title,
                            id: _dub[j].id,
                            img_url: _dub[j].img_url,
                            episodeNumber: Number(_dub[j].episodeNumber),
                            score: _score 
                        }
                        console.log(`recently added score update: DUB | ${(j/dublen)}`);
                        await delay(1800);
                        j++;
                    }
                    // drop old document
                    RecentlyAdded.cleanRecentlyAdded();
                    // save new version with rating
                    const newRecentlyAdded = new RecentlyAdded({
                        SUB: NEW_SUB,
                        DUB: NEW_DUB
                    }); 

                    newRecentlyAdded.save();
                    console.log('RecentlyAdded saved');

                } catch (error) {
                    console.log(error);
                }
            }
    } catch (error) {
        console.log(error);
        callback(null, false);
    }
}

module.exports.cleanRecentlyAdded = async() => {
    try {
        RecentlyAdded.deleteMany({} , (err) => {
            if (err) {
              console.error(err);
              process.exit(1);
            }
        
            console.log('RecentlyAdded cleared');
          });
    } catch (error) {
        console.log(error);
    }
}