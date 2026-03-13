// テスト用にパスワードを「1234」にしています
const RAW_PASS = "1234";
const ADMIN_ID = "pilo";

// モード切り替え
document.getElementById('mode-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

function showLogin() {
    document.getElementById('login-modal').style.display = 'block';
}

function hideLogin() {
    document.getElementById('login-modal').style.display = 'none';
}

function checkLogin() {
    const id = document.getElementById('admin-id').value.trim();
    const pass = document.getElementById('admin-pass').value.trim();

    // 入力された値を画面に表示して確認する
    console.log("入力ID:", id);
    console.log("入力パス:", pass);

    if (id === ADMIN_ID && pass === RAW_PASS) {
        alert("成功！admin.htmlへ飛びます");
        window.location.href = "admin.html";
    } else {
        alert("失敗\n入力されたID: " + id + "\n入力されたパス: " + pass);
    }
}

window.onclick = (e) => {
    if (e.target == document.getElementById('login-modal')) hideLogin();
};
