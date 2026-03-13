// Discord サーバー情報の確認
function checkDiscordServer() {
    // 実装例：Discord API または webhooks を使用
    console.log("Discord サーバー情報を確認中...");
    // ここに Discord API 呼び出しを追加
}

// Minecraft サーバー情報の確認
function checkMinecraftServer() {
    console.log("Minecraft サーバー情報を確認中...");
    
    // Minecraft Server Ping API を使用（例）
    const serverAddress = "play.pilotsky.jp";
    const port = 25565;
    
    // API 呼び出しの例：
    // fetch(`https://api.mcsrvstat.us/2/${serverAddress}:${port}`)
    //     .then(response => response.json())
    //     .then(data => {
    //         document.getElementById('mc-status').textContent = data.online ? 'オンライン' : 'オフライン';
    //         document.getElementById('mc-status').className = `status ${data.online ? 'online' : 'offline'}`;
    //         document.getElementById('mc-players').textContent = data.players.online;
    //         document.getElementById('mc-motd').textContent = data.motd?.clean?.join(' ') || 'PilotSky へようこそ！';
    //     })
    //     .catch(error => console.error('エラー:', error));
    
    // デモ用：ダミーデータ表示
    setTimeout(() => {
        document.getElementById('mc-status').textContent = 'オンライン';
        document.getElementById('mc-status').className = 'status online';
        document.getElementById('mc-players').textContent = '12';
        document.getElementById('mc-motd').textContent = 'PilotSky へようこそ！🎮';
    }, 500);
}

// 運営募集フォーム送信
document.addEventListener('DOMContentLoaded', function() {
    const recruitmentForm = document.getElementById('recruitmentForm');
    
    if (recruitmentForm) {
        recruitmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // フォームデータ取得
            const formData = {
                name: document.getElementById('name').value,
                position: document.getElementById('position').value,
                reason: document.getElementById('reason').value,
                timestamp: new Date().toISOString()
            };
            
            // バリデーション
            if (!formData.name || !formData.position || !formData.reason) {
                alert('すべてのフィールドを入力してください');
                return;
            }
            
            // reCAPTCHA チェック
            const recaptchaResponse = grecaptcha?.getResponse?.();
            if (!recaptchaResponse && document.getElementById('recaptcha-placeholder')) {
                alert('reCAPTCHA を完了してください');
                return;
            }
            
            console.log('送信データ:', formData);
            
            // サーバーに送信（実装例）
            // fetch('/api/recruitment', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(formData)
            // })
            // .then(response => response.json())
            // .then(data => {
            //     if (data.success) {
            //         alert('送信されました。ご応募ありがとうございます！');
            //         recruitmentForm.reset();
            //     } else {
            //         alert('エラーが発生しました。もう一度お試しください。');
            //     }
            // })
            // .catch(error => {
            //     console.error('エラー:', error);
            //     alert('送信に失敗しました。');
            // });
            
            // デモ用：送信完了表示
            alert('ご応募ありがとうございます！\n\n応募内容:\n名前: ' + formData.name + '\n職種: ' + formData.position + '\n\nお返事お待ちしています。');
            recruitmentForm.reset();
        });
    }
    
    // ページロード時にサーバー情報を確認
    checkMinecraftServer();
    checkDiscordServer();
    
    // スクロール時のアニメーション
    observeElements();
});

// スクロール時のエレメントアニメーション
function observeElements() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.card, .blog-card').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// スムーズスクロール補助関数
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}