// controllers/userSearchController.js

const User = require('../models/User');

exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.query; // 'q' stands for query

        if (!q) {
            return res.json({ users: [] });
        }

        // Create a case-insensitive regular expression to find usernames that START WITH the query
        const searchRegex = new RegExp(`^${q}`, 'i');

        const users = await User.find({ username: searchRegex })
            .select('_id username displayName') // Only send back public, necessary data
            .limit(5); // Limit the results to 5

        res.json({ users });

    } catch (error) {
        console.error("User search error:", error);
        res.status(500).json({ error: "Failed to search for users" });
    }
};