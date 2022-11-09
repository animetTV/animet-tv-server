const request = require("request");
const MetricaStats = require("../../models/metrica-stats.model")
/* 
  Yandex Metrica Bot for AnimetTV
  Fetch Total users from as of now
*/
let fetchTotalUserSession = async () => {
  try {
    var today = new Date();
    var currentDateString = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];

    var nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);
    var nextDateString = new Date(
      nextDay.getTime() - nextDay.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];

    const options = {
      url: ` https://api-metrika.yandex.net/stat/v1/data?dimensions=ga:userType&metrics=ga:users&id=44147844&date1=${currentDateString}&date2=${nextDateString}`,
      headers: {
        Authorization: "client_id:5b0f7f250c4c41688ff25f88a13d8ea3"
      }
    };

    function callback(error, response, body) {
      if (!error && response.statusCode === 200) {
        const info = JSON.parse(body);
        MetricaStats.deleteMany({} , (err) => {
            if (err) {
              console.error(err);
              process.exit(1);
            }
            console.log('Metrica Stats cleared');
            
            let newMetricaStats = new MetricaStats({
                totalSessionToday: info.totals[0]
            });

            newMetricaStats.save();
            console.log('Metrica Stats updated');
          });

      } else {
        console.log(error);
      }
    }

    request(options, callback);
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
    fetchTotalUserSession
}