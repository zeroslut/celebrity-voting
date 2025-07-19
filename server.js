const express = require('express');
const fs = require('fs');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(session({
  secret: 'your_secret',
  resave: false,
  saveUninitialized: true
}));

const ADMIN_USER = { username: 'theomwoyo', password: 'idahadah.18' };

// Load data
let data = JSON.parse(fs.readFileSync('data.json'));

// Admin login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
    req.session.user = 'admin';
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Unauthorized' });
});

// Upload new celebrity (admin only)
app.post('/upload', (req, res) => {
  if (req.session.user !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { name, image, instagram } = req.body;
  data.celebrities.push({ name, image, instagram, votes: 0 });
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
  res.json({ success: true });
});

// Vote once per IP per day
const ipVotes = {};

app.post('/vote', (req, res) => {
  const ip = req.ip;
  const today = new Date().toISOString().split('T')[0];
  if (ipVotes[ip] === today) {
    return res.status(403).json({ error: 'Already voted today' });
  }

  const { name } = req.body;
  const celeb = data.celebrities.find(c => c.name === name);
  if (!celeb) return res.status(404).json({ error: 'Celebrity not found' });

  celeb.votes += 1;
  ipVotes[ip] = today;
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
  res.json({ success: true });
});

// Get current voting data
app.get('/celebrities', (req, res) => {
  res.json(data.celebrities);
});

// Fallback for index.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
