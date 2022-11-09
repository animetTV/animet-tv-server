const axios = require('axios');
const allTitleUS = `https://search.prd.funimationsvc.com/v1/search?index=catalog-shows&region=US&limit=1000`;
const funimationDump = require('../../../funimation_dump.json');

/* NOT IMPLEMENTED FAILD ATTEMP */
let fetchAllTitles = async (callback) => {
    try {
        let url =  allTitleUS;
        axios
            .get(url)
            .then(res => {
                callback(null, res.data);
            })
            .catch(error => {
                if (error.response.status === 403) {
                    console.log('failed at reading fetching all titles response');
                }
                callback(null, false);
            })

    } catch (error) {
        console.log(error, `\n Faild while fetching all titles from Funimation \n ${allTitleUS}`);
    }
}

const buildFunimationIndex = async (callback) => {
    try {
        console.log(funimationDump);
        callback(null, true);
    } catch (error) {
        callback(null, false);
        console.log(error + `\n Faild while buildg funimation Index`);
    }
}
module.exports = {
    buildFunimationIndex,
    fetchAllTitles
}