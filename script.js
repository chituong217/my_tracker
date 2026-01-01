// --- 1. CHỨC NĂNG ĐIỀU HƯỚNG TAB ---
function showSection(sectionId) {
    // Ẩn tất cả các section trước
    const allSections = document.querySelectorAll('.content-section');
    
    // Sử dụng vòng lặp for cơ bản thay vì forEach để dễ hiểu
    for (let i = 0; i < allSections.length; i++) {
        const section = allSections[i];
        section.style.display = 'none';
    }

    // Hiện section được chọn
    const selectedSection = document.getElementById(sectionId + '-section');
    if (selectedSection != null) {
        selectedSection.style.display = 'block';
    }
}

// --- 2. CÁC HÀM XỬ LÝ NGÀY THÁNG (HELPER) ---
// Hàm lấy ngày hôm nay dưới dạng string "YYYY-MM-DD" để làm key lưu dữ liệu
function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Thêm số 0 nếu tháng < 10
    const day = String(today.getDate()).padStart(2, '0');
    return year + "-" + month + "-" + day;
}

// Hàm tạo danh sách các ngày trong năm nay để vẽ heatmap
function generateDaysForYear(year) {
    const days = [];
    const date = new Date(year, 0, 1); // 1 tháng 1

    while (date.getFullYear() === year) {
        const dateString = date.toISOString().split('T')[0];
        days.push(dateString);
        date.setDate(date.getDate() + 1);
    }
    return days;
}

// --- 3. LOGIC HEATMAP & STREAK (Dùng chung cho Fitness và Japanese) ---

// Hàm tải dữ liệu Heatmap lên giao diện
function loadHeatmap(category) {
    const heatmapContainer = document.getElementById(category + '-heatmap');
    heatmapContainer.innerHTML = ""; // Xóa cũ đi vẽ lại

    // Lấy dữ liệu đã lưu từ LocalStorage (Dạng chuỗi JSON)
    const storageKey = category + '_data'; // ví dụ: fitness_data
    const savedDataString = localStorage.getItem(storageKey);
    
    let savedData = {};
    if (savedDataString != null) {
        savedData = JSON.parse(savedDataString);
    }

    // Tạo heatmap cho năm 2026 (hoặc năm hiện tại)
    const currentYear = new Date().getFullYear();
    const daysInYear = generateDaysForYear(currentYear);

    for (let i = 0; i < daysInYear.length; i++) {
        const dateStr = daysInYear[i];
        const box = document.createElement('div');
        box.className = 'heatmap-box';
        box.title = dateStr; // Hover vào thấy ngày

        // Kiểm tra xem ngày này có được đánh dấu (true) không
        if (savedData[dateStr] == true) {
            box.classList.add('active');
        }

        heatmapContainer.appendChild(box);
    }

    // Tính toán streak
    calculateStreak(category, savedData);
}

// Hàm Check-in (Tick vào ngày hôm nay)
function checkInToday(category) {
    const todayStr = getTodayString();
    const storageKey = category + '_data';

    // Lấy dữ liệu cũ
    let savedData = {};
    const savedDataString = localStorage.getItem(storageKey);
    if (savedDataString != null) {
        savedData = JSON.parse(savedDataString);
    }

    // Đánh dấu hôm nay là true
    savedData[todayStr] = true;

    // Lưu ngược lại vào LocalStorage
    localStorage.setItem(storageKey, JSON.stringify(savedData));

    // Vẽ lại giao diện
    loadHeatmap(category);
    alert("Đã check-in thành công cho " + category + "! Cố lên bro! :3");
}

// Hàm tính Streak (Chuỗi ngày liên tiếp)
function calculateStreak(category, dataObj) {
    let streakCount = 0;
    const today = new Date();
    
    // Kiểm tra ngược từ hôm nay về quá khứ
    // Loop 365 ngày check ngược lại
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date();
        checkDate.setDate(today.getDate() - i);
        const checkDateStr = checkDate.toISOString().split('T')[0];

        if (dataObj[checkDateStr] == true) {
            streakCount = streakCount + 1;
        } else {
            // Nếu gặp 1 ngày không tập thì dừng đếm ngay (trừ trường hợp hôm nay chưa tập thì xem ngày hôm qua)
            // Nếu i == 0 (hôm nay) mà chưa tập thì chưa reset vội, kiểm tra ngày hôm qua
            if (i == 0) {
                continue; 
            } else {
                break; // Gãy streak
            }
        }
    }

    // Cập nhật số streak lên màn hình
    const streakElement = document.getElementById(category + '-streak-count');
    if (streakElement != null) {
        streakElement.innerText = streakCount;
    }
}

// --- 4. LOGIC LƯU LOG BÀI TẬP ---
function saveFitnessLog() {
    const inputElement = document.getElementById('fitness-log-input');
    const content = inputElement.value;

    if (content.trim() == "") {
        alert("Chưa nhập gì mà lưu cái gì ông thần? :v");
        return;
    }

    // Lấy danh sách log cũ
    let logs = [];
    const savedLogsString = localStorage.getItem('fitness_logs');
    if (savedLogsString != null) {
        logs = JSON.parse(savedLogsString);
    }

    // Thêm log mới vào đầu mảng
    logs.unshift(content); 

    // Lưu lại
    localStorage.setItem('fitness_logs', JSON.stringify(logs));

    // Xóa ô nhập và vẽ lại
    inputElement.value = "";
    renderLogs();
}

function renderLogs() {
    const container = document.getElementById('fitness-log-list');
    container.innerHTML = "";

    let logs = [];
    const savedLogsString = localStorage.getItem('fitness_logs');
    if (savedLogsString != null) {
        logs = JSON.parse(savedLogsString);
    }

    for (let i = 0; i < logs.length; i++) {
        const div = document.createElement('div');
        div.className = 'log-item';
        div.innerText = logs[i];
        container.appendChild(div);
    }
}

// --- 5. LOGIC ĐẾM NGƯỢC (COUNTDOWN) ---
// Biến toàn cục để lưu interval giúp update mỗi giây
let countdownInterval = null;

function addNewEvent() {
    const name = document.getElementById('event-name').value;
    const dateVal = document.getElementById('event-date').value;
    const color = document.getElementById('event-color').value;

    if (name == "" || dateVal == "") {
        alert("Điền đầy đủ thông tin đi bro!");
        return;
    }

    const newEvent = {
        name: name,
        date: dateVal,
        color: color
    };

    // Lấy danh sách sự kiện cũ
    let events = [];
    const storedEvents = localStorage.getItem('my_events');
    if (storedEvents != null) {
        events = JSON.parse(storedEvents);
    }

    events.push(newEvent);
    localStorage.setItem('my_events', JSON.stringify(events));

    // Vẽ lại và khởi động lại bộ đếm
    renderCountdowns();
}

function renderCountdowns() {
    const container = document.getElementById('countdown-list');
    container.innerHTML = "";

    let events = [];
    const storedEvents = localStorage.getItem('my_events');
    if (storedEvents != null) {
        events = JSON.parse(storedEvents);
    }

    for (let i = 0; i < events.length; i++) {
        const evt = events[i];
        
        // Tạo thẻ HTML cho sự kiện
        const card = document.createElement('div');
        card.className = 'countdown-item';
        card.style.borderColor = evt.color;
        
        // Tạo ID duy nhất để lát JS update thời gian vào đúng chỗ
        const timerId = 'timer-' + i;

        card.innerHTML = `
            <h3 style="color: ${evt.color}">${evt.name}</h3>
            <div id="${timerId}" class="timer-display">Đang tính...</div>
            <p>Ngày thi: ${evt.date}</p>
        `;

        container.appendChild(card);
    }
}

// Hàm chạy mỗi giây để update thời gian
function startCountdownTimer() {
    // Nếu đã có interval cũ thì xóa đi để tránh trùng
    if (countdownInterval != null) {
        clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(function() {
        let events = [];
        const storedEvents = localStorage.getItem('my_events');
        if (storedEvents != null) {
            events = JSON.parse(storedEvents);
        }

        const now = new Date().getTime();

        for (let i = 0; i < events.length; i++) {
            const evt = events[i];
            const targetTime = new Date(evt.date).getTime();
            const distance = targetTime - now;

            const timerElement = document.getElementById('timer-' + i);
            
            if (timerElement != null) {
                if (distance < 0) {
                    timerElement.innerText = "Đã diễn ra! 🎉";
                } else {
                    // Tính toán ngày giờ phút giây
                    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                    timerElement.innerText = days + "d " + hours + "h " + minutes + "m " + seconds + "s";
                }
            }
        }
    }, 1000); // Chạy mỗi 1000ms (1 giây)
}

// --- 6. KHỞI TẠO KHI TRANG WEB LOAD XONG ---
window.onload = function() {
    // Mặc định hiện trang home
    showSection('home');
    
    // Load dữ liệu ban đầu
    loadHeatmap('fitness');
    renderLogs();
    loadHeatmap('japanese');
    renderCountdowns();
    startCountdownTimer();
};
