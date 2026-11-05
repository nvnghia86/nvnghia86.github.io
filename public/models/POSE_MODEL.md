# Pose Landmarker model cho game AR cử chỉ

Game **Đấu trường cử chỉ** (`/student/body-pose`) dùng MediaPipe Pose Landmarker.
Model Lite đã được đóng gói cùng frontend tại `pose_landmarker_lite.task` để
camera hoạt động mà không cần tải model từ internet trong lúc chơi.

## File cần tải

`pose_landmarker_lite.task` (model nhẹ, phù hợp webcam realtime)

## Các nguồn chính thức

- Google storage:
  `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task`
- Hoặc bản `full.task` / `heavy.task` cho độ chính xác cao hơn.

## Cách cập nhật model

```bash
cd frontend
curl -L -o public/models/pose_landmarker_lite.task \
  https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task
```

Sau khi thay model, build lại frontend để đưa file mới vào gói phát hành.

## Nếu chưa có model

Nếu trình duyệt không tải được model, học sinh vẫn có thể chọn đáp án bằng
nút **A / B / C / D** trên màn hình hoặc phím **A** / **B** / **C** / **D**.
Ánh xạ cử chỉ thay đổi theo từng câu và được tính giống nhau trên màn giáo viên
và mọi thiết bị học sinh.
