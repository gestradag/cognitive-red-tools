require("dotenv").config();

const http = require("http");
const express = require("express");
const request = require("request");
const path = require("path");
const RED = require("node-red");
const githubAuth = require("node-red-auth-github");

require("dotenv").config();

// Create an Express app
const app = express();

// Create a server
const server = http.createServer(app);

const {
  PORT,
  GITHUB_USERNAME,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  PROJECT_DOMAIN,
  KEEP_ALIVE,
  VIEW_WITHOUT_LOGIN
} = process.env;

const baseURL = `https://${PROJECT_DOMAIN}.glitch.me/`;

const settings = {
  flowFile: path.resolve(__dirname, ".data/flowsStore.json"),
  userDir: path.resolve(__dirname, ".data/red-userdir/"),
  adminAuth: githubAuth({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    baseURL,
    users: [{ username: GITHUB_USERNAME, permissions: ["*"] }]
  }),
  httpNodeCors: {
    origin: "*",
    methods: "GET,PUT,POST,PATCH,DELETE"
  },
  httpAdminRoot: "/",
  httpNodeRoot: "/",
  nodesDir: path.resolve(__dirname, "nodes/"),
  uiPort: PORT
  // functionGlobalContext: { nodeEnv: { ...process.env } }, // DANGER: enables env to be passed to node-red
};

console.log(settings.flowFile);

if (VIEW_WITHOUT_LOGIN && JSON.parse(VIEW_WITHOUT_LOGIN))
  settings.adminAuth.default = { permissions: "read" };

const keepalive = () =>
  PROJECT_DOMAIN &&
  request({ url: `${baseURL}glitch-alive` }, () =>
    setTimeout(keepalive, 55000)
  );

RED.init(server, settings);
RED.start();

app.use("/", express.static("public"));
app.get("/glitch-alive", (req, res) => res.json({ isAlive: true }));
app.use(settings.httpAdminRoot, RED.httpAdmin);
app.use(settings.httpNodeRoot, RED.httpNode);

server.listen(
  PORT,
  KEEP_ALIVE && JSON.parse(KEEP_ALIVE) ? keepalive : () => void 0
);
