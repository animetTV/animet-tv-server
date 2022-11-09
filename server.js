require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const path = require('path');
const logger = require('morgan');
const dbConfig = require('./app/config/mongodb.config');
const passport = require('passport');
const cron = require('cron').CronJob;
const compression = require('compression');
const session = require('cookie-session');

// const { database_population, database_clean } = require('./deploy/database_setup');
// const { sortEachAnimeSeason } = require('./app/services/cron_tasks/sort_each_anime_season');
// const { populateNewSeason } = require('./app/services/cron_tasks/add_new_anime_season');
const { populateDailyTop, populateNewGenre } = require('./app/services/cron_tasks/get_daily_top'); 
const animixplay = require('./app/services/cron_tasks/get_animixplay_data');
const recentlyadded = require('./app/services/cron_tasks/get_recently_added');
const spotlight = require('./app/services/cron_tasks/get_spotlight');
const seasonBuilder = require('./app/services/cron_tasks/add_new_anime_season');
const buildAnimettvIndex = require('./app/services/animettv-index');
const metricaStatsService = require("./app/services/cron_tasks/get_metrica_stats");
const corsAnyWhere = require('./app/services/cors-anywhere');

var allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:3001',
    'http://localhost:3000',
    'https://animet-server.herokuapp.com',
    'https://animet.tv',
    'https://animet.site',
    'https://beta.animet.tv',
    'https://6162027bc2d4cd00081b5c32--animet.netlify.app',
    'https://animet-stream-api-4ywcb.ondigitalocean.app',
    'https://beta-animet-stream-api.herokuapp.com/',
    
  ];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);
  

/* app.use(cors());
app.options('*', cors()); */
app.use(logger('short'));
// MethodOverride
app.use(methodOverride('_method'));

// BodyParser Middleware 
app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json());

app.use(session({ 
    secret: `${process.env.SESSION_SECRET}`,  resave: true,
    saveUninitialized: true }));
app.use(require('flash')());
app.use(compression());
// Passport Middleware 
app.use(passport.initialize());
app.use(passport.session());
require('./app/config/passport')(passport);


// ROUTES
const post = require('./app/routes/post.routes');
const popular = require('./app/routes/popular.routes');
const user = require('./app/routes/user.routes');
const watchAnime = require('./app/routes/watch-anime.routes');
const serverStat = require('./app/routes/server-stat.routes');
const adminUser = require('./app/routes/admin-user.routes');

app.use('/api/post', post);
app.use('/api/popular', popular);
app.use('/api/user', user);
app.use('/api/admin-user', adminUser);
app.use('/api/watch-anime', watchAnime);
app.use('/server-stat', serverStat);
app.use(express.static(__dirname + '/public'));


// Configuring the database
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const url = dbConfig.live_url;
const connectDB = async () => {
    try {
        await mongoose.connect(url, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB.");
        /* test_data.initial_testData(); */
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};
// Connecting to the database
connectDB();

// handel favicon request
app.get('/favicon.ico', (req, res) => res.status(204));

//populateDailyTop();
/* populateNewGenre(); */
// animixplay.populatePreparedTitle();
/* animixplay.populateMovies(); */

// Devlopment
/* database_clean(); */
/* database_population(); */
/* recentlyadded.cleanRecentlyAdded();
recentlyadded.populateRecentlyAdded(); */
/* spotlight.buildWeeklySpotlight() */
/* const RecentlyAdded = require('./app/models/recently-added.model');
RecentlyAdded.populateRatingsWithJikan((err, status) => {
  if (err) {
    console.log(err);
  }
  console.log(status);
}) */

/* buildAnimettvIndex.buildAnimettvIndex(); */

const animetrendz = require("./app/services/cron_tasks/get_anitrendz");
const funimation = require('./app/services/cron_tasks/get_funimation');
/* animetrendz.buildTopWeek(res => {
  if (res) {
    animetrendz.updatedTopWeekly(res, (err, result) => {
      if (err) {
        console.log(err);
      }
    });
  }
}); */
/* corsAnyWhere.updateCorsAnyWhereNodeStatus((err, result) => {
  if (err) {
    console.log('error while updating redis KEY:CorsAnyWhereList');
  } 
  if (result) {
    console.log('redis KEY:CorsAnyWhereList updated');
  }
}); */
/* const comicDataCollection = require('./app/services/tmp/data-collection-comics');

comicDataCollection.fetchAvailableTitles(1,5); */
/* comicDataCollection.downloadAllCovers(4); */

/* seasonBuilder.bulkBuildSeasons(2022, 2023); */
/* funimation.buildFunimationIndex((res) => {
  console.log(res);
}) */

/* CRON tasks every day hours */
const daily_db_workers = new cron("0 6 * * *", async() => {
    console.log('going maintenance mode updating Database . . .');
    await populateDailyTop();
    await populateNewGenre();
    await animixplay.populatePreparedTitle();
    await recentlyadded.cleanRecentlyAdded();
    await recentlyadded.populateRecentlyAdded();
    await spotlight.buildWeeklySpotlight();
    await animetrendz.buildTopWeek(res => {
      if (res) {
        animetrendz.updatedTopWeekly(res, (err, result) => {
          if (err) {
            console.log(err);
          }
        });
      }
    });
    
    console.log('done updating database') 
});

/* CRON tasks every minute*/
const minute_db_workers = new cron("* * * * *", async() => {
    console.log('going maintenance mode updating Database . . .');
    //metricaStatsService.fetchTotalUserSession();
    console.log('done updating database')
});



/* CRON tasks every hour */
const hourly_worker = new cron("0 * * * *", async() => {
  console.log('hourly worker tasks initilized');
  corsAnyWhere.updateCorsAnyWhereNodeStatus((err, result) => {
    if (err) {
      console.log('error while updating redis KEY:CorsAnyWhereList');
    } 
    if (result) {
      console.log('redis KEY:CorsAnyWhereList updated');
    }
  });
  metricaStatsService.fetchTotalUserSession();

  console.log('hourly worker tasks completed');
  
})

daily_db_workers.start();
hourly_worker.start();
//minute_db_workers.start();
module.exports = app;
