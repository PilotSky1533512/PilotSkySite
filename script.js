// --- 設定エリア ---
const NEWS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/news.json";
const STATS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/visitors.json";
// 掲示板用URL（仮：Firebaseにbbsノードを作成する場合）
const BBS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/bbs.json";

// --- 1. 訪問者数カウント ---
async function updateVisitorStats() {
    try {
        const todayStr = new Date().toLocaleDateString();
        const TOTAL_KEY = 'ps_total_vfinal';
        const DAILY_KEY = 'ps_daily_vfinal';

        const hasCountedTotal = localStorage.getItem(TOTAL_KEY);
        const lastDailyVisit = localStorage.getItem(DAILY_KEY);

        const response = await fetch(STATS_URL);
        let stats = await response.json() || { total: 0, today: 0, yesterday: 0, lastUpdate: todayStr };

        if (stats.lastUpdate !== todayStr) {
            stats.yesterday = stats.today;
            stats.today = 0;
            stats.lastUpdate = todayStr;
        }

        let changed = false;
        if (!hasCountedTotal) { stats.total += 1; localStorage.setItem(TOTAL_KEY, "true"); changed = true; }
        if (lastDailyVisit !== todayStr) { stats.today += 1; localStorage.setItem(DAILY_KEY, todayStr); changed = true; }

        if (changed) {
            await fetch(STATS_URL, { method: 'PUT', body: JSON.stringify(stats) });
        }

        if (document.getElementById('total-visitors')) {
            document.getElementById('total-visitors').innerText = stats.total;
            document.getElementById('today-visitors').innerText = stats.today;
            document.getElementById('yesterday-visitors').innerText = stats.yesterday;
        }
    } catch (e) { console.error("Stats Error:", e); }
}

// --- 2. お知らせ取得 ---
async function fetchNews() {
    const container = document.getElementById('news-container');
    if (!container) return;
    try {
        const res = await fetch(NEWS_URL);
        const data = await res.json();
        if (data) {
            container.innerHTML = "";
            const list = Array.isArray(data) ? data : Object.values(data);
            list.reverse().forEach(item => {
                container.innerHTML += `<div class="content-box"><h3>${item.title}</h3><p>${item.content}</p></div>`;
            });
        }
    } catch (e) { console.error("News Error:", e); }
}

// --- 3. 掲示板システム ---
let allThreads = []; // 全スレッド保持用

async function fetchBBS() {
    const listContainer = document.getElementById('bbs-list');
    if (!listContainer) return;

    try {
        const res = await fetch(BBS_URL);
        const data = await res.json();
        allThreads = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        renderThreads(allThreads);
    } catch (e) {
        listContainer.innerHTML = "<p>掲示板データを読み込めませんでした。</p>";
    }
}

function renderThreads(threads) {
    const listContainer = document.getElementById('bbs-list');
    if (!listContainer) return;
    listContainer.innerHTML = "";

    threads.reverse().forEach(t => {
        listContainer.innerHTML += `
            <div class="bbs-item" style="background:var(--section-bg); border:1px solid var(--border-color); padding:15px; border-radius:10px; margin-bottom:10px;">
                <h3 style="margin:0; color:var(--accent-color);">${t.title}</h3>
                <p style="margin:5px 0;">${t.content}</p>
                <small style="color:gray;">投稿者: ${t.author || '不明'} | ${t.date || ''}</small>
            </div>`;
    });
}

// 掲示板検索機能
const searchInput = document.getElementById('bbs-search');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const word = e.target.value.toLowerCase();
        const filtered = allThreads.filter(t => t.title.toLowerCase().includes(word));
        renderThreads(filtered);
    });
}

// 掲示板：ログイン（連携）状態のチェック
function checkBBSAuth() {
    const token = localStorage.getItem('discord_access_token');
    const statusText = document.getElementById('auth-status');
    const createBtn = document.getElementById('create-btn');

    if (token) {
        if (statusText) {
            statusText.innerText = "✅ Discord連携済み：書き込み可能です";
            statusText.style.color = "#58a6ff";
        }
        if (createBtn) createBtn.disabled = false;
    }
}

// --- ページ読み込み時の実行 ---
window.onload = () => {
    updateVisitorStats();
    fetchNews();
    fetchBBS();
    checkBBSAuth();
};
