# MediaPipe 前端表情辨識（純前端）

這是一個純前端示範，使用 MediaPipe FaceMesh 在瀏覽器即時偵測多種表情（開心、愉悅、驚訝、傷心、生氣、中性），並使用 Web Speech API 提供語音回饋。

主要檔案
- `index.html`：主頁面
- `style.css`：樣式
- `script.js`：偵測與語音回饋邏輯

本機測試
1. 將整個資料夾放到本機或簡單啟動靜態伺服器（推薦）。
2. 可以使用 Python 的簡易伺服器：

```powershell
# 在資料夾內執行
python -m http.server 8000
```

3. 在手機或桌面瀏覽器開啟 `http://<你的機器IP>:8000/`，點選「開始」並允許相機權限。

部署到 GitHub Pages
1. 在 GitHub 建立一個新 repository（例如 `mediapipe-expression`）。
2. 在本地初始化 git，加入遠端並推送：

```bash
git init
git add .
git commit -m "Initial commit: MediaPipe expression app"
git branch -M main
git remote add origin https://github.com/<你的帳號>/<你的repo>.git
git push -u origin main
```

3. 到 GitHub repository -> Settings -> Pages，選擇 `main` 分支根目錄作為 Pages 來源，儲存後幾分鐘內可於 `https://<你的帳號>.github.io/<你的repo>/` 存取。

如果你需要，我可以幫你把專案 commit 並推上 GitHub（需要你給我權限或在本地執行推送）。
