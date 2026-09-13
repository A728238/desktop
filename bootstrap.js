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

    // ドラッグ＆ドロップ用 UI
    const dropArea = document.createElement('div');
    dropArea.id = 'drop-area';
    dropArea.innerHTML = '<h2>🎯 Linux x86_64 バイナリ / AppImage をドロップ</h2><p>またはクリックしてファイルを選択</p>';
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

    // ファイル検証 & 読み込み
    const handleFile = (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const bytes = new Uint8Array(e.target.result);

        // ELF ヘッダーの初期検証 (x86_64 チェック)
        if (bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) {
          const arch = bytes[18] | (bytes[19] << 8); // e_machine
          if (arch !== 0x3e) { // 0x3e = EM_X86_64
            alert(`エラー: x86_64 バイナリではありません。(検出されたアーキテクチャ ID: 0x${arch.toString(16)})\nx86_64 (amd64) 版のファイルをドロップしてください。`);
            return;
          }
        }

        dropArea.style.display = 'none';
        console.log(`[Blink File] 📦 '${file.name}' (${bytes.length} bytes) をロードしました`);
        
        // AppImage の場合は FUSE 回避用の引数を付与
        const args = [`/bin/${file.name}`];
        if (file.name.endsWith('.AppImage')) {
          console.log('[Blink Engine] 💡 AppImage を検出。--appimage-extract-and-run モードで起動します');
          args.push('--appimage-extract-and-run');
        }

        launchEmscripten(BASE_URL, canvas, `/bin/${file.name}`, args, bytes);
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

function launchEmscripten(BASE_URL, canvas, targetProgram, execArgs, binaryBytes) {
  const fileName = targetProgram.split('/').pop();

  window.Module = {
    canvas: canvas,
    arguments: execArgs, // 引数配列（AppImage 用フラグ含む）
    locateFile: (path) => BASE_URL + path,
    print: (text) => console.log(`[Blink Output] ${text}`),
    printErr: (text) => console.error(`[Blink Err] ${text}`),
    preRun: [function() {
      const fs = window.FS || (window.Module && window.Module.FS);
      if (!fs) return;

      // 基本ディレクトリの作成
      const dirs = ['/bin', '/proc', '/proc/self', '/tmp', '/dev', '/sys', '/etc'];
      dirs.forEach(d => {
        try { fs.mkdir(d); } catch(e) {}
      });

      if (binaryBytes) {
        // 1. ターゲットバイナリをマウント
        fs.createDataFile('/bin', fileName, binaryBytes, true, true, true);
        try { fs.chmod(targetProgram, 0o755); } catch(e) {}
        console.log(`[Blink FS] ✅ ${targetProgram} を仮想 FS にマウントしました`);

        // 2. /proc/self/exe エイリアス設定
        try {
          fs.symlink(targetProgram, '/proc/self/exe');
        } catch(e) {
          fs.createDataFile('/proc/self', 'exe', binaryBytes, true, true, true);
          try { fs.chmod('/proc/self/exe', 0o755); } catch(e) {}
        }

        // 3. 仮想システムファイル生成
        try {
          fs.createDataFile('/proc', 'mounts', 'rootfs / ext4 rw 0 0\n', true, true, true);
          fs.createDataFile('/etc', 'passwd', 'root:x:0:0:root:/root:/bin/sh\n', true, true, true);
        } catch(e) {}

        console.log('[Blink FS] 🔗 仮想環境構成の完了');
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
