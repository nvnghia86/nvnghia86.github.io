# Gõ Mười Ngón

Website luyện gõ QWERTY và Telex bằng tiếng Việt hoặc tiếng Anh. Ứng dụng dùng kho 1.000 bài tập tĩnh, không cần API key và có thể triển khai trực tiếp lên GitHub Pages.

Kho bài tập nằm tại `data/exercises.json`, gồm 500 bài tiếng Việt và 500 bài tiếng Anh. Mỗi ngôn ngữ được chia thành ba mức Dễ, Vừa và Khó. Các bài khó dài hơn và có nhiều từ tiếng Việt mang dấu hơn.

## Chạy ứng dụng

```powershell
npm start
```

Sau đó mở `http://localhost:4173`.

Không nên mở trực tiếp `index.html` bằng giao thức `file://`, vì trình duyệt có thể chặn việc tải file JSON. Hãy dùng lệnh trên hoặc GitHub Pages.

## Tạo lại kho dữ liệu

```powershell
npm run generate:data
```

Lệnh này tạo lại đúng 1.000 bài không trùng nội dung và kiểm tra giới hạn độ dài theo từng mức.

## Bật Google Analytics

Measurement ID hiện tại là `G-9FVG9T2JC2`. Website sẽ tự gửi lượt truy cập trang và event `typing_completed` khi người dùng hoàn thành bài. Nếu cần đổi property, cập nhật biến `measurementId` trong `analytics.js`. Cách cài đặt dùng Google tag `gtag.js` theo hướng dẫn chính thức của Google: https://developers.google.com/tag-platform/gtagjs.
