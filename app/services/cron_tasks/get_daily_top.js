require("dotenv").config();
const Top = require("../../models/top.model");
const Jikan = require("animet-jikan-wrapper");
const cheerio = require("whacko");
const { delay } = require("bluebird");
const mal = new Jikan();
const rs = require("request");
const gogo_baseURL = "https://gogoanime.sk/";
const Genre = require("../../models/genres.model");
const animetrendz = require("./get_anitrendz");

module.exports.populateDailyTop = async () => {
  try {
    var _TRENDING = [];
    var _ALL_TIME_POPULAR = [];
    var _UPCOMING = [];
    var _TOP_OF_THE_WEEK = [];
    var tops_list = [_TRENDING, _ALL_TIME_POPULAR, _UPCOMING];

    // Fetch anime data by subtype
    const fetchAnimeData_by_subType = async (
      index,
      subtype,
      waitAmountPerRequest = 3000,
      pages = 4
    ) => {
      try {
        let _result = [];
        for (let i = 1; i < pages; i++) {
          let result = await mal.findTop("anime", `${i}`, `${subtype}`);
          result.top.forEach((el) => {
            _result.push({
              title: el.title,
              id: el.mal_id,
              img_url: el.image_url,
              episodes: el.episodes,
              type: el.type,
              score: el.score,
            });
          });
          await delay(waitAmountPerRequest);
          console.log(`gathering dailys subtype: ${subtype} page:${i}`);
        }
        tops_list[index] = _result;
      } catch (error) {
        console.log(error);
      }
    };

    const init = async () => {
      try {
        let subtype = ["airing", "bypopularity", "upcoming"];
        for (let i = 0; i < tops_list.length; i++) {
          await fetchAnimeData_by_subType(
            i,
            subtype[i],
            Math.floor(Math.random() * (2500 - 1000) + 1000),
            5
          );
          await delay(2000);
        }

        if (
          tops_list[0].length > 0 &&
          tops_list[1].length > 0 &&
          tops_list[2].length > 0
        ) {
          // create new Top object
          const newTopData = new Top({
            TRENDING: tops_list[0],
            ALL_TIME_POPULAR: tops_list[1],
            UPCOMING: tops_list[2],
            TOP_OF_THE_WEEK: [],
          });

          // Drop old Top object
          Top.deleteMany({}, (err) => {
            if (err) {
              console.error(err);
              process.exit(1);
            }

            console.log("All Tops cleared", new Date());
          });

          // save new Top object
          newTopData.save();
          console.log("Successfully updated DB with new Tops data", new Date());
        } else {
          console.log("error new top scraped data empty.");
        }
      } catch (error) {
        console.log(error);
      }
    };

    // Run
    await init();
  } catch (error) {
    console.log(error);
  }
};

module.exports.populateNewGenre = async () => {
  try {
    var _Action = [];
    var _Adventure = [];
    var _Cars = [];
    var _Comedy = [];
    var _Dementia = [];
    var _Demons = [];
    var _Drama = [];
    var _Dub = [];
    var _Ecchi = [];
    var _Fantasy = [];
    var _Game = [];
    var _Harem = [];
    var _Historical = [];
    var _Horror = [];
    var _Josei = [];
    var _Kids = [];
    var _Magic = [];
    var _Martial_Arts = [];
    var _Mecha = [];
    var _Military = [];
    var _Music = [];
    var _Mystery = [];
    var _Parody = [];
    var _Police = [];
    var _Psychological = [];
    var _Romance = [];
    var _Samurai = [];
    var _School = [];
    var _Sci_Fi = [];
    var _Seinen = [];
    var _Shoujo = [];
    var _Shoujo_Ai = [];
    var _Shounen = [];
    var _Shounen_Ai = [];
    var _Slice_of_Life = [];
    var _Space = [];
    var _Sports = [];
    var _Super_Power = [];
    var _Supernatural = [];
    var _Thriller = [];
    var _Vampire = [];
    var _Yaoi = [];
    var _Yuri = [];

    var genres_list = [
      _Action,
      _Adventure,
      _Cars,
      _Comedy,
      _Dementia,
      _Demons,
      _Drama,
      _Dub,
      _Ecchi,
      _Fantasy,
      _Game,
      _Harem,
      _Historical,
      _Horror,
      _Josei,
      _Kids,
      _Magic,
      _Martial_Arts,
      _Mecha,
      _Military,
      _Music,
      _Mystery,
      _Parody,
      _Police,
      _Psychological,
      _Romance,
      _Samurai,
      _School,
      _Sci_Fi,
      _Seinen,
      _Shoujo,
      _Shoujo_Ai,
      _Shounen,
      _Shounen_Ai,
      _Slice_of_Life,
      _Space,
      _Sports,
      _Super_Power,
      _Supernatural,
      _Thriller,
      _Vampire,
      _Yaoi,
      _Yuri,
    ];

    let updateGenre = async (genre, totalPages, index) => {
      try {
        var type = genre;
        let result = [];
        for (let i = 0; i < totalPages; i++) {
          url = `${gogo_baseURL}genre/${type}?page=${i}`;
          rs(url, (err, resp, html) => {
            if (!err) {
              try {
                var $ = cheerio.load(html);
                $(".img").each(function (index, element) {
                  let title = $(this).children("a").attr().title;
                  let img_url = $(this)
                    .children("a")
                    .children("img")
                    .attr().src;

                  result[index + i] = { title, img_url };
                });
              } catch (e) {
                console.log(e);
              }
            }
          });
          await delay(800);
        }
        console.log(`Done fetching genre: ${genre}`);
        genres_list[index] = result;
      } catch (error) {
        console.log(error);
      }
    };

    //updateGenre('Action',1);
    let genres_name = [
      "Action",
      "Adventure",
      "Cars",
      "Comedy",
      "Dementia",
      "Demons",
      "Drama",
      "Dub",
      "Ecchi",
      "Fantasy",
      "Game",
      "Harem",
      "Historical",
      "Horror",
      "Josei",
      "Kids",
      "Magic",
      "Martial Arts",
      "Mecha",
      "Military",
      "Music",
      "Mystery",
      "Parody",
      "Police",
      "Psychological",
      "Romance",
      "Samurai",
      "School",
      "Sci-Fi",
      "Seinen",
      "Shoujo",
      "Shoujo Ai",
      "Shounen",
      "Shounen Ai",
      "Slice of Life",
      "Space",
      "Sports",
      "Super Power",
      "Supernatural",
      "Thriller",
      "Vampire",
      "Yaoi",
      "Yuri",
    ];
    
    console.log('started fetching new genre data');
    for (let i = 0; i < genres_list.length; i++) {
      await updateGenre(genres_name[i], 20, i);
      await delay(Math.floor(Math.random() * (2100 - 800) + 800));
    }

    // create new Genre object
    const newGenreData = new Genre({
      Action: genres_list[0],
      Adventure: genres_list[1],
      Cars: genres_list[2],
      Comedy: genres_list[3],
      Dementia: genres_list[4],
      Demons: genres_list[5],
      Drama: genres_list[6],
      Dub: genres_list[7],
      Ecchi: genres_list[8],
      Fantasy: genres_list[9],
      Game: genres_list[10],
      Harem: genres_list[11],
      Historical: genres_list[12],
      Horror: genres_list[13],
      Josei: genres_list[14],
      Kids: genres_list[15],
      Magic: genres_list[16],
      Martial_Arts: genres_list[17],
      Mecha: genres_list[18],
      Military: genres_list[19],
      Music: genres_list[20],
      Mystery: genres_list[21],
      Parody: genres_list[22],
      Police: genres_list[23],
      Psychological: genres_list[24],
      Romance: genres_list[25],
      Samurai: genres_list[26],
      School: genres_list[27],
      Sci_Fi: genres_list[28],
      Seinen: genres_list[29],
      Shoujo: genres_list[30],
      Shoujo_Ai: genres_list[31],
      Shounen: genres_list[32],
      Shounen_Ai: genres_list[33],
      Slice_of_Life: genres_list[34],
      Space: genres_list[35],
      Sports: genres_list[36],
      Super_Power: genres_list[37],
      Supernatural: genres_list[38],
      Thriller: genres_list[39],
      Vampire: genres_list[40],
      Yaoi: genres_list[41],
      Yuri: genres_list[42],
    });

    // drop old genre object
    Genre.deleteMany({}, (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      console.log("All Genres cleared", " ", new Date());
    });

    newGenreData.save();
    console.log("Successfully updated DB with new Genre data", " ", new Date());
  } catch (error) {
    console.log(error);
  }
};

module.exports.cleanDailyTop = () => {
  Top.deleteMany({}, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log("All Tops cleared");
  });
};
