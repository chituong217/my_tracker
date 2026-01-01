// --- 1. BIẾN TOÀN CỤC ĐỂ THEO DÕI TRẠNG THÁI ---
let currentSelectedDateString = ""; // Ngày đang được click chọn

// --- 2. CHỨC NĂNG ĐIỀU HƯỚNG (TAB) ---
function switchTab(tabId) {
    const sections = document.querySelectorAll('.content-section');
    for (let i = 0; i < sections.length; i++) {
        sections[i].style.display = 'none';
    }
    
    const activeSection = document.getElementById(tabId + '-section');
    if (activeSection != null) {
        activeSection.style.display = 'block';
    }

    // Khi chuyển tab, load lại dữ liệu để cập nhật hiển thị
    if (tabId === 'fitness' || tabId === 'japanese') {
        renderHeatmap(tabId);
        // Mặc định chọn ngày hôm nay khi mới vào
        selectDate(tabId, getTodayString());
    }
}

// --- 3. CÁC HÀM HELPER VỀ THỜI GIAN ---
function getTodayString() {
    const today = new Date();
    // Chỉnh múi giờ để đảm bảo không bị lệch ngày
    const offset = today.getTimezoneOffset(); 
    const localDate = new Date(today.getTime() - (offset*60*1000));
    return localDate.toISOString().split('T')[0];
}

function generateDaysForYear(year) {
    const days = [];
    const date = new Date(year, 0, 1);
    while (date.getFullYear() === year) {
        // Format YYYY-MM-DD thủ công để tránh lỗi múi giờ
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        days.push(y + "-" + m + "-" + d);
        
        date.setDate(date.getDate() + 1);
    }
    return days;
}

// --- 4. LOGIC HEATMAP & CLICK EVENT ---

function renderHeatmap(category) {
    const container = document.getElementById(category + '-heatmap');
    container.innerHTML = ""; // Xóa cũ

    // Lấy dữ liệu tổng từ LocalStorage
    // Cấu trúc dữ liệu mới: { "2026-01-01": { completed: true, log: "..." } }
    let allData = {};
    const storageKey = category + '_full_data';
    const savedString = localStorage.getItem(storageKey);
    if (savedString != null) {
        allData = JSON.parse(savedString);
    }

    const currentYear = new Date().getFullYear();
    const days = generateDaysForYear(currentYear);
    let streak = 0;

    for (let i = 0; i < days.length; i++) {
        const dateStr = days[i];
        const dayData = allData[dateStr]; // Lấy dữ liệu của ngày này
        
        const box = document.createElement('div');
        box.className = 'heatmap-box';
        
        // Feature 1: Hover hiện ngày tháng
        box.title = "Ngày: " + dateStr; 

        // Kiểm tra xem ngày này đã hoàn thành chưa để tô màu
        if (dayData != null && dayData.completed == true) {
            box.classList.add('active');
        }

        // Feature 2 & 3: Click vào ô để sửa/xem chi tiết
        box.onclick = function() {
            // Xóa class 'selected' ở các ô khác
            const allBoxes = container.querySelectorAll('.heatmap-box');
            for(let j=0; j<allBoxes.length; j++) {
                allBoxes[j].classList.remove('selected');
            }
            // Thêm class 'selected' cho ô này
            box.classList.add('selected');

            // Gọi hàm hiển thị chi tiết bên phải
            selectDate(category, dateStr);
        };

        // Highlight ô nếu đó là ngày đang được chọn (khi render lại)
        if (dateStr === currentSelectedDateString) {
            box.classList.add('selected');
        }

        container.appendChild(box);
    }

    // Tính streak đơn giản (đếm ngược từ hôm nay)
    calculateStreak(category, allData);
}

// --- 5. LOGIC CHI TIẾT NGÀY (DETAIL PANEL) ---

function selectDate(category, dateStr) {
    currentSelectedDateString = dateStr;

    // Cập nhật tiêu đề bên phải
    document.getElementById(category + '-selected-date').innerText = "Ngày: " + dateStr;

    // Lấy dữ liệu từ storage
    let allData = {};
    const storageKey = category + '_full_data';
    const savedString = localStorage.getItem(storageKey);
    if (savedString != null) {
        allData = JSON.parse(savedString);
    }

    const dayData = allData[dateStr] || { completed: false, log: "" };

    // Đưa dữ liệu lên form (Checkbox + TextArea)
    const checkbox = document.getElementById(category + '-status-checkbox');
    const textarea = document.getElementById(category + '-log-input');

    if (checkbox != null) checkbox.checked = dayData.completed;
    if (textarea != null) textarea.value = dayData.log;
}

function saveDataForDate(category) {
    if (currentSelectedDateString === "") {
        alert("Vui lòng chọn một ngày trước!");
        return;
    }

    const checkbox = document.getElementById(category + '-status-checkbox');
    const textarea = document.getElementById(category + '-log-input');

    const isCompleted = checkbox.checked;
    const logContent = textarea.value;

    // Lấy dữ liệu cũ
    let allData = {};
    const storageKey = category + '_full_data';
    const savedString = localStorage.getItem(storageKey);
    if (savedString != null) {
        allData = JSON.parse(savedString);
    }

    // Cập nhật ngày đang chọn
    allData[currentSelectedDateString] = {
        completed: isCompleted,
        log: logContent
    };

    // Lưu lại
    localStorage.setItem(storageKey, JSON.stringify(allData));

    // Vẽ lại heatmap để cập nhật màu sắc
    renderHeatmap(category);
    
    alert("Đã lưu dữ liệu cho ngày " + currentSelectedDateString + " thành công!");
}

// --- 6. TÍNH STREAK ---
function calculateStreak(category, allData) {
    let count = 0;
    const today = new Date();
    
    // Check 365 ngày ngược về quá khứ
    for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        
        // Format thủ công
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = y + "-" + m + "-" + day;

        const data = allData[dateStr];

        if (data != null && data.completed == true) {
            count++;
        } else {
            // Nếu hôm nay chưa tập thì chưa gãy streak vội, kiểm tra ngày hôm qua
            if (i === 0) continue;
            break; // Gãy streak
        }
    }

    document.getElementById(category + '-streak').innerText = count;
}

// --- 7. COUNTDOWN (GIỮ NGUYÊN) ---
let countdownInterval = null;

function addNewEvent() {
    const name = document.getElementById('event-name').value;
    const dateVal = document.getElementById('event-date').value;
    const color = document.getElementById('event-color').value;

    if (!name || !dateVal) return alert("Thiếu thông tin!");

    const newEvent = { name: name, date: dateVal, color: color };
    
    let events = JSON.parse(localStorage.getItem('my_events') || "[]");
    events.push(newEvent);
    localStorage.setItem('my_events', JSON.stringify(events));
    
    renderCountdowns();
}

function renderCountdowns() {
    const container = document.getElementById('countdown-list');
    container.innerHTML = "";
    const events = JSON.parse(localStorage.getItem('my_events') || "[]");

    events.forEach((evt, index) => {
        const div = document.createElement('div');
        div.className = 'countdown-item';
        div.style.borderColor = evt.color;
        div.innerHTML = `<h3 style="color:${evt.color}">${evt.name}</h3><div id="timer-${index}" class="timer-display">...</div><p>${evt.date}</p>`;
        container.appendChild(div);
    });
}

function startCountdownTimer() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        const events = JSON.parse(localStorage.getItem('my_events') || "[]");
        const now = new Date().getTime();
        
        events.forEach((evt, index) => {
            const el = document.getElementById('timer-' + index);
            if (el) {
                const dist = new Date(evt.date).getTime() - now;
                if (dist < 0) {
                    el.innerText = "DONE!";
                } else {
                    const d = Math.floor(dist / (1000 * 60 * 60 * 24));
                    const h = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((dist % (1000 * 60)) / 1000);
                    el.innerText = `${d}d ${h}h ${m}m ${s}s`;
                }
            }
        });
    }, 1000);
}

// --- KHỞI CHẠY ---
window.onload = function() {
    switchTab('home');
    renderCountdowns();
    startCountdownTimer();
};
