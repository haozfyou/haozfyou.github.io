/*!
* 码点笔记 — 站点脚本
* 导航部分基于 Start Bootstrap - Clean Blog v6.0.9 (MIT)
* https://startbootstrap.com/theme/clean-blog
*/

/* ---------- 滚动时固定的顶部导航 ---------- */
window.addEventListener('DOMContentLoaded', () => {
    const mainNav = document.getElementById('mainNav');
    if (!mainNav) return;
    let scrollPos = 0;
    const headerHeight = mainNav.clientHeight;
    window.addEventListener('scroll', function () {
        const currentTop = document.body.getBoundingClientRect().top * -1;
        if (currentTop < scrollPos) {
            if (currentTop > 0 && mainNav.classList.contains('is-fixed')) {
                mainNav.classList.add('is-visible');
            } else {
                mainNav.classList.remove('is-visible', 'is-fixed');
            }
        } else {
            mainNav.classList.remove('is-visible');
            if (currentTop > headerHeight && !mainNav.classList.contains('is-fixed')) {
                mainNav.classList.add('is-fixed');
            }
        }
        scrollPos = currentTop;
    });

    // 高亮当前页对应的导航项
    const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    mainNav.querySelectorAll('.nav-link').forEach((a) => {
        if ((a.getAttribute('href') || '').toLowerCase() === here) a.classList.add('active');
    });
});

/* ---------- 码点换算小工具 ---------- */
(function () {
    const MAX_CP = 0x10FFFF;

    function utf8Bytes(cp) {
        if (cp <= 0x7F) return [cp];
        if (cp <= 0x7FF) return [0xC0 | (cp >> 6), 0x80 | (cp & 0x3F)];
        if (cp <= 0xFFFF) return [0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F)];
        return [0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F)];
    }

    function utf16Units(cp) {
        if (cp <= 0xFFFF) return [cp];
        const v = cp - 0x10000;
        return [0xD800 + (v >> 10), 0xDC00 + (v & 0x3FF)];
    }

    const hex2 = (n) => n.toString(16).toUpperCase().padStart(2, '0');
    const hex4 = (n) => n.toString(16).toUpperCase().padStart(4, '0');
    const bin8 = (n) => n.toString(2).padStart(8, '0');
    const spaced = (arr, f) => arr.map(f).join(' ');

    function planeOf(cp) {
        if (cp <= 0xFFFF) return '第 0 平面 BMP（基本多文种平面）';
        if (cp <= 0x1FFFF) return '第 1 平面 SMP（补充多文种平面）';
        if (cp <= 0x2FFFF) return '第 2 平面 SIP（补充表意文字平面）';
        if (cp <= 0x3FFFF) return '第 3 平面 TIP（第三表意文字平面）';
        if (cp >= 0xE0000) return '第 14 平面 SSP（特别用途补充平面）';
        return '第 15 / 16 平面（私用区）';
    }

    // 解析码点输入：支持 U+4E2D / 0x4E2D / #4E2D / 4E2D / 20013
    function parseCodePoint(raw) {
        let s = String(raw).trim().replace(/^(U\+|0X|#)/i, '').replace(/[\s_]/g, '');
        if (!s) return null;
        let cp;
        if (/^[0-9A-F]+$/i.test(s)) {
            cp = parseInt(s, 16);
        } else if (/^[0-9]+$/.test(s)) {
            cp = parseInt(s, 10);
        } else {
            return null;
        }
        if (!Number.isFinite(cp) || cp < 0 || cp > MAX_CP) return null;
        if (cp >= 0xD800 && cp <= 0xDFFF) return null; // 代理区不是合法码点
        return cp;
    }

    function resolveInput(mode, raw) {
        if (mode === 'cp') return parseCodePoint(raw);
        const chars = Array.from(String(raw));
        if (!chars.length) return null;
        const cp = chars[0].codePointAt(0);
        return (cp <= MAX_CP && !(cp >= 0xD800 && cp <= 0xDFFF)) ? cp : null;
    }

    function card(key, value, sub, isErr) {
        const cls = isErr ? 'out-card err' : 'out-card';
        const subHtml = sub ? '<div class="out-sub">' + sub + '</div>' : '';
        return '<div class="' + cls + '"><div class="out-k">' + key + '</div>' +
               '<div class="out-v">' + value + '</div>' + subHtml + '</div>';
    }

    function render(out, glyph, mode, raw) {
        const cp = resolveInput(mode, raw);
        if (cp === null) {
            glyph.textContent = '?';
            out.innerHTML = card('无法解析', mode === 'cp'
                ? '请输入 0x0000 – 0x10FFFF 之间的合法码点（代理区 D800–DFFF 除外）'
                : '请输入至少一个字符');
            return;
        }

        const u8 = utf8Bytes(cp);
        const units = utf16Units(cp);
        const be16 = [];
        const le16 = [];
        units.forEach((u) => { be16.push(u >> 8, u & 0xFF); le16.push(u & 0xFF, u >> 8); });
        const be32 = [(cp >> 24) & 0xFF, (cp >> 16) & 0xFF, (cp >> 8) & 0xFF, cp & 0xFF];
        const le32 = be32.slice().reverse();

        glyph.textContent = String.fromCodePoint(cp);

        const surrogate = units.length === 2;
        out.innerHTML =
            card('Unicode 码点', 'U+' + hex4(cp).padStart(cp > 0xFFFF ? 5 : 4, '0'),
                 '十进制 ' + cp + ' · ' + planeOf(cp)) +
            card('UTF-8 · ' + u8.length + ' 字节', spaced(u8, hex2),
                 spaced(u8, bin8)) +
            card('UTF-16 · ' + be16.length + ' 字节',
                 'BE ' + spaced(be16, hex2) + ' &nbsp;|&nbsp; LE ' + spaced(le16, hex2),
                 '码元 ' + spaced(units, hex4) + (surrogate ? '（代理对：高 D800+ / 低 DC00+）' : '（直接等于码点）')) +
            card('UTF-32 · 4 字节',
                 'BE ' + spaced(be32, hex2) + ' &nbsp;|&nbsp; LE ' + spaced(le32, hex2),
                 '定长存储，码点原样写入') +
            card('带 BOM 的 UTF-8 文件头', spaced([0xEF, 0xBB, 0xBF].concat(u8), hex2),
                 'EF BB BF 只是标记，不表示字节顺序');
    }

    window.addEventListener('DOMContentLoaded', () => {
        const panel = document.getElementById('cpTool');
        if (!panel) return;
        const input = panel.querySelector('#cpInput');
        const out = panel.querySelector('#cpOut');
        const glyph = panel.querySelector('#cpGlyph');
        const segButtons = panel.querySelectorAll('.seg button');
        let mode = 'char';

        function update() { render(out, glyph, mode, input.value); }

        segButtons.forEach((b) => {
            b.addEventListener('click', () => {
                mode = b.dataset.mode;
                segButtons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
                input.placeholder = b.dataset.placeholder || '';
                input.value = b.dataset.sample || '';
                update();
            });
        });

       input.addEventListener('input', update);
        panel.querySelectorAll('.chip').forEach((c) => {
            c.addEventListener('click', () => {
                input.value = mode === 'cp' ? (c.dataset.cp || c.dataset.value) : c.dataset.value;
                update();
            });
        });

        update();
    });
})();
