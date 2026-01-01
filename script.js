// =======================================================
// PHẦN 1: KHỞI TẠO VÀ CẤU HÌNH
// =======================================================

// Biến toàn cục để lưu ngày đang được chọn (Ví dụ: "2026-01-01")
let currentSelectedDateString = "";

// Biến giữ bộ đếm thời gian (để tránh bị chạy trùng lặp)
let countdownIntervalId = null; 

// Khi trang web tải xong, hàm này sẽ chạy đầu tiên
window.onload = function() {
    console.log("Website đã tải xong. Bắt đầu khởi tạo...");
    
    // 1. Mở trang chủ mặc định
    openTab('home');

    // 2. Hiển thị ngày hôm nay ở trang chủ
    const today = getTodayDateString();
    const dateDisplayElement = document.getElementById('home-today-date');
    if (dateDisplayElement != null) {
        dateDisplayElement.innerText = today;
    }

    // 3. Khởi động đồng hồ đếm ngược
    startCountdownTimer();
};

// =======================================================
// PHẦN 2: CHỨC NĂNG CHUYỂN TAB (MENU)
// =======================================================

function openTab(tabName) {
    // Danh sách ID của các trang
    const allTabs = ['tab-home', 'tab-fitness', 'tab-japanese', 'tab-countdown'];

    // Bước 1: Ẩn tất cả các trang
    for (let i = 0; i < allTabs.length; i = i + 1) {
        const id = allTabs[i];
        const element = document.getElementById(id);
        if (element != null) {
            element.style.display = 'none';
        }
    }

    // Bước 2: Hiện trang được chọn
    const selectedId = 'tab-' + tabName;
    const selectedElement = document.getElementById(selectedId);
    if (selectedElement != null) {
        selectedElement.style.display = 'block';
    } else {
        console.error("Lỗi: Không tìm thấy trang có tên " + tabName);
        return;
    }

    // Bước 3: Nếu là trang Thể Dục hoặc Tiếng Nhật thì tải dữ liệu Heatmap
    if (tabName == 'fitness' || tabName == 'japanese') {
        renderHeatmapGrid(tabName);
        
        // Tự động chọn ngày hôm nay để người dùng nhập luôn
        const today = getTodayDateString();
        handleDateClick(tabName, today);
    }
}

// =======================================================
// PHẦN 3: XỬ LÝ DỮ LIỆU & HEATMAP (LƯỚI)
// =======================================================

// Hàm hỗ trợ: Lấy ngày hôm nay dạng chuỗi "YYYY-MM-DD"
function getTodayDateString() {
    const date = new Date();
    const year = date.getFullYear();
    // Tháng trong JS bắt đầu từ 0 nên phải +1
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return year + "-" + month + "-" + day;
}

// Hàm hỗ trợ: Lấy tất cả các ngày trong năm nay
function getAllDaysInCurrentYear() {
    const daysArray = [];
    const currentYear = new Date().getFullYear();
    
    // Bắt đầu từ ngày 1/1
    const dateIterator = new Date(currentYear, 0, 1);

    while (dateIterator.getFullYear() == currentYear) {
        // Tạo chuỗi YYYY-MM-DD thủ công để tránh lỗi múi giờ
        const y = dateIterator.getFullYear();
        const m = String(dateIterator.getMonth() + 1).padStart(2, '0');
        const d = String(dateIterator.getDate()).padStart(2, '0');
        const dateString = y + "-" + m + "-" + d;

        daysArray.push(dateString);

        // Tăng thêm 1 ngày
        dateIterator.setDate(dateIterator.getDate() + 1);
    }
    return daysArray;
}

// Hàm chính: Vẽ lưới heatmap
function renderHeatmapGrid(categoryName) {
    const containerId = categoryName + '-grid';
    const container = document.getElementById(containerId);
    
    // Xóa nội dung cũ đi để vẽ lại
    container.innerHTML = "";

    // Lấy dữ liệu từ bộ nhớ trình duyệt (LocalStorage)
    // Tên Key ví dụ: "fitness_storage_data"
    const storageKey = categoryName + '_storage_data';
    const jsonString = localStorage.getItem(storageKey);
    
    let savedData = {};
    if (jsonString != null) {
        savedData = JSON.parse(jsonString);
    }

    // Lấy danh sách ngày trong năm
    const allDays = getAllDaysInCurrentYear();

    // Vòng lặp tạo từng ô vuông
    for (let i = 0; i < allDays.length; i = i + 1) {
        const dateStr = allDays[i];
        
        // Tạo thẻ div cho ô vuông
        const box = document.createElement('div');
        box.className = 'grid-box';
        box.title = "Ngày: " + dateStr; // Hiện ngày khi di chuột vào

        // Kiểm tra xem ngày này đã hoàn thành chưa
        // Dữ liệu lưu dạng: { "2026-01-01": { completed: true, note: "abc" } }
        const dayInfo = savedData[dateStr];

        if (dayInfo != null) {
            if (dayInfo.completed == true) {
                box.classList.add('completed');
            }
        }

        // Nếu ô này đang được chọn thì thêm viền đỏ
        if (dateStr == currentSelectedDateString) {
            box.classList.add('selected');
        }

        // Gắn sự kiện click
        box.onclick = function() {
            handleDateClick(categoryName, dateStr);
        };

        // Thêm ô vào container
        container.appendChild(box);
    }

    // Tính toán streak sau khi vẽ xong
    calculateStreak(categoryName, savedData);
}

// =======================================================
// PHẦN 4: XỬ LÝ TƯƠNG TÁC NGƯỜI DÙNG (CLICK & LƯU)
// =======================================================

// Khi người dùng click vào 1 ô ngày
function handleDateClick(categoryName, dateStr) {
    // 1. Cập nhật ngày đang chọn
    currentSelectedDateString = dateStr;

    // 2. Cập nhật giao diện bên phải
    const titleId = categoryName + '-selected-date';
    const titleElement = document.getElementById(titleId);
    if (titleElement != null) {
        titleElement.innerText = "Đang xem ngày: " + dateStr;
    }

    // 3. Tải dữ liệu của ngày đó lên form nhập liệu
    const storageKey = categoryName + '_storage_data';
    const jsonString = localStorage.getItem(storageKey);
    let savedData = {};
    if (jsonString != null) {
        savedData = JSON.parse(jsonString);
    }

    const dayInfo = savedData[dateStr]; // Lấy dữ liệu ngày đó

    // Lấy các thẻ input
    const checkbox = document.getElementById(categoryName + '-is-done');
    const noteArea = document.getElementById(categoryName + '-note');

    if (dayInfo != null) {
        // Nếu đã có dữ liệu cũ
        checkbox.checked = dayInfo.completed;
        noteArea.value = dayInfo.note;
    } else {
        // Nếu chưa có dữ liệu (trang trắng)
        checkbox.checked = false;
        noteArea.value = "";
    }

    // 4. Vẽ lại lưới để cập nhật ô nào đang được chọn (viền đỏ)
    renderHeatmapGrid(categoryName);
}

// Khi người dùng bấm nút "Lưu Dữ Liệu"
function saveData(categoryName) {
    if (currentSelectedDateString == "") {
        alert("Lỗi: Bạn chưa chọn ngày nào cả!");
        return;
    }

    // Lấy giá trị từ form
    const checkbox = document.getElementById(categoryName + '-is-done');
    const noteArea = document.getElementById(categoryName + '-note');

    const isDone = checkbox.checked;
    const noteContent = noteArea.value;

    // Lấy dữ liệu cũ từ LocalStorage
    const storageKey = categoryName + '_storage_data';
    const jsonString = localStorage.getItem(storageKey);
    let savedData = {};
    if (jsonString != null) {
        savedData = JSON.parse(jsonString);
    }

    // Cập nhật dữ liệu mới cho ngày đang chọn
    savedData[currentSelectedDateString] = {
        completed: isDone,
        note: noteContent
    };

    // Lưu ngược lại vào LocalStorage
    localStorage.setItem(storageKey, JSON.stringify(savedData));

    // Vẽ lại giao diện
    renderHeatmapGrid(categoryName);

    alert("Đã lưu thành công cho ngày " + currentSelectedDateString);
}

// =======================================================
// PHẦN 5: TÍNH STREAK (CHUỖI NGÀY LIÊN TIẾP)
// =======================================================

function calculateStreak(categoryName, savedData) {
    let streakCount = 0;
    const today = new Date();

    // Kiểm tra lùi về quá khứ 365 ngày
    for (let i = 0; i < 365; i = i + 1) {
        const tempDate = new Date();
        tempDate.setDate(today.getDate() - i); // Lùi lại i ngày

        // Chuyển thành chuỗi YYYY-MM-DD
        const y = tempDate.getFullYear();
        const m = String(tempDate.getMonth() + 1).padStart(2, '0');
        const d = String(tempDate.getDate()).padStart(2, '0');
        const dateStr = y + "-" + m + "-" + d;

        const info = savedData[dateStr];

        if (info != null && info.completed == true) {
            streakCount = streakCount + 1;
        } else {
            // Nếu ngày hôm nay (i=0) chưa làm thì không tính là gãy streak
            if (i == 0) {
                continue;
            } else {
                // Gặp ngày chưa làm trong quá khứ -> Dừng đếm
                break;
            }
        }
    }

    // Hiển thị số streak
    const streakElement = document.getElementById(categoryName + '-streak');
    if (streakElement != null) {
        streakElement.innerText = streakCount;
    }
}

// =======================================================
// PHẦN 6: ĐẾM NGƯỢC (COUNTDOWN)
// =======================================================

function createNewEvent() {
    const titleInput = document.getElementById('event-title');
    const dateInput = document.getElementById('event-date');
    const colorInput = document.getElementById('event-color');

    if (titleInput.value == "" || dateInput.value == "") {
        alert("Vui lòng nhập đầy đủ Tên sự kiện và Thời gian!");
        return;
    }

    // Tạo đối tượng sự kiện mới
    const newEvent = {
        title: titleInput.value,
        time: dateInput.value,
        color: colorInput.value
    };

    // Lưu vào LocalStorage
    const jsonString = localStorage.getItem('my_events_list');
    let eventsList = [];
    if (jsonString != null) {
        eventsList = JSON.parse(jsonString);
    }

    eventsList.push(newEvent);
    localStorage.setItem('my_events_list', JSON.stringify(eventsList));

    // Reset form và vẽ lại
    titleInput.value = "";
    dateInput.value = "";
    renderEventList();
}

function renderEventList() {
    const container = document.getElementById('event-list-container');
    container.innerHTML = "";

    const jsonString = localStorage.getItem('my_events_list');
    let eventsList = [];
    if (jsonString != null) {
        eventsList = JSON.parse(jsonString);
    }

    for (let i = 0; i < eventsList.length; i = i + 1) {
        const evt = eventsList[i];
        
        const div = document.createElement('div');
        div.className = 'event-item';
        div.style.borderColor = evt.color;

        // ID để cập nhật thời gian: timer-0, timer-1,...
        const timerId = 'timer-' + i;

        div.innerHTML = `
            <h3 style="color: ${evt.color}">${evt.title}</h3>
            <div id="${timerId}" style="font-size: 24px; font-weight: bold; color: #5d4037;">Đang tính...</div>
            <p>Hạn chót: ${evt.time.replace('T', ' ')}</p>
        `;

        container.appendChild(div);
    }
}

function startCountdownTimer() {
    // Nếu đang chạy thì dừng cái cũ trước
    if (countdownIntervalId != null) {
        clearInterval(countdownIntervalId);
    }

    // Chạy vòng lặp mỗi 1 giây (1000ms)
    countdownIntervalId = setInterval(function() {
        const jsonString = localStorage.getItem('my_events_list');
        let eventsList = [];
        if (jsonString != null) {
            eventsList = JSON.parse(jsonString);
        }

        const now = new Date().getTime();

        for (let i = 0; i < eventsList.length; i = i + 1) {
            const evt = eventsList[i];
            const targetDate = new Date(evt.time).getTime();
            const distance = targetDate - now;

            const element = document.getElementById('timer-' + i);
            if (element != null) {
                if (distance < 0) {
                    element.innerText = "SỰ KIỆN ĐÃ DIỄN RA";
                    element.style.color = "gray";
                } else {
                    // Công thức tính ngày giờ phút giây
                    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                    element.innerText = days + "d " + hours + "h " + minutes + "m " + seconds + "s";
                }
            }
        }
    }, 1000);

    // Vẽ danh sách lần đầu
    renderEventList();
}
