require('dotenv').config();
const cheerio = require("whacko");
const rs = require("request");
const path = require('path');
const fs = require('fs');
const stringSimilarity = require("string-similarity");
const Top = require("../../models/top.model");

/* let buildTopWeek = async(callback) => {
    let url = `https://www.anime-xpress.com/poll-anime/`;
    let topOfTheWeek = [];
    rs(url, (err, resp, html) => {
        if (!err) {
          try {
            var $ = cheerio.load(html);
            $('.frm_text_label_for_image_inner').each(function (index, element) {
                let title = $(this).text();
                title = title.replace(/^[ ]+|[ ]+$/g,'');
                title = title.replace(/\n/g, '');
                title = title.replace(/\t/g, '');
                title = title.trim();
                topOfTheWeek[index] = {
                    title: title,
                }
            });
            
            let result = cleanUpTitles(topOfTheWeek);
            callback(result);
          } catch (e) {
            console.log(e);
          }
        }
      }); 
} */

let buildTopWeek = async(callback) => {
  let url = `https://kitsu.io/api/edge/trending/anime?limit=80`;
  let topOfTheWeek = [];
  rs(url, (err, resp, html) => {
      if (!err) {
        try {
          let data = JSON.parse(resp.body);
          data.data.forEach(el => {
            if (el.attributes.titles.en_jp) {
              topOfTheWeek.push({
                title: el.attributes.titles.en_jp,
                id: el.attributes.slug,
                img_url: el.attributes.posterImage.medium,
                episodes: el.attributes.episodeCount,
                type: el.attributes.subtype,
                score: convertKitsuScore(el.attributes.averageRating),
              });
            }
          });
          callback(topOfTheWeek.shuffle());
        } catch (e) {
          console.log(e);
        }
      }
    }); 
}

function convertKitsuScore(score) {
  return parseInt(score)/10;
}


function uniqByKeepLast(data, key) {
  return [
    ...new Map(
      data.map(x => [key(x),x])
    ).values()
  ]
}

let updatedTopWeekly = async(top_of_the_week, callback) => {
  try {
    await Top.update_TOP_OF_THE_WEEK(top_of_the_week, (err, result) => {
      if (err) {
        console.log(err);
      }
      if (result) {
        console.log('successfully updated TOP_OF_THE_WEEK');
        callback(null, result);
      }
    })
  } catch (error) {
    console.log(error);
  }
}

Array.prototype.shuffle = function() {
  let m = this.length, i;
  while (m) {
    i = (Math.random() * m--) >>> 0;
    [this[m], this[i]] = [this[i], this[m]]
  }
  return this;
}

module.exports = {
    buildTopWeek,
    updatedTopWeekly
}