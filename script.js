// --- 設定エリア ---
const NEWS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/news.json";
const STATS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/visitors.json";
const BBS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/bbs"; 
const VERSION_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/version.json";
const EXPIRATION_MS = 15 * 24 * 60 * 60 * 1000; // 15日間

let allThreads = {};
let currentThreadId = null;
let currentUser = { 
    name: "未連携ユーザー", 
    avatar: "https://discord.com/assets/f7868894430a5359d052.png", 
    id: "000000" 
};

// --- 1. 訪問者数・お知らせ機能 ---
async function updateVisitorStats() {
    try {
        const todayStr = new Date().toLocaleDateString();
        const response = await fetch(STATS_URL);
        let stats = await response.json() || { total: 0, today: 0, yesterday: 0, lastUpdate: todayStr };
        
        if (stats.lastUpdate !== todayStr) {
            stats.yesterday = stats.today;
            stats.today = 0;
            stats.lastUpdate = todayStr;
        }

        let changed = false;
        if (!localStorage.getItem('ps_counted_total')) {
            stats.total++;
            localStorage.setItem('ps_counted_total', '1');
            changed = true;
        }
        if (localStorage.getItem('ps_last_day') !== todayStr) {
            stats.today++;
            localStorage.setItem('ps_last_day', todayStr);
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
    } catch(e) { console.error("Stats Error:", e); }
}

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
    } catch(e) { console.error("News Error:", e); }
}

// --- 2. Discord認証・ユーザー情報取得 ---
async function fetchDiscordUser() {
    const token = localStorage.getItem('discord_access_token');
    if (!token) return;
    try {
        const response = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.id) {
            currentUser = {
                name: data.username,
                id: data.id,
                avatar: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : currentUser.avatar
            };
            const statusText = document.getElementById('auth-status');
            if (statusText) {
                statusText.innerHTML = `
                    <div style="display:flex;align-items:center;gap:10px;color:#58a6ff;">
                        <img src="${currentUser.avatar}" style="width:30px;border-radius:50%;">
                        <span>✅ ${currentUser.name} | ${currentUser.id} として連携中</span>
                    </div>`;
            }
            const btn = document.getElementById('create-btn');
            if (btn) btn.disabled = false;
        }
    } catch(e) { console.error("Discord User Error:", e); }
}

// --- 3. 掲示板ロジック ---

// 一覧取得
async function fetchBBS() {
    const listContainer = document.getElementById('bbs-list');
    if (!listContainer) return;
    try {
        const res = await fetch(`${BBS_URL}.json`);
        allThreads = await res.json() || {};
        renderThreads(allThreads);
    } catch(e) { console.error("BBS Fetch Error:", e); }
}

// スレッド描画
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
            <div class="bbs-item" style="background:var(--section-bg); border:1px solid var(--border-color); padding:20px; border-radius:12px; margin-bottom:15px;">
                <div onclick="openThread('${id}')" style="cursor:pointer;">
                    <h3 style="margin:0; color:var(--accent-color);">${t.title}</h3>
                    <div style="color:#ffa500; font-size:0.8rem; margin:5px 0;">⏳ 削除まで残り: ${days}日</div>
                    <p style="color:#ccc; font-size:0.9rem;">${t.content.substring(0, 50)}...</p>
                </div>
                <div style="display:flex; align-items:center; gap:15px; margin-top:10px; border-top:1px solid #333; padding-top:10px;">
                    <button onclick="vote('${id}', 'up')" style="background:none; border:none; color:#58a6ff; cursor:pointer;">👍 ${t.upvotes || 0}</button>
                    <button onclick="vote('${id}', 'down')" style="background:none; border:none; color:#ff6b6b; cursor:pointer;">👎 ${t.downvotes || 0}</button>
                    <small style="color:gray; margin-left:auto;">投稿日: ${t.date}</small>
                </div>
            </div>`;
    });
}

// 評価機能 (1人1回制限・切り替え対応)
async function vote(id, type) {
    const token = localStorage.getItem('discord_access_token');
    if (!token) return alert("評価にはログインが必要です");

    const storageKey = `vote_${id}`;
    const currentVote = localStorage.getItem(storageKey); // 'up', 'down', null

    if (currentVote === type) {
        // 同じボタン：取り消し
        await updateVoteCount(id, type, -1);
        localStorage.removeItem(storageKey);
    } else if (currentVote && currentVote !== type) {
        // 別のボタン：切り替え
        await updateVoteCount(id, currentVote, -1);
        await updateVoteCount(id, type, 1);
        localStorage.setItem(storageKey, type);
    } else {
        // 初めての投票
        await updateVoteCount(id, type, 1);
        localStorage.setItem(storageKey, type);
    }
    fetchBBS();
}

async function updateVoteCount(threadId, type, change) {
    const key = type === 'up' ? 'upvotes' : 'downvotes';
    const currentVal = (allThreads[threadId][key] || 0);
    const newVal = Math.max(0, currentVal + change);
    await fetch(`${BBS_URL}/${threadId}/${key}.json`, {
        method: 'PUT',
        body: JSON.stringify(newVal)
    });
}

// スレッド詳細
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
            <span style="margin-left:auto;">投稿日: ${t.date}</span>
        </div>`;
    renderComments(t.comments);
}

// コメント描画
function renderComments(comments) {
    const container = document.getElementById('comment-list');
    container.innerHTML = "";
    if (!comments) return;
    Object.values(comments).forEach(c => {
        const isAuthor = (c.authorId === allThreads[currentThreadId].authorId);
        container.innerHTML += `
            <div class="comment-box" style="display:flex; gap:12px; align-items:flex-start; border-bottom:1px solid #333; padding:15px 0;">
                <img src="${c.authorIcon}" style="width:35px;border-radius:50%;">
                <div style="flex:1;">
                    <div style="font-size:0.8rem;">
                        <span style="color:var(--accent-color);font-weight:bold;">${c.author}</span>
                        <span style="color:gray;margin-left:5px;">| ${c.authorId}</span>
                        ${isAuthor ? '<span style="background:#5865F2;color:white;padding:2px 5px;border-radius:4px;font-size:0.6rem;margin-left:5px;">作成者</span>' : ''}
                    </div>
                    <p style="margin:5px 0; line-height:1.5;">${c.text}</p>
                    <small style="color:#555;">${c.date} 投稿</small>
                </div>
            </div>`;
    });
}

// 各種送信処理
async function submitThread() {
    const title = document.getElementById('new-title').value;
    const content = document.getElementById('new-content').value;
    if (!title || !content) return alert("入力してください");
    const thread = { 
        title, content, author: currentUser.name, authorId: currentUser.id, 
        authorIcon: currentUser.avatar, date: new Date().toLocaleString(), 
        lastActivity: new Date().toISOString(), upvotes: 0, downvotes: 0 
    };
    await fetch(`${BBS_URL}.json`, { method: 'POST', body: JSON.stringify(thread) });
    location.reload();
}

async function postComment() {
    const text = document.getElementById('comment-input').value;
    if (!text) return;
    const comment = { 
        text, author: currentUser.name, authorId: currentUser.id, 
        authorIcon: currentUser.avatar, date: new Date().toLocaleString() 
    };
    await fetch(`${BBS_URL}/${currentThreadId}/comments.json`, { method: 'POST', body: JSON.stringify(comment) });
    await fetch(`${BBS_URL}/${currentThreadId}/lastActivity.json`, { method: 'PUT', body: JSON.stringify(new Date().toISOString()) });
    location.reload();
}

async function deleteThreadAuto(id) { await fetch(`${BBS_URL}/${id}.json`, { method: 'DELETE' }); }
function backToList() { document.getElementById('bbs-main').style.display = 'block'; document.getElementById('thread-detail').style.display = 'none'; }

// 検索
const searchInput = document.getElementById('bbs-search');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const word = e.target.value.toLowerCase();
        const filtered = Object.fromEntries(Object.entries(allThreads).filter(([id, t]) => t.title.toLowerCase().includes(word)));
        renderThreads(filtered);
    });
}

// 起動
window.onload = async () => {
    updateVisitorStats();
    fetchNews();
    await fetchDiscordUser();
    fetchBBS();
};

const CHAT_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/chat.json";

// メッセージ送信
async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input || !input.value) return;

    // ローカルストレージから情報を取得
    const userData = JSON.parse(localStorage.getItem('discord_user'));
    
    // デフォルト値（未認証）
    let displayName = "***POS(PilotSkyOfficalSite)未認証ユーザー***";
    let displayIcon = "https://via.placeholder.com/30"; 

    // 認証済みなら上書き
    if (userData) {
        displayName = `***POS(PilotSkyOfficalSite)ユーザー: ${userData.global_name || userData.username}***`;
        if (userData.avatar) {
            displayIcon = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
        }
    }

    const msgData = {
        user: displayName,
        icon: displayIcon,
        text: input.value,
        timestamp: Date.now()
    };

    await fetch(CHAT_URL, { method: 'POST', body: JSON.stringify(msgData) });
    input.value = "";
    fetchChat();
}

// メッセージ表示
async function fetchChat() {
    const box = document.getElementById('chat-box');
    if (!box) return;

    const res = await fetch(CHAT_URL);
    const data = await res.json();
    if (!data) return;

    box.innerHTML = "";
    Object.values(data).forEach(m => {
        // アイコンがない古いデータへの対策
        const iconSrc = m.icon || "https://via.placeholder.com/30";
        
        box.innerHTML += `
            <div class="msg" style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px;">
                <img src="${iconSrc}" style="width:35px; height:35px; border-radius:50%; border: 1px solid #444;">
                <div>
                    <div class="msg-user" style="font-size: 0.8rem; color: #ffa500; font-weight: bold;">${m.user}</div>
                    <div class="msg-text" style="background: #222; padding: 8px 12px; border-radius: 0 10px 10px 10px; margin-top: 4px; color: #fff;">${m.text}</div>
                </div>
            </div>`;
    });
    box.scrollTop = box.scrollHeight;
}
