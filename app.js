// ========================================
// 高市総理 Q&A ウェブサイト — メインアプリケーション
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initDonutChart();
    initPartyList();
    initManifestoTabs();
    initChat();
    initScrollAnimations();
});

// ========================================
// Navigation
// ========================================
function initNav() {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });

    // Close mobile nav on link click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('nav');
        if (window.scrollY > 50) {
            nav.style.background = 'rgba(10, 10, 26, 0.95)';
        } else {
            nav.style.background = 'rgba(10, 10, 26, 0.85)';
        }
    });
}

// ========================================
// Donut Chart (Election Results)
// ========================================
function initDonutChart() {
    const svg = document.querySelector('#donutChart svg');
    const parties = ELECTION_DATA.parties;
    const total = ELECTION_DATA.totalSeats;
    const cx = 100, cy = 100, r = 70;
    const circumference = 2 * Math.PI * r;

    let cumulativePercent = 0;

    parties.forEach((party, index) => {
        const percent = party.seats / total;
        const offset = circumference * cumulativePercent;
        const length = circumference * percent;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', party.color);
        circle.setAttribute('stroke-width', '20');
        circle.setAttribute('stroke-dasharray', `${length} ${circumference - length}`);
        circle.setAttribute('stroke-dashoffset', `-${offset}`);
        circle.style.transition = `stroke-dasharray 1.5s ease-out ${index * 0.1}s`;
        circle.style.opacity = '0';

        svg.appendChild(circle);

        // Animate in
        requestAnimationFrame(() => {
            setTimeout(() => {
                circle.style.opacity = '1';
            }, 100);
        });

        cumulativePercent += percent;
    });
}

// ========================================
// Party List (Election Results)
// ========================================
function initPartyList() {
    const container = document.getElementById('partyList');
    const parties = ELECTION_DATA.parties;
    const maxSeats = Math.max(...parties.map(p => p.seats));

    parties.forEach((party, index) => {
        const item = document.createElement('div');
        item.className = 'party-item';

        const barWidth = (party.seats / maxSeats) * 100;

        item.innerHTML = `
      <span class="party-dot" style="background: ${party.color}"></span>
      <span class="party-name">${party.name}</span>
      <div class="party-bar-wrapper">
        <div class="party-bar">
          <div class="party-bar-fill" style="background: ${party.color};" data-width="${barWidth}"></div>
        </div>
      </div>
      <span class="party-seats">${party.seats}</span>
    `;

        container.appendChild(item);

        // Animate bar
        setTimeout(() => {
            const fill = item.querySelector('.party-bar-fill');
            fill.style.width = barWidth + '%';
        }, 500 + index * 150);
    });
}

// ========================================
// Manifesto Tabs
// ========================================
function initManifestoTabs() {
    const tabsContainer = document.getElementById('manifestoTabs');
    const contentContainer = document.getElementById('manifestoContent');

    // Create tabs
    POLICY_CATEGORIES.forEach((cat, index) => {
        const btn = document.createElement('button');
        btn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
        btn.innerHTML = `<span class="tab-icon">${cat.icon}</span> ${cat.title}`;
        btn.addEventListener('click', () => selectTab(index));
        tabsContainer.appendChild(btn);
    });

    // Show first category
    renderManifesto(0);

    function selectTab(index) {
        tabsContainer.querySelectorAll('.tab-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
        });
        renderManifesto(index);
    }
}

function renderManifesto(index) {
    const container = document.getElementById('manifestoContent');
    const cat = POLICY_CATEGORIES[index];

    container.style.animation = 'none';
    container.offsetHeight; // trigger reflow
    container.style.animation = 'fadeIn 0.5s ease-out';

    let html = `
    <div class="manifesto-category-header">
      <span class="manifesto-category-icon">${cat.icon}</span>
      <h3 class="manifesto-category-title">${cat.title}</h3>
    </div>
    <p class="manifesto-category-summary">${cat.summary}</p>
    <div class="policy-grid">
  `;

    cat.details.forEach(detail => {
        html += `
      <div class="policy-card">
        <h4>${detail.subtitle}</h4>
        <p>${detail.content}</p>
      </div>
    `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// ========================================
// Chat Q&A System
// ========================================
function initChat() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const messagesContainer = document.getElementById('chatMessages');
    const suggestionsContainer = document.getElementById('chatSuggestions');

    // Initial bot greeting
    addBotMessage("こんにちは！第104代内閣総理大臣の高市早苗です。政権公約2026や選挙結果について、何でもお聞きください。「日本列島を、強く豊かに。」のビジョンのもと、お答えいたします。");

    // Send on button click
    sendBtn.addEventListener('click', handleSend);

    // Send on Enter
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Suggestion chips
    suggestionsContainer.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.dataset.query;
            input.value = query;
            handleSend();
        });
    });

    function handleSend() {
        const query = input.value.trim();
        if (!query) return;

        // Add user message
        addUserMessage(query);
        input.value = '';
        sendBtn.disabled = true;

        // Show typing indicator
        showTyping();

        // Simulate processing delay for natural feel
        const delay = 800 + Math.random() * 1200;
        setTimeout(() => {
            removeTyping();
            const response = findBestResponse(query);
            addBotMessage(response.text, response.category);
            sendBtn.disabled = false;
        }, delay);
    }

    function addBotMessage(text, category) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-bot';

        // Format text: convert **bold** to <strong>
        const formattedText = formatMessage(text);

        messageDiv.innerHTML = `
      <img src="assets/takaichi.png" alt="高市総理" class="message-avatar">
      <div class="message-bubble">${formattedText}</div>
    `;

        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-user';

        messageDiv.innerHTML = `
      <div class="message-avatar">👤</div>
      <div class="message-bubble">${escapeHtml(text)}</div>
    `;

        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message message-bot';
        typingDiv.id = 'typingIndicator';

        typingDiv.innerHTML = `
      <img src="assets/takaichi.png" alt="高市総理" class="message-avatar">
      <div class="message-bubble">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;

        messagesContainer.appendChild(typingDiv);
        scrollToBottom();
    }

    function removeTyping() {
        const typing = document.getElementById('typingIndicator');
        if (typing) typing.remove();
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// ========================================
// Text Formatting Utilities
// ========================================
function formatMessage(text) {
    // Escape HTML first
    let formatted = escapeHtml(text);

    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convert \n to <br>
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// Scroll Animations (Intersection Observer)
// ========================================
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
}
