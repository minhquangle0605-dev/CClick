# Hình ảnh và giao diện

Nhận diện: nền navy sâu, bạc/xanh băng, đồng xu ngôi sao bốn cánh. Vàng dùng cho tiền hiếm, tím nhạt cho thẻ, xanh ngọc cho rương. Tên hiển thị chính: Coin Clicker.

## Tài nguyên hiện tại

- `src/assets/images/coins/coin-silver-star.svg`: SVG tạm dựng mới trong dự án theo mô tả hình tham chiếu người dùng. Chưa phải file ảnh gốc hoặc bản tách nền bằng AI.
- `public/icons/coin.svg`: icon ứng dụng đơn giản cùng chủ đề.
- Icon giao diện: lucide-react, giấy phép ISC theo package.
- Font: Manrope từ `@fontsource-variable/manrope`, đóng gói local; xem giấy phép OFL trong package.

Giữ file SVG chỉnh sửa được trong repo. Khi có bitmap gốc và tạo bản sản xuất, lưu bản gốc ở `assets-source/coins`, bản tối ưu ở `src/assets/images/coins`, cập nhật manifest và ghi nguồn. Không tạo ảnh gốc giả hoặc tên `transparent` cho ảnh còn nền.

## UI P0

- Desktop: hành trình trái, xu giữa, shop phải; bên dưới là các nhóm gameplay sắp xây dựng.
- Màn hẹp: ưu tiên xu và shop; panel hành trình phụ được ẩn, shop xuống dưới trên điện thoại.
- Tab shop và nút xem chi tiết hoạt động. Nội dung tương lai chỉ mở phần giới thiệu, không làm giả việc nhận thưởng.
- Cài đặt có giảm chuyển động và bật/tắt vầng sáng, tác động thật trong phiên hiện tại.
- Font chữ, màu và viền trong `ui/styles`; CSS riêng theo tính năng.
- Modal dùng native dialog cho focus trap, Escape và trả focus; bàn phím Enter/Space kích hoạt xu như nút thông thường.

P0 chỉ là bản xem trước và phải ghi rõ chưa tích lũy Coin. Từ P1, click và save đã hoạt động: hiển thị trạng thái lưu thật, chỉ báo thành công khi giao dịch hoàn tất; các phần chưa mở như mua máy vẫn ghi giai đoạn dự kiến.
