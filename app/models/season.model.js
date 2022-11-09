const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');

const SeasonAnimeSchema = mongoose.Schema({
  animeList: {
    type: Object
  } 
});
SeasonAnimeSchema.plugin(beautifyUnique);

const SeasonAnime = module.exports = mongoose.model('SeasonAnime', SeasonAnimeSchema);
const AMOUNT = 20;

module.exports.getTopSeason = async (request) => {
  try {
    const season_name = request.season;
    const season_year = request.year;
    /* 
      title: string;
      img_url: string;
      score: string;
      genre: string;
      synopsis: string;
      members: number;
       */
    var SORTED_RESULT = [];

    const result =  await SeasonAnime.find({ "animeList.season_name": season_name, "animeList.season_year": season_year });

    const getAllGenres = (genreObj) => {
      let genre = "";
      genreObj.forEach(el => {
        genre += el.name + ', ';
      });
      return genre;
    }

    const getScore = (score) => {
      if (score === null ) {
        return 'n/a';
      } else {
        return String(score);
      }
    }

    if (result[0]) {
      /* extract every anime from array */
      result[0].animeList.anime.forEach(anime => {
        const animeItem = ({
          title: anime.title,
          img_url: anime.image_url,
          score: getScore(anime.score),
          genre: getAllGenres(anime.genres),
          synopsis: anime.synopsis,
          members: anime.members,
        });
        SORTED_RESULT.push(animeItem);
      });
      /* Sort SORTED_RESULT by members val in acending order */
      SORTED_RESULT.sort((a,b) => {
        return b.members - a.members;
      });
  
      /* Return only first N amount */
      return SORTED_RESULT.slice(0,AMOUNT);
    }

  } catch (error) {
    console.log(error);
  }
}


module.exports.getSeasonById = async (id) => {
  try {
    var SORTED_RESULT = [];

    const getAllGenres = (genreObj) => {
      let genre = "";
      genreObj.forEach(el => {
        genre += el.name + ', ';
      });
      return genre;
    }

    const getScore = (score) => {
      if (score === null ) {
        return 'n/a';
      } else {
        return String(score);
      }
    }

    const result = await SeasonAnime.findById({_id: id});
    
    result.animeList.anime.forEach(anime => {
      const animeItem = ({
        
        title: anime.title,
        img_url: anime.image_url,
        mal_id: anime.mal_id,
        score: getScore(anime.score),
        genre: getAllGenres(anime.genres),
        synopsis: anime.synopsis,
        members: anime.members,
      });
      SORTED_RESULT.push(animeItem);
    });

    /* Sort SORTED_RESULT by members val in acending order */
    SORTED_RESULT.sort((a,b) => {
      return b.members - a.members;
    });

    /* Return only first N amount */
    return SORTED_RESULT.slice(0,AMOUNT);


    
  } catch (error) {
    console.log(error);
  }
}

module.exports.getSeasonsDetail = async () => {
  try {
    /* 
      id: number
      season_name: string
      season_year: number
    */
    var AVAILABLE_SEASONS = [];
    const result = await SeasonAnime.find({},{"animeList.season_name": 1, "animeList.season_year": 1});
    
    result.forEach(el => {
      var newSelectionItme = ({
        id: el._id,
        season_name: el.animeList.season_name,
        season_year: el.animeList.season_year, 
      });
      AVAILABLE_SEASONS.push(newSelectionItme);
    });
    return AVAILABLE_SEASONS;
  } catch (error) {
    console.log(error);
  }
}