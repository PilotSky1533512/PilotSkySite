// モード切り替え
const modeToggle = document.getElementById('mode-toggle');
if (modeToggle) {
    modeToggle.onclick = () => document.body.classList.toggle('dark-mode');
}

// Firebaseからお知らせを読み込む
async function loadNews() {
    const newsListContent = document.getElementById('news-list-content');
    if (!newsListContent) return;

    // あなたのFirebase URL (末尾に /news.json を追加)
    const FIREBASE_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/news.json";

    try {
        const response = await fetch(FIREBASE_URL);
        const newsData = await response.json();
        
        if (newsData && newsData.length > 0) {
            let html = "<ul>";
            newsData.forEach(item => {
                html += `<li><strong>${item.title}</strong> - ${item.content}</li>`;
            });
            html += "</ul>";
            newsListContent.innerHTML = html;
        } else {
            // データが空の場合の初期表示
            newsListContent.innerHTML = "<ul><li>お知らせはありません。</li></ul>";
        }
    } catch (e) {
        console.error("読み込みエラー:", e);
        newsListContent.innerHTML = "<p>お知らせの読み込みに失敗しました。</p>";
    }
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', loadNews);
