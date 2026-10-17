# Chơi Coin Clicker trên máy của bạn

Bản 1.8: xu bạc, Gold và cầu vồng có mô hình 3D chuyển động. Di chuột lên xu bạc lớn để nghiêng theo hướng trỏ; bấm vẫn nhận Coin như cũ. **Cài đặt → Giảm chuyển động** giữ xu 3D đứng yên. Game tự dừng vẽ chuyển động khi ẩn tab/mở cửa sổ chức năng; máy không có WebGL vẫn dùng ảnh cũ và chơi bình thường. Sau cập nhật nhấn **Ctrl+F5**.

Bản 1.7: vào **Thẻ công nghệ**, bấm **Tháo thẻ** dưới ô đang dùng rồi **Trang bị thẻ** trên thẻ đã sở hữu. Thao tác này lưu bộ thẻ bạn chọn và tắt riêng **Auto chọn thẻ**; auto mua máy/nâng cấp bằng Coin giữ nguyên. Muốn game tự chọn lại, bật **Auto chọn thẻ** khi Auto nâng cấp đang bật.

Bản 1.6 bổ sung đủ 102 hình minh họa cho máy, nâng cấp, vật phẩm, thẻ, rương/chìa, thành tích, tổ hợp, quà ngày và cầu vồng. Các danh sách và cửa sổ chi tiết dùng chung hình theo từng loại.

Bản 1.5 có nền xu bạc chuyển động chậm. Vào **Cài đặt → Giảm chuyển động** để giữ nền tĩnh; lựa chọn được nhớ qua lần mở game. Nền tự tạm dừng khi chuyển tab hoặc mở cửa sổ chức năng. Sau cập nhật, nhấn **Ctrl+F5** để tải giao diện mới.

Từ bản 1.4, Turbo Mint, Power Tap và Golden Magnet cộng dồn tối đa **24 giờ mỗi loại**. Mỗi vật phẩm vẫn cộng thời lượng ghi trên mô tả; Time Warp nhận Coin tức thì. Gold dùng ảnh đồng xu rồng. Bầu trời xu vàng nằm phía trên vùng bấm và thu gọn khi chờ để đồng xu chính lớn hơn.

1. Giải nén toàn bộ thư mục, không chạy trực tiếp bên trong ZIP.
2. Máy cần Node.js 22.12 trở lên (máy phát triển đã có Node.js 24). Không cần cài thư viện npm để chơi bản ZIP đã build.
3. Nhấp đúp **Mo-Coin-Clicker.cmd**; giữ cửa sổ lệnh đang mở.
4. Game mở tại **http://127.0.0.1:5173/**. Nếu trình duyệt chưa tự mở, nhập địa chỉ này. Khi chơi xong, chờ **Đã lưu trên máy** rồi đóng tab và nhấn Ctrl+C trong cửa sổ lệnh.

Ảnh/font/mã đã có trong thư mục `dist`, không cần internet khi chơi. Dùng cùng địa chỉ, trình duyệt và hồ sơ để tiếp tục tiến trình cũ. Nhấp mở lại khi cùng bản game đang chạy sẽ mở trang game hiện có. Nếu cổng 5173 do ứng dụng khác hoặc bản game khác sử dụng, launcher báo lỗi để bạn đóng phiên đó; không tự đổi cổng hoặc dừng ứng dụng khác.

Tiến trình nằm trong IndexedDB của trình duyệt, **không nằm trong ZIP**. Trước khi chuyển máy, đổi hồ sơ hoặc xóa dữ liệu trình duyệt: vào **Thêm → Sao lưu → Xuất file save**. Nhập file có xem trước và xác nhận. Thay file game không đồng nghĩa xóa tiến trình.

Auto click 0,1 giây/lần và tự thu Gold luôn chạy. Bật **Auto nâng cấp** ở đầu xưởng để tự mua máy/nâng cấp bằng Coin và tối ưu thẻ trang bị nếu bật Auto chọn thẻ; Gold, vật phẩm và bản trùng thẻ được giữ lại. Offline tối đa 24 giờ, hiệu suất Coin 50% cộng bonus thẻ, Gold thu đầy đủ theo lịch sự kiện. Bộ lọc **Gần mục tiêu** hiện các mục đã mở và hai mục sắp tới; **Tất cả** cho xem toàn bộ 12 máy/30 nâng cấp. Có booster, sự kiện, thẻ/rương, thưởng ngày và thành tích. Hướng dẫn đầy đủ nằm trong menu Thêm.

Bản **1.8.0-rc.1** có giao diện theo chiều cao màn hình: đồng xu và mưa vàng bên trái, cửa hàng bên phải. Toàn bộ khung xưởng (nút auto, bộ lọc, máy, nâng cấp, vật phẩm) cuộn độc lập; màn hình hẹp dùng nút chuyển khu vực. Bấm thông báo cạnh Gold để xem thưởng offline. Cửa sổ chi tiết vẫn có thể cuộn khi nội dung dài.

**Thêm → Thống kê** mở danh sách vật phẩm kèm hình minh họa, tổng đã kiếm được, đã tiêu và hiện có. Bấm từng dòng để xem nguồn nhận/cách tiêu; tìm tên bằng ô tìm kiếm. Có tab riêng cho 12 thẻ và tab Tổng quan cho các thống kê cũ. Tổng được giữ qua những lần mở game trong cùng lượt chơi, reset tính lại từ đầu. Save cũ chưa có lịch sử đầy đủ sẽ hiện dấu **≥** cho mức tối thiểu đã biết; giao dịch mới được theo dõi đầy đủ. Sau khi cập nhật, nhấn **Ctrl+F5** tại địa chỉ game cũ.

Nhãn RC nghĩa là bản chờ chơi thử thực tế: mô phỏng và kiểm thử tự động đã thực hiện; âm thanh, cảm ứng trên thiết bị và phiên chơi dài vẫn cần trải nghiệm. Không cần tài khoản, quảng cáo hoặc máy chủ online.

Từ bản 1.3, **Cài đặt → Hiển thị số** chọn **Đầy đủ / Viết tắt** và tự nhớ lựa chọn. Tab **Tổng quan** trong Thống kê mở đầu bằng danh sách **Coin và hoạt động**: 19 dòng có hình, tên và giá trị; bấm vào để xem cách tính/nguồn chi tiết. Số dài không ngắt giữa chữ số; có thể cuộn ngang vùng số nếu cần. Danh sách vật phẩm và thẻ nằm bên dưới. Auto nâng cấp ưu tiên món đủ Coin theo hoàn vốn; nếu đang chờ, khung xưởng hiển thị mục tiêu, số còn thiếu và thời gian ước tính.
