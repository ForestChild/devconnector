const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../../models/User");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");

//Load Input Validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

//@route 	GET api/users/register
//@desc 	register user
//@access 	public
router.post("/register", (req, res) => {
	const { errors, isValid } = validateRegisterInput(req.body);

	//Check Validation
	if (!isValid) {
		return res.status(400).json(errors);
	}

	User.findOne({ email: req.body.email }).then(user => {
		if (user) {
			errors.email = "This email is already registered to an account";
			return res.status(400).json(errors);
		} else {
			const avatar = gravatar.url(req.body.email, {
				s: "200", //Size
				r: "pg", //Rating
				d: "mm" //default
			});
			const newUser = new User({
				name: req.body.name,
				email: req.body.email,
				avatar,
				password: req.body.password
			});
			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(newUser.password, salt, (err, hash) => {
					if (err) throw err;
					newUser.password = hash;
					newUser
						.save()
						.then(user => res.json(user))
						.catch(err => console.log(err));
				});
			});
		}
	});
});

//@route 	POST api/users/login
//@desc 	Login User / return JWT token
//@access 	Public
router.post("/login", (req, res) => {
	const { errors, isValid } = validateLoginInput(req.body);

	//Check Validation
	if (!isValid) {
		return res.status(400).json(errors);
	}
	const email = req.body.email;
	const password = req.body.password;

	//find user by email
	User.findOne({ email }).then(user => {
		//check for user
		if (!user) {
			return res.status(404).json({ email: "User Not Found" });
		}

		//Check Password
		bcrypt.compare(password, user.password).then(isMatch => {
			if (isMatch) {
				//User Matched
				const payload = {
					id: user.id,
					name: user.name,
					avatar: user.avatar,
					hasProfile: user.hasProfile
				}; //create jwt payload
				//Sign Token
				jwt.sign(
					payload,
					keys.secretOrKey,
					{ expiresIn: 36000 },
					(err, token) => {
						res.json({
							success: true,
							token: "Bearer " + token
						});
					}
				);
			} else {
				errors.password = "Password Incorrect";
				return res.status(400).json(errors);
			}
		});
	});
});

//@route 	GET api/users/current
//@desc 	return current user
//@access 	private
//This is used to keep the redux store hasProfile user property
//in sync with the backend user hasProfile property.
router.get(
	"/current",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		User.findOne({ _id: req.user.id }).then(user => {
		const payload = {
					id: user.id,
					name: user.name,
					avatar: user.avatar,
					hasProfile: user.hasProfile,
					profileHandle: user.profileHandle
				}; 
				//create jwt payload
				//Sign Token
				jwt.sign(
					payload,
					keys.secretOrKey,
					{ expiresIn: 36000 },
					(err, token) => {
						res.json({
							success: true,
							token: "Bearer " + token
						});
					}
				)
			}
			)
	}
);

module.exports = router;
