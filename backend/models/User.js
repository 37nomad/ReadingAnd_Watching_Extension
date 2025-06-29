const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		set: (v) => v.toLowerCase(),
	},
	email: {
		type: String,
		required: true,
		unique: true,
		set: (v) => v.toLowerCase(),
	},
	password: { type: String, required: true },
	displayName: { type: String },
	friends: [
		{
			_id: false,
			id: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
				required: true,
			},
		},
	],
	friendRequests: [
		{
			_id: false,
			from: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
				required: true,
			},
		},
	],
	data: [
		{
			title: { type: String, required: true },
			url: { type: String, required: true },
			summary: { type: String, required: true },
			createdAt: { type: Date, default: Date.now },
		},
	],
	createdAt: { type: Date, default: Date.now },
	lastActive: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);