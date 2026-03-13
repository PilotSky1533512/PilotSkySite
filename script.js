// 1. ダークモード切り替え機能
const modeToggle = document.getElementById('mode-toggle');
modeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

// 2. 管理者ログイン関連の設定
// パスワードをハッシュ化（SHA-256）して保存し、中身を見られてもバレないようにします
const HASHED_PASS = "d57608151068832103f56f10359f42df522d713c8f8b8849646b1076615b677a";
const ADMIN_ID = "PilotSky1533512";

function showLogin() {
    document.getElementById('login-modal').style.display = 'block';
}

function hideLogin() {
    document.getElementById('login-modal').style.display = 'none';
}

// ログイン判定
async function checkLogin() {
    const idInput = document.getElementById('admin-id').value;
    const passInput = document.getElementById('admin-pass').value;

    // 入力されたパスワードをハッシュ化する処理
    const msgUint8 = new TextEncoder().encode(passInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (idInput === ADMIN_ID && hashHex === HASHED_PASS) {
        alert("認証成功。管理者パネルへ移動します。");
        // 管理者ページのファイル名に合わせて変更してください
        window.location.href = "admin.html";
    } else {
        alert("IDまたはパスワードが正しくありません。");
    }
}

// モーダルの外側をクリックしたら閉じる
window.onclick = function(event) {
    const modal = document.getElementById('login-modal');
    if (event.target == modal) {
        hideLogin();
    }
}
