require("dotenv").config();
const { nanoid } = require("nanoid");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const AdminUser = require("../models/admin-user.model");
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const AnimetTV_Email = require("../mail/email");
const async = require("async");
const request = require("request");
const fs = require("fs");
const sharp = require("sharp");
const B2_STORAGE = require("../services/b2-storage-bucket");
const rateLimit = require("express-rate-limit");
const whiteListEmails = require("../../admin_whitelist.json");

const defaultLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
});

const profileLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 70,
});


// storage Engine
const whiteList = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `${nanoid()}_${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  // only accepts allowed type
  if (!whiteList.includes(file.mimetype)) {
    return cb(new Error("file is not allowed"));
  }
  cb(null, true);
};

const uploadIMG = multer({
  storage: storage,
  limits: {
    fileSize: 4000000, // 4mb
  },
  fileFilter: fileFilter,
});


router.post(
  "/register",
  defaultLimiter,
  async (req, res) => {
      try {
          // tmp check if email whitelisted
          if (checkWhiteListEmails(req.body.email)) {
            /* before registering user check if email and avatar does not exist */
            AdminUser.countDocuments({ email: req.body.email }, (err, count) => {
              if (err) {
                res.sendStatus(500);
                throw err;
              }
  
              if (count > 0) {
                res.status(422).send({
                  success: false,
                  msg: "admin by that email already exist try different one",
                });
              } else {
                const accountId = nanoid();
                let newUser = {
                  accountID: accountId,
                  email: req.body.email,
                  password: String(req.body.password),
                };
  
                AdminUser.registerAdminUser(newUser, (err, callback) => {
                  if (err) {
                    res.sendStatus(500);
                    throw err;
                  }
                });
  
                /* user successfully created */
                res.json({
                  success: true,
                  msg: `account email: ${newUser.email} successfully created`,
                });
              }
            });
          } else {
            res.status(403).send({
              success: false,
              msg: `this email not whitelisted. Registration are invite only.`
            });
          }
       
      
    } catch (error) {
      console.log(error);
    }
  }
);

router.post(
  "/login",
  defaultLimiter,
  body("email").isEmail(),
  body("password").isLength({ min: 3 }),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
      } else {
        AdminUser.countDocuments({ email: req.body.email }, (err, count) => {
            if (err) {
              res.sendStatus(500);
              throw err;
            }

            if (count < 1) {
              res.status(400).send({
                success: false,
                msg: "no account found, please register",
              });
            } else {
                AdminUser.getAdminUserByEmail(req.body.email, (err, user) => {
                if (err) {
                  res.sendStatus(500);
                  throw err;
                }

                AdminUser.comparePassword(
                  req.body.password,
                  user.password,
                  (err, isMatch) => {
                    if (err) throw err;

                    if (isMatch) {
                      const token = jwt.sign(
                        user.toJSON(),
                        process.env.PASSPORT_SECRET,
                        {
                          // WILL EXPIRE IN  1d
                          expiresIn: "1d",
                        }
                      );

                      // user auth correct
                      res.json({
                        token: "JWT " + token,
                        success: true
                      });
                    } else {
                      res.status(400).send({
                        success: false,
                        msg: "wronge password or email address",
                      });
                    }
                  }
                );
              });
            }
          });
      }
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }
);

router.get(
  "/profile",
  profileLimiter,
  passport.authenticate(["admin-login"], { session: false }),
  async (req, res) => {
    try {
      const accountID = req.user.accountID;
      AdminUser.getUserByAccountID(accountID, (err, accountProfile) => {
        if (err) {
          res.json({
            success: false,
            message: "error while finding profile data",
          });
          throw err;
        }

        res.json({ success: true, accountProfile });
      });
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }
);

router.post(
  "/upload-avatar",
  defaultLimiter,
  passport.authenticate(["admin-login"], { session: false }),
  uploadIMG.single("avatar"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        res
          .status(422)
          .send({ success: false, msg: "Please upload correct file" });
      } else {
        // remove old avatar img from bucket
        AdminUser.getUserByAccountID(req.user.accountID, (err, accountProfile) => {
          if (err) {
            console.log(err);
          }

          if (accountProfile) {
            const request = {
              fileName: accountProfile.avatarFileName,
              fileID: accountProfile.avatarFileID,
            };

            B2_STORAGE.Delete_File(request)
              .then(() => {
                // convert & resize img to webp
                const filePath = file.path;
                const newFileName = nanoid();
                const newFilePath = process.cwd() + `/uploads/tmp-avatar/`;
                let content = fs.readFileSync(filePath);

                sharp(content)
                  .resize(200, 200)
                  .toFile(`${newFilePath}${newFileName}.webp`, (err, info) => {
                    if (!err) {
                      const request = {
                        accountID: req.user.accountID,
                        fileName: `${newFileName}.webp`,
                      };
                      // upload to b2 bucket
                      B2_STORAGE.Upload_User_Avatar(request)
                        .then(() => {
                          // remove tmp file
                          if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath, (err) => {
                              if (err) {
                                console.log("error deleting file ", error);
                              }
                              console.log("tmp avatar file deleted");
                            });
                          }

                          res.status(200).send({
                            success: true,
                            msg: "avatar img uploaded but old img not deleted",
                          });
                        })
                        .catch((err) => {
                          console.log(err);
                          res.status(500).send({
                            success: false,
                            msg: `${err}`,
                          });
                        });
                    }
                  });
              })
              .catch(() => {});
          }
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        msg: "could not upload avatar img",
      });
    }
  }
);


let checkWhiteListEmails = (email) => {
  let status = false;
  let list = whiteListEmails;
  list.forEach(el => {
    if (el.email === email) {
      status = true;
    }
  });
  return status;
}

module.exports = router;
