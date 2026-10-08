// Authored facts and practical answers. Every line is one distinct question/answer.
// Conversational spelling variants are generated separately and never count as new topics.
const group = (key, title, rows) => rows.trim().split('\n').map((row, index) => {
    const [question, answer, ...extra] = row.split('|');
    if (!question?.trim() || !answer?.trim() || extra.length) throw new Error(`Invalid knowledge row: ${key}-${index + 1}`);
    return { id: `large-${key}-${index + 1}`, questions: [question.trim()], answer: answer.trim(), tags: [title] };
});

export const largeKnowledge = [
    ...group('shots', 'Cỡ cảnh và góc quay', `
Close-up nghĩa là gì?|Cảnh cận, nhấn vào khuôn mặt hoặc một chi tiết.
Extreme close-up là gì?|Cảnh đặc tả một vùng nhỏ như mắt hay bàn tay.
Medium shot là gì?|Cảnh trung, thường lấy nhân vật từ khoảng eo trở lên.
Full shot là gì?|Cảnh lấy toàn thân nhân vật trong khung hình.
Wide shot là gì?|Cảnh rộng, cho thấy chủ thể cùng không gian xung quanh.
Extreme wide shot là gì?|Cảnh rất rộng, nhấn mạnh bối cảnh hơn kích thước nhân vật.
Establishing shot là gì?|Cảnh giới thiệu nơi diễn ra hành động hoặc quan hệ không gian.
Two-shot là gì?|Khung hình có hai nhân vật, thường làm rõ tương tác.
Three-shot là gì?|Khung hình chứa ba nhân vật trong cùng một cảnh quay.
Over-the-shoulder shot là gì?|Quay qua vai một người để nhìn người hoặc vật phía trước.
POV shot là gì?|Cảnh mô phỏng điều nhân vật đang nhìn thấy.
Eye-level shot là gì?|Máy quay đặt gần ngang tầm mắt chủ thể.
Low-angle shot là gì?|Máy quay nhìn lên chủ thể từ vị trí thấp.
High-angle shot là gì?|Máy quay nhìn xuống chủ thể từ vị trí cao.
Bird's-eye view trong phim là gì?|Góc nhìn gần thẳng từ trên xuống để thấy bố cục không gian.
Worm's-eye view là gì?|Góc nhìn rất thấp hướng lên, làm nổi bật độ cao.
Dutch angle là gì?|Khung hình nghiêng đường chân trời, có thể tạo cảm giác bất ổn.
Insert shot là gì?|Cảnh chèn nhấn vào chi tiết như thư, đồng hồ hoặc vật dụng.
Reaction shot là gì?|Cảnh cho thấy phản ứng của nhân vật trước một sự kiện.
Cutaway shot là gì?|Cảnh chuyển tạm khỏi hành động chính sang chi tiết liên quan.
Master shot là gì?|Cảnh bao quát hành động chính, làm nền cho các cảnh cắt thêm.
Profile shot là gì?|Góc quay nhìn nhân vật từ bên hông.
Back shot là gì?|Cảnh nhìn nhân vật từ phía sau lưng.
Cowboy shot là gì?|Khung hình thường lấy từ khoảng giữa đùi trở lên.
Group shot là gì?|Cảnh đặt nhiều nhân vật trong cùng khung hình.
`),
    ...group('camera', 'Chuyển động máy quay', `
Pan trong quay phim là gì?|Xoay hướng máy sang trái hoặc phải từ một vị trí.
Tilt trong quay phim là gì?|Xoay hướng máy lên hoặc xuống từ một vị trí.
Dolly shot là gì?|Máy quay di chuyển tiến, lùi hoặc ngang bằng hệ đỡ.
Tracking shot là gì?|Máy quay di chuyển theo hành động hoặc chủ thể.
Truck shot là gì?|Máy quay dịch sang bên, thường giữ hướng nhìn tương đối ổn định.
Pedestal movement là gì?|Nâng hoặc hạ cả máy quay, khác với chỉ nghiêng máy.
Crane shot là gì?|Cảnh dùng cần cẩu để đưa máy lên cao hoặc di chuyển rộng.
Handheld shot là gì?|Máy quay được cầm tay, thường có chuyển động nhỏ tự nhiên.
Steadicam dùng làm gì?|Hệ ổn định giúp quay khi di chuyển mà giảm rung.
Gimbal máy quay là gì?|Bộ giữ ổn định bằng các trục để hạn chế rung khi quay.
Zoom shot là gì?|Thay đổi tiêu cự để đổi độ lớn chủ thể trong khung.
Dolly zoom là gì?|Di chuyển máy đồng thời đổi zoom để biến đổi cảm giác hậu cảnh.
Whip pan là gì?|Đảo máy ngang rất nhanh, thường tạo hình ảnh nhòe chuyển động.
Orbit shot là gì?|Máy quay di chuyển quanh chủ thể theo một cung hoặc vòng.
Push-in là gì?|Máy tiến gần chủ thể để tăng chú ý hoặc cảm xúc.
Pull-out là gì?|Máy lùi ra để mở rộng bối cảnh quanh chủ thể.
Locked-off shot là gì?|Cảnh có máy giữ cố định, không chủ động dịch chuyển.
Rack focus là gì?|Đổi điểm nét giữa các chủ thể trong cùng cảnh.
Follow focus dùng làm gì?|Điều khiển nét theo chủ thể khi khoảng cách thay đổi.
Focus puller làm gì?|Giữ hoặc chuyển nét theo yêu cầu trong quá trình quay.
Camera blocking là gì?|Sắp vị trí và chuyển động máy tương ứng với hành động diễn viên.
Tripod giúp ích gì khi quay?|Giữ máy ổn định và hỗ trợ điều khiển góc quay.
Slider máy quay dùng làm gì?|Cho máy trượt trên đường ngắn để tạo chuyển động mượt.
Drone shot thường thể hiện gì?|Cho thấy cảnh từ trên cao hoặc chuyển động qua không gian rộng.
Máy quay rung có luôn là lỗi không?|Không; đôi khi đó là lựa chọn để tạo cảm giác trực tiếp hoặc căng thẳng.
`),
    ...group('light', 'Ánh sáng và ống kính', `
Key light là gì?|Nguồn sáng chính định hình độ sáng và hình khối chủ thể.
Fill light là gì?|Nguồn sáng bổ sung để giảm độ tối của vùng bóng.
Backlight trong quay phim là gì?|Ánh sáng từ phía sau giúp tách chủ thể khỏi nền.
Rim light là gì?|Ánh sáng tạo viền sáng quanh rìa chủ thể.
Practical light là gì?|Nguồn sáng xuất hiện trong cảnh, như đèn bàn hoặc nến.
Motivated lighting là gì?|Ánh sáng được bố trí như có nguồn hợp lý trong bối cảnh.
High-key lighting là gì?|Ánh sáng nhìn chung sáng, ít tương phản bóng tối mạnh.
Low-key lighting là gì?|Ánh sáng dùng nhiều bóng tối và tương phản để tạo không khí.
Soft light là gì?|Ánh sáng tạo ranh giới bóng mềm và chuyển sắc nhẹ.
Hard light là gì?|Ánh sáng tạo bóng có ranh giới rõ, tương phản mạnh.
Bounce light là gì?|Ánh sáng phản xạ từ bề mặt thay vì chiếu thẳng chủ thể.
Diffuser ánh sáng dùng làm gì?|Tán nguồn sáng để bóng đổ mềm hơn.
Negative fill là gì?|Dùng bề mặt tối giảm ánh sáng phản xạ vào chủ thể.
White balance là gì?|Cân màu để vật trung tính hiển thị phù hợp với nguồn sáng.
Color temperature là gì?|Thông số mô tả sắc ánh sáng, thường tính bằng kelvin.
Exposure trong quay phim là gì?|Mức ánh sáng được ghi nhận, ảnh hưởng độ sáng hình ảnh.
Aperture là gì?|Khẩu độ của ống kính điều chỉnh lượng ánh sáng đi qua.
Depth of field là gì?|Khoảng không gian trông đủ nét trước và sau điểm lấy nét.
Bokeh là gì?|Hình thức và cảm giác của vùng ảnh ngoài nét.
Focal length là gì?|Tiêu cự ảnh hưởng góc nhìn và độ lớn chủ thể trong ảnh.
Wide-angle lens là gì?|Ống kính có góc nhìn rộng, hữu ích khi cần thấy nhiều bối cảnh.
Telephoto lens là gì?|Ống kính tiêu cự dài, cho góc nhìn hẹp hơn.
Prime lens là gì?|Ống kính có tiêu cự cố định.
Zoom lens là gì?|Ống kính cho phép thay đổi tiêu cự.
Lens flare là gì?|Vệt hoặc đốm sáng do ánh sáng tương tác trong hệ quang học.
`),
    ...group('edit', 'Kỹ thuật dựng phim', `
Jump cut là gì?|Cắt giữa các hình gần giống khiến hành động có cảm giác nhảy.
Match cut là gì?|Nối hai cảnh bằng sự tương đồng hình ảnh hoặc hành động.
J-cut là gì?|Âm thanh cảnh sau xuất hiện trước hình ảnh của cảnh đó.
L-cut là gì?|Âm thanh cảnh trước tiếp tục khi hình đã chuyển sang cảnh sau.
Cross-cutting là gì?|Luân phiên giữa các tuyến hành động để liên hệ chúng.
Parallel editing là gì?|Dựng xen các tuyến để so sánh hoặc gợi quan hệ giữa chúng.
Montage trong dựng phim là gì?|Chuỗi cảnh được ghép để cô đọng thời gian hoặc xây ý nghĩa.
Continuity editing là gì?|Dựng giúp hành động và không gian có cảm giác liền mạch.
Elliptical editing là gì?|Bỏ qua một phần thời gian hay hành động vẫn để người xem suy ra.
Smash cut là gì?|Chuyển cảnh đột ngột tạo tương phản hoặc bất ngờ.
Hard cut là gì?|Chuyển trực tiếp từ hình này sang hình khác.
Dissolve là gì?|Một hình dần biến mất đồng thời hình khác hiện lên.
Fade-in là gì?|Hình ảnh dần xuất hiện từ một nền, thường là màu đen.
Fade-out là gì?|Hình ảnh dần biến mất vào một nền.
Wipe transition là gì?|Hình mới thay hình cũ theo một đường hoặc hình chuyển động.
Iris transition là gì?|Chuyển cảnh bằng vùng hình tròn mở rộng hoặc thu hẹp.
Freeze frame là gì?|Giữ một khung hình đứng yên trong một khoảng thời gian.
Speed ramp là gì?|Thay đổi tốc độ trong một đoạn để điều khiển nhịp chuyển động.
Slow motion là gì?|Phát chuyển động chậm hơn tốc độ thực hoặc tốc độ ghi tương ứng.
Time-lapse là gì?|Chuỗi hình ghi cách quãng được phát để thấy biến đổi nhanh hơn.
Split screen là gì?|Chia khung hình để đồng thời hiển thị nhiều hình hoặc hành động.
Rough cut là gì?|Bản dựng sơ bộ trước khi tinh chỉnh chi tiết.
Fine cut là gì?|Bản dựng đã được chỉnh nhịp và chi tiết kỹ hơn.
Picture lock là gì?|Mốc chốt bản dựng hình để chuyển sang các công đoạn tiếp theo.
Offline editing là gì?|Dựng bằng bản media làm việc, thường nhẹ hơn nguồn gốc.
`),
    ...group('sound', 'Âm thanh điện ảnh', `
Diegetic sound là gì?|Âm thanh thuộc thế giới câu chuyện mà nhân vật có thể nghe.
Non-diegetic sound là gì?|Âm thanh dành cho người xem, như một số nhạc nền ngoài cảnh.
Foley là gì?|Tạo lại tiếng hành động, như bước chân, để bổ sung âm thanh phim.
ADR trong phim là gì?|Thu lại lời thoại sau quay để thay hoặc bổ sung tiếng gốc.
Room tone là gì?|Âm nền đặc trưng của không gian, dùng nối tiếng tự nhiên.
Ambience trong âm thanh là gì?|Lớp âm môi trường tạo cảm giác nơi diễn ra câu chuyện.
Sound bridge là gì?|Âm thanh nối qua ranh giới hai cảnh để liên kết chúng.
Sound motif là gì?|Yếu tố âm thanh lặp lại mang ý nghĩa trong tác phẩm.
Leitmotif âm nhạc là gì?|Chủ đề nhạc gắn với một nhân vật, nơi chốn hoặc ý tưởng.
Underscore là gì?|Nhạc nền hỗ trợ cảnh mà thường không phải phần trình diễn trong cảnh.
Stinger âm nhạc là gì?|Đoạn nhạc hoặc âm ngắn nhấn một khoảnh khắc.
Soundscape là gì?|Tổng thể lớp âm tạo nên không gian nghe của một cảnh.
Boom microphone dùng làm gì?|Thu tiếng gần diễn viên từ vị trí thường nằm ngoài khung hình.
Lavalier microphone là gì?|Micro nhỏ gắn gần người nói để thu lời thoại.
Wild track là gì?|Âm thanh thu riêng ngoài một lượt quay hình đồng bộ.
Clipping âm thanh là gì?|Tín hiệu vượt mức xử lý, gây méo ở các đỉnh âm.
Dynamic range âm thanh là gì?|Khoảng chênh giữa mức âm nhỏ và lớn có thể biểu đạt.
Compression âm thanh dùng làm gì?|Giảm chênh lệch mức âm theo thiết lập, khác với nén dung lượng tệp.
Equalizer là gì?|Điều chỉnh mức âm theo các vùng tần số.
Reverb là gì?|Âm phản xạ kéo dài tạo cảm giác không gian.
Echo khác reverb ở đâu?|Echo thường nghe thành tiếng lặp tách biệt; reverb hòa thành đuôi âm.
Mono audio là gì?|Âm thanh dùng một kênh, khác hệ nhiều kênh.
Center channel thường dùng cho gì?|Trong nhiều bản trộn phim, kênh giữa chứa phần lớn lời thoại.
LFE channel là gì?|Kênh dành cho hiệu ứng tần số thấp trong hệ âm đa kênh.
Audio description là gì?|Lời mô tả bổ sung hình ảnh cho người cần hỗ trợ tiếp cận.
`),
    ...group('script', 'Kịch bản và cấu trúc', `
Logline là gì?|Một câu ngắn nêu nhân vật, mục tiêu và xung đột trung tâm.
Synopsis là gì?|Bản tóm tắt nội dung chính, có thể tiết lộ kết thúc.
Treatment kịch bản là gì?|Bản trình bày câu chuyện bằng văn xuôi trước hoặc bên cạnh kịch bản.
Beat sheet là gì?|Danh sách các nhịp hoặc bước quan trọng của câu chuyện.
Scene heading là gì?|Dòng kịch bản ghi nơi và thời điểm diễn ra cảnh.
INT trong kịch bản nghĩa là gì?|Viết tắt chỉ cảnh nội thất, diễn ra bên trong.
EXT trong kịch bản nghĩa là gì?|Viết tắt chỉ cảnh ngoại thất, diễn ra bên ngoài.
Action line là gì?|Phần mô tả hành động hoặc điều nhìn, nghe được trong cảnh.
Parenthetical trong thoại là gì?|Ghi chú ngắn cạnh lời thoại để làm rõ cách nói hoặc hành động.
Cold open là gì?|Đoạn mở trước phần giới thiệu hoặc tiêu đề chính.
Inciting incident là gì?|Sự kiện khởi động xung đột chính và thay đổi tình thế nhân vật.
Exposition là gì?|Thông tin nền giúp hiểu nhân vật, bối cảnh hoặc tình huống.
Rising action là gì?|Chuỗi diễn biến làm xung đột và áp lực tăng lên.
Climax trong cốt truyện là gì?|Điểm xung đột đạt cao trào hoặc quyết định bước ngoặt quan trọng.
Falling action là gì?|Các diễn biến sau cao trào dẫn tới kết thúc.
Denouement là gì?|Phần tháo gỡ hoặc trình bày trạng thái sau xung đột chính.
Midpoint trong cấu trúc phim là gì?|Mốc giữa câu chuyện thường làm thay đổi hướng hoặc mức cược.
Set-up trong kịch bản là gì?|Đặt thông tin hoặc tình huống để có tác dụng về sau.
Payoff trong kịch bản là gì?|Kết quả hoặc sự đáp lại một chi tiết đã được chuẩn bị trước.
Plant trong kể chuyện là gì?|Chi tiết được cài sớm để người xem có thể hiểu diễn biến sau.
Story beat là gì?|Một thay đổi nhỏ có ý nghĩa trong hành động, thông tin hoặc cảm xúc.
Three-act structure là gì?|Cách tổ chức theo mở tình huống, phát triển xung đột và giải quyết.
B-plot là gì?|Tuyến truyện phụ chạy bên cạnh tuyến chính.
Bottle episode là gì?|Tập thường tập trung ở ít bối cảnh và nhân vật để kể chuyện cô đọng.
Table read là gì?|Đọc kịch bản cùng diễn viên để nghe nhịp và kiểm tra thoại.
`),
    ...group('narrative', 'Thời gian và điểm nhìn', `
Flashforward là gì?|Cho thấy sự kiện ở thời điểm sau so với mạch đang kể.
In medias res là gì?|Mở câu chuyện ngay giữa hành động thay vì kể từ đầu.
Frame narrative là gì?|Một câu chuyện bao lấy hoặc dẫn vào câu chuyện khác.
Story within a story là gì?|Một câu chuyện được kể bên trong câu chuyện chính.
Dramatic irony là gì?|Người xem biết điều quan trọng mà nhân vật chưa biết.
Verbal irony là gì?|Lời nói có ý nghĩa khác hoặc đối lập với nghĩa bề mặt.
Situational irony là gì?|Kết quả xảy ra trái với điều được kỳ vọng từ tình huống.
Red herring là gì?|Chi tiết dẫn chú ý sang hướng sai để trì hoãn lời giải.
MacGuffin là gì?|Vật hoặc mục tiêu thúc đẩy hành động dù bản thân có thể ít quan trọng.
Chekhov's gun là gì?|Nguyên tắc nhắc rằng chi tiết nổi bật nên có vai trò trong câu chuyện.
Deus ex machina là gì?|Giải pháp xuất hiện bất ngờ, ít được chuẩn bị để tháo gỡ khó khăn.
Unreliable memory trong phim là gì?|Hồi ức được trình bày có thể sai, thiếu hoặc bị ảnh hưởng chủ quan.
Multiple timelines là gì?|Câu chuyện theo dõi các chuỗi thời gian khác nhau.
Time loop là gì?|Tình huống nhân vật hoặc sự kiện lặp lại một khoảng thời gian.
Time jump là gì?|Bỏ qua một khoảng thời gian để chuyển sang mốc khác.
Real-time storytelling là gì?|Kể với thời gian diễn biến gần tương ứng thời gian xem.
Omniscient narrator là gì?|Người kể có khả năng biết thông tin vượt ngoài một nhân vật.
Limited perspective là gì?|Thông tin câu chuyện bị giới hạn theo một điểm nhìn.
First-person narration là gì?|Kể qua lời hoặc trải nghiệm của người xưng tôi.
Objective narration là gì?|Trình bày điều quan sát được, hạn chế nói trực tiếp suy nghĩ bên trong.
Stream of consciousness là gì?|Diễn tả dòng suy nghĩ và liên tưởng của nhân vật.
Metafiction là gì?|Tác phẩm tự ý thức hoặc bình luận về việc kể chuyện của mình.
Breaking the fourth wall là gì?|Nhân vật trực tiếp thừa nhận hoặc giao tiếp với khán giả.
Circular narrative là gì?|Cấu trúc kết thúc trở lại hình ảnh, tình huống hoặc ý tưởng mở đầu.
Episodic narrative là gì?|Chuỗi phần tương đối riêng, liên kết bằng nhân vật hoặc chủ đề.
`),
    ...group('characters', 'Vai trò và quan hệ nhân vật', `
Protagonist là gì?|Nhân vật trung tâm của hành động hoặc góc nhìn câu chuyện.
Antagonist là gì?|Nhân vật hoặc lực cản đối đầu mục tiêu của nhân vật chính.
Deuteragonist là gì?|Nhân vật có vai trò quan trọng thứ hai trong câu chuyện.
Foil character là gì?|Nhân vật tương phản giúp làm rõ đặc điểm một nhân vật khác.
Confidant character là gì?|Người được nhân vật chia sẻ suy nghĩ hoặc bí mật.
Mentor trong phim là gì?|Nhân vật hướng dẫn hoặc giúp người khác trưởng thành.
Sidekick là gì?|Người đồng hành hỗ trợ nhân vật chính.
Comic relief là gì?|Nhân vật hoặc khoảnh khắc hài giúp giảm căng thẳng.
Ensemble cast là gì?|Dàn nhân vật cùng giữ vai trò đáng kể thay vì chỉ một trung tâm.
Flat character là gì?|Nhân vật có ít chiều nét tính cách hoặc ít được khai triển.
Round character là gì?|Nhân vật có tính cách nhiều chiều và sự phức tạp.
Static character là gì?|Nhân vật không thay đổi đáng kể về bản chất qua câu chuyện.
Dynamic character là gì?|Nhân vật thay đổi đáng kể bởi các trải nghiệm.
Character motivation là gì?|Lý do thúc đẩy nhân vật lựa chọn hoặc hành động.
Character flaw là gì?|Điểm yếu của nhân vật có thể gây xung đột hoặc sai lầm.
Internal conflict là gì?|Mâu thuẫn trong suy nghĩ, giá trị hoặc cảm xúc nhân vật.
External conflict là gì?|Mâu thuẫn giữa nhân vật và người, hoàn cảnh hoặc lực bên ngoài.
Character want là gì?|Điều nhân vật chủ động mong đạt được.
Character need là gì?|Điều nhân vật cần hiểu hoặc thay đổi để trưởng thành.
Positive character arc là gì?|Hành trình nhân vật thay đổi theo hướng tiến bộ.
Negative character arc là gì?|Hành trình nhân vật suy thoái hoặc củng cố niềm tin gây hại.
Character backstory là gì?|Những trải nghiệm trước mạch chính ảnh hưởng nhân vật hiện tại.
Character agency là gì?|Khả năng lựa chọn và tác động của nhân vật lên diễn biến.
Anti-villain là gì?|Nhân vật đối lập có động cơ hoặc phẩm chất dễ cảm thông.
Unlikely alliance là gì?|Liên minh giữa những người vốn khó hợp tác với nhau.
`),
    ...group('acting', 'Diễn xuất và ngôn ngữ cơ thể', `
Subtext trong diễn xuất là gì?|Ý định hoặc cảm xúc nằm dưới nghĩa trực tiếp của lời thoại.
Blocking diễn viên là gì?|Sắp vị trí và chuyển động diễn viên trong cảnh.
Mark trên sàn quay là gì?|Dấu chỉ nơi diễn viên hoặc thiết bị cần đứng.
Eyeline trong diễn xuất là gì?|Hướng mắt nhân vật nhìn, giúp xác lập quan hệ không gian.
Improvisation trong diễn xuất là gì?|Ứng biến lời hoặc hành động thay vì làm hoàn toàn theo phần chuẩn bị.
Rehearsal là gì?|Diễn tập để chuẩn bị hành động, nhịp và phối hợp.
Screen test là gì?|Thử diễn trước máy để đánh giá sự phù hợp với vai.
Audition là gì?|Buổi thử vai để tuyển diễn viên.
Callback trong tuyển vai là gì?|Mời ứng viên trở lại thử thêm sau vòng đầu.
Chemistry read là gì?|Thử diễn cùng để đánh giá sự tương tác giữa các diễn viên.
Underplaying là gì?|Diễn tiết chế, giảm biểu hiện rõ ra ngoài.
Overacting là gì?|Diễn quá nhấn mạnh so với yêu cầu hoặc phong cách cảnh.
Method acting có nghĩa gì?|Nhóm cách diễn tìm cảm xúc và trải nghiệm để xây vai từ bên trong.
Character objective trong một cảnh là gì?|Điều nhân vật muốn đạt được ngay trong cảnh đó.
Acting beat là gì?|Một nhịp thay đổi ý định, hành động hoặc cảm xúc khi diễn.
Continuity diễn xuất cần giữ gì?|Giữ động tác, vị trí và trạng thái phù hợp giữa các lượt quay.
Body double là gì?|Người thay diễn viên cho phần hình cơ thể hoặc góc quay phù hợp.
Stand-in là gì?|Người đứng thay để chuẩn bị ánh sáng và bố trí trước lượt diễn.
Extra trong phim là gì?|Diễn viên quần chúng góp phần tạo bối cảnh.
Stunt performer là gì?|Người thực hiện các hành động nguy hiểm hoặc kỹ thuật chuyên biệt.
Voice actor là gì?|Diễn viên thể hiện nhân vật hoặc nội dung bằng giọng nói.
Motion-capture performer là gì?|Người diễn để chuyển động được ghi và áp dụng lên nhân vật số.
Silent reaction có quan trọng không?|Có; nét mặt và cử chỉ có thể truyền đạt ý nghĩa mà không cần thoại.
Diễn viên nhìn thẳng máy có luôn là lỗi không?|Không; phim có thể chủ ý tạo giao tiếp trực tiếp hoặc điểm nhìn đặc biệt.
Diễn tự nhiên có nghĩa không cần chuẩn bị không?|Không; biểu hiện tự nhiên vẫn có thể cần tập luyện và nghiên cứu vai.
`),
    ...group('production', 'Tổ chức sản xuất phim', `
Pre-production là gì?|Giai đoạn chuẩn bị trước quay, gồm kịch bản, tuyển vai và kế hoạch.
Principal photography là gì?|Giai đoạn quay chính với các cảnh thuộc tác phẩm.
Post-production là gì?|Giai đoạn dựng, âm thanh, hiệu ứng và hoàn thiện sau quay.
Call sheet là gì?|Tờ thông tin lịch, địa điểm và người cần có mặt trong ngày quay.
Shot list là gì?|Danh sách cảnh quay cần thực hiện và các thông tin liên quan.
Storyboard là gì?|Chuỗi hình phác giúp hình dung cách kể bằng khung hình.
Animatic là gì?|Bản thử nhịp từ hình storyboard, có thể kèm tiếng.
Location scouting là gì?|Khảo sát địa điểm phù hợp nhu cầu quay.
Location manager làm gì?|Điều phối địa điểm quay và những vấn đề vận hành liên quan.
Line producer làm gì?|Quản lý các mặt vận hành, ngân sách và lịch sản xuất.
Production manager làm gì?|Điều phối nguồn lực và tổ chức công việc sản xuất.
Assistant director làm gì?|Hỗ trợ điều phối lịch, hoạt động đoàn và tiến độ trường quay.
Script supervisor làm gì?|Theo dõi tính liên tục và ghi chép các lượt quay.
Gaffer làm gì?|Phụ trách triển khai ánh sáng trong đoàn quay.
Key grip làm gì?|Điều phối đội hỗ trợ thiết bị dựng, đỡ và định hình ánh sáng.
DIT trong đoàn quay là gì?|Hỗ trợ quy trình hình ảnh số, giám sát kỹ thuật và quản lý liên quan.
Dailies là gì?|Tư liệu quay được xem lại theo ngày để đánh giá công việc.
Take trong quay phim là gì?|Một lần ghi lại cảnh hoặc hành động cần quay.
Retake là gì?|Quay lại để có thêm một lượt thực hiện.
Pickup shot là gì?|Cảnh bổ sung hoặc chi tiết quay thêm để hoàn thiện bản dựng.
Reshoot là gì?|Quay lại một phần đã quay vì cần thay đổi hoặc sửa vấn đề.
Clapperboard dùng làm gì?|Đánh dấu cảnh, lượt quay và hỗ trợ đồng bộ hình với tiếng.
Wrap trong đoàn phim nghĩa là gì?|Thông báo hoàn thành phần quay của một người, ngày hoặc dự án.
Behind the scenes là gì?|Tư liệu cho thấy quá trình làm phim phía sau tác phẩm.
Press kit của phim là gì?|Bộ thông tin và tư liệu phục vụ giới thiệu phim với báo chí.
`),
    ...group('design', 'Mỹ thuật và trang phục', `
Production design là gì?|Thiết kế tổng thể không gian và diện mạo thế giới trong phim.
Art director làm gì?|Điều phối thực hiện các yếu tố mỹ thuật theo định hướng thiết kế.
Set design là gì?|Thiết kế bối cảnh để phục vụ hình ảnh và hành động.
Set dressing là gì?|Bố trí đồ vật trang trí để bối cảnh có đời sống.
Prop trong phim là gì?|Đạo cụ được dùng hoặc xuất hiện trong cảnh.
Hero prop là gì?|Đạo cụ quan trọng được chuẩn bị kỹ cho cảnh nổi bật.
Costume design là gì?|Thiết kế trang phục phù hợp nhân vật, thời kỳ và câu chuyện.
Wardrobe continuity là gì?|Giữ trang phục nhất quán giữa những cảnh cần liền mạch.
Makeup artist làm gì?|Tạo diện mạo nhân vật bằng trang điểm theo yêu cầu cảnh.
Prosthetic makeup là gì?|Trang điểm dùng bộ phận tạo hình gắn lên người diễn.
Practical set là gì?|Bối cảnh vật lý được xây hoặc bố trí để quay trực tiếp.
Miniature set là gì?|Bối cảnh mô hình thu nhỏ được quay để tạo hình ảnh cần thiết.
Matte painting là gì?|Hình nền được tạo hoặc vẽ để mở rộng môi trường trong cảnh.
Green screen dùng làm gì?|Tạo nền màu dễ tách để thay bằng hình ảnh khác.
Blue screen khác green screen thế nào?|Dùng nền xanh lam; lựa chọn tùy màu chủ thể và điều kiện quay.
Chroma key là gì?|Tách vùng theo màu để ghép hình với nền khác.
Set extension là gì?|Mở rộng bối cảnh quay bằng hiệu ứng hoặc hình ảnh bổ sung.
Color palette của phim là gì?|Tập màu chủ đạo giúp thống nhất cảm giác hình ảnh.
Visual texture là gì?|Cảm giác bề mặt hình ảnh tạo từ vật liệu, ánh sáng và chi tiết.
Period detail là gì?|Chi tiết phù hợp thời kỳ như đồ dùng, trang phục và kiến trúc.
Anachronism trong phim là gì?|Chi tiết thuộc thời đại khác xuất hiện trong bối cảnh đang kể.
Weathering đạo cụ là gì?|Làm vật trông cũ, mòn hoặc đã được sử dụng.
Continuity photo dùng làm gì?|Ảnh tham chiếu giúp tái tạo bố trí, trang phục và trạng thái cảnh.
Location và studio set khác nhau thế nào?|Location là địa điểm quay; studio set là bối cảnh dựng trong trường quay.
Màu trang phục có thể kể chuyện không?|Có; sự lặp hoặc đổi màu có thể hỗ trợ nhận diện và biến chuyển nhân vật.
`),
    ...group('animation', 'Kỹ thuật hoạt hình', `
Keyframe trong hoạt hình là gì?|Khung chính xác định tư thế hoặc trạng thái quan trọng.
Inbetween trong hoạt hình là gì?|Khung trung gian nối chuyển động giữa các khung chính.
Tweening là gì?|Tạo trạng thái trung gian giữa các mốc hoạt ảnh.
Squash and stretch là gì?|Biến dạng co và giãn để thể hiện trọng lượng hoặc độ đàn hồi.
Anticipation trong hoạt hình là gì?|Chuyển động chuẩn bị giúp người xem hiểu hành động sắp diễn ra.
Follow-through trong hoạt hình là gì?|Phần cơ thể hoặc vật tiếp tục chuyển động sau hành động chính.
Overlapping action là gì?|Các bộ phận chuyển động lệch nhịp để hình ảnh tự nhiên hơn.
Ease-in và ease-out là gì?|Chuyển động tăng hoặc giảm tốc dần quanh mốc hoạt ảnh.
Animation timing là gì?|Số khung và nhịp dùng để tạo tốc độ, trọng lượng chuyển động.
Animation spacing là gì?|Khoảng cách vị trí giữa các khung, quyết định cảm giác tốc độ.
Motion arc là gì?|Đường cong mà chuyển động đi theo thay vì luôn đi thẳng.
Staging trong hoạt hình là gì?|Sắp hình và hành động để ý chính dễ được nhận ra.
Secondary action là gì?|Hành động phụ hỗ trợ tính cách hoặc ý nghĩa hành động chính.
Model sheet là gì?|Bản tham chiếu giúp vẽ nhân vật nhất quán ở nhiều góc.
Character rig là gì?|Hệ điều khiển giúp tạo tư thế và chuyển động nhân vật số.
Rigging là gì?|Xây bộ khung và điều khiển để hoạt hóa mô hình.
Skinning trong 3D là gì?|Gắn bề mặt mô hình với bộ xương để biến dạng khi chuyển động.
Rotoscoping là gì?|Dựa trên hình quay thật để tạo hoặc tách chuyển động từng khung.
Stop-motion là gì?|Di chuyển vật thể từng chút rồi chụp để tạo ảo giác chuyển động.
Clay animation là gì?|Stop-motion dùng nhân vật hoặc vật tạo từ vật liệu nặn.
Cutout animation là gì?|Hoạt hình dùng các phần hình cắt ghép và điều khiển chuyển động.
Cel animation là gì?|Quy trình truyền thống vẽ các lớp hình trên tấm trong suốt.
Compositing là gì?|Ghép nhiều lớp hình hoặc hiệu ứng thành hình cuối.
Onion skin trong hoạt hình là gì?|Hiển thị mờ các khung lân cận để hỗ trợ chỉnh chuyển động.
Loop animation là gì?|Đoạn chuyển động có thể lặp, thường nối đầu và cuối phù hợp.
`),
    ...group('subgenres', 'Nhánh thể loại điện ảnh', `
Neo-noir là gì?|Tác phẩm vận dụng đặc điểm noir trong bối cảnh hoặc phong cách mới.
Film noir thường có không khí gì?|Thường có bi quan, mơ hồ đạo đức và hình ảnh tương phản.
Legal drama là gì?|Chính kịch tập trung vào tranh chấp, nghề luật hoặc phòng xử án.
Medical drama là gì?|Chính kịch về nhân vật và xung đột trong môi trường y tế.
Political thriller là gì?|Phim căng thẳng gắn với quyền lực và xung đột chính trị.
Spy thriller là gì?|Phim hồi hộp xoay quanh hoạt động tình báo hoặc gián điệp.
Heist film là gì?|Phim tập trung vào kế hoạch và thực hiện một vụ trộm lớn.
Prison drama là gì?|Chính kịch trong môi trường nhà tù hoặc đời sống người bị giam.
Road movie là gì?|Phim kể hành trình di chuyển gắn với biến đổi của nhân vật.
Buddy movie là gì?|Phim đặt quan hệ và hành trình của đôi nhân vật làm trọng tâm.
Coming-of-age film là gì?|Phim theo dõi quá trình trưởng thành và hình thành bản sắc.
Sports drama là gì?|Chính kịch dùng thi đấu hoặc tập luyện thể thao làm môi trường xung đột.
Survival film là gì?|Phim tập trung nỗ lực sống sót trước hiểm nguy hoặc hoàn cảnh khắc nghiệt.
Disaster film là gì?|Phim lấy thảm họa và phản ứng của con người làm trọng tâm.
Monster movie là gì?|Phim đặt sinh vật gây đe dọa làm yếu tố nổi bật.
Creature feature là gì?|Phim giải trí xoay quanh sinh vật lạ hoặc nguy hiểm.
Gothic horror là gì?|Kinh dị thường kết hợp không gian u tối, quá khứ và bí mật.
Folk horror là gì?|Kinh dị khai thác tín ngưỡng, cộng đồng và truyền thống dân gian.
Cosmic horror là gì?|Kinh dị về thế lực vượt hiểu biết, khiến con người cảm thấy nhỏ bé.
Found-footage film là gì?|Phim trình bày như tư liệu được nhân vật ghi rồi tìm lại.
Mockumentary là gì?|Tác phẩm hư cấu sử dụng hình thức giống phim tài liệu.
Docudrama là gì?|Tác phẩm tái hiện sự kiện thực bằng diễn xuất và cấu trúc chính kịch.
Anthology film là gì?|Phim gồm nhiều câu chuyện hoặc phần tương đối độc lập.
Chamber drama là gì?|Chính kịch thường tập trung vào ít nhân vật trong không gian hạn chế.
Screwball comedy là gì?|Hài với tình huống lệch nhịp, đối đáp nhanh và quan hệ nhiều va chạm.
`),
    ...group('themes', 'Chủ đề và mô-típ phim', `
Found family trong phim là gì?|Những người không cùng huyết thống hình thành quan hệ như gia đình.
Redemption story là gì?|Câu chuyện về nỗ lực sửa sai và thay đổi sau lỗi lầm.
Revenge cycle là gì?|Chuỗi trả đũa tiếp diễn khi hành động trước tạo thù hận mới.
Fish out of water là gì?|Nhân vật bị đặt trong môi trường xa lạ với kinh nghiệm của mình.
Enemies to allies là gì?|Quan hệ chuyển từ đối đầu sang hợp tác.
Friends to rivals là gì?|Quan hệ chuyển từ thân thiết sang cạnh tranh hoặc đối lập.
Forbidden love là gì?|Tình yêu bị ngăn cản bởi quy tắc, hoàn cảnh hoặc quan hệ khác.
Love triangle là gì?|Mối quan hệ tình cảm đan xen giữa ba người.
Mistaken identity là gì?|Nhầm danh tính tạo xung đột hoặc tình huống câu chuyện.
Double life là gì?|Nhân vật sống với hai đời sống hoặc danh tính khác nhau.
Secret identity là gì?|Danh tính được che giấu với những người trong câu chuyện.
Quest story là gì?|Hành trình tìm vật, người hoặc mục tiêu có ý nghĩa.
Chosen-one trope là gì?|Mô-típ nhân vật được chọn cho một nhiệm vụ đặc biệt.
Underdog story là gì?|Câu chuyện về người bị đánh giá thấp nỗ lực vượt trở ngại.
Rise-and-fall story là gì?|Theo dõi sự đi lên rồi suy sụp của nhân vật hoặc tổ chức.
Rags-to-riches story là gì?|Hành trình từ hoàn cảnh thiếu thốn đến giàu có hoặc thành công.
Identity crisis trong phim là gì?|Nhân vật nghi vấn mình là ai hoặc muốn sống theo điều gì.
Moral dilemma là gì?|Tình thế phải chọn giữa các giá trị hoặc nghĩa vụ xung đột.
Nature versus nurture là chủ đề gì?|Đặt ảnh hưởng bẩm sinh cạnh tác động của môi trường và trải nghiệm.
Man versus nature là gì?|Xung đột giữa con người với môi trường tự nhiên.
Man versus society là gì?|Xung đột giữa cá nhân và quy tắc hoặc tổ chức xã hội.
Man versus self là gì?|Xung đột của nhân vật với suy nghĩ hoặc phần bên trong mình.
Hubris trong bi kịch là gì?|Sự kiêu ngạo quá mức góp phần dẫn đến sai lầm hoặc sụp đổ.
Sacrifice motif là gì?|Mô-típ từ bỏ điều có giá trị để bảo vệ người hoặc mục tiêu khác.
Journey home là mô-típ gì?|Hành trình trở về gắn với việc thay đổi cách hiểu về nơi thuộc về.
`),
    ...group('analysis', 'Đọc và phân tích phim', `
Mise-en-scène nghĩa là gì?|Cách bố trí những gì trong cảnh, như diễn viên, ánh sáng và bối cảnh.
Visual motif là gì?|Hình ảnh lặp lại có vai trò biểu đạt trong tác phẩm.
Symbolism trong phim là gì?|Dùng chi tiết gợi ý nghĩa vượt ngoài chức năng trực tiếp.
Allegory trong phim là gì?|Câu chuyện hoặc hệ chi tiết đại diện một tầng ý nghĩa khác.
Metaphor bằng hình ảnh là gì?|Dùng hình ảnh để gợi sự tương đồng với một ý tưởng.
Juxtaposition là gì?|Đặt các yếu tố cạnh nhau để làm nổi bật quan hệ hoặc tương phản.
Contrast trong kể chuyện là gì?|Nhấn khác biệt giữa nhân vật, hình ảnh hoặc tình huống.
Tone của phim là gì?|Thái độ và sắc thái tác phẩm thể hiện với nội dung.
Mood của cảnh là gì?|Bầu không khí cảm xúc mà cảnh gợi ở người xem.
Pacing của phim là gì?|Nhịp tiến triển của thông tin, hành động và cảm xúc.
Visual rhythm là gì?|Nhịp cảm nhận từ độ dài cảnh, chuyển động và bố cục.
Screen direction là gì?|Hướng hành động trong khung giúp người xem hiểu không gian.
180-degree rule là gì?|Giữ máy ở một phía trục hành động để hướng nhìn nhất quán.
30-degree rule là gì?|Gợi ý đổi góc đủ rõ giữa cảnh gần nhau để tránh cảm giác nhảy.
Shot-reverse-shot là gì?|Luân phiên hai hướng nhìn, thường dùng trong hội thoại.
Eyeline match là gì?|Nối hướng mắt nhân vật với hình cho thấy thứ được nhìn.
Match on action là gì?|Cắt cảnh khi giữ liên tục một hành động đang diễn ra.
Negative space trong khung hình là gì?|Khoảng không quanh chủ thể có thể cân bố cục hoặc gợi cảm xúc.
Leading lines là gì?|Các đường trong hình dẫn mắt về vùng hoặc chủ thể.
Rule of thirds là gì?|Gợi ý đặt điểm chú ý theo các đường chia khung thành ba phần.
Symmetry trong bố cục là gì?|Sự cân hoặc phản chiếu hình dạng quanh một trục.
Deep focus là gì?|Cách ghi hình làm nhiều lớp khoảng cách cùng trông nét.
Shallow focus là gì?|Cách ghi hình chỉ giữ một vùng khoảng cách hẹp đủ nét.
Off-screen space là gì?|Không gian ngoài khung hình vẫn được câu chuyện gợi tồn tại.
Subtle storytelling là gì?|Kể bằng dấu hiệu tiết chế để người xem tự liên kết ý nghĩa.
`),
    ...group('habits', 'Thói quen xem và trao đổi', `
Xem phim khó hiểu nên dừng ghi chú không?|Bạn có thể ghi nhân vật và mốc sự kiện, tránh tìm lời giải gây spoiler.
Xem phim có nhiều nhân vật nên nhớ thế nào?|Ghi tên cùng quan hệ hoặc đặc điểm nổi bật của từng người.
Đọc review trước phim nên tránh gì?|Tránh bài tiết lộ bước ngoặt nếu muốn giữ trải nghiệm lần đầu.
Xem phim theo nhóm chọn sao cho dễ thống nhất?|Mỗi người nêu một điều muốn xem và một điều muốn tránh.
Tranh luận phim khác ý nên nói thế nào?|Nêu cảnh làm căn cứ và phân biệt cách cảm nhận với thông tin trong phim.
Muốn kể về phim mà không spoiler thì nói gì?|Nói về tiền đề, phong cách và cảm giác, tránh tiết lộ diễn biến quyết định.
Viết cảnh báo spoiler nên đặt ở đâu?|Đặt trước phần tiết lộ để người đọc quyết định có tiếp tục không.
Phim chậm có nên xem lúc đang vội không?|Nếu thiếu thời gian, chọn lúc rảnh để theo nhịp và chi tiết tốt hơn.
Xem nhiều phần liên tiếp nên ghi gì?|Ghi phần đã xem và câu hỏi còn mở để tiếp tục không nhầm mạch.
Không hiểu nhân vật làm vậy nên xem lại gì?|Xem mục tiêu, thông tin họ biết và các lựa chọn trước hành động đó.
Một cảnh buồn mà tôi không buồn có sai không?|Không; cảm nhận phụ thuộc trải nghiệm và mức đồng cảm của từng người.
Phim được khen mà tôi không thích có bình thường không?|Có; đánh giá chung không thay thế sở thích và cảm nhận cá nhân.
Nên so bản chuyển thể với truyện thế nào?|So mục tiêu kể chuyện và tác dụng thay đổi, thay vì chỉ đếm cảnh khác.
Xem phim cũ cần chú ý bối cảnh gì?|Xét thời kỳ sản xuất và cách biểu đạt, vẫn có thể phản biện nội dung.
Muốn hiểu đoạn kết nên bắt đầu từ đâu?|Đối chiếu cảnh cuối với mục tiêu, lựa chọn và chi tiết cài trước đó.
Nhận ra lỗi liên tục có làm phim vô giá trị không?|Không; đánh giá tác phẩm có thể xét nhiều mặt ngoài một lỗi nhỏ.
Nên đọc phụ đề hay nhìn nét mặt nhiều hơn?|Điều chỉnh nhịp xem; có thể tạm dừng khi lời nhiều để không bỏ diễn xuất.
Xem lại cùng phim có ích gì?|Bạn có thể nhận ra chi tiết cài trước và quan hệ khó thấy lần đầu.
Phim hết mà còn thắc mắc có nên hỏi AI không?|Có; gửi câu hỏi cụ thể và cho biết bạn chấp nhận mức spoiler nào.
Đánh giá phim nên chấm theo tiêu chí gì?|Có thể xét câu chuyện, diễn xuất, hình, tiếng và trải nghiệm tổng thể.
Có nên chấm phim khi mới xem nửa đầu không?|Nên ghi rõ mới xem một phần, tránh kết luận thay cho toàn bộ tác phẩm.
Tóm tắt phim nên kể mọi cảnh không?|Không; giữ sự kiện chính và quan hệ nhân quả, bỏ chi tiết không cần thiết.
Nhớ nhầm hai nhân vật cùng tên xử lý sao?|Đối chiếu diễn viên, quan hệ và thời điểm xuất hiện trước khi hỏi tiếp.
Xem phim nhiều ngôn ngữ nên kiểm tra gì?|Kiểm tra bản âm thanh và phụ đề cho từng nguồn đang phát.
Nên chọn phim mới hay xem lại phim thích?|Chọn theo tâm trạng; khám phá mới và sự quen thuộc đều có giá trị.
`),
    ...group('discovery', 'Đặt yêu cầu tìm phim', `
Muốn gợi ý phim ít nhân vật thì hỏi sao?|Nêu muốn câu chuyện tập trung ít nhân vật và thêm thể loại bạn thích.
Muốn phim diễn ra ở một địa điểm thì hỏi sao?|Nêu yêu cầu bối cảnh hạn chế, thời lượng và mức căng thẳng chấp nhận.
Muốn phim có nữ chính mạnh thì mô tả sao?|Nói muốn nữ chính chủ động tác động cốt truyện, không chỉ mạnh về chiến đấu.
Muốn phim có nam chính hiền thì hỏi sao?|Nêu tính cách mong muốn và các mô-típ bạn không thích.
Muốn phim về tình bạn không tình yêu thì hỏi sao?|Nêu trọng tâm tình bạn và muốn hạn chế tuyến tình cảm.
Muốn phim về anh chị em thì hỏi sao?|Nêu quan hệ gia đình mong muốn và muốn không khí hài hay chính kịch.
Muốn phim về cha con thì hỏi sao?|Nêu chủ đề cha con và mức buồn hoặc nhẹ nhàng bạn phù hợp.
Muốn phim về mẹ con thì hỏi sao?|Nêu chủ đề mẹ con, độ dài và nội dung muốn tránh.
Muốn phim về người già thì hỏi sao?|Nêu mong muốn nhân vật lớn tuổi giữ vai trò trung tâm và thể loại phù hợp.
Muốn phim về nghề bếp thì hỏi sao?|Nêu muốn câu chuyện về nấu ăn hoặc nhà hàng, thêm độ dài mong muốn.
Muốn phim về âm nhạc không musical thì hỏi sao?|Nêu muốn chủ đề nhạc sĩ nhưng không ưu tiên nhân vật hát kể chuyện.
Muốn phim thể thao không bóng đá thì hỏi sao?|Nêu môn thích hoặc môn muốn loại trừ, đừng chỉ ghi thể thao.
Muốn phim giải đố không kinh dị thì hỏi sao?|Nêu thích bí ẩn và giải đố, muốn tránh yếu tố hù dọa.
Muốn phim điều tra không bạo lực nặng thì hỏi sao?|Nêu trọng tâm suy luận và mức bạo lực muốn hạn chế.
Muốn phim du hành không gian thì hỏi sao?|Nêu bối cảnh không gian và ưu tiên khoa học hay phiêu lưu.
Muốn phim về trí tuệ nhân tạo thì hỏi sao?|Nêu muốn chủ đề AI cùng hướng triết lý, hành động hoặc cảm xúc.
Muốn phim về robot thân thiện thì hỏi sao?|Nêu robot là bạn đồng hành và giới hạn nội dung bạn muốn tránh.
Muốn phim phép thuật nhẹ nhàng thì hỏi sao?|Nêu giả tưởng ít căng thẳng và cho biết nhóm tuổi người xem.
Muốn phim về chuyến đi thì hỏi sao?|Nêu hành trình, nơi chốn hoặc mục đích chuyến đi bạn thích.
Muốn phim có nhân vật làm giáo viên thì hỏi sao?|Nêu môi trường trường học và vai giáo viên làm trọng tâm.
Muốn phim dựa trên sách thì hỏi sao?|Nêu muốn bản chuyển thể và tên sách nếu có ưu tiên.
Muốn phim kết thúc kín thì hỏi sao?|Nêu thích giải quyết tuyến chính, đồng thời yêu cầu tránh kể trước đoạn kết.
Muốn phim ít thoại thì hỏi sao?|Nêu thích kể bằng hình ảnh và muốn lời thoại hạn chế.
Muốn phim nhiều đối thoại thì hỏi sao?|Nêu thích tranh luận hoặc tương tác nhân vật, thêm chủ đề quan tâm.
Muốn phim ngắn mà có chiều sâu thì hỏi sao?|Nêu thời gian tối đa và chủ đề, tránh chỉ yêu cầu phim hay.
`),
    ...group('captions', 'Phụ đề và bản dịch', `
SDH trong phụ đề là gì?|Phụ đề có thêm thông tin tiếng và người nói để hỗ trợ người khó nghe.
Closed captions là gì?|Chú thích có thể bật tắt, thường gồm thoại và thông tin âm thanh.
Forced subtitles là gì?|Phụ đề cho phần cần dịch riêng, như lời bằng ngôn ngữ khác.
SRT là loại tệp gì?|Tệp phụ đề văn bản chứa số thứ tự, thời gian và nội dung.
WebVTT là gì?|Định dạng văn bản cho phụ đề và các nội dung định thời trên web.
ASS subtitle là gì?|Định dạng phụ đề hỗ trợ kiểu chữ, vị trí và hiệu ứng.
Subtitle cue là gì?|Một mục phụ đề có nội dung cùng thời điểm bắt đầu và kết thúc.
Timecode trong phụ đề là gì?|Mốc thời gian dùng xác định khi dòng chữ xuất hiện hoặc biến mất.
Phụ đề có ký hiệu nốt nhạc nghĩa gì?|Thường đánh dấu lời hát hoặc nội dung âm nhạc đang nghe.
Phụ đề ghi tên trong ngoặc để làm gì?|Giúp nhận diện người nói khi hình ảnh hoặc tiếng chưa rõ.
Phụ đề ghi tiếng cửa đóng để làm gì?|Truyền đạt thông tin âm thanh có ý nghĩa cho người không nghe rõ.
Fansub là gì?|Bản phụ đề do cộng đồng người hâm mộ thực hiện.
Localization khác dịch từng chữ thế nào?|Điều chỉnh cách biểu đạt để phù hợp ngữ cảnh và người tiếp nhận.
Literal translation là gì?|Dịch gần cấu trúc và nghĩa trực tiếp của văn bản gốc.
Transcreation là gì?|Chuyển ý sáng tạo để giữ tác dụng hơn là từng từ.
Honorific trong phụ đề Nhật là gì?|Hậu tố xưng hô thể hiện quan hệ hoặc mức lịch sự.
Romanization là gì?|Biểu diễn một hệ chữ bằng chữ Latinh.
Phụ đề hai dòng có phải lỗi không?|Không; cách chia dòng thường giúp đọc trong thời gian hiển thị.
Phụ đề biến mất nhanh có phải video tua không?|Chưa chắc; thời gian từng dòng có thể ngắn hoặc dữ liệu phụ đề lỗi.
Phụ đề không dấu có phải máy tôi hỏng không?|Không chắc; nguồn có thể không dấu hoặc gặp lỗi mã hóa.
Chữ phụ đề thành ký tự lạ thường do gì?|Có thể do mã hóa văn bản không được đọc đúng.
Bản dịch tên riêng khác nhau xử lý sao?|Đối chiếu tên gốc và nhân vật trước khi cho rằng là hai người.
Phụ đề có lược lời đùa có hợp lý không?|Có thể để đủ thời gian đọc; nên xét tác dụng và ngữ cảnh bản dịch.
Có thể thay phụ đề trên video nhúng bằng chat không?|Không; chatbot không sửa trực tiếp điều khiển hoặc dữ liệu nguồn nhúng.
Phụ đề che nội dung quan trọng nên làm gì?|Thử tùy chọn vị trí hoặc nguồn khác nếu trình phát hỗ trợ.
`),
    ...group('media', 'Tệp và dữ liệu video', `
Container video là gì?|Định dạng chứa các luồng hình, tiếng và dữ liệu liên quan.
MKV là gì?|Định dạng container có thể chứa nhiều luồng media và phụ đề.
WebM là gì?|Định dạng container được dùng cho media trên web.
MOV là gì?|Định dạng container gắn với hệ QuickTime, chứa các luồng media.
HLS là gì?|Cách truyền media theo danh sách và các đoạn để phát qua HTTP.
M3U8 là gì?|Tệp danh sách phát dùng mã hóa UTF-8, thường gặp trong HLS.
MPEG-DASH là gì?|Chuẩn truyền media theo đoạn với thông tin mô tả các bản phát.
Media segment là gì?|Một phần nhỏ của nội dung được tải và phát theo chuỗi.
Manifest của video là gì?|Tệp mô tả các luồng, đoạn hoặc lựa chọn cần để phát.
Adaptive bitrate streaming là gì?|Thay đổi bản bitrate theo điều kiện mạng và khả năng phát.
Buffer video là gì?|Phần dữ liệu tải trước để hỗ trợ phát liên tục.
Buffer underrun là gì?|Dữ liệu chờ phát hết trước khi đoạn tiếp tải đủ.
Video seek là gì?|Chuyển vị trí phát đến một mốc thời gian khác.
I-frame là gì?|Khung được mã hóa không cần tham chiếu khung khác để giải mã hình đó.
P-frame là gì?|Khung dùng dự đoán từ khung tham chiếu trước trong mã hóa.
B-frame là gì?|Khung có thể dùng dự đoán từ các khung tham chiếu trước và sau.
GOP trong video là gì?|Nhóm khung được tổ chức theo cấu trúc mã hóa và tham chiếu.
Chroma subsampling là gì?|Giảm dữ liệu màu so với dữ liệu độ sáng để tiết kiệm dung lượng.
Bit depth hình ảnh là gì?|Số bit dùng biểu diễn mức giá trị của một thành phần màu.
Interlaced video là gì?|Video lưu hình theo các trường quét xen thay vì toàn khung cùng lúc.
Progressive video là gì?|Video biểu diễn các dòng của mỗi khung theo dạng đầy đủ.
Deinterlacing là gì?|Chuyển tín hiệu quét xen thành khung phù hợp hiển thị quét liên tục.
Variable frame rate là gì?|Tốc độ khung hình có thể thay đổi trong cùng video.
Constant frame rate là gì?|Khung hình được biểu diễn với tốc độ ổn định.
Transcoding là gì?|Chuyển media từ kiểu mã hóa hoặc cấu hình sang kiểu khác.
`),
    ...group('network', 'Mạng và kết nối', `
Bandwidth mạng là gì?|Khả năng truyền dữ liệu của kết nối trong một khoảng thời gian.
Latency mạng là gì?|Độ trễ để dữ liệu hoặc phản hồi đi qua kết nối.
Jitter mạng là gì?|Sự thay đổi độ trễ giữa các lần truyền.
Packet loss là gì?|Một phần gói dữ liệu không đến được nơi nhận.
Ping đo gì?|Thường đo thời gian khứ hồi của một trao đổi kiểm tra mạng.
DNS dùng làm gì?|Tra cứu tên miền thành thông tin cần để kết nối, như địa chỉ IP.
IP address là gì?|Địa chỉ dùng nhận diện điểm kết nối trong mạng IP.
IPv4 khác IPv6 cơ bản thế nào?|IPv4 dùng địa chỉ 32 bit; IPv6 dùng 128 bit.
Router làm gì?|Chuyển dữ liệu giữa các mạng theo thông tin định tuyến.
Modem làm gì?|Chuyển đổi tín hiệu để kết nối với đường truyền của nhà mạng.
Wi-Fi khác internet thế nào?|Wi-Fi là kết nối không dây cục bộ; internet là mạng liên kết rộng.
Ethernet là gì?|Nhóm công nghệ mạng có dây dùng phổ biến trong mạng cục bộ.
LAN là gì?|Mạng cục bộ trong phạm vi như nhà hoặc văn phòng.
WAN là gì?|Mạng kết nối trên phạm vi rộng hơn mạng cục bộ.
CDN làm gì?|Phân phối nội dung qua nhiều điểm phục vụ gần hoặc phù hợp người dùng.
Proxy là gì?|Máy hoặc dịch vụ trung gian xử lý kết nối thay cho một phía.
NAT là gì?|Chuyển đổi thông tin địa chỉ giữa các mạng khi truyền dữ liệu.
Firewall là gì?|Cơ chế lọc lưu lượng theo quy tắc được đặt.
Upload khác download thế nào?|Upload gửi dữ liệu lên; download nhận dữ liệu về.
Mbps khác MB/s thế nào?|Mbps tính megabit mỗi giây; MB/s tính megabyte mỗi giây.
Wi-Fi đủ vạch có chắc internet tốt không?|Không; vạch sóng chỉ phản ánh một phần kết nối không dây.
Speed test tốt có đảm bảo mọi video mượt không?|Không; đường đến nguồn phim và tải máy chủ có thể khác.
Nhiều người dùng chung mạng có ảnh hưởng phim không?|Có thể; các tác vụ chia sẻ băng thông và làm tăng độ trễ.
Tải tệp lớn lúc xem phim có gây đứng không?|Có thể, nếu việc tải cạnh tranh dữ liệu mà video cần.
Đổi DNS có tự tăng tốc mọi phim không?|Không; DNS chủ yếu hỗ trợ tra cứu, không sửa mọi nút nghẽn truyền video.
`),
    ...group('browser', 'Khái niệm trình duyệt', `
Viewport trình duyệt là gì?|Vùng nhìn thấy của trang trong cửa sổ trình duyệt.
Breakpoint responsive là gì?|Mốc kích thước để quy tắc giao diện thay đổi.
Responsive layout là gì?|Bố cục thích nghi theo không gian màn hình.
Page reflow là gì?|Tính lại vị trí và kích thước các phần tử trên trang.
Page repaint là gì?|Vẽ lại hình hiển thị khi nội dung hoặc cách thể hiện thay đổi.
Lazy loading là gì?|Trì hoãn tải nội dung tới khi có nhu cầu.
Prefetch là gì?|Tải trước tài nguyên có thể cần trong bước tiếp theo.
Preload là gì?|Báo trình duyệt ưu tiên tải tài nguyên cần sớm.
Service worker là gì?|Mã chạy tách trang, có thể xử lý yêu cầu mạng và tác vụ hỗ trợ.
LocalStorage là gì?|Kho dữ liệu chuỗi theo nguồn trang, thường tồn tại qua các phiên.
SessionStorage là gì?|Kho dữ liệu theo nguồn trang và phiên tab.
IndexedDB là gì?|Cơ sở dữ liệu cục bộ để ứng dụng web lưu dữ liệu có cấu trúc.
DOM là gì?|Mô hình dạng cây biểu diễn nội dung tài liệu để mã truy cập.
CSS làm gì?|Quy định cách trình bày như màu, bố cục và kích thước.
HTML làm gì?|Mô tả cấu trúc và ý nghĩa nội dung trang web.
JavaScript làm gì trong trang web?|Xử lý hành vi, tương tác và cập nhật nội dung theo chương trình.
Web accessibility là gì?|Khả năng dùng web của người có các nhu cầu và cách tương tác khác nhau.
Alt text của ảnh là gì?|Văn bản thay thế diễn đạt nội dung hoặc chức năng của ảnh.
Focus bàn phím là gì?|Phần tử đang nhận thao tác từ bàn phím.
Tab order là gì?|Thứ tự các phần tử được chuyển đến bằng phím Tab.
ARIA label là gì?|Thông tin tên hỗ trợ công nghệ trợ năng nhận diện phần tử.
Horizontal overflow là gì?|Nội dung vượt chiều ngang vùng chứa.
Scrollbar dùng làm gì?|Cho phép chuyển phần nội dung đang thấy trong vùng có thể cuộn.
Media query là gì?|Quy tắc CSS áp dụng theo điều kiện môi trường như kích thước hiển thị.
Browser extension là gì?|Phần mở rộng bổ sung hành vi hoặc chức năng cho trình duyệt.
`),
    ...group('computer', 'Máy tính và dữ liệu', `
RAM dùng làm gì?|Lưu dữ liệu làm việc để máy truy cập nhanh khi chương trình chạy.
SSD khác HDD ở đâu?|SSD lưu bằng linh kiện điện tử; HDD dùng đĩa từ quay.
CPU làm gì?|Thực hiện lệnh và các xử lý chung của máy tính.
GPU làm gì?|Xử lý nhiều tác vụ song song, đặc biệt hình ảnh và đồ họa.
VRAM là gì?|Bộ nhớ phục vụ xử lý đồ họa trên GPU.
Operating system là gì?|Phần mềm quản lý tài nguyên máy và môi trường chạy ứng dụng.
Driver thiết bị là gì?|Phần mềm giúp hệ điều hành làm việc với thiết bị.
Process máy tính là gì?|Một phiên thực thi chương trình cùng tài nguyên liên quan.
Thread là gì?|Luồng thực thi bên trong tiến trình.
Multitasking là gì?|Khả năng điều phối nhiều tác vụ trong cùng hệ thống.
File extension là gì?|Phần đuôi tên tệp thường gợi loại hoặc cách sử dụng tệp.
Directory là gì?|Thư mục dùng tổ chức tệp và thư mục khác.
Backup là gì?|Bản sao để khôi phục dữ liệu khi bản chính mất hoặc hỏng.
Sync dữ liệu là gì?|Cập nhật giữa các nơi để giữ dữ liệu tương ứng theo quy tắc.
Archive tệp là gì?|Gói chứa các tệp, có thể kèm nén để lưu hoặc truyền thuận tiện.
Lossless compression là gì?|Nén cho phép khôi phục dữ liệu gốc đầy đủ.
Lossy compression là gì?|Nén loại bớt thông tin để giảm dung lượng.
Checksum là gì?|Giá trị tính từ dữ liệu để hỗ trợ phát hiện thay đổi hoặc lỗi.
Binary là hệ gì?|Hệ cơ số hai, dùng các chữ số 0 và 1.
Hexadecimal là hệ gì?|Hệ cơ số mười sáu, thường dùng 0–9 và A–F.
Unicode là gì?|Tiêu chuẩn mã hóa ký tự cho nhiều hệ chữ.
UTF-8 là gì?|Cách mã hóa Unicode bằng chuỗi byte có độ dài thay đổi.
ASCII là gì?|Bộ mã ký tự cơ bản truyền thống dùng các giá trị 7 bit.
Clipboard là gì?|Vùng giữ nội dung sao chép hoặc cắt để dán nơi khác.
Read-only file là gì?|Tệp được mở hoặc đặt quyền theo cách không cho chỉnh sửa trực tiếp.
`),
    ...group('security', 'An toàn thông tin cơ bản', `
Phishing là gì?|Giả mạo để dụ người dùng tiết lộ thông tin hoặc thực hiện hành động.
Malware là gì?|Phần mềm có mục đích gây hại hoặc hành vi không được mong muốn.
Ransomware là gì?|Mã độc khóa hoặc mã hóa dữ liệu để đòi tiền chuộc.
Spyware là gì?|Phần mềm thu thập thông tin hoặc theo dõi người dùng trái mong muốn.
Trojan là gì?|Phần mềm trông hợp lệ nhưng chứa chức năng gây hại.
Brute-force attack là gì?|Thử nhiều khả năng để tìm mật khẩu hoặc giá trị bí mật.
Password reuse nguy hiểm ở đâu?|Một nơi lộ mật khẩu có thể ảnh hưởng các tài khoản dùng cùng mật khẩu.
Passphrase là gì?|Cụm từ dùng làm bí mật đăng nhập, cần đủ khó đoán.
Password manager làm gì?|Lưu và hỗ trợ quản lý thông tin đăng nhập theo cơ chế bảo vệ.
Two-factor authentication là gì?|Xác thực bằng hai loại yếu tố khác nhau.
OTP là gì?|Mật mã dùng một lần, không nên chia sẻ cho người lạ.
Recovery code dùng làm gì?|Mã dự phòng để khôi phục truy cập theo cơ chế của dịch vụ.
HTTPS bảo vệ điều gì?|Mã hóa và xác thực kết nối; không đảm bảo mọi nội dung trang đều đáng tin.
TLS là gì?|Giao thức bảo vệ dữ liệu truyền qua mạng bằng mã hóa và xác thực.
Digital certificate là gì?|Chứng thư gắn danh tính với khóa công khai theo hệ tin cậy.
Encryption là gì?|Biến dữ liệu thành dạng chỉ đọc được với thông tin giải mã phù hợp.
Hash dữ liệu là gì?|Hàm tạo giá trị đại diện từ dữ liệu, không phải mã hóa để giải ngược.
Salt mật khẩu là gì?|Dữ liệu thêm riêng vào quá trình băm để giảm việc dùng bảng tra sẵn.
Authentication khác authorization thế nào?|Authentication xác minh danh tính; authorization xác định quyền được phép.
Least privilege nghĩa là gì?|Chỉ cấp các quyền cần thiết cho công việc.
Session hijacking là gì?|Chiếm thông tin phiên để hành động dưới danh tính người dùng.
CSRF là gì?|Dụ trình duyệt đã xác thực gửi yêu cầu ngoài ý muốn của người dùng.
XSS là gì?|Chèn mã chạy trong trang theo cách không được phép.
SQL injection là gì?|Đưa dữ liệu làm thay đổi câu lệnh truy vấn SQL ngoài dự kiến.
Social engineering là gì?|Lợi dụng tâm lý và sự tin tưởng để thao túng hành động người dùng.
`),
    ...group('ai', 'Kiến thức về AI', `
Machine learning là gì?|Học quy luật từ dữ liệu để hỗ trợ dự đoán hoặc quyết định.
Deep learning là gì?|Học máy dùng mạng nơ-ron nhiều lớp.
Neural network là gì?|Mô hình gồm các đơn vị và liên kết có tham số được học.
LLM là gì?|Mô hình ngôn ngữ lớn học quan hệ trong dữ liệu văn bản.
Token trong mô hình ngôn ngữ là gì?|Đơn vị văn bản được mô hình mã hóa và xử lý.
Context window là gì?|Lượng nội dung mô hình có thể xét trong một lần xử lý.
Embedding là gì?|Biểu diễn dữ liệu thành vector để thể hiện các quan hệ.
Semantic search là gì?|Tìm theo ý nghĩa thay vì chỉ khớp chuỗi ký tự.
Vector database dùng làm gì?|Lưu và tìm các biểu diễn vector theo độ tương tự.
Fine-tuning là gì?|Điều chỉnh tham số mô hình bằng dữ liệu phục vụ một mục tiêu.
Inference AI là gì?|Dùng mô hình đã có để tạo dự đoán hoặc đáp án.
Training dataset là gì?|Dữ liệu dùng trong quá trình học tham số hoặc quy luật.
Validation dataset là gì?|Dữ liệu đánh giá để chọn cấu hình mà không dùng như dữ liệu học chính.
Test dataset là gì?|Dữ liệu dành kiểm tra kết quả sau khi chọn mô hình hoặc cấu hình.
Overfitting là gì?|Học quá sát dữ liệu huấn luyện nên kém với dữ liệu mới.
Underfitting là gì?|Mô hình chưa nắm đủ quy luật của dữ liệu.
Hallucination của AI là gì?|Đáp án có vẻ thuyết phục nhưng không có căn cứ hoặc sai.
Prompt injection là gì?|Nội dung cố khiến AI làm theo chỉ dẫn ngoài phạm vi được phép.
System prompt là gì?|Chỉ dẫn cấp hệ thống định hướng hành vi của mô hình.
Few-shot prompting là gì?|Đưa một số ví dụ vào yêu cầu để hướng cách trả lời.
Zero-shot prompting là gì?|Yêu cầu tác vụ mà không đưa ví dụ mẫu cụ thể.
Temperature khi sinh văn bản là gì?|Tham số ảnh hưởng mức ngẫu nhiên khi chọn token.
Top-p sampling là gì?|Chọn trong tập token có tổng xác suất đạt một ngưỡng.
AI evaluation là gì?|Đánh giá mô hình hoặc ứng dụng trên các tiêu chí và trường hợp thử.
Human review trong AI làm gì?|Con người kiểm tra chất lượng, đúng sai và mức phù hợp của kết quả.
`),
    ...group('english-film', 'Từ tiếng Anh về phim', `
Film critic dịch là gì?|Nhà phê bình phim, người phân tích và đánh giá tác phẩm.
Film festival dịch là gì?|Liên hoan phim, sự kiện tổ chức trình chiếu và hoạt động điện ảnh.
Box office dịch là gì?|Phòng vé; trong thảo luận thường chỉ doanh thu vé xem phim.
Premiere dịch là gì?|Buổi hoặc lần công chiếu đầu tiên của tác phẩm trong phạm vi nói đến.
Screening dịch là gì?|Buổi chiếu hoặc việc trình chiếu phim.
Feature film dịch là gì?|Phim dài, phân biệt với phim ngắn theo cách phân loại áp dụng.
Short film dịch là gì?|Phim ngắn; ngưỡng thời lượng tùy quy định của từng tổ chức.
Silent film dịch là gì?|Phim câm, thường không có lời thoại thu đồng bộ.
Live action dịch là gì?|Phim người hoặc cảnh thật được quay, có thể kết hợp hiệu ứng.
Screenplay dịch là gì?|Kịch bản phim, mô tả cảnh, hành động và lời thoại.
Screenwriter dịch là gì?|Biên kịch, người viết kịch bản.
Cast dịch là gì?|Dàn diễn viên tham gia tác phẩm.
Crew dịch là gì?|Đội ngũ làm việc trong quá trình sản xuất.
Lead actor dịch là gì?|Diễn viên đảm nhận vai chính.
Supporting actor dịch là gì?|Diễn viên đảm nhận vai phụ hoặc vai hỗ trợ.
Guest star dịch là gì?|Diễn viên khách mời, xuất hiện trong phần hoặc tập nhất định.
Episode guide dịch là gì?|Hướng dẫn hoặc danh mục thông tin về các tập.
Season finale dịch là gì?|Tập kết thúc một mùa phim.
Series finale dịch là gì?|Tập hoặc phần kết thúc toàn bộ series.
Season premiere dịch là gì?|Tập mở đầu hoặc lần ra mắt một mùa phim.
Screen time dịch là gì?|Thời lượng nhân vật hoặc yếu tố xuất hiện trên màn hình.
Running time dịch là gì?|Thời lượng phát của tác phẩm hoặc bản chiếu.
End credits dịch là gì?|Phần ghi tên những người và đơn vị tham gia ở cuối phim.
Opening credits dịch là gì?|Phần ghi tên ê-kíp xuất hiện ở đầu phim.
Deleted scene dịch là gì?|Cảnh đã quay nhưng bị loại khỏi bản dựng được nói đến.
`),
    ...group('english-view', 'Cụm tiếng Anh khi xem', `
Now playing dịch là gì?|Đang phát hoặc đang chiếu, tùy ngữ cảnh.
Up next dịch là gì?|Nội dung sẽ phát tiếp theo.
Watch later dịch là gì?|Xem sau, thường là lựa chọn lưu để quay lại.
Continue watching dịch là gì?|Tiếp tục xem nội dung đang xem dở.
Recently watched dịch là gì?|Nội dung đã xem gần đây.
Recently added dịch là gì?|Nội dung mới được thêm vào danh mục.
Coming soon dịch là gì?|Sắp ra mắt hoặc sắp có.
Available now dịch là gì?|Đã có hoặc hiện có thể truy cập.
Full screen dịch là gì?|Toàn màn hình.
Exit full screen dịch là gì?|Thoát chế độ toàn màn hình.
Playback speed dịch là gì?|Tốc độ phát.
Audio track dịch là gì?|Luồng hoặc bản âm thanh.
Subtitle language dịch là gì?|Ngôn ngữ phụ đề.
Quality settings dịch là gì?|Thiết lập chất lượng.
Mute dịch là gì?|Tắt âm thanh đang phát.
Unmute dịch là gì?|Bật tiếng trở lại.
Replay dịch là gì?|Phát lại nội dung vừa xem hoặc nghe.
Skip intro dịch là gì?|Bỏ qua đoạn mở đầu.
Skip recap dịch là gì?|Bỏ qua đoạn tóm tắt phần trước.
Seek forward dịch là gì?|Tua về phía trước.
Seek backward dịch là gì?|Tua về phía sau.
Loading video dịch là gì?|Đang tải video.
Playback error dịch là gì?|Lỗi trong quá trình phát.
Source unavailable dịch là gì?|Nguồn hiện không truy cập được.
Retry playback dịch là gì?|Thử phát lại sau lần lỗi trước.
`),
    ...group('english-story', 'Từ tiếng Anh mô tả truyện', `
Conflict dịch là gì?|Xung đột giữa các lực, mục tiêu hoặc giá trị.
Resolution dịch là gì trong truyện?|Sự giải quyết xung đột hoặc tình huống chính.
Suspense dịch là gì?|Cảm giác hồi hộp do chưa biết diễn biến hoặc kết quả.
Tension dịch là gì?|Sự căng thẳng trong quan hệ, hành động hoặc cảm xúc.
Plot hole dịch là gì?|Lỗ hổng logic hoặc thông tin trong cốt truyện.
Backstory dịch là gì?|Chuyện nền xảy ra trước mạch chính.
Setting dịch là gì trong truyện?|Bối cảnh thời gian, không gian và môi trường câu chuyện.
Narrator dịch là gì?|Người kể chuyện.
Point of view dịch là gì?|Điểm nhìn hoặc góc nhìn.
Dialogue dịch là gì?|Đối thoại giữa các nhân vật.
Monologue dịch là gì?|Độc thoại, phần lời kéo dài của một người.
Voice-over dịch là gì?|Lời hoặc giọng nói phát trên hình mà không nhất thiết thuộc người trong khung.
Inner voice dịch là gì?|Tiếng nói nội tâm hoặc dòng suy nghĩ được diễn đạt.
Reveal dịch là gì trong truyện?|Mốc tiết lộ thông tin trước đó bị che hoặc chưa biết.
Betrayal dịch là gì?|Sự phản bội niềm tin hoặc cam kết.
Reconciliation dịch là gì?|Sự hòa giải hoặc khôi phục quan hệ.
Rivalry dịch là gì?|Quan hệ cạnh tranh hoặc đối đầu.
Alliance dịch là gì?|Sự liên minh hoặc hợp tác.
Destiny dịch là gì?|Số phận, điều được xem là định trước.
Consequence dịch là gì?|Hệ quả của hành động hoặc sự kiện.
Turning point dịch là gì?|Bước ngoặt làm thay đổi hướng phát triển.
Parallel story dịch là gì?|Tuyến truyện diễn tiến song song với một tuyến khác.
Origin story dịch là gì?|Câu chuyện về nguồn gốc của nhân vật hoặc hiện tượng.
Unresolved mystery dịch là gì?|Bí ẩn chưa được giải đáp.
Ambiguous ending dịch là gì?|Kết thúc có thể hiểu theo nhiều cách.
`),
    ...group('english-ui', 'Từ tiếng Anh trên giao diện', `
Sign in dịch là gì?|Đăng nhập vào tài khoản.
Sign out dịch là gì?|Đăng xuất khỏi tài khoản.
Sign up dịch là gì?|Đăng ký tài khoản hoặc dịch vụ.
Username dịch là gì?|Tên người dùng, không luôn là tên hiển thị.
Display name dịch là gì?|Tên hiển thị của hồ sơ.
Account settings dịch là gì?|Thiết lập tài khoản.
Privacy settings dịch là gì?|Thiết lập quyền riêng tư.
Billing history dịch là gì?|Lịch sử tính phí hoặc giao dịch thanh toán.
Subscription status dịch là gì?|Trạng thái đăng ký dịch vụ.
Expiry date dịch là gì?|Ngày hết hạn.
Renewal date dịch là gì?|Ngày gia hạn.
Payment pending dịch là gì?|Thanh toán đang chờ xử lý hoặc xác nhận.
Payment failed dịch là gì?|Thanh toán không hoàn tất thành công.
Payment completed dịch là gì?|Thanh toán đã được hoàn tất theo trạng thái hệ thống đó.
Transaction ID dịch là gì?|Mã định danh giao dịch.
Order summary dịch là gì?|Phần tóm tắt đơn hàng.
Total amount dịch là gì?|Tổng số tiền.
Discount dịch là gì?|Mức hoặc khoản giảm giá.
Apply code dịch là gì?|Áp dụng mã, thường là mã ưu đãi.
Required field dịch là gì?|Trường bắt buộc phải điền.
Optional field dịch là gì?|Trường có thể để trống.
Save changes dịch là gì?|Lưu các thay đổi.
Discard changes dịch là gì?|Bỏ những thay đổi chưa lưu.
Confirmation dịch là gì?|Sự xác nhận hoặc thông báo xác nhận.
Terms and conditions dịch là gì?|Các điều khoản và điều kiện áp dụng.
`),
    ...group('vietnamese', 'Tiếng Việt và diễn đạt', `
Danh từ là gì?|Từ gọi tên người, vật, hiện tượng hoặc khái niệm.
Động từ là gì?|Từ biểu thị hoạt động hoặc trạng thái.
Tính từ là gì?|Từ biểu thị đặc điểm, tính chất hoặc mức độ.
Đại từ là gì?|Từ dùng để chỉ hoặc thay thế đối tượng trong ngữ cảnh.
Số từ là gì?|Từ biểu thị số lượng hoặc thứ tự.
Quan hệ từ là gì?|Từ biểu thị quan hệ giữa các thành phần, như vì, của, với.
Từ ghép là gì?|Từ được tạo từ các tiếng có quan hệ về nghĩa.
Từ láy là gì?|Từ có các tiếng liên hệ về âm, như lung linh.
Từ đồng âm là gì?|Các từ giống âm nhưng có nghĩa khác nhau.
Từ nhiều nghĩa là gì?|Một từ có nhiều nghĩa liên quan, cần ngữ cảnh để hiểu.
Nghĩa đen là gì?|Nghĩa trực tiếp hoặc thông thường trong ngữ cảnh được nói đến.
Nghĩa bóng là gì?|Nghĩa chuyển được hiểu qua liên tưởng hoặc cách nói.
So sánh tu từ là gì?|Đối chiếu các đối tượng để làm nổi bật đặc điểm.
Ẩn dụ tu từ là gì?|Gọi hoặc biểu đạt đối tượng qua sự tương đồng với đối tượng khác.
Hoán dụ là gì?|Gọi đối tượng bằng yếu tố có quan hệ gần gũi với nó.
Nhân hóa là gì?|Gán đặc điểm hoặc hành động con người cho đối tượng không phải người.
Điệp từ là gì?|Lặp từ nhằm nhấn mạnh hoặc tạo nhịp.
Nói quá là gì?|Phóng đại mức độ để tăng tác dụng biểu đạt.
Nói giảm nói tránh là gì?|Diễn đạt nhẹ hoặc gián tiếp để phù hợp cảm xúc và hoàn cảnh.
Liệt kê tu từ là gì?|Đưa liên tiếp các yếu tố để làm rõ hoặc nhấn mạnh.
Câu hỏi tu từ là gì?|Câu hỏi chủ yếu dùng biểu đạt ý hoặc cảm xúc, không đòi đáp án trực tiếp.
Chủ ngữ là gì?|Thành phần nêu đối tượng được nói đến trong câu.
Vị ngữ là gì?|Thành phần nêu điều được nói về chủ ngữ.
Trạng ngữ là gì?|Thành phần bổ sung hoàn cảnh như thời gian, nơi chốn hoặc nguyên nhân.
Câu đặc biệt là gì?|Câu không theo cấu trúc chủ ngữ–vị ngữ thông thường.
`),
    ...group('writing', 'Viết và trình bày ý', `
Luận điểm là gì?|Ý kiến trung tâm cần trình bày hoặc bảo vệ.
Luận cứ là gì?|Lý lẽ hoặc bằng chứng hỗ trợ luận điểm.
Ví dụ minh họa có thay bằng chứng được không?|Không luôn; ví dụ giúp hiểu nhưng chưa đủ chứng minh kết luận chung.
Đoạn văn nên có bao nhiêu ý chính?|Thường một ý chính giúp đoạn rõ và dễ theo dõi.
Mở bài review nên viết gì?|Nêu tác phẩm và góc đánh giá mà không kể hết diễn biến.
Thân bài review nên sắp thế nào?|Nhóm nhận xét theo tiêu chí, mỗi ý kèm cảnh hoặc chi tiết làm căn cứ.
Kết bài review nên làm gì?|Nêu đánh giá cuối và người có thể phù hợp với trải nghiệm đó.
Trích dẫn và diễn giải khác nhau thế nào?|Trích dẫn giữ lời nguồn; diễn giải viết lại ý bằng cách của mình.
Paraphrase là gì?|Diễn đạt lại ý bằng lời khác mà giữ nghĩa cần thiết.
Tóm tắt khác rút nhận xét thế nào?|Tóm tắt cô đọng nội dung; nhận xét thêm đánh giá hoặc diễn giải.
Đọc soát chính tả nên chú ý gì?|Kiểm tra tên riêng, dấu, từ dễ nhầm và câu bị thiếu thành phần.
Tiêu đề tốt cần điều gì?|Nêu trọng tâm rõ và phù hợp nội dung thực sự.
Clickbait là gì?|Tiêu đề hoặc hình dùng gây tò mò quá mức, đôi khi lệch nội dung.
Bullet list hợp khi nào?|Khi các mục song song hoặc các bước cần dễ quét mắt.
Viết câu dài quá nên sửa sao?|Tách theo ý và giữ rõ quan hệ nguyên nhân, đối lập hoặc thời gian.
Viết đoạn bị lặp từ nên sửa sao?|Bỏ chỗ không cần và thay cách diễn đạt khi vẫn giữ nghĩa rõ.
Giọng văn nhất quán là gì?|Giữ cách xưng hô và sắc thái phù hợp xuyên suốt.
Văn phong trang trọng khác thân mật thế nào?|Trang trọng dùng cách diễn đạt thận trọng; thân mật gần lời trò chuyện hơn.
Đề cương giúp gì khi viết?|Xác định ý chính và thứ tự trước khi triển khai câu chữ.
Viết hướng dẫn nên bắt đầu từ đâu?|Nêu mục tiêu và điều kiện cần, rồi đưa bước có thể thực hiện.
Viết mô tả lỗi nên có gì?|Hiện tượng, bước tái hiện, kết quả mong đợi và môi trường liên quan.
Nêu giới hạn nhận xét có ích gì?|Giúp người đọc biết kết luận dựa trên phạm vi nào.
Đưa số liệu chưa rõ nguồn nên làm gì?|Tìm nguồn hoặc ghi chưa xác minh, tránh trình bày như dữ kiện chắc chắn.
Đọc biểu đồ trước khi kết luận cần xem gì?|Xem đơn vị, trục, khoảng thời gian và cách thu dữ liệu.
Viết so sánh nên dùng cùng tiêu chí không?|Có; tiêu chí nhất quán giúp thấy khác biệt có ý nghĩa.
`),
    ...group('logic', 'Lập luận và suy luận', `
Tiền đề là gì?|Mệnh đề hoặc giả định được dùng làm điểm xuất phát của lập luận.
Kết luận của lập luận là gì?|Ý được suy ra hoặc bảo vệ từ các tiền đề.
Suy diễn là gì?|Lập luận mà kết luận theo tất yếu từ tiền đề nếu dạng suy luận hợp lệ.
Quy nạp là gì?|Rút kết luận tổng quát từ các trường hợp quan sát.
Suy luận giải thích tốt nhất là gì?|Chọn giả thuyết giải thích dữ kiện phù hợp nhất trong các khả năng xét.
Lập luận vòng tròn là gì?|Dùng chính ý cần chứng minh làm cơ sở để chứng minh nó.
Ngụy biện người rơm là gì?|Biến dạng ý người khác rồi phản bác phiên bản dễ đánh hơn.
Ngụy biện công kích cá nhân là gì?|Đánh người nói thay vì đánh giá lý lẽ liên quan.
Lưỡng phân giả là gì?|Chỉ đưa hai lựa chọn dù còn khả năng khác.
Khái quát vội là gì?|Kết luận rộng từ dữ liệu quá ít hoặc không đại diện.
Ngụy biện số đông là gì?|Coi một ý đúng chỉ vì nhiều người tin hoặc làm theo.
Thiên kiến xác nhận là gì?|Ưu tiên thông tin phù hợp điều đã tin và bỏ qua thông tin trái lại.
Thiên kiến sống sót là gì?|Chỉ xét trường hợp còn xuất hiện, bỏ qua những trường hợp đã bị loại.
Tương quan có chứng minh nhân quả không?|Không; hai yếu tố đi cùng nhau chưa chứng minh yếu tố này gây yếu tố kia.
Điều kiện cần là gì?|Điều phải có để kết quả hoặc mệnh đề được nói đến xảy ra.
Điều kiện đủ là gì?|Điều mà nếu có thì dẫn đến kết quả theo quan hệ đang xét.
Mệnh đề đảo là gì?|Đổi chỗ giả thiết và kết luận của mệnh đề kéo theo.
Mệnh đề phản đảo là gì?|Với A kéo theo B, phản đảo là không B kéo theo không A.
Ví dụ phản chứng là gì?|Một trường hợp bác bỏ phát biểu cho tất cả trường hợp.
Giả thuyết là gì?|Ý giải thích hoặc dự đoán được đưa ra để xem xét và kiểm tra.
Gánh nặng chứng minh là gì?|Trách nhiệm đưa căn cứ cho khẳng định đang được đưa ra.
Không có bằng chứng có luôn là bằng chứng không có không?|Không; cần xét khả năng quan sát và phương pháp kiểm tra.
Occam's razor gợi ý gì?|Trong các giải thích tương đương, ưu tiên cách không thêm giả định không cần thiết.
Tính hợp lệ khác tính đúng thế nào?|Hợp lệ nói về cách suy ra; đúng nói về nội dung mệnh đề.
Lập luận chặt chẽ cần gì?|Tiền đề đáng tin và cách suy luận phù hợp với kết luận.
`),
    ...group('numbers', 'Số và phép tính', `
Số tự nhiên là gì?|Các số đếm không âm theo quy ước phổ biến, gồm 0, 1, 2 và tiếp nữa.
Số nguyên là gì?|Gồm số nguyên âm, số 0 và số nguyên dương.
Số hữu tỉ là gì?|Số viết được dưới dạng a/b với a, b nguyên và b khác 0.
Số vô tỉ là gì?|Số thực không viết được thành tỉ số hai số nguyên.
Số nguyên tố là gì?|Số nguyên lớn hơn 1 có đúng hai ước dương: 1 và chính nó.
Hợp số là gì?|Số nguyên lớn hơn 1 có nhiều hơn hai ước dương.
Số 1 có phải nguyên tố không?|Không; 1 chỉ có một ước dương.
Số chẵn là gì?|Số nguyên chia hết cho 2.
Số lẻ là gì?|Số nguyên không chia hết cho 2.
Ước của một số là gì?|Số chia số đó không dư trong phạm vi số nguyên đang xét.
Bội của một số là gì?|Số thu được khi nhân số đó với một số nguyên.
Ước chung lớn nhất là gì?|Ước dương lớn nhất chung của các số nguyên đang xét.
Bội chung nhỏ nhất là gì?|Bội dương nhỏ nhất chung của các số nguyên khác 0 đang xét.
Giá trị tuyệt đối là gì?|Khoảng cách của số đến 0 trên trục số.
Lũy thừa nguyên dương là gì?|Tích của cơ số nhân với chính nó theo số lần của số mũ.
Căn bậc hai số học là gì?|Số không âm có bình phương bằng số không âm đã cho.
Phân số tối giản là gì?|Phân số có tử và mẫu không còn ước chung dương lớn hơn 1.
Phần trăm nghĩa là gì?|Tỉ lệ tính trên một trăm; 25% bằng 25/100.
Trung bình cộng tính thế nào?|Cộng các giá trị rồi chia cho số lượng giá trị.
Trung vị là gì?|Giá trị giữa của dãy đã sắp; số lượng chẵn lấy trung bình hai giá trị giữa.
Mốt trong thống kê là gì?|Giá trị xuất hiện nhiều nhất; có thể có nhiều mốt.
Khoảng biến thiên tính thế nào?|Lấy giá trị lớn nhất trừ giá trị nhỏ nhất.
Xác suất bằng 0 có nghĩa gì cơ bản?|Trong mô hình rời rạc thông thường, biến cố có xác suất 0 không được chọn.
Xác suất bằng 1 có nghĩa gì cơ bản?|Biến cố xảy ra gần như chắc chắn theo mô hình xác suất đang dùng.
Giai thừa là gì?|Với n nguyên dương, n! là tích từ 1 đến n; quy ước 0! = 1.
`),
    ...group('geometry', 'Hình học cơ bản', `
Điểm trong hình học là gì?|Đối tượng biểu thị vị trí, không có kích thước.
Đường thẳng là gì?|Đường kéo dài vô hạn theo hai phía trong mô hình hình học.
Đoạn thẳng là gì?|Phần đường thẳng nằm giữa hai điểm đầu mút.
Tia hình học là gì?|Phần đường thẳng bắt đầu tại một điểm và kéo dài về một phía.
Hai đường song song là gì?|Trong cùng mặt phẳng, hai đường thẳng không giao nhau.
Hai đường vuông góc là gì?|Hai đường thẳng giao nhau tạo góc vuông.
Góc nhọn là gì?|Góc có số đo lớn hơn 0° và nhỏ hơn 90°.
Góc tù là gì?|Góc có số đo lớn hơn 90° và nhỏ hơn 180°.
Góc bẹt là gì?|Góc có số đo 180°.
Góc vuông là gì?|Góc có số đo 90°.
Tam giác đều là gì?|Tam giác có ba cạnh bằng nhau.
Tam giác cân là gì?|Tam giác có ít nhất hai cạnh bằng nhau.
Tam giác vuông là gì?|Tam giác có một góc vuông.
Tổng góc tam giác phẳng là bao nhiêu?|Trong hình học Euclid, tổng ba góc trong bằng 180°.
Định lý Pythagore nói gì?|Trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông.
Chu vi hình chữ nhật tính thế nào?|Hai lần tổng chiều dài và chiều rộng: P = 2(a + b).
Diện tích hình chữ nhật tính thế nào?|Nhân chiều dài với chiều rộng: S = a × b.
Diện tích tam giác tính thế nào?|Một nửa tích cạnh đáy với chiều cao tương ứng: S = a × h / 2.
Chu vi hình tròn tính thế nào?|C = 2πr, với r là bán kính.
Diện tích hình tròn tính thế nào?|S = πr², với r là bán kính.
Hình bình hành là gì?|Tứ giác có hai cặp cạnh đối song song.
Hình thoi là gì?|Tứ giác có bốn cạnh bằng nhau.
Thể tích hình hộp chữ nhật tính thế nào?|Nhân ba kích thước vuông góc: V = a × b × c.
Thể tích hình trụ tính thế nào?|V = πr²h, với r là bán kính đáy và h là chiều cao.
Hình đồng dạng là gì?|Các hình có cùng dạng với kích thước tương ứng theo một tỉ lệ.
`),
    ...group('units', 'Đơn vị và quy đổi', `
Một kilomet bằng bao nhiêu mét?|1 kilomet bằng 1.000 mét.
Một mét bằng bao nhiêu centimet?|1 mét bằng 100 centimet.
Một centimet bằng bao nhiêu milimet?|1 centimet bằng 10 milimet.
Một mét vuông bằng bao nhiêu centimet vuông?|1 m² bằng 10.000 cm².
Một hecta bằng bao nhiêu mét vuông?|1 hecta bằng 10.000 m².
Một mét khối bằng bao nhiêu lít?|1 m³ bằng 1.000 lít.
Một lít bằng bao nhiêu mililit?|1 lít bằng 1.000 mililit.
Một kilogram bằng bao nhiêu gram?|1 kilogram bằng 1.000 gram.
Một tấn hệ mét bằng bao nhiêu kilogram?|1 tấn hệ mét bằng 1.000 kilogram.
Một giờ bằng bao nhiêu phút?|1 giờ bằng 60 phút.
Một phút bằng bao nhiêu giây?|1 phút bằng 60 giây.
Một ngày thông thường bằng bao nhiêu giờ?|Một ngày dân dụng thông thường có 24 giờ.
Một tuần bằng bao nhiêu ngày?|1 tuần có 7 ngày.
Một radian là góc thế nào?|Góc ở tâm chắn cung dài bằng bán kính của đường tròn.
Một vòng tròn bằng bao nhiêu độ?|Một vòng đầy đủ bằng 360°.
Một vòng tròn bằng bao nhiêu radian?|Một vòng đầy đủ bằng 2π radian.
Kelvin đổi sang Celsius thế nào?|Lấy nhiệt độ kelvin trừ 273,15 để được độ Celsius.
Fahrenheit đổi sang Celsius thế nào?|Dùng công thức C = (F − 32) × 5/9.
Kilowatt là đơn vị gì?|Đơn vị công suất; 1 kW bằng 1.000 watt.
Kilowatt giờ đo gì?|Đo năng lượng, bằng công suất 1 kW dùng trong một giờ.
Hertz đo gì?|Đo tần số; 1 Hz tương ứng một chu kỳ mỗi giây.
Newton đo gì?|Đo lực trong hệ SI.
Pascal đo gì?|Đo áp suất; 1 Pa bằng 1 newton trên mét vuông.
Joule đo gì?|Đo năng lượng hoặc công trong hệ SI.
Watt đo gì?|Đo công suất; 1 W bằng 1 joule mỗi giây.
`),
    ...group('physics', 'Vật lý phổ thông', `
Vận tốc khác tốc độ thế nào?|Vận tốc có hướng; tốc độ biểu thị mức nhanh chậm không kèm hướng.
Gia tốc là gì?|Mức thay đổi vận tốc theo thời gian.
Quán tính là gì?|Xu hướng giữ trạng thái chuyển động khi không có tác động làm thay đổi.
Khối lượng khác trọng lượng thế nào?|Khối lượng là thuộc tính vật; trọng lượng là lực hấp dẫn tác dụng lên vật.
Ma sát là gì?|Lực cản chuyển động tương đối giữa các bề mặt tiếp xúc.
Động năng là gì?|Năng lượng của vật do chuyển động.
Thế năng là gì?|Năng lượng liên quan vị trí hoặc cấu hình trong một hệ tương tác.
Công cơ học là gì?|Năng lượng truyền bởi lực khi vật có dịch chuyển phù hợp.
Áp suất là gì?|Lực tác dụng vuông góc trên một đơn vị diện tích.
Lực đẩy Archimedes là gì?|Lực nổi do chất lưu tác dụng, bằng trọng lượng chất lưu bị chiếm chỗ.
Khối lượng riêng là gì?|Khối lượng trên một đơn vị thể tích.
Nhiệt độ khác nhiệt lượng thế nào?|Nhiệt độ mô tả trạng thái nhiệt; nhiệt lượng là năng lượng truyền do chênh nhiệt.
Dẫn nhiệt là gì?|Truyền năng lượng nhiệt qua tương tác trong vật chất.
Đối lưu là gì?|Truyền nhiệt gắn với chuyển động của chất lưu.
Bức xạ nhiệt là gì?|Truyền năng lượng bằng sóng điện từ, không cần môi trường vật chất.
Sóng cơ là gì?|Sự lan truyền dao động qua môi trường vật chất.
Âm thanh truyền trong chân không không?|Không; âm thanh là sóng cơ cần môi trường truyền.
Tần số âm ảnh hưởng cảm nhận gì?|Liên quan độ cao thấp của âm, nhưng cảm nhận còn phụ thuộc điều kiện.
Phản xạ ánh sáng là gì?|Ánh sáng đổi hướng trở lại khi gặp bề mặt.
Khúc xạ ánh sáng là gì?|Ánh sáng đổi hướng khi đi giữa môi trường có chiết suất khác.
Tán sắc ánh sáng là gì?|Các thành phần bước sóng bị tách do đổi hướng khác nhau.
Dòng điện là gì?|Sự dịch chuyển có hướng của điện tích.
Hiệu điện thế là gì?|Chênh lệch điện thế giữa hai điểm.
Điện trở là gì?|Đại lượng biểu thị mức cản dòng điện theo mô hình đang xét.
Mạch nối tiếp khác song song thế nào?|Nối tiếp có đường dòng chung; song song có các nhánh giữa cùng hai nút.
`),
    ...group('earth', 'Trái Đất và môi trường', `
Khí quyển là gì?|Lớp khí bao quanh một thiên thể, được giữ bởi hấp dẫn.
Thủy quyển là gì?|Toàn bộ nước của Trái Đất trong các dạng và nơi tồn tại.
Sinh quyển là gì?|Phần môi trường Trái Đất có sự sống và các hệ liên quan.
Địa quyển là gì?|Các phần rắn của Trái Đất, gồm đất đá và cấu trúc bên trong.
Chu trình nước là gì?|Sự tuần hoàn nước qua bốc hơi, ngưng tụ, giáng thủy và dòng chảy.
Bốc hơi là gì?|Chuyển từ chất lỏng sang hơi tại bề mặt.
Ngưng tụ là gì?|Chuyển từ trạng thái khí sang lỏng.
Mây được tạo từ gì?|Các giọt nước nhỏ hoặc tinh thể băng lơ lửng trong khí quyển.
Sương mù khác mây ở đâu?|Sương mù là các giọt nước hoặc tinh thể gần mặt đất làm giảm tầm nhìn.
Độ ẩm tương đối là gì?|Tỉ lệ hơi nước hiện có so với mức bão hòa ở cùng nhiệt độ.
Thời tiết khác khí hậu thế nào?|Thời tiết là trạng thái ngắn hạn; khí hậu xét đặc điểm lâu dài.
Gió hình thành do đâu cơ bản?|Không khí chuyển động dưới tác động chênh lệch áp suất và các lực liên quan.
Xói mòn là gì?|Đất hoặc vật liệu bị bào và chuyển đi bởi nước, gió hoặc tác nhân khác.
Phong hóa là gì?|Đá và khoáng vật biến đổi hoặc vỡ tại chỗ do tác động môi trường.
Trầm tích là gì?|Vật liệu được vận chuyển rồi lắng đọng.
Đá magma hình thành thế nào?|Từ vật chất nóng chảy nguội và kết tinh.
Đá trầm tích hình thành thế nào?|Từ vật liệu lắng đọng hoặc kết tủa rồi được gắn kết theo quá trình địa chất.
Đá biến chất hình thành thế nào?|Đá cũ biến đổi do nhiệt, áp suất và tương tác mà không nóng chảy hoàn toàn.
Mảng kiến tạo là gì?|Những phần lớn của lớp vỏ cứng ngoài cùng di chuyển tương đối.
Động đất là gì?|Rung chuyển do năng lượng được giải phóng trong Trái Đất.
Núi lửa là gì?|Nơi vật chất nóng từ bên trong Trái Đất thoát lên bề mặt.
Thủy triều chịu tác động chính nào?|Hấp dẫn của Mặt Trăng, Mặt Trời cùng chuyển động của hệ Trái Đất.
Hiệu ứng nhà kính là gì?|Các khí hấp thụ và phát bức xạ nhiệt góp phần giữ ấm bề mặt.
Tài nguyên tái tạo là gì?|Nguồn có thể bổ sung tự nhiên theo quy mô thời gian phù hợp cách sử dụng.
Đa dạng sinh học là gì?|Sự đa dạng của sự sống ở mức gen, loài và hệ sinh thái.
`),
    ...group('space', 'Không gian và thiên văn', `
Hệ Mặt Trời có bao nhiêu hành tinh?|Có tám hành tinh được công nhận trong phân loại hiện hành.
Hành tinh gần Mặt Trời nhất là gì?|Sao Thủy là hành tinh gần Mặt Trời nhất.
Hành tinh lớn nhất Hệ Mặt Trời là gì?|Sao Mộc là hành tinh lớn nhất Hệ Mặt Trời.
Sao Thổ nổi bật vì điều gì?|Hệ vành đai rất rõ; nó không phải hành tinh duy nhất có vành đai.
Sao Hỏa thường gọi là gì?|Thường gọi hành tinh đỏ vì diện mạo đỏ của bề mặt.
Ngôi sao khác hành tinh thế nào?|Sao như Mặt Trời tạo năng lượng bằng nhiệt hạch; hành tinh không duy trì quá trình đó như sao.
Thiên hà là gì?|Hệ lớn gồm sao, khí, bụi và thành phần khác liên kết bởi hấp dẫn.
Dải Ngân Hà là gì?|Thiên hà chứa Hệ Mặt Trời.
Năm ánh sáng đo gì?|Đo khoảng cách ánh sáng đi trong một năm, không phải đơn vị thời gian.
Đơn vị thiên văn là gì?|Đơn vị độ dài xấp xỉ khoảng cách trung bình Trái Đất–Mặt Trời.
Quỹ đạo là gì?|Đường chuyển động của vật dưới tương tác hấp dẫn hoặc lực liên quan.
Vệ tinh tự nhiên là gì?|Thiên thể quay quanh một thiên thể lớn hơn theo quỹ đạo.
Vệ tinh nhân tạo là gì?|Thiết bị do con người đưa lên quỹ đạo.
Tiểu hành tinh là gì?|Thiên thể nhỏ thường có thành phần đá hoặc kim loại quay quanh Mặt Trời.
Sao chổi là gì?|Thiên thể nhỏ chứa băng và vật liệu khác, có thể tạo đuôi khi gần Mặt Trời.
Sao băng là gì?|Vệt sáng khi vật nhỏ từ không gian tương tác với khí quyển.
Thiên thạch là gì?|Phần vật từ không gian tồn tại và rơi tới bề mặt.
Nhật thực xảy ra khi nào?|Khi Mặt Trăng che Mặt Trời đối với vị trí quan sát trên Trái Đất.
Nguyệt thực xảy ra khi nào?|Khi Mặt Trăng đi vào vùng bóng của Trái Đất.
Pha Mặt Trăng do đâu?|Do phần bề mặt được chiếu sáng nhìn từ Trái Đất thay đổi theo vị trí.
Lỗ đen là gì?|Vùng không thời gian có ranh giới mà ánh sáng bên trong không thoát ra được.
Tinh vân là gì?|Đám khí và bụi trong không gian.
Siêu tân tinh là gì?|Sự bùng nổ rất mạnh ở giai đoạn hoặc quá trình đặc biệt của sao.
Kính thiên văn dùng làm gì?|Thu tín hiệu như ánh sáng để quan sát các vật ở xa.
Vũ trụ giãn nở nghĩa là gì?|Khoảng cách quy mô lớn giữa các vùng không bị ràng buộc tăng theo thời gian.
`),
    ...group('biology', 'Sinh học và sự sống', `
Tế bào là gì?|Đơn vị cấu trúc và chức năng cơ bản của sinh vật.
DNA là gì?|Phân tử mang thông tin di truyền ở nhiều dạng sống.
Gene là gì?|Đoạn thông tin di truyền có chức năng trong một hệ sinh học.
Nhiễm sắc thể là gì?|Cấu trúc chứa DNA và các thành phần liên quan trong tế bào.
Protein là gì?|Phân tử tạo từ chuỗi amino acid, thực hiện nhiều chức năng sinh học.
Enzyme là gì?|Chất xúc tác sinh học, thường là protein.
Quang hợp là gì?|Chuyển năng lượng ánh sáng thành năng lượng hóa học trong các sinh vật phù hợp.
Diệp lục là gì?|Sắc tố tham gia hấp thụ ánh sáng trong quang hợp.
Hô hấp tế bào là gì?|Quá trình chuyển năng lượng từ chất dinh dưỡng sang dạng tế bào sử dụng.
Trao đổi chất là gì?|Các phản ứng hóa học giúp duy trì hoạt động sống.
Hệ sinh thái là gì?|Sinh vật và môi trường không sống tương tác trong một hệ.
Quần thể sinh vật là gì?|Các cá thể cùng loài sống trong một khu vực ở thời điểm xét.
Quần xã là gì?|Các quần thể khác loài cùng tồn tại và tương tác trong khu vực.
Chuỗi thức ăn là gì?|Dãy quan hệ ăn và bị ăn thể hiện truyền vật chất, năng lượng.
Lưới thức ăn là gì?|Các chuỗi thức ăn kết nối trong một hệ sinh thái.
Sinh vật sản xuất là gì?|Sinh vật tạo chất hữu cơ từ nguồn vô cơ bằng năng lượng phù hợp.
Sinh vật tiêu thụ là gì?|Sinh vật lấy vật chất và năng lượng qua việc ăn sinh vật hoặc nguồn hữu cơ.
Sinh vật phân giải là gì?|Sinh vật phân hủy chất hữu cơ và góp phần tái tuần hoàn vật chất.
Thích nghi sinh học là gì?|Đặc điểm giúp sinh vật phù hợp hơn với điều kiện sống qua quá trình tiến hóa.
Chọn lọc tự nhiên là gì?|Khác biệt sống sót và sinh sản làm thay đổi tần suất đặc điểm di truyền.
Đột biến là gì?|Thay đổi trong vật liệu di truyền; tác dụng tùy vị trí và hoàn cảnh.
Thụ phấn là gì?|Chuyển hạt phấn đến bộ phận nhận phấn phù hợp của cây.
Nảy mầm là gì?|Hạt bắt đầu phát triển thành cây non khi có điều kiện phù hợp.
Động vật có xương sống là gì?|Nhóm động vật có cột sống hoặc cấu trúc tương ứng trong phát triển.
Động vật không xương sống là gì?|Cách gọi các động vật không có cột sống.
`),
    ...group('chemistry', 'Hóa học phổ thông', `
Nguyên tử là gì?|Đơn vị của nguyên tố gồm hạt nhân và các electron.
Phân tử là gì?|Tập hợp các nguyên tử liên kết, biểu diễn một đơn vị của nhiều chất.
Nguyên tố hóa học là gì?|Loại nguyên tử có cùng số proton trong hạt nhân.
Hợp chất là gì?|Chất gồm các nguyên tố khác nhau liên kết theo cấu trúc hóa học.
Hỗn hợp là gì?|Sự kết hợp các chất không bắt buộc tạo chất hóa học mới.
Dung dịch là gì?|Hỗn hợp đồng nhất của chất tan trong dung môi.
Dung môi là gì?|Thành phần hòa tan chất khác trong dung dịch.
Chất tan là gì?|Thành phần được hòa tan trong dung môi.
Ion là gì?|Nguyên tử hoặc nhóm nguyên tử mang điện tích.
Proton mang điện gì?|Proton mang điện tích dương.
Electron mang điện gì?|Electron mang điện tích âm.
Neutron mang điện gì?|Neutron không mang điện tích tổng.
Đồng vị là gì?|Các nguyên tử cùng nguyên tố có số neutron khác nhau.
Số hiệu nguyên tử là gì?|Số proton trong hạt nhân nguyên tử.
Liên kết cộng hóa trị là gì?|Liên kết có sự dùng chung electron giữa các nguyên tử.
Liên kết ion là gì?|Tương tác liên kết giữa các ion trái dấu.
Phản ứng hóa học là gì?|Quá trình biến đổi các chất qua thay đổi liên kết và sắp xếp nguyên tử.
Chất xúc tác là gì?|Chất làm thay đổi tốc độ phản ứng và được tái tạo trong chu trình phản ứng.
Phản ứng tỏa nhiệt là gì?|Phản ứng truyền nhiệt ra môi trường theo điều kiện xét.
Phản ứng thu nhiệt là gì?|Phản ứng nhận nhiệt từ môi trường theo điều kiện xét.
pH biểu thị gì?|Đại lượng liên quan độ acid của dung dịch theo hoạt độ ion hydrogen.
Nước tinh khiết có công thức gì?|H₂O: mỗi phân tử gồm hai nguyên tử hydrogen và một oxygen.
Muối ăn thông thường có công thức gì?|Thành phần chính là sodium chloride, công thức NaCl.
Carbon dioxide có công thức gì?|CO₂: một nguyên tử carbon liên kết với hai nguyên tử oxygen.
Bảng tuần hoàn sắp xếp theo gì?|Các nguyên tố được sắp theo số hiệu nguyên tử và quan hệ tính chất.
`),
    ...group('music', 'Âm nhạc và nghệ thuật', `
Melody là gì?|Giai điệu, chuỗi cao độ được cảm nhận thành một tuyến nhạc.
Harmony là gì?|Sự kết hợp các cao độ và quan hệ hòa âm.
Rhythm là gì?|Nhịp điệu, cách sắp âm và khoảng lặng theo thời gian.
Tempo là gì?|Tốc độ của nhịp trong bản nhạc.
BPM nghĩa là gì?|Số nhịp mỗi phút, thường dùng mô tả tempo.
Timbre là gì?|Âm sắc giúp phân biệt nguồn âm dù cùng cao độ.
Pitch là gì?|Độ cao thấp được cảm nhận của âm.
Chord là gì?|Hợp âm, tổ hợp các nốt được nghe hoặc hiểu cùng nhau.
Scale âm nhạc là gì?|Dãy cao độ theo một cấu trúc khoảng cách nhất định.
Octave là gì?|Quãng tám; trong mô hình chuẩn, hai tần số có tỉ lệ 2:1.
Major key thường được hiểu thế nào?|Giọng trưởng theo hệ âm giai; cảm xúc thực tế còn phụ thuộc cách viết và diễn.
Minor key thường được hiểu thế nào?|Giọng thứ theo hệ âm giai; không có nghĩa mọi bản đều buồn.
Dynamics âm nhạc là gì?|Cách điều khiển mức mạnh nhẹ của âm khi diễn.
Crescendo là gì?|Tăng dần cường độ hoặc độ lớn khi diễn nhạc.
Decrescendo là gì?|Giảm dần cường độ hoặc độ lớn khi diễn nhạc.
Legato là gì?|Diễn các nốt nối liền, tạo dòng âm mượt.
Staccato là gì?|Diễn nốt tách và ngắn tương đối với cách nối liền.
Syncopation là gì?|Đặt nhấn lệch vị trí nhấn thường được mong đợi.
Counterpoint là gì?|Kết hợp các tuyến giai điệu có tính độc lập theo quan hệ âm nhạc.
Orchestration là gì?|Phân phối ý nhạc cho các nhạc cụ hoặc nhóm nhạc cụ.
A cappella là gì?|Âm nhạc bằng giọng hát không có nhạc cụ đệm theo cách gọi thông thường.
Instrumental là gì?|Nhạc chủ yếu do nhạc cụ thể hiện, không có tuyến lời hát chính.
Chorus bài hát là gì?|Đoạn điệp khúc thường lặp và mang ý hoặc giai điệu nổi bật.
Verse bài hát là gì?|Đoạn lời phát triển nội dung giữa các phần lặp.
Bridge bài hát là gì?|Đoạn chuyển hoặc tương phản nối các phần của bài.
`),
];
