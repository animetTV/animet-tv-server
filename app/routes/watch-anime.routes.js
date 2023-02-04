require('dotenv').config()
const express = require('express');
const router = express.Router();
const Gapi = require('animet-gogoanime');
const rateLimit = require("express-rate-limit");
var rp = require('request-promise');
const { nanoid } = require('nanoid');

const demon_slayer = require('../../anime60/demon_slayer.json');
const shingeki_no_kyojin_the_final_season = require('../../anime60/shingeki_no_kyojin_the_final_season_60fps.json');
const violet_evergarden_60fps_dub = require('../../anime60/violet_evergarden_60fps_dub.json');
const available_titles_60fps = require('../../anime60/available-titles.json');
const weathering_with_you = require('../../anime60/weathering_with_you.json');
const one_punch_man = require('../../anime60/one_punch_man.json');
const jujutsu_kaisen = require('../../anime60/jujutsu_kaisen.json');
const shingeki_no_kyojin = require('../../anime60/shingeki_no_kyojin_season_one.json');
const your_name = require('../../anime60/your_name.json');
const shingeki_no_kyojin_season_two = require('../../anime60/shingeki_no_kyojin_season_2.json');
const demon_slayer_mugen_train = require('../../anime60/demon_slayer_mugen.json');
const josee_to_tora_to_sakanatachi =require('../../anime60/josee_to_tora_to_sakanatachi.json');
const cowboy_bepop_remastered = require('../../anime60/cowboy_bebop_remastered.json');
const you_are_not_alone = require('../../anime60/evangelion_1.0_you_are_not_alone.json');
const you_can_not_advance = require('../../anime60/evangelion_2.0_you_can_not_advance.json');
const you_can_not_redo = require('../../anime60/evangelion_3.0_you_can_not_redo.json');
const akira_remastered = require('../../anime60/akira_remastered.json');
const death_note = require('../../anime60/death_note_remastered.json');
const ghost_in_the_shell_4k_digital = require('../../anime60/ghost_in_the_shell_4k_digital.json');
const high_school_of_the_dead_complete_collection = require('../../anime60/high_school_of_the_dead_complete_collection.json');
const tengen_toppa_gurren_lagann_parallel_works_1 = require('../../anime60/parallel_works_1.json');
const tengen_toppa_gurren_lagann_parallel_works_2 = require('../../anime60/parallel_works_2.json');
const solo_levante = require('../../anime60/solo_levante.json');
const her_blue_sky = require("../../anime60/her_blue_sky.json");
const nausicaa_of_the_valley_of_the_wind = require("../../anime60/nausicaa_of_the_valley_of_the_wind.json");
const vinland_saga = require("../../anime60/vinland_saga.json");
const v86 = require("../../anime60/86.json");
const violet_evergarden_movie = require("../../anime60/violet_evergarden_movie.json");
const mobile_suit_gundam_hathaways_flash = require("../../anime60/mobile_suit_gundam_hathaways_flash.json");
const sao = require("../../anime60/sao.json");
const bns5 = require("../../anime60/bns5.json");
const mushoku_tensei_jobless_reincarnation = require("../../anime60/mushoku-tensei-jobless-reincarnation.json");
const yasuke = require("../../anime60/yasuke.json");
const fate_zero = require("../../anime60/fate-zero.json");
const fate_stay_night_movie_2 = require('../../anime60/fate-stay-night-movie-2.json');
const overflow = require('../../anime60/overflow.json');
const rezeros2 = require(`../../anime60/rezero-s2.json`);
const tamako_love_story = require(`../../anime60/tamako_love_story.json`);
const fate_stay_night_movie_1 = require(`../../anime60/fate-stay-night-movie-1.json`);
const torokase_orgasm = require(`../../anime60/torokase_orgasm.json`);
const kimi_ga_suki_1 = require(`../../anime60/kimi_ga_suki_1.json`);
const musaigen_no_phantom = require(`../../anime60/musaigen-no-phantom-world.json`);
const love_is_war_ultra_romatic = require(`../../anime60/love_is_war_ultra_romatic.json`);
const hajimete_no_hitozuma = require(`../../anime60/hajimete_no_hitozuma.json`);
const spyxfamily = require(`../../anime60/spyxfamily.json`);
const fate_movie_3 = require(`../../anime60/fate_stay_night_movie_3.json`);
const a_silent_voice = require(`../../anime60/silent_voice_4k.json`)
const animeLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 60
});

const anime60fps = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 25
});


const streamApiURL = process.env.LOCAL_ANIMET_STREAM_API_URL;

router.get(
    '/get-anime-available', 
    animeLimiter,
    async(req, res) => {
    try {
        var result = [];
        var animeTitle = String(req.query.animeTitle);
        var dubTitle = animeTitle + ' ' + '(Dub)';
        
        
        var options = {
            'method': 'GET',
            'url': `${streamApiURL}api/search/?word=${animeTitle}&page=1`,
            'headers': {
            }
        };
        rp(options, function (error, response) {
            if (error) throw new Error(error);
            
            var apiResult = JSON.parse(response.body).results;

            for (let el = 0; el < apiResult.length; el++) {
                if(result.length > 2) {
                    break;
                }
               const title = apiResult[el].title;
               title = title.trim();
               if (title && result.length < 2) {
                   // find SUB 
                   if (title === animeTitle) {
                       result.unshift(apiResult[el]);
                    }
                    
                    // find DUB
                    if (title === dubTitle) {
                        result.push(apiResult[el]);
                    }   
                }   
            }
            
            console.log(result);
            res.json(result);

        });



    } catch (error) {
        console.log(error);
    }
});

/* BACKUP: iframe player links */
router.get('/gapi/get-episode-stream', async(req, res) => {
    try {
        let links = [];
        let streamEpisode = req.query.episodeID;
        let apiResult = await Gapi.animeEpisodeHandler(streamEpisode);
        let link = {
            size: 'High Speed',
            src: `https://${apiResult[0].servers[0].iframe}`
        }
        links.push(link);

        res.json({links: links});
    } catch (error) {
        console.log(error);
    }
});

router.get(
    '/anime60fps-available-titles',
    anime60fps,
    async(req, res) => {
        try {
            res.json(available_titles_60fps);
        } catch (error) {
            console.log(error);
            res.sendStatus(404);
        }
    }
);
router.get(
    '/anime60fps-available-titles-count',
    anime60fps,
    async(req, res) => {
        try {
            res.json(Number(available_titles_60fps.length));
        } catch (error) {
            console.log(error);
            res.sendStatus(404);
        }
    }
);

router.get(
    `/server-fetch-m3u8`,
    anime60fps,
    async(req, res) => {
        try {
            let url = req.query.downloadLink;
            console.log(url);
            var options = {
                'method': 'GET',
                'url': `${url}`,
                'headers': { 'Origin':  `*`, 'X-Requested-With': 'null'}
            };
            rp(options, function (error, response) {
                if (error) throw new Error(error);
                
                var Result = response.body; 
                console.log(Result);
                res.setHeader('Content-disposition', `attachment; filename=${nanoid(10)}.m3u8`)
                res.setHeader('Content-type', 'text/plain');
                res.charset ='UTF-8';
                res.write(Result);
                res.end();
            });
            
        } catch (error) {
            console.log(error);
            res.sendStatus(400);
        }
    }
);

// fetch comment count from disqus
router.get(
    `/comment-count`,
    animeLimiter,
    async(req, res) => {
        try {
            res.json({ "comment": "0"})
           /*  let url = `https://prodanimettv.disqus.com/count-data.js?1=${req.query.slug}`;
            console.log(url);
            var options = {
                'method': 'GET',
                'url': `${url}`,
                'headers': { 'Origin':  `*`, 'X-Requested-With': 'null'}
            };
            rp(options, function (error, response) {
                if (error){ 
                    res.statusCode(400);
                }
                
                var Result = response.body; 
                if (Result.length > 211) {
                    let tmp = Result.split(`,"comments":`)[2];
                    tmp = tmp.split("}")[0];
                    res.json({ "comment": tmp});
                } else {
                    res.json({ "comment": "0"});
                }
            }); */
            
        } catch (error) {
            console.log(error);
            res.sendStatus(400);
        }
    }
)

router.get(
    '/anime60fps',
     anime60fps,
     async(req, res) => {
         try {
             res.header("Content-Type", "application/json");
             
             let title = req.query.title;

             if (title === 'Demon Slayer Season 1') {
                 res.json(demon_slayer);
             }
             else if(title === `Fate/stay night [Heaven's Feel] III. spring song`) {
                res.json(fate_movie_3);
             }
            else if (title === 'Attack on Titan: The Final Season Part 1') {
                 res.json(shingeki_no_kyojin_the_final_season);
            } else if (title === 'One Punch Man') {
                res.json(one_punch_man);
            } else if (title === 'Attack on Titan') { 
                res.json(shingeki_no_kyojin);
            } else if (title === 'Demon Slayer Mugen Train') {
                /* https://bacchus.fra1.digitaloceanspaces.com/demon_slayer_mugen_train/playlist.m3u8 */
                 res.json(demon_slayer_mugen_train);
             } else if (title === 'Violet Evergarden') {
                 res.json(violet_evergarden_60fps_dub);
             } else if (title === 'Jujutsu Kaisen Season 1') {
                 res.json(jujutsu_kaisen);
             } else if (title === 'Weathering with You') {
                /* https://bacchus.fra1.digitaloceanspaces.com/wwy/playlist.m3u8 */ 
                 res.json(weathering_with_you);
             } else if (title === 'Your Name') {
                 res.json(your_name);
             } else if (title === 'Attack on Titan Season 2') {
                 res.json(shingeki_no_kyojin_season_two);
             } else if (title === 'Josee to Tora to Sakanatachi') {
                 res.json(josee_to_tora_to_sakanatachi);
             } else if (title === 'Cowboy Bebop Remastered') {
                res.json(cowboy_bepop_remastered);
             } else if (title === 'Evangelion: 1.0 You Are (Not) Alone') {
                 res.json(you_are_not_alone);
             } else if (title === 'Evangelion: 2.0 You Can (Not) Advance') {
                 res.json(you_can_not_advance);
             } else if (title === 'Evangelion: 3.0 You Can (Not) Redo') {
                res.json(you_can_not_redo);
             } else if (title === 'Akira Remastered') {
                 res.json(akira_remastered);
             } else if (title === 'Death Note') {
                 res.json(death_note);
             } else if (title === 'Ghost in the Shell 4K Digital') {
                 res.json(ghost_in_the_shell_4k_digital);
             } else if (title === 'High School of the Dead: Complete Collection') {
                 res.json(high_school_of_the_dead_complete_collection);
             } else if (title === 'Tengen Toppa Gurren Lagann: Parallel Works 1') {
                 res.json(tengen_toppa_gurren_lagann_parallel_works_1);
             } else if (title === 'Tengen Toppa Gurren Lagann: Parallel Works 2') {
                res.json(tengen_toppa_gurren_lagann_parallel_works_2);
            } else if (title === 'Nausicaa of the Valley of the Wind') {
                res.json(nausicaa_of_the_valley_of_the_wind);
            } else if (title === 'Sol Levante') {
                res.json(solo_levante);
            } else if (title === 'Her Blue Sky') {
                res.json(her_blue_sky);
            } else if (title === 'Vinland Saga') {
                res.json(vinland_saga);
            } else if (title === "86") {
                res.json(v86);
            } else if (title === 'Violet Evergarden Movie') {
                res.json(violet_evergarden_movie);
            } else if (title === `Mobile Suit Gundam: Hathaway's Flash`) {
                res.json(mobile_suit_gundam_hathaways_flash);
            } else if (title === 'Sword Art Online') {
                res.json(sao);
            } else if (title === `Boku no Hero Academia 5`) {
                res.json(bns5);
            } else if (title === `Mushoku Tensei: Jobless Reincarnation`) {
                res.json(mushoku_tensei_jobless_reincarnation);
            } else if (title === `Yasuke`) {
                res.json(yasuke);
            } else if (title === `Fate/Zero`) {
                res.json(fate_zero);
            } else if (title === `Fate/stay night: Heaven's Feel II`) {
                res.json(fate_stay_night_movie_2);
            } else if (title === `Overflow`) {
                res.json(overflow);
            } else if (title === `Re:ZERO - Starting Life in Another World S2`) {
                res.json(rezeros2);
            } else if (title === `Tamako Love Story`) {
                res.json(tamako_love_story);
            } else if (title === `Fate/stay night: Heaven's Feel I` ) {
                res.json(fate_stay_night_movie_1);
            } else if (title === `Torokase Orgasm`) {
                res.json(torokase_orgasm);
            } else if (title === `Kimi ga Suki 1`) {
                res.json(kimi_ga_suki_1);
            } else if (title === `Musaigen no Phantom World: Mizutama no Kiseki`) {
                res.json(musaigen_no_phantom);
            } else if (title === `Love is War Ultra Romantic`) {
                res.json(love_is_war_ultra_romatic);
            } else if (title === `Hajimete no Hitozuma`) {
                res.json(hajimete_no_hitozuma);
            } else if (title === `Spy x Family`) {
                res.json(spyxfamily);
            } else if (title === `A Silent Voice`) {
                res.json(a_silent_voice);
            }
         } catch (error) {
             console.log(error);
         }
     });

module.exports = router;
