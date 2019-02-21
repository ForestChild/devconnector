const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//Create Schema
const UserSchema = new Schema({
	name: {
		type: String,
		require: true
	},

	email: {
		type: String,
		require: true
	},
	password: {
		type: String,
		require: true
	},
	avatar: {
		type: String
	},
	hasProfile: {
		type: Boolean,
		default: false
	},
	profileHandle: {
		type: String
	},
	date: {
		type: Date,
		require: true,
		default: Date.now
	}
});

module.exports = User = mongoose.model("users", UserSchema);
