# Giao diện gọn trong một màn hình — 1.0.0-rc.2

## Cách dùng

- Desktop: luôn thấy đồng xu, số Coin, CPS, vùng thu Gold và cửa hàng cùng lúc. Lưu ngay và Cài đặt ở góc trên bên phải.
- Máy đúc / Nâng cấp / Vật phẩm: dùng mũi tên Trang trước / Trang sau. Số món mỗi trang tự thay đổi theo diện tích còn lại; bộ lọc và các mức mua ×1 / ×10 / ×100 / Max vẫn hoạt động.
- Màn hình rộng tối đa 720 px: bấm Chơi & mưa vàng hoặc Xưởng nâng cấp để đổi khu vực. Đổi khu vực không tạo lại phiên chơi; số Coin vẫn hiển thị ở nút cửa hàng.
- Bấm thông báo cạnh Gold để xem thưởng offline, sau đó Tiếp tục chơi để đóng thông báo. Khoản thưởng vẫn do cơ chế quyết toán/lưu cũ xử lý.
- Bấm Hiệu ứng đang hoạt động để xem thời gian còn lại. Thành tích, thẻ, rương và kho tăng tốc vẫn có nút riêng; hướng dẫn, sao lưu và tiến độ trong Thêm.
- Mục tiêu tiếp theo và lối vào thống kê ở thanh dưới. Các cửa sổ chi tiết dài vẫn cuộn bên trong khi cần. Với cửa sổ quá thấp hoặc phóng rất lớn, từng vùng chơi cho phép cuộn dự phòng để không mất nút.

## Nơi sửa sau này

| Phần                                                                 | File sở hữu                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------------- |
| Ghép các khu vực, điều hướng, thông báo                              | `src/app/App.tsx`                                             |
| Khung theo viewport, hai cột, chuyển khu vực trên màn hình hẹp       | `src/app/app.css`                                             |
| Danh sách tự đo chiều cao bằng ResizeObserver, phân trang dùng chung | `src/ui/components/PaginatedList.tsx`, `pagination.css`       |
| Máy, nâng cấp, vật phẩm                                              | `src/features/shop/ShopPanel.tsx`, `ItemShop.tsx`, `shop.css` |
| Đồng xu theo diện tích còn lại                                       | `src/features/clicker/clicker.css`                            |
| Ô thu Gold và cầu vồng                                               | `src/features/events/EventField.tsx`, `events.css`            |
| Thanh mục tiêu / thống kê                                            | `src/ui/layout/JourneyPanel.tsx`, `journey.css`               |
| Nhãn tiếng Việt                                                      | `src/locales/vi.json`                                         |

Không đặt lại CSS khung màn chơi trong file booster. `PaginatedList` chỉ nhận dữ liệu/renderer; không đọc state kinh tế hay ghi save. Khi chuyển bộ lọc/tab, danh sách trở về trang đầu; nếu danh sách ngắn lại hoặc đổi kích thước cửa sổ, trang hiện tại được giới hạn trong phạm vi hợp lệ. Modal chi tiết giữ thông tin dài thay vì kéo dài thẻ mua.

## Kiểm tra

- Kiểm thử tương tác: đi hết 12 máy và 30 nâng cấp, đổi bộ lọc/tab, thay đổi số dòng/trang, danh sách rỗng, mua đúng vật phẩm ở trang cuối.
- Kiểm tra layout trên trình duyệt Edge headless dùng profile riêng và server tạm; không truy cập save của người chơi. Ảnh và số đo được lưu tạm trong `tmp/layout-qa/`.
- Catalog và save schema giữ nguyên; không cần chuyển đổi tiến trình cho thay đổi giao diện này.

Kết quả ngày 16/10/2026: `npm run check` qua toàn bộ 226 kiểm thử/28 file, kiểm tra kiểu, lint, kiến trúc, catalog và định dạng; `npm run build` thành công. Edge headless đã kiểm tra 32 trường hợp (màn chơi và ba tab cửa hàng tại mỗi kích thước): 1920×872, 1536×698, 1366×768, 1024×650, 768×600, 390×844, 360×640, 320×568. Ở các trường hợp này, tài liệu không tràn ngang/dọc và cửa hàng không cần cuộn. Đã xem ảnh desktop và màn hình hẹp. Kiểm tra responsive trong trình duyệt không thay thế kiểm tra cảm ứng/âm thanh trên thiết bị thật.
