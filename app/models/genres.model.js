const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');

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

const Anime = mongoose.Schema({
    img_url: { type: String },
    title: { type: String }
},{ _id : false });


const GenreSchema = mongoose.Schema({
    Action : [Anime],
    Adventure : [Anime],
    Cars : [Anime],
    Comedy : [Anime],
    Dementia : [Anime],
    Demons : [Anime],
    Drama : [Anime],
    Dub : [Anime],
    Ecchi : [Anime],
    Fantasy : [Anime],
    Game : [Anime],
    Harem : [Anime],
    Historical : [Anime],
    Horror : [Anime],
    Josei : [Anime],
    Kids : [Anime],
    Magic : [Anime],
    Martial_Arts : [Anime],
    Mecha : [Anime],
    Military : [Anime],
    Music : [Anime],
    Mystery : [Anime],
    Parody : [Anime],
    Police : [Anime],
    Psychological : [Anime],
    Romance : [Anime],
    Samurai : [Anime],
    School : [Anime],
    Sci_Fi : [Anime],
    Seinen : [Anime],
    Shoujo : [Anime],
    Shoujo_Ai : [Anime],
    Shounen : [Anime],
    Shounen_Ai : [Anime],
    Slice_of_Life : [Anime],
    Space : [Anime],
    Sports : [Anime],
    Super_Power : [Anime],
    Supernatural : [Anime],
    Thriller : [Anime],
    Vampire : [Anime],
    Yaoi: [Anime],
    Yuri: [Anime]
});
GenreSchema.plugin(beautifyUnique);

const Genre = module.exports = mongoose.model('Genre', GenreSchema);

module.exports.getAnimeGenres = async (callback) => {
    try {
        client.get('GENRES', (err, result) => {
                if (result) {
                    const resultJSON = JSON.parse(result);
                    callback(null, resultJSON);
                } else {
                    Genre.find({},{_id: 0})
                        .then(
                            _result => {
                                client.setex('GENRES', 21600, JSON.stringify(_result));
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

