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
