require('dotenv').config();
const animixplay_data_URL = 'https://animixplay.to/assets/s/all.json';
const animixplay_movie_URL = 'https://animixplay.to/a/XsWgdGCnKJfNvDFAM28EV';
const axios = require('axios');
const PreparedTitle = require('../../models/prepared-title.model');
const Movie = require('../../models/movies.model');
const FormData = require('form-data');
const { delay, reject, resolve } = require('bluebird');
const path = require("path");
const fs =require("fs");
const CR_prepared_titles = require('../../../anime_cr_list.json');

const populatePreparedTitle = async () => {
    try {
        let fetchAnimixplay_data = async(callback) => {
            try {
                let url = animixplay_data_URL;
                axios
                    .get(url)
                    .then(res => {
                        callback(null, res.data);
                    })
                    .catch(error => {
                        // if server doesn't allow use local version
                        if (error.response.status === 403) {
                            let data_location = path.join(__dirname, '../../../all.json');
                            console.log(data_location);
                            const data = fs.readFileSync(data_location, 'utf-8');
                            callback(null, JSON.parse(data));
                        }
                        callback(null, false);
                    })
            } catch (error) {
                console.log(error);
                callback(null, false);

            }
        }

       /*  let parseAnimixplay_data = async(data, type, callback) => {
            try {
                let result = [];
                if (type === 'gogoanime') {
                    data.forEach(el => {
                        if (el.e === '1') {
                            let item = ({
                                title: el.title,
                                id: el.id,
                            });
                            result.push(item);
                        }
                    });
                    callback(null, result);
                }
            } catch (error) {
                callback(null, false);
            }
        }; */
        
        let parseAnimixplay_data = async(data, type) => {
            try {
                let result = [];
                if (type === 'gogoanime') {
                    data.forEach(el => {
                        if (el.e === '1') {
                            let item = ({
                                title: el.title,
                                id: el.id,
                            });
                            result.push(item);
                        }
                    });
                    return new Promise(resolve => {
                        console.log('parsed gogoanime successfully');
                        resolve(result)
                    });
                } else if (type === '1anime') {
                    data.forEach(el => {
                        if(el.e === '7') {
                            let _id = el.id.substring(2)
                            let item = ({
                                title: el.title,
                                id: _id,
                            });
                            result.push(item);
                        }
                    });
                    return new Promise(resolve => {
                        console.log('parsed 1anime successfully');
                        resolve(result)
                    });
                }
            } catch (error) {
                throw error;
            }
        };
  
        const init = async () => {
            try {
                fetchAnimixplay_data((err, data) => {
                    if (err) {
                        console.log(err);
                    }

                    if (data) {
                        var result_gogoanime = [];
                        var result_1anime = [];

                        parseAnimixplay_data(data, 'gogoanime')
                            .then(result => {
                                result_gogoanime = result;

                                 // drop old PreparedTitle
                                 PreparedTitle.deleteMany({} , (err) => {
                                    if (err) {
                                        console.error(err);
                                        process.exit(1);
                                    }
                                
                                    console.log('old PreparedTitle dropped ', new Date());
                                });
                                // save new PreparedTitle
                                let newPreparedTitle = new PreparedTitle ({
                                    gogoanime: result_gogoanime,
                                    crunchyroll: CR_prepared_titles
                                });

                                newPreparedTitle.save();
                                console.log('new PreparedTitle saved ', new Date());

                            }).catch (err => {
                                console.log(err);
                            })
                    }
                });
 
                
            } catch (error) {
                console.log(error);
            }
        }

        init();
    } catch (error) {
        console.log(error);
    }
}

const populateMovies = async () => {
    try {
         // fetch all the movie data exists in animixplay list
         let fetchAnimixplay_movie = async (last) => {
            try {
                var data = new FormData();
                data.append('movie', last);

                var config = {
                    method: 'post',
                    url: animixplay_movie_URL,
                    headers: { 
                        ...data.getHeaders()
                    },
                    data : data
                };
                return new Promise ((resolve, reject) => {
                    axios(config)
                    .then(function (response) {
                        let data = response.data;
                        resolve(data);
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
                    
                })
                
            } catch (error) {
                console(error);
                callback(null, false);
            }
         };

        const init = async () => {
            try {
                let _MOVIES = [];
                var data = await fetchAnimixplay_movie('99999');   

                if (data) {
                    while(data.more) {
                        let last = data.last;
                        
                        let list_movies = data.result;
                        // parse each item
                        for (let i = 0; i < list_movies.length; i++) {
                            if (!list_movies[i].title.includes('(Dub)')) {
                                let movie = ({
                                    title: list_movies[i].title,
                                    img_url: list_movies[i].picture,
                                    score: list_movies[i].score,
                                });
                                _MOVIES.push(movie);
                            }
                        }

                        // fetch next set of data
                        await delay(getRandomInt(450, 850));
                        data = await fetchAnimixplay_movie(last);
                        console.log(`last done: ${last}`);
                    }

                    // drop old Movies
                    Movie.deleteMany({} , (err) => {
                        if (err) {
                            console.error(err);
                            process.exit(1);
                        }
                    });

                    // save new Movies 
                    let newMovies = new Movie({
                        Movies: _MOVIES
                    });

                    newMovies.save()
                    console.log('new Movies saved ', new Date());

                } else {
                    // initial empty
                }
                
            } catch (error) {
                console.log(error);
            }
        }

        init();

    } catch (error) {
        console.log(error);
    }
}


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

module.exports = {
    populatePreparedTitle,
    populateMovies
}