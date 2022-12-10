require("dotenv").config();
const express = require("express");
const router = express.Router();
const SeasonAnime = require("../models/season.model");
const Jikan = require("animet-jikan-wrapper");
const mal = new Jikan();
const Top = require("../models/top.model");
const Post = require("../models/post.model");
const Genre = require("../models/genres.model");
const Movie = require("../models/movies.model");
const PreparedTitle = require("../models/prepared-title.model");
const RecentlyAdded = require("../models/recently-added.model");
const Spotlight = require("../models/spotlight.model");
const preparedTitleJson = require("../../preparedtitles.json");
const AnimettvIndexService = require("../../app/services/animettv-index");
const AnimettvIndex = require("../../app/models/animetv-index.model");
const rateLimit = require("express-rate-limit");
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 86400 }); // 24hrs

// cache middleware
const verifyCacheSeasonDetail = (req, res, next) => {
  try {
    if (cache.has(`seasons-data`)) {
      return res.status(200).json(cache.get(`seasons-data`));
    }
    return next();
  } catch (err) {
    throw new Error(err);
  }
};

const verifyCacheTops = (req, res, next) => {
  try {
    if (cache.has(`tops`)) {
      return res.status(200).json(cache.get(`tops`));
    }
    return next();
  } catch (err) {
    throw new Error(err);
  }
};

const verifyCacheGenres = (req, res, next) => {
  try {
    if (cache.has(`genres`)) {
      return res.status(200).json(cache.get(`genres`));
    }
    return next();
  } catch (err) {
    throw new Error(err);
  }
};

const verifyCacheRecentlyAdded = (req, res, next) => {
  try {
    if (cache.has(`recently_added`)) {
      return res.status(200).json(cache.get(`recently_added`));
    }
    return next();
  } catch (err) {
    throw new Error(err);
  }
};

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 180,
});

const seasonLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 5 minutes
  max: 35,
});

const defaultLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 60,
});

const hardLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 20
})


router.get("/get-current-top-season", seasonLimiter, async (req, res) => {
  try {
    const getSeason = (d) => Math.floor((d.getMonth() / 12) * 4) % 4;
    const season = ["Winter", "Spring", "Summer", "Fall"][
      getSeason(new Date())
    ];
    const year = new Date().getFullYear();

    const result = await SeasonAnime.getTopSeason({
      season: season,
      year: year,
    });
    res.json(result);
  } catch (error) {
    console.log(error);
  }
});

router.get("/get-season-by-id", async (req, res) => {
  try {
    const result = await SeasonAnime.getSeasonById(req.query.id);
    if (result) {
      res.json(result);
    } else {
      res.json({ success: false, message: `Sorry We could't find it` });
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/get-seasons-data", verifyCacheSeasonDetail, seasonLimiter, async (req, res) => {
  try {
    const AVAILABLE_SEASONS = await SeasonAnime.getSeasonsDetail();
    cache.set('seasons-data', AVAILABLE_SEASONS);
    res.json(AVAILABLE_SEASONS);
  } catch (error) {
    console.log(error);
  }
});

router.get("/search", searchLimiter, async (req, res) => {
  try {
    let searchTerm = req.query.word;
    AnimettvIndexService.searchTitle(searchTerm, (err, result) => {
      if (err) {
        res.sendStatus(500);
      }
      res.json(result);
    });
  } catch (error) {
    console.log(error);
  }
});

router.get('/tops', verifyCacheTops, defaultLimiter, async (req,res) => {
  try {
    Top.getAll((err, callback) => {
      if (err) {
        res.sendStatus(404);
      }
      if (callback) {
        cache.set('top', callback[0]);
        res.json(callback[0]);
      }
    });
  } catch (error) {
    res.status(404).json({success: false})
  }
})

router.get("/trending", defaultLimiter, async (req, res) => {
  try {
    Top.getTrending((err, callback) => {
      if (err) {
        res.sendStatus(404);
      }

      if (callback) {
        res.json(callback[0].TRENDING);
      }
    });
  } catch (error) {
    res.status(404).json({ success: false });
    console.log(error);
  }
});

router.get("/all-time-popular", defaultLimiter, async (req, res) => {
  try {
    Top.getPopular((err, callback) => {
      if (err) {
        res.sendStatus(404);
      }

      if (callback) {
        res.json(callback[0].ALL_TIME_POPULAR);
      }
    });
  } catch (error) {
    res.json({ success: false });
    console.log(error);
  }
});

router.get("/upcoming", defaultLimiter, async (req, res) => {
  try {
    Top.getUpcoming((err, callback) => {
      if (err) {
        res.sendStatus(404);
      }

      if (callback) {
        res.json(callback[0].UPCOMING);
      }
    });
  } catch (error) {
    res.json({ success: false });
    console.log(error);
  }
});

router.get("/on-going-series", defaultLimiter, async (req, res) => {
  try {
    let pageNumber = Number(req.query.pageNumber);
    let result = await Top.getUpcoming(pageNumber);

    res.json(result[0].UPCOMING);
  } catch (error) {
    res.json({ success: false });
    console.log(error);
  }
});

router.get("/all-time-popular-hentai", defaultLimiter, async (req, res) => {
  try {
    let result = await Post.getTopHentai();
    res.json(result);
  } catch (error) {
    res.json({ success: false });
    console.log(error);
  }
});

router.get("/genres", verifyCacheGenres, defaultLimiter, async (req, res) => {
  Genre.getAnimeGenres((err, result) => {
    if (err) {
      res.sendStatus(404);
      throw err;
    }
    cache.set('genres', result);
    res.json(result);
  });
});

router.get("/movies", defaultLimiter, async (req, res) => {
  Movie.getMovies((err, result) => {
    if (err) {
      res.sendStatus(404);
      throw err;
    }
    res.json(result);
  });
});

router.get("/prepared-title", hardLimiter, async (req, res) => {
  try {
    PreparedTitle.getPreparedTitle((err, result) => {
      if (err) {
        res.sendStatus(404);
        throw err;
      }

      if (result) {
        res.json(result);
      }
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }/*  */
});

router.get("/prepared-title-all", hardLimiter, async (req, res) => {
  try {
    PreparedTitle.getPreparedTitle((err, result) => {
      if (err) {
        res.sendStatus(404);
        throw err;
      }

      if (result) {
        res.json(result[0]);
      }
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

router.get("/recently-added", verifyCacheRecentlyAdded, defaultLimiter, async (req, res) => {
  try {
    RecentlyAdded.getRecentlyAdded((err, result) => {
      if (err) {
        res.sendStatus(404);
        throw err;
      }

      if (result) {
        cache.set('recently_added', result[0]);
        res.json(result[0]);
      }
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

router.get("/spotlight", defaultLimiter, async (req, res) => {
  try {
    Spotlight.getSpotlight((err, result) => {
      if (err) {
        res.sendStatus(404);
        throw err;
      }
      if (result) {
        res.json(result[0]["spotlight"]);
      }
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

router.get("/random", defaultLimiter, async (req, res) => {
  try {
    AnimettvIndex.getRandomAnimeList(5, (err, result) => {
      if (err) {
        console.log(err);
      }
      res.json(result);
    });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

module.exports = router;
