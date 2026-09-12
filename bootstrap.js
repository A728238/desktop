// dist/bootstrap.js
(async function initBlinkBootstrap() {
  const BASE_URL = 'https://a728238.github.io/desktop/';

  console.log('[Blink Bootstrap] 🚀 初期化処理を開始します...');

  // 1. DOM/Canvas の自動生成とスタイル適用
  let canvas = document.getElementById('canvas');
  if (!canvas) {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#000';
    document.body.style.overflow = 'hidden';

    canvas = document.createElement('canvas');
    canvas.id = 'canvas';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.display = 'block';
    document.body.appendChild(canvas);
    console.log('[Blink Bootstrap] 🎨 Canvas 要素を生成・挿入しました');
  }

  // 2. SharedArrayBuffer (Pthreads) の有効性チェック & 自動アクティベーション
  if (!window.crossOriginIsolated) {
    console.warn('[Blink Bootstrap] ⚠️ crossOriginIsolated が false です。coi-serviceworker の登録を試みます...');

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(BASE_URL + 'coi-serviceworker.js', { scope: './' });
        console.log('[Blink Bootstrap] ✅ Service Worker 登録成功:', registration.scope);

        // Service Worker の更新をチェック
        registration.addEventListener('updatefound', () => {
          console.log('[Blink Bootstrap] 🔄 Service Worker の更新を検出しました。再起動します...');
          location.reload();
        });

        // about:blank 等でスコープ分離により環境が作れない場合は index.html へフォールバック遷移
        if (location.protocol === 'about:' || location.origin === 'null') {
          console.warn('[Blink Bootstrap] 🔀 about:blank 環境のため、完全な Isolated 環境を持つ index.html に遷移します...');
          location.href = BASE_URL + 'index.html';
          return;
        }

        // 初回登録時はヘッダー付与のためリロード
        console.log('[Blink Bootstrap] 🔄 リクエストヘッダー適用のためページをリロードします...');
        location.reload();
        return;
      } catch (err) {
        console.error('[Blink Bootstrap] ❌ Service Worker 登録失敗:', err);
        console.warn('[Blink Bootstrap] 🔀 ホストページへリダイレクトします...');
        location.href = BASE_URL + 'index.html';
        return;
      }
    } else {
      console.error('[Blink Bootstrap] ❌ お使いの環境は Service Worker に対応していません。');
      return;
    }
  }

  console.log('[Blink Bootstrap] ✨ crossOriginIsolated: true (Pthreads/SharedArrayBuffer が有効です)');

  // 3. Emscripten Module オブジェクトの定義
  window.Module = {
    canvas: canvas,
    locateFile: (path) => {
      const url = BASE_URL + path;
      console.log(`[Blink Loader] リソース読み込み: ${path} -> ${url}`);
      return url;
    },
    print: (text) => console.log(`[Blink Stdout] ${text}`),
    printErr: (text) => console.error(`[Blink Stderr] ${text}`),
    onRuntimeInitialized: () => {
      console.log('[Blink Engine] 🎉 WebAssembly ランタイムの初期化が完了しました！');
    }
  };

  // 4. メイン JS (blink_app.js) の動的読み込み
  console.log('[Blink Bootstrap] 📦 blink_app.js の読み込みを開始します...');
  const mainScript = document.createElement('script');
  mainScript.src = BASE_URL + 'blink_app.js';
  mainScript.onload = () => console.log('[Blink Bootstrap] ✅ blink_app.js のスクリプトタグ読み込みが完了しました');
  mainScript.onerror = (e) => console.error('[Blink Bootstrap] ❌ blink_app.js の読み込みに失敗しました', e);
  document.head.appendChild(mainScript);
})();
