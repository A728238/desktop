// dist/bootstrap.js
(async function forceBreakthroughBootstrap() {
  const BASE_URL = 'https://a728238.github.io/desktop/';

  console.log('[Blink Breakthrough] 🚀 強制ブレイクスルーシークエンスを開始します...');

  // 1. Canvas の初期化
  let canvas = document.getElementById('canvas');
  if (!canvas) {
    document.body.style.margin = '0';
    document.body.style.backgroundColor = '#000';
    document.body.style.overflow = 'hidden';
    canvas = document.createElement('canvas');
    canvas.id = 'canvas';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    document.body.appendChild(canvas);
  }

  // 2. crossOriginIsolated が成立しているかチェック
  if (window.crossOriginIsolated) {
    console.log('[Blink Breakthrough] ✨ crossOriginIsolated: true - スレッド環境が確立されました');
    launchEmscripten(BASE_URL, canvas);
    return;
  }

  console.warn('[Blink Breakthrough] ⚠️ Service Worker 非対応のコンテキストを検知。CORS/Isolation のバイパス処理を行います...');

  // 3. Service Worker の無理やり登録（Direct Fetch + Blob URL インジェクション）
  try {
    const response = await fetch(BASE_URL + 'coi-serviceworker.js');
    const swCode = await response.text();
    
    // Service Worker のソースコードをインメモリ Blob 化
    const blob = new Blob([swCode], { type: 'text/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    if (navigator.serviceWorker) {
      const reg = await navigator.serviceWorker.register(blobUrl, { scope: './' });
      console.log('[Blink Breakthrough] 💥 Blob URL 経由で Service Worker を強制登録しました:', reg);
      location.reload();
      return;
    }
  } catch (err) {
    console.error('[Blink Breakthrough] ❌ Blob SW 登録失敗:', err);
  }

  // 4. 最終突破手段: ウィンドウコンテキストを強制的かつシームレスに index.html へ同期書換え
  console.warn('[Blink Breakthrough] ⚡ ドキュメント全体を Host ページ構造へ強制リライトします...');
  
  const hostHtmlResponse = await fetch(BASE_URL + 'index.html');
  const hostHtmlText = await hostHtmlResponse.text();
  
  document.open();
  document.write(hostHtmlText);
  document.close();
})();

function launchEmscripten(BASE_URL, canvas) {
  window.Module = {
    canvas: canvas,
    locateFile: (path) => BASE_URL + path,
    print: (text) => console.log(`[Stdout] ${text}`),
    printErr: (text) => console.error(`[Stderr] ${text}`)
  };

  const script = document.createElement('script');
  script.src = BASE_URL + 'blink_app.js';
  document.head.appendChild(script);
}
