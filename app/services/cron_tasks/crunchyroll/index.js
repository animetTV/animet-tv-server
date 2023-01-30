require('dotenv').config();
const cheerio = require("whacko")
const rs = require("request");
const axios = require("axios");
const base = "https://api.kamyroll.tech";

const getAccessToken = async (token = '') => {
    try {
        const accessToken = await (await axios.get("https://raw.githubusercontent.com/MicGlitch/token/main/welp.json"))
        .data
        .access_token;
        return accessToken;
    } catch (error) {
        
    }
}

const getIDs = async ({ list = []}) => {
    try {
        const accessToken = await getAccessToken();
        const { data } = await axios.get(`${base}/anime/search?query=${item}`, {
            headers: {
              "Authorization": `Bearer ${accessToken}`
          }
        });
        return data;
    } catch (error) {
        console.log(error)
    }

}
module.exports = {
  getIDs
}