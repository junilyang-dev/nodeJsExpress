const socket = io();

const myFace = document.getElementById("myFace");

let myStream;

async function getMedia() {
  try{
    myStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    myFace.srcObject = myStream;
  }catch(e){
    console.log(e);
  }
}

getMedia();