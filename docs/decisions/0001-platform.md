# 0001 - Một ứng dụng web local

Ngày: 14/10/2026. Cập nhật: 15/10/2026. Trạng thái: áp dụng cho P0-P3.

## Quyết định

React + TypeScript + Vite; một package npm, một repo Git local. Không backend, đăng nhập, quảng cáo hoặc dịch vụ trả phí. Dùng trình duyệt Chrome/Edge trên Windows hiện tại trước; chỉ kiểm tra thêm điện thoại khi thực sự cần.

Dev và preview đều dùng `127.0.0.1:5173`, `strictPort: true`, chỉ bind loopback. Không tự chuyển port vì dữ liệu trình duyệt ở các origin khác nhau không dùng chung. README chỉ hướng dẫn địa chỉ này.

`vite preview` phục vụ bản build trên máy, không phải backend gameplay hay server công khai. Cài thư viện cần mạng; bản build tự chứa font, icon, ảnh và JavaScript.

## Phạm vi P0

Dựng nền và giao diện có thể xem/thử. Coin không tăng khi chạm; mua máy và lưu tiến trình chưa được nối. Khi P1 bắt đầu, triển khai engine theo các hợp đồng đã đặt trong `core`.

## Cập nhật P1

Đã nối click và lưu IndexedDB. Origin cố định vẫn giữ nguyên. Web Locks, IndexedDB và Web Crypto cần khả dụng; lỗi quyền lưu hoặc môi trường không hỗ trợ được báo rõ. Cài đặt hiển thị vẫn chỉ giữ theo phiên. Xem `docs/04-save-format.md` về giới hạn lưu trên trình duyệt.

## Cập nhật P2

Shop, offline và hai backup vẫn chạy hoàn toàn local. IndexedDB giữ tiến trình schema 2 và backup; localStorage chỉ giữ tùy chọn hiển thị/âm/rung. Xuất/nhập JSON giúp tự chuyển hoặc cất bản sao. Không thêm server, tài khoản hoặc đồng bộ cloud. Giữ nguyên origin để đọc và tự chuyển đổi save P1.

## Cập nhật P3

Sự kiện và booster tiếp tục chạy trong lõi local, không thêm server thời gian. RNG được lưu để giữ kết quả khi reload. Thời gian thực điều khiển hạn effect; đồng hồ chủ động điều khiển sự kiện. Vật thể dùng nút DOM/CSS trong vùng riêng vì tối đa 10 xu mưa và một cầu vồng; chưa cần Canvas hoặc thư viện animation.

## Xem xét lại khi

Chỉ đánh giá đóng gói desktop/mobile nếu người dùng yêu cầu một bản cài riêng. Không tạo adapter hay package trống dự phòng cho nhu cầu này.
