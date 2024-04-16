const socket = new WebSocket(`wss://${window.location.host}`);
const messageList = document.querySelector('ul');
const messageForm = document.querySelector('form');

function handleOpen() {
  console.log("Connected to the Server ✅");
}

socket.addEventListener("open", handleOpen);

socket.addEventListener("message", (message) => {
  console.log("New message: ", message.data);
  const li = document.createElement("li");
  li.innerText = message.data;
  messageList.append(li);
});

socket.addEventListener("close", () => {
  console.log("Disconnected from Server ❌");
});

// setTimeout(() => {
//   //socket.send("Hello from client!");
//   socket.send("hello from the browser!");
// }, 10000);

function handleSubmit(event) {
  event.preventDefault();
  const input = messageForm.querySelector('input');
  socket.send(input.value);
  console.log(input.value);
  input.value = "";
}

messageForm.addEventListener("submit", handleSubmit);