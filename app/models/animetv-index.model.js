const mongoose = require("mongoose");
const beautifyUnique = require("mongoose-beautiful-unique-validation");

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

} else {
  var client = require("redis").createClient();
}


const Anime = mongoose.Schema(
  {
    title_offline: { type: String },
    title: { type: String },
    id: { type: String },
    episodes: { type: Number },
    img_url: { type: String },
    airing_start: { type: Number, default: 0 },
    synonyms: [String],
  },
  { _id: false }
);

const AnimettvIndexSchema = mongoose.Schema({
  animettv: [Anime],
});
AnimettvIndexSchema.plugin(beautifyUnique);

const AnimettvIndex = (module.exports = mongoose.model(
  "AnimettvIndex",
  AnimettvIndexSchema
));

module.exports.getAnimettvIndex = async (callback) => {
  try {
    /* AnimettvIndex.find({},{_id: 0})
        .then(
            _result => {
                callback(null, _result);
            }
        ) */
    client.get("AnimettvIndex", (err, result) => {
      if (result) {
        const resultJSON = JSON.parse(result);
        callback(null, resultJSON);
      } else {
        AnimettvIndex.find({}, { _id: 0 }).then((_result) => {
          client.setex("AnimettvIndex", 50400, JSON.stringify(_result));
          callback(null, _result);
        });
      }
    });
  } catch (error) {
    console.log(error);
    callback(null, false);
  }
};

module.exports.getRandomAnimeList = async (limit, result) => {
  try {
    AnimettvIndex.find({}, (err, arr) => {
      if (err) {
        console.log(err);
        result(false);
      } else {
        result(null, arr);
      }
    });
  } catch (error) {
    console.log(error);
  }
};
