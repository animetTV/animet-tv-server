const express = require('express');
const router = express.Router();
const Post = require('../models/post.model');
const UserProfile = require('../models/userprofile.model');
const User = require('../models/user.model');

router.get('/get-feed', async (req, res) => {
  try {
   
    const request = {
      limit: Number(req.query.limit),
      nsfw: req.query.nsfw
    }
    const result = await Post.getFeed(request);
    res.json(result);

  } catch (error) {
    console.error(error);
    res.sendStatus(404);
  }

})

router.get('/get-random-feed', async(req, res) => {
  try {
    const request = {
      nsfw: req.query.nsfw
    }

    let feed = [];  

    // if feed empty keep query until feed is not full 
    while(feed === undefined || feed.length == 0)  {
      feed = await Post.getRandomFeed(request);
    }

    res.json(feed);
  } catch (error) {
    console.error(error);
    res.sendStatus(404);
  }
})

router.post('/rate-post', async (req, res) => {
  try {
      const request = {
        postID: req.body.postID,
        rating: Number(req.body.rating)
      };

      if (req.body.isUser) {
        console.log('is user');
        const userListRequest = {
          accountID: req.body.accountID,
          postID: req.body.postID,
          rating: Number(req.body.rating),
          nsfw: req.body.nsfw,
        }

        /* append rating then add to user list */        
        await Post.appendRating(request)
        .then(
          await UserList.appendRating(userListRequest)
          .then(
            res.json({ success: true })
          )
        );
            
      } else { 
        await Post.appendRating(request)
          .then(
            res.json({ success: true })
          )
      }
      

  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }

})

router.get(
  '/get-public-user-list',
  async (req, res) => { 
      try {
        const accountID = req.query.accountID;
        if (accountID) {
          /* check if user list public if it is return user list */
          User.findOne({ 'accountID': accountID },{}, (err, doc) => {
              if (err) {
                  res.json({success: false, message: 'error while getting user list'});
                  throw err;
              }
              if (doc && doc.isProfilePublic ) {
                  UserProfile.getMyProfile(accountID, (err, list) => {
                      if (err) {
                          res.json({success: false, message: 'error while getting user list'});
                          throw err;
                      }
                      
                      User.getUserByAccountID(accountID, (err, profile) => {
                        if (err) {
                          res.json({success: false, message: 'error while getting user list'});
                          throw err;
                        }

                        res.status(200).send({
                          list: list,
                          profile: profile
                        });

                      })
                  })
              }
            
            });
          }
      } catch (error) {
          console.log(error);
          res.sendStatus(500);
      }
  }
);

module.exports = router;
