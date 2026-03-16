// --- 設定エリア ---
const NEWS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/news.json";
const STATS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/visitors.json";
const BBS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/bbs"; 
const EXPIRATION_MS = 15 * 24 * 60 * 60 * 1000; // 15日間

let allThreads = {};
let currentThreadId = null;
let currentUser = { name: "未連携ユーザー", avatar: "https://discord.com/assets/f7868894430a5359d052.png", id: "000000" };

// --- 1. 共通・訪問者数・お知らせ機能 ---
async function updateVisitorStats() {
    try {
        const todayStr = new Date().toLocaleDateString();
        const response = await fetch(STATS_URL);
        let stats = await response.json() || { total: 0, today: 0, yesterday: 0, lastUpdate: todayStr };
        if (stats.lastUpdate !== todayStr) { stats.yesterday = stats.today; stats.today = 0; stats.lastUpdate = todayStr; }
        if (!localStorage.getItem('counted_total')) { stats.total++; localStorage.setItem('counted_total', '1'); }
        if (localStorage.getItem('last_day') !== todayStr) { stats.today++; localStorage.setItem('last_day', todayStr); }
        await fetch(STATS_URL, { method: 'PUT', body: JSON.stringify(stats) });
        if (document.getElementById('total-visitors')) {
            document.getElementById('total-visitors').innerText = stats.total;
            document.getElementById('today-visitors').innerText = stats.today;
            document.getElementById('yesterday-visitors').innerText = stats.yesterday;
        }
    } catch(e){}
}

async function fetchNews() {
    const container = document.getElementById('news-container');
    if (!container) return;
    const res = await fetch(NEWS_URL);
    const data = await res.json();
    if (data) {
        container.innerHTML = "";
        Object.values(data).reverse().forEach(item => {
            container.innerHTML += `<div class="content-box"><h3>${item.title}</h3><p>${item.content}</p></div>`;
        });
    }
}

// --- 2. Discord認証・ユーザー取得 ---
async function fetchDiscordUser() {
    const token = localStorage.getItem('discord_access_token');
    if (!token) return;
    try {
        const response = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (data.id) {
            currentUser = { name: data.username, id: data.id, avatar: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : currentUser.avatar };
            const statusText = document.getElementById('auth-status');
            if (statusText) {
                statusText.innerHTML = `<div style="display:flex;align-items:center;gap:10px;color:#58a6ff;"><img src="${currentUser.avatar}" style="width:30px;border-radius:50%;"><span>✅ ${currentUser.name} | ${currentUser.id} として連携中</span></div>`;
            }
            const btn = document.getElementById('create-btn');
            if (btn) btn.disabled = false;
        }
    } catch(e){}
}

// --- 3. 掲示板メインロジック ---
async function fetchBBS() {
    const listContainer = document.getElementById('bbs-list');
    if (!listContainer) return;
    try {
        const res = await fetch(`${BBS_URL}.json`);
        allThreads = await res.json() || {};
        renderThreads(allThreads);
    } catch(e){}
}

function renderThreads(threadsObj) {
    const listContainer = document.getElementById('bbs-list');
    listContainer.innerHTML = "";
    const now = Date.now();

    Object.keys(threadsObj).reverse().forEach(id => {
        const t = threadsObj[id];
        const lastAct = t.lastActivity ? new Date(t.lastActivity).getTime() : new Date(t.date).getTime();
        const remainingMs = EXPIRATION_MS - (now - lastAct);

        if (remainingMs <= 0) { deleteThreadAuto(id); return; }
        const days = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

        listContainer.innerHTML += `
            <div class="bbs-item">
                <div onclick="openThread('${id}')" style="cursor:pointer;">
                    <h3 style="margin:0; color:var(--accent-color);">${t.title}</h3>
                    <div style="color:#ffa500; font-size:0.8rem; margin:5px 0;">⏳ 削除まで残り: ${days}日</div>
                    <p style="color:#ccc; font-size:0.9rem;">${t.content.substring(0, 40)}...</p>
                </div>
                <div style="display:flex; align-items:center; gap:15px; margin-top:10px; border-top:1px solid #333; padding-top:10px;">
                    <button onclick="vote('${id}', 'up')" style="background:none; border:none; color:#58a6ff; cursor:pointer;">👍 ${t.upvotes || 0}</button>
                    <button onclick="vote('${id}', 'down')" style="background:none; border:none; color:#ff6b6b; cursor:pointer;">👎 ${t.downvotes || 0}</button>
                    <small style="color:gray; margin-left:auto;">${t.date}</small>
                </div>
            </div>`;
    });
}

async function submitThread() {
    const title = document.getElementById('new-title').value;
    const content = document.getElementById('new-content').value;
    if (!title || !content) return alert("入力してください");
    const thread = { title, content, author: currentUser.name, authorId: currentUser.id, authorIcon: currentUser.avatar, date: new Date().toLocaleString(), lastActivity: new Date().toISOString(), upvotes: 0, downvotes: 0 };
    await fetch(`${BBS_URL}.json`, { method: 'POST', body: JSON.stringify(thread) });
    location.reload();
}

function openThread(id) {
    currentThreadId = id;
    const t = allThreads[id];
    document.getElementById('bbs-main').style.display = 'none';
    document.getElementById('thread-detail').style.display = 'block';
    document.getElementById('detail-title').innerText = t.title;
    document.getElementById('detail-content').innerText = t.content;
    document.getElementById('detail-meta').innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-top:10px;font-size:0.9rem;color:gray;">
            <img src="${t.authorIcon}" style="width:25px;border-radius:50%;">
            <span>${t.author} | ${t.authorId} <span style="background:#5865F2;color:white;padding:2px 5px;border-radius:4px;font-size:0.7rem;">作成者</span></span>
            <span style="margin-left:auto;">${t.date}</span>
        </div>`;
    renderComments(t.comments);
}

function renderComments(comments) {
    const container = document.getElementById('comment-list');
    container.innerHTML = "";
    if (!comments) return;
    Object.values(comments).forEach(c => {
        const isAuthor = (c.authorId === allThreads[currentThreadId].authorId);
        container.innerHTML += `
            <div class="comment-box">
                <img src="${c.authorIcon}" style="width:35px;border-radius:50%;">
                <div style="flex:1;">
                    <div style="font-size:0.8rem;">
                        <span style="color:var(--accent-color);font-weight:bold;">${c.author}</span>
                        <span style="color:gray;margin-left:5px;">| ${c.authorId}</span>
                        ${isAuthor ? '<span style="background:#5865F2;color:white;padding:2px 5px;border-radius:4px;font-size:0.6rem;margin-left:5px;">作成者</span>' : ''}
                    </div>
                    <p style="margin:5px 0;">${c.text}</p>
                    <small style="color:#555;">${c.date}</small>
                </div>
            </div>`;
    });
}

async function postComment() {
    const text = document.getElementById('comment-input').value;
    if (!text) return;
    const comment = { text, author: currentUser.name, authorId: currentUser.id, authorIcon: currentUser.avatar, date: new Date().toLocaleString() };
    await fetch(`${BBS_URL}/${currentThreadId}/comments.json`, { method: 'POST', body: JSON.stringify(comment) });
    await fetch(`${BBS_URL}/${currentThreadId}/lastActivity.json`, { method: 'PUT', body: JSON.stringify(new Date().toISOString()) });
    location.reload();
}

async function vote(id, type) {
    if (!localStorage.getItem('discord_access_token')) return alert("ログインが必要です");
    const key = type === 'up' ? 'upvotes' : 'downvotes';
    const val = (allThreads[id][key] || 0) + 1;
    await fetch(`${BBS_URL}/${id}/${key}.json`, { method: 'PUT', body: JSON.stringify(val) });
    fetchBBS();
}

async function deleteThreadAuto(id) { await fetch(`${BBS_URL}/${id}.json`, { method: 'DELETE' }); }
function backToList() { document.getElementById('bbs-main').style.display = 'block'; document.getElementById('thread-detail').style.display = 'none'; }

// --- 起動 ---
window.onload = async () => {
    updateVisitorStats();
    fetchNews();
    await fetchDiscordUser();
    fetchBBS();
};
