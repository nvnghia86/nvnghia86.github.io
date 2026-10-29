# Quizzz Frontend

## Quiz quét thẻ đáp án

Giáo viên mở **Quét thẻ đáp án** trong menu, chọn bộ quiz hoặc câu trắc nghiệm bốn lựa chọn và chọn một lớp có 1–40 học sinh đã được duyệt. Sau khi tạo phòng, màn Host hiển thị QR để mở máy quét trên điện thoại. Giáo viên đăng nhập cùng tài khoản trên điện thoại. Nút **Xem và in thẻ** tạo thẻ ID 1–40 đã gán ổn định cho học sinh của lớp.

Thẻ dùng dictionary `ARUCO` của `js-aruco2` (lưới 7×7); thẻ từ dictionary khác sẽ không được nhận diện. Khi cầm thẻ, cạnh A ở trên, B bên phải, C ở dưới và D bên trái. Scanner chỉ xử lý khung hình trên điện thoại và gửi ID thẻ cùng đáp án qua Socket.IO. URL QR dùng `/#/quiz/<sessionId>/scan` để tương thích với `HashRouter` và GitHub Pages.

Backend cần PostgreSQL và `REDIS_URL` hoạt động cho chế độ này. Camera trên điện thoại cần HTTPS (hoặc localhost khi phát triển). Có thể kiểm tra logic in và nhận diện thẻ bằng `npm test` trong thư mục frontend.

React/Vite frontend for Quizzz. This folder is intentionally deployable as an independent repository.
--
## Local development

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` to the backend API root, including `/api/v1`:

```text
VITE_API_BASE_URL=http://localhost:8787/api/v1
```

The app uses hash-based routing so deep links work on GitHub Pages.

## GitHub Pages

1. Create a repository containing the contents of this `frontend` folder.
2. In `.github/workflows/deploy-pages.yml`, set `VITE_API_BASE_URL` to the public backend URL.
3. Set `VITE_BASE_PATH` to `/<repository-name>/` for a project site. Use `/` for a `username.github.io` site.
4. Enable GitHub Pages with **GitHub Actions** as the source.

The API URL is public browser configuration. Never put database credentials or the OpenRouter key in this repository.
