const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const cors = require("cors")
const app = express()
const PORT = 5000

// JWT secret key - in production, use environment variables
const JWT_SECRET = "suimon-secret-key-change-in-production"
const TOKEN_EXPIRY = "7d" // Token expires in 7 days

// Middleware
app.use(bodyParser.json())
app.use(cors())

// MongoDB connection
mongoose
  .connect(
    "mongodb+srv://2022dhruvmaurya:xBNf47tLMTYc4p6x@cluster0.1lwzynq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  )
  .then(() => {
    console.log("MongoDB connected")
  })
  .catch((err) => console.error("MongoDB connection error:", err))

// XP Constants for level calculation
const XP_LEVELS = [
  { level: 1, xpRequired: 0, reward: "Basic Card Pack" },
  { level: 2, xpRequired: 25, reward: "1 Rare Card" },
  { level: 3, xpRequired: 75, reward: "Standard Card Pack" },
  { level: 4, xpRequired: 150, reward: "2 Rare Cards" },
  { level: 5, xpRequired: 300, reward: "Elite Card Pack" },
  { level: 6, xpRequired: 500, reward: "1 Ultra Rare Card" },
  { level: 7, xpRequired: 750, reward: "Premium Card Pack" },
  { level: 8, xpRequired: 1000, reward: "2 Ultra Rare Cards" },
  { level: 9, xpRequired: 1500, reward: "Master Card Pack" },
  { level: 10, xpRequired: 2500, reward: "Legendary Card" },
]

// Calculate level from XP
const calculateLevelFromXP = (xp) => {
  let playerLevel = 1
  let nextLevelXp = 0
  let reward = ""

  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xpRequired) {
      playerLevel = XP_LEVELS[i].level
      nextLevelXp = i < XP_LEVELS.length - 1 ? XP_LEVELS[i + 1].xpRequired : null
      reward = XP_LEVELS[i].reward
      break
    }
  }

  return {
    level: playerLevel,
    nextLevelXp: nextLevelXp !== null ? nextLevelXp - xp : "MAX",
    reward,
  }
}

// Enhanced User Schema with authentication fields and game stats
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  wallet: { type: String, unique: true, sparse: true }, // sparse allows null values to not trigger uniqueness
  createdAt: { type: Date, default: Date.now },
  // Game stats
  xp: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  matchWins: { type: Number, default: 0 },
  matchLosses: { type: Number, default: 0 },
  lastPlayed: { type: Date },
  creatures: [
    {
      id: String,
      name: String,
      experience: Number,
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      elementType: String,
    },
  ],
})

const User = mongoose.model("User", userSchema)

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." })
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET)
    req.user = verified
    next()
  } catch (error) {
    res.status(403).json({ message: "Invalid token" })
  }
}

// ROUTES

// Signup endpoint
app.post("/api/auth/signup", async (req, res) => {
  const { username, email, password, walletAddress } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Missing required fields" })
  }

  try {
    // Check if user already exists
    const emailExists = await User.findOne({ email })
    if (emailExists) {
      return res.status(409).json({ message: "Email already exists" })
    }

    const usernameExists = await User.findOne({ username })
    if (usernameExists) {
      return res.status(409).json({ message: "Username already exists" })
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      wallet: walletAddress || null,
      xp: 0,
      wins: 0,
      losses: 0,
    })

    // Save user to database
    const savedUser = await user.save()

    // Create and assign token
    const token = jwt.sign({ id: savedUser._id, username: savedUser.username, email: savedUser.email }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
    })

    // Return user data (excluding password)
    res.status(201).json({
      id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      walletAddress: savedUser.wallet,
      xp: savedUser.xp,
      wins: savedUser.wins,
      losses: savedUser.losses,
      token,
      createdAt: savedUser.createdAt,
    })
  } catch (error) {
    console.error("Signup error:", error)
    res.status(500).json({ message: "Server error during signup" })
  }
})

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: "Missing email or password" })
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Create and assign token
    const token = jwt.sign({ id: user._id, username: user.username, email: user.email }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
    })

    // Return user data
    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      walletAddress: user.wallet,
      xp: user.xp,
      wins: user.wins,
      losses: user.losses,
      token,
      createdAt: user.createdAt,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error during login" })
  }
})

// Verify token endpoint
app.post("/api/auth/verify", authenticateToken, (req, res) => {
  // If middleware passes, token is valid
  res.status(200).json({ valid: true, user: req.user })
})

// Update wallet address endpoint
app.post("/api/auth/update-wallet", authenticateToken, async (req, res) => {
  const { walletAddress } = req.body
  const userId = req.user.id

  if (!walletAddress) {
    return res.status(400).json({ message: "Wallet address is required" })
  }

  try {
    // Check if wallet is already in use
    const walletExists = await User.findOne({ wallet: walletAddress })
    if (walletExists && walletExists._id.toString() !== userId) {
      return res.status(409).json({ message: "Wallet address already linked to another account" })
    }

    // Update user's wallet
    const updatedUser = await User.findByIdAndUpdate(userId, { wallet: walletAddress }, { new: true })

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({
      success: true,
      walletAddress: updatedUser.wallet,
    })
  } catch (error) {
    console.error("Update wallet error:", error)
    res.status(500).json({ message: "Server error during wallet update" })
  }
})

// Get user profile endpoint
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Calculate level info
    const levelInfo = calculateLevelFromXP(user.xp)

    // Add level info to response
    const userWithLevel = {
      ...user.toObject(),
      level: levelInfo.level,
      nextLevelXp: levelInfo.nextLevelXp,
      reward: levelInfo.reward,
    }

    res.status(200).json(userWithLevel)
  } catch (error) {
    console.error("Profile fetch error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update game stats endpoint
app.post("/api/game/update-stats", authenticateToken, async (req, res) => {
  const { xpGained, win, matchWin, creatureId, creatureName, elementType } = req.body
  const userId = req.user.id

  try {
    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update user stats
    user.xp += xpGained || 0

    if (win === true) {
      user.wins += 1
    } else if (win === false) {
      user.losses += 1
    }

    if (matchWin === true) {
      user.matchWins += 1
    } else if (matchWin === false) {
      user.matchLosses += 1
    }

    user.lastPlayed = new Date()

    // Update creature stats if provided
    if (creatureId) {
      const existingCreature = user.creatures.find((c) => c.id === creatureId)

      if (existingCreature) {
        existingCreature.experience += xpGained || 0
        if (win === true) existingCreature.wins += 1
        if (win === false) existingCreature.losses += 1
      } else if (creatureName) {
        // Add new creature
        user.creatures.push({
          id: creatureId,
          name: creatureName,
          experience: xpGained || 0,
          wins: win === true ? 1 : 0,
          losses: win === false ? 1 : 0,
          elementType: elementType || "normal",
        })
      }
    }

    // Calculate level info
    const levelInfo = calculateLevelFromXP(user.xp)

    // Save user
    await user.save()

    // Return updated stats
    res.status(200).json({
      success: true,
      stats: {
        xp: user.xp,
        wins: user.wins,
        losses: user.losses,
        matchWins: user.matchWins,
        matchLosses: user.matchLosses,
        level: levelInfo.level,
        nextLevelXp: levelInfo.nextLevelXp,
        reward: levelInfo.reward,
      },
    })
  } catch (error) {
    console.error("Update stats error:", error)
    res.status(500).json({ message: "Server error during stats update" })
  }
})

// Reset stats endpoint
app.post("/api/game/reset-stats", authenticateToken, async (req, res) => {
  const userId = req.user.id

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        xp: 0,
        wins: 0,
        losses: 0,
        matchWins: 0,
        matchLosses: 0,
        creatures: [],
      },
      { new: true },
    )

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({
      success: true,
      message: "Stats reset successfully",
    })
  } catch (error) {
    console.error("Reset stats error:", error)
    res.status(500).json({ message: "Server error during stats reset" })
  }
})

// Get leaderboard endpoint
app.get("/api/game/leaderboard", async (req, res) => {
  try {
    // Get all users with their stats, excluding sensitive info
    const users = await User.find({})
      .select("username wallet xp wins losses matchWins matchLosses creatures lastPlayed")
      .sort({ xp: -1 }) // Sort by XP descending
      .limit(100) // Limit to top 100 players

    // Format the response
    const leaderboard = users.map((user) => {
      const levelInfo = calculateLevelFromXP(user.xp)

      return {
        id: user._id,
        username: user.username,
        walletAddress: user.wallet,
        xp: user.xp,
        wins: user.wins,
        losses: user.losses,
        matchWins: user.matchWins,
        matchLosses: user.matchLosses,
        level: levelInfo.level,
        nextLevelXp: levelInfo.nextLevelXp,
        reward: levelInfo.reward,
        winRate: user.wins + user.losses > 0 ? ((user.wins / (user.wins + user.losses)) * 100).toFixed(1) : "0.0",
        creatureCount: user.creatures.length,
        lastPlayed: user.lastPlayed,
      }
    })

    res.status(200).json(leaderboard)
  } catch (error) {
    console.error("Leaderboard fetch error:", error)
    res.status(500).json({ message: "Server error fetching leaderboard" })
  }
})

// Get creature leaderboard endpoint
app.get("/api/game/creature-leaderboard", async (req, res) => {
  try {
    // Aggregate all creatures from all users
    const users = await User.find({ "creatures.0": { $exists: true } }).select("username wallet creatures")

    // Extract all creatures and add owner info
    let allCreatures = []
    users.forEach((user) => {
      const userCreatures = user.creatures.map((creature) => ({
        ...creature.toObject(),
        ownerUsername: user.username,
        ownerWallet: user.wallet,
      }))
      allCreatures = [...allCreatures, ...userCreatures]
    })

    // Sort by experience
    allCreatures.sort((a, b) => b.experience - a.experience)

    // Limit to top 100
    const topCreatures = allCreatures.slice(0, 100)

    res.status(200).json(topCreatures)
  } catch (error) {
    console.error("Creature leaderboard fetch error:", error)
    res.status(500).json({ message: "Server error fetching creature leaderboard" })
  }
})

// Legacy endpoints (keeping for backward compatibility)
app.post("/user", async (req, res) => {
  const { username, wallet } = req.body
  if (!username || !wallet) return res.status(400).json({ message: "Missing fields" })
  try {
    const newUser = new User({
      username,
      wallet,
      email: `${username}@example.com`, // Placeholder email
      password: await bcrypt.hash("defaultPassword", 10), // Placeholder password
      xp: 0,
      wins: 0,
      losses: 0,
    })
    await newUser.save()
    res.status(201).json({ message: "User created", user: newUser })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Username or wallet already exists" })
    }
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).select("-password")
    res.status(200).json(users)
  } catch (err) {
    res.status(500).json({ message: "Server error" })
  }
})

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
