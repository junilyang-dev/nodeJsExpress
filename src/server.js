// HTTP와 WebSocket 모듈 가져오기
import http from 'http';
import webSocket from 'ws';

// Express 모듈 가져오기
import express from "express";

// Express 애플리케이션 초기화
const app = express();

// Pug 템플릿 엔진을 설정
app.set("view engine", "pug");

// Pug 템플릿 파일의 위치를 설정
app.set("views", __dirname + "/views");

// '/public' 경로로 정적 파일 제공
app.use("/public", express.static(__dirname + "/public"));

// 루트 경로에 접근 시 home.pug 렌더링
app.get("/", (req, res) => res.render("home"));

// 정의되지 않은 모든 경로를 루트로 리다이렉트
app.get("/*", (req, res) => res.redirect("/"));

// 서버가 시작될 때 콘솔에 메시지 출력
const handleListen = () => console.log(`Listening on http://localhost:3000`);

// HTTP 서버를 Express 앱과 함께 생성
const server = http.createServer(app);

// WebSocket 서버를 HTTP 서버와 함께 초기화
const wss = new webSocket.Server({ server });

// onSocketClose 함수 정의: 특별한 매개변수는 받지 않습니다.
function onSocketClose() {
  // 콘솔에 "Disconnected from the Browser ❌" 메시지를 출력합니다.
  // 이 로그는 웹소켓 연결이 끊겼을 때 서버 콘솔에 표시되어, 연결 상태를 모니터링하는데 도움을 줍니다.
  console.log("Disconnected from the Browser ❌");
}

// 'sockets'라는 이름의 빈 배열을 생성합니다. 
// 이 배열은 웹소켓 연결들을 저장하는 용도로 사용됩니다.
// 각 웹소켓 연결이 열릴 때마다 이 배열에 소켓 객체가 추가됩니다.
const sockets = [];

// handleConnection 함수 정의: 웹소켓 연결 객체(socket)를 매개변수로 받습니다.
function handleConnection(socket){
  // 연결된 소켓을 sockets 배열에 추가합니다.
  sockets.push(socket);
  // 새로 연결된 소켓에 기본적으로 "Anon"이라는 닉네임을 할당합니다.
  socket["nickname"] = "Anon";
  // 콘솔에 연결 성공 메시지를 출력합니다.
  console.log("Connected to Browser ✅");
  // 소켓이 닫힐 때 실행될 함수(onSocketClose)를 등록합니다.
  socket.on("close", onSocketClose);
  // 소켓에서 메시지를 받았을 때의 처리를 정의합니다.
  socket.on("message", (msg) => {
    // 받은 메시지(msg)를 JSON 객체로 파싱합니다.
    const message = JSON.parse(msg);
    // 메시지 유형에 따라 적절한 조치를 취합니다.
    switch (message.type) {
      // 새 메시지를 받았을 경우
      case "new_message":
        // 모든 연결된 소켓(sockets 배열의 각 aSocket)에게 이 메시지를 전송합니다.
        // 메시지 포맷: "<닉네임>: <메시지 내용>"
        sockets.forEach(aSocket => aSocket.send(`${socket.nickname} : ${message.payload}`));
        break; // switch 문에서 break를 빠트리면 다음 case로 계속 진행됩니다.
      // 닉네임 설정 메시지를 받았을 경우
      case "nickname":
        // 메시지에서 전달된 닉네임(payload)을 해당 소켓의 "nickname" 속성에 저장합니다.
        socket["nickname"] = message.payload;
        break; // 각 case마다 break를 추가하여 명확하게 처리 구분을 해줘야 합니다.
    }
  });
}

// WebSocket 서버에 연결 이벤트 리스너 등록
wss.on("connection", handleConnection);

// 서버를 포트 3000에서 시작
server.listen(3000, handleListen);