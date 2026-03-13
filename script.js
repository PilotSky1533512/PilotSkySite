const RAW_PASS = "rockopenit2mv9mt4ihqnym0wefa";
const ADMIN_ID = "PilotSky1533512";

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

    if (id === ADMIN_ID && pass === RAW_PASS) {
        alert("成功");
        window.location.href = "admin.html";
    } else {
        alert("失敗");
    }
}

window.onclick = (e) => {
    if (e.target == document.getElementById('login-modal')) hideLogin();
};
