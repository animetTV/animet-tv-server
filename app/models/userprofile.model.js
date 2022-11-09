require('dotenv').config();
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');


const AnimetListItemSchema = mongoose.Schema({
        item_id: { type: String },
        postID: { type: Number },
        img_url: { type: String },
        title: { type: String },
        nsfw: { type: Boolean },
        dateCreated: { type: Number, default: Date.now() },
}, { _id : false }, { timestamps: true });

const TrackedListItemSchema = mongoose.Schema({
    title: { type: String },
}, { _id : false });



const ContinueWatching = mongoose.Schema({
    animeTitle: { type: String },
    episodeNumber: { type: Number },
    totalEpisode: { type: Number },
    img_url: { type: String },
    type: { type: Boolean },
    dateCreated: { type: Number, default: Date.now() }
}, { _id: false});

const RatingHistory = mongoose.Schema({
    postID: { type: String  },
    givenRating: { type: Number  },
    nsfw: { type: Boolean, default: false },
    dateCreated: { type: Number, default: Date.now() },
})
const UserProfileSchema = mongoose.Schema({
    accountID: { type: String, required: true },
    ratingHistory: [RatingHistory],
    tracked_anime: [TrackedListItemSchema],
    plan_to_watch: [AnimetListItemSchema],
    completed: [AnimetListItemSchema],
    tracked_anime_continue_watching: [TrackedListItemSchema],
    continue_watching: [ ContinueWatching ]
});


const UserProfile = module.exports = mongoose.model('UserProfile', UserProfileSchema);

module.exports.createUserProfile =  async (newUserID) => {
    try {
        /* default lists for every new user */
        const newUserProfile = new UserProfile({
            accountID: newUserID,
        });

        newUserProfile.save( function (err) {
            if (err) {
                console.log(err);
            }
            console.log('new UserProfile created');
        });
        
    } catch (error) {
        console.log(error);
    }
};


module.exports.getUserProfileById = function (id, callback) {
    const query = { 'accountID': id };
    UserProfile.findOne(query, callback);
}

module.exports.getMyProfile = async (id, callback) => {
    try { 
        await UserProfile.findOne({ 'accountID': id }, {'accountID': 0, 'ratingHistory': 0, 'tracked_anime': 0,  '_id': 0, '__v': 0 },callback)
    } catch (error) {
        console.log(err);
    }
}

module.exports.appendRating = async (ratingRequest) => {
    try {
        
            const accountID = ratingRequest.accountID;
            const postID = ratingRequest.postID;
            const rating = ratingRequest.rating;
            const nsfw = ratingRequest.nsfw;

            UserProfile.updateOne({ 'accountID': accountID },
            {
                $addToSet: {
                    'ratingHistory': {
                        'postID': postID,
                        'givenRating': rating,
                        'nsfw': nsfw,
                }},
            });

    } catch (error) {
        console.log(error);
    }
}


module.exports.appendItemToList= async (addItemRequest, callback) => {
    try {
        const _accountID = addItemRequest.accountID;
        const _img_url = addItemRequest.img_url;
        const _title = addItemRequest.title;
        const _nsfw = addItemRequest.nsfw;
        const _LIST = addItemRequest.LIST;

        /* add to tracked anime */
        const trackedItemReq = {
            accountID: _accountID,
            title: _title
        }
        
                UserProfile.appendTrackedItem(trackedItemReq, (err, doc) => {
                    if (err) {
                        throw err;
                    } 
                });

                if (_LIST == 'plan_to_watch') {
                    UserProfile.updateOne({ 'accountID': _accountID, },
                    {
                        $addToSet: {
                            'plan_to_watch':
                                {   
                                    'item_id': nanoid(),
                                    'img_url': _img_url,
                                    'title': _title,
                                    'nsfw': _nsfw,
                                }
                        }
                    }, callback);
                    
                } else if (_LIST == 'completed') {
                    UserProfile.updateOne({ 'accountID': _accountID, },
                    {
                        $addToSet: {
                            'completed':
                                {   
                                    'item_id': nanoid(),
                                    'img_url': _img_url,
                                    'title': _title,
                                    'nsfw': _nsfw,
                                }
                        }
                    }, callback);
                }        

    } catch (error) {
        console.log(error);
    }
}


module.exports.removeItemFromList = async (removeItemRequest, callback) => {
    try {
        const _accountID = removeItemRequest.accountID;
        const _item_id = removeItemRequest.item_id;
        const _LIST = removeItemRequest.LIST;
        
        if (_LIST == 'plan_to_watch') { 
            UserProfile.updateOne({ 'accountID': _accountID }, { $pull: { 'plan_to_watch': { 'item_id': _item_id } } },callback)

        } else if (_LIST == 'completed') { 
            UserProfile.updateOne({ 'accountID': _accountID }, { $pull: { 'completed': { 'item_id': _item_id } } },callback)

        }

    } catch (error) {
        console.log(error);
    }
}

module.exports.appendTrackedItem= async (addItemRequest, callback) => {
    try {
        
        const _accountID = addItemRequest.accountID;
        const _title = addItemRequest.title;

        UserProfile.updateOne({ 'accountID': _accountID }, {
            $addToSet: {
                'tracked_anime': { 'title': _title}
            }
        }, callback);

    } catch (error) {
        console.log(error);
    }
}

module.exports.removeTrackedItem = async (removeItemRequest, callback) => {
    try {
        const _accountID = removeItemRequest.accountID;
        const _title = removeItemRequest.title;

        UserProfile.updateOne({ 'accountID': _accountID }, {
            $pull: {
                'tracked_anime': { 'title': _title}
            }
        }, callback);


    } catch (error) {
        console.log(error);
    }
}

module.exports.appendTracked_anime_continue_watching= async (addItemRequest, callback) => {
    try {
        
        const _accountID = addItemRequest.accountID;
        const _title = addItemRequest.title;

        UserProfile.updateOne({ 'accountID': _accountID }, {
            $addToSet: {
                'tracked_anime_continue_watching': { 'title': _title}
            }
        }, callback);

    } catch (error) {
        console.log(error);
    }
}

module.exports.removeTracked_anime_continue_watching = async (removeItemRequest, callback) => {
    try {
        const _accountID = removeItemRequest.accountID;
        const _title = removeItemRequest.title;

        UserProfile.updateOne({ 'accountID': _accountID }, {
            $pull: {
                'tracked_anime_continue_watching': { 'title': _title}
            }
        }, callback);


    } catch (error) {
        console.log(error);
    }
}

module.exports.addItemToContinueWatching = async (addItemRequest, callback) => {
    try {
        const _accountID = addItemRequest.accountID;
        const _img_url = addItemRequest.img_url;
        const _title = addItemRequest.title;
        var _type;
        
        if (addItemRequest.type) {
            _type = true;
        } else if (!addItemRequest.type) {
            _type = false;
        } else {
            _type = false;
        }

        const _currentEpisode = addItemRequest.currentEpisode;
        const _totalEpisode = addItemRequest.totalEpisode;

        const trackedItemReq = {
            accountID: _accountID,
            title: _title
        }
        
        UserProfile.appendTracked_anime_continue_watching(trackedItemReq, (err, doc) => {
            if (err) {
                throw err;
            } 
        });


        UserProfile.updateOne({ 'accountID': _accountID }, 
                    {
                        $addToSet: {
                            'continue_watching': {
                                'animeTitle' : _title,
                                'episodeNumber' : _currentEpisode,
                                'totalEpisode' : _totalEpisode,
                                'img_url': _img_url,
                                'type' : _type,
                            }
                        }
                    }, callback);            
        
    } catch (error) {
        console.log(error);
    }
}


module.exports.removeItemFromContinueWatching = async (removeItemRequest, callback) => {
    try {
        const _accountID = removeItemRequest.accountID;
        const _title = removeItemRequest.title;
        
        UserProfile.updateOne({ 'accountID': _accountID}, { 
            $pull: { 'continue_watching': { 'animeTitle': _title } }
        }, callback)

    } catch (error) {
        console.log(error);
    }
}

module.exports.getContinueWatching = async (accoundID, callback) => {
    try {
        UserProfile.findOne({ 'accountID': accoundID},{'continue_watching': 1, '_id': 0}, callback);
    } catch (error) {
        console.log(error);
    }
}
