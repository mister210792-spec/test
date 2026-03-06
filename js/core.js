// Основные переменные
const svg = document.getElementById("canvas");
const GRID_SNAP_MM = 10; 
const LIGHT_SNAP_MM = 50; 
const MM_TO_PX = 3.78;

let scale = 0.18;
let offsetX = 100;
let offsetY = 100;
let rooms = [];
let activeRoom = 0;
let dragId = null;
let dragElem = null;
let isPanning = false;
let startPanX, startPanY;
let mousePos = { x: 0, y: 0, shift: false };
let isHoveringFirstPoint = false;
let currentTool = 'draw';
let showDiagonals = true;
let showMeasures = true;
let history = [];

function saveState() {
    if (history.length > 50) history.shift();
    history.push(JSON.stringify(rooms));
}

function undo() {
    if (history.length > 0) {
        rooms = JSON.parse(history.pop());
        if (activeRoom >= rooms.length) activeRoom = Math.max(0, rooms.length - 1);
        renderTabs();
        draw();
    }
}

function setTool(tool) {
    currentTool = (currentTool === tool) ? 'draw' : tool;
    document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('tool-' + tool);
    if (btn && currentTool !== 'draw') btn.classList.add('active');
}

function toggleDiagonals() {
    showDiagonals = !showDiagonals;
    document.getElementById("toggleDiags").classList.toggle("btn-toggle-active", showDiagonals);
    draw();
}

function toggleMeasures() {
    showMeasures = !showMeasures;
    document.getElementById("toggleMeasures").classList.toggle("btn-toggle-active", showMeasures);
    draw();
}

function renameRoom() {
    let r = rooms[activeRoom];
    let newName = prompt("Введите название помещения:", r.name);
    if (newName) {
        saveState();
        r.name = newName;
        renderTabs();
        updateStats();
    }
}

function mmToPx(mm, axis) {
    return axis === 'x' ? (mm * MM_TO_PX * scale) + offsetX : (mm * MM_TO_PX * scale) + offsetY;
}

function pxToMm(px, axis) {
    return axis === 'x' ? (px - offsetX) / (MM_TO_PX * scale) : (px - offsetY) / (MM_TO_PX * scale);
}

function snap(mm, firstMm = null, step = GRID_SNAP_MM) {
    if (firstMm !== null && Math.abs(mm - firstMm) < 50) return firstMm;
    return Math.round(mm / step) * step;
}

function getSnappedPos(mx, my, currentEl = null) {
    let r = rooms[activeRoom];
    let fx = snap(mx, null, LIGHT_SNAP_MM);
    let fy = snap(my, null, LIGHT_SNAP_MM);
    if (r.elements) {
        r.elements.forEach(el => {
            if (el === currentEl) return;
            if (Math.abs(fx - el.x) < 80) fx = el.x;
            if (Math.abs(fy - el.y) < 80) fy = el.y;
        });
    }
    return { x: fx, y: fy };
}

function drawGrid() {
    const s100 = 100 * MM_TO_PX * scale; 
    if (s100 > 5) {
        for (let x = offsetX % s100; x < svg.clientWidth; x += s100) {
            svg.appendChild(createLine(x, 0, x, svg.clientHeight, "#f1f1f1", 0.5));
        }
        for (let y = offsetY % s100; y < svg.clientHeight; y += s100) {
            svg.appendChild(createLine(0, y, svg.clientWidth, y, "#f1f1f1", 0.5));
        }
    }
}

function createLine(x1, y1, x2, y2, c, w, d) {
    let l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", x1);
    l.setAttribute("y1", y1);
    l.setAttribute("x2", x2);
    l.setAttribute("y2", y2);
    l.setAttribute("stroke", c);
    l.setAttribute("stroke-width", w);
    if (d) l.setAttribute("stroke-dasharray", d);
    return l;
}

function renderText(x, y, txt, cls) {
    let t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", x);
    t.setAttribute("y", y);
    t.setAttribute("class", cls);
    t.textContent = txt;
    svg.appendChild(t);
    return t;
}

function draw(isExport = false) {
    updateZoomLevel();
    svg.innerHTML = "";
    if (!isExport) drawGrid();
    
    let r = rooms[activeRoom];
    if (!r) return;
    
    if (r.closed && r.points.length > 3 && showDiagonals) {
        for (let i = 0; i < r.points.length; i++) {
            for (let j = i + 2; j < r.points.length; j++) {
                if (i === 0 && j === r.points.length - 1) continue;
                let p1 = r.points[i], p2 = r.points[j];
                svg.appendChild(createLine(mmToPx(p1.x, 'x'), mmToPx(p1.y, 'y'), mmToPx(p2.x, 'x'), mmToPx(p2.y, 'y'), "rgba(142, 68, 173, 0.15)", 1, "4,4"));
                let d = Math.round(Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2)/10);
                renderText(mmToPx((p1.x+p2.x)/2, 'x'), mmToPx((p1.y+p2.y)/2, 'y'), d, "diag-label");
            }
        }
    }
    
    // ... (продолжение функции draw - очень длинная, оставлю основную структуру)
    // Вам нужно перенести всю функцию draw из оригинального script.js
    // и все связанные с ней вспомогательные функции
}

function addRoom() {
    if(currentUser && currentUser.plan === 'free' && rooms.length >= 1) {
        alert("В бесплатном плане доступно только 1 помещение. Перейдите на PRO для безлимита.");
        return;
    }
    saveState();
    
    rooms.push({
        name: "Полотно " + (rooms.length + 1),
        points: [],
        id: Date.now(),
        closed: false,
        elements: []
    });
    
    activeRoom = rooms.length - 1;
    renderTabs();
    draw();
}

function removeRoom(idx, e) {
    e.stopPropagation();
    if (confirm("Удалить это помещение?")) {
        saveState();
        rooms.splice(idx, 1);
        activeRoom = Math.max(0, activeRoom - 1);
        if (rooms.length === 0) addRoom();
        renderTabs();
        draw();
    }
}

function renderTabs() {
    const tabs = document.getElementById("tabs");
    tabs.innerHTML = "";
    rooms.forEach((r, i) => {
        let t = document.createElement("div");
        t.className = "tab" + (i === activeRoom ? " active" : "");
        t.innerHTML = `${r.name} <span class="close-tab" onclick="removeRoom(${i}, event)">×</span>`;
        t.onclick = () => {
            activeRoom = i;
            renderTabs();
            draw();
        };
        tabs.appendChild(t);
    });
    
    updateZoomLevel();
}

function updateZoomLevel() {
    const zoomLevel = document.getElementById('zoom-level');
    if (zoomLevel) {
        zoomLevel.textContent = Math.round(scale * 100) + '%';
    }
}

function zoomIn() {
    const rect = svg.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    let newScale = Math.min(scale * 1.2, 3.0);
    
    if (newScale !== scale) {
        offsetX = centerX - (centerX - offsetX) * (newScale / scale);
        offsetY = centerY - (centerY - offsetY) * (newScale / scale);
        scale = newScale;
        updateZoomLevel();
        draw();
    }
}

function zoomOut() {
    const rect = svg.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    let newScale = scale * 0.8;
    
    offsetX = centerX - (centerX - offsetX) * (newScale / scale);
    offsetY = centerY - (centerY - offsetY) * (newScale / scale);
    scale = newScale;
    updateZoomLevel();
    draw();
}

function resetView() {
    scale = 0.18;
    offsetX = 100;
    offsetY = 100;
    updateZoomLevel();
    draw();
}

function updateStats() {
    // ... (функция из оригинального script.js)
}

function mirrorRoom() {
    saveState();
    let r = rooms[activeRoom];
    if (!r || r.points.length === 0) return;
    let minX = Math.min(...r.points.map(p => p.x));
    let maxX = Math.max(...r.points.map(p => p.x));
    let mid = (minX + maxX) / 2;
    r.points.forEach(p => { p.x = mid - (p.x - mid); });
    if (r.elements) {
        r.elements.forEach(el => {
            el.x = mid - (el.x - mid);
            if (el.rotation) el.rotation = -el.rotation;
        });
    }
    draw();
}

function exportImage() {
    draw(true);
    let svgData = new XMLSerializer().serializeToString(svg);
    let canvas = document.createElement("canvas");
    canvas.width = svg.clientWidth * 2;
    canvas.height = svg.clientHeight * 2;
    let ctx = canvas.getContext("2d");
    let img = new Image();
    
    img.onload = () => {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        let a = document.createElement("a");
        a.download = "plan.png";
        a.href = canvas.toDataURL();
        a.click();
        draw();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
}

function setScaleFor5x5() {
    const roomWidth = 5000;
    const roomHeight = 5000;
    
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    if (containerWidth === 0 || containerHeight === 0) {
        console.log("⚠️ Контейнер еще не загружен, пробуем позже");
        setTimeout(() => setScaleFor5x5(), 50);
        return;
    }
    
    const roomWidthPx = roomWidth * MM_TO_PX;
    const roomHeightPx = roomHeight * MM_TO_PX;
    
    const scaleX = (containerWidth * 0.8) / roomWidthPx;
    const scaleY = (containerHeight * 0.8) / roomHeightPx;
    
    let newScale = Math.min(scaleX, scaleY);
    scale = Math.max(0.1, Math.min(1.0, newScale));
    
    offsetX = containerWidth / 2;
    offsetY = containerHeight / 2;
    
    updateZoomLevel();
    console.log("📐 Масштаб установлен для 5x5 метров:", scale.toFixed(3));
}

function centerView() {
    const r = rooms[activeRoom];
    if (!r || r.points.length === 0) return;
    
    let minX = Math.min(...r.points.map(p => p.x));
    let maxX = Math.max(...r.points.map(p => p.x));
    let minY = Math.min(...r.points.map(p => p.y));
    let maxY = Math.max(...r.points.map(p => p.y));
    
    const padding = 500;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    const container = document.getElementById('canvas-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const scaleX = (containerWidth * 0.9) / (width * MM_TO_PX);
    const scaleY = (containerHeight * 0.9) / (height * MM_TO_PX);
    scale = Math.min(scaleX, scaleY);
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    offsetX = containerWidth / 2 - centerX * MM_TO_PX * scale;
    offsetY = containerHeight / 2 - centerY * MM_TO_PX * scale;
    
    updateZoomLevel();
    draw();
}
// Функция завершения авторизации
function completeAuth() {
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('header-user').innerText = window.currentUser.name;
    document.getElementById('header-plan').innerText = "План: " + window.currentUser.plan.toUpperCase();
    
    if(window.currentUser.plan === 'pro') {
        document.getElementById('header-plan').style.background = 'var(--gold)';
        document.getElementById('header-plan').style.color = 'var(--dark)';
    }

    loadAllSettings();
    
    if (window.currentUser && window.currentUser.uid && window.db) {
        loadCustomElementsFromFirestore(window.currentUser.uid).then(() => initSelectors());
    } else {
        initSelectors();
    }
    
    if(window.currentUser.plan === 'free' && rooms.length > 1) {
        rooms = rooms.slice(0, 1);
        renderTabs();
    } else if (rooms.length === 0) {
        rooms.push({
            name: "Полотно 1",
            points: [],
            id: Date.now(),
            closed: false,
            elements: []
        });
        activeRoom = 0;
        renderTabs();
    }

    updatePlanDisplay();
    
    // Показываем админ-панель если пользователь админ
    if (typeof updateAdminPanelVisibility === 'function') {
        updateAdminPanelVisibility();
    }

    setScaleFor5x5();
    draw();

    if (typeof initMobileHandlers === 'function') {
        initMobileHandlers();
    }
}

// Добавляем в глобальную область
window.completeAuth = completeAuth;

// Экспорт функций
window.scale = scale;
window.offsetX = offsetX;
window.offsetY = offsetY;
window.rooms = rooms;
window.activeRoom = activeRoom;
window.currentTool = currentTool;
window.showDiagonals = showDiagonals;
window.showMeasures = showMeasures;
window.history = history;

window.saveState = saveState;
window.undo = undo;
window.setTool = setTool;
window.toggleDiagonals = toggleDiagonals;
window.toggleMeasures = toggleMeasures;
window.renameRoom = renameRoom;
window.mmToPx = mmToPx;
window.pxToMm = pxToMm;
window.snap = snap;
window.getSnappedPos = getSnappedPos;
window.draw = draw;
window.addRoom = addRoom;
window.removeRoom = removeRoom;
window.renderTabs = renderTabs;
window.updateZoomLevel = updateZoomLevel;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.resetView = resetView;
window.updateStats = updateStats;
window.mirrorRoom = mirrorRoom;
window.exportImage = exportImage;
window.setScaleFor5x5 = setScaleFor5x5;
window.centerView = centerView;