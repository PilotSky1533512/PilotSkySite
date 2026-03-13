const btn = document.getElementById('mode-toggle');

btn.addEventListener('click', () => {
    // bodyタグに dark-mode クラスをつけたり外したりする
    document.body.classList.toggle('dark-mode');
});
