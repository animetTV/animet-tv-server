const Jikan = require('animet-jikan-wrapper');
const { delay } = require('bluebird');
const mal = new Jikan();
const data = require('../../recommendations.json');
var fs = require('fs')

const getStaticRecommendations = async () => {
    try {
        var _MustWatch = data;
        for (let i = 0; i < _MustWatch.length; i++) {
           for (let j = 0; j < _MustWatch[i].Anime.length; j++) {
                var title =_MustWatch[i].Anime[j].Title;
                var img_url = '';

                // get img_url 
                var result = await mal.search('anime', title);
                result.results.every(el => {
                    if (el.title === title) {
                        img_url = el.image_url;
                        return false;
                    }
                    return true;
                });

                // update json
                _MustWatch[i].Anime[j].img_url = img_url;
                console.log('updated: ', title , '  ', img_url);
                await delay(2000);
           }
        }

        // save to new json
        fs.writeFileSync("./updated_reccomendation.json", JSON.stringify(_MustWatch));
        console.log('saved file successfully');

    }catch (error) {
        console.log(error);
    }
}

getStaticRecommendations();