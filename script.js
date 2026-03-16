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

// --- リアルタイム更新監視機能 (修正版) ---
const FIREBASE_NEWS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/news.json";

let currentDataHash = null;

async function watchServerUpdate() {
    // 起動時に現在のデータを取得して「今の状態」を覚えさせる
    try {
        const firstRes = await fetch(FIREBASE_NEWS_URL);
        const firstData = await firstRes.json();
        currentDataHash = JSON.stringify(firstData);
    } catch (e) {
        console.error("初期取得エラー", e);
    }

    // 3秒ごとにチェック（テストのため少し早めます）
    setInterval(async () => {
        try {
            const response = await fetch(FIREBASE_NEWS_URL);
            const newData = await response.json();
            const newDataString = JSON.stringify(newData);

            // currentDataHashがまだ空なら覚えさせる
            if (!currentDataHash) {
                currentDataHash = newDataString;
                return;
            }

            // 【重要】保存されているデータと、今取得したデータが違ったら通知
            if (currentDataHash !== newDataString) {
                console.log("データ更新を検知しました！");
                showUpdateModal();
                // 連続で出ないように、現在の状態を最新に更新する
                currentDataHash = newDataString;
            }
        } catch (e) {
            console.log("監視中...");
        }
    }, 3000); 
}

function showUpdateModal() {
    if (document.getElementById('update-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'update-modal';
    modal.innerHTML = `
        <div class="update-content">
            <h2>📢 サーバーデータ更新</h2>
            <p>サーバーデータが更新されました。<br>最新の状態を表示するために再読み込みしてください。</p>
            <button onclick="location.reload()">再読み込み</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// 忘れずに起動
watchServerUpdate();

// script.js の監視部分をこれに差し替え
const VERSION_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/version.json";
let currentVersion = null;

async function watchSiteUpdate() {
    setInterval(async () => {
        try {
            const res = await fetch(VERSION_URL);
            const serverVersion = await res.json();

            if (currentVersion === null) {
                currentVersion = serverVersion;
                return;
            }

            // サーバーのバージョン番号が変わったら、コードが更新されたとみなす
            if (currentVersion !== serverVersion) {
                showUpdateModal(); // 「再読み込み」ボタンを出す
                currentVersion = serverVersion;
            }
        } catch (e) { }
    }, 5000);
}
watchSiteUpdate();

const STATS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/visitors.json";

async function updateVisitorStats() {
    try {
        const todayStr = new Date().toLocaleDateString(); // 例: "2026/3/16"
        
        // ローカルストレージから記録を取得
        const hasCountedTotal = localStorage.getItem('hasCountedTotal'); // 総訪問カウント済みか
        const lastVisitDate = localStorage.getItem('lastVisitDate');    // 最後に「本日」分をカウントした日

        // 1. サーバーから現在のデータを取得
        const response = await fetch(STATS_URL);
        let stats = await response.json();

        if (!stats) {
            stats = { total: 0, today: 0, yesterday: 0, lastUpdate: todayStr };
        }

        // 2. 日付が変わっている場合の処理（サーバーデータの更新）
        // 夜中0時を過ぎて誰かが最初にアクセスした時、前日のデータを「昨日」に移動
        if (stats.lastUpdate !== todayStr) {
            stats.yesterday = stats.today;
            stats.today = 0;
            stats.lastUpdate = todayStr;
        }

        let needsUpdate = false;

        // 3. 総訪問者数のカウント（このPCで一度もカウントしていない場合のみ）
        if (!hasCountedTotal) {
            stats.total += 1;
            localStorage.setItem('hasCountedTotal', 'true'); // 記録：一生に一度
            needsUpdate = true;
        }

        // 4. 本日の訪問者数のカウント（このPCで今日まだカウントしていない場合のみ）
        if (lastVisitDate !== todayStr) {
            stats.today += 1;
            localStorage.setItem('lastVisitDate', todayStr); // 記録：今日は完了
            needsUpdate = true;
        }

        // 5. データが更新された場合のみサーバーに保存
        if (needsUpdate) {
            await fetch(STATS_URL, {
                method: 'PUT',
                body: JSON.stringify(stats)
            });
        }

        // 6. 画面に反映
        document.getElementById('today-visitors').innerText = stats.today;
        document.getElementById('yesterday-visitors').innerText = stats.yesterday;
        document.getElementById('total-visitors').innerText = stats.total;

    } catch (e) {
        console.error("統計更新エラー:", e);
    }
}

updateVisitorStats();
