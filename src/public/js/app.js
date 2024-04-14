const socket = new WebSocket(`wss://${window.location.host}`);

socket.addEventListener("open", () =>{
  console.log("Connected to Server ✅");
});

socket.addEventListener("message", (message) => {
  console.log("New message: ", message.data);
});

socket.addEventListener("close", () => {
  console.log("Disconnected from Server ❌");
});

setTimeout(() => {
  //socket.send("Hello from client!");
  socket.send("hello from the browser!");
}, 10000);