# Khôi phục mật khẩu bằng mã email

Luồng: nhập email → mã gồm 6 chữ số → đặt mật khẩu mới → quay lại đăng nhập.
Máy chủ sinh mã ngẫu nhiên, lưu HMAC của mã và cấp một quyền đổi mật khẩu
ngẫu nhiên sau khi xác thực. Mã/quyền chỉ dùng một lần, hết hạn sau 5 phút kể
từ khi gửi. Nhập sai 5 lần sẽ khóa mã; gửi lại cách nhau tối thiểu 60 giây,
tối đa 5 lần/email/giờ và 10 lần/IP/15 phút. Gửi lại vô hiệu mã/quyền cũ.

## Cấu hình EmailJS

Thiết lập ngày 2026-10-17: chủ web chọn dùng chung mẫu
`template_c5ocp4e` của dịch vụ `service_wrbu7og` do tài khoản đã dùng hết hai
mẫu miễn phí. Nhánh thường giữ nguyên HTML, Subject và địa chỉ mặc định đã
được chủ web xác nhận; nhánh OTP gửi riêng đến `to_email`, không CC/BCC.
API dành cho ứng dụng máy chủ đã được bật, vẫn bắt buộc Private Key. Thư OTP
thử đã được EmailJS chấp nhận và chủ web xác nhận nhận được.

Các biến máy chủ đã được lưu dưới dạng Secret ở Vercel Production và trong
`.env.recovery.local` được Git bỏ qua. Việc thêm biến không tự triển khai mã
nguồn này lên website. Mã khôi phục từ bản local đã ghi được vào vùng Firestore
riêng. Chủ tài khoản đã tự nhập mã, đặt mật khẩu mới và xác nhận đổi mật khẩu
thành công ngày 2026-10-17. Email nhận thư thử không tự trở thành tài khoản MFilm.
Máy chủ kiểm tra tạm đã dừng và tệp Firebase ADC tạm đã được xóa sau khi xác minh.

Nếu chuyển sang mẫu riêng trong tương lai, cấu hình mẫu khôi phục mật khẩu:

- To Email: `{{to_email}}`
- Subject: `Mã khôi phục mật khẩu MFilm`
- From Name: `MFilm`
- Nội dung: dùng mẫu `docs/templates/password-reset-email.html`.
- Không đưa địa chỉ cố định vào To/CC/BCC và không dùng mẫu thông báo phim.

Nếu tài khoản đã dùng hết 2 mẫu của gói miễn phí, có thể dùng chung mẫu thông
báo sau khi chủ web chọn phương án này: bao nội dung cũ trong
`{{^mfilm_reset}}...{{/mfilm_reset}}`, nội dung OTP trong
`{{#mfilm_reset}}...{{/mfilm_reset}}`. Subject và To Email cũng cần hai nhánh
tương ứng; nhánh thường phải giữ nguyên Subject và người nhận gốc. API khôi
phục gửi `mfilm_reset: true`, email thông báo cũ không gửi biến này. Sao lưu
mẫu gốc và render kiểm tra cả hai nhánh cục bộ trước khi Save. Không thêm
CC/BCC hoặc auto-reply cho nhánh OTP. Không đổi mẫu chỉ bằng cách chèn mã
vào nội dung thông báo phim.

Kiểm tra Account → Security cho phép API từ ứng dụng không phải trình duyệt
(máy chủ Node). Dùng private key của EmailJS cho các yêu cầu máy chủ.
Không đổi cài đặt bắt buộc private key cho các email trình duyệt hiện có
nếu chưa chuyển các email đó lên máy chủ.

Đặt các biến **server-only**, không dùng tiền tố `VITE_`, trên Vercel Production:

```dotenv
EMAILJS_SERVICE_ID=service_wrbu7og
EMAILJS_PUBLIC_KEY=<public key của EmailJS hiện tại>
EMAILJS_PRIVATE_KEY=<private key của EmailJS>
EMAILJS_RESET_TEMPLATE_ID=template_c5ocp4e
PASSWORD_RESET_SECRET=<32 byte ngẫu nhiên, mã hóa base64>
PASSWORD_RECOVERY_ENABLED=true
```

Sinh `PASSWORD_RESET_SECRET` một lần bằng bộ sinh số ngẫu nhiên mật mã và
lưu dưới dạng biến môi trường bí mật; không ghi vào mã nguồn, log hoặc chat.
Firebase Admin sử dụng `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`,
`FIREBASE_PROJECT_ID` đã có. Redeploy sau khi thêm biến môi trường.
Chỉ bật sau khi mẫu gửi đến đúng `{{to_email}}` và không có người nhận phụ.
Không bật `SECURE_ACCOUNTS_ENABLED` như một phần của thiết lập này.

API trả `available: false` và giao diện báo đang thiết lập khi thiếu cấu hình;
không có mã thử cố định, không hiển thị mã trong trình duyệt, không gửi thư giả.
Kiểm thử thư thật cần một email thử do chủ web chỉ định và tự nhập mã nhận được.

## Lưu trữ và tương thích

Dữ liệu mã/quyền/rate limit nằm dưới `AccountRecovery/private/Challenges/*`
và `AccountRecovery/private/Limits/*`. Hai bộ quy tắc Firestore đều chặn truy
cập máy khách vào các đường dẫn này. Không chuyển các tài liệu này lên root:
bộ quy tắc legacy hiện cho phép đọc/ghi các tài liệu root. Firebase Admin
trên máy chủ không bị giới hạn bởi quy tắc máy khách.

Có thể cấu hình Firestore TTL cho trường `expiresAt` của collection groups
`Challenges` và `Limits` để dọn tài liệu cũ; việc hết hạn luôn được kiểm tra
bằng thời gian máy chủ, không phụ thuộc TTL đã xóa tài liệu hay chưa.
Hạn mức toàn cục giãn các yêu cầu email hơn 1 giây theo giới hạn EmailJS;
email thông báo cũ sử dụng cùng tài khoản vẫn có thể ảnh hưởng hạn mức này.

Chế độ tài khoản legacy: cập nhật mật khẩu Users theo cơ chế đăng nhập hiện
có, đồng thời thay digest AccountCredentials nếu có. Mật khẩu Firebase Auth
cũng được đổi và refresh token bị thu hồi. Không có tài khoản Firebase cũ
thì giữ cơ chế tạo tài khoản Firebase khi đăng nhập hiện tại. Tài khoản chỉ
dùng Google không được tự thêm mật khẩu qua luồng này.

Chế độ secure: ghi digest và bản mã với `ACCOUNT_ENCRYPTION_KEY`; không ghi
mật khẩu thuần vào Users. Đây không phải đợt chuyển đổi tài khoản/rules của
toàn ứng dụng; xem `account-security.md` cho kế hoạch đó.

Quyền đổi mật khẩu được tiêu thụ bằng transaction trước khi gọi Firebase.
Nếu gặp lỗi giữa hai hệ thống, giao diện không báo thành công, quyền cũ không
được dùng lại và người dùng cần xin mã mới. Không có transaction phân tán
giữa Firebase Auth và Firestore: khi chỉ một bên đã cập nhật, lần khôi phục
mới sẽ đồng bộ lại. Không tự đăng nhập sau khi đổi mật khẩu.

## Kiểm tra

```sh
node --test tests/passwordRecovery.test.js
npm run build
```

Các bài kiểm tra dùng cơ sở dữ liệu giả có transaction tuần tự, Firebase giả
và hộp thư giả; không thay mật khẩu hoặc gửi thư tới tài khoản thật.
Tài liệu EmailJS: https://www.emailjs.com/docs/rest-api/send/
