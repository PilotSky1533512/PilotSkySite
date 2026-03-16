// --- 設定エリア ---
const NEWS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/news.json";
const STATS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/visitors.json";
const BBS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/bbs"; // .jsonはfetch時に付与

let allThreads = {}; 
let currentThreadId = null;

// --- 1. 訪問者数・お知らせ (省略せずに維持してください) ---
async function updateVisitorStats() { /* 以前のコードと同じ */ }
async function fetchNews() { /* 以前のコードと同じ */ }

// --- 2. 掲示板システム ---

// スレッド一覧取得
async function fetchBBS() {
    const listContainer = document.getElementById('bbs-list');
    if (!listContainer) return;

    try {
        const res = await fetch(`${BBS_URL}.json`);
        allThreads = await res.json() || {};
        renderThreads(allThreads);
    } catch (e) { console.error("BBS Fetch Error:", e); }
}

// スレッド一覧の描画
function renderThreads(threadsObj) {
    const listContainer = document.getElementById('bbs-list');
    if (!listContainer) return;
    listContainer.innerHTML = "";

    Object.keys(threadsObj).reverse().forEach(id => {
        const t = threadsObj[id];
        listContainer.innerHTML += `
            <div class="bbs-item" onclick="openThread('${id}')" style="background:var(--section-bg); border:1px solid var(--border-color); padding:15px; border-radius:10px; margin-bottom:10px; cursor:pointer;">
                <h3 style="margin:0; color:var(--accent-color);">${t.title}</h3>
                <p style="margin:5px 0; color:#ccc;">${t.content.substring(0, 30)}...</p>
                <small style="color:gray;">投稿者: ${t.author} | ${t.date}</small>
            </div>`;
    });
}

// 新規スレッド投稿 (保存処理)
async function submitThread() {
    const title = document.getElementById('new-title').value;
    const content = document.getElementById('new-content').value;
    const token = localStorage.getItem('discord_access_token');

    if (!title || !content) return alert("タイトルと本文を入力してください");
    if (!token) return alert("Discord連携が必要です");

    const newThread = {
        title: title,
        content: content,
        author: "連携済みユーザー", // 本来はDiscord APIから名前を取得
        date: new Date().toLocaleString(),
        comments: []
    };

    try {
        await fetch(`${BBS_URL}.json`, {
            method: 'POST',
            body: JSON.stringify(newThread)
        });
        alert("投稿しました！");
        location.reload(); 
    } catch (e) { alert("投稿に失敗しました"); }
}

// スレッド詳細を開く
function openThread(id) {
    currentThreadId = id;
    const t = allThreads[id];
    document.getElementById('bbs-main').style.display = 'none';
    document.getElementById('thread-detail').style.display = 'block';
    
    document.getElementById('detail-title').innerText = t.title;
    document.getElementById('detail-content').innerText = t.content;
    renderComments(t.comments);
}

// コメント（メッセージ）表示
function renderComments(comments) {
    const container = document.getElementById('comment-list');
    container.innerHTML = "";
    if (!comments) return;

    Object.values(comments).forEach(c => {
        container.innerHTML += `
            <div style="border-bottom:1px solid #333; padding:10px 0;">
                <small style="color:var(--accent-color);">${c.author}</small>
                <p style="margin:5px 0;">${c.text}</p>
            </div>`;
    });
}

// メッセージ送信 (保存処理)
async function postComment() {
    const text = document.getElementById('comment-input').value;
    if (!text) return;

    const newComment = {
        text: text,
        author: "連携済みユーザー",
        date: new Date().toLocaleString()
    };

    try {
        await fetch(`${BBS_URL}/${currentThreadId}/comments.json`, {
            method: 'POST',
            body: JSON.stringify(newComment)
        });
        document.getElementById('comment-input').value = "";
        location.reload(); // 簡易的にリロードで更新
    } catch (e) { alert("送信失敗"); }
}

function backToList() {
    document.getElementById('bbs-main').style.display = 'block';
    document.getElementById('thread-detail').style.display = 'none';
}

// ページ読み込み時の初期化
window.onload = () => {
    updateVisitorStats();
    fetchNews();
    fetchBBS();
    // ログインチェック関数(以前のまま)
    if(localStorage.getItem('discord_access_token')) {
        const btn = document.getElementById('create-btn');
        if(btn) btn.disabled = false;
    }
};

// スレッドの有効期限（15日間 = 15 * 24 * 60 * 60 * 1000 ミリ秒）
const EXPIRATION_MS = 15 * 24 * 60 * 60 * 1000;

// スレッド一覧の描画（期限チェック・評価ボタン・残り日数付き）
function renderThreads(threadsObj) {
    const listContainer = document.getElementById('bbs-list');
    if (!listContainer) return;
    listContainer.innerHTML = "";

    const now = Date.now();

    Object.keys(threadsObj).reverse().forEach(id => {
        const t = threadsObj[id];
        
        // 最終更新日（メッセージがあれば最後のメッセージ、なければ作成日）
        const lastActivityDate = t.lastActivity ? new Date(t.lastActivity).getTime() : new Date(t.date).getTime();
        const diff = now - lastActivityDate;
        const remainingMs = EXPIRATION_MS - diff;

        // 15日経過していたらスキップ（自動削除の擬似処理）
        if (remainingMs <= 0) {
            deleteThreadAuto(id);
            return;
        }

        const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

        listContainer.innerHTML += `
            <div class="bbs-item" style="background:var(--section-bg); border:1px solid var(--border-color); padding:20px; border-radius:12px; margin-bottom:15px; position:relative;">
                <div onclick="openThread('${id}')" style="cursor:pointer;">
                    <h3 style="margin:0; color:var(--accent-color);">${t.title}</h3>
                    <div class="bbs-meta" style="margin-bottom:10px;">
                        <span style="color:#ffa500;">⏳ 削除まで残り: ${remainingDays}日</span>
                    </div>
                    <p style="margin:5px 0; color:#ccc;">${t.content.substring(0, 50)}...</p>
                </div>
                
                <div style="display:flex; align-items:center; gap:15px; margin-top:15px; border-top:1px solid #333; padding-top:10px;">
                    <button onclick="vote('${id}', 'up')" style="background:none; border:none; color:#58a6ff; cursor:pointer;">👍 ${t.upvotes || 0}</button>
                    <button onclick="vote('${id}', 'down')" style="background:none; border:none; color:#ff6b6b; cursor:pointer;">👎 ${t.downvotes || 0}</button>
                    <small style="color:gray; margin-left:auto;">作成日: ${t.date}</small>
                </div>
            </div>`;
    });
}

// メッセージ（返信）の描画
function renderComments(comments) {
    const container = document.getElementById('comment-list');
    container.innerHTML = "";
    if (!comments) return;

    Object.values(comments).forEach(c => {
        const isAuthor = (c.authorId === allThreads[currentThreadId].authorId);
        container.innerHTML += `
            <div class="comment-box" style="display:flex; gap:12px; align-items:flex-start; border-bottom:1px solid #333; padding:15px 0;">
                <img src="${c.authorIcon}" style="width:40px; height:40px; border-radius:50%; border: 1px solid #444;">
                <div>
                    <div style="font-size:0.85rem;">
                        <span style="color:var(--accent-color); font-weight:bold;">${c.author}</span>
                        <span style="color:gray; margin-left:8px; font-size:0.7rem;">| ${c.authorId}</span>
                        ${isAuthor ? '<span style="background:#5865F2; color:white; font-size:0.6rem; padding:2px 6px; border-radius:4px; margin-left:8px;">作成者</span>' : ''}
                    </div>
                    <p style="margin:5px 0; line-height:1.5;">${c.text}</p>
                    <small style="color:#555; font-size:0.7rem;">${c.date} 投稿</small>
                </div>
            </div>`;
    });
}

// 評価ボタンの処理
async function vote(id, type) {
    const token = localStorage.getItem('discord_access_token');
    if (!token) return alert("評価にはログインが必要です");

    const t = allThreads[id];
    const key = type === 'up' ? 'upvotes' : 'downvotes';
    const newVal = (t[key] || 0) + 1;

    await fetch(`${BBS_URL}/${id}/${key}.json`, {
        method: 'PUT',
        body: JSON.stringify(newVal)
    });
    fetchBBS(); // 再読み込み
}

// 自動削除処理
async function deleteThreadAuto(id) {
    await fetch(`${BBS_URL}/${id}.json`, { method: 'DELETE' });
}

// メッセージ送信時にlastActivityを更新
async function postComment() {
    const text = document.getElementById('comment-input').value;
    if (!text) return;
    const now = new Date().toISOString();

    const newComment = {
        text: text,
        author: currentUser.name,
        authorId: currentUser.id,
        authorIcon: currentUser.avatar,
        date: new Date().toLocaleString()
    };

    // メッセージ追加と同時にスレッドの最終アクティビティを更新
    await fetch(`${BBS_URL}/${currentThreadId}/comments.json`, { method: 'POST', body: JSON.stringify(newComment) });
    await fetch(`${BBS_URL}/${currentThreadId}/lastActivity.json`, { method: 'PUT', body: JSON.stringify(now) });
    
    document.getElementById('comment-input').value = "";
    location.reload();
}
