const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Register Route
router.post("/register", async (req, res) => {
	try {
		const { username, email, password, displayName } = req.body;

		if (!username || !email || !password || !displayName) {
			return res.status(400).json({ error: "All fields are required" });
		}

		if (password.length < 6) {
			return res
				.status(400)
				.json({ error: "Password must be at least 6 characters" });
		}

		const existingUser = await User.findOne({
			$or: [{ email }, { username }],
		});

		if (existingUser) {
			return res.status(400).json({
				error:
					existingUser.email === email
						? "Email already exists"
						: "Username already exists",
			});
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = new User({
			username,
			email,
			password: hashedPassword,
			displayName,
		});

		await user.save();

		const token = jwt.sign(
			{ userId: user._id, username: user.username },
			process.env.JWT_SECRET,
			{ expiresIn: "7d" }
		);

		res.status(201).json({
			message: "User created successfully",
			token,
			user: {
				id: user._id,
				username: user.username,
				displayName: user.displayName,
				email: user.email,
			},
		});
	} catch (error) {
		console.error("Registration error:", error);
		res.status(500).json({ error: "Registration failed" });
	}
});

// Login Route
router.post("/login", async (req, res) => {
	try {
		const { login, password } = req.body;

		if (!login || !password) {
			return res
				.status(400)
				.json({ error: "Login and password are required" });
		}

		const user = await User.findOne({
			$or: [{ username: login }, { email: login.toLowerCase() }],
		});

		if (!user) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		if (!user.password) {
			return res.status(500).json({ error: "User has no password set" });
		}

		const isValidPassword = await bcrypt.compare(password, user.password);

		if (!isValidPassword) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const token = jwt.sign(
			{ userId: user._id, username: user.username },
			process.env.JWT_SECRET,
			{ expiresIn: "7d" }
		);

		res.json({
			message: "Login successful",
			token,
			user: {
				id: user._id,
				username: user.username,
				displayName: user.displayName,
				email: user.email,
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Login failed" });
	}
});

module.exports = router;
