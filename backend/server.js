const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const friendsRouter = require("./routes/friends");
const contentRoutes = require("./routes/content");
const { authenticateToken } = require("./middlewares/auth");
const User = require("./models/User");

require("dotenv").config();



const app = express();

// Middleware


app.use(cors());
app.use(express.json());
app.use("/api/content", contentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/friends", friendsRouter);

// Test protected route
app.get("/api/test-auth", authenticateToken, (req, res) => {
	res.json({
		message: "Authentication working!",
		user: req.user,
	});
});

// Health check route
app.get("/health", (req, res) => {
	res.json({
		status: "Server is running!",
		timestamp: new Date().toISOString(),
		database:
			mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
	});
});


// MongoDB connection
const connectDB = async () => {
	try {
		console.log("Attempting to connect to MongoDB...");
		console.log(
			"MongoDB URI:",
			process.env.MONGODB_URI ? "Set" : "Not set"
		);

		await mongoose.connect(process.env.MONGODB_URI);
		console.log("MongoDB connected successfully");

		// List collections
		const collections = await mongoose.connection.db
			.listCollections()
			.toArray();
		console.log(
			"Available collections:",
			collections.map((c) => c.name)
		);
	} catch (error) {
		console.error("MongoDB connection failed:", error.message);
		console.error("Full error:", error);
		process.exit(1);
	}
};

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
