const mainServerURL = process.env.MAIN_SERVER_URL;
const axios = require("axios");
const stringSimilarity = require("string-similarity");

let fetchPreparedTitle = async (callback) => {
  try {
    let url = mainServerURL + `api/popular/prepared-title`;
    axios
      .get(url)
      .then((res) => {
        callback(null, res.data);
      })
      .catch((error) => {
        console.error(error);
        callback(null, false);
      });
  } catch (error) {
    callback(null, false);
  }
};

// checks all the recently added titles and append it if not exists already 
// append feature not implemeted only checking
let appendTitlesToPreparedTitle_IF_NOT_EXISTS = async(_recentlyAdded, callback) => {
  try {
    let result = [];
    fetchPreparedTitle(async(err, preparedTitle) => {
      if (err) {
        console.log(err);
     }
     if (preparedTitle) {
      console.log(_recentlyAdded);
      for (let i = 0; i < _recentlyAdded.length; i++) {
          const animeTitle = _recentlyAdded[i].title .toLocaleLowerCase();
          // check each list for match
          // CHECK gogoanime 
          let gogoanime = preparedTitle[0]['gogoanime'];
          let kimanime = preparedTitle[0]['kimanime'];
        console.log(animeTitle);
          for (let i = 0; i < gogoanime.length; i++) {
            if (gogoanime[i].title) {
              let matches = stringSimilarity.compareTwoStrings(gogoanime[i].title.toLowerCase(), animeTitle);
              if (matches > .98) {
                result.push({
                  sourceType: 'gogoanime',
                  animeTitle: gogoanime[i].title,
                  id: gogoanime[i].id,
                }); 
                break;
            }
            }
            
          }
  
          // NOT YET indexing kimanime recent page
          for (let i = 0; i < kimanime.length; i++) {
          let matches = stringSimilarity.compareTwoStrings(kimanime[i].title, animeTitle);
          if (matches > .98) {
            result.push({
              sourceType: 'kimanime',
              animeTitle: kimanime[i].title,
              id: kimanime[i].id
            });
            break;
          }
        }
 
       if (result.length > 0) {
         // already exists
         console.log('exists');
       } else {
         // does not exists add to prepared title gogoanime
         console.log('does not exists');

       }
        
      }

     } else {
       console.log('could not fetch preparedTitle');
     }
    });
  } catch (error) {
      console.log(error);
  }
}


module.exports = {
    fetchPreparedTitle,
    appendTitlesToPreparedTitle_IF_NOT_EXISTS
}
