const express = require("express");
const Content = require("../models/content");
const User = require("../models/User");
const { authenticateToken } = require("../middlewares/auth");

const router = express.Router();

// POST /api/content - Add new content (from extension after LLM processing)
router.post("/", authenticateToken, async (req, res) => {
	try {
		const {
			title,
			summary,
			originalUrl,
			contentType,
			domain,
			tags = [],
			qualityScore = 5,
			author,
			publishedDate,
			readingTimeMinutes,
			thumbnail
		} = req.body;

		// Validation
		if (!title || !summary || !originalUrl || !contentType || !domain) {
			return res.status(400).json({
				error: "Missing required fields: title, summary, originalUrl, contentType, domain"
			});
		}

		// Check if content already exists for this user
		const existingContent = await Content.findOne({
			userId: req.user.userId,
			originalUrl: originalUrl
		});

		if (existingContent) {
			return res.status(409).json({
				error: "Content already exists",
				content: existingContent
			});
		}

		// Create new content
		const content = new Content({
			userId: req.user.userId,
			title,
			summary,
			originalUrl,
			contentType,
			domain,
			tags,
			qualityScore,
			author,
			publishedDate,
			readingTimeMinutes,
			thumbnail
		});

		await content.save();

		// Populate user info for response
		await content.populate('userId', 'username displayName');

		res.status(201).json({
			message: "Content added successfully",
			content
		});

	} catch (error) {
		console.error("Add content error:", error);
		res.status(500).json({ error: "Failed to add content" });
	}
});

// GET /api/content/my - Get current user's content
router.get("/my", authenticateToken, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			contentType,
			domain,
			sortBy = 'scrapedAt',
			sortOrder = 'desc'
		} = req.query;

		// Build filter
		const filter = { userId: req.user.userId };
		if (contentType) filter.contentType = contentType;
		if (domain) filter.domain = domain;

		// Build sort
		const sort = {};
		sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

		const skip = (parseInt(page) - 1) * parseInt(limit);

		const [content, totalCount] = await Promise.all([
			Content.find(filter)
				.sort(sort)
				.skip(skip)
				.limit(parseInt(limit))
				.populate('userId', 'username displayName'),
			Content.countDocuments(filter)
		]);

		res.json({
			content,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(totalCount / parseInt(limit)),
				totalCount,
				hasMore: skip + content.length < totalCount
			}
		});

	} catch (error) {
		console.error("Get my content error:", error);
		res.status(500).json({ error: "Failed to fetch content" });
	}
});

// GET /api/content/user/:username - Get public content of a specific user
router.get("/user/:username", async (req, res) => {
	try {
		const { username } = req.params;
		const {
			page = 1,
			limit = 20,
			contentType,
			domain
		} = req.query;

		// Find the user
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Check if user profile is public
		if (!user.isPublic) {
			return res.status(403).json({ error: "User profile is private" });
		}

		// Build filter for public content only
		const filter = { 
			userId: user._id, 
			isPublic: true 
		};
		if (contentType) filter.contentType = contentType;
		if (domain) filter.domain = domain;

		const skip = (parseInt(page) - 1) * parseInt(limit);

		const [content, totalCount] = await Promise.all([
			Content.find(filter)
				.sort({ scrapedAt: -1 })
				.skip(skip)
				.limit(parseInt(limit))
				.populate('userId', 'username displayName'),
			Content.countDocuments(filter)
		]);

		res.json({
			user: {
				username: user.username,
				displayName: user.displayName,
				profilePicture: user.profilePicture
			},
			content,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(totalCount / parseInt(limit)),
				totalCount,
				hasMore: skip + content.length < totalCount
			}
		});

	} catch (error) {
		console.error("Get user content error:", error);
		res.status(500).json({ error: "Failed to fetch user content" });
	}
});

// DELETE /api/content/:contentId - Delete content item
router.delete("/:contentId", authenticateToken, async (req, res) => {
	try {
		const { contentId } = req.params;

		const content = await Content.findOne({
			_id: contentId,
			userId: req.user.userId
		});

		if (!content) {
			return res.status(404).json({ error: "Content not found or unauthorized" });
		}

		await Content.findByIdAndDelete(contentId);

		res.json({ message: "Content deleted successfully" });

	} catch (error) {
		console.error("Delete content error:", error);
		res.status(500).json({ error: "Failed to delete content" });
	}
});

// PATCH /api/content/:contentId/privacy - Toggle content privacy
router.patch("/:contentId/privacy", authenticateToken, async (req, res) => {
	try {
		const { contentId } = req.params;
		const { isPublic } = req.body;

		const content = await Content.findOneAndUpdate(
			{ _id: contentId, userId: req.user.userId },
			{ isPublic: Boolean(isPublic) },
			{ new: true }
		).populate('userId', 'username displayName');

		if (!content) {
			return res.status(404).json({ error: "Content not found or unauthorized" });
		}

		res.json({
			message: "Content privacy updated",
			content
		});

	} catch (error) {
		console.error("Update content privacy error:", error);
		res.status(500).json({ error: "Failed to update content privacy" });
	}
});

// GET /api/content/stats - Get user's content statistics
router.get("/stats", authenticateToken, async (req, res) => {
	try {
		const userId = req.user.userId;

		const stats = await Content.aggregate([
			{ $match: { userId: userId } },
			{
				$group: {
					_id: null,
					totalContent: { $sum: 1 },
					articleCount: {
						$sum: { $cond: [{ $eq: ["$contentType", "article"] }, 1, 0] }
					},
					videoCount: {
						$sum: { $cond: [{ $eq: ["$contentType", "video"] }, 1, 0] }
					},
					averageQualityScore: { $avg: "$qualityScore" },
					totalReadingTime: { $sum: "$readingTimeMinutes" }
				}
			}
		]);

		// Get top domains
		const topDomains = await Content.aggregate([
			{ $match: { userId: userId } },
			{ $group: { _id: "$domain", count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
			{ $limit: 10 }
		]);

		// Get recent activity (last 7 days)
		const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const recentCount = await Content.countDocuments({
			userId: userId,
			scrapedAt: { $gte: weekAgo }
		});

		res.json({
			stats: stats[0] || {
				totalContent: 0,
				articleCount: 0,
				videoCount: 0,
				averageQualityScore: 0,
				totalReadingTime: 0
			},
			topDomains,
			recentActivity: recentCount
		});

	} catch (error) {
		console.error("Get content stats error:", error);
		res.status(500).json({ error: "Failed to fetch content statistics" });
	}
});

module.exports = router;