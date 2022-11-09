require('dotenv').config()
const Jikan = require('animet-jikan-wrapper');
const mal = new Jikan();
//mal.changeBaseURL(process.env.ANIMET_JIKAN_API_URL);
const SeasonAnime = require('../../models/season.model');
const { delay } = require('bluebird');

/* calculate season based on Northern hemispher */
let populateNewSeason = async (_year, _season) => {
    try {
        const season = _season;
        const year = _year;

        mal.findSeason(season, String(year)).then(
            result => {
                const newSeason = new SeasonAnime({
                    animeList: result
                });

                newSeason.save();
            }
        )

    } catch (error) {
        console.log(error);
    }
}  

let getCurrentSeason = () => {
    const getSeason = d => Math.floor((d.getMonth() / 12 * 4)) % 4
    return  ['winter', 'spring', 'summer', 'fall'][getSeason(new Date())];
}

let bulkBuildSeasons = async(startYear, endYear) => {
    try {
        let seasons = ['winter', 'spring', 'summer', 'fall'];
        // for each year
        for (let _year = startYear; _year < endYear; _year++) {
            // for each season
            for (let _season = 0; _season < seasons.length; _season++) {
                let season = seasons[_season];
                let year = _year;

                mal.findSeason(season, String(year))
                    .then( result => {
                        const newSeason = new SeasonAnime({
                            animeList: result
                        });
                        
                        newSeason.save();
                    });
                await delay(2700);
                console.log(`Saved season:${season} \n year:${year}`);
            }

            console.log(`Progress: ${ Math.ceil(_year/(endYear-startYear))}`);
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    populateNewSeason,
    getCurrentSeason,
    bulkBuildSeasons
}