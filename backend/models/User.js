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
	isProfilePublic: { type: Boolean, default: true },
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
	preferences: {
		autoSummarize: { type: Boolean, default: true },
		excludedDomains: [{ type: String }],
		minReadingTime: { type: Number, default: 30 }, // seconds
	},
	createdAt: { type: Date, default: Date.now },
	lastActive: { type: Date, default: Date.now },
});

// Index for faster queries
userSchema.index({ username: 1 });

module.exports = mongoose.model("User", userSchema);
