# Giai đoạn 4 — boosters và sự kiện

Ngày 15/10/2026. Mã roadmap **P3**, app **0.4.0**, catalog **0.3.0**, save **schema 3**. Đây là game local cá nhân; giữ nguyên địa chỉ và dữ liệu của các giai đoạn trước.

## Những phần đã triển khai

| Vật phẩm      | Tác dụng                         | Nối thời gian tối đa             | Giá Gold |
| ------------- | -------------------------------- | -------------------------------- | -------- |
| Turbo Mint    | ×2 CPS trong 60 giây             | 120 giây còn lại                 | 10       |
| Power Tap     | ×3 sức nhấn trong 30 giây        | 60 giây còn lại                  | 10       |
| Golden Magnet | Thu hộ xu vàng trong 30 giây     | 60 giây còn lại                  | 15       |
| Time Warp 1h  | Coin bằng CPS thường trực ×3.600 | Không có hiệu ứng theo thời gian | 40       |

Quầy bốn vật phẩm được kéo lên từ P4 để mọi booster có nguồn kiếm lặp lại ngay trong P3. Không có quà debug hoặc đường mua bằng tiền thật. Rương, thẻ, chìa, daily vẫn dành cho giai đoạn sau. Giá này là bộ cân bằng khởi đầu, chưa qua buổi chơi thật 30 phút.

Mở **SHOP → Vật phẩm** để đổi Gold. Mở **Kho tăng tốc**, chọn một vật phẩm, xem lượng Coin/thời gian sau dùng rồi xác nhận. Nếu kho hết, thiếu máy cho Time Warp hoặc thời gian đã chạm cap, nút dùng bị khóa; engine cũng kiểm tra lại.

## Sự kiện

- Mưa vàng: chờ 180–300 giây chơi chủ động, kéo dài 15 giây; 10 xu xuất hiện cách nhau 1 giây. Mỗi xu sống tối đa 6 giây, không quá cuối đợt; mỗi xu cho 1 Gold cơ bản.
- Cầu vồng: mở khi tổng sản xuất đạt 10.000 Coin; chờ 600–900 giây chủ động; tồn tại 8 giây. Chạm để bật Frenzy 20 giây, ×3 CPS/click và ×2 Gold. Thu thêm nối thời gian còn lại, tối đa 40 giây.
- Thời gian chờ tiếp theo được chọn ngay khi bắt đầu đợt và tính từ cuối đợt; bỏ lỡ sự kiện vẫn giữ lịch đó. Giai đoạn spawning/active/finished/cooldown được suy ra từ timer và vật thể, không giữ thêm enum dễ lệch với timestamp.
- Mỗi xu có ID ổn định, mốc sinh/hết hạn, vị trí và hàng. Thu xong loại ID trong cùng giao dịch với phần thưởng. Xu chưa sinh/hết hạn/đã thu đều bị từ chối.
- RNG xorshift32 được lưu; cùng runId/seed, thời gian và command tạo cùng kết quả. Số frame và việc mở modal không gọi RNG.
- Vùng sự kiện riêng tránh chạm nhầm cửa hàng. Nút vàng có hitbox 48×52 px; cầu vồng có hàng riêng. Chế độ giảm chuyển động dừng nhấp sáng, giữ nguyên vùng chạm và luật thưởng. Không dùng collider cho trang trí.

## Hiệu ứng và thời gian

Pipeline thường trực: cộng bonus phẳng, cộng phần trăm trong từng nhóm, nhân các nhóm. Pipeline tạm thời lấy hệ số mạnh nhất trong cùng nhóm, nhân các nhóm độc lập và chặn ở ×20 mỗi chỉ số. Trần này không cắt nâng cấp thường trực. Gold và Magnet là target riêng, không lấy hệ số CPS.

Tick tính sản lượng theo millisecond đơn điệu, chia đoạn ở thời điểm effect bắt đầu/hết hạn. Vì vậy một callback dài đi qua mốc hết Turbo/Frenzy vẫn nhận đúng từng đoạn. Scheduler cũng xử lý từng mốc spawn/expire; Magnet dùng hệ số Gold tại đúng mốc thu.

Effect có hạn thời gian thực. Đồng hồ lịch nhảy tới trước làm effect hết hạn mà không tạo sản lượng cho phần giờ nhảy qua; đồng hồ lùi không làm mốc hiệu ứng đi lùi. `events.activeMs` chỉ tăng khi mô phỏng đang chạy. Chuyển nền/đóng game bỏ vật thể chưa thu, tạm dừng lịch chờ và giữ RNG; offline dùng CPS thường trực, không có bonus tạm thời. Một đợt bị bỏ không được phát lại khi tải lại.

Time Warp quyết toán thời gian chơi thật đang chờ như mọi command, rồi cộng thưởng một lần theo CPS thường trực. Nó không giả lập thêm một giờ, không đẩy effect/sự kiện hay thay thời gian UTC.

## Lưu và mở rộng

`session.commitCommand` là đường bắt buộc cho `PurchaseItem`, `UseBooster`, `CollectEvent`. Snapshot dự kiến chưa được công bố trong lúc ghi; chỉ cập nhật state sau commit. Ghi lỗi giữ nguyên vật phẩm/Gold/phần thưởng, cho thử lại. Trong lúc ghi, command khác bị khóa.

Magnet chạy cùng tick, cộng Gold và loại ID đồng thời; session yêu cầu autosave ngay. Các thu nhập chưa commit vẫn có thể mất khi đóng cưỡng bức. Không tuyên bố IndexedDB ghi thành công trước sự kiện hoàn tất. Backup và xuất/nhập vẫn dùng các module của P2.

Save schema 1/2 được kiểm tra checksum rồi chuyển sang schema 3; giữ toàn bộ tiến trình cũ, thêm kho/effect rỗng và seed ổn định. Sửa catalog có thể cần migration mới khi thay hệ số hoặc thời lượng của hiệu ứng đang lưu; không chỉ đổi số rồi bỏ qua hợp đồng save.

Các file cần sửa được liệt kê trong `02-architecture.md`. Quy tắc giá và thời gian nằm trong JSON; React chỉ đọc preview/selector và gửi command. Giới hạn hiện tại: 9.999 vật phẩm/loại, tối đa 10 xu mỗi đợt mưa, Coin/Gold trong miền Amount của dự án.

## Kiểm tra

Test tự động bao phủ pipeline, cap, nối thời gian, tick qua hạn hiệu ứng, Time Warp, sinh/thu/hết hạn/thu trùng, Magnet/Frenzy, seed, mở khóa cầu vồng giữa tick, chuyển nền, commit chậm/lỗi, schema và luồng UI đổi Gold rồi dùng booster. Test DOM/IndexedDB mô phỏng không thay thế trình duyệt thật.

Trong phiên này công cụ trình duyệt trả về danh sách rỗng. Chưa xác minh trực quan desktop/360 px, tốc độ khung hình, cảm ứng hoặc buổi chơi liên tục 15–30 phút. Kết quả lệnh kiểm tra/build ghi tại `06-testing-release.md`.
