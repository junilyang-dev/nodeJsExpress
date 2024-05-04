// Socket.IO 클라이언트 라이브러리를 통해 서버에 연결하는 소켓 객체를 생성합니다.
const socket = io();

// HTML 문서에서 video 요소를 선택하여 myFace 변수에 저장합니다.
const myFace = document.getElementById("myFace");
// HTML 문서에서 버튼 요소를 선택하여 muteBtn 변수에 저장합니다.
const muteBtn = document.getElementById("mute");
// HTML 문서에서 카메라 버튼을 선택하여 cameraBtn 변수에 저장합니다.
const cameraBtn = document.getElementById("camera");
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
// myPeerConnection 변수를 선언합니다. 이 변수는 나중에 RTCPeerConnection 객체의 인스턴스를 저장하는 데 사용될 수 있습니다.
// RTCPeerConnection은 WebRTC API의 일부로, 브라우저 간 피어 투 피어 연결을 설정하는 데 사용됩니다.
let myPeerConnection;


// getCameras라는 비동기 함수를 정의합니다.
async function getCameras() {
  try {
    // 사용 가능한 모든 미디어 입력 장치 목록을 요청합니다.
    const devices = await navigator.mediaDevices.enumerateDevices();
    // 가져온 장치 목록에서 비디오 입력 장치(카메라)만을 필터링합니다.
    const cameras = devices.filter((device) => device.kind === "videoinput");
    // 현재 스트림에서 사용 중인 비디오 트랙을 가져옵니다.
    const currentCamera = myStream.getVideoTracks()[0];
    // 필터링된 카메라 리스트를 순회하면서 각 카메라에 대한 처리를 수행합니다.
    cameras.forEach((camera) => {
      // 새로운 'option' HTML 요소를 생성합니다.
      const option = document.createElement("option");
      // option 요소의 value 속성에 카메라의 deviceId를 설정합니다.
      option.value = camera.deviceId;
      // option 요소의 텍스트 내용으로 카메라의 라벨을 설정합니다.
      option.innerText = camera.label;
      // 현재 사용 중인 카메라와 일치하는 경우, 이 option을 선택된 상태로 설정합니다.
      if (currentCamera.label == camera.label) {
        option.selected = true;
      }
      // 생성된 option 요소를 카메라 선택을 위한 드롭다운 리스트에 추가합니다.
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    // 오류 발생 시 콘솔에 오류 메시지를 출력합니다.
    console.log(e);
  }
}

// 비동기 함수 getMedia를 정의합니다. 이 함수는 사용자의 비디오 및 오디오를 가져옵니다.
async function getMedia(deviceId) {
  // initialConstraints 객체를 정의합니다. 이 객체는 비디오와 오디오 스트림에 대한 초기 요청 제약 조건을 지정합니다.
  const initialConstraints = {
    audio: true, // 오디오 트랙을 요청합니다. true는 시스템 기본 마이크를 사용하도록 요청합니다.
    video: { facingMode: "user" }, // 비디오 트랙을 요청하며, 사용자의 전면 카메라(일반적으로 스마트폰이나 노트북의 전면)를 사용하도록 지정합니다.
  };

  // cameraConstraints 객체를 정의합니다. 이 객체는 특정 카메라 장치를 선택할 때 사용되는 요청 제약 조건을 지정합니다.
  const cameraConstraints = {
    audio: true, // 오디오 트랙을 요청합니다. 여기서도 시스템 기본 마이크를 사용하도록 설정됩니다.
    video: { deviceId: deviceId }, // 비디오 트랙을 요청하며, 특정 deviceId를 가진 카메라를 사용하도록 지정합니다.
    // deviceId는 카메라 선택 로직에 의해 결정된 특정 카메라의 고유 식별자입니다.
  };
  try {
    // navigator.mediaDevices.getUserMedia를 사용하여 비디오 및 오디오 스트림을 요청합니다.
    myStream = await navigator.mediaDevices.getUserMedia(
      //deviceId가 있을 경우 cameraConstraints 가져오기, 없으면 initialConstraints 가져오기
      deviceId ? cameraConstraints : initialConstraints,
    );
    // 가져온 미디어 스트림을 video 요소의 srcObject 속성에 할당하여 비디오를 표시합니다.
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    // 미디어 스트림을 가져오는 과정에서 오류가 발생하면 콘솔에 오류 메시지를 출력합니다.
    console.log(e);
  }
}

// 음소거 버튼 클릭 이벤트를 처리하는 함수를 정의합니다.
function handleMuteClick() {
  // myStream에서 오디오 트랙들을 가져옵니다. myStream은 getUserMedia()를 통해 얻은 미디어 스트림 객체입니다.
  myStream.getAudioTracks().forEach((track) => {
    // 각 오디오 트랙의 enabled 속성을 토글합니다.
    // enabled 속성은 불리언 값으로, 트랙이 활성화되어 있으면 true, 비활성화되어 있으면 false입니다.
    track.enabled = !track.enabled;
  });
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
  // myStream에서 비디오 트랙들을 가져옵니다. myStream은 getUserMedia()를 통해 얻은 미디어 스트림 객체입니다.
  myStream.getVideoTracks().forEach((track) => {
    // 각 비디오 트랙의 enabled 속성을 토글합니다.
    // enabled 속성은 불리언 값으로, 트랙이 활성화되어 있으면 true, 비활성화되어 있으면 false입니다.
    track.enabled = !track.enabled;
  });

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
async function handleCameraChange() {
  // 현재 비디오 요소(myFace)의 소스 객체를 현재 미디어 스트림(myStream)으로 설정합니다.
  myFace.srcObject = myStream;
  // getMedia 함수를 호출하여 선택된 카메라의 deviceId에 따라 미디어 스트림을 업데이트합니다.
  // camerasSelect.value는 사용자가 선택한 카메라의 deviceId를 포함합니다.
  await getMedia(camerasSelect.value);
  // muted 변수의 값에 따라 오디오 트랙의 활성화 상태를 조정합니다.
  if (muted) {
    // muted가 true인 경우, 모든 오디오 트랙을 비활성화합니다.
    myStream.getAudioTracks().forEach((track) => (track.enabled = false));
  } else {
    // muted가 false인 경우, 모든 오디오 트랙을 활성화합니다.
    myStream.getAudioTracks().forEach((track) => (track.enabled = true));
  }
}

// muteBtn 요소에 "click" 이벤트 리스너를 추가하여 handleMuteClick 함수를 연결합니다.
muteBtn.addEventListener("click", handleMuteClick);
// cameraBtn 요소에 "click" 이벤트 리스너를 추가하여 handleCameraClick 함수를 연결합니다.
cameraBtn.addEventListener("click", handleCameraClick);
// camerasSelect 요소에 'input' 이벤트 리스너를 추가합니다.
// 사용자가 드롭다운 메뉴에서 다른 카메라를 선택하면 handleCameraChange 함수가 호출됩니다.
camerasSelect.addEventListener("input", handleCameraChange);

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
  // welcomeForm에서 'input' 요소를 찾아 input 변수에 저장합니다.
  const input = welcomeForm.querySelector("input");
  await initCall();
  // socket을 통해 'join_room' 이벤트를 서버에 전송하며, 방 이름(input.value)과 콜백 함수(initCall)를 전달합니다.
  socket.emit("join_room", input.value);
  // 입력된 방 이름을 roomName 변수에 저장합니다.
  roomName = input.value;
  // input 필드를 비웁니다.
  input.value = "";
}

// welcomeForm 요소에 'submit' 이벤트 리스너를 추가합니다. 폼이 제출될 때 handleWelcomeSubmit 함수가 호출됩니다.
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Sicket Code

// 'welcome' 이벤트가 socket에서 수신되면 실행되는 이벤트 리스너를 설정합니다.
// 이 이벤트는 다른 클라이언트가 채팅방이나 통화 방에 참여하였을 때 발생합니다.
socket.on("welcome", async () => {
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


// 'offer' 이벤트를 리스닝하기 위해 socket 객체에 이벤트 리스너를 설정합니다.
// 이 이벤트는 다른 피어로부터 연결 제안을 받았을 때 발생합니다.
socket.on("offer", async (offer) => {
  myPeerConnection.setRemoteDescripton(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
});

socket.on("answer", async (answer) => {
  myPeerConnection.setRemoteDescripton(answer);
});

//RTC Code

// makeConnection 함수를 정의합니다. 이 함수는 WebRTC 피어 연결을 설정합니다.
function makeConnection() {
  // RTCPeerConnection 객체를 생성하고 myPeerConnection 변수에 할당합니다.
  // 이 객체는 로컬과 원격 피어 간의 연결을 관리하며, 미디어 데이터 및 기타 데이터 스트림을 교환하는 데 사용됩니다.
  myPeerConnection = new RTCPeerConnection();

  // myStream 객체에서 모든 미디어 트랙을 가져와 각 트랙을 myPeerConnection에 추가합니다.
  // myStream은 getUserMedia()로 획득된 미디어 스트림을 나타내며, 비디오 및 오디오 트랙을 포함할 수 있습니다.
  myStream
    .getTracks()
    .forEach((track) => 
      // myPeerConnection의 addTrack 메소드를 사용하여 각 트랙을 연결에 추가합니다.
      // 이 과정은 로컬 미디어 스트림을 연결에 통합하여 원격 피어와 공유할 수 있도록 합니다.
      myPeerConnection.addTrack(track, myStream));
}
