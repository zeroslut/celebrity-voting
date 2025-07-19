const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_ID = "YOUR_INSTAGRAM_CLIENT_ID";
const CLIENT_SECRET = "YOUR_INSTAGRAM_CLIENT_SECRET";
const REDIRECT_URI = "http://localhost:3000/auth/instagram/callback";

let users = {};
let data = require("./data.json");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/login", (req, res) => {
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user_profile&response_type=code`;
  res.redirect(authUrl);
});

app.get("/auth/instagram/callback", async (req, res) => {
  const code = req.query.code;
  const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
      code
    })
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  const profileRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
  const profile = await profileRes.json();

  users[profile.id] = profile;
  res.redirect(`/index.html`);
});

app.get("/api/celebrities", (req, res) => {
  res.json(data);
});

app.post("/api/vote", (req, res) => {
  const { name } = req.body;
  const celeb = data.find(c => c.name === name);
  if (celeb) celeb.votes += 1;
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
  res.json({ success: true });
});

app.post("/api/upload", (req, res) => {
  const { name, img, insta, secret } = req.body;
  if (secret !== "admin123") return res.status(403).send("Unauthorized");

  data.push({ name, img, insta, votes: 0 });
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));