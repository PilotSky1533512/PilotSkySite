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
