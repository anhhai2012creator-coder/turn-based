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

function loadData() {
    const saved = localStorage.getItem('autoBattlerData');
    if (saved) {
        gameData = JSON.parse(saved);
        // Fallback for new fields
        if(!gameData.resources) gameData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    } else {
        gameData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
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
    if (code === 'CODETUAN001') {
        if (gameData.giftcodeClaimed) {
            alert('Mã này đã được sử dụng!');
        } else {
            gameData.resources.diamond += 400;
            gameData.giftcodeClaimed = true;
            saveData();
            alert('Nhận thành công 400 Kim Cương!');
        }
    } else {
        alert('Mã không hợp lệ!');
    }
    document.getElementById('giftcode-input').value = '';
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
    }
};

let selectedFormationSlot = 1;
let selectedModalCharId = null;

function getCharStats(id, level) {
    const base = CHARACTERS[id];
    // Mỗi level tăng 2% chỉ số
    const multiplier = 1 + ((level - 1) * 0.02);
    return {
        hp: Math.floor(base.baseHp * multiplier),
        atk: Math.floor(base.baseAtk * multiplier),
        def: Math.floor(base.baseDef * multiplier),
        spd: Math.floor(base.baseSpd * multiplier),
        maxEn: base.maxEn,
        name: base.name,
        color: base.color
    };
}

function getUpgradeCost(level) {
    // Giá gốc 100 VPNC, mỗi lv tăng 5% chi phí
    return Math.floor(100 * Math.pow(1.05, level - 1));
}

function renderRoster() {
    // Render Formation
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

    // Render Char List
    const ownedContainer = document.getElementById('owned-chars');
    ownedContainer.innerHTML = '';

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
        ownedContainer.appendChild(div);
    });
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
    document.getElementById('modal-upgrade-cost').innerText = char.level >= 150 ? "Tối đa" : cost;

    document.getElementById('char-modal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function upgradeChar() {
    const char = gameData.chars.find(c => c.id === selectedModalCharId);
    if(char.level >= 150) {
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

    // Init Enemy Team (Team B) - Mocking enemy using player chars but static level
    battleState.teams.B = [
        createEnemy('kangu', 10, 'B0'),
        createEnemy('meganer', 10, 'B1'),
        createEnemy('jaco', 10, 'B2')
    ];

    // Nội tại [Song Bích] Mega Ner lv 80
    applySongBich(battleState.teams.A);
    applySongBich(battleState.teams.B);

    renderBattleArena();
    logBattle("--- BẮT ĐẦU TRẬN CHIẾN ---");

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

    // Thủ = cứ 100 DEF giảm 0.1% ST
    const dmgReduct = Math.min(0.9, (defender.def / 100) * 0.001);
    return Math.max(1, Math.floor(rawDmg * (1 - dmgReduct)));
}

function battleLoop(currentTeam) {
    if(battleState.isOver) return;

    // Kiểm tra win/lose
    const aAlive = battleState.teams.A.filter(f => !f.isDead);
    const bAlive = battleState.teams.B.filter(f => !f.isDead);

    if(aAlive.length === 0 || bAlive.length === 0) {
        battleState.isOver = true;
        logBattle(`<b>TRẬN ĐẤU KẾT THÚC! Đội ${aAlive.length > 0 ? 'Người Chơi' : 'Địch'} Dành Chiến Thắng!</b>`);
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

        // Cập nhật UI acting
        document.querySelectorAll('.battle-char').forEach(el => el.classList.remove('acting'));
        const attackerEl = document.getElementById(`char-${attacker.uid}`);
        if(attackerEl) attackerEl.classList.add('acting');

        const enemies = currentTeam === 'A' ? battleState.teams.B.filter(f => !f.isDead) : battleState.teams.A.filter(f => !f.isDead);
        const allies = currentTeam === 'A' ? battleState.teams.A.filter(f => !f.isDead) : battleState.teams.B.filter(f => !f.isDead);

        if (enemies.length === 0) {
             battleLoop(currentTeam); return; // Check lại win
        }

        // Logic xuất chiêu
        let target = enemies[0]; // Mặc định đánh tướng đầu tiên (vị trí 1 của địch đang còn sống)

        // Giảm turn buff
        attacker.buffs.forEach(b => {
            if(b.duration !== undefined) b.duration -= 1;
        });
        attacker.buffs = attacker.buffs.filter(b => b.duration === undefined || b.duration >= 0);

        // Kangu bị động 2: Choáng
        if(attacker.buffs.find(b => b.type === 'stun')) {
            logBattle(`<span style="color:${attacker.color}">${attacker.name}</span> đang bị choáng, bỏ qua lượt!`);
            i++;
            battleState.timer = setTimeout(executeAction, 1000);
            return;
        }

        if (attacker.en >= attacker.maxEn) {
            // --- Dùng Kỹ Năng Chủ Động ---
            logBattle(`<span style="color:${attacker.color}">${attacker.name}</span> tung Kỹ Năng Chủ Động!`);

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
                    if(e.hp <= 0) e.isDead = true;
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
            }
        }

        // Kiểm tra chết
        if(target.hp <= 0) {
            target.hp = 0;
            target.isDead = true;
            logBattle(`${target.name} đã bị hạ gục!`);
        }

        renderBattleArena();

        i++;
        battleState.timer = setTimeout(executeAction, 1000); // 1s tung chiêu 1 lần
    }

    executeAction();
}

// Override navTo to update Inventory/Daily when switching tabs
const originalNavTo = navTo;
navTo = function(screenId) {
    originalNavTo(screenId);
    if(screenId === 'screen-inventory') renderInventory();
    if(screenId === 'screen-gacha') renderDailyReward();
    if(screenId === 'screen-roster') renderRoster();
};


// Ensure first screen is active
window.onload = () => {
    loadData();
    updateTopBarUI();
    navTo('screen-home');
};
