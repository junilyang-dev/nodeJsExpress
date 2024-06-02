// HTTP 모듈을 임포트합니다. 이 모듈은 Node.js의 내장 모듈로서 HTTP 서버를 생성하는 데 사용됩니다.
import http from "http";

// Socket.IO 라이브러리를 임포트합니다. 이 라이브러리는 웹소켓 기능을 제공하여 실시간, 양방향 통신을 가능하게 합니다.
import SocketIO from "socket.io";

// Express 모듈을 임포트합니다. Express는 Node.js를 위한 미니멀하고 유연한 웹 애플리케이션 프레임워크입니다.
import express from "express";

// Express 애플리케이션 객체를 생성합니다.
const app = express();

// Pug 엔진을 사용하여 뷰를 렌더링하기 위한 설정을 합니다. Pug는 템플릿 엔진으로 HTML을 보다 간편하게 작성할 수 있게 돕습니다.
app.set("view engine", "pug");

// Pug 템플릿 파일들이 위치할 경로를 설정합니다.
app.set("views", __dirname + "/views");

// 정적 파일(예: 스타일시트, 스크립트, 이미지 등)을 제공하기 위한 미들웨어를 설정합니다. 이 경로에 있는 파일들은 클라이언트에게 직접 접근 가능합니다.
app.use("/public", express.static(__dirname + "/public"));

// 루트 URL ('/')에 대한 GET 요청을 처리합니다. 요청이 들어오면 'homeVideo'라는 이름의 Pug 템플릿을 렌더링하여 반환합니다.
app.get("/", (req, res) => res.render("homeVideo"));

// 정의되지 않은 모든 경로에 대해 루트 URL로 리다이렉트합니다.
app.get("/*", (req, res) => res.redirect("/"));

// HTTP 서버를 생성하고, 이 서버를 통해 Express 앱을 실행합니다.
const httpServer = http.createServer(app);
// 생성된 HTTP 서버 위에 WebSocket 서버를 구축합니다. 이렇게 함으로써 HTTP와 WebSocket 요청을 동일한 포트에서 처리할 수 있습니다.
const wsServer = SocketIO(httpServer);

function conutRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

// WebSocket 서버의 'connection' 이벤트를 리스닝합니다.
// 이 이벤트는 새 클라이언트가 서버에 연결될 때 마다 트리거됩니다.
wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anon";
  // 연결된 클라이언트의 소켓에 대하여 'join_room' 이벤트를 리스닝합니다.
  // 클라이언트가 특정 방에 참여하고자 할 때 이 이벤트가 발생합니다.
  socket.on("join_room", (roomName,nickName) => {
    socket["nickname"] = nickName;
    // 클라이언트 소켓을 roomName 변수로 명시된 방에 추가합니다.
    socket.join(roomName);
    // 방금 참여한 방에 있는 다른 클라이언트들에게 'welcome' 이벤트를 발송합니다.
    // 이 이벤트는 새로운 사용자의 입장을 다른 참여자들에게 알립니다.
    socket.to(roomName).emit("welcome", conutRoom(roomName), updateStatus());
  });
  // 'offer' 이벤트를 리스닝합니다. 이 이벤트는 WebRTC 연결 초기화 과정 중 하나의 클라이언트가 다른 클라이언트에게 연결을 제안할 때 발생합니다.
  socket.on("offer", (offer, roomName) => {
    // socket.to 함수를 사용하여 특정 방에 있는 다른 클라이언트들에게 'offer' 이벤트를 전송합니다.
    // 이 때, 첫 번째 클라이언트가 생성한 오퍼(offer) 데이터도 함께 전송됩니다.
    socket.to(roomName).emit("offer", offer);
  });
  // WebSocket에서 'answer' 이벤트를 수신하는 리스너를 설정합니다.
  // 이 이벤트는 한 피어가 연결 제안(offer)에 응답하여 생성한 SDP 답변을 포함하고 있습니다.
  socket.on("answer", (answer, roomName) => {
    // socket.to(roomName) 메소드를 사용하여 특정 방(roomName)에 있는 다른 클라이언트들에게
    // 'answer' 이벤트를 전송합니다. 이때, 전송되는 데이터로는 SDP 답변(answer)이 포함됩니다.
    // 이는 해당 방의 다른 참가자들이 SDP 답변을 받아 연결 설정을 완료할 수 있도록 합니다.
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", (ice, roomName, nickName) => {
    socket.to(roomName).emit("ice", ice, nickName, conutRoom(roomName));
  });
  // 새 메시지 전송 이벤트를 처리합니다.
  socket.on("new_message", (msg, roomName) => {
    socket.to(roomName).emit("new_message", `${socket.nickname}: ${msg}`);
  });
});

function updateStatus() {
  const status = countAll();
  const roomsDetail = Object.entries(status.rooms).map(([roomName, count]) => `${roomName} (${count})`);

  wsServer.sockets.emit("status_update", {
    total: status.total,
    rooms: Object.keys(status.rooms).length,
    out: status.out,
    roomDetail: roomsDetail,
  });
}

function countAll() {
  const adapter = wsServer.sockets.adapter;

  // 전체 접속자 수: 모든 소켓의 개수
  const total = adapter.sids.size;

  // 방 개수 및 각 방에 있는 사람 수
  const roomsInfo = {};
  adapter.rooms.forEach((sockets, roomName) => {
    // 각 방에 소켓 ID가 방 이름과 동일하지 않으면, 그 방은 실제 채팅방입니다.
    if (sockets.size > 0 && adapter.sids.has(roomName) === false) {
      roomsInfo[roomName] = sockets.size;
    }
  });

  // 대기 접속자 수 계산: 방에 속하지 않은 소켓의 수
  let out = 0;
  adapter.sids.forEach((rooms, socketId) => {
    if (rooms.size === 1) { // 소켓이 자신의 ID로된 방에만 속해 있다면, 대기 중으로 간주
      out++;
    }
  });

  // 결과 객체 구성
  var test = {
    total: total, // 전체 접속자 수
    rooms: roomsInfo, // 각 방의 이름과 그 방의 소켓 수
    out: out // 대기 중인 소켓 수
  };

  return test;
}

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

