const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// User Schema
const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		minlength: 3,
		maxlength: 30,
		match: /^[a-zA-Z0-9_]+$/
	},
	email: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true
	},
	password: {
		type: String,
		required: true,
		minlength: 6
	},
	displayName: {
		type: String,
		required: true,
		trim: true,
		maxlength: 50
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

const User = mongoose.model('User', userSchema);

// JWT middleware for protected routes
const authenticateToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({ error: 'Access token required' });
	}

	jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
		if (err) {
			return res.status(403).json({ error: 'Invalid token' });
		}
		req.user = user;
		next();
	});
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
	try {
		const { username, email, password, displayName } = req.body;

		// Basic validation
		if (!username || !email || !password || !displayName) {
			return res.status(400).json({ error: 'All fields are required' });
		}

		if (password.length < 6) {
			return res.status(400).json({ error: 'Password must be at least 6 characters' });
		}

		// Check if user already exists
		const existingUser = await User.findOne({
			$or: [{ email }, { username }]
		});

		if (existingUser) {
			return res.status(400).json({ 
				error: existingUser.email === email ? 'Email already exists' : 'Username already exists'
			});
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create user
		const user = new User({
			username,
			email,
			password: hashedPassword,
			displayName
		});

		await user.save();

		// Generate JWT token
		const token = jwt.sign(
			{ userId: user._id, username: user.username },
			process.env.JWT_SECRET,
			{ expiresIn: '7d' }
		);

		res.status(201).json({
			message: 'User created successfully',
			token,
			user: {
				id: user._id,
				username: user.username,
				displayName: user.displayName,
				email: user.email
			}
		});

	} catch (error) {
		console.error('Registration error:', error);
		res.status(500).json({ error: 'Registration failed' });
	}
});

app.post('/api/auth/login', async (req, res) => {
	try {
		const { login, password } = req.body;

		if (!login || !password) {
			return res.status(400).json({ error: 'Login and password are required' });
		}

		// Find user by username or email
		const user = await User.findOne({
			$or: [
				{ username: login },
				{ email: login.toLowerCase() }
			]
		});

		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		
		// Check password
		if (!user.password) {
			return res.status(500).json({ error: 'User has no password set' });
		  }
		  
		  const isValidPassword = await bcrypt.compare(password, user.password);
		  
		  if (!isValidPassword) {
			return res.status(401).json({ error: 'Invalid credentials' });
		  }
		  

		// Generate JWT token
		const token = jwt.sign(
			{ userId: user._id, username: user.username },
			process.env.JWT_SECRET,
			{ expiresIn: '7d' }
		);

		res.json({
			message: 'Login successful',
			token,
			user: {
				id: user._id,
				username: user.username,
				displayName: user.displayName,
				email: user.email
			}
		});

	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ error: 'Login failed' });
	}
});

// Test protected route
app.get('/api/test-auth', authenticateToken, (req, res) => {
	res.json({
		message: 'Authentication working!',
		user: req.user
	});
});

// Your existing health check route
app.get("/health", (req, res) => {
	res.json({
		status: "Server is running!",
		timestamp: new Date().toISOString(),
		database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
	});
});

// MongoDB connection (your existing code)
const connectDB = async () => {
	try {
		console.log("Attempting to connect to MongoDB...");
		console.log("MongoDB URI:", process.env.MONGODB_URI ? "Set" : "Not set");

		await mongoose.connect(process.env.MONGODB_URI);
		console.log("MongoDB connected successfully");

		// Test the connection
		const collections = await mongoose.connection.db
			.listCollections()
			.toArray();
		console.log("Available collections:", collections.map((c) => c.name));
	} catch (error) {
		console.error("MongoDB connection failed:", error.message);
		console.error("Full error:", error);
		process.exit(1);
	}
};

// Connect to database
connectDB();

// Handle MongoDB connection events
mongoose.connection.on("connected", () => {
	console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
	console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
	console.log("Mongoose disconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
	console.log("\nReceived SIGINT. Graceful shutdown...");
	await mongoose.connection.close();
	console.log("MongoDB connection closed.");
	process.exit(0);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	console.log(`Health check: http://localhost:${PORT}/health`);
	console.log(`Test auth: http://localhost:${PORT}/api/test-auth`);
});

module.exports = app;