require('dotenv').config();
const cheerio = require("whacko");
const rp = require("request-promise");
const path = require('path');
const fs = require('fs');
const stringSimilarity = require("string-similarity");
const proxiedRequest = rp.defaults({proxy: `http://gsbhrfmf-rotate:oq7kg50qojuu@p.webshare.io:80`})
const randomUseragent = require('random-useragent');
const { delay } = require('bluebird');
const request = require('request');
const base_url = `https://zeroscans.com/`;
const client = require('https');

// fetch all the titles avaialbe on /comics?pages=# & save to json
// from json fetch each individual title detail, ex name total ep... & save to json
// from json 2 fetch each episode images and download to storage
// self host ... 


const fetchAvailableTitles = async(pageStart, pageEnd) => {
    try {
        let data = [];
        for (let i = pageStart; i < pageEnd; i++) {
            let url = `${base_url}?page=${i}`;
            let options = {
                uri: url,
                transform: function(body) {
                    return cheerio.load(body);
                },
                headers: {
                    'User-Agent': randomUseragent.getRandom()
                }
            };

            proxiedRequest(options)
                .then(function($) {
                    $('.list-item').each(function(index, element) {
                        let itemURL = $(this).children('.media').children('a').attr().href;
                        let coverURL = $(this).children('.media').children('a').css('background-image');
                        coverURL = coverURL.replace('url(/', '');
                        coverURL = coverURL.replace(')','');
                        coverURL = `${base_url}${coverURL.trim()}`
                        let title = $(this).children('.list-content').children('.list-body').children('a').text();
                        data.push({
                            itemURL: itemURL,
                            coverURL: coverURL,
                            title: title.trim(),
                        });
                    });
                    
                });
                await delay(2000);
                //save as json
                const filePath = path.join(process.cwd()+ `/comic-covers/comicPageData${pageEnd}.json`);
    
                fs.writeFileSync(filePath, JSON.stringify(data),function(err) {
                    if (err) {
                        console.log(err);
                    }
                });
            }
            return;
    } catch (error) {
        console.log(error);
    }
} 

var download = function(uri, filename, callback){
    proxiedRequest.head(uri, function(err, res, body){
      console.log('content-type:', res.headers['content-type']);
      console.log('content-length:', res.headers['content-length']);
      
      let type = 'jpeg';
      if (res.headers['content-type'].includes('png')) {
        type = 'png'
      }
      proxiedRequest(uri).pipe(fs.createWriteStream(`${filename}.${type}`).end()).on('close', callback);
    });
};

const downloadAllCovers = (pageNumer) => {
    const filePath = path.join(process.cwd()+ `/comic-covers/comicPageData${pageNumer}.json`);
    fs.readFile(filePath, 'utf8', (err, jsonString) => {
        if (err) {
            console.log(`file read failed: ${err}`);
            return;
        }
        let data = JSON.parse(jsonString);
        data.forEach((el, index) => {
            setTimeout(() => {
                task(el.coverURL, el.title);
            },index * 4000);
        });

    })
    async function task(url, filename) {
       download(url, `${process.cwd()}/comic-covers/${filename}_cover`, function() {
                console.log(`Image downloaded: ${filename}`);
       });
    }
}

module.exports = {
    fetchAvailableTitles,
    downloadAllCovers
}