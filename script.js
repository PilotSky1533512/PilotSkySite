const NEWS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/news.json";
const STATS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/visitors.json";

// 1. 訪問者数カウント
async function updateVisitorStats() {
    try {
        const todayStr = new Date().toLocaleDateString();
        const TOTAL_KEY = 'ps_total_vfinal';
        const DAILY_KEY = 'ps_daily_vfinal';

        const hasCountedTotal = localStorage.getItem(TOTAL_KEY);
        const lastDailyVisit = localStorage.getItem(DAILY_KEY);

        const response = await fetch(STATS_URL);
        let stats = await response.json() || { total: 0, today: 0, yesterday: 0, lastUpdate: todayStr };

        // 数値の保証
        stats.total = Number(stats.total) || 0;
        stats.today = Number(stats.today) || 0;
        stats.yesterday = Number(stats.yesterday) || 0;

        if (stats.lastUpdate !== todayStr) {
            stats.yesterday = stats.today;
            stats.today = 0;
            stats.lastUpdate = todayStr;
        }

        let changed = false;
        if (!hasCountedTotal) {
            stats.total += 1;
            localStorage.setItem(TOTAL_KEY, "true");
            changed = true;
        }
        if (lastDailyVisit !== todayStr) {
            stats.today += 1;
            localStorage.setItem(DAILY_KEY, todayStr);
            changed = true;
        }

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

// 2. お知らせ取得
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
                container.innerHTML += `
                <div class="content-box">
                    <h3 style="color:#58a6ff; margin-top:0;">${item.title}</h3>
                    <p style="margin-bottom:0;">${item.content}</p>
                </div>`;
            });
        }
    } catch (e) { 
        if(container) container.innerHTML = "お知らせを読み込めませんでした。"; 
    }
}

// ページ読み込み時に実行
window.onload = () => {
    updateVisitorStats();
    fetchNews();
};
