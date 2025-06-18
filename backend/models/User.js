const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true },
	email: {
		type: String,
		required: true,
		unique: true,
		set: (v) => v.toLowerCase(),
	},
	password: { type: String, required: true },
	displayName: { type: String },
	friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // use ObjectId
	friendRequests: [
		{
			from: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
				required: true,
			},
			timestamp: { type: Date, default: Date.now },
		},
	],
	createdAt: { type: Date, default: Date.now },
	lastActive: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
