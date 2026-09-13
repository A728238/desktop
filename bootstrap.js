// dist/bootstrap.js
(async function initBlinkInteractive() {
  const BASE_URL = 'https://a728238.github.io/desktop/';

  console.log('[Blink Engine] 🚀 起動処理を開始します...');

  // 1. Canvas / UI の初期化
  let canvas = document.getElementById('canvas');
  if (!canvas) {
    document.body.style.margin = '0';
    document.body.style.backgroundColor = '#1e1e1e';
    document.body.style.color = '#fff';
    document.body.style.fontFamily = 'monospace';
    document.body.style.overflow = 'hidden';

    // ドラッグ＆ドロップ用 UI の生成
    const dropArea = document.createElement('div');
    dropArea.id = 'drop-area';
    dropArea.innerHTML = '<h2>🎯 x86_64 ELF / AppImage バイナリをドロップして実行</h2><p>またはクリックしてファイルを選択</p>';
    dropArea.style.cssText = 'position:fixed; top:20px; left:20px; right:20px; padding:30px; border:2px dashed #007acc; background:rgba(0,0,0,0.85); text-align:center; z-index:9999; cursor:pointer; border-radius:8px;';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    
    dropArea.onclick = () => fileInput.click();
    
    document.body.appendChild(dropArea);
    document.body.appendChild(fileInput);

    canvas = document.createElement('canvas');
    canvas.id = 'canvas';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.display = 'block';
    document.body.appendChild(canvas);

    // ファイル読み込み処理
    const handleFile = (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const bytes = new Uint8Array(e.target.result);
        dropArea.style.display = 'none';
        console.log(`[Blink File] 📦 '${file.name}' (${bytes.length} bytes) をロードしました`);
        launchEmscripten(BASE_URL, canvas, `/bin/${file.name}`, bytes);
      };
      reader.readAsArrayBuffer(file);
    };

    fileInput.onchange = (e) => {
      if (e.target.files.length > 0) handleFile(e.target.files[0]);
    };

    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });
  }
})();

function launchEmscripten(BASE_URL, canvas, targetProgram, binaryBytes) {
  const fileName = targetProgram.split('/').pop();

  window.Module = {
    canvas: canvas,
    arguments: [targetProgram],
    locateFile: (path) => BASE_URL + path,
    print: (text) => console.log(`[Blink Output] ${text}`),
    printErr: (text) => console.error(`[Blink Err] ${text}`),
    preRun: [function() {
      const fs = window.FS || (window.Module && window.Module.FS);
      if (!fs) {
        console.error('[Blink FS] ❌ FS オブジェクトの初期化に失敗しました');
        return;
      }

      // ディレクトリ構造の初期化
      const dirs = ['/bin', '/proc', '/proc/self', '/tmp', '/dev', '/sys'];
      dirs.forEach(d => {
        try { fs.mkdir(d); } catch(e) {}
      });

      if (binaryBytes) {
        // 1. ターゲットバイナリを仮想 FS に配置
        fs.createDataFile('/bin', fileName, binaryBytes, true, true, true);
        try { fs.chmod(targetProgram, 0o755); } catch(e) {}
        console.log(`[Blink FS] ✅ ${targetProgram} を仮想 FS にマウントしました`);

        // 2. AppImage や Linux バイナリが要求する /proc/self/exe のエイリアス作成
        try {
          fs.symlink(targetProgram, '/proc/self/exe');
        } catch(e) {
          // シンボリックリンク非対応環境フォールバック（実体ファイルのコピー配置）
          fs.createDataFile('/proc/self', 'exe', binaryBytes, true, true, true);
          try { fs.chmod('/proc/self/exe', 0o755); } catch(e) {}
        }

        // 3. 基本的な /proc 環境ファイルのダミー生成
        try {
          fs.createDataFile('/proc', 'mounts', 'rootfs / ext4 rw 0 0\n', true, true, true);
        } catch(e) {}

        console.log('[Blink FS] 🔗 /proc/self/exe のマウント処理が完了しました');
      }
    }],
    onRuntimeInitialized: () => {
      console.log(`[Blink Engine] 🎉 実行準備完了。${targetProgram} を起動します...`);
    }
  };

  const script = document.createElement('script');
  script.src = BASE_URL + 'blink_app.js';
  document.head.appendChild(script);
}
