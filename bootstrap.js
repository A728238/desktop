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

  // 2. 実行用パラメータと最小限の x86_64 Linux ELF バイナリ（"Hello World\n" を表示して exit）
  // Base64 encoded x86_64 ELF binary
  const sampleElfBase64 = "f0VMRgIBAQAAAAAAAAAAAAIAPgABAAAA4ABAAAAAAABAAAAAAAAAAOAFAAAAAAAAPAAAAAAAAAAYAAAAAAAAAAEAAAAFAAAAAAAAAAAAAAAAAAAAIAAAAAAAMAAAAAAACAAAAAAAAAAAIAAAAAAAAQAAAAAAAAD0AQAADwAAAAD3AAAAeA==";
  
  launchEmscripten(BASE_URL, canvas, '/bin/hello', sampleElfBase64);
})();

function launchEmscripten(BASE_URL, canvas, targetProgram, base64Binary) {
  window.Module = {
    canvas: canvas,
    arguments: [targetProgram], // /bin/hello を指定
    locateFile: (path) => BASE_URL + path,
    print: (text) => console.log(`[Blink Output] ${text}`),
    printErr: (text) => console.error(`[Blink Err] ${text}`),
    preRun: [function(m) {
      console.log('[Blink FS] 仮想ファイルシステムを構築中...');
      
      try {
        // /bin ディレクトリ作成
        m.FS.mkdir('/bin');
      } catch(e) {}

      if (base64Binary) {
        // Base64 を Uint8Array に変換
        const binaryString = atob(base64Binary);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // 仮想 FS 上に /bin/hello を作成し、実行権限(0755)を付与
        m.FS.createDataFile('/bin', 'hello', bytes, true, true, true);
        m.FS.chmod('/bin/hello', 0o755);
        console.log('[Blink FS] /bin/hello バイナリの作成完了！');
      }
    }],
    onRuntimeInitialized: () => {
      console.log('[Blink Engine] 🎉 実行準備が完了しました。Blink 上でバイナリを起動します...');
    }
  };

  const script = document.createElement('script');
  script.src = BASE_URL + 'blink_app.js';
  document.head.appendChild(script);
}
