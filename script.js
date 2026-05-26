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
  const leftOuterEye = landmarks[33];
  const rightOuterEye = landmarks[263];
  const eyeDist = distance(leftOuterEye,rightOuterEye);

  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];
  const mouthWidth = distance(leftMouth,rightMouth);

  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  const mouthOpen = distance(upperLip,lowerLip);

  const leftBrow = landmarks[105];
  const rightBrow = landmarks[334];
  const leftEyeTop = landmarks[159];
  const rightEyeTop = landmarks[386];
  const browHeight = ((leftEyeTop.y - leftBrow.y) + (rightEyeTop.y - rightBrow.y)) / 2;

  const mouthCenterY = (leftMouth.y + rightMouth.y) / 2;
  const cornerLift = mouthCenterY - ((upperLip.y + lowerLip.y) / 2);

  const smileRatio = mouthWidth / eyeDist;
  const openRatio = mouthOpen / eyeDist;
  const browRatio = browHeight / eyeDist;

  if(openRatio > 0.32){
    return 'surprised';
  }
  if(smileRatio > 0.48 && cornerLift > 0.01){
    return 'happy';
  }
  if(smileRatio > 0.4 && cornerLift > 0.0){
    return 'content';
  }
  if(cornerLift < -0.02){
    return 'sad';
  }
  if(browRatio < 0.14){
    return 'angry';
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
      if(expr === 'happy'){
        messageEl.textContent = '偵測到開心表情 😄';
        speak('你今天看起來心情不錯喔！');
      } else if(expr === 'content'){
        messageEl.textContent = '偵測到愉悅表情 🙂';
        speak('保持這種輕鬆舒服的感覺吧。');
      } else if(expr === 'surprised'){
        messageEl.textContent = '偵測到驚訝表情 😲';
        speak('哇，你看起來很驚訝耶！');
      } else if(expr === 'sad'){
        messageEl.textContent = '偵測到傷心表情 😢';
        speak('如果你不開心，記得深呼吸，放慢一下。');
      } else if(expr === 'angry'){
        messageEl.textContent = '偵測到生氣表情 😠';
        speak('你看起來有點不高興，試著放鬆一下。');
      } else {
        messageEl.textContent = '偵測到中性表情';
        speak('你現在看起來很自然。');
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
