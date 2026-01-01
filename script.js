// --- BIẾN TOÀN CỤC ---
let currentSelectedDate = ""; // Ngày đang chọn
let countdownInterval = null; // Biến giữ đồng hồ đếm ngược

// --- KHI TRANG WEB LOAD XONG ---
window.onload = function() {
    console.log("Script V3 loaded successfully!"); // Check log xem script chạy chưa
    
    // 1. Hiện ngày hôm nay ở trang chủ
    document.getElementById('today-display').innerText = getTodayStr();

    // 2. Mặc định vào trang Home
    switchTab('home');

    // 3. Bắt đầu đếm ngược
    startCountdown();
};

// --- HÀM CHUYỂN TAB (ĐÃ FIX LỖI LIỆT NÚT) ---
function switchTab(tabName) {
    // Ẩn hết các section
    const sections = document.querySelectorAll('.content-section');
    for (let i = 0; i < sections.length; i++) {
        sections[i].style.display = 'none';
    }

    // Hiện section được chọn
    const activeSection = document.getElementById(tabName + '-section');
    if (activeSection) {
        activeSection.style.display = 'block';
    } else {
        console.error("Không tìm thấy tab: " + tabName);
        return;
    }

    // Nếu vào trang Fitness hoặc Japanese thì load dữ liệu ngay
    if (tabName === 'fitness' || tabName === 'japanese') {
        renderHeatmap(tabName);
        // Tự động chọn ngày hôm nay
        selectDate(tabName, getTodayStr());
    }
}

// --- HÀM XỬ LÝ NGÀY THÁNG ---
function getTodayStr() {
    const d = new Date();
    // Chỉnh múi giờ VN cho chắc ăn
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    return local.toISOString().split('T')[0];
}

function getDaysInYear(year) {
    const days = [];
    const d = new Date(year, 0, 1);
    while (d.getFullYear() === year) {
        const iso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        days.push(iso);
        d.setDate(d.getDate() + 1);
    }
    return days;
}

// --- LOGIC HEATMAP (LƯỚI) ---
function renderHeatmap(type) {
    const container = document.getElementById(type + '-heatmap');
    container.innerHTML = ""; // Xóa cũ

    const allData = JSON.parse(localStorage.getItem(type + '_data') || "{}");
    const yearDays = getDaysInYear(new Date().getFullYear());
    let streak = 0;

    for (let i = 0; i < yearDays.length; i++) {
        const day = yearDays[i];
        const div = document.createElement('div');
        div.className = 'heatmap-box';
        div.title = day;

        // Nếu có dữ liệu và đã done
        if (allData[day] && allData[day].done) {
            div.classList.add('done');
        }

        // Nếu là ngày đang chọn
        if (day === currentSelectedDate) {
            div.classList.add('active');
        }

        // Sự kiện Click
        div.onclick = function() {
            selectDate(type, day);
        };

        container.appendChild(div);
    }

    // Tính Streak (Đếm ngược từ hôm nay)
    const today = getTodayStr();
    let tempDate = new Date();
    for(let k=0; k<365; k++) {
        const checkDay = new Date(tempDate.getTime() - (tempDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        if (allData[checkDay] && allData[checkDay].done) {
            streak++;
        } else if (checkDay !== today) { // Nếu không phải hôm nay mà thiếu -> gãy
            break;
        }
        tempDate.setDate(tempDate.getDate() - 1);
    }
    document.getElementById(type + '-streak').innerText = streak;
}

// --- LOGIC CHỌN NGÀY VÀ LƯU ---
function selectDate(type, dateStr) {
    currentSelectedDate = dateStr;
    
    // Update tiêu đề bên phải
    document.getElementById(type + '-date-title').innerText = "Ngày: " + dateStr;

    // Load lại Heatmap để cập nhật viền đỏ
    renderHeatmap(type);

    // Load dữ liệu ra form
    const allData = JSON.parse(localStorage.getItem(type + '_data') || "{}");
    const data = allData[dateStr] || { done: false, note: "" };

    document.getElementById(type + '-check').checked = data.done;
    document.getElementById(type + '-note').value = data.note;
}

function saveData(type) {
    if (!currentSelectedDate) return alert("Chưa chọn ngày bro ơi!");

    const done = document.getElementById(type + '-check').checked;
    const note = document.getElementById(type + '-note').value;

    const allData = JSON.parse(localStorage.getItem(type + '_data') || "{}");
    allData[currentSelectedDate] = { done: done, note: note };

    localStorage.setItem(type + '_data', JSON.stringify(allData));
    
    renderHeatmap(type); // Vẽ lại để hiện màu cam
    alert("Đã lưu ngày " + currentSelectedDate);
}

// --- LOGIC COUNTDOWN ---
function addEvent() {
    const name = document.getElementById('event-name').value;
    const time = document.getElementById('event-time').value;
    const color = document.getElementById('event-color').value;
    
    if(!name || !time) return alert("Nhập thiếu rồi!");

    const events = JSON.parse(localStorage.getItem('events') || "[]");
    events.push({ name, time, color });
    localStorage.setItem('events', JSON.stringify(events));
    
    renderEvents();
}

function renderEvents() {
    const list = document.getElementById('countdown-list');
    list.innerHTML = "";
    const events = JSON.parse(localStorage.getItem('events') || "[]");

    events.forEach((evt, idx) => {
        const div = document.createElement('div');
        div.className = 'countdown-item';
        div.style.borderColor = evt.color;
        div.innerHTML = `<h3 style="color:${evt.color}">${evt.name}</h3>
                         <div id="timer-${idx}" style="font-size:1.5em; font-weight:bold">...</div>
                         <p>${evt.time}</p>`;
        list.appendChild(div);
    });
}

function startCountdown() {
    if(countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        const events = JSON.parse(localStorage.getItem('events') || "[]");
        const now = new Date().getTime();

        events.forEach((evt, idx) => {
            const el = document.getElementById(`timer-${idx}`);
            if(el) {
                const dist = new Date(evt.time).getTime() - now;
                if(dist < 0) {
                    el.innerText = "Đã diễn ra!";
                } else {
                    const d = Math.floor(dist / (86400000));
                    const h = Math.floor((dist % (86400000)) / (3600000));
                    const m = Math.floor((dist % (3600000)) / (60000));
                    const s = Math.floor((dist % (60000)) / 1000);
                    el.innerText = `${d}d ${h}h ${m}m ${s}s`;
                }
            }
        });
    }, 1000);
    renderEvents(); // Gọi 1 lần đầu tiên
}
