const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");
const request = require("request");

//Load Validation
const validateProfileInput = require("../../validation/profile");
const validateExperienceInput = require("../../validation/experience");
const validateEducationInput = require("../../validation/education");
//Load Profile Model
const Profile = require("../../models/Profile");
//Load User Model
const User = require("../../models/User");
//Load Post Model
const Post = require("../../models/Post");

//@route 	GET api/profile/test
//@desc 	tests profile route
//@access 	Public
router.get("/test", (req, res) => res.json({ msg: "profile Works" }));

//@route 	GET api/profile
//@desc 	Get current users profile
//@access 	Private
router.get(
	"/",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		const errors = {};
		Profile.findOne({ user: req.user.id })
			.populate("user", ["name", "avatar"])
			.then(profile => {
				if (!profile) {
					errors.noprofile = "There is no profile for this user";
					return res.status(404).json(errors);
				}
				res.json(profile);
			})
			.catch(err => res.status(404).json(err));
	}
);

//@route 	GET api/profile/all
//@desc 	Get all profiles
//@access 	Public
router.get("/all", (req, res) => {
	const errors = {};
	Profile.find()
		.populate("user", ["name", "avatar"])
		.then(profiles => { 
			if (!profiles) {
				errors.noprofile = "There are no profiles to display";
				return res.status(404).json(errors);
			}
			res.json(profiles);
		})
		.catch(err =>
			res
				.status(404)
				.json({ profile: "there are no profiles to display" })
		);
});

//@route 	GET api/profile/handle/:handle
//@desc 	Get profile by handle
//@access 	Public
router.get("/handle/:handle", (req, res) => {
	const errors = {};
	Profile.findOne({ handle: req.params.handle })
		.populate("user", ["name", "avatar"])
		.then(profile => {
			if (!profile) {
				errors.noprofile = "There is no profile for this user";
				res.status(404).json(errors);
			}

			res.json(profile);
		})
		.catch(err => res.status(404).json(err));
});

//@route 	GET api/profile/user/:user_id
//@desc 	Get profile by user id
//@access 	Public
router.get("/user/:user_id", (req, res) => {
	const errors = {};
	Profile.findOne({ user: req.params.user_id })
		.populate("user", ["name", "avatar"])
		.then(profile => {
			if (!profile) {
				errors.noprofile = "There is no profile for this user";
				res.status(404).json(errors);
			}

			res.json(profile);
		})
		.catch(err => res.status(404).json(err));
});

// @route       GET api/profile/github/:username/:count/:sort
// @desc        Get github data from github api
// @access      Public
router.get("/github/:username/:count/:sort", (req, res) => {
  username = req.params.username;
  clientId = process.env.GITHUB_CLIENT_ID;
  clientSecret = process.env.GITHUB_CLIENT_SECRET;
  count = req.params.count;
  sort = req.params.sort;
  const options = {
    url: `https://api.github.com/users/${username}/repos?per_page=${count}&sort=${sort}&client_id=${clientId}&client_secret=${clientSecret}`,
    headers: {
      "User-Agent": "request"
    }
  };
  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      const info = JSON.parse(body);
      res.json(info);
    }
  }
  request(options, callback);
});

//@route 	POST api/profile
//@desc 	Create or Edit User Profile
//@access 	Private
router.post(
	"/",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		const { errors, isValid } = validateProfileInput(req.body);

		//Check Validation
		if (!isValid) {
			return res.status(400).json(errors);
		}

		//make unsetFields for $unset in Profile.findOneAndUpdate()
		const unsetFields = {};
		const profileFields = {social: {}, user: req.user.id, skills: req.body.skills.split(",")};
			Object.keys(req.body).forEach(key => {
				if(req.body[key] === "") {
					unsetFields[key] = req.body[key];
				} else if(["youtube", "twitter", "instagram", "facebook"].includes(key)) {
					profileFields.social[key] = req.body[key];
				} else if(key !== "skills" ) {
					profileFields[key] = req.body[key];
				}
			});

		//Make sure profile id exists in the database (no postman spoofing)
		Profile.findOne({ user: req.user.id })
			.then(profile => {
			//updates profile if it already exists, otherwise 
			// we create a new profile, this is two restful routes in one.
			if (profile) {
				//Check to see if handle already exists and update
				Profile.findOne({ handle: profileFields.handle }).then(
					profileByHandle => {
						//If handle is a duplicate then send error
						if ( profileByHandle && (profileByHandle.id !== profile.id)) {
							errors.handle = "That handle already exists. dumbass";
							return res.status(400).json(errors);
						} else {
						//Update profile if handle is not a duplicate
						Post.updateMany(
							{ user: req.user.id },
							{ usersProfileHandle: req.body.handle })
						.then(posts => {
							//Update Profile
							Profile.findOneAndUpdate(
							{ user: req.user.id },
							{ $set: profileFields, $unset: unsetFields },
							{ new: true }
						).then(profile =>{
							//Update User
							User.findOneAndUpdate({ _id: req.user.id }, {$set: {profileHandle: req.body.handle}})
							.then(user => {
								return res.json(profile)})})

						})
					}
					}
				);
			} else {
				//If user has not created a profile then we 
				//check to see if handle is a duplicate, if it's 
				//not then we create a new profile.
				Profile.findOne({ handle: profileFields.handle }).then(
					profile => {
						if (profile) {
							errors.handle = "That handle already exists.";
							res.status(400).json(errors);
						} else {
						//Set user hasProfile to true
						User.findOneAndUpdate(
							{ _id: req.user.id },
							{ $set: { hasProfile : true, profileHandle: req.body.handle } },
							{ new: true })
						.then(foundUser => {
							//Update users posts so that post.creatorHasProfile === true
							Post.updateMany(
								{ user: req.user.id },
								{ $set: { creatorHasProfile : true, usersProfileHandle: req.body.handle }}
								).then(posts => {
									//save profile
									new Profile(profileFields)
									.save()
									.then(profile => {
										return res.json(profile)});
								})


						}).catch(err => res.status(400).json(err));
						}
					}
				);
			}
		}).catch(err => res.json(404).json(err));
	}
)
		
	



//@route 	POST api/profile/experience
//@desc 	Add experience to profile
//@access 	Private
router.post(
	"/experience",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		const { errors, isValid } = validateExperienceInput(req.body);

		//Check Validation
		if (!isValid) {
			return res.status(400).json(errors);
		}
		Profile.findOne({ user: req.user.id }).then(profile => {
			const newExp = {
				title: req.body.title,
				company: req.body.company,
				location: req.body.location,
				from: req.body.from,
				to: req.body.to,
				current: req.body.current,
				description: req.body.description
			};

			//Add to experience array
			profile.experience.unshift(newExp);
			profile.save().then(profile => res.json(profile));
		});
	}
);

//@route 	POST api/profile/education
//@desc 	Add education to profile
//@access 	Private
router.post(
	"/education",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		const { errors, isValid } = validateEducationInput(req.body);

		//Check Validation
		if (!isValid) {
			return res.status(400).json(errors);
		}
		Profile.findOne({ user: req.user.id }).then(profile => {
			const newEdu = {
				school: req.body.school,
				degree: req.body.degree,
				fieldofstudy: req.body.fieldofstudy,
				from: req.body.from,
				to: req.body.to,
				current: req.body.current,
				description: req.body.description
			};

			//Add to education array
			profile.education.unshift(newEdu);
			profile.save().then(profile => res.json(profile));
		});
	}
);

//@route 	DELETE api/profile/experience/:exp_id
//@desc 	Delete an experience item from profile
//@access 	Private
router.delete(
	"/experience/:exp_id",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		Profile.findOne({ user: req.user.id })
			.then(profile => {
				//Get remove index
				const removeIndex = profile.experience
					.map(item => item.id)
					.indexOf(req.params.exp_id);

				//Splice out of array
				profile.experience.splice(removeIndex, 1);

				//Save
				profile.save().then(profile => res.json(profile));
			})
			.catch(err => res.status(404).json(err));
	}
);

//@route 	DELETE api/profile/education/:exp_id
//@desc 	Delete an education item from profile
//@access 	Private
router.delete(
	"/education/:edu_id",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		const errors = {};
		Profile.findOne({ user: req.user.id })
			.then(profile => {
				//Map the education array to its element ids and make sure the given id exists
				checkIds = profile.education.map(item => item.id);
				if (!checkIds.includes(req.params.edu_id)) {
                	errors.noeducation = "The profile item you are trying to delete doesn't exist.";
                	return res.status(404).json(errors);
            	};

            	//Create an updated array which excludes the item that we dont want
            	//Note that if you use indexOf and splice to accomplish this task then 
            	//if an incorrect id is provided via postman then indexOf will return
            	//a value of -1, which will cause splice to remove the wrong item.
				const updatedEducation = profile.education.filter(
					education => !(education.id === req.params.edu_id)
				);
				//Update education array
				profile.education = updatedEducation;
				//Save
				profile.save().then(profile => res.json(profile));
			})
			.catch(err => res.status(404).json(err));
	}
);

//@route /api/profile
//@desc Delete user and profile
//@access private
router.delete(
"/",
passport.authenticate("jwt", {session: false}),
(req, res) => {
	Profile.findOneAndRemove({user: req.user.id}).then(() => {
		User.findOneAndRemove({_id: req.user.id}).then(() => 
			res.json({success: true})
		);
	});
}
)

module.exports = router;
