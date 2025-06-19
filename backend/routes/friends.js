const express = require("express");
const router = express.Router();
const User = require("../models/User");
const mongoose = require("mongoose");
const { authenticateToken } = require("../middlewares/auth");

// POST /api/friends/request
// send a request to someone
router.post("/request", authenticateToken, async (req, res) => {
	try {
		const { toUsername } = req.body;
		const fromId = req.user.userId;

		if (!toUsername) {
			return res
				.status(400)
				.json({ error: "Recipient username is required" });
		}

		const fromUser = await User.findById(fromId);
		const toUser = await User.findOne({
			username: toUsername.toLowerCase().trim(),
		});

		if (!fromUser || !toUser) {
			return res.status(404).json({ error: "User not found" });
		}

		if (fromUser._id.equals(toUser._id)) {
			return res.status(400).json({ error: "You cannot add yourself" });
		}

		// Already friends
		if (
			toUser.friends.some(
				(f) => f.id.toString() === fromUser._id.toString()
			)
		) {
			return res.status(400).json({ error: "Already friends" });
		}

		const fromIdStr = fromUser._id.toString();
		const toIdStr = toUser._id.toString();

		// Auto-accept if reverse request exists
		const reverseRequest = fromUser.friendRequests.find(
			(r) => r.from.toString() === toIdStr
		);
		if (reverseRequest) {
			// Add each other as friends
			toUser.friends.push({ id: fromUser._id });
			fromUser.friends.push({ id: toUser._id });

			// Remove the reverse request
			fromUser.friendRequests = fromUser.friendRequests.filter(
				(r) => r.from.toString() !== toIdStr
			);

			await fromUser.save();
			await toUser.save();

			return res.json({ message: "Mutual friend request auto-accepted" });
		}

		// Check for duplicate request
		const alreadyRequested = toUser.friendRequests.find(
			(r) => r.from.toString() === fromIdStr
		);
		if (alreadyRequested) {
			return res
				.status(400)
				.json({ error: "Friend request already sent" });
		}

		toUser.friendRequests.push({ from: fromUser._id });
		await toUser.save();

		fromUser.lastActive = new Date();
		await fromUser.save();

		res.json({
			message: "Friend request sent",
			pendingRequests: toUser.friendRequests.length,
		});
	} catch (err) {
		console.error("Friend request error:", err);
		res.status(500).json({ error: "Something went wrong" });
	}
});

// GET /api/friends/requests
// see pending incoming requests
router.get("/requests", authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.user.userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const requests = user.friendRequests || [];

		// Extract sender ObjectIds
		const senderIds = requests.map((r) => r.from);

		// Fetch sender details
		const senders = await User.find({
			_id: { $in: senderIds },
		}).select("_id username displayName");

		// Map and merge sender info with request metadata
		const enriched = senders.map((sender) => {
			const reqMeta = requests.find(
				(r) => r.from.toString() === sender._id.toString()
			);
			return {
				id: sender._id,
				username: sender.username,
				displayName: sender.displayName,
			};
		});

		res.json({ pending: enriched });
	} catch (err) {
		console.error("Fetch friend requests error:", err);
		res.status(500).json({ error: "Something went wrong" });
	}
});

// POST /api/friends/accept
// accept a request
router.post("/accept", authenticateToken, async (req, res) => {
	try {
		const { fromId } = req.body;
		const toId = req.user.userId;

		if (!fromId) {
			return res.status(400).json({ error: "fromId required" });
		}

		//  Validate ObjectId format
		if (!mongoose.Types.ObjectId.isValid(fromId)) {
			return res.status(400).json({ error: "Invalid fromId format" });
		}

		const toUser = await User.findById(toId);
		const fromUser = await User.findById(fromId);

		if (!toUser || !fromUser) {
			return res.status(404).json({ error: "User not found" });
		}

		const requestIndex = toUser.friendRequests.findIndex(
			(r) => r.from.toString() === fromId
		);
		if (requestIndex === -1) {
			return res.status(400).json({ error: "No such friend request" });
		}

		if (!toUser.friends.some((f) => f.id.toString() === fromId)) {
			toUser.friends.push({ id: fromId });
		}
		if (!fromUser.friends.some((f) => f.id.toString() === toId)) {
			fromUser.friends.push({ id: toId });
		}

		toUser.friendRequests.splice(requestIndex, 1);

		await toUser.save();
		await fromUser.save();

		res.json({ message: "Friend request accepted" });
	} catch (err) {
		console.error("Accept friend request error:", err);
		res.status(500).json({ error: "Something went wrong" });
	}
});

// POST /api/friends/reject
// reject someone's request(after checking from the /requests)
router.post("/reject", authenticateToken, async (req, res) => {
	try {
		const { fromId } = req.body;
		const toId = req.user.userId;

		if (!fromId) {
			return res.status(400).json({ error: "fromId required" });
		}
		if (!mongoose.Types.ObjectId.isValid(fromId)) {
			return res.status(400).json({ error: "Invalid fromId format" });
		}

		const toUser = await User.findById(toId);
		if (!toUser) {
			return res.status(404).json({ error: "User not found" });
		}

		const requestIndex = toUser.friendRequests.findIndex(
			(r) => r.from.toString() === fromId
		);

		if (requestIndex === -1) {
			return res.status(400).json({ error: "No such friend request" });
		}

		toUser.friendRequests.splice(requestIndex, 1);
		await toUser.save();

		res.json({ message: "Friend request rejected" });
	} catch (err) {
		console.error("Reject friend request error:", err);
		res.status(500).json({ error: "Something went wrong" });
	}
});

// GET /api/friends/sent-requests
// see the sent requests
router.get("/sent-requests", authenticateToken, async (req, res) => {
	try {
		const currentUser = await User.findById(req.user.userId);
		if (!currentUser) {
			return res.status(404).json({ error: "User not found" });
		}

		// Find users who have this user in their friendRequests array
		const sentRequests = await User.find({
			"friendRequests.from": currentUser._id,
		}).select("_id username displayName friendRequests");

		// Extract timestamp and match against currentUser ID
		const enriched = sentRequests.map((user) => {
			const request = user.friendRequests.find(
				(r) => r.from.toString() === currentUser._id.toString()
			);

			return {
				id: user._id,
				username: user.username,
				displayName: user.displayName,
			};
		});

		res.json({ sent: enriched });
	} catch (err) {
		console.error("Fetch sent requests error:", err);
		res.status(500).json({ error: "Something went wrong" });
	}
});

// POST /api/friends/cancel
// cancel a request that you have sent(after checking from the /sent-requests)
router.post("/cancel", authenticateToken, async (req, res) => {
	try {
		const { toId } = req.body;
		const fromId = req.user.userId;

		if (!toId) {
			return res.status(400).json({ error: "toId required" });
		}
		if (!mongoose.Types.ObjectId.isValid(toId)) {
			return res.status(400).json({ error: "Invalid toId format" });
		}

		const toUser = await User.findById(toId);
		if (!toUser) {
			return res.status(404).json({ error: "User not found" });
		}

		const requestIndex = toUser.friendRequests.findIndex(
			(r) => r.from.toString() === fromId
		);

		if (requestIndex === -1) {
			return res.status(400).json({ error: "No such sent request" });
		}

		toUser.friendRequests.splice(requestIndex, 1);
		await toUser.save();

		res.json({ message: "Friend request cancelled" });
	} catch (err) {
		console.error("Cancel friend request error:", err);
		res.status(500).json({ error: "Something went wrong" });
	}
});

// POST /api/friends/remove
// remove a friend
router.post("/remove", authenticateToken, async (req, res) => {
	try {
		const { friendId } = req.body;
		const userId = req.user.userId;

		if (!friendId) {
			return res.status(400).json({ error: "friendId required" });
		}
		if (!mongoose.Types.ObjectId.isValid(friendId)) {
			return res.status(400).json({ error: "Invalid friendId format" });
		}

		const user = await User.findById(userId);
		const friend = await User.findById(friendId);

		if (!user || !friend) {
			return res.status(404).json({ error: "User not found" });
		}

		//bug-fix
		const isFriend =
			user.friends.some((f) => f.id.toString() === friendId) &&
			friend.friends.some((f) => f.id.toString() === userId);

		if (!isFriend) {
			return res.status(400).json({ error: "Users are not friends" });
		}

		user.friends = user.friends.filter((f) => f.id.toString() !== friendId);
		friend.friends = friend.friends.filter(
			(f) => f.id.toString() !== userId
		);

		await user.save();
		await friend.save();

		res.json({ message: "Friend removed" });
	} catch (err) {
		console.error("Remove friend error:", err);
		res.status(500).json({ error: "Something went wrong" });
	}
});

// GET /api/friends/list
// list of all the friends
router.get("/list", authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.user.userId);

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const friendIds = user.friends.map((f) => f.id);

		const friendsRaw = await User.find({
			_id: { $in: friendIds },
		}).select("_id username displayName");

		const enrichedFriends = friendsRaw.map((f) => ({
			id: f._id,
			username: f.username,
			displayName: f.displayName,
		}));

		res.json({ friends: enrichedFriends });
	} catch (err) {
		console.error("Fetch friends error:", err);
		res.status(500).json({ error: "Something went wrong" });
	}
});

module.exports = router;
