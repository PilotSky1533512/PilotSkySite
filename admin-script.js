const FIREBASE_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/news.json";
const BBS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/bbs";
const VERSION_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/version.json";

let newsData = [];

// --- お知らせ機能 ---

// 現在のお知らせを取得
async function fetchCurrentNews() {
    const res = await fetch(FIREBASE_URL);
    const data = await res.json();
    newsData = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
    renderNewsList();
}

// リストの描画（編集・削除ボタン付き）
function renderNewsList() {
    const container = document.getElementById('admin-news-list');
    container.innerHTML = "<h4>現在リストにあるお知らせ</h4>";
    newsData.forEach((item, index) => {
        container.innerHTML += `
            <div class="manage-item">
                <div class="info-area">
                    <strong>${item.title}</strong>
                </div>
                <div class="btn-group">
                    <button class="edit-btn" onclick="editNews(${index})">編集</button>
                    <button class="delete-btn" onclick="deleteNews(${index})">削除</button>
                </div>
            </div>`;
    });
}

// 追加または更新
function addOrUpdateNews() {
    const title = document.getElementById('news-title').value;
    const content = document.getElementById('news-content').value;
    const editIndex = document.getElementById('edit-index').value;

    if (!title || !content) return alert("入力してください");

    if (editIndex !== "") {
        newsData[editIndex] = { title, content, date: new Date().toLocaleString() };
        document.getElementById('edit-index').value = "";
        document.getElementById('add-btn').innerText = "リストに追加 / 更新";
    } else {
        newsData.push({ title, content, date: new Date().toLocaleString() });
    }

    document.getElementById('news-title').value = "";
    document.getElementById('news-content').value = "";
    renderNewsList();
}

function editNews(index) {
    const item = newsData[index];
    document.getElementById('news-title').value = item.title;
    document.getElementById('news-content').value = item.content;
    document.getElementById('edit-index').value = index;
    document.getElementById('add-btn').innerText = "この内容で確定する";
    window.scrollTo(0, 0);
}

function deleteNews(index) {
    if (!confirm("リストから削除しますか？")) return;
    newsData.splice(index, 1);
    renderNewsList();
}

// Firebaseへ保存（世界中に反映）
async function saveToFirebase() {
    const pass = prompt("管理者パスワードを入力してください");
    if (pass !== "AdminPassPilotSky") return alert("パスワードが違います");

    try {
        // お知らせ保存
        await fetch(FIREBASE_URL, {
            method: 'PUT',
            body: JSON.stringify(newsData)
        });
        
        // 全ユーザーに再読み込み通知（バージョン更新）
        await fetch(VERSION_URL, {
            method: 'PUT',
            body: JSON.stringify(Date.now())
        });

        alert("世界中に反映が完了しました！");
    } catch (e) { alert("送信エラー"); }
}

// --- 掲示板管理 ---

async function fetchAdminBBS() {
    const container = document.getElementById('admin-bbs-list');
    const res = await fetch(`${BBS_URL}.json`);
    const data = await res.json();
    container.innerHTML = "";

    if (!data) return container.innerHTML = "<p>スレッドはありません</p>";

    Object.keys(data).reverse().forEach(id => {
        const t = data[id];
        container.innerHTML += `
            <div class="manage-item">
                <div class="info-area">
                    <strong>${t.title}</strong><br>
                    <small>${t.author} | ${t.authorId}</small>
                </div>
                <button class="delete-btn" onclick="deleteThread('${id}')">削除</button>
            </div>`;
    });
}

async function deleteThread(id) {
    if (!confirm("このスレッドを完全に削除しますか？")) return;
    await fetch(`${BBS_URL}/${id}.json`, { method: 'DELETE' });
    fetchAdminBBS();
}

// 初期起動
window.onload = () => {
    fetchCurrentNews();
    fetchAdminBBS();
};
