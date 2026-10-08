# MFILM AI: kiến thức và bộ nhớ dùng chung

## Luồng trả lời

1. Trình duyệt trả lời bằng kiến thức MFILM, phép tính hoặc dữ liệu phim hiện tại. Không gọi nhà cung cấp AI.
2. Câu hỏi còn lại được gửi đến `/api/ai/chat`. Máy chủ kiểm tra kiến thức rồi bộ nhớ dùng chung trong Firestore.
3. Nếu chưa biết, máy chủ gọi mô hình riêng khi đã cấu hình `MFILM_MODEL_URL`.
4. Nếu không có mô hình riêng hoặc dịch vụ đó lỗi, gọi Groq/Gemini hiện có.
5. Câu trả lời phù hợp được lưu vào bộ nhớ dùng chung. Lần hỏi lại chỉ đọc bộ nhớ, không gọi mô hình.

Đây là hệ thống truy xuất kiến thức và tích lũy câu trả lời. Nó **không huấn luyện trọng số của một mô hình nền**, không đảm bảo biết mọi câu hỏi và không tự xác minh rằng mọi câu trả lời của mô hình đều đúng. Mô hình hỗ trợ vẫn cần thiết cho câu mới hoặc ngữ cảnh phức tạp. Việc lưu đáp án giảm các lần gọi lặp lại.

## Bộ dữ liệu biên soạn

- `src/ai/knowledgeBase.js`: kiến thức MFILM ban đầu và điểm kết hợp các bộ hỏi đáp.
- `src/ai/extendedKnowledge.js`: 250 cặp hỏi đáp mới tự biên soạn, chia 10 nhóm, mỗi nhóm 25 chủ đề riêng.
- `data/ai/bo-cau-hoi-tra-loi.md`: danh sách đầy đủ 397 câu hỏi độc nhất kèm đáp án, đánh số để đọc và duyệt. Các cách viết bỏ dấu/thêm lời lịch sự không được tính vào số câu mới.
- `npm run ai:train`: kiểm tra từng biến thể, xuất `data/ai/mfilm-training.jsonl` và báo cáo. Lệnh thất bại nếu truy xuất sai hoặc có câu hỏi trùng nhưng đáp án khác.
- JSONL chứa mẫu hội thoại để sử dụng trong quy trình tinh chỉnh một mô hình riêng sau này. Lệnh trên chỉ biên soạn và đánh giá dữ liệu, không tải hay tinh chỉnh mô hình.
- Thay đổi chính sách quan trọng: tăng `KNOWLEDGE_VERSION` rồi chạy lại lệnh, để đáp án học theo bản cũ không được dùng lại.

## Bộ nhớ học tự động

Tất cả khách dùng chung đáp án của câu hỏi độc lập. Câu hỏi được chuẩn hóa dấu tiếng Việt, chữ hoa và dấu câu. Bộ nhớ học tự động chỉ khớp câu tương đương sau chuẩn hóa; không đoán dựa trên vài từ giống nhau.

- Kiến thức thông thường: hết hạn sau 90 ngày; thảo luận phim: 24 giờ.
- Câu chứa thông tin cá nhân, khóa API, mật khẩu, câu phụ thuộc hội thoại, tin tức hoặc thông tin biến động không đưa vào bộ nhớ chung.
- Dữ liệu phim và quyền xem luôn dựa trên danh mục/tài khoản hiện tại. Đáp án riêng của phiên này có thể được lưu cục bộ cùng mã kiểm tra danh mục, không chia sẻ quyền xem của tài khoản khác.
- Câu trả lời lỗi hoặc chứa dữ liệu nhạy cảm không được học. Hướng dẫn hệ thống và lịch sử do trình duyệt gửi không được dùng để tạo đáp án chung.
- Bộ lọc là biện pháp giảm rủi ro, không phải bộ kiểm chứng sự thật. Bấm **Quên câu trả lời** để bỏ bản học sai. Lịch sử chat vẫn giữ nguyên nội dung đã trao đổi.
- Bộ nhớ chung được đọc lại trên mỗi lượt hỏi để việc xóa có hiệu lực giữa các phiên. Bản cục bộ chỉ làm dự phòng khi máy chủ không trả lời được; bản trên máy khác không thể bị xóa từ xa khi thiết bị đó mất mạng.

Firestore lưu tại `AIAnswerMemory`. Nội dung được mã hóa AES-256-GCM và xác thực trước khi đọc; ID tài liệu dùng HMAC. Không lưu khóa mã hóa trong trình duyệt. Thời hạn được kiểm tra khi đọc; các tài liệu hết hạn chưa tự xóa vật lý. Có thể cấu hình quy trình dọn dữ liệu riêng nếu dung lượng tăng.

Khuyến nghị đặt `AI_MEMORY_SECRET` là một bí mật ngẫu nhiên ổn định trên máy chủ. Khi chưa đặt, hệ thống lấy vật liệu bí mật từ `FIREBASE_PRIVATE_KEY` hoặc khóa Groq/Gemini **không có tiền tố VITE** đang cấu hình. Đổi bí mật khiến bộ nhớ cũ không đọc được; không làm gián đoạn trả lời mới. Nếu máy chủ chỉ có khóa `VITE_*`, bộ nhớ chung không bật cho đến khi có bí mật phía máy chủ.

Quy tắc Firestore hiện tại của dự án cho phép truy cập các collection gốc. Mã hóa ngăn đọc và sửa nội dung đáp án hợp lệ, nhưng không ngăn người khác xóa tài liệu hoặc gây tải. Hệ thống này không thay thế việc siết quyền cho toàn bộ database. Khi chuyển sang quy tắc chặt hơn, collection bộ nhớ cần được truy cập qua thông tin xác thực máy chủ phù hợp.

## Mô hình riêng (tùy chọn)

Đặt biến môi trường trên máy chủ:

```dotenv
MFILM_MODEL_URL=https://your-model-host.example/v1
MFILM_MODEL_NAME=your-model-name
MFILM_MODEL_KEY=optional-server-only-token
AI_MEMORY_SECRET=stable-random-server-secret
```

Dịch vụ phải có API tương thích OpenAI tại `chat/completions`. URL trên là ví dụ, không phải dịch vụ được cài sẵn. Cần máy chủ chạy mô hình và đủ tài nguyên trước khi cấu hình. Không đặt bí mật với tiền tố `VITE_`. Khi dịch vụ riêng lỗi hoặc chậm quá thời hạn, hệ thống chuyển sang nhà cung cấp đang có.

## Kiểm tra

```powershell
npm run ai:train
node --test src/ai/*.test.js server/ai/*.test.js src/components/client/chatBot/localCatalogAnswer.test.js api/ai/chat.test.js
npm run build
```

Các kiểm thử bao gồm trả lời không có mạng/API key, câu hỏi mới học lại trên phiên khác, chống dùng dữ liệu riêng trong đáp án chung, hết hạn, giả mạo ciphertext, quyền xóa, ngữ cảnh phim và dự phòng khi nguồn AI/lưu trữ lỗi.
