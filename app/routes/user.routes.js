require("dotenv").config();
const { nanoid } = require("nanoid");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/user.model");
const UserProfile = require("../models/userprofile.model");
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
const whiteListEmails = require("../../whitelist_email.json");

const defaultLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
});

const tokenCheckLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 25,
});

const profileLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000,
});

const listMutationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 40,
});

// storage Engine
const whiteList_IMG = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const whiteList_MEDIA = ["video/mp4", "video/ogg", "audio/mpeg"]
const multer = require("multer");
// for IMGs 
const storage_IMG = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `${nanoid()}_${file.originalname}`);
  },
});

// for IMGs public
const storage_IMG_public = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/");
  },
  filename: function (req, file, cb) {
    cb(null, `${nanoid()}_${file.originalname}`);
  }
})

const fileFilterImg = (req, file, cb) => {
  // only accepts allowed type
  if (!whiteList_IMG.includes(file.mimetype)) {
    return cb(new Error("file is not allowed"));
  }
  cb(null, true);
};



const uploadIMG = multer({
  storage: storage_IMG,
  limits: {
    fileSize: 4000000, // 4mb
  },
  fileFilter: fileFilterImg,
});

// for VIDEOs
const storage_MEDIA = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/media/");
  },
  filename: function (req, file, cb) {
    cb(null, `${nanoid()}_${file.originalname}`);
  },
});

const fileFilterMedia = (req, file, cb) => {
  // only accepts allowed type
  if (!whiteList_MEDIA.includes(file.mimetype)) {
    return cb(new Error("file is not allowed"));
  }
  cb(null, true);
};

const uploadMEDIA = multer({
  storage: storage_MEDIA,
  limits: {
    fileSize: 50000000, // 50mb
  },
  fileFilter: fileFilterMedia,
});



router.post(
  "/verify-token",
  tokenCheckLimiter,
  passport.authenticate(["regular-login"], { session: false }),
  (req, res) => {
    res.json({ success: true });
  }
);

router.post(
  "/register",
  defaultLimiter,
  body("email").isEmail(),
  body("password").isLength({ min: 5 }),
  body("token").isString(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
      }

      // verify reCAPTCHA
      verifyCAPTCHA(req.body.token, req.socket.remoteAddress, (err, status) => {
        if (err) {
          throw err;
        }
        if (status) {
          // tmp check if email whitelisted
          if (checkWhiteListEmails(req.body.email)) {
            /* before registering user check if email and avatar does not exist */
            User.countDocuments({ email: req.body.email }, (err, count) => {
              if (err) {
                res.sendStatus(500);
                throw err;
              }

              if (count > 0) {
                res.status(422).send({
                  success: false,
                  msg: "user by that email already exist try different one",
                });
              } else {
                const accountId = nanoid();
                const newUser = {
                  accountID: accountId,
                  email: req.body.email,
                  password: req.body.password,
                };

                User.registerUser(newUser, (err, callback) => {
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
              msg: `this email not whitelisted. Registration are invite only.`,
            });
          }
        } else {
          res.status(401).send({
            success: false,
            msg: `reCAPTCHA failed, too many attempts. Try again later`,
          });
        }
      });
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
  body("token").isString(),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
      } else {
        verifyCAPTCHA(
          req.body.token,
          req.socket.remoteAddress,
          (err, status) => {
            if (err) {
              throw err;
            }
            if (status === true) {
              User.countDocuments({ email: req.body.email }, (err, count) => {
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
                  User.getUserByEmail(req.body.email, (err, user) => {
                    if (err) {
                      res.sendStatus(500);
                      throw err;
                    }

                    User.comparePassword(
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
                              expiresIn: "30d",
                            }
                          );

                          // user auth correct
                          res.json({
                            success: true,
                            token: "JWT " + token,
                            user: {
                              email: user.email,
                              accountID: user.accountID,
                            },
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
            } else {
              res.status(401).send({
                success: false,
                msg: `reCAPTCHA failed, too many attempts. Try again later`,
              });
            }
          }
        );
      }
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }
);

let verifyCAPTCHA = (_response, _remoteAddress, callback) => {
  try {
    let _secret = process.env.CAPTCHA_SECRET;
    var verificationUrl =
      "https://www.google.com/recaptcha/api/siteverify?secret=" +
      _secret +
      "&response=" +
      _response +
      "&remoteip=" +
      _remoteAddress;

    request(verificationUrl, function (error, response, body) {
      let _body = JSON.parse(body);
      if (_body.score > 0.5) {
        callback(null, true);
      }
    });
  } catch (error) {
    console.log(error);
    callback(null, false);
  }
};

router.post("/forgot", defaultLimiter, (req, res) => {
  verifyCAPTCHA(req.body.token, req.socket.remoteAddress, (err, status) => {
    if (err) {
      throw err;
    }

    if (status === true) {
      async.waterfall(
        [
          function (done) {
            crypto.randomBytes(20, function (err, buff) {
              var token = buff.toString("hex");
              done(err, token);
            });
          },

          function (token, done) {
            User.findOne({ email: req.body.email }, function (err, user) {
              if (!user) {
                return res.status(404).send({
                  success: false,
                  msg: `No account with that email address exists.`,
                });
              }

              user.resetPasswordToken = token;
              user.resetPasswordExpires = Date.now() + 7200000; // 2 hour expires

              user.save(function (err) {
                done(err, token, user);
              });
            });
          },

          function (token, user, done) {
            AnimetTV_Email.sendPasswordRestEmail(
              user.email,
              `https://animet.tv/forgot-password/${token}`,
              (err, callback) => {
                if (err) {
                  console.log(err);
                }
                if (callback) {
                  res.status(200).send({
                    success: true,
                    msg: "Check your email for instructions",
                  });
                }
                done(err, "done");
              }
            );
          },
        ],
        function (err) {
          if (err) {
            res.status(500).send({
              success: false,
              msg: "Something went wronge please contact admin@animet.tv or our discord server for further information.",
            });
          }
        }
      );
    } else {
      res.status(401).send({
        success: false,
        msg: `reCAPTCHA failed, too many attempts. Try again later`,
      });
    }
  });
});

router.get("/reset/:token", tokenCheckLimiter, (req, res) => {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    },
    function (err, user) {
      if (!user) {
        res.status(404).send({
          success: false,
          msg: "error Password rest URL is invalid or has expired.",
        });
      } else {
        res.json({
          success: true,
          email: user.email,
        });
      }
    }
  );
});

router.post("/reset/:token", defaultLimiter, (req, res) => {
  async.waterfall(
    [
      function (done) {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
          },
          function (err, user) {
            if (!user) {
              res.status(400).send({
                success: false,
                msg: "Password reset token is invalid or has expired.",
              });
            } else {
              User.hashPassword(req.body.password, (err, newPasswordHash) => {
                if (err) {
                  console.log(err);
                  res.send(500).send({
                    sucess: false,
                    msg: "Password change failed.",
                  });
                } else {
                  console.log("hello");
                  user.password = `${newPasswordHash}`;
                  user.resetPasswordToken = undefined;
                  user.resetPasswordExpires = undefined;

                  user.save(function (err) {
                    if (err) {
                      console.log(err);
                    }
                    done(err, "done");
                  });
                }
              });
            }
          }
        );
      },

      /* function(user, done) {
                AnimetTV_Email.sendPasswordChangedEmail(user.email, (err, callback) => {
                    if (callback) {
                        done(err,'done'); 
                    }
                });
            } */
    ],
    function (err) {
      if (err) {
        res.status(500).send({
          success: false,
          msg: "server error on set change password",
        });
      } else {
        res.status(200).send({
          success: true,
          msg: "success fully changed password",
        });
      }
    }
  );
});

router.get(
  "/profile",
  profileLimiter,
  passport.authenticate(["regular-login"], { session: false }),
  async (req, res) => {
    try {
      const accountID = req.user.accountID;
      User.getUserByAccountID(accountID, (err, accountProfile) => {
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

router.get(
  "/list",
  profileLimiter,
  passport.authenticate(["regular-login"], { session: false }),
  async (req, res) => {
    try {
      const accountID = req.user.accountID;
      UserProfile.getMyProfile(accountID, (err, result) => {
        if (err) {
          res.sendStatus(500);
          throw err;
        }

        res.json(result);
      });
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }
);

router.put(
  "/add-item-to-list",
  listMutationLimiter,
  passport.authenticate(["regular-login"], { session: false }),
  (req, res) => {
    try {
      const addItemRequest = {
        accountID: req.user.accountID,
        img_url: req.body.img_url,
        title: req.body.title,
        nsfw: req.body.nsfw,
        LIST: req.body.LIST,
      };

      UserProfile.exists(
        { accountID: addItemRequest.accountID },
        { tracked_anime: { title: addItemRequest.title } },
        (err, exists) => {
          if (err) {
            throw err;
          }

          if (exists == false) {
            /* does not exists */
            UserProfile.appendItemToList(addItemRequest, (err, callback) => {
              if (err) {
                res.json({
                  success: false,
                  message: "error while adding new item to list",
                });
                throw err;
              }

              res.json({
                success: true,
                message: "Anime has been added to list",
              });
            });
          } else {
            res.json({ success: false, message: "Anime already in list" });
          }
        }
      );
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }
);

router.put(
  "/add-item-to-list-by-title",
  listMutationLimiter,
  passport.authenticate(["regular-login"], { session: false }),
  async (req, res) => {
    if (req.body.animeTitle) {
      const addItemRequest = {
        accountID: req.user.accountID,
        img_url: req.body.img_url,
        title: req.body.animeTitle,
        nsfw: false,
        LIST: "plan_to_watch",
      };

      UserProfile.exists(
        { tracked_anime: { title: addItemRequest.title } },
        (err, exists) => {
          if (err) {
            throw err;
          }

          if (exists == false) {
            /* does not exists */
            UserProfile.appendItemToList(addItemRequest, (err, callback) => {
              if (err) {
                res.json({
                  success: false,
                  message: "error while adding new item to list",
                });
                throw err;
              }

              res.json({
                success: true,
                message: "Anime has been added to list",
              });
            });
          } else {
            res.json({ success: false, message: "Anime already in list" });
          }
        }
      );
    }
  }
);

router.put(
  "/remove-item-from-list",
  listMutationLimiter,
  passport.authenticate(["regular-login"], { session: false }),
  async (req, res) => {
    try {
      const removeItemRequest = {
        accountID: req.user.accountID,
        item_id: req.body.item_id,
        LIST: req.body.LIST,
      };

      const trackedItemReq = {
        accountID: removeItemRequest.accountID,
        title: req.body.title,
      };

      UserProfile.removeTrackedItem(trackedItemReq, (err, doc) => {
        if (err) {
          throw err;
        }
      });

      UserProfile.removeItemFromList(removeItemRequest, (err, callback) => {
        if (err) {
          res.json({
            success: false,
            message: "error while removing item from list",
          });
          throw err;
        }
        res.json({ success: true, message: "Anime removed from list" });
      });
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }
);

router.put(
  "/item-completed",
  listMutationLimiter,
  passport.authenticate(["regular-login"], { session: false }),
  async (req, res) => {
    try {
      const addItemRequest = {
        accountID: req.user.accountID,
        img_url: req.body.img_url,
        title: req.body.title,
        nsfw: req.body.nsfw,
        LIST: "completed",
      };

      UserProfile.appendItemToList(addItemRequest, (err, callback) => {
        if (err) {
          res.json({
            success: false,
            message: "error while adding new item to list",
          });
          throw err;
        }

        const removeItemRequest = {
          accountID: req.user.accountID,
          item_id: req.body.item_id,
          LIST: "plan_to_watch",
        };

        UserProfile.removeItemFromList(removeItemRequest, (err, callback) => {
          if (err) {
            res.json({
              success: false,
              message: "error while removing item from list",
            });
            throw err;
          }
        });

        res.json({ success: true, message: "Anime moved to plan to watch" });
      });
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }
);

router.put(
  "/item-plan-to-watch",
  listMutationLimiter,
  passport.authenticate(["regular-login"], { session: false }),
  async (req, res) => {
    try {
      const addItemRequest = {
        accountID: req.user.accountID,
        img_url: req.body.img_url,
        title: req.body.title,
        nsfw: req.body.nsfw,
        LIST: "plan_to_watch",
      };

      UserProfile.appendItemToList(addItemRequest, (err, callback) => {
        if (err) {
          res.json({
            success: false,
            message: "error while adding new item to list",
          });
          throw err;
        }

        const removeItemRequest = {
          accountID: req.user.accountID,
          item_id: req.body.item_id,
          LIST: "completed",
        };

        UserProfile.removeItemFromList(removeItemRequest, (err, callback) => {
          if (err) {
            res.json({
              success: false,
              message: "error while removing item from list",
            });
            throw err;
          }
        });

        res.json({ success: true, message: "item moved to completed" });
      });
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }
);

router.put(
  "/set-list-status",
  listMutationLimiter,
  passport.authenticate(["regular-login"], { session: false }),
  async (req, res) => {
    try {
      const setListStatusRequest = {
        accountID: req.user.accountID,
        setListStatus: req.body.isListPublic,
      };

      User.setListStatus(setListStatusRequest, (err, callback) => {
        if (err) {
          req.json({
            success: false,
            message: "error while changing list status",
          });
          throw err;
        }
        let status = "private";
        if (req.body.isListPublic) {
          status = "public";
        }

        res.json({ success: true, message: `you lists are now ${status}` });
      });
    } catch (error) {
      res.sendStatus(500);
      console.log(error);
    }
  }
);

router.get("/get-public-user-list", listMutationLimiter, async (req, res) => {
  try {
    const accountID = req.params.accountID;
    /* check if user list public if it is return user list */
    User.findOne(
      { accountID: accountID },
      { isProfilePublic: 1 },
      (err, doc) => {
        if (err) {
          res.json({
            success: false,
            message: "error while getting user list",
          });
          throw err;
        }

        if (doc.isListPublic) {
          UserProfile.getMyProfile(accountID, (err, list) => {
            if (err) {
              res.json({
                success: false,
                message: "error while getting user list",
              });
              throw err;
            }

            res.json(list);
          });
        } else {
          res.json({ success: false, message: "List is private" });
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

router.get(
  "/continue-watching",
  passport.authenticate(["regular-login"], { session: false }),
  async (req, res) => {
    try {
      const accountID = req.user.accountID;

      UserProfile.getContinueWatching(accountID, (err, continue_watching) => {
        if (err) {
          res.json({
            success: false,
            message: "error while finding profile data",
          });
          throw err;
        }

        if (continue_watching) {
          res.json(continue_watching);
        }
      });
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }
);

router.put(
  "/add-item-to-continue-watching",
  listMutationLimiter,
  passport.authenticate(["regular-login"], { session: false }),
  async (req, res) => {
    var _title = req.body.animeTitle;
    const addItemRequest = {
      accountID: req.user.accountID,
      img_url: req.body.img_url,
      title: _title,
      currentEpisode: req.body.episodeNumber,
      totalEpisode: req.body.totalEpisode,
      type: req.body.type,
    };

    const trackedItemReq = {
      accountID: req.user.accountID,
      title: _title,
    };

    UserProfile.exists(
      { accountID: addItemRequest.accountID },
      { tracked_anime_continue_watching: { title: addItemRequest.title } },
      (err, exists) => {
        if (err) {
          throw err;
        }

        // if exists remove and append new item
        if (exists) {
          UserProfile.removeItemFromContinueWatching(
            trackedItemReq,
            (err, doc) => {
              if (err) {
                throw err;
              }
            }
          );

          UserProfile.addItemToContinueWatching(
            addItemRequest,
            (err, callback) => {
              if (err) {
                res.json({
                  success: false,
                  message:
                    "Sorry we could not add the last anime you were watching to continue watching list",
                });
                throw err;
              }

              res.json({
                success: true,
                message: "Anime has been added to continue watching",
              });
            }
          );
        } else {
          /* if does not exists just append  */
          UserProfile.addItemToContinueWatching(
            addItemRequest,
            (err, callback) => {
              if (err) {
                res.json({
                  success: false,
                  message:
                    "Sorry we could not add the last anime you were watching to continue watching list",
                });
                throw err;
              }

              res.json({
                success: true,
                message: "Anime has been added to continue watching",
              });
            }
          );
        }
      }
    );
  }
);

router.put(
  "/remove-item-from-continue-watching",
  listMutationLimiter,
  passport.authenticate(["regular-login"], { session: false }),
  async (req, res) => {
    try {
      const removeItemRequest = {
        accountID: req.user.accountID,
        title: req.body.title,
      };

      const trackedItemReq = {
        accountID: removeItemRequest.accountID,
        title: req.body.title,
      };

      UserProfile.removeTracked_anime_continue_watching(
        trackedItemReq,
        (err, doc) => {
          if (err) {
            throw err;
          }
        }
      );

      UserProfile.removeItemFromContinueWatching(
        removeItemRequest,
        (err, callback) => {
          if (err) {
            res.json({
              success: false,
              message: "error while removing anime from continue watching",
            });
            throw err;
          }

          res.json({
            success: true,
            message: "Anime removed from continue watching",
          });
        }
      );
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }
);

router.post(
  "/upload-anime-tracer",
  defaultLimiter,
  passport.authenticate(["regular-login"], { session: false }),
  uploadIMG.single("anime-tracer"),
  async(req, res) => {
    try {
      const file = req. file;
      if (!file) {
        res
          .status(422)
          .send({ success: false, msg: "Please upload correct file" });
      } else {
        User.getUserByAccountID(req.user.accountID, (err, accountProfile) =>  {
          if (err) {
            console.log(err);
          }
          if (accountProfile) {
            console.log(accountProfile);
            let content = fs.readFileSync(filePath);
            const request = {
              accountID: req.user.accountID,
              fileName: content,
            };

            // upload to image storage bucket
          }
        })
      }
    } catch (error) {
      res.sendStatus(404);
    }
  }
)

router.post(
  "/upload-avatar",
  defaultLimiter,
  passport.authenticate(["regular-login"], { session: false }),
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
        User.getUserByAccountID(req.user.accountID, (err, accountProfile) => {
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

router.post(
  "/upload-media",
  defaultLimiter,
  passport.authenticate(["regular-login"], { session: false }),
  uploadMEDIA.single("video"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        res
          .status(422)
          .send({ success: false, msg: "Please upload correct file type" });
      } else {
        // CREATE USER UPLOADED CONTENT LIST
        User.getUserByAccountID(req.user.accountID, (err, accountProfile) => {
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
  list.forEach((el) => {
    if (el.email === email) {
      status = true;
    }
  });
  return status;
};

module.exports = router;
