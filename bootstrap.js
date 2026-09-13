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

  // 2. crossOriginIsolated が成立している場合（マルチスレッド有効）
  if (window.crossOriginIsolated) {
    console.log('[Blink Engine] ✨ crossOriginIsolated: true (Pthreads 有効)');
    launchEmscripten(BASE_URL, canvas);
    return;
  }

  // 3. 外部 URL アクセスが遮断されている環境向けの「同調メモリ書き換えバイパス」
  console.warn('[Blink Engine] ⚠️ Isolation 未有効。外部リダイレクトを行わず現在の Document を動的昇格します...');

  // ネットワーク通信を介さず Service Worker 用コードを Blob 生成
  const coiWorkerCode = `
    self.addEventListener('install', () => self.skipWaiting());
    self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
    self.addEventListener('fetch', (event) => {
      if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;
      event.respondWith(
        fetch(event.request).then((response) => {
          if (response.status === 0) return response;
          const newHeaders = new Headers(response.headers);
          newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
          newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
          return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
        })
      );
    });
  `;

  if ('serviceWorker' in navigator && location.protocol !== 'about:') {
    try {
      const blob = new Blob([coiWorkerCode], { type: 'text/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      await navigator.serviceWorker.register(blobUrl, { scope: './' });
      
      if (!navigator.serviceWorker.controller) {
        console.log('[Blink Engine] 🔄 coi-serviceworker をインメモリ適用して再読み込みします...');
        location.reload();
        return;
      }
    } catch (e) {
      console.warn('[Blink Engine] インメモリ ServiceWorker 登録不可。シングルスレッドフォールバックへ進みます', e);
    }
  }

  // 4. 完全に隔離されたコンテキスト（about:blank 等）の場合
  // 外部 index.html に飛ばず、現在の Document をインプレースで上書き
  console.log('[Blink Engine] ⚡ ホスト画面をインメモリ描画します');
  launchEmscripten(BASE_URL, canvas);
})();

function launchEmscripten(BASE_URL, canvas, targetProgram = null) {
  // Blink に渡すコマンドライン引数を設定（プログラムが指定されていなければヘルプ回避）
  const programArgs = targetProgram ? [targetProgram] : ['/bin/hello'];

  window.Module = {
    canvas: canvas,
    arguments: programArgs, // 引数を配列で渡す（例: ["/bin/hello"]）
    locateFile: (path) => BASE_URL + path,
    print: (text) => console.log(`[Blink] ${text}`),
    printErr: (text) => console.error(`[Blink Err] ${text}`),
    preRun: [function(m) {
      // 仮想ファイルシステム (FS) にテスト用 x86_64 バイナリ等を置く場合に使用可能
      console.log('[Blink FS] 仮想ファイルシステムを初期化中...');
    }],
    onRuntimeInitialized: () => {
      console.log('[Blink Engine] 🎉 実行準備が完了しました');
    }
  };

  const script = document.createElement('script');
  script.src = BASE_URL + 'blink_app.js';
  document.head.appendChild(script);
}
