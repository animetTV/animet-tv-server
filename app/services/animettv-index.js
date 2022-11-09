const Jikan = require("animet-jikan-wrapper");
const mal = new Jikan();
const offline_database = require("../../anime-offline-database-minified.json");
const animettvIndex = require("../models/animetv-index.model");
const preparedTilte = require("../../preparedtitles.json");
const cliProgress = require("cli-progress");
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

let searchTitle = async (term, callback) => {
  try {
    let searchTerm = term.toLowerCase();
    animettvIndex.getAnimettvIndex((err, index) => {
      if (err) {
        return Promise.reject(false);
      }
      let results = index[0]["animettv"].filter((o) =>
        o.title_offline.toLowerCase().includes(searchTerm)
      );

      if (!results.length > 0) {
        // search for synonoms similarity
        let results_via_synonyms = [];
        let result_bySynonyms = index[0]["animettv"].filter((o) => {
          for (let i = 0; i < o.synonyms.length; i++) {
            if (o.synonyms[i].toLowerCase().includes(searchTerm)) {
              results_via_synonyms.push({
                title: o.title,
                img_url: o.img_url,
                episodes: o.episodes,
                airing_start: o.airing_start,
              });
              break;
            }
          }
        });

        callback(null, results_via_synonyms);
      } else {
        let accepted_results = [];
        results.forEach((el) => {
          accepted_results.push({
            title: el.title,
            img_url: el.img_url,
            episodes: el.episodes,
            airing_start: el.airing_start,
          });
        });
        callback(null, accepted_results);
      }
    });
  } catch (error) {
    console.log(error);
    callback(null, false);
  }
};

let buildAnimettvIndex = async () => {
  try {
    let result = [];
    let data_offline = offline_database["data"];
    let data_prepared_title = preparedTilte;
    let _count = 1;
    bar1.start(preparedTilte.length, 1);
    data_prepared_title.forEach((el) => {
      let _title, _id, _orgTitle;
      if (el.title.includes("(Dub)")) {
        _orgTitle = el.title;
        _title = el.title;
        _title = _title.replace("(Dub)", "").trim();
        _id = el.id;
      } else {
        _title = el.title;
        _id = el.id;
        _orgTitle = el.title;
      }

      // find all the realted data from data_offline
      for (let i = 0; i < data_offline.length; i++) {
        if (data_offline[i].title.includes(_title)) {
          let tmpItem = {
            title_offline: data_offline[i].title,
            title: _orgTitle,
            id: _id,
            episodes: data_offline[i].episodes,
            img_url: data_offline[i].picture,
            airing_start: data_offline[i].animeSeason.year,
            synonyms: data_offline[i].synonyms,
          };

          result.push(tmpItem);
          _count++;
          bar1.update(_count);
          break;
        }
      }
    });

    animettvIndex.deleteMany({}, (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      console.log("old animettvIndex dropped");

      let newAnimettvIndex = new animettvIndex({
        animettv: result,
      });
      newAnimettvIndex.save();
      console.log("new animettvIndex saved");
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  buildAnimettvIndex,
  searchTitle,
};
