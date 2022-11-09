const { MongoClient } = require("mongodb");
const dbConfig = require('../../config/mongodb.config');


/* ! Not Implemeted Yet */
exports.sortEachAnimeSeason = () => {
    
    const uri = dbConfig.local_url;
    const client = new MongoClient(uri, {useUnifiedTopology: true});
    
    async function run() {
        try {
          await client.connect();
          const db = client.db("animet-db");
          const collection = db.collection("seasonanimes");

          var i = 1;
          const result = await collection.aggregate(
     
          );

          console.log(result);
        } finally {
          await client.close();
        }
      }
      run().catch(console.dir);


}