const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('startBtn');
const rearCamCheckbox = document.getElementById('rearCam');
const messageEl = document.getElementById('message');

let camera = null;
let lastExpression = null;
let lastSpoken = 0;
const SPEECH_COOLDOWN = 3000; // ms

function speak(text){
  if(!('speechSynthesis' in window)) return;
  const now = Date.now();
  if(now - lastSpoken < SPEECH_COOLDOWN) return;
  lastSpoken = now;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-TW';
  u.rate = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function distance(a,b){
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx,dy);
}

function detectExpression(landmarks){
  // landmarks are normalized (x,y) in video space
  // use eye outer corners to normalize face width
  const leftOuterEye = landmarks[33];
  const rightOuterEye = landmarks[263];
  const eyeDist = distance(leftOuterEye,rightOuterEye);

  // mouth corners (approx): 61 (left), 291 (right)
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];
  const mouthWidth = distance(leftMouth,rightMouth);

  // lip vertical distance: 13 (upper lip), 14 (lower lip)
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  const mouthOpen = distance(upperLip,lowerLip);

  const smileRatio = mouthWidth / eyeDist;
  const openRatio = mouthOpen / eyeDist;

  if(smileRatio > 0.48){
    return 'smile';
  }
  if(openRatio > 0.28){
    return 'surprised';
  }
  return 'neutral';
}

function onResults(results){
  if(!results.multiFaceLandmarks || results.multiFaceLandmarks.length===0){
    canvasCtx.clearRect(0,0,canvasElement.width,canvasElement.height);
    messageEl.textContent = '未偵測到臉部';
    lastExpression = null;
    return;
  }

  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;

  canvasCtx.save();
  canvasCtx.clearRect(0,0,canvasElement.width,canvasElement.height);
  canvasCtx.drawImage(results.image,0,0,canvasElement.width,canvasElement.height);

  for(const landmarks of results.multiFaceLandmarks){
    drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {color:'#C0FFEE',lineWidth:1});
    drawLandmarks(canvasCtx, landmarks, {color:'#FF7B7B',radius:1});

    const expr = detectExpression(landmarks);
    if(expr !== lastExpression){
      lastExpression = expr;
      if(expr === 'smile'){
        messageEl.textContent = '偵測到笑臉 😊';
        speak('你今天看起來心情不錯喔！');
      } else if(expr === 'surprised'){
        messageEl.textContent = '偵測到驚訝 😲';
        speak('哇，你看起來很驚訝耶！');
      } else {
        messageEl.textContent = '中性表情';
      }
    }
  }
  canvasCtx.restore();
}

const faceMesh = new FaceMesh({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
}});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);

function startCamera(){
  if(camera) camera.stop();
  const facingMode = rearCamCheckbox.checked ? 'environment' : 'user';
  camera = new Camera(videoElement, {
    onFrame: async () => { await faceMesh.send({image: videoElement}); },
    width: 640,
    height: 480,
    facingMode
  });
  camera.start();
}

startBtn.addEventListener('click', async ()=>{
  try{
    await startCamera();
    startBtn.disabled = true;
    startBtn.textContent = '運行中';
  }catch(e){
    alert('相機啟用失敗：'+e.message);
  }
});
