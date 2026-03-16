const NEWS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/news.json";
const BBS_URL = "https://pilotsky1533512officialsite-default-rtdb.firebaseio.com/bbs";

// --- お知らせ投稿 ---
async function postNews() {
    const title = document.getElementById('news-title').value;
    const content = document.getElementById('news-content').value;
    if (!title || !content) return alert("入力してください");

    const newsData = { title, content, date: new Date().toLocaleString() };
    try {
        await fetch(NEWS_URL, { method: 'POST', body: JSON.stringify(newsData) });
        alert("お知らせを公開しました");
        location.reload();
    } catch (e) { alert("失敗しました"); }
}

// --- 掲示板管理：スレッド取得 ---
async function fetchAdminBBS() {
    const listContainer = document.getElementById('admin-bbs-list');
    try {
        const res = await fetch(`${BBS_URL}.json`);
        const data = await res.json();
        listContainer.innerHTML = "";

        if (!data) {
            listContainer.innerHTML = "<p>現在スレッドはありません。</p>";
            return;
        }

        Object.keys(data).reverse().forEach(id => {
            const t = data[id];
            listContainer.innerHTML += `
                <div class="bbs-manage-item">
                    <div>
                        <strong style="color:var(--accent-color);">${t.title}</strong><br>
                        <small style="color:gray;">投稿者: ${t.author} | ID: ${t.authorId}</small>
                    </div>
                    <button class="delete-btn" onclick="deleteThread('${id}')">削除</button>
                </div>
            `;
        });
    } catch (e) { listContainer.innerHTML = "<p>エラーが発生しました。</p>"; }
}

// --- 掲示板管理：削除処理 ---
async function deleteThread(id) {
    if (!confirm("本当にこのスレッドを削除しますか？\n(この操作は取り消せません)")) return;

    try {
        await fetch(`${BBS_URL}/${id}.json`, { method: 'DELETE' });
        alert("スレッドを削除しました");
        fetchAdminBBS(); // 一覧を再更新
    } catch (e) { alert("削除に失敗しました"); }
}

// 起動時
window.onload = () => {
    fetchAdminBBS();
};
