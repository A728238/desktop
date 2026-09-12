// dist/bootstrap.js
(function() {
  const baseUrl = 'https://<YOUR_GITHUB_USERNAME>.github.io/<REPO_NAME>/';
  
  // Canvas 要素の設定
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.backgroundColor = '#000';
  
  let canvas = document.getElementById('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'canvas';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    document.body.appendChild(canvas);
  }

  // coi-serviceworker の読み込み
  const coiScript = document.createElement('script');
  coiScript.src = baseUrl + 'coi-serviceworker.js';
  coiScript.setAttribute('data-coi', '');
  document.head.appendChild(coiScript);

  // Emscripten Module の定義
  window.Module = {
    canvas: canvas,
    locateFile: function(path) {
      if (path.endsWith('.wasm')) return baseUrl + 'blink_app.wasm';
      return baseUrl + path;
    }
  };

  // メイン JS の読み込み
  const mainScript = document.createElement('script');
  mainScript.src = baseUrl + 'blink_app.js';
  document.head.appendChild(mainScript);
})();