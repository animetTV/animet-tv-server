const express = require('express');
const router = express.Router();
const os = require('os');
const sources = require('../../public/external_sources.json');
const MetricaStats = require('../models/metrica-stats.model');
const CorsAnyWhere = require('../services/cors-anywhere');

if (process.env.REDISCLOUD_URL) {
    // rediscloud connection
    var redis = require('redis');
    var client = redis.createClient(process.env.REDISCLOUD_URL, {no_ready_check: true});
  
  } else {
    var client = require("redis").createClient();
}

router.get('/', async(req,res) => {
    try {
        String.prototype.toHHMMSS = function () {
            var sec_num = parseInt(this, 10); // don't forget the second param
            var hours   = Math.floor(sec_num / 3600);
            var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
            var seconds = sec_num - (hours * 3600) - (minutes * 60);
        
            if (hours   < 10) {hours   = "0"+hours;}
            if (minutes < 10) {minutes = "0"+minutes;}
            if (seconds < 10) {seconds = "0"+seconds;}
            var time    = hours+':'+minutes+':'+seconds;
            return time;
        }

        var time = process.uptime();
        var uptime = (time + "").toHHMMSS();
        let cpu = os.cpus();

        let result = {
            os : os.type(),
            cpu_model: cpu[0].model,
            ram: {
                free: numberWithCommas((os.freemem() / 1024 / 1024 ).toFixed(2)) + ' MB',
                used: numberWithCommas(((os.totalmem() / 1024 / 1024) - (os.freemem() / 1024 / 1024 )).toFixed(2)) + ' MB',
                total: numberWithCommas((os.totalmem() / 1024 / 1024).toFixed(2)) + ' MB',
            },
            uptime: uptime,
            
        }

        function numberWithCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        
        res.json(result);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

router.get('/working-sources', async(req ,res) => {
    try {
        res.json(sources);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

router.get('/cors-anywhere-list', async(req,res) => {
    try {
        client.get('CorsAnyWhereList', (err, result) => {
            if (result !== null && result.length > 2) {
                const resultJSON = JSON.parse(result);
                res.json(resultJSON);
            } else {
                CorsAnyWhere.checkCorsAnyWhereNodes((err, result) => {
                    if (err) {
                        console.log(err);
                    }
                    client.set('CorsAnyWhereList',JSON.stringify(result));
                    res.json(result);
                });
            }
        })
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

router.get('/cors-anywhere-random', async(req, res) => {
    try {
        client.get('CorsAnyWhereList', (err, result) => {
            if (result !== null && result.length > 2) {
                const resultJSON = JSON.parse(result);
                let selected = resultJSON[Math.floor(Math.random() * resultJSON.length)];

                res.json(selected);
            } else {
                CorsAnyWhere.checkCorsAnyWhereNodes((err, result) => {
                    if (err) {
                        console.log(err);
                    }
                    client.set('CorsAnyWhereList',JSON.stringify(result));
                    let selected = result[Math.floor(Math.random() * result.length)];

                    res.json(selected);
                });
            }
        })
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

router.get('/total-sessions-today', async(req,res) => {
    try {
         MetricaStats.getTotalSessionToday((err, result) => {
            if (err) {
                console.log(err);
                res.sendStatus(404);
            } 
            if (result) {
                res.json(result);
             }
         })
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

module.exports = router