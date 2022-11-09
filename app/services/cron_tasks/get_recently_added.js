require('dotenv').config();
const rs = require("request");
const animet_stream_api = process.env.ANIMET_STREAM_API_URL;
const RecentlyAdded = require("../../models/recently-added.model");
const { delay } = require('bluebird');
const HelperService = require('../helper-service');
const offline_database = require('../../../anime-offline-database-minified.json');
const { forEach } = require('p-iteration');

let populateRecentlyAdded = async() => {
    try {
        let recentlyAdded_sub = [];
        let recentlyAdded_dub = [];
        // fetch recently added first 2 pages
        let page = 1;

        while(page < 5) {
            let url = `${animet_stream_api}api/v2/recentlyadded/?type=false&page=${page}`;
            rs(url, (err, resp, html) => {
                if (!err) {
                  try {
                    // parse json to array obj
                    let result = JSON.parse(resp.body);
                    result = result.results;
                    result.forEach(el => {
                        recentlyAdded_sub.push({
                            title: el.title,
                            id: el.id,
                            episodeNumber:  Number(el.episodenumber),
                            img_url: el.image,
                            score: 0
                        });
                    });
                   
                  } catch (e) {
                    console.log(e);
                  }
                }
              }); 

              await delay(getRandomInt(2800, 3150));
              page++;
        }

        let dub_page = 1;
        while(dub_page < 5) {
            let url = `${animet_stream_api}api/v2/recentlyadded/?type=true&page=${dub_page}`;
            rs(url, (err, resp, html) => {
                if (!err) {
                  try {
                    // parse json to array obj
                    let result = JSON.parse(resp.body);
                    result = result.results;
                    result.forEach(el => {
                        recentlyAdded_dub.push({
                            title: el.title,
                            id: el.id,
                            episodeNumber:  Number(el.episodenumber),
                            img_url: el.image,
                            score: 0
                        });
                    });
                   
                  } catch (e) {
                    console.log(e);
                  }
                }
              }); 

              await delay(getRandomInt(2800, 3150));
              dub_page++;
        }
        
        const newRecentlyAdded = new RecentlyAdded({
            SUB: recentlyAdded_sub,
            DUB: recentlyAdded_dub
        }); 

        newRecentlyAdded.save();
        console.log('RecentlyAdded saved');

        await delay(5000);
        // populate score 
        RecentlyAdded.populateRatingsWithJikan((err, status) => {
          if (err) {
            console.log(err);
          }
          console.log(status);
        })

       /*  HelperService.appendTitlesToPreparedTitle_IF_NOT_EXISTS(recentlyAdded, (err,callback) => {
            try {
                if (err) {
                    console.log(err);
                } 
                console.log(callback);
            } catch (error) {
                
            }
        }) */

    } catch (error) {
        console.log(error);
    }
}

let cleanRecentlyAdded = async() => {
  RecentlyAdded.cleanRecentlyAdded();
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    cleanRecentlyAdded,
    populateRecentlyAdded
}