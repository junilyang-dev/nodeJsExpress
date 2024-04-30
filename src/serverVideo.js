import http from "http";

import SocketIO from "socket.io";

import express from "express";

const app = express();

app.set("view engine", "pug");

app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("homeVideo"));

app.get("/*", (req, res) => res.redirect("/"));

// 서버가 시작될 때 콘솔에 메시지 출
const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);