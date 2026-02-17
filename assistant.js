(function () {
    // Assets & Config
    const ASSETS_BASE = 'https://api.yas.wine';
    const API_URL = 'https://api.yas.wine/api/chat';

    // Detect Language
    const lang = (navigator.language || 'en').startsWith('ru') ? 'ru' : 'en';
    const translations = {
        ru: {
            greeting: "Привет! Я Анна, твой личный UGC-эксперт в YAS Wine. 📸 Готов сделать свои товары вирусными? Спрашивай о чем угодно!",
            placeholder: "Напиши сообщение...",
            presets: [
                { l: "Как это работает?", q: "Как работает YAS Wine?" },
                { l: "Цены и тарифы", q: "Какие у вас тарифы?" },
                { l: "Приложение Shopify", q: "Расскажи про ваше приложение для Shopify" }
            ],
            btnNavigate: "Перейти ✨",
            btnShopify: "Установить Shopify App 🚀",
            btnGallery: "Открыть галерею 🖼️",
            btnPricing: "Цены и тарифы 💳",
            btnStart: "Начать создание ✨"
        },
        en: {
            greeting: "Hi! I'm Anna, your personal UGC Expert at YAS Wine. 📸 Ready to make your products go viral? Ask me anything!",
            placeholder: "Type your message...",
            presets: [
                { l: "How it works?", q: "How does YAS Wine work?" },
                { l: "Pricing plans", q: "What are your pricing plans?" },
                { l: "Shopify App", q: "Tell me about your Shopify App" }
            ],
            btnNavigate: "Try for Free ✨",
            btnShopify: "Install Shopify App 🚀",
            btnGallery: "View Gallery 🖼️",
            btnPricing: "Pricing & Credits 💳",
            btnStart: "Start Creating ✨"
        }
    };
    const t = translations[lang];

    // Preload Assets
    ['1.svg', '2.svg', '3.svg'].forEach(file => {
        const img = new Image();
        img.src = `${ASSETS_BASE}/${file}`;
    });

    // Styles
    const style = document.createElement('style');
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

        .anna-widget-container {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            --anna-primary: #9333ea;
            --anna-emerald: #10b981;
            --anna-bg: rgba(20, 20, 30, 0.85);
            --anna-border: rgba(255, 255, 255, 0.1);
            z-index: 999999;
            position: fixed;
            pointer-events: none;
        }

        /* Launcher mascot */
        #anna-launcher {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 240px;
            height: 240px;
            cursor: pointer;
            pointer-events: auto;
            transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 10000;
        }
        #anna-launcher.window-open {
            right: 430px;
        }
        #anna-launcher img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: drop-shadow(0 0 30px rgba(255,255,255,0.3)) drop-shadow(0 20px 40px rgba(0,0,0,0.4));
            transition: transform 0.5s;
        }
        #anna-launcher:hover img {
            transform: scale(1.05);
        }

        /* Speech bubble */
        #anna-bubble {
            position: absolute;
            top: 20px;
            right: 180px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 8px 16px;
            border-radius: 16px;
            border-bottom-right-radius: 0;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            border: 1px solid rgba(147, 51, 234, 0.2);
            animation: anna-bounce 2s infinite ease-in-out;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        @keyframes anna-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .online-dot {
            width: 10px;
            height: 10px;
            background: var(--anna-emerald);
            border-radius: 50%;
            box-shadow: 0 0 8px var(--anna-emerald);
            animation: anna-pulse 2s infinite;
        }
        @keyframes anna-pulse {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.8; }
        }

        /* Chat Window */
        #anna-window {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 400px;
            height: 650px;
            background: var(--anna-bg);
            backdrop-filter: blur(30px);
            -webkit-backdrop-filter: blur(30px);
            border: 1px solid var(--anna-border);
            border-radius: 24px;
            box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            pointer-events: none;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 9999;
        }
        #anna-window.active {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }

        /* Header */
        #anna-header {
            padding: 16px;
            background: rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid var(--anna-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .anna-header-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .anna-header-logo {
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 6px;
            border: 1px solid var(--anna-border);
        }
        .anna-header-logo img { width: 100%; height: 100%; object-fit: contain; }
        .anna-header-text h3 { margin: 0; color: #fff; font-size: 14px; font-weight: 800; }
        .anna-header-status { font-size: 10px; font-weight: 800; color: #10b981; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px; }

        #anna-close {
            cursor: pointer;
            padding: 8px;
            color: rgba(255,255,255,0.4);
            border-radius: 10px;
            transition: all 0.2s;
        }
        #anna-close:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        /* Messages */
        #anna-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .msg {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 20px;
            font-size: 14px;
            line-height: 1.6;
        }
        .msg-user {
            align-self: flex-end;
            background: var(--anna-primary);
            color: #fff;
            border-bottom-right-radius: 4px;
            box-shadow: 0 4px 12px rgba(147, 51, 234, 0.2);
        }
        .msg-assistant {
            align-self: flex-start;
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.9);
            border-bottom-left-radius: 4px;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .msg strong { color: #fff; font-weight: 700; }
        .anna-list {
            margin: 10px 0;
            padding-left: 20px;
            list-style-type: disc !important;
        }
        .anna-list li {
            margin: 4px 0;
            color: rgba(255, 255, 255, 0.95);
        }
        .msg p {
            margin: 8px 0;
        }
        .msg p:first-child { margin-top: 0; }
        .msg p:last-child { margin-bottom: 0; }

        /* Buttons & Presets */
        .anna-btn {
            background: var(--anna-primary);
            border: none;
            color: #fff;
            padding: 10px 18px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
            text-decoration: none;
            transition: all 0.2s;
        }
        .anna-btn:hover { background: #a855f7; transform: translateY(-1px); }
        .preset-chip {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.7);
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .preset-chip:hover { border-color: var(--anna-primary); color: #fff; background: rgba(147, 51, 234, 0.1); }

        /* Typing Indicator */
        .typing-indicator {
            display: flex;
            gap: 4px;
            padding: 4px 8px;
            align-items: center;
        }
        .typing-dot {
            width: 6px;
            height: 6px;
            background: rgba(255,255,255,0.4);
            border-radius: 50%;
            animation: typing 1.4s infinite ease-in-out both;
        }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes typing {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }

        /* Input */
        #anna-input-area {
            padding: 16px;
            background: rgba(255, 255, 255, 0.05);
            border-top: 1px solid var(--anna-border);
            display: flex;
            gap: 12px;
        }
        #anna-input {
            flex: 1;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid var(--anna-border);
            border-radius: 16px;
            padding: 12px 16px;
            color: #fff;
            font-size: 14px;
            outline: none;
        }
        #anna-input:focus { border-color: var(--anna-primary); }
        #anna-send {
            background: var(--anna-primary);
            border: none;
            border-radius: 16px;
            width: 48px;
            height: 48px;
            cursor: pointer;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        @media (max-width: 480px) {
            #anna-window { width: calc(100% - 32px); height: 80vh; right: 16px; bottom: 16px; }
            #anna-launcher { transform: scale(0.6); right: -40px; bottom: -40px; }
        }
    `;
    document.head.appendChild(style);

    // Dom Elements
    const container = document.createElement('div');
    container.className = 'anna-widget-container';
    document.body.appendChild(container);

    container.innerHTML = `
        <div id="anna-launcher">
            <div id="anna-bubble">
                <div class="online-dot"></div>
                <span style="font-size: 11px; font-weight: 800; color: #334155;">Expert Online</span>
            </div>
            <img src="${ASSETS_BASE}/2.svg" id="anna-mascot" alt="Anna">
        </div>
        
        <div id="anna-window">
            <div id="anna-header">
                <div class="anna-header-info">
                    <div class="anna-header-logo">
                        <img src="${ASSETS_BASE}/logo.png" alt="UGC">
                    </div>
                    <div class="anna-header-text">
                        <h3>Anna</h3>
                        <div class="anna-header-status">
                            <span class="online-dot" style="width: 6px; height: 6px;"></span>
                            Online • AI Content Expert
                        </div>
                    </div>
                </div>
                <div id="anna-close">✕</div>
            </div>
            <div id="anna-messages"></div>
            <div id="anna-presets" style="padding: 10px 20px; display: flex; flex-wrap: wrap; gap: 8px;"></div>
            <div id="anna-input-area">
                <input type="text" id="anna-input" placeholder="${t.placeholder}">
                <button id="anna-send">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
        </div>
    `;

    const launcher = document.getElementById('anna-launcher');
    const mascot = document.getElementById('anna-mascot');
    const win = document.getElementById('anna-window');
    const msgContainer = document.getElementById('anna-messages');
    const input = document.getElementById('anna-input');
    const sendBtn = document.getElementById('anna-send');
    const closeBtn = document.getElementById('anna-close');
    const bubble = document.getElementById('anna-bubble');
    const presetContainer = document.getElementById('anna-presets');

    let history = JSON.parse(localStorage.getItem('anna-chat-history') || '[]');
    let isOpen = false;
    let isWinking = false;
    const executedCommands = new Set();

    // Helpers
    function setMascot(id) {
        mascot.src = `${ASSETS_BASE}/${id}.svg`;
    }

    function wink() {
        if (isOpen) return;

        isWinking = !isWinking;
        setMascot(isWinking ? '3' : '2');

        setTimeout(wink, 3000); // 3 seconds for each state
    }
    setTimeout(wink, 3000);

    function parseCommands(text, isLive = false) {
        if (!text) return '';

        // Handle Scroll Commands (execution during live stream)
        let processedText = text.replace(/\[\s*COMMAND\s*:\s*SCROLL\s*:\s*(.*?)\s*\]/gi, (match, id) => {
            if (isLive && !executedCommands.has(match)) {
                const el = document.querySelector(id.trim());
                if (el) {
                    setTimeout(() => {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
                executedCommands.add(match);
            }
            return ''; // Hide from text
        });

        // Handle Navigate & Action Buttons (Inline extraction)
        const buttons = [];
        processedText = processedText.replace(/\[\s*COMMAND\s*:\s*NAVIGATE\s*:\s*(.*?)\s*\]/gi, (match, url) => {
            const cleanUrl = url.trim();
            let label = t.btnNavigate;
            if (cleanUrl.includes('shopify')) label = t.btnShopify;
            else if (cleanUrl === '/gallery' || cleanUrl.includes('/gallery')) label = t.btnGallery;
            else if (cleanUrl === '/credits' || cleanUrl.includes('/credits')) label = t.btnPricing;
            else if (cleanUrl === '/' || cleanUrl === '') label = t.btnStart;
            else if (cleanUrl.includes('web.myugc')) label = t.btnStart;
            buttons.push(`<a href="${cleanUrl}" target="_blank" class="anna-btn">${label}</a>`);
            return '';
        });

        processedText = processedText.replace(/\[\s*COMMAND\s*:\s*ACTION\s*:\s*(.*?)\s*\]/gi, (match, action) => {
            const cleanAction = action.trim();
            let label = cleanAction.replace(/_/g, ' ').replace('OPEN ', '').toLowerCase();
            label = label.charAt(0).toUpperCase() + label.slice(1);
            buttons.push(`<button class="anna-btn" onclick="if(window.dispatchAnnaAction) window.dispatchAnnaAction('${cleanAction}'); else console.log('Action:', '${cleanAction}')">${label} ✨</button>`);
            return '';
        });

        // Cleaning leftovers
        processedText = processedText.replace(/\[\s*COMMAND\s*:.*?\]/gi, '').trim();

        // Markdown: Bold, Italic
        let html = processedText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Layout: Lists & Paragraphs
        const lines = html.split('\n');
        let inList = false;
        let formatted = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) {
                if (inList) { formatted.push('</ul>'); inList = false; }
                return;
            }

            // Detect list items: "- text" or "1. text"
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
                if (!inList) {
                    formatted.push('<ul class="anna-list">');
                    inList = true;
                }
                const content = trimmed.replace(/^([-*+]|\d+\.)\s+/, '');
                formatted.push(`<li>${content}</li>`);
            } else {
                if (inList) {
                    formatted.push('</ul>');
                    inList = false;
                }
                formatted.push(`<p>${trimmed}</p>`);
            }
        });
        if (inList) formatted.push('</ul>');

        // Append buttons at the end
        if (buttons.length > 0) {
            formatted.push(`<div class="anna-btns">${buttons.join('')}</div>`);
        }

        return formatted.join('');
    }

    function addMessage(role, content) {
        const div = document.createElement('div');
        div.className = `msg msg-${role}`;
        div.innerHTML = parseCommands(content, false);
        msgContainer.appendChild(div);
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'msg msg-assistant typing-msg';
        div.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        msgContainer.appendChild(div);
        msgContainer.scrollTop = msgContainer.scrollHeight;
        return div;
    }

    function removeTyping() {
        const typingMsg = msgContainer.querySelector('.typing-msg');
        if (typingMsg) typingMsg.remove();
    }

    // Toggle
    launcher.onclick = () => {
        isOpen = !isOpen;
        win.classList.toggle('active', isOpen);
        launcher.classList.toggle('window-open', isOpen);
        bubble.style.display = isOpen ? 'none' : 'flex';
        setMascot(isOpen ? '1' : '2');

        if (isOpen && history.length === 0) {
            startChat();
        }
    };

    closeBtn.onclick = (e) => {
        e.stopPropagation();
        launcher.click();
    };

    function startChat() {
        addMessage('assistant', t.greeting);
        history.push({ role: 'assistant', content: t.greeting });
        showPresets();
    }

    function showPresets() {
        presetContainer.innerHTML = '';
        t.presets.forEach(p => {
            const chip = document.createElement('div');
            chip.className = 'preset-chip';
            chip.innerText = p.l;
            chip.onclick = () => {
                input.value = p.q;
                sendMessage();
            };
            presetContainer.appendChild(chip);
        });
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        addMessage('user', text);
        history.push({ role: 'user', content: text });
        presetContainer.innerHTML = '';

        showTyping(); // Show animation

        try {
            setMascot('2'); // Thinking
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: history,
                    currentPath: window.location.pathname
                })
            });

            removeTyping(); // Remove animation

            if (response.ok) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let assistantMsg = '';
                const msgDiv = document.createElement('div');
                msgDiv.className = 'msg msg-assistant';
                msgContainer.appendChild(msgDiv);

                setMascot('1'); // Talking

                let buffer = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep partial line in buffer

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed) continue;

                        if (trimmed.startsWith('0:')) {
                            const raw = trimmed.substring(2);
                            try {
                                const textPart = JSON.parse(raw);
                                assistantMsg += textPart;
                            } catch (e) {
                                // Fallback for malformed JSON or partial quotes
                                const match = raw.match(/^"(.*)"$/);
                                if (match) assistantMsg += match[1];
                                else if (raw.startsWith('"')) assistantMsg += raw.substring(1);
                                else assistantMsg += raw;
                            }
                        }
                    }

                    msgDiv.innerHTML = parseCommands(assistantMsg, true);
                    msgContainer.scrollTop = msgContainer.scrollHeight;
                }
                history.push({ role: 'assistant', content: assistantMsg });
                localStorage.setItem('anna-chat-history', JSON.stringify(history));
            }
        } catch (e) {
            console.error('API Error:', e);
            addMessage('assistant', "Sorry, I'm having trouble connecting right now. 😔 Try again later!");
        }
    }

    sendBtn.onclick = sendMessage;
    input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };

    // Restore History
    if (history.length > 0) {
        history.forEach(m => addMessage(m.role, m.content));
    }

})();
