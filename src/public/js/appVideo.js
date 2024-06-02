// Socket.IO 클라이언트 라이브러리를 통해 서버에 연결하는 소켓 객체를 생성합니다.
const socket = io();

// HTML 문서에서 video 요소를 선택하여 myFace 변state수에 저장합니다.
const myFace = document.getElementById("myFace");
// HTML 문서에서 음소거 버튼을 선택하여 muteBtn 변수에 저장합니다.
const muteBtn = document.getElementById("mute");
// HTML 문서에서 카메라 버튼을 선택하여 cameraBtn 변수에 저장합니다.
const cameraBtn = document.getElementById("camera");
// HTML 문서에서 ID가 'cameras'인 요소를 찾아 camerasSelect 변수에 저장합니다.
const camerasSelect = document.getElementById("cameras");

// 'welcome' 아이디를 가진 HTML 요소를 찾아 welcome 변수에 저장합니다.
const welcome = document.getElementById("welcome");

// 'call' 아이디를 가진 HTML 요소를 찾아 call 변수에 저장합니다.
const call = document.getElementById("call");

// call 요소를 화면에서 숨깁니다. 이는 초기 상태에서 통화 관련 UI를 숨기기 위해 사용됩니다.
call.hidden = true;

// 미디어 스트림을 저장할 변수를 선언합니다.
let myStream;
// 음소거 상태를 저장할 변수를 선언하고, 초기값은 false로 설정합니다. (음소거되지 않음)
let muted = false;
// 카메라 상태를 저장할 변수를 선언하고, 초기값은 false로 설정합니다. (카메라가 켜져 있음)
let cameraOff = false;
// roomName 변수를 선언하고 초기에는 undefined로 설정합니다.
// 이 변수는 나중에 채팅방 이름을 저장하는 데 사용될 수 있습니다.
let roomName;
let nickName;
// myPeerConnection 변수를 선언합니다. 이 변수는 나중에 RTCPeerConnection 객체의 인스턴스를 저장하는 데 사용될 수 있습니다.
// RTCPeerConnection은 WebRTC API의 일부로, 브라우저 간 피어 투 피어 연결을 설정하는 데 사용됩니다.
let myPeerConnection;
let myDataChannel;

// getCameras라는 비동기 함수를 정의합니다.
async function getCameras() {
  try {
    // 사용 가능한 모든 미디어 장치를 나열합니다.
    const devices = await navigator.mediaDevices.enumerateDevices();
    // 나열된 장치 중에서 비디오 입력 장치(카메라)만을 필터링합니다.
    const cameras = devices.filter(device => device.kind === "videoinput");
    // 현재 스트림에서 첫 번째 비디오 트랙을 가져옵니다. 이 트랙은 현재 사용 중인 카메라를 대표합니다.
    const currentCamera = myStream.getVideoTracks()[0];
    // 필터링된 카메라 리스트를 순회하면서 각 카메라에 대해 처리를 수행합니다.
    cameras.forEach((camera) => {
      // 새로운 'option' HTML 요소를 생성합니다.
      const option = document.createElement("option");
      // option 요소의 value 속성에 카메라의 deviceId를 설정합니다.
      option.value = camera.deviceId;
      // option 요소의 텍스트로 카메라의 라벨(이름)을 설정합니다.
      option.innerText = camera.label;
      // 현재 사용 중인 카메라와 일치하는 경우, 해당 option을 선택된 상태로 설정합니다.
      if(currentCamera.label == camera.label) {
        option.selected = true;
      }
      // 생성된 option 요소를 카메라 선택 드롭다운 메뉴에 추가합니다.
      camerasSelect.appendChild(option);
    });
  } catch(e) {
    // 오류가 발생하면 콘솔에 오류 메시지를 출력합니다.
    console.log(e);
  }
}


// 비동기 함수 getMedia를 정의합니다. 이 함수는 사용자의 비디오 및 오디오를 가져옵니다.
async function getMedia(deviceId) {
  // initialConstraints 객체는 비디오와 오디오 스트림에 대한 초기 요청 제약 조건을 지정합니다.
  const initialConstraints = {
      audio: true,  // 오디오 트랙을 요청합니다. true는 시스템 기본 마이크를 사용하도록 요청합니다.
      video: { facingMode: "user" }  // 비디오 트랙을 요청하며, 사용자(전면) 카메라를 사용하도록 지정합니다.
  };

  // cameraConstraints 객체는 특정 카메라를 선택할 때 사용되는 요청 제약 조건을 지정합니다.
  const cameraConstraints = {
      audio: true,  // 오디오 트랙을 요청합니다. 여기서도 기본 마이크를 사용하도록 요청합니다.
      video: { deviceId: { exact: deviceId } }  // 비디오 트랙을 요청하며, 특정 deviceId를 가진 카메라를 정확히 사용하도록 설정합니다.
      // deviceId는 카메라 선택 로직에 의해 결정된 특정 카메라의 고유 식별자입니다.
  };

  try {
    // navigator.mediaDevices.getUserMedia를 사용하여 비디오 및 오디오 스트림을 요청합니다.
    myStream = await navigator.mediaDevices.getUserMedia(deviceId ? cameraConstraints : initialConstraints);
    // 스트림 객체를 콘솔에 출력합니다.
    //console.log(myStream);
    // 가져온 미디어 스트림을 video 요소의 srcObject 속성에 할당하여 비디오를 표시합니다.
    myFace.srcObject = myStream;
    if (!deviceId){
      await getCameras();
    }
  } catch (e) {
    // 미디어 스트림을 가져오는 과정에서 오류가 발생하면 콘솔에 오류 메시지를 출력합니다.
    console.log(e);
  }
}

// 음소거 버튼 클릭 이벤트를 처리하는 함수를 정의합니다.
function handleMuteClick() {
  // myStream에서 오디오 트랙들을 가져와 각 트랙에 대해 반복 실행합니다.
  myStream.getAudioTracks().forEach((track) => 
      // 각 오디오 트랙의 enabled 상태를 현재의 반대로 설정합니다.
      // 즉, 트랙이 활성화되어 있으면 비활성화하고, 비활성화되어 있으면 활성화합니다.
      track.enabled = !track.enabled
  );

  if (!muted) {
    // 현재 음소거 상태가 아니라면 버튼의 텍스트를 "Unmute"로 변경하고, 음소거 상태를 true로 설정합니다.
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    // 현재 음소거 상태라면 버튼의 텍스트를 "Mute"로 변경하고, 음소거 상태를 false로 설정합니다.
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

// 카메라 버튼 클릭 이벤트를 처리하는 함수를 정의합니다.
function handleCameraClick() {
  // myStream에서 비디오 트랙들을 가져와 각 트랙에 대해 반복 실행합니다.
  myStream.getVideoTracks().forEach((track) => 
      // 각 비디오 트랙의 enabled 상태를 현재의 반대로 설정합니다.
      // 즉, 트랙이 활성화되어 있으면 비활성화하고, 비활성화되어 있으면 활성화합니다.
      track.enabled = !track.enabled
  );

  if (cameraOff) {
    // 현재 카메라가 꺼져 있다면 버튼의 텍스트를 "Turn Camera Off"로 변경하고, 카메라 상태를 false로 설정합니다.
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    // 현재 카메라가 켜져 있다면 버튼의 텍스트를 "Turn Camera On"으로 변경하고, 카메라 상태를 true로 설정합니다.
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}

// handleCameraChange라는 비동기 함수를 정의합니다.
async function handleCameraChange(){
  // getMedia 함수를 호출하여 사용자가 선택한 새 카메라로 미디어 스트림을 업데이트합니다.
  // camerasSelect.value는 드롭다운 메뉴에서 선택된 카메라의 deviceId를 나타냅니다.
  await getMedia(camerasSelect.value);

  // muted 변수의 값이 true인지 확인합니다. muted는 전역 변수로, 오디오가 음소거 상태인지 아닌지를 나타냅니다.
  if (muted) {
    // 음소거 상태인 경우, 모든 오디오 트랙을 비활성화합니다.
    myStream.getAudioTracks().forEach((track) => (track.enabled = false));
  } else {
    // 음소거 상태가 아닌 경우, 모든 오디오 트랙을 활성화합니다.
    myStream.getAudioTracks().forEach((track) => (track.enabled = true));
  }

  if(myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    console.log(videoSender);
    videoSender.replaceTrack(videoTrack);
  }
}


// muteBtn 요소에 "click" 이벤트 리스너를 추가하여 handleMuteClick 함수를 연결합니다.
muteBtn.addEventListener("click", handleMuteClick);
// cameraBtn 요소에 "click" 이벤트 리스너를 추가하여 handleCameraClick 함수를 연결합니다.
cameraBtn.addEventListener("click", handleCameraClick);
// camerasSelect 요소에 'roomNameInput' 이벤트 리스너를 추가합니다.
// 이 리스너는 사용자가 카메라 선택 드롭다운 메뉴에서 입력(카메라 선택 변경)을 할 때마다 작동합니다.
camerasSelect.addEventListener("roomNameInput", handleCameraChange);

// Welcome Form (join a room)

// 'welcome' 요소에서 'form'을 찾아 'welcomeForm' 변수에 저장합니다.
const welcomeForm = welcome.querySelector("form");

// initCall라는 비동기 함수를 정의합니다. 이 함수는 미디어 스트림을 시작하는 기능을 담당합니다.
async function initCall() {
  // welcome 요소를 숨깁니다. 이는 사용자가 미디어 스트리밍을 시작하면 환영 메시지 또는 초기 화면을 숨기기 위함입니다.
  welcome.hidden = true;
  // call 요소를 보이게 합니다. 이는 사용자에게 통화 또는 미디어 스트리밍 관련 UI를 제공하기 위함입니다.
  call.hidden = false;
  // getMedia 함수를 비동기적으로 호출하고, 이 함수의 실행이 완료될 때까지 기다립니다.
  // getMedia 함수는 사용자의 미디어 장치(카메라, 마이크)로부터 미디어 스트림을 획득하는 기능을 수행합니다.
  await getMedia();
  // makeConnection 함수를 호출하여 WebRTC 연결을 초기화합니다.
  // 이 함수는 획득된 미디어 스트림을 이용하여 피어 간 연결을 설정하는 로직을 포함합니다.
  makeConnection();
}

// handleWelcomeSubmit 함수를 정의합니다. 이 함수는 폼 제출 이벤트를 처리합니다.
async function handleWelcomeSubmit(event) {
  // 기본 폼 제출 동작을 방지합니다.
  event.preventDefault();
  // welcomeForm에서 'roomNameInput' 요소를 찾아 roomNameInput 변수에 저장합니다.
  const roomNameInput = welcomeForm.querySelector("#roomName");
  const nickNameInput = welcomeForm.querySelector("#nickName");
  await initCall();
  // socket을 통해 'join_room' 이벤트를 서버에 전송하며, 방 이름(roomNameInput.value)과 콜백 함수(initCall)를 전달합니다.
  socket.emit("join_room", roomNameInput.value, nickNameInput.value);
  // 입력된 방 이름을 roomName 변수에 저장합니다.
  roomName = roomNameInput.value;
  nickName = nickNameInput.value;

  // roomNameInput 필드를 비웁니다.
  roomNameInput.value = "";
  const h2RoomName = document.querySelector("#h2RoomName");
  const myNickName = document.querySelector("#myNickName");
  h2RoomName.innerText = roomName;
  myNickName.innerText = nickName;
  document.querySelector("#name input").value = nickName;
}

// welcomeForm 요소에 'submit' 이벤트 리스너를 추가합니다. 폼이 제출될 때 handleWelcomeSubmit 함수가 호출됩니다.
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

// 'welcome' 이벤트가 socket에서 수신되면 실행되는 이벤트 리스너를 설정합니다.
// 이 이벤트는 다른 클라이언트가 채팅방이나 통화 방에 참여하였을 때 발생합니다.
socket.on("welcome", async (newCount) => {
  const h2RoomName = document.querySelector("#h2RoomName");
  h2RoomName.innerText = `Room ${roomName} (${newCount})`;
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", (event) => console.log(event.data));
  console.log("made data channel");
  // RTCPeerConnection 객체(myPeerConnection)를 사용하여 SDP(Session Description Protocol) 오퍼를 생성합니다.
  // createOffer 메서드는 비동기적으로 실행되며 프로미스를 반환합니다.
  const offer = await myPeerConnection.createOffer();
  // 생성된 오퍼를 로컬 디스크립션으로 설정합니다.
  // setLocalDescription 메서드는 myPeerConnection에 로컬 디스크립션(여기서는 'offer')을 설정하여,
  // 로컬 미디어 설정을 저장하고 이를 원격 피어에게 전달할 준비를 합니다.
  myPeerConnection.setLocalDescription(offer);
  // 콘솔에 "sent the offer" 메시지를 출력하여 오퍼가 생성되고 설정되었음을 로깅합니다.
  console.log("sent the offer");
  // socket을 통해 'offer' 이벤트와 함께 생성된 오퍼 및 현재 방 이름(roomName)을 서버에 전송합니다.
  // 이는 방의 다른 참여자들에게 오퍼를 전달하여 피어 투 피어 연결을 시작하도록 요청합니다.
  socket.emit("offer", offer, roomName);
});

// 웹소켓에서 'offer' 이벤트를 수신하는 리스너를 설정합니다. 이 이벤트에는 원격 피어로부터의 SDP 오퍼가 포함됩니다.
socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", (event) => console.log(event.data));
  });
  console.log("received the offer");
  // 받은 오퍼를 통해 피어 연결의 원격 설명을 설정합니다.
  // 이는 원격 피어가 사용하는 미디어 형식과 옵션을 이해하도록 피어 연결을 구성합니다.
  myPeerConnection.setRemoteDescription(offer);

  // 받은 오퍼에 대한 응답으로 SDP 답변을 생성합니다. 이 작업은 비동기적으로 수행되며,
  // 답변이 완성되면 이를 오퍼를 보낸 피어에게 보내기 위한 준비가 됩니다.
  const answer = await myPeerConnection.createAnswer();

  // 생성된 답변으로 로컬 설명을 설정합니다. 이 작업은 로컬 설정을 완료하고,
  // 피어 연결이 이 답변을 원격 피어에게 보내 통신 절차를 완료할 준비를 합니다.
  myPeerConnection.setLocalDescription(answer);
  // socket.emit 메소드를 사용하여 'answer' 이벤트를 서버로 전송합니다.
  // 이 이벤트는 WebRTC 연결 과정에서 생성된 SDP 답변과 특정 방의 이름을 포함합니다.
  socket.emit("answer", answer, roomName);
  console.log("sent the answer");
});

// 'answer' 이벤트를 수신하는 리스너를 설정합니다. 이 이벤트는 원격 피어가 보낸 SDP 답변을 포함하며,
// 이는 로컬 피어가 보낸 오퍼에 대한 응답입니다.
socket.on("answer", async (answer) => {
  console.log("received the answer");
  // 받은 답변을 통해 피어 연결의 원격 설명을 설정합니다.
  // 이 설정은 미디어 세션에 대해 원격 피어가 동의한 구성을 포함합니다.
  myPeerConnection.setRemoteDescription(answer);

});

// WebSocket을 통해 'ice' 이벤트를 수신하는 리스너를 설정합니다.
// 이 이벤트는 ICE 후보자(네트워크 연결 정보)를 포함하고 있습니다.
socket.on("ice", (ice, nickName, newCount) => {
  console.log("received ice candidate");
  // 수신된 ICE 후보자를 myPeerConnection 객체에 추가합니다.
  // addIceCandidate 메소드는 원격 피어와의 연결 경로를 설정하는 데 사용되는 ICE 후보자를 처리합니다.
  myPeerConnection.addIceCandidate(ice);
  const h2RoomName = document.querySelector("#h2RoomName");
  h2RoomName.innerText = `Room ${roomName} (${newCount})`;
  const peerNickName = document.querySelector("#peerNickName");
  peerNickName.innerText = nickName;
});

//RTC Code

// makeConnection 함수를 정의합니다. 이 함수는 WebRTC 피어 연결을 설정합니다.
function makeConnection() {
  // RTCPeerConnection 객체를 생성하고 myPeerConnection 변수에 할당합니다.
  // 이 객체는 로컬과 원격 피어 간의 연결을 관리하며, 미디어 데이터 및 기타 데이터 스트림을 교환하는 데 사용됩니다.
  myPeerConnection = new RTCPeerConnection({
    // iceServers: [
    //   {
    //     url: [
    //       "stun:stun.l.google.com:19302",
    //       "stun:stun1.l.google.com:19302",
    //       "stun:stun2.l.google.com:19302",
    //       "stun:stun3.l.google.com:19302",
    //       "stun:stun4.l.google.com:19302",
    //     ],
    //   },
    // ],
  });
  // myPeerConnection 객체에 'icecandidate' 이벤트 리스너를 추가합니다.
  // 'icecandidate' 이벤트는 로컬 ICE 에이전트가 네트워크 후보(ICE candidate)를 찾을 때마다 발생합니다.
  // 이 이벤트가 발생하면 handleIce 콜백 함수가 호출되어 후보를 처리할 수 있습니다.
  myPeerConnection.addEventListener("icecandidate", handleIce);
  // myPeerConnection 객체에 'addstream' 이벤트 리스너를 추가합니다.
  // 'addstream' 이벤트는 원격 피어로부터 미디어 스트림이 추가되었을 때 발생합니다.
  // 이 이벤트가 발생하면 handleAddStream 콜백 함수가 호출되어 추가된 스트림을 처리할 수 있습니다.
  myPeerConnection.addEventListener("addstream", handleAddStream);
  // myStream 객체에서 모든 미디어 트랙을 가져와 각 트랙을 myPeerConnection에 추가합니다.
  // myStream은 getUserMedia()로 획득된 미디어 스트림을 나타내며, 비디오 및 오디오 트랙을 포함할 수 있습니다.
  myStream
    .getTracks()
    .forEach((track) => 
      // myPeerConnection의 addTrack 메소드를 사용하여 각 트랙을 연결에 추가합니다.
      // 이 과정은 로컬 미디어 스트림을 연결에 통합하여 원격 피어와 공유할 수 있도록 합니다.
      myPeerConnection.addTrack(track, myStream));
}

// handleIce 함수는 ICE 후보자 이벤트를 처리합니다.
function handleIce(data) {
  console.log("send candidate");
  // socket.emit을 사용하여 'ice' 이벤트를 서버로 전송합니다. 이때, ICE 후보자(data.candidate)와 방 이름(roomName)을 전송합니다.
  // 이는 다른 피어에게 네트워크 연결 정보를 전달하여 연결 설정을 돕습니다.
  socket.emit("ice", data.candidate, roomName, nickName);
}

// handleAddStream 함수는 원격 피어로부터 받은 미디어 스트림 이벤트를 처리합니다.
function handleAddStream(data) {
  // 'peerFace'라는 ID를 가진 HTML 요소를 찾아 peerFace 변수에 저장합니다.
  const peerFace = document.getElementById("peerFace");
  // peerFace 요소의 srcObject 속성을 data.stream으로 설정합니다.
  // 이는 원격 피어로부터 받은 미디어 스트림을 해당 HTML 요소에서 재생할 수 있게 합니다.
  // 원격 피어의 비디오나 오디오가 사용자에게 보여질 것입니다.
  peerFace.srcObject = data.stream;
}


// HTML 문서에서 'name' 폼 요소를 선택하여 nameForm 변수에 저장합니다.
const nameForm = document.getElementById("name");
// HTML 문서에서 'msg' 폼 요소를 선택하여 msgForm 변수에 저장합니다.
const msgForm = document.getElementById("msg");

// handleNicknameSubmit 함수를 정의합니다. 이 함수는 닉네임 변경 폼 제출 이벤트를 처리합니다.
function handleNicknameSubmit(event) {
  // 기본 폼 제출 동작을 방지합니다.
  event.preventDefault();
  // nameForm에서 입력된 닉네임을 가져옵니다.
  const input = nameForm.querySelector("input");
  // 서버로 'nickname' 이벤트와 입력된 닉네임을 전송합니다.
  socket.emit("nickname", input.value);
  // 입력된 닉네임을 전역 변수 nickName에 저장합니다.
  nickName = input.value;
  // 닉네임 필드를 비웁니다.
  input.value = "";
  // myNickName 요소의 텍스트를 변경된 닉네임으로 설정합니다.
  const myNickName = document.querySelector("#myNickName");
  myNickName.innerText = nickName;
}

// handleMessageSubmit 함수를 정의합니다. 이 함수는 메시지 전송 폼 제출 이벤트를 처리합니다.
function handleMessageSubmit(event) {
  // 기본 폼 제출 동작을 방지합니다.
  event.preventDefault();
  // msgForm에서 입력된 메시지를 가져옵니다.
  const input = msgForm.querySelector("input");
  // 서버로 'new_message' 이벤트와 입력된 메시지를 전송합니다.
  socket.emit("new_message", input.value, roomName);
  // 입력된 메시지를 myDataChannel을 통해 전송합니다.
  myDataChannel.send(`${nickName}: ${input.value}`);
  // 입력된 메시지를 채팅 화면에 표시하기 위해 appendMessage 함수를 호출합니다.
  appendMessage(`You: ${input.value}`);
  // 메시지 필드를 비웁니다.
  input.value = "";
}

// appendMessage 함수를 정의합니다. 이 함수는 채팅 메시지를 화면에 추가합니다.
function appendMessage(message) {
  // 새로운 'li' HTML 요소를 생성합니다.
  const ul = document.querySelector("#msgList");
  const li = document.createElement("li");
  // li 요소의 텍스트를 입력된 메시지로 설정합니다.
  li.innerText = message;
  // ul 요소에 li 요소를 추가합니다.
  ul.appendChild(li);
}

// nameForm 요소에 'submit' 이벤트 리스너를 추가하여 handleNicknameSubmit 함수를 연결합니다.
nameForm.addEventListener("submit", handleNicknameSubmit);
// msgForm 요소에 'submit' 이벤트 리스너를 추가하여 handleMessageSubmit 함수를 연결합니다.
msgForm.addEventListener("submit", handleMessageSubmit);

// WebSocket에서 'new_message' 이벤트를 수신하는 리스너를 설정합니다.
socket.on("new_message", appendMessage);

socket.on("status_update", ({total, rooms, out, roomDetail}) => {
  const statusParagraphs = document.querySelectorAll("#status p");
  statusParagraphs[0].innerText = `Total Connections: ${total}`;
  statusParagraphs[1].innerText = `Total Rooms: ${rooms}`;
  statusParagraphs[2].innerText = `Waiting Users: ${out}`;
  
  // 방 목록을 업데이트
  const roomList = document.getElementById("roomList");
  roomList.innerHTML = ""; // 기존 목록 초기화
    roomDetail.forEach(room => {
    const li = document.createElement("li");
    li.innerText = room; // 방 이름과 참여 인원 수를 표시
    li.addEventListener("click", () => {
      socket.emit("enter_room", room.split(" (")[0], showRoom); // 괄호 전의 문자열이 방 이름
      roomName = room.split(" (")[0];
    });
      if (room.split(" (")[0] === roomName) {
        li.style.color = "red"; // 현재 방을 빨간색으로 표시
        li.style.fontWeight = "bold"; // 글자를 굵게
      }
    roomList.appendChild(li);
  });
});