# Kiểm tra và tối ưu khi zoom trang — 08/10/2026

Đã tìm thấy và sửa các công việc thừa trong animation và render. Kết quả xác nhận giảm tải ở các component được kiểm tra; chưa kết luận đây là toàn bộ nguyên nhân gây lag trong phiên trình duyệt thật của người dùng.

## Những điểm đã xác nhận

1. Bốn hàng phim theo quốc gia đọc `scrollWidth` trong mỗi khung hình và tiếp tục chạy sau khi ra khỏi màn hình.
2. Thay đổi kích thước card khi zoom khiến toàn bộ cây JSX của các thẻ phim được tạo lại, dù dữ liệu phim không đổi.
3. Nền dùng Framer Motion để cập nhật chuyển động của 150 hạt. Chuyển động này có thể biểu diễn bằng CSS keyframes với cùng thông số.

## Bản sửa

- Lưu chiều rộng vòng lặp sau mỗi lần đổi kích thước; animation và kéo chuột/cảm ứng dùng giá trị đã lưu.
- Giữ sẵn cây thẻ phim bằng `useMemo`; truyền chiều rộng qua CSS variable. Dữ liệu phim hoặc gói xem thay đổi vẫn cập nhật thẻ.
- Dùng IntersectionObserver và trạng thái tab để dừng vòng animation khi hàng phim không nhìn thấy. Khi trở lại, đặt lại mốc thời gian để tránh nhảy vị trí. Thu hồi observer, listener và frame khi unmount.
- Giữ vị trí tương đối của hàng phim và mục tiêu mũi tên/kéo khi kích thước thay đổi.
- Chuyển nền hạt sang CSS keyframes, giữ 150 hạt, kích thước, màu, bóng, độ mờ, đường đi, chu kỳ 10–20 giây và độ trễ âm như cũ.

Giữ toàn bộ danh sách phim và thứ tự; công thức responsive, nút mũi tên, kéo chuột/cảm ứng, link `/phim/...`, badge và nội dung thẻ được giữ lại. Không giới hạn số phim để đạt kết quả đo.

## Đo trong trình duyệt

Dùng component thật trước và sau sửa trong một trang thử với 120 phim mẫu thuộc bốn quốc gia, nhân đôi thành 240 thẻ như logic hiện có. Hooks lấy phim/gói và ảnh được thay bằng fixture. Các phép đo dưới đây thực hiện sau khi xác nhận trang dùng đủ 240 thẻ mẫu.

| Kiểm tra | Trước | Sau |
|---|---:|---:|
| Số lần đọc `scrollWidth` trong 1,8 giây animation | 708 | 0 |
| Số thẻ tạo lại qua chu kỳ CSS zoom 125% → 80% → 150% → 100% | 960 | 0 |
| Số lần đọc `scrollWidth` qua chu kỳ zoom | 144 | 8 |
| Số thẻ được giữ trong DOM | 240 | 240 |
| Số phim duy nhất có link | 120 | 120 |
| Khi toàn bộ hàng phim ngoài màn hình | Tiếp tục chuyển động | Dừng chuyển động |

Đối chiếu viewport 1440 × 900: cả hai bản có container 1153 px, card khoảng 374,325 px và khoảng cách 15 px. Bản sửa ở viewport 390 × 844 có container/card 327 px và khoảng cách 10 px; đã kiểm tra trực quan bố cục.

Đã bấm mũi tên hai chiều, kéo một hàng phim và xác nhận kéo không đổi route. Click trực tiếp thẻ phim sau khi kéo mở đúng `/phim/movie-0-2`. Kiểm tra 240 link đều khớp route của 120 phim mẫu. Nền CSS vẫn có 150 hạt và transform/opacity đang chuyển động; đã kiểm tra trực quan.

Phép thử zoom dùng CSS zoom và thay đổi viewport trong trình duyệt tích hợp. Đây là kiểm tra hành vi resize/render, chưa phải profile thao tác Ctrl+/Ctrl− hoặc pinch zoom trong phiên trình duyệt của người dùng. Số khung hình và FPS phụ thuộc thiết bị, refresh rate và toàn bộ trang; không suy ra mức tăng FPS chung từ các số đếm trên.

## Kiểm tra mã nguồn

- Build production: thành công.
- ESLint: qua trên cả bốn file JavaScript/JSX mới hoặc sửa.
- `git diff --check`: qua.
- 34 kiểm thử: qua, gồm animation visibility/cleanup, chatbot, entitlement và API chat.
- Bộ kiểm thử animation xác nhận không chạy ngoài màn hình, không tạo vòng lặp trùng, không cộng thời gian nghỉ vào chuyển động, dừng khi tab ẩn, cleanup và fallback khi thiếu IntersectionObserver.

Báo cáo ghi nhận kiểm tra trên workspace local; chưa xác minh kết quả sau deploy trên web online.
