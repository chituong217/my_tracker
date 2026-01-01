// --- 1. BIẾN TOÀN CỤC ---
// Biến này để lưu ngày mà ông đang click chuột vào
let currentSelectedDate = ""; 
// Biến này lưu bộ đếm thời gian để tránh bị chạy trùng lặp
let countdownTimerId = null; 

// --- 2. HÀM KHỞI TẠO (CHẠY KHI WEB LOAD XONG) ---
window.onload = function() {
    // Mặc định mở trang Home trước
    openTab('home');

    // Hiển thị ngày hôm nay ở trang chủ
    const todayStr = getTodayString();
    const displayElement = document.getElementById('display-today');
    if (displayElement != null) {
        displayElement.innerText = todayStr;
    }

    // Bắt đầu chạy đồng hồ đếm ngược
    startCountdownLoop();
};

// --- 3. HÀM CHUYỂN TAB (NAVIGATION) ---
function openTab(tabName) {
    // Danh sách tên các section
    const allTabs = ['home', 'fitness', 'japanese', 'countdown'];

    // 1. Ẩn tất cả các tab đi
    for (let i = 0; i < allTabs.length; i++) {
        const id = allTabs[i] + '-section';
        const section = document.getElementById(id);
        if (section != null) {
            section.style.display = 'none';
        }
    }

    // 2. Hiện tab được chọn
    const selectedId = tabName + '-section';
    const selectedSection = document.getElementById(selectedId);
    if (selectedSection != null) {
        selectedSection.style.display = 'block';
    }

    // 3. Nếu vào trang Fitness hoặc Japanese thì vẽ Heatmap và chọn ngày hôm nay
    if (tabName == 'fitness' || tabName == 'japanese') {
        renderHeatmap(tabName);
        
        // Tự động chọn ngày hôm nay để người dùng đỡ phải tìm
        const today = getTodayString();
        selectDate(tabName, today);
    }

    // 4. Nếu vào trang Countdown thì vẽ danh sách sự kiện
    if (tabName == 'countdown') {
        renderCountdownList();
    }
}

// --- 4. CÁC HÀM HỖ TRỢ NGÀY THÁNG ---
// Trả về chuỗi ngày hôm nay dạng "YYYY-MM-DD"
function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    // Tháng bắt đầu từ 0 nên phải +1, thêm số 0 đằng trước nếu < 10
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return year + "-" + month + "-" + day;
}

// Tạo danh sách tất cả các ngày trong năm nay
function getAllDaysInYear(year) {
    const listDays = [];
    // Bắt đầu từ ngày 1 tháng 1
    const date = new Date(year, 0, 1);

    while (date.getFullYear() == year) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateString = y + "-" + m + "-" + d;
        
        listDays.push(dateString);

        // Tăng thêm 1 ngày
        date.setDate(date.getDate() + 1);
    }
    return listDays;
}

// --- 5. LOGIC HEATMAP (LƯỚI Ô VUÔNG) ---
function renderHeatmap(category) {
    // Tìm thẻ chứa heatmap
    const containerId = category + '-heatmap';
    const container = document.getElementById(containerId);
    
    // Xóa nội dung cũ
    container.innerHTML = "";

    // Lấy dữ liệu từ LocalStorage
    const data = loadDataFromStorage(category);

    // Lấy danh sách ngày trong năm hiện tại
    const currentYear = new Date().getFullYear();
    const allDays = getAllDaysInYear(currentYear);

    // Vòng lặp tạo ô vuông
    for (let i = 0; i < allDays.length; i++) {
        const dateStr = allDays[i];
        
        // Tạo thẻ div
        const box = document.createElement('div');
        
        // Mặc định class cơ bản
        box.className = 'heatmap-box';
        // Thêm tooltip khi di chuột
        box.title = "Ngày: " + dateStr;

        // Kiểm tra xem ngày này đã làm chưa
        // Dữ liệu lưu dạng: { "2026-01-01": { isDone: true, note: "..." } }
        const dayInfo = data[dateStr];
        if (dayInfo != null && dayInfo.isDone == true) {
            box.classList.add('done'); // Thêm class màu cam
        }

        // Nếu ngày này đang được chọn thì thêm viền đỏ
        if (dateStr == currentSelectedDate) {
            box.classList.add('selected');
        }

        // Sự kiện khi click vào ô
        box.onclick = function() {
            selectDate(category, dateStr);
        };

        // Gắn vào container
        container.appendChild(box);
    }

    // Tính toán streak
    calculateStreak(category, data);
}

// --- 6. LOGIC XỬ LÝ DỮ LIỆU (CLICK & SAVE) ---
// Hàm chạy khi click vào 1 ô vuông
function selectDate(category, dateStr) {
    // Cập nhật biến toàn cục
    currentSelectedDate = dateStr;

    // Vẽ lại Heatmap để cập nhật viền đỏ (ô đang chọn)
    renderHeatmap(category);

    // Hiển thị ngày lên tiêu đề bên phải
    const titleId = category + '-selected-date-display';
    const title = document.getElementById(titleId);
    if (title != null) {
        title.innerText = "Đang xem ngày: " + dateStr;
    }

    // Lấy dữ liệu của ngày đó đổ vào Form
    const data = loadDataFromStorage(category);
    const dayInfo = data[dateStr];

    const checkboxId = category + '-checkbox';
    const noteId = category + '-note';

    const checkbox = document.getElementById(checkboxId);
    const textarea = document.getElementById(noteId);

    if (dayInfo != null) {
        // Nếu đã có dữ liệu
        checkbox.checked = dayInfo.isDone;
        textarea.value = dayInfo.note;
    } else {
        // Nếu chưa có dữ liệu (trang mới)
        checkbox.checked = false;
        textarea.value = "";
    }
}

// Hàm chạy khi bấm nút "Lưu Dữ Liệu"
function saveData(category) {
    // Kiểm tra xem đã chọn ngày chưa
    if (currentSelectedDate == "") {
        alert("Chưa chọn ngày nào cả bro!");
        return;
    }

    // Lấy giá trị từ Form
    const checkboxId = category + '-checkbox';
    const noteId = category + '-note';

    const checkbox = document.getElementById(checkboxId);
    const textarea = document.getElementById(noteId);

    const isDoneValue = checkbox.checked;
    const noteValue = textarea.value;

    // Lấy toàn bộ dữ liệu cũ ra
    const data = loadDataFromStorage(category);

    // Cập nhật dữ liệu cho ngày đang chọn
    data[currentSelectedDate] = {
        isDone: isDoneValue,
        note: noteValue
    };

    // Lưu ngược lại vào LocalStorage
    const storageKey = category + '_tracker_data';
    const jsonString = JSON.stringify(data);
    localStorage.setItem(storageKey, jsonString);

    // Vẽ lại Heatmap để thấy thay đổi màu sắc
    renderHeatmap(category);

    alert("Đã lưu thành công cho ngày " + currentSelectedDate);
}

// Hàm phụ: Đọc dữ liệu từ Storage (trả về Object)
function loadDataFromStorage(category) {
    const storageKey = category + '_tracker_data';
    const rawData = localStorage.getItem(storageKey);
    
    if (rawData == null) {
        return {}; // Trả về object rỗng nếu chưa có gì
    } else {
        return JSON.parse(rawData);
    }
}

// --- 7. LOGIC TÍNH STREAK (CHUỖI LIÊN TIẾP) ---
function calculateStreak(category, data) {
    let streak = 0;
    const today = new Date();

    // Duyệt ngược 365 ngày từ hôm nay về quá khứ
    for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i); // Trừ đi i ngày

        // Tạo chuỗi YYYY-MM-DD
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = y + "-" + m + "-" + day;

        const dayInfo = data[dateStr];

        if (dayInfo != null && dayInfo.isDone == true) {
            streak = streak + 1;
        } else {
            // Nếu hôm nay (i=0) chưa làm thì không tính là gãy streak, bỏ qua
            if (i == 0) {
                continue;
            } else {
                // Nếu ngày quá khứ mà chưa làm -> Đứt chuỗi
                break;
            }
        }
    }

    // Hiển thị lên màn hình
    const streakId = category + '-streak';
    const element = document.getElementById(streakId);
    if (element != null) {
        element.innerText = streak;
    }
}

// --- 8. LOGIC ĐẾM NGƯỢC (COUNTDOWN) ---
function addEvent() {
    const nameInput = document.getElementById('event-name');
    const timeInput = document.getElementById('event-time');
    const colorInput = document.getElementById('event-color');

    const name = nameInput.value;
    const time = timeInput.value;
    const color = colorInput.value;

    if (name == "" || time == "") {
        alert("Nhập thiếu thông tin rồi bro!");
        return;
    }

    // Lấy danh sách cũ
    let events = [];
    const raw = localStorage.getItem('countdown_events');
    if (raw != null) {
        events = JSON.parse(raw);
    }

    // Thêm mới
    events.push({
        name: name,
        time: time,
        color: color
    });

    // Lưu lại
    localStorage.setItem('countdown_events', JSON.stringify(events));

    // Vẽ lại danh sách
    renderCountdownList();
    
    // Reset form
    nameInput.value = "";
    timeInput.value = "";
}

function renderCountdownList() {
    const container = document.getElementById('countdown-list');
    container.innerHTML = "";

    let events = [];
    const raw = localStorage.getItem('countdown_events');
    if (raw != null) {
        events = JSON.parse(raw);
    }

    for (let i = 0; i < events.length; i++) {
        const evt = events[i];
        
        const div = document.createElement('div');
        div.className = 'countdown-item';
        // Thêm màu viền theo ý thích
        div.style.borderColor = evt.color;

        // Tạo id riêng cho cái đồng hồ để lát update
        const timerId = 'timer-display-' + i;

        div.innerHTML = '<h3>' + evt.name + '</h3>' +
                        '<div id="' + timerId + '" class="timer-number">Loading...</div>' +
                        '<p>Hạn chót: ' + evt.time + '</p>';
        
        container.appendChild(div);
    }
}

function startCountdownLoop() {
    // Nếu đang chạy thì tắt cái cũ đi
    if (countdownTimerId != null) {
        clearInterval(countdownTimerId);
    }

    // Chạy mỗi 1 giây (1000ms)
    countdownTimerId = setInterval(function() {
        let events = [];
        const raw = localStorage.getItem('countdown_events');
        if (raw != null) {
            events = JSON.parse(raw);
        }

        const now = new Date().getTime();

        for (let i = 0; i < events.length; i++) {
            const evt = events[i];
            const targetTime = new Date(evt.time).getTime();
            const distance = targetTime - now;

            const element = document.getElementById('timer-display-' + i);
            
            // Chỉ update nếu phần tử đó đang hiển thị trên màn hình
            if (element != null) {
                if (distance < 0) {
                    element.innerText = "ĐÃ DIỄN RA!";
                    element.style.color = "gray";
                } else {
                    // Công thức quy đổi thời gian
                    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                    element.innerText = days + "d " + hours + "h " + minutes + "m " + seconds + "s";
                    element.style.color = evt.color;
                }
            }
        }
    }, 1000);
}
