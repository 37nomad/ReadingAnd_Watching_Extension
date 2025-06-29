// controllers/dataController.js

const User = require("../models/User");

/**
 * @route   POST /api/data
 * @desc    Add a new data entry for the authenticated user
 * @access  Private
 */
exports.addData = async (req, res) => {
	try {
		const { title, url, summary } = req.body;
		const userId = req.user.userId;

		// 1. Validate input
		if (!title || !url || !summary) {
			return res
				.status(400)
				.json({ error: "Title, url, and summary are required" });
		}

		// 2. Find the user
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// 3. Enforce max 15 entries: keep the 14 most recent before adding new
		if (user.data.length >= 15) {
			user.data.sort(
				(a, b) => new Date(a.createdAt) - new Date(b.createdAt)
			); // oldest first
			user.data = user.data.slice(user.data.length - 14); // keep the 14 latest
		}

		// 4. Create and push new data entry
		const newDataEntry = {
			title,
			url,
			summary,
			createdAt: new Date(),
		};
		user.data.push(newDataEntry);

		// 5. Save user document
		await user.save();

		// 6. Return success
		res.status(201).json({
			message: "Data added successfully",
			newData: user.data[user.data.length - 1],
		});
	} catch (error) {
		console.error("Add data error:", error);
		res.status(500).json({ error: "Server error while adding data" });
	}
};

/**
 * @route   GET /api/data/:username
 * @desc    Get the data array for a specific user
 * @access  Private (Owner or Friend only)
 */
exports.getData = async (req, res) => {
	try {
		const requesterId = req.user.userId;
		const targetUsername = req.params.username.toLowerCase();

		// 1. Find the user whose data is being requested
		const targetUser = await User.findOne({ username: targetUsername });
		if (!targetUser) {
			return res.status(404).json({ error: "User not found" });
		}

		// 2. Authorization Check:
		//    - Is the requester the owner of the data?
		const isOwner = targetUser._id.toString() === requesterId;

		//    - Is the requester a friend of the target user?
		const isFriend = targetUser.friends.some(
			(friend) => friend.id.toString() === requesterId
		);

		// 3. If not the owner and not a friend, deny access
		if (!isOwner && !isFriend) {
			return res.status(403).json({
				error: "Access Forbidden: You are not authorized to view this data.",
			});
		}

		// 4. If authorized, send the data(sorted by createdAt in descending order)
		const sortedData = targetUser.data
			.slice()
			.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

		res.json({ data: sortedData });
	} catch (error) {
		console.error("Get data error:", error);
		res.status(500).json({ error: "Server error while fetching data" });
	}
};
