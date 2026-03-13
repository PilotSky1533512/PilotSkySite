// シンプルなログイン機能
function checkLogin() {
    const id = document.getElementById('admin-id').value;
    const pass = document.getElementById('admin-pass').value;

    if (id === "admin" && pass === "1234") {
        alert("成功しました！");
        window.location.href = "admin.html";
    } else {
        alert("失敗：入力されたID=" + id + " パス=" + pass);
    }
}

// モード切り替え
document.getElementById('mode-toggle').onclick = () => {
    document.body.classList.toggle('dark-mode');
};

function showLogin() {
    document.getElementById('login-modal').style.display = 'block';
}

function hideLogin() {
    document.getElementById('login-modal').style.display = 'none';
}
