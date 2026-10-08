# Điều tra giật khi kéo chiều rộng trình duyệt

Ngày: 08/10/2026. Mã nền trước sửa: `6dbceb6`, nhánh `main`. Phần cuối ghi kết quả bản sửa tiếp theo.

## Kết luận

Đã tái hiện giật khi đổi chiều rộng viewport desktop → mobile → desktop. Nút thắt lớn nhất nằm ở bố cục trang chủ sau khi người dùng đã cuộn qua các mục: các hàng quốc gia dựng toàn bộ kho phim hai lần, giữ hàng chục nghìn phần tử ngoài màn hình. Resize buộc trình duyệt tính lại kích thước các phần tử này. Các slider và hiệu ứng làm tăng thêm chi phí.

Bản tối ưu trước giảm việc đọc `scrollWidth` mỗi frame và tái tạo JSX, nhưng không giảm lượng DOM cần layout khi thay đổi chiều rộng. Vì vậy nó chưa giải quyết nguyên nhân chính của thao tác resize mà người dùng vừa làm rõ.

## Phương pháp và phạm vi

- Đọc mã phần giao diện khách, layout dùng chung, carousel, nền, chatbot, hooks/provider dữ liệu, trang chi tiết/xem phim, tài khoản và thanh toán.
- Kiểm tra DOM trang online `https://www.mfilm.online/`. Bundle `FilmCountry` online có CSS variable và cơ chế dừng animation của bản vừa push.
- Đo bản production build local với danh mục Firestore thực tế. Chặn đợt đồng bộ tập tự động trên origin đo bằng khóa thời gian local; không phát video hoặc thực hiện giao dịch.
- Dùng viewport thật trong trình duyệt thử nghiệm, giữ chiều cao 850px; chuỗi chiều rộng: 1400, 1250, 1100, 900, 768, 640, 500, 390, 500, 768, 1000, 1400px. Đây là phép đổi kích thước responsive, không dùng CSS zoom.
- Bộ đo thu khoảng cách `requestAnimationFrame`, Long Task (>50ms), số lần đọc layout và callback ResizeObserver. Bộ đo tự có overhead; số liệu chỉ dùng so sánh các chế độ trên cùng môi trường, không đại diện chính xác máy/trình duyệt của người dùng.
- Runtime: trang chủ, phim lẻ, phim bộ, diễn viên, chủ đề, lịch chiếu. Những luồng cần đăng nhập, chi tiết/phát phim và thanh toán được rà soát mã, chưa đo đầy đủ runtime trong phiên này. Không khẳng định mọi màn hình đã được kiểm chứng bằng browser.
- Connector Vercel trả 403 đối với project, nên không truy xuất lịch sử deployment; xác nhận phiên bản online bằng nội dung bundle đang phục vụ.

## Bằng chứng trực tiếp

Trang chủ lúc chỉ các mục đầu tải: 1.417 phần tử, 51 ảnh, 4 Swiper. Sau khi cuộn qua toàn trang: **22.519 phần tử, 990 thẻ ảnh, 10 Swiper**. Số thẻ ảnh khác số request ảnh: nhiều thẻ dùng chung URL và nhiều ảnh còn lazy-load.

Các hàng quốc gia giữ **820 thẻ phim**:

| Hàng | Thẻ sau nhân đôi | Chiều rộng track tại viewport 1400px |
| --- | ---: | ---: |
| Nhật Bản | 318 | 110.860px |
| Trung Quốc | 354 | 123.412px |
| Hàn Quốc | 120 | 41.825px |
| Việt Nam | 28 | 9.748px |

Sau khi cuộn rồi trở lại đầu trang, có **244 animation đang chạy**, trong đó **230 nằm ngoài viewport**. Có **186 hiệu ứng `laser-scan`** trên badge Premium. Nhiều hiệu ứng nằm trong pseudo-element nên kiểm tra `animationName` trên element đơn thuần bỏ sót chúng.

## Kết quả chuỗi resize

Các chế độ thử chỉ áp dụng tạm vào bản đo, chưa đưa vào sản phẩm. Tắt hiệu ứng bao gồm animation, transition, filter, blur và shadow, vì vậy phép thử này không tách riêng được từng hiệu ứng.

| Trạng thái | Thời gian chuỗi | Khung hình chậm nhất | P95 khoảng cách frame | Tổng Long Task |
| --- | ---: | ---: | ---: | ---: |
| Trang chủ, chỉ mục đầu đã tải | 842ms | 97ms | 77ms | 0ms |
| Trang chủ sau cuộn toàn trang | 9.169ms | 653ms | 632ms | 4.773ms / 27 task |
| Cùng trang, tạm tắt hiệu ứng | 7.810ms | 549ms | 479ms | 3.868ms / 27 task |
| Cùng trang, tạm `display:none` hàng quốc gia | 3.326ms | 285ms | 271ms | 1.963ms / 15 task |
| Cùng trang, thử `content-visibility:auto` cho thẻ quốc gia | 3.202ms | 292ms | 292ms | 1.678ms / 15 task |

Kiểm chứng lại sau khi ảnh/dữ liệu đã tải: bình thường 8.643ms, frame tối đa 639ms, tổng Long Task 4.359ms; thử bỏ qua layout thẻ ngoài màn hình còn 2.890ms, frame tối đa 229ms, tổng Long Task 1.345ms. Chậm vẫn còn sau tối ưu thử, nên chưa thể coi đây là bản sửa hoàn tất.

Thử thêm `content-visibility` trên wrapper rộng ở trang chủ không cải thiện (9.641ms, frame tối đa 771ms). Không nên gắn CSS này đại trà mà không kiểm tra cấu trúc/chiều cao/slider.

| Trang khác | Phần tử | Animation lúc đo | Frame chậm nhất | Long Task trong mẫu |
| --- | ---: | ---: | ---: | ---: |
| Phim lẻ | 1.044 | 159 | 90ms | 0 |
| Phim bộ | 1.044 | 159 | 56ms | 0 |
| Diễn viên | 708 | 160 | 76ms | 0 |
| Chủ đề | 481 | 156 | 70ms | 0 |
| Lịch chiếu | 492 | 153 | 42ms | 0 |

Phim lẻ khi tạm tắt nhóm hiệu ứng: frame tối đa từ 90ms xuống 42ms, P95 từ 83ms xuống 35ms trong mẫu này. Không có Long Task không có nghĩa là luôn mượt: layout/paint/GPU vẫn có thể làm trễ frame.

## Nguyên nhân theo mức ưu tiên

### 1. DOM và bố cục hàng quốc gia — đã xác nhận ảnh hưởng lớn

`src/pages/client/home/filmCountry/FilmCountry.jsx` lọc tất cả phim của quốc gia rồi nhân đôi toàn bộ danh sách để chạy vòng lặp. Mỗi phim có ảnh, nhiều badge, SVG và text. Memo JSX không giúp trình duyệt bỏ qua layout CSS của những thẻ đó khi chiều rộng thay đổi. Track `w-max` dài hơn 100.000px và có `will-change-transform` thường trực; đây cũng là ứng viên làm tăng tải raster/compositor, nhưng chưa có GPU trace để định lượng phần này.

`src/components/LazySection.jsx` chỉ trì hoãn lần mount đầu tiên. Sau khi xuất hiện, observer disconnect và children luôn ở lại DOM. Điều này giải thích vì sao trang nặng hơn sau khi cuộn, dù đã có lazy-loading.

### 2. Slider ngoài màn hình vẫn cập nhật khi resize — đã quan sát hoạt động

Sau khi cuộn có 10 Swiper. Mẫu resize trang chủ ghi nhận khoảng 200 callback ResizeObserver và hơn 300 lần đọc kích thước. Swiper mặc định theo dõi kích thước container; `onResize` cập nhật size, slides, breakpoint và vị trí. Những slider ngoài viewport vẫn tham gia.

Không thấy callback MutationObserver trong mẫu này; chưa có bằng chứng để quy lỗi cho `observer/observeParents` hay vòng lặp observer.

Hàng quốc gia hiện debounce 150ms: trong lúc kéo, ảnh/bố cục tổng thể đổi trước, chiều rộng thẻ cập nhật sau khi dừng. Điều này có thể tạo cảm giác bắt kịp/chuyển bậc; đây là nhận định từ mã, chưa đo riêng mức đóng góp.

### 3. Hiệu ứng liên tục — đã xác nhận ảnh hưởng phụ

Badge Premium, tiêu đề neon, shadow và hiệu ứng background-position hoạt động ngay cả khi phần tử nằm ngoài màn hình. Các trang danh sách còn có 150 particle CSS. Chuyển particle khỏi JS đã giảm tải JavaScript, nhưng không xóa chi phí animation/compositing khi viewport đổi kích thước. Thử tắt nhóm hiệu ứng cải thiện frame ở trang danh sách nhưng không chữa được nút thắt DOM trang chủ.

### 4. Ảnh kích thước lớn — xác nhận tồn tại, chưa định lượng riêng

Trong DOM thực tế có ảnh **3840×2160** được dùng cho thumbnail rộng khoảng **105px** và thẻ rộng khoảng 329px. `getOptimizedUrl()` giữ nguyên URL `phimimg.com`, còn banner ở các nguồn hỗ trợ resize dùng 1920×1080 kể cả trên mobile. Ảnh lớn tăng chi phí decode, raster và bộ nhớ ảnh; ảnh lazy chỉ trì hoãn request, không làm giảm kích thước ảnh sau khi tải.

Không dùng tổng `naturalWidth × naturalHeight × 4` của mọi thẻ img để kết luận RAM tiêu thụ thực: nhiều thẻ chia sẻ ảnh và browser có cơ chế cache riêng.

### 5. Tải dữ liệu và đồng bộ nền — vấn đề phụ từ rà soát mã

- `GroqChatBot.jsx` đăng ký Movies, Authors, Actors, Characters, Categories, Comments, Reviews và Subscriptions ngay cả khi chat đang đóng.
- `UserProvider.jsx` nghe toàn collection Users; `SubscriptionProvider.jsx` và hook `useSubscriptions` dùng hai đường đăng ký riêng. Firebase SDK có thể chia sẻ kết nối/query ở tầng thấp, nhưng ứng dụng vẫn có callback/state riêng.
- `useCollections` mặc định đã chia sẻ cache/listener cho nhiều consumer cùng hook; không phải mỗi `useMovies` đều tạo một request collection độc lập.
- `LayoutClient.jsx` khởi động quét đồng bộ các phim chưa hoàn thành khi dữ liệu tải xong, rồi mỗi 30 phút. Khóa giới hạn nằm trên từng trình duyệt, không phải một lịch chạy tập trung. Service có thể đọc Episodes, gọi nguồn phim và ghi cập nhật; comment “không tốn lượt đọc Firestore” không đúng với mọi nhánh hiện tại.
- Nhánh PostgreSQL fallback của `useCollections` bỏ qua unsubscribe trả về khi đăng ký Firestore trong catch, nên có nguy cơ giữ callback sau unmount. Chỉ có ảnh hưởng khi bật flag và API lỗi; chưa chứng minh đang xảy ra trên online.

Các điểm này ảnh hưởng tải ban đầu hoặc gây render khi dữ liệu cập nhật. Chưa có bằng chứng chúng là nguyên nhân chính của resize; phép đo local đã tránh đợt auto-sync và vẫn tái hiện giật nặng.

## Hướng xử lý giữ giao diện và logic

1. Ưu tiên virtualize hàng quốc gia: chỉ dựng thẻ trong vùng nhìn thấy và một vùng đệm; giữ đủ danh sách, đúng thứ tự, tốc độ, vòng lặp, kéo thả, nút điều hướng và link phim. Không cắt danh sách để đổi nội dung.
2. Giữ chiều cao/vị trí các mục khi ở ngoài màn hình và ngừng công việc resize/animation không cần thiết. Cập nhật kích thước slider trước khi quay lại viewport. Tránh unmount tùy tiện làm mất vị trí carousel.
3. Chỉ cho hiệu ứng badge chạy khi thẻ xuất hiện; giữ hiệu ứng hiện tại khi nhìn thấy. Kiểm chứng cả pseudo-element và thẻ đang chạy vào vùng nhìn thấy.
4. Dùng ảnh thumb đúng kích thước từ nguồn/CDN hỗ trợ, thêm responsive image cho banner; không đổi proxy `phimimg.com` nếu chưa kiểm tra khả năng truy cập.
5. Tải dữ liệu chatbot theo nhu cầu và gom đăng ký collection chung; sửa cleanup fallback. Việc chuyển auto-sync sang backend/lịch tập trung cần kiểm tra luồng cập nhật tập riêng để bảo toàn logic.

Tiêu chí xác nhận bản sửa: chuỗi resize khi đứng đầu trang và ở hàng quốc gia; sau khi đã cuộn toàn trang; viewport mobile/desktop; không lệch chiều cao, khoảng trống, breakpoint, thứ tự phim, vòng lặp, nút/drag/link; đo lại Long Task và frame. Các CSS thử trong báo cáo chưa đạt những tiêu chí này và chưa được đưa vào code sản phẩm.

## Bản sửa đã thực hiện sau điều tra

- Virtualize vòng lặp quốc gia bằng cửa sổ thẻ: tối đa 9 thẻ/hàng gồm vùng đệm, giữ toàn danh sách trong bộ nhớ và ánh xạ modulo đúng thứ tự. Track chỉ rộng vài nghìn pixel thay vì hơn 100.000px. Không cắt danh sách phim.
- Kích thước vòng lặp tính bằng số phim × bước thẻ; bỏ đọc `scrollWidth`. Chu kỳ bao gồm đủ gap cuối, tránh sai lệch nửa gap ở điểm nối của bản cũ.
- Resize dùng kích thước từ ResizeObserver, gộp vào một requestAnimationFrame; giữ vị trí theo tỉ lệ bước thẻ và cập nhật cả vị trí button/drag đang chạy. Không còn chờ debounce 150ms.
- Cửa sổ chỉ thay thẻ khi đi qua ranh giới thẻ hoặc đổi số cột. Khi drag lớn hoặc đi qua điểm nối, chờ commit cửa sổ mới trước khi dịch track để tránh frame trống.
- Dùng wrapper Swiper cho 8 component trang chủ. Core resize của Swiper được gọi qua `observerUpdate` khi slider gần viewport; resize ngoài màn hình được ghi nhận và cập nhật khi quay lại. Giữ core breakpoint, loop, active slide và thumbs của Swiper; cleanup khi destroy/unmount.

### Đo trước/sau và xác nhận giao diện

Mẫu trước sửa chạy lại trên build `6dbceb6`: chuỗi resize 9.097ms, 28 Long Task tổng 4.884ms, frame tối đa 590ms. Mẫu sau sửa có virtualize và defer resize: 1.597ms, 5 Long Task tổng 287ms, frame tối đa 132ms. Tải bố cục đã giảm rõ rệt, nhưng vẫn có frame chậm; không cam kết 60fps trên mọi thiết bị.

Kiểm chứng build cuối sau khi memo cửa sổ theo số cột: 1.507ms, không có Long Task được ghi nhận trong mẫu, frame tối đa 125ms, P95 111ms. Mẫu cuối chạy trên origin mới để tránh Service Worker của build thử trước làm reload giữa phiên. Số liệu các lần thử có dao động, đặc biệt chi phí paint/compositor không nằm hoàn toàn trong Long Task.

Trang chủ sau khi cuộn đầy đủ giảm từ khoảng 22.500 phần tử xuống 4.395; thẻ quốc gia từ 820 xuống 32 ở desktop và 24 ở mobile. Track desktop từ 110.860–123.412px xuống 2.775px cho các hàng lớn. Animation đang chạy giảm từ 244 xuống khoảng 77 nhờ không dựng các badge ngoài cửa sổ.

Đối chiếu ở viewport 1400×850: slider width 1031,2px ở cả hai bản; chiều cao ba hàng lớn trước 329,98px, sau 330,01px (chênh 0,03px do ResizeObserver giữ phần thập phân thay vì clientWidth làm tròn). Ở mobile 390×850: một thẻ chính rộng 277,6px, cửa sổ 6 thẻ/hàng, không có vùng trống trong viewport.

Đã kiểm tra nút Next đổi sang phim kế tiếp, Previous, drag chuột, drag rất lớn qua nhiều vòng, touch drag bằng sự kiện trong bản test, link slug và resize qua breakpoint. Toàn bộ danh sách/thứ tự, danh sách nhỏ/rỗng, buffer phủ viewport, vị trí phân số khi resize và lifecycle resize ngoài màn hình có unit test. Build thành công; ESLint trên component/helper mới và FilmCountry pass; 48 kiểm thử hiện có/mới pass. Console runtime mẫu không có error/warning.

Phép đo chạy từng bản ở tab được viewport override tác động và xác nhận chiều rộng từ DOM. Không dùng mẫu đo trên tab không được resize. Runtime dữ liệu thật; ảnh/hiệu ứng và logic dữ liệu không bị tắt trong mẫu sau sửa. Các CSS ẩn nội dung dùng trong điều tra không được ship.
