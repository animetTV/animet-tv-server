const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');
const bcrypt = require('bcrypt');
const saltRounds = Number(process.env.SALT_ROUNDS);
const { nanoid } = require('nanoid');

const AdminUserSchema = mongoose.Schema({
    accountID: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true},
    avatarFileName: { type: String, default: '1.jpg'},
    avatarFileID: { type: String, default: '0000'},
    accessLevel: { tpye: Number },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

AdminUserSchema.plugin(beautifyUnique);

const AdminUser = module.exports = mongoose.model('AdminUser', AdminUserSchema);

module.exports.registerAdminUser = (newAdminUser) => {
    /* encrypte password, create new user & save */
    bcrypt.genSalt(saltRounds, (err, salt) => {
        if (err) {
            throw err;
        }

        bcrypt.hash(newAdminUser.password, salt, (err, hash) => {
            if (err) {
                throw err;
            }
            
            const adminUser = new AdminUser({
                accountID: newAdminUser.accountID,
                email: newAdminUser.email,
                password: hash,
                accessLevel: 1
            });

            adminUser.save( function (err) {
                if (err) {
                    console.log(err);
                }
            });
            
        });

    });

};

module.exports.hashPassword = async (password, callback) => {
    try {
        bcrypt.genSalt(saltRounds, (err, salt) => {
            if (err) {
                throw err;
            }

            bcrypt.hash(password, salt, (err, hash) => {
                if (err) {
                    throw err;
                }

                callback(null ,hash);
            })
        })
    } catch (error) {
        console.log(error);
        callback(null, false);
    }
}

module.exports.comparePassword = function (candidatePassword, hash, callback) {
    bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
        if (err) throw err;
        callback(null, isMatch);
    });
}

module.exports.getAdminUserById = function (id, callback) {
    AdminUser.findById(id, callback);
}

module.exports.getAdminUserByEmail = function (email, callback) {
    const query = { email: email };
    AdminUser.findOne(query, callback);
}

module.exports.getAdminUserByAccountID = async (id, callback) => {
    try {
        AdminUser.findOne({ 'accountID': id }, { 'password': 0 ,'_id': 0,  '__v': 0 }, callback)
    } catch (error) {
        console.log(error);
    }
}

/* Social Sign Register */
/* module.exports.findOrCreate = (googleId, callback) => {
   // return user if user already registerd  
    User.countDocuments({ googleId: googleId }, (err, count) => {
        if (err) throw err;

        if (count > 0) {
            const query = { googleId: googleId }; 
            User.findOne(query, callback);
        } else {
            // User does not exist so register it as new user 
            const accountID = nanoid();

            const user = new User({
                accountID: accountID,
                email: newUser.email,
            });
         
            user.save( function (err) {
                if (err) {
                    console.log(err);
                }
            });
         
            // create UserList since current user sign in with google 
            // create empty userlist for new user 
              UserList.createUserList(accountID, (err) => {
                if (err) throw err;
            });
        }

   });

} */

/* update access level */
module.exports.setAccessLevel = async(request, callback) => {
    try {
        AdminUser.findOneAndUpdate(
            { 'accountID': request.accountID },
            { 'accessLevel': request.newAccessLevel }, 
            callback
        );
    } catch (error) {
        console.log(error);
    }
}


module.exports.setAvatarFileID = async(request) => {
    try {
        const accountID = request.accountID;
        const fileID = request.fileID;
        const fileName = request.fileName;

        return await User.findOneAndUpdate({ 'accountID': accountID }, {
            $set : { 'avatarFileID': fileID, 'avatarFileName': fileName }
        })
    } catch (error) {
        console.log(`Could not set new avatarFileID`, error);
    }
} 

