const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const app = express()
const PORT = 5000

app.use(bodyParser.json())

mongoose.connect('mongodb+srv://2022dhruvmaurya:xBNf47tLMTYc4p6x@cluster0.1lwzynq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('MongoDB connected')
  })
  .catch(err => console.error(err))

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  wallet: { type: String, unique: true, required: true }
})

const User = mongoose.model('User', userSchema)

app.post('/user', async (req, res) => {
  const { username, wallet } = req.body
  if (!username || !wallet) return res.status(400).json({ message: 'Missing fields' })
  try {
    const newUser = new User({ username, wallet })
    await newUser.save()
    res.status(201).json({ message: 'User created', user: newUser })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Username or wallet already exists' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

app.get('/users', async (req, res) => {
  try {
    const users = await User.find({})
    res.status(200).json(users)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
