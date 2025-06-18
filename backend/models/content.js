const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
		index: true,
	},
	title: {
		type: String,
		required: true,
		trim: true,
	},
	summary: {
		type: String,
		required: true,
	},
	originalUrl: {
		type: String,
		required: true,
		trim: true,
	},
	contentType: {
		type: String,
		enum: ["article", "video", "other"],
		required: true,
		index: true,
	},
	domain: {
		type: String,
		required: true,
		trim: true,
		index: true,
	},
	tags: [{
		type: String,
		trim: true,
	}],
	qualityScore: {
		type: Number,
		min: 0,
		max: 10,
		default: 5,
	},
	isPublic: {
		type: Boolean,
		default: true,
	},
	scrapedAt: {
		type: Date,
		default: Date.now,
		index: true,
	},
	// Metadata from scraping
	author: String,
	publishedDate: Date,
	readingTimeMinutes: Number,
	thumbnail: String,
}, {
	timestamps: true,
});

// Compound indexes for efficient queries
contentSchema.index({ userId: 1, scrapedAt: -1 });
contentSchema.index({ userId: 1, contentType: 1, scrapedAt: -1 });
contentSchema.index({ domain: 1, scrapedAt: -1 });

// Virtual for checking if content is recent
contentSchema.virtual('isRecent').get(function() {
	const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
	return this.scrapedAt > dayAgo;
});

module.exports = mongoose.model("Content", contentSchema);