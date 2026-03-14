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

// トップへ戻るボタンの処理
const topButton = document.getElementById('top-button');

if (topButton) {
    topButton.onclick = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // スルスルと動くアニメーション
        });
    };
}

// --- リアルタイム更新監視機能 ---
// Firebaseのデータ(news.json)を監視
const FIREBASE_NEWS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/news.json";

// ページを読み込んだ時の最初のデータの状態を保存
let lastKnownData = null;

async function watchServerUpdate() {
    // 5秒ごとにサーバーに「更新された？」と聞きに行く
    setInterval(async () => {
        try {
            const response = await fetch(FIREBASE_NEWS_URL);
            const data = await response.json();
            const dataString = JSON.stringify(data);

            if (lastKnownData === null) {
                lastKnownData = dataString;
                return;
            }

            // もしサーバーのデータが、今持っているデータと変わっていたら
            if (lastKnownData !== dataString) {
                showUpdateModal();
                lastKnownData = dataString; // 何度も出ないように更新
            }
        } catch (e) {
            console.error("更新チェックエラー", e);
        }
    }, 5000); // 5秒間隔（短すぎると負荷がかかるので5秒がおすすめ）
}

// 画面中央に通知を出す
function showUpdateModal() {
    // すでに通知が出ていたら作らない
    if (document.getElementById('update-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'update-modal';
    modal.innerHTML = `
        <div class="update-content">
            <h2>📢 お知らせが更新されました</h2>
            <p>サーバーのデータが更新されました。最新の情報を読みこんでください。</p>
            <button onclick="location.reload()">再読み込み</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// 起動
watchServerUpdate();
