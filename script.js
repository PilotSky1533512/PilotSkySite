// モード切り替え
const modeToggle = document.getElementById('mode-toggle');
if (modeToggle) {
    modeToggle.onclick = () => {
        document.body.classList.toggle('dark-mode');
    };
}

// お知らせを読み込む関数
function loadNews() {
    const newsListElement = document.getElementById('news-list-content');
    if (!newsListElement) return;

    // ローカルストレージからデータを取得
    const savedNews = localStorage.getItem('pilotSkyNews');
    if (savedNews) {
        const newsData = JSON.parse(savedNews);
        let html = "<ul>";
        newsData.forEach(item => {
            html += `<li><strong>${item.title}</strong> - ${item.content}</li>`;
        });
        html += "</ul>";
        newsListElement.innerHTML = html;
    }
}

// ページ読み込み時に実行
window.onload = loadNews;
