// 1. 設定情報
// 「rockopenit2mv9mt4ihqnym0wefa」を暗号化したもの
const HASHED_PASS = "d57608151068832103f56f10359f42df522d713c8f8b8849646b1076615b677a";
const ADMIN_ID = "PilotSky1533512";

// 2. ダークモード切り替え
const modeToggle = document.getElementById('mode-toggle');
if (modeToggle) {
    modeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });
}

// 3. ログインモーダルの表示・非表示
function showLogin() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.style.display = 'block';
}

function hideLogin() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.style.display = 'none';
}

// 4. ログイン判定（診断機能付き）
async function checkLogin() {
    const idInput = document.getElementById('admin-id').value.trim();
    const passInput = document.getElementById('admin-pass').value.trim();

    // --- 診断ステップ 1: IDチェック ---
    if (idInput !== ADMIN_ID) {
        alert("❌ IDが違います。\n入力されたID: [" + idInput + "]");
        return;
    }

    // --- 診断ステップ 2: セキュリティ環境チェック ---
    // 暗号化機能(crypto.subtle)は HTTPS 環境でないと動きません
    if (!window.isSecureContext) {
        alert("⚠️ エラー: 安全な接続(HTTPS)ではありません。\n\n自分のPCでファイルを開いていませんか？\nGitHubにアップロードして、https://... で始まるURLから試してください。");
        return;
    }

    try {
        // パスワードをハッシュ化（SHA-256）
        const msgUint8 = new TextEncoder().encode(passInput);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // --- 診断ステップ 3: パスワード（ハッシュ）チェック ---
        if (hashHex === HASHED_PASS) {
            alert("✅ 認証成功！管理者パネルへ移動します。");
            window.location.href = "admin.html"; 
        } else {
            alert("❌ パスワードが違います。\n\n入力されたパスのハッシュ:\n" + hashHex + "\n\n(正しいハッシュと比較して一致しませんでした)");
        }
    } catch (e) {
        alert("エラーが発生しました: " + e.message);
    }
}

// モーダルの外側をクリックしたら閉じる
window.onclick = function(event) {
    const modal = document.getElementById('login-modal');
    if (event.target == modal) {
        hideLogin();
    }
}
