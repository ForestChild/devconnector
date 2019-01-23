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
//@desc 	Get user by id
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

		//Get Fields
		const profileFields = {};
		profileFields.user = req.user.id;
		if (req.body.handle) profileFields.handle = req.body.handle;
		if (req.body.company) profileFields.company = req.body.company;
		if (req.body.website) profileFields.website = req.body.website;
		if (req.body.location) profileFields.location = req.body.location;
		if (req.body.bio) profileFields.bio = req.body.bio;
		if (req.body.status) profileFields.status = req.body.status;
		if (req.body.githubusername)
			profileFields.githubusername = req.body.githubusername;
		//Skills - split into array
		if (typeof req.body.skills !== "undefined") {
			profileFields.skills = req.body.skills.split(",");
		}
		//Social
		profileFields.social = {};
		if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
		if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
		if (req.body.linkedin)
			profileFields.social.linkedin = req.body.linkedin;
		if (req.body.facebook)
			profileFields.social.facebook = req.body.facebook;
		if (req.body.instagram)
			profileFields.social.instagram = req.body.instagram;
		if (req.body.handle) profileFields.handle = req.body.handle;
		if (req.body.handle) profileFields.handle = req.body.handle;

		Profile.findOne({ user: req.user.id }).then(profile => {
			//updates profile if it already exists, otherwise creates new profile, this is two restful routes in one.
			if (profile) {
				//update
				Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				).then(profile => res.json(profile));
			} else {
				//create

				//Check if handle exists
				Profile.findOne({ handle: profileFields.handle }).then(
					profile => {
						if (profile) {
							errors.handle = "That handle already exists.";
							res.status(400).json(errors);
						}
						//save profile
						new Profile(profileFields)
							.save()
							.then(profile => res.json(profile));
					}
				);
			}
		});
	}
);

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
