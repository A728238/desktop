// dist/bootstrap.js
(async function initOfflineInaccessibleBlink() {
  const BASE_URL = 'https://a728238.github.io/desktop/';

  console.log('[Blink Engine] 🚀 起動処理を開始します...');

  // 1. Canvas の確保
  let canvas = document.getElementById('canvas');
  if (!canvas) {
    document.body.style.margin = '0';
    document.body.style.backgroundColor = '#000';
    document.body.style.overflow = 'hidden';
    canvas = document.createElement('canvas');
    canvas.id = 'canvas';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.display = 'block';
    document.body.appendChild(canvas);
  }

  // 2. 最小限の x86_64 Linux ELF バイナリ
  const sampleElfBase64 = "f0VMRgIBAQAAAAAAAAAAAAIAPgABAAAA4ABAAAAAAABAAAAAAAAAAOAFAAAAAAAAPAAAAAAAAAAYAAAAAAAAAAEAAAAFAAAAAAAAAAAAAAAAAAAAIAAAAAAAMAAAAAAACAAAAAAAAAAAIAAAAAAAAQAAAAAAAAD0AQAADwAAAAD3AAAAeA==";
  
  launchEmscripten(BASE_URL, canvas, '/bin/hello', sampleElfBase64);
})();

function launchEmscripten(BASE_URL, canvas, targetProgram, base64Binary) {
  window.Module = {
    canvas: canvas,
    arguments: [targetProgram],
    locateFile: (path) => BASE_URL + path,
    print: (text) => console.log(`[Blink Output] ${text}`),
    printErr: (text) => console.error(`[Blink Err] ${text}`),
    preRun: [function() {
      console.log('[Blink FS] 仮想ファイルシステムを構築中...');
      
      // グローバルな FS オブジェクトを参照
      const fs = window.FS || (window.Module && window.Module.FS);

      if (!fs) {
        console.error('[Blink FS] ❌ FS オブジェクトが見つかりません');
        return;
      }
      
      try {
        fs.mkdir('/bin');
      } catch(e) {}

      if (base64Binary) {
        const binaryString = atob(base64Binary);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // 仮想 FS 上に /bin/hello を作成 (1: read, 1: write, 1: execute)
        fs.createDataFile('/bin', 'hello', bytes, true, true, true);
        try {
          fs.chmod('/bin/hello', 0o755);
        } catch(e) {}
        
        console.log('[Blink FS] ✅ /bin/hello バイナリの配置を完了しました！');
      }
    }],
    onRuntimeInitialized: () => {
      console.log('[Blink Engine] 🎉 実行準備完了。Blink エミュレータを起動します...');
    }
  };

  const script = document.createElement('script');
  script.src = BASE_URL + 'blink_app.js';
  document.head.appendChild(script);
}
