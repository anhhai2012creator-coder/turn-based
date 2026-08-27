// Main JS setup

// Navigation
function navTo(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // Show target
    document.getElementById(screenId).classList.add('active');

    // Update bottom nav active state
    document.querySelectorAll('#bottom-nav .nav-btn').forEach(b => b.classList.remove('active'));

    // Attempt to match the button (simple matching based on onclick attribute)
    const btns = document.querySelectorAll('#bottom-nav .nav-btn');
    btns.forEach(btn => {
        if(btn.getAttribute('onclick').includes(screenId)) {
            btn.classList.add('active');
        }
    });
}

// UI Tabs setup
function switchGachaTab(tab) {
    document.querySelectorAll('#screen-gacha .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#screen-gacha .tab-content').forEach(c => c.classList.remove('active'));

    if(tab === 'daily') {
        document.querySelector('#screen-gacha .tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('gacha-daily').classList.add('active');
    } else {
        document.querySelector('#screen-gacha .tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('gacha-summon').classList.add('active');
    }
}

// --- Hệ thống Data & LocalStorage ---
const DEFAULT_DATA = {
    resources: {
        diamond: 300,
        coin: 1000,
        vpnc: 1000,
        vntb: 2
    },
    playerLevel: 1,
    chars: [
        { id: 'kangu', level: 1 },
        { id: 'meganer', level: 1 },
        { id: 'jaco', level: 1 }
    ],
    formation: [
        'kangu',   // slot 1
        'meganer', // slot 2
        'jaco'     // slot 3
    ],
    lastDailyLogin: null
};

let gameData = {};

function saveData() {
    localStorage.setItem('autoBattlerData', JSON.stringify(gameData));
    updateTopBarUI();
}

function checkGuestExpiration() {
    if(!gameData.chars) return;
    const now = new Date().getTime();
    let expiredIds = [];
    gameData.chars = gameData.chars.filter(c => {
        if(c.isGuest && c.expireTime && now > c.expireTime) {
            expiredIds.push(c.id);
            return false; // Loại bỏ
        }
        return true;
    });

    // Nếu có tướng hết hạn đang trong đội hình thì gỡ ra
    if(expiredIds.length > 0) {
        gameData.formation = gameData.formation.map(f => expiredIds.includes(f) ? null : f);
        saveData();
    }
}

function loadData() {
    const saved = localStorage.getItem('autoBattlerData');
    if (saved) {
        gameData = JSON.parse(saved);
        // Fallback for new fields
        if(!gameData.resources) gameData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    if(gameData.campaignStage === undefined) gameData.campaignStage = 1;
    } else {
        gameData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    checkGuestExpiration();
}

function updateTopBarUI() {
    document.getElementById('res-diamond').innerText = gameData.resources.diamond;
    document.getElementById('res-coin').innerText = gameData.resources.coin;
    document.getElementById('res-vpnc').innerText = gameData.resources.vpnc;
    document.getElementById('res-vntb').innerText = gameData.resources.vntb;
    document.getElementById('player-level').innerText = gameData.playerLevel;
}

// --- Hệ thống Ngoại tuyến (Sự kiện, Triệu hồi, Túi đồ) ---

// 1. Sự kiện Giftcode
function claimGiftcode() {
    const code = document.getElementById('giftcode-input').value.trim();

    if(!gameData.claimedCodes) gameData.claimedCodes = [];

    if (code === 'CODETUAN001') {
        if (gameData.claimedCodes.includes(code)) {
            alert('Mã này đã được sử dụng!');
        } else {
            gameData.resources.diamond += 400;
            gameData.claimedCodes.push(code);
            saveData();
            alert('Nhận thành công 400 Kim Cương!');
        }
    } else if (code === 'F.Hit' || code === 'NHANVATMOI') {
        if (gameData.claimedCodes.includes(code)) {
            alert('Mã này đã được sử dụng!');
        } else {
            gameData.resources.vntb += 3;
            gameData.claimedCodes.push(code);
            saveData();
            alert('Nhận thành công 3 Viên Ngọc Thần Bí!');
        }
    } else {
        alert('Mã không hợp lệ!');
    }
    document.getElementById('giftcode-input').value = '';
}

// Sự kiện Flash Sale Logic
let currentSalePercent = 0;
function initEventScreen() {
    // Random flash sale 5% - 88%
    // Cơ chế: 30% tỉ lệ mở ra có sale
    if(Math.random() < 0.3) {
        currentSalePercent = Math.floor(Math.random() * (88 - 5 + 1)) + 5;
        document.getElementById('flash-sale-banner').style.display = 'block';
        document.getElementById('flash-sale-percent').innerText = currentSalePercent;
    } else {
        currentSalePercent = 0;
        document.getElementById('flash-sale-banner').style.display = 'none';
    }

    const hitPrice = Math.floor(110000 * (1 - currentSalePercent/100));
    const vpncPrice = Math.floor(500 * (1 - currentSalePercent/100));

    document.getElementById('sale-hit-price').innerText = hitPrice.toLocaleString();
    document.getElementById('sale-vpnc-price').innerText = vpncPrice.toLocaleString();

    // Mời lữ khách đồng hành
    const guestSelect = document.getElementById('guest-select');
    guestSelect.innerHTML = '';
    let hasUnowned = false;
    Object.keys(CHARACTERS).forEach(id => {
        if(!gameData.chars.find(c => c.id === id)) {
            hasUnowned = true;
            const opt = document.createElement('option');
            opt.value = id;
            opt.innerText = CHARACTERS[id].name;
            guestSelect.appendChild(opt);
        }
    });

    // Check nếu đã thuê rồi (chỉ được thuê 1 lần hoặc đang có)
    const existingGuest = gameData.chars.find(c => c.isGuest);
    if(existingGuest) {
        document.getElementById('guest-event-content').innerHTML = `<p style="color:green; font-weight:bold;">Bạn đang thuê ${CHARACTERS[existingGuest.id].name} (Hết hạn sau 5 ngày kể từ lúc thuê).</p>`;
    } else if(!hasUnowned) {
         document.getElementById('guest-event-content').innerHTML = `<p style="color:#666;">Bạn đã sở hữu toàn bộ tướng!</p>`;
    }
}

function inviteGuest() {
    const guestSelect = document.getElementById('guest-select');
    if(!guestSelect || !guestSelect.value) return;
    const charId = guestSelect.value;

    // Thời gian expire = now + 5 days
    const expireTime = new Date().getTime() + (5 * 24 * 60 * 60 * 1000);

    gameData.chars.push({ id: charId, level: 99, isGuest: true, expireTime: expireTime });
    saveData();
    alert(`Mời thành công ${CHARACTERS[charId].name}! Tướng sẽ ở lại đội hình trong 5 ngày.`);
    initEventScreen(); // Refresh
}

function buySaleHit() {
    if(gameData.chars.find(c => c.id === 'hit')) {
        alert("Bạn đã sở hữu F.Hit rồi!");
        return;
    }
    const price = Math.floor(110000 * (1 - currentSalePercent/100));
    if(gameData.resources.diamond < price) {
        alert("Không đủ Kim Cương!");
        return;
    }
    gameData.resources.diamond -= price;
    gameData.chars.push({ id: 'hit', level: 1 });
    saveData();
    alert("Chúc mừng bạn đã nhận được nhân vật F.Hit!");
}

function buySaleVpnc() {
    const price = Math.floor(500 * (1 - currentSalePercent/100));
    if(gameData.resources.diamond < price) {
        alert("Không đủ Kim Cương!");
        return;
    }
    gameData.resources.diamond -= price;
    gameData.resources.vpnc += 500;
    saveData();
    alert("Mua thành công 500 VPNC!");
}

// 2. Khu vui chơi - Điểm danh
function renderDailyReward() {
    const today = new Date().toDateString();
    const btn = document.getElementById('btn-claim-daily');
    const container = document.getElementById('daily-rewards');

    container.innerHTML = `
        <div class="inv-item" style="display:inline-block; margin-top:20px;">
            <i class="fas fa-gem" style="color: #00d2ff;"></i>
            <p>Phần thưởng: 50 KC, 500 VPNC</p>
        </div>
    `;

    if (gameData.lastDailyLogin === today) {
        btn.innerText = "Đã nhận";
        btn.disabled = true;
        btn.style.background = "#888";
    } else {
        btn.innerText = "Nhận Quà Hôm Nay";
        btn.disabled = false;
        btn.style.background = "var(--primary-color)";
    }
}

function claimDailyReward() {
    const today = new Date().toDateString();
    if (gameData.lastDailyLogin !== today) {
        gameData.resources.diamond += 50;
        gameData.resources.vpnc += 500;
        gameData.lastDailyLogin = today;
        saveData();
        renderDailyReward();
        alert("Điểm danh thành công!");
    }
}

// 3. Triệu hồi
function summon(times) {
    if (gameData.resources.vntb < times) {
        alert("Không đủ VNTB!");
        return;
    }

    gameData.resources.vntb -= times;
    let resultText = "";

    for(let i=0; i<times; i++) {
        const rand = Math.random();
        if(rand < 0.05) {
            // Tỷ lệ rất thấp ra nhân vật (ở đây fix ra Kangu nếu trúng)
            resultText += "<p style='color:orange;'>🎉 Trúng Nhân Vật (Đã quy đổi 1000 VPNC vì bạn đã có đủ)!</p>";
            gameData.resources.vpnc += 1000;
        } else if(rand < 0.4) {
            resultText += "<p>Nhận 50 Kim cương</p>";
            gameData.resources.diamond += 50;
        } else if(rand < 0.7) {
            resultText += "<p>Nhận 500 Xu</p>";
            gameData.resources.coin += 500;
        } else {
            resultText += "<p>Nhận 300 VPNC</p>";
            gameData.resources.vpnc += 300;
        }
    }

    document.getElementById('summon-result').innerHTML = resultText;
    saveData();
}

// 4. Túi đồ
function renderInventory() {
    const inv = document.getElementById('inventory-grid');
    inv.innerHTML = `
        <div class="inv-item">
            <i class="fas fa-gem" style="color: #00d2ff;"></i>
            <p>${gameData.resources.diamond} Kim Cương</p>
        </div>
        <div class="inv-item">
            <i class="fas fa-coins" style="color: #ffd700;"></i>
            <p>${gameData.resources.coin} Xu</p>
        </div>
        <div class="inv-item">
            <i class="fas fa-arrow-up-right-dots" style="color: #ff5722;"></i>
            <p>${gameData.resources.vpnc} VPNC</p>
        </div>
        <div class="inv-item">
            <i class="fas fa-meteor" style="color: #9c27b0;"></i>
            <p>${gameData.resources.vntb} VNTB</p>
        </div>
    `;
}

// --- Hệ thống Danh sách Tướng & Nâng cấp ---
const CHARACTERS = {
    'kangu': {
        name: 'Kangu (DEF)',
        baseHp: 150000000,
        baseAtk: 13275000,
        baseDef: 6400,
        baseSpd: 145,
        maxEn: 4,
        color: '#27ae60'
    },
    'meganer': {
        name: 'Mega Ner (ATK)',
        baseHp: 220000000,
        baseAtk: 14175000,
        baseDef: 1900,
        baseSpd: 150,
        maxEn: 5,
        color: '#e74c3c'
    },
    'jaco': {
        name: 'Jaco (SKL)',
        baseHp: 190000000,
        baseAtk: 11475000,
        baseDef: 3200,
        baseSpd: 155,
        maxEn: 4.5,
        color: '#8e44ad'
    },
    'hit': {
        name: 'F.Hit (SKL)',
        baseHp: 2450000, // Theo yêu cầu, HP khá thấp so với các tướng cũ
        baseAtk: 11550000,
        baseDef: 5400,
        baseSpd: 155,
        maxEn: 7,
        color: '#34495e'
    },
    'jiren': {
        name: 'Jiren (ATK)',
        baseHp: 235549000,
        baseAtk: 18750000,
        baseDef: 3000,
        baseSpd: 150,
        maxEn: 4.6,
        color: '#d35400'
    },
    'gokuxeno': {
        name: 'Goku Xeno (DEF)',
        baseHp: 290000000,
        baseAtk: 13500000,
        baseDef: 6550,
        baseSpd: 145,
        maxEn: 3,
        color: '#f1c40f'
    },
    'coolergold': {
        name: 'Cooler Gold (DEF)',
        baseHp: 285000000,
        baseAtk: 13830000,
        baseDef: 5780,
        baseSpd: 145,
        maxEn: 4,
        color: '#f39c12'
    },
    'brolysp': {
        name: 'Broly SP (ATK)',
        baseHp: 224500000,
        baseAtk: 20000000,
        baseDef: 4300,
        baseSpd: 150,
        maxEn: 3,
        color: '#1abc9c'
    },
    'zamasu': {
        name: 'Zamasu Coll. (SKL)',
        baseHp: 276688000,
        baseAtk: 14348000,
        baseDef: 4200,
        baseSpd: 155,
        maxEn: 4.4,
        color: '#9b59b6'
    }
};

let selectedFormationSlot = 1;
let selectedModalCharId = null;

function getCharStats(id, level) {
    const base = CHARACTERS[id];
    // Mỗi level tăng 2% chỉ số
    const multiplier = 1 + ((level - 1) * 0.02);

    let stats = {
        hp: Math.floor(base.baseHp * multiplier),
        atk: Math.floor(base.baseAtk * multiplier),
        def: Math.floor(base.baseDef * multiplier),
        spd: Math.floor(base.baseSpd * multiplier),
        maxEn: base.maxEn,
        name: base.name,
        color: base.color,
        type: base.name.includes('(ATK)') ? 'ATK' : (base.name.includes('(DEF)') ? 'DEF' : 'SKL')
    };

    // Kỹ năng Thần 2 (lv 251) stat boosts
    if(level >= 251) {
        if(id === 'jiren') {
            stats.hp = Math.floor(stats.hp * 1.15);
            stats.atk = Math.floor(stats.atk * 1.08);
        } else if(id === 'coolergold') {
            stats.atk = Math.floor(stats.atk * 1.25);
        } else if(id === 'brolysp') {
            stats.hp = Math.floor(stats.hp * 1.25);
        } else if(id === 'zamasu') {
            stats.atk = Math.floor(stats.atk * 1.10);
            stats.hp = Math.floor(stats.hp * 1.08);
        }
    }

    return stats;
}

function getUpgradeCost(level) {
    // Giá gốc 100 VPNC, mỗi lv tăng 5% chi phí
    return Math.floor(100 * Math.pow(1.05, level - 1));
}

let currentRosterTab = 'owned';

function switchRosterTab(tab) {
    currentRosterTab = tab;
    document.getElementById('tab-owned').classList.remove('active');
    document.getElementById('tab-unowned').classList.remove('active');
    document.getElementById(`tab-${tab}`).classList.add('active');

    if(tab === 'owned') {
        document.getElementById('formation-panel-container').style.display = 'block';
        document.getElementById('char-list-title').innerText = "Nhân vật sở hữu";
    } else {
        document.getElementById('formation-panel-container').style.display = 'none';
        document.getElementById('char-list-title').innerText = "Nhân vật chưa sở hữu";
    }
    renderRoster();
}

function renderRoster() {
    // Render Formation if on owned tab
    if (currentRosterTab === 'owned') {
        for(let i=1; i<=3; i++) {
            const charId = gameData.formation[i-1];
            const slotEl = document.getElementById(`f-char-${i}`);
            if(charId) {
                const stats = getCharStats(charId, 1);
                slotEl.innerHTML = `<div class="char-icon" style="background:${stats.color}">${stats.name.charAt(0)}</div><span>${stats.name.split(' ')[0]}</span>`;
            } else {
                slotEl.innerHTML = `<span>Trống</span>`;
            }
        }
    }

    // Render Char List
    const container = document.getElementById('owned-chars');
    container.innerHTML = '';

    if (currentRosterTab === 'owned') {
        gameData.chars.forEach(char => {
            const stats = getCharStats(char.id, char.level);
            const div = document.createElement('div');
            div.className = 'char-card';
            div.onclick = () => openCharModal(char.id);
            div.innerHTML = `
                <div class="char-icon" style="background:${stats.color}">${stats.name.charAt(0)}</div>
                <div style="font-size:0.8em; font-weight:bold;">${stats.name.split(' ')[0]}</div>
                <div style="font-size:0.7em;">Lv. ${char.level}</div>
            `;
            container.appendChild(div);
        });
    } else {
        // Unowned
        Object.keys(CHARACTERS).forEach(id => {
            if(!gameData.chars.find(c => c.id === id)) {
                const stats = getCharStats(id, 1);
                const div = document.createElement('div');
                div.className = 'char-card';
                div.style.filter = "grayscale(100%)";
                div.style.opacity = "0.7";
                div.innerHTML = `
                    <div class="char-icon" style="background:${stats.color}">${stats.name.charAt(0)}</div>
                    <div style="font-size:0.8em; font-weight:bold;">${stats.name.split(' ')[0]}</div>
                    <div style="font-size:0.7em;">Chưa có</div>
                `;
                container.appendChild(div);
            }
        });
    }
}

function selectSlot(slot) {
    document.querySelectorAll('.f-slot').forEach(el => el.classList.remove('selected'));
    document.getElementById(`slot-${slot}`).classList.add('selected');
    selectedFormationSlot = slot;
}

function openCharModal(id) {
    selectedModalCharId = id;
    const char = gameData.chars.find(c => c.id === id);
    const stats = getCharStats(id, char.level);

    document.getElementById('modal-char-name').innerText = stats.name;
    document.getElementById('modal-char-name').style.color = stats.color;
    document.getElementById('modal-char-lv').innerText = char.level;
    document.getElementById('modal-char-hp').innerText = stats.hp.toLocaleString();
    document.getElementById('modal-char-atk').innerText = stats.atk.toLocaleString();
    document.getElementById('modal-char-def').innerText = stats.def.toLocaleString();
    document.getElementById('modal-char-spd').innerText = stats.spd.toLocaleString();

    const cost = getUpgradeCost(char.level);
    document.getElementById('modal-upgrade-cost').innerText = char.level >= 350 ? "Tối đa" : cost;

    document.getElementById('char-modal').classList.add('active');
}

const EFFECTS_DICT = {
    'Suy Giảm': 'Giảm 40% khả năng hồi phục.',
    'Song Bích': 'Khi có đồng minh cùng hiệu ứng, tăng 20% sát thương gây ra.',
    'Dấu Ấn HP': 'Tích 3 dấu ấn giúp đồng đội tăng 10% lượng máu được hồi.',
    'Ăn Mòn': 'Mất máu ở đầu lượt bằng 3% HP tối đa (cap: 23% ATK người gắn). Dồn tối đa 5 lần.',
    'Choáng': 'Bỏ qua lượt hành động.',
    'Bạo Kích': 'Kỹ năng chủ động gây 300% sát thương (Tướng ATK có sẵn 10% cơ bản).',
    'Severe wound': 'Sau 2 lượt kết thúc, nổ sát thương bằng phần trăm lượng sát thương nhận vào trong thời gian đó. Chết do hiệu ứng này sẽ bị cấm kích hoạt nội tại sau cái chết.',
    'Beserk': 'Cứ mỗi 0.5% HP mất đi, tăng 1% sát thương gây ra.',
    'Bảo vệ': 'Chia sẻ 25% sát thương nhận vào cho người buff.',
    'Phân tán': 'Xoá bỏ các hiệu ứng có lợi của mục tiêu.',
    'Dũng cảm': 'Kẻ địch bị hạ gục bởi người mang hiệu ứng này sẽ không thể hồi sinh.',
    'Bleeding': 'Mỗi khi mục tiêu gây sát thương, đốt máu 0.5% HP của mục tiêu đó. Cộng dồn tối đa 5 lần (tối đa 2.5% HP/lần).',
    'Terror': 'Khiến mục tiêu bị giảm 30% sát thương gây ra.'
};

function openEffectModal() {
    let html = '';
    for (const [key, value] of Object.entries(EFFECTS_DICT)) {
        html += `<div style="margin-bottom:10px; border-bottom:1px solid #ddd; padding-bottom:5px;">
                    <strong style="color:var(--secondary-color)">[${key}]</strong>: ${value}
                 </div>`;
    }
    document.getElementById('effect-list').innerHTML = html;
    document.getElementById('effect-modal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function upgradeChar() {
    const char = gameData.chars.find(c => c.id === selectedModalCharId);
    if(char.level >= 350) {
        alert("Nhân vật đã đạt cấp tối đa!");
        return;
    }

    const cost = getUpgradeCost(char.level);
    if(gameData.resources.vpnc < cost) {
        alert("Không đủ VPNC!");
        return;
    }

    gameData.resources.vpnc -= cost;
    char.level += 1;
    saveData();
    openCharModal(selectedModalCharId); // Refresh modal
    renderRoster(); // Refresh list
}

function equipChar() {
    if(!selectedFormationSlot) {
        alert("Vui lòng chọn vị trí (slot) trước!");
        return;
    }

    // Check if char is already in another slot
    const existingIndex = gameData.formation.indexOf(selectedModalCharId);
    if (existingIndex !== -1) {
        gameData.formation[existingIndex] = null; // Remove from old slot
    }

    gameData.formation[selectedFormationSlot - 1] = selectedModalCharId;
    saveData();
    renderRoster();
    closeModal('char-modal');
}


// --- Hệ thống Battle Engine ---
let battleState = {
    type: 'test', // test or campaign
    stageInfo: null,
    teams: { A: [], B: [] }, // A is player, B is enemy
    log: [],
    timer: null,
    isOver: false
};

function logBattle(msg) {
    const logEl = document.getElementById('battle-log');
    const p = document.createElement('div');
    p.innerHTML = msg;
    logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;
}

function startBattleTest() {
    startBattleSetup('test', null, [
        {id: 'kangu', level: 10},
        {id: 'meganer', level: 10},
        {id: 'jaco', level: 10}
    ]);
}

function startBattleSetup(type, stageInfo, enemyList) {
    // Navigate to battle screen if not already there
    navTo('screen-battle-test');

    battleState.type = type;
    battleState.stageInfo = stageInfo;

    document.getElementById('battle-arena').style.display = 'flex';
    document.getElementById('battle-log').style.display = 'block';
    document.getElementById('battle-log').innerHTML = '';

    // Clear previous timer
    if(battleState.timer) clearTimeout(battleState.timer);

    battleState.isOver = false;

    // Init Player Team (Team A) based on formation
    battleState.teams.A = [];
    gameData.formation.forEach((charId, idx) => {
        if(charId) {
            const level = gameData.chars.find(c => c.id === charId).level;
            const stats = getCharStats(charId, level);
            let fighter = {
                uid: 'A' + idx,
                team: 'A',
                id: charId,
                name: stats.name.split(' ')[0],
                hp: stats.hp,
                maxHp: stats.hp,
                atk: stats.atk,
                def: stats.def,
                spd: stats.spd,
                en: 0,
                maxEn: stats.maxEn,
                color: stats.color,
                isDead: false,
                level: level,
                buffs: []
            };

            // Nội tại đầu trận
            if(charId === 'meganer' && level >= 50) {
                fighter.en = 2; // Mega Ner (lv50): Đầu trận nhận sẵn 2 năng lượng
            }

            battleState.teams.A.push(fighter);
        }
    });

    // Init Enemy Team (Team B)
    battleState.teams.B = [];
    enemyList.forEach((e, idx) => {
        battleState.teams.B.push(createEnemy(e.id, e.level, 'B' + idx));
    });

    // Nội tại [Song Bích] Mega Ner lv 80
    applySongBich(battleState.teams.A);
    applySongBich(battleState.teams.B);

    renderBattleArena();
    logBattle("--- BẮT ĐẦU TRẬN CHIẾN ---");
    if(type === 'campaign') logBattle(`<b>ẢI ${stageInfo}</b>`);

    // Random team đi trước
    const goesFirst = Math.random() < 0.5 ? 'A' : 'B';
    logBattle(`Đội ${goesFirst === 'A' ? 'Người Chơi' : 'Địch'} được quyền đi trước!`);

    battleLoop(goesFirst);
}

function applySongBich(team) {
    const meganers = team.filter(f => f.id === 'meganer' && f.level >= 80);
    if(meganers.length >= 2) {
        meganers.forEach(m => m.buffs.push({type: 'song_bich', value: 0.2}));
    }
}

function createEnemy(id, level, uid) {
    const stats = getCharStats(id, level);
    return {
        uid: uid, team: 'B', id: id, name: stats.name.split(' ')[0] + " (Enemy)", hp: Math.floor(stats.hp * 0.5), maxHp: Math.floor(stats.hp * 0.5), atk: Math.floor(stats.atk * 0.5), def: Math.floor(stats.def * 0.5), spd: stats.spd, en: 0, maxEn: stats.maxEn, color: '#333', isDead: false, level: level, buffs: []
    };
}

function renderBattleArena() {
    ['A', 'B'].forEach(t => {
        const teamId = t === 'A' ? 'team-player-arena' : 'team-enemy-arena';
        const el = document.getElementById(teamId);
        el.innerHTML = '';
        battleState.teams[t].forEach(f => {
            const hpPct = Math.max(0, (f.hp / f.maxHp) * 100);
            const enPct = Math.min(100, (f.en / f.maxEn) * 100);

            el.innerHTML += `
                <div class="battle-char ${f.isDead ? 'dead' : ''}" id="char-${f.uid}">
                    <div class="char-icon" style="background:${f.color}; margin: 0 auto;">${f.name.charAt(0)}</div>
                    <div class="char-name-mini">${f.name}</div>
                    <div class="hp-bar-container"><div class="hp-bar" style="width:${hpPct}%"></div></div>
                    <div class="en-bar-container"><div class="en-bar" style="width:${enPct}%"></div></div>
                </div>
            `;
        });
    });
}

function showFloatingText(uid, text, type) {
    const el = document.getElementById(`char-${uid}`);
    if(el) {
        const floatEl = document.createElement('div');
        floatEl.className = type === 'heal' ? 'heal-text' : 'damage-text';
        floatEl.innerText = text;
        el.appendChild(floatEl);
        setTimeout(() => { if(el.contains(floatEl)) el.removeChild(floatEl); }, 1000);
    }
}

function calcDamage(attacker, defender, rawDmg, isSkill = false) {
    // Kangu (bị động 1)
    if(attacker.id === 'kangu' && attacker.level >= 50) {
        const missingHpPct = 1 - (attacker.hp / attacker.maxHp);
        const dmgBonus = Math.floor(missingHpPct / 0.07) * 0.01;
        rawDmg *= (1 + dmgBonus);
    }

    // Mega Ner (bị động 3)
    if(attacker.id === 'meganer' && attacker.hp / attacker.maxHp < 0.2) {
        rawDmg *= 1.1;
    }

    // Check [Song Bích]
    if(attacker.buffs.find(b => b.type === 'song_bich')) {
        rawDmg *= 1.2;
    }

    // Check [Dmg Boost] (Mega Ner active buff & Jaco passive 1 buff)
    const dmgBoostBuffs = attacker.buffs.filter(b => b.type === 'dmg_boost');
    dmgBoostBuffs.forEach(b => {
        rawDmg *= (1 + b.value);
    });

    // F.Hit Passive 3: DMG Reduction
    const hitDmgReductBuffs = defender.buffs.filter(b => b.type === 'hit_dmg_reduct');
    let hitDmgReduct = 0;
    hitDmgReductBuffs.forEach(b => { hitDmgReduct += b.value; });

    // Xuyên giáp (Jiren & Broly & Goku Xeno kĩ năng thần)
    let armorPen = 0;
    if(attacker.id === 'jiren' && attacker.level >= 80) armorPen += 0.45;
    if(attacker.id === 'brolysp') armorPen += 0.3;
    if(attacker.id === 'gokuxeno' && attacker.level >= 251) armorPen += 0.06;

    // Zamasu Passive 1: Kẻ tấn công mang Terror bị giảm 30% ST
    if(attacker.buffs.find(b => b.type === 'terror')) {
        rawDmg *= 0.7; // Giảm 30% ST gây ra
    }

    // Thủ = cứ 100 DEF giảm 0.1% ST (Bỏ qua giáp)
    const effectiveDef = defender.def * Math.max(0, 1 - armorPen);
    const defReduct = Math.min(0.9, (effectiveDef / 100) * 0.001);

    // Zamasu Passive 3: Đồng đội nhận 5% giảm ST nếu Zamasu còn sống
    // (Ta có thể check qua mảng battleState nhưng đơn giản hơn ta check nếu Zamasu đang là đồng minh)
    let zamasuReduct = 0;
    // Chú ý: Hàm này không có context của `allies`, ta sẽ handle bên ngoài hoặc pass vào,
    // nhưng để đơn giản, ta buff aura vào `allies` lúc render hoặc ở đây ta check trực tiếp:
    const team = battleState.teams[defender.team];
    if(team.find(t => t.id === 'zamasu' && !t.isDead)) {
        zamasuReduct = 0.05;
    }

    // Nội tại game: Toàn bộ tướng có 20% giảm 30% ST nhận vào
    let rngDmgReduct = 0;
    if(Math.random() < 0.2) rngDmgReduct = 0.3;

    // Goku Xeno [Bảo vệ] buff giảm ST (15% ở lv130)
    let gokuProtectReduct = 0;
    if(defender.buffs.find(b => b.type === 'bao_ve')) gokuProtectReduct = 0.15;

    // Cooler giảm ST khi có debuff
    let coolerReduct = 0;
    if(defender.id === 'coolergold' && defender.level >= 130 && defender.buffs.some(b => ['an_mon', 'suy_giam', 'stun', 'severe_wound', 'bleeding', 'terror'].includes(b.type))) {
        coolerReduct = 0.2;
    }

    // Áp dụng phòng thủ và các loại giảm ST
    const totalReduct = Math.min(0.95, defReduct + hitDmgReduct + rngDmgReduct + gokuProtectReduct + coolerReduct + zamasuReduct);

    let finalDmg = Math.max(1, Math.floor(rawDmg * (1 - totalReduct)));

    // Goku Xeno Passive 1 (Bảo vệ chia sẻ 25% ST)
    const baoVeBuff = defender.buffs.find(b => b.type === 'bao_ve');
    if(baoVeBuff && defender.id !== 'gokuxeno') {
        const goku = team.find(t => t.uid === baoVeBuff.buffer && !t.isDead);
        if(goku) {
            const sharedDmg = Math.floor(finalDmg * 0.25);
            finalDmg -= sharedDmg;
            goku.hp -= sharedDmg;
            showFloatingText(goku.uid, `-${sharedDmg}`, 'damage'); // Goku nhận ST chia sẻ
        }
    }

    return finalDmg;
}

function updateFHitPassive3(allies) {
    // Tìm các F.Hit trong đội để cấp aura giảm ST
    const hits = allies.filter(a => a.id === 'hit' && !a.isDead);

    // Tính tổng số stack (1 gốc + số lần ally chết/hit hồi sinh)
    let totalStackCount = 0;
    hits.forEach(hit => {
        totalStackCount += (1 + (hit.deathCount || 0) + (hit.allyDeathCount || 0));
    });

    // Tối đa base là 0.05, mỗi lần thêm là 0.08
    // Vì có thể có nhiều F.Hit (nếu địch cũng có), tính độc lập
    // Nhưng logic áp dụng trên toàn đội, nên ta sẽ clear buff cũ và add buff mới

    // Remove old hit_dmg_reduct (always remove first to clean up if F.Hit dies)
    allies.forEach(a => {
        a.buffs = a.buffs.filter(b => b.type !== 'hit_dmg_reduct');
    });

    if (totalStackCount > 0) {
        // Add new
        hits.forEach(hit => {
            const base = 0.05;
            const extra = ((hit.deathCount || 0) + (hit.allyDeathCount || 0)) * 0.08;
            allies.forEach(a => {
                a.buffs.push({type: 'hit_dmg_reduct', value: base + extra});
            });
        });
    }
}

function battleLoop(currentTeam) {
    if(battleState.isOver) return;

    // Kiểm tra win/lose
    const aAlive = battleState.teams.A.filter(f => !f.isDead);
    const bAlive = battleState.teams.B.filter(f => !f.isDead);

    if(aAlive.length === 0 || bAlive.length === 0) {
        battleState.isOver = true;
        const playerWon = aAlive.length > 0;
        logBattle(`<b>TRẬN ĐẤU KẾT THÚC! Đội ${playerWon ? 'Người Chơi' : 'Địch'} Dành Chiến Thắng!</b>`);

        if (battleState.type === 'campaign' && playerWon) {
            // Reward and unlock next
            let exp = 100;
            let diamondReward = 20;
            // Mid-autumn event boost
            exp = Math.floor(exp * 1.3);
            diamondReward = Math.floor(diamondReward * 1.4);

            gameData.resources.diamond += diamondReward;
            logBattle(`<b style="color:green">Nhận thưởng Ải: ${exp} EXP, ${diamondReward} Kim Cương (Đã tính boost sự kiện)</b>`);

            if(battleState.stageInfo === gameData.campaignStage) {
                gameData.campaignStage++;
                saveData();
            }
        }
        return;
    }

    // Lấy team hiện tại và sort theo SPD giảm dần
    let teamMembers = currentTeam === 'A' ? aAlive : bAlive;
    teamMembers.sort((a, b) => b.spd - a.spd);

    let i = 0;

    function executeAction() {
        if(battleState.isOver) return;

        // Nếu ai đó chết giữa turn, bỏ qua
        while(i < teamMembers.length && teamMembers[i].isDead) {
            i++;
        }

        if (i >= teamMembers.length) {
            // Hết turn của team này, chuyển team kia
            setTimeout(() => battleLoop(currentTeam === 'A' ? 'B' : 'A'), 1000);
            return;
        }

        const attacker = teamMembers[i];

        const enemies = currentTeam === 'A' ? battleState.teams.B.filter(f => !f.isDead) : battleState.teams.A.filter(f => !f.isDead);
        const allies = currentTeam === 'A' ? battleState.teams.A.filter(f => !f.isDead) : battleState.teams.B.filter(f => !f.isDead);

        // Update Hit passive 3 for allies before action
        updateFHitPassive3(allies);

        // Áp dụng sát thương ĂN MÒN đầu lượt
        const anMonBuffs = attacker.buffs.filter(b => b.type === 'an_mon');
        if(anMonBuffs.length > 0) {
            let totalAnMonDmg = 0;
            anMonBuffs.forEach(b => {
                totalAnMonDmg += b.value;
            });
            attacker.hp -= totalAnMonDmg;
            showFloatingText(attacker.uid, `-${totalAnMonDmg}`, 'damage');
            logBattle(`${attacker.name} chịu ${totalAnMonDmg} ST từ [ĂN MÒN]!`);
            if(attacker.hp <= 0) {
                attacker.hp = 0;
                attacker.isDead = true;
                handleDeath(attacker, allies); // Xử lý chết (hồi sinh nếu là Hit)
                if(attacker.isDead) { // Nếu vẫn chết sau hồi sinh
                    renderBattleArena();
                    i++;
                    battleState.timer = setTimeout(executeAction, 1000);
                    return;
                }
            }
        }

        // Áp dụng sát thương Severe Wound
        const swBuffs = attacker.buffs.filter(b => b.type === 'severe_wound');
        if(swBuffs.length > 0) {
            let totalSwDmg = 0;
            swBuffs.forEach(b => {
                if(b.duration === 1) { // Will expire this turn
                    totalSwDmg += Math.floor(b.dmgTaken * b.value);
                }
            });
            if(totalSwDmg > 0) {
                attacker.hp -= totalSwDmg;
                showFloatingText(attacker.uid, `-${totalSwDmg}`, 'damage');
                logBattle(`${attacker.name} chịu ${totalSwDmg} ST nổ từ [Severe Wound]!`);
                if(attacker.hp <= 0) {
                    attacker.hp = 0;
                    attacker.isDead = true;
                    // Bị giết bởi Severe Wound -> cấm hồi sinh/nội tại chết
                    attacker.banDeathPassive = true;
                    handleDeath(attacker, allies);
                    if(attacker.isDead) {
                        renderBattleArena();
                        i++;
                        battleState.timer = setTimeout(executeAction, 1000);
                        return;
                    }
                }
            }
        }

        // Hồi máu Cooler khi có debuff đầu turn
        if(attacker.id === 'coolergold' && attacker.level >= 80 && attacker.buffs.some(b => ['an_mon', 'suy_giam', 'stun', 'severe_wound', 'bleeding', 'terror'].includes(b.type))) {
            let heal = Math.floor(attacker.atk * 1.8);
            // Cooler Passive 3: Miễn nhiễm giảm hồi máu (suy giảm)
            if(attacker.level < 200 && attacker.buffs.find(b => b.type === 'suy_giam')) {
                heal = Math.floor(heal * 0.6);
            }
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
            showFloatingText(attacker.uid, `+${heal}`, 'heal');
            logBattle(`-> ${attacker.name} hồi phục ${heal} HP nhờ nội tại giải trừ!`);
        }

        // Goku Xeno Passive 3: Dưới 50% HP hồi 50% max HP 1 lần
        if(attacker.id === 'gokuxeno' && attacker.level >= 200 && (attacker.hp / attacker.maxHp) <= 0.5 && !attacker.hasGokuHealed) {
            attacker.hasGokuHealed = true;
            let heal = Math.floor(attacker.maxHp * 0.5);
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
            showFloatingText(attacker.uid, `+${heal}`, 'heal');
            logBattle(`-> ${attacker.name} hồi phục 50% HP từ nội tại sinh tồn!`);
        }

        // Broly nhận EN nếu HP > 80%
        if(attacker.id === 'brolysp' && attacker.level >= 130 && (attacker.hp / attacker.maxHp) > 0.8) {
            attacker.en += 2;
        }

        // Broly tăng ST mỗi 2 lượt (Passive 3)
        if(attacker.id === 'brolysp') {
            attacker.turnCount = (attacker.turnCount || 0) + 1;
            if(attacker.turnCount % 2 === 0) {
                attacker.brolyStack = Math.min(3, (attacker.brolyStack || 0) + 1);
            }
        }

        // Cập nhật UI acting
        document.querySelectorAll('.battle-char').forEach(el => el.classList.remove('acting'));
        const attackerEl = document.getElementById(`char-${attacker.uid}`);
        if(attackerEl) attackerEl.classList.add('acting');

        if (enemies.length === 0) {
             battleLoop(currentTeam); return; // Check lại win
        }

        // Logic xuất chiêu
        let target = enemies[0]; // Mặc định đánh tướng đầu tiên
        // F.Hit Passive 2
        if(attacker.id === 'hit' && attacker.en < attacker.maxEn) {
            let maxAtkEnemy = enemies[0];
            enemies.forEach(e => {
                if(e.atk > maxAtkEnemy.atk) maxAtkEnemy = e;
            });
            target = maxAtkEnemy;
        }
        // Jiren / Cooler ưu tiên hàng sau (last index)
        if((attacker.id === 'jiren' && attacker.level >= 80) || (attacker.id === 'coolergold' && attacker.en >= attacker.maxEn)) {
            target = enemies[enemies.length - 1];
        }

        // Bạo Kích check
        let isCrit = false;
        let critRate = 0;
        if(attacker.type === 'ATK') critRate += 0.1;
        // Jiren crit
        if(attacker.id === 'jiren' && attacker.level >= 130) critRate += 0.23;
        const jirenCritBuff = attacker.buffs.find(b => b.type === 'jiren_crit');
        if(jirenCritBuff) critRate += jirenCritBuff.value;
        // Broly crit
        if(attacker.id === 'brolysp') {
            critRate += 1.0; // Passive 3 +100%
            if(attacker.level >= 130) critRate += 0.2;
            if(attacker.level >= 251) critRate += 0.08;
            if(attacker.buffs.find(b => b.type === 'broly_crit')) critRate += 0.3;
        }

        if(Math.random() < critRate) isCrit = true;
        // Chỉ skill mới crit, trừ broly
        if(attacker.en < attacker.maxEn && attacker.id !== 'brolysp') isCrit = false;

        // Giảm turn buff
        attacker.buffs.forEach(b => {
            if(b.duration !== undefined) b.duration -= 1;
        });
        attacker.buffs = attacker.buffs.filter(b => b.duration === undefined || b.duration >= 0);

        // Miễn CC (Broly kĩ năng thần)
        const isCcImmune = attacker.id === 'brolysp' && attacker.level >= 251 && (attacker.hp / attacker.maxHp) > 0.8;

        // Choáng check
        if(!isCcImmune && attacker.buffs.find(b => b.type === 'stun')) {
            logBattle(`<span style="color:${attacker.color}">${attacker.name}</span> đang bị choáng, bỏ qua lượt!`);
            i++;
            battleState.timer = setTimeout(executeAction, 1000);
            return;
        }

        // Apply Bleeding Damage to attacker BEFORE calculating damage
        const bleedingBuffs = attacker.buffs.filter(b => b.type === 'bleeding');
        if(bleedingBuffs.length > 0) {
            let totalBleedPct = 0;
            bleedingBuffs.forEach(b => { totalBleedPct += b.value; });
            // Cap at 5 stacks (2.5%)
            totalBleedPct = Math.min(0.025, totalBleedPct);

            let bleedDmg = Math.floor(attacker.maxHp * totalBleedPct);

            // Check if any Zamasu is lv 251 to boost bleed dmg by 20%
            const hasZamasuGod = enemies.some(en => en.id === 'zamasu' && en.level >= 251 && !en.isDead);
            if(hasZamasuGod) bleedDmg = Math.floor(bleedDmg * 1.2);

            attacker.hp -= bleedDmg;
            showFloatingText(attacker.uid, `-${bleedDmg}`, 'damage');
            logBattle(`-> ${attacker.name} bị đốt ${bleedDmg} HP từ [Bleeding].`);
            if(attacker.hp <= 0) {
                attacker.hp = 0;
                attacker.isDead = true;
                handleDeath(attacker, allies);
                if(attacker.isDead) {
                    renderBattleArena();
                    i++;
                    battleState.timer = setTimeout(executeAction, 1000);
                    return;
                }
            }
        }

        // Apply pre-attack multiplier for active skills or passives
        let dmgMultiplier = 1;
        if(isCrit) dmgMultiplier *= 3; // Bạo kích
        if(attacker.id === 'brolysp') {
            if(attacker.level >= 80) dmgMultiplier *= 1.65; // Passive 1
            if(attacker.brolyStack) dmgMultiplier *= (1 + (attacker.brolyStack * 0.25)); // Passive 3
        }
        if(attacker.id === 'jiren' && attacker.level >= 130 && (attacker.hp / attacker.maxHp) < 0.3) { // Beserk
            const missingHp = 1 - (attacker.hp / attacker.maxHp);
            dmgMultiplier *= (1 + (missingHp * 100 * 2 / 100)); // 0.5% HP = 1% ST -> 1% HP = 2% ST
        }
        if(attacker.id === 'zamasu' && attacker.level >= 251) { // Zamasu Thần 1: +20% dmg cho bleeding
             // Buffed Bleed (implemented via increasing base Zamasu damage conditionally if enemies bleed)
             // However, strictly "Tăng thêm 20% từ [bleeding]" means 1.2x bleed damage, or 1.2x total dmg?
             // Assuming 1.2x damage if enemy has bleeding for simplicity, or 1.2x bleed DoT.
             // We'll apply 1.2x bleed damage at DoT phase.
        }

        if (attacker.en >= attacker.maxEn) {
            // --- Dùng Kỹ Năng Chủ Động ---
            logBattle(`<span style="color:${attacker.color}">${attacker.name}</span> tung Kỹ Năng Chủ Động ${isCrit ? '<b>[BẠO KÍCH]</b>' : ''}!`);

            if (attacker.id === 'kangu') {
                // Kangu (4 en): Phóng ra 1 tia năng lượng gây 200% ATK kèm 5% HP còn lại của kẻ địch.
                let dmg = calcDamage(attacker, target, attacker.atk * 2.0);
                if (attacker.level >= 150) dmg = calcDamage(attacker, target, attacker.atk * 2.3);
                dmg += Math.floor(target.hp * 0.05);

                target.hp -= dmg;
                target.buffs.push({type: 'suy_giam', duration: 1}); // Giảm 40% hồi phục, ta sẽ set duration 1
                showFloatingText(target.uid, `-${dmg}`, 'damage');
                logBattle(`-> Gây ${dmg} ST lên ${target.name} và gây hiệu ứng Suy Giảm.`);

                // Nội tại 3 (lv 100): 75% phóng thêm 1 tia
                if (attacker.level >= 100 && Math.random() < 0.75) {
                    let extraDmg = Math.floor(dmg * 0.75);
                    target.hp -= extraDmg;
                    showFloatingText(target.uid, `-${extraDmg}`, 'damage');
                    logBattle(`-> (Nội tại) Phóng thêm tia năng lượng gây ${extraDmg} ST lên ${target.name}.`);
                }

            } else if (attacker.id === 'meganer') {
                // Mega Ner (5en): Dịch chuyển tới kẻ địch gây 280% ATK, tăng 15% ST
                let dmg = calcDamage(attacker, target, attacker.atk * 2.8);
                target.hp -= dmg;
                showFloatingText(target.uid, `-${dmg}`, 'damage');
                logBattle(`-> Dịch chuyển đánh ${target.name} gây ${dmg} ST.`);
                attacker.buffs.push({type: 'dmg_boost', value: 0.15, duration: 1});

            } else if (attacker.id === 'jaco') {
                // Jaco (4.5en): Tung 1 đánh thường cường hoá bằng 105% ATK, hồi máu toàn đội
                let dmg = calcDamage(attacker, target, attacker.atk * 1.05);
                target.hp -= dmg;
                showFloatingText(target.uid, `-${dmg}`, 'damage');
                logBattle(`-> Đánh cường hoá ${target.name} gây ${dmg} ST.`);

                // Jaco bị động 1: 1 trong 2 đồng đội nhận tăng 18% ST
                if(attacker.level >= 50) {
                    const otherAllies = allies.filter(a => a.uid !== attacker.uid);
                    if(otherAllies.length > 0) {
                        const randomAlly = otherAllies[Math.floor(Math.random() * otherAllies.length)];
                        randomAlly.buffs.push({type: 'dmg_boost', value: 0.18, duration: 1});
                        logBattle(`-> Tăng 18% ST cho ${randomAlly.name}.`);
                    }
                }

                let healMultiplier = attacker.level >= 150 ? 1.75 : 1.5;
                let healAmt = Math.floor(attacker.atk * healMultiplier);

                allies.forEach(ally => {
                    let finalHeal = healAmt;
                    if(attacker.level >= 80 && ally.hp / ally.maxHp < 0.5) finalHeal = Math.floor(finalHeal * 1.2);

                    // Kangu suy giảm bị động
                    if(ally.buffs.find(b => b.type === 'suy_giam')) {
                        finalHeal = Math.floor(finalHeal * 0.6); // Giảm 40%
                    }

                    // Jaco bị động 3 (Dấu ấn HP)
                    const hpMarks = ally.buffs.filter(b => b.type === 'hp_mark').length;
                    if(hpMarks >= 3) finalHeal = Math.floor(finalHeal * 1.1);

                    ally.hp = Math.min(ally.maxHp, ally.hp + finalHeal);
                    showFloatingText(ally.uid, `+${finalHeal}`, 'heal');
                });
                logBattle(`-> Hồi máu toàn đội!`);
            } else if (attacker.id === 'hit') {
                // Hit (7en): Gây ST bằng 110% ATK toàn địch, áp dụng [ĂN MÒN]
                let baseDmg = attacker.atk * 1.1 * dmgMultiplier;
                logBattle(`-> ${attacker.name} tấn công toàn đội địch!`);
                enemies.forEach(e => {
                    let actualDmg = calcDamage(attacker, e, baseDmg);
                    e.hp -= actualDmg;
                    showFloatingText(e.uid, `-${actualDmg}`, 'damage');
                    logBattle(`-> Gây ${actualDmg} ST lên ${e.name}.`);

                    let anMonDmg = Math.min(Math.floor(e.maxHp * 0.03), Math.floor(attacker.atk * 0.23));
                    const currentAnMonCount = e.buffs.filter(b => b.type === 'an_mon').length;
                    if(currentAnMonCount < 5) {
                        e.buffs.push({type: 'an_mon', value: anMonDmg, duration: 4});
                    }
                });
            } else if (attacker.id === 'jiren') {
                let jirenBase = 2.75;
                if(attacker.level >= 180) jirenBase += 0.40;
                let actualDmg = calcDamage(attacker, target, attacker.atk * jirenBase * dmgMultiplier);
                target.hp -= actualDmg;
                showFloatingText(target.uid, `-${actualDmg}`, 'damage');
                logBattle(`-> Gây ${actualDmg} ST lên ${target.name}.`);

                let currentJirenCrit = 0;
                attacker.buffs.filter(b => b.type === 'jiren_crit').forEach(b => currentJirenCrit += b.value);
                if(currentJirenCrit < 0.45) { // 3 tầng x 15%
                    attacker.buffs.push({type: 'jiren_crit', value: 0.15}); // Tăng vĩnh viễn trong trận
                }
            } else if (attacker.id === 'gokuxeno') {
                let actualDmg = attacker.atk * 0.55 * dmgMultiplier;
                logBattle(`-> Tấn công diện rộng!`);
                enemies.forEach(e => {
                    let finalDmg = calcDamage(attacker, e, actualDmg);
                    e.hp -= finalDmg;
                    showFloatingText(e.uid, `-${finalDmg}`, 'damage');
                    e.buffs.push({type: 'terror', duration: attacker.level >= 180 ? 3 : 2}); // Terror giảm 30% ST địch, xài chung
                });

                if(attacker.level >= 80 && (attacker.hp / attacker.maxHp) > 0.5) {
                    let lowestAlly = allies.filter(a => a.uid !== attacker.uid).sort((a,b) => a.hp - b.hp)[0];
                    if(lowestAlly) {
                        lowestAlly.buffs.push({type: 'bao_ve', duration: 1, buffer: attacker.uid});
                        logBattle(`-> Cấp [Bảo Vệ] cho ${lowestAlly.name}.`);
                    }
                }

                if(attacker.level >= 251) {
                    let heal = Math.floor(attacker.maxHp * 0.04);
                    attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
                    showFloatingText(attacker.uid, `+${heal}`, 'heal');
                }
            } else if (attacker.id === 'coolergold') {
                let coolerBase = 2.75;
                if(attacker.level >= 180) coolerBase += 0.45;
                if(attacker.level >= 251) coolerBase += 0.10;
                let actualDmg = calcDamage(attacker, target, attacker.atk * coolerBase * dmgMultiplier);
                target.hp -= actualDmg;
                showFloatingText(target.uid, `-${actualDmg}`, 'damage');
                if(Math.random() < 0.4) {
                    target.buffs.push({type: 'stun', duration: 1});
                    logBattle(`-> Làm choáng ${target.name}.`);
                }
                if(attacker.level >= 251 && Math.random() < 0.6) {
                    enemies.forEach(e => {
                        e.buffs = e.buffs.filter(b => ['an_mon', 'suy_giam', 'stun', 'severe_wound', 'bleeding', 'terror'].includes(b.type)); // Giữ debuff, xoá buff
                    });
                    logBattle(`-> [Phân tán] toàn đội địch!`);
                }
            } else if (attacker.id === 'brolysp') {
                let actualDmg = calcDamage(attacker, target, attacker.atk * 2.75 * dmgMultiplier);
                target.hp -= actualDmg;
                showFloatingText(target.uid, `-${actualDmg}`, 'damage');
                if(!attacker.buffs.find(b => b.type === 'broly_crit')) {
                    attacker.buffs.push({type: 'broly_crit'});
                }
                target.buffs.push({type: 'dung_cam'}); // Cấm hồi sinh
            } else if (attacker.id === 'zamasu') {
                let actualDmg = attacker.atk * 1.1 * dmgMultiplier;
                enemies.forEach(e => {
                    let finalDmg = calcDamage(attacker, e, actualDmg);
                    e.hp -= finalDmg;
                    showFloatingText(e.uid, `-${finalDmg}`, 'damage');
                    if(Math.random() < 0.3) {
                        e.buffs.push({type: 'terror', duration: 2}); // giảm ST
                        if(Math.random() < 0.5) e.buffs.push({type: 'stun', duration: 2});
                    }
                });
            }

            attacker.en = 0; // Reset EN
        } else {
            // --- Đánh Thường ---
            if (attacker.id === 'kangu') {
                let dmg = calcDamage(attacker, target, attacker.atk * 0.85);
                target.hp -= dmg;
                attacker.en += 1.7;
                showFloatingText(target.uid, `-${dmg}`, 'damage');
                logBattle(`<span style="color:${attacker.color}">${attacker.name}</span> đánh thường ${target.name} gây ${dmg} ST.`);
                // Kangu bị động 2 (lv 80): 10% choáng
                if(attacker.level >= 80 && Math.random() < 0.1) {
                    target.buffs.push({type: 'stun', duration: 1});
                    logBattle(`-> ${target.name} bị choáng!`);
                }

            } else if (attacker.id === 'meganer') {
                // Mega Ner đánh thường gây ST diện rộng toàn bộ địch 95%
                let dmg = attacker.atk * 0.95;
                logBattle(`<span style="color:${attacker.color}">${attacker.name}</span> đánh thường DIỆN RỘNG!`);
                enemies.forEach(e => {
                    let actualDmg = calcDamage(attacker, e, dmg);
                    e.hp -= actualDmg;
                    showFloatingText(e.uid, `-${actualDmg}`, 'damage');
                    logBattle(`-> Gây ${actualDmg} ST lên ${e.name}.`);
                });
                attacker.en += 1.4;
                // Mega Ner active passive (lv 150): +8% ST sau đánh thường
                if(attacker.level >= 150) {
                     attacker.buffs.push({type: 'dmg_boost', value: 0.08, duration: 1});
                }

            } else if (attacker.id === 'jaco') {
                let dmg = calcDamage(attacker, target, attacker.atk * 0.88);
                target.hp -= dmg;
                attacker.en += 1.2;
                showFloatingText(target.uid, `-${dmg}`, 'damage');
                logBattle(`<span style="color:${attacker.color}">${attacker.name}</span> đánh thường ${target.name} gây ${dmg} ST.`);

                // Đánh dấu HP lên đồng đội có HP thấp nhất
                let lowestAlly = allies[0];
                allies.forEach(a => { if(a.hp < lowestAlly.hp) lowestAlly = a; });
                const hpMarks = lowestAlly.buffs.filter(b => b.type === 'hp_mark').length;
                if(hpMarks < 3) {
                    lowestAlly.buffs.push({type: 'hp_mark'});
                    logBattle(`-> Tích 1 Dấu ấn HP cho ${lowestAlly.name}.`);
                }
            } else if (attacker.id === 'hit') {
                let dmg = calcDamage(attacker, target, attacker.atk * 0.79 * dmgMultiplier);
                target.hp -= dmg;
                attacker.en += 1.8;
                showFloatingText(target.uid, `-${dmg}`, 'damage');
                logBattle(`<span style="color:${attacker.color}">${attacker.name}</span> đánh thường ${target.name} gây ${dmg} ST.`);
            } else if (attacker.id === 'jiren') {
                let dmg = calcDamage(attacker, target, attacker.atk * 0.98 * dmgMultiplier);
                target.hp -= dmg;
                attacker.en += 1.8;
                showFloatingText(target.uid, `-${dmg}`, 'damage');
                if(attacker.level >= 130) {
                    // Severe wound deals % of dmg taken, not 100%. User clarified 2% (0.02)
                    target.buffs.push({type: 'severe_wound', value: attacker.level >= 251 ? 0.024 : 0.02, duration: 2, dmgTaken: 0});
                }
            } else if (attacker.id === 'gokuxeno') {
                let dmg = calcDamage(attacker, target, attacker.atk * 1.0 * dmgMultiplier);
                target.hp -= dmg;
                attacker.en += 0.9;
                showFloatingText(target.uid, `-${dmg}`, 'damage');
            } else if (attacker.id === 'coolergold') {
                let dmg = calcDamage(attacker, target, attacker.atk * 0.99 * dmgMultiplier);
                target.hp -= dmg;
                attacker.en += 1.2;
                showFloatingText(target.uid, `-${dmg}`, 'damage');
            } else if (attacker.id === 'brolysp') {
                let dmg = calcDamage(attacker, target, attacker.atk * 1.0 * dmgMultiplier);
                target.hp -= dmg;
                attacker.en += 1.0;
                showFloatingText(target.uid, `-${dmg}`, 'damage');
            } else if (attacker.id === 'zamasu') {
                let dmg = attacker.atk * 0.88 * dmgMultiplier;
                enemies.forEach(e => {
                    let finalDmg = calcDamage(attacker, e, dmg);
                    e.hp -= finalDmg;
                    showFloatingText(e.uid, `-${finalDmg}`, 'damage');
                    e.buffs.push({type: 'bleeding', value: 0.005, duration: 3});
                });
                attacker.en += 1.3;

                // Cập nhật Zamasu passive 2: 80% choáng 1 mục tiêu ngẫu nhiên
                if(!attacker.zamasuPassiveCD || attacker.zamasuPassiveCD <= 0) {
                    const rndEnemy = enemies[Math.floor(Math.random() * enemies.length)];
                    if(Math.random() < 0.8) {
                        rndEnemy.buffs.push({type: 'stun', duration: 1});
                        logBattle(`-> [Đánh trúng] Làm choáng ${rndEnemy.name}.`);
                        attacker.zamasuPassiveCD = 4;
                    }
                } else {
                    attacker.zamasuPassiveCD--;
                }
            }
        }

        // Cập nhật sát thương tích luỹ cho severe_wound
        enemies.forEach(e => {
            const sw = e.buffs.find(b => b.type === 'severe_wound');
            if(sw) {
                const oldHp = e.oldHp || e.hp;
                if(e.hp < oldHp) {
                    sw.dmgTaken += (oldHp - e.hp);
                }
            }
            e.oldHp = e.hp;
        });

        // Kiểm tra chết target & enemies (và allies nếu có phản sát thương)
        [...enemies, ...allies].forEach(e => {
            if(e.hp <= 0 && !e.isDead) {
                e.hp = 0;
                e.isDead = true;

                // Cập nhật mảng team tương ứng
                const isEnemyTeam = enemies.some(en => en.uid === e.uid);
                const relevantTeam = isEnemyTeam ? enemies : allies;

                handleDeath(e, relevantTeam);

                // Force update F.Hit passive immediately after a death
                updateFHitPassive3(relevantTeam);
            }
        });

        renderBattleArena();

        i++;
        battleState.timer = setTimeout(executeAction, 1000); // 1s tung chiêu 1 lần
    }

    executeAction();
}

function handleDeath(char, teamArray) {
    const isBannedRevive = char.banDeathPassive || char.buffs.some(b => b.type === 'dung_cam');

    if(char.id === 'hit' && !char.hasRevived && !isBannedRevive) {
        logBattle(`<b>${char.name} đã ngã xuống, nhưng nội tại kích hoạt! Hồi sinh với 80% HP!</b>`);
        char.hasRevived = true;
        char.isDead = false;
        char.hp = Math.floor(char.maxHp * 0.8);
        char.deathCount = (char.deathCount || 0) + 1; // Để kích buff 8% dmg_reduct
    } else {
        if(isBannedRevive && char.id === 'hit') logBattle(`<b>${char.name} đã bị hạ gục và không thể kích hoạt nội tại!</b>`);
        else logBattle(`${char.name} đã bị hạ gục!`);

        // Báo cho các F.Hit trong team biết có đồng đội chết để tăng buff giảm ST
        const hits = teamArray.filter(a => a.id === 'hit' && !a.isDead);
        hits.forEach(hit => {
            hit.allyDeathCount = (hit.allyDeathCount || 0) + 1;
            logBattle(`-> ${hit.name} tăng thêm 8% giảm sát thương cho toàn đội vì có đồng minh gục ngã!`);
        });

        // Broly Passive 1: Hồi 12% HP khi có người chết (cả địch lẫn ta)
        ['A', 'B'].forEach(t => {
            battleState.teams[t].forEach(f => {
                if(f.id === 'brolysp' && f.level >= 80 && !f.isDead) {
                    const heal = Math.floor(f.maxHp * 0.12);
                    f.hp = Math.min(f.maxHp, f.hp + heal);
                    showFloatingText(f.uid, `+${heal}`, 'heal');
                }
            });
        });
    }
}

// Override navTo to update Inventory/Daily when switching tabs
const originalNavTo = navTo;
navTo = function(screenId) {
    originalNavTo(screenId);
    if(screenId === 'screen-inventory') renderInventory();
    if(screenId === 'screen-gacha') renderDailyReward();
    if(screenId === 'screen-roster') renderRoster();
    if(screenId === 'screen-event') initEventScreen();
    if(screenId === 'screen-campaign') renderCampaign();
};

// --- Hệ Thống Đấu Ải ---
let currentChapter = 1;

function renderCampaign() {
    // 5 chương, 7 ải mỗi chương. Total 35 ải.
    document.getElementById('chapter-title').innerText = `Chương ${currentChapter}`;
    const list = document.getElementById('stage-list');
    list.innerHTML = '';

    for(let i = 1; i <= 7; i++) {
        const stageNum = (currentChapter - 1) * 7 + i;
        let isUnlocked = stageNum <= gameData.campaignStage;

        const btn = document.createElement('button');
        btn.className = `stage-btn ${i === 7 ? 'boss' : ''}`;

        if(isUnlocked) {
            btn.innerHTML = `Ải ${stageNum} ${i === 7 ? '(BOSS)' : ''} <span style="float:right; color:green;">${stageNum < gameData.campaignStage ? 'Đã qua' : 'Chiến'}</span>`;
            btn.onclick = () => startCampaignStage(stageNum);
        } else {
            btn.innerHTML = `Ải ${stageNum} <span style="float:right; color:red;">Khoá</span>`;
            btn.style.opacity = '0.5';
        }
        list.appendChild(btn);
    }
}

function changeChapter(dir) {
    currentChapter += dir;
    if(currentChapter < 1) currentChapter = 1;
    if(currentChapter > 5) currentChapter = 5;
    renderCampaign();
}

function startCampaignStage(stage) {
    const charIds = Object.keys(CHARACTERS);
    // Chọn random 3 tướng từ pool cho địch
    const e1 = charIds[Math.floor(Math.random() * charIds.length)];
    const e2 = charIds[Math.floor(Math.random() * charIds.length)];
    const e3 = charIds[Math.floor(Math.random() * charIds.length)];

    // Level tăng dần theo ải. Giả sử ải 1 = lv 10, mỗi ải + 5lv
    const enemyLv = 10 + (stage * 5);

    startBattleSetup('campaign', stage, [
        {id: e1, level: enemyLv},
        {id: e2, level: enemyLv},
        {id: e3, level: enemyLv}
    ]);
}


// Ensure first screen is active
window.onload = () => {
    loadData();
    updateTopBarUI();
    navTo('screen-home');
};
