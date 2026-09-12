// dist/bootstrap.js
(async function forceMultithreadBreakthrough() {
  const BASE_URL = 'https://a728238.github.io/desktop/';

  console.log('[Blink Engine] 🚀 マルチスレッド・起動シークエンスを開始します...');

  // 1. DOM / Canvas の用意
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

  // 2. crossOriginIsolated 成立済みの判定（完全成功状態）
  if (window.crossOriginIsolated) {
    console.log('[Blink Engine] ✨ crossOriginIsolated: true - Pthreads / SharedArrayBuffer が完全有効化されました！');
    launchEmscripten(BASE_URL, canvas);
    return;
  }

  // 3. about:blank や Origin: null からの脱出 (Domain Promotion)
  if (location.origin === 'null' || location.protocol === 'about:') {
    console.warn('[Blink Engine] ⚡ about:blank (Origin: null) を検知。Service Worker 登録が不可能なため、ホストドメインへ安全にセッションを移行します...');
    location.href = BASE_URL + 'index.html';
    return;
  }

  // 4. 正しいドメイン上での Service Worker 強制アクティベート
  if ('serviceWorker' in navigator) {
    try {
      console.log('[Blink Engine] 🔄 Service Worker を登録して Cross-Origin Isolation を有効化します...');
      const reg = await navigator.serviceWorker.register(BASE_URL + 'coi-serviceworker.js', { scope: './' });
      
      // 登録完了後、ヘッダー適用のためリロード
      if (!navigator.serviceWorker.controller) {
        console.log('[Blink Engine] 🔄 リクエストヘッダー書き換えのためリロードを実行します...');
        location.reload();
        return;
      }
    } catch (err) {
      console.error('[Blink Engine] ❌ Service Worker 登録失敗:', err);
    }
  }
})();

function launchEmscripten(BASE_URL, canvas) {
  console.log('[Blink Engine] 📦 WebAssembly スレッドモジュールをロード中...');
  window.Module = {
    canvas: canvas,
    locateFile: (path) => BASE_URL + path,
    print: (text) => console.log(`[Stdout] ${text}`),
    printErr: (text) => console.error(`[Stderr] ${text}`),
    onRuntimeInitialized: () => {
      console.log('[Blink Engine] 🎉 Blink エミュレータ（マルチスレッド）が正常起動しました！');
    }
  };

  const script = document.createElement('script');
  script.src = BASE_URL + 'blink_app.js';
  document.head.appendChild(script);
}
