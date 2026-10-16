# Auto và offline 24 giờ — 1.1.0-rc.1

Quy tắc mua đã cập nhật ở bản **1.3.0-rc.1**: ưu tiên món đủ Coin, hiển thị mục tiêu và số còn thiếu. [Chi tiết sửa auto và tùy chọn hiển thị số](16-auto-display-fixes.md). Thông tin chiến lược dưới đây mô tả bản 1.1 ban đầu.

## Cách chơi

- **Auto click luôn bật:** 1 click mỗi 100 ms, tương đương 10 click/giây. Click thủ công cộng thêm. Con số Coin/giây trên màn hình chính gồm máy + auto click; thống kê vẫn tách nguồn.
- **Auto Gold luôn bật:** thu Gold ngay khi xuất hiện, không cần Golden Magnet. Lịch mưa tiếp tục khi offline. Xu cầu vồng vẫn do người chơi chạm để bật Frenzy.
- **Auto nâng cấp:** nút Bật/Tắt ở đầu Xưởng nâng cấp, lưu cùng tiến trình. Mặc định tắt cả ở lượt mới và khi chuyển save cũ. Khi tắt, auto click và Gold vẫn hoạt động.
- **Phạm vi chi tiêu:** chỉ mua máy và nâng cấp shop bằng Coin. Tự chọn bộ thẻ trang bị đang sở hữu. Giữ Gold, rương, chìa, booster, cấp độ và bản trùng thẻ để người chơi tự quyết định. Không tự nhận daily/thành tích, không mở rương, không reset.
- **Cuộn xưởng:** toàn bộ nội dung khung xưởng có thể cuộn lên/xuống; bỏ phân trang. Màn hình chơi giữ nguyên vị trí. Trên màn hình hẹp, chuyển sang Xưởng nâng cấp rồi cuộn trong khung.

## Chiến lược mua

1. Tính thu nhập thường trực = sản lượng máy + 10 × sức nhấn; offline nhân thêm hiệu suất offline.
2. Chọn tổ hợp thẻ cho thu nhập cao nhất từ các thẻ đang có, có xét bonus tổ hợp và số ô. Khi thu nhập bằng nhau, ưu tiên bonus Gold; nếu vẫn bằng nhau, giữ bộ hiện tại để tránh đổi liên tục.
3. Xét mỗi lần mua 1 máy và các nâng cấp đủ điều kiện. Với máy chưa mở, tính thêm thời gian đạt mốc tổng sản xuất.
4. Điểm ưu tiên = thời gian chờ đủ tiền/mở khóa + giá / thu nhập tăng thêm. Nâng sức nhấn được tính đủ 10 click/giây.
5. Chọn điểm thấp nhất; nếu bằng điểm thì ưu tiên giá thấp hơn. Có thể dành tiền cho món tốt hơn thay vì chi ngay. Sau mỗi giao dịch, tính lại.

Đây là chiến lược tham lam ưu tiên hoàn vốn, không cam kết kết quả tối ưu toàn cục. Bộ chọn thẻ xét các tổ hợp hợp lệ; bộ nhớ đệm và loại tổ hợp bị trội giúp giảm thời gian tính mà vẫn so sánh chính xác số thập phân. Các ô thẻ mở theo tổng sản xuất, không theo tiền còn trong ví.

## Offline

- Tối đa **86.400 giây (24 giờ)** mỗi khoảng vắng mặt. Quá giới hạn không nhận bù ở lần mở sau. Đồng hồ lùi không nhận thêm.
- Coin từ máy và auto click: hiệu suất mặc định 50%, cộng bonus thẻ, tối đa 100%. Gold được thu theo lịch đầy đủ, không nhân 50%.
- Nếu bật auto nâng cấp, mô phỏng từng thời điểm mua và thay bộ thẻ. Máy mua sau 5 giờ chỉ tạo thu nhập từ thời điểm mua, không áp dụng ngược cho 5 giờ trước.
- Hiệu ứng đã dùng tiếp tục đến thời điểm hết hạn; auto không tiêu vật phẩm mới. Cầu vồng không tự kích hoạt khi offline.
- Thông báo ghi tổng Coin kiếm được, Gold, số thao tác auto và Coin đã chi; ví là phần còn lại sau chi tiêu.
- Khoảng dài có bật auto được tính trong Web Worker; giao diện giữ phản hồi và chỉ cho chơi tiếp sau khi ghi kết quả thành công. Worker không truy cập IndexedDB.

## Cấu trúc file

| Nơi chỉnh                                   | Trách nhiệm                                                 |
| ------------------------------------------- | ----------------------------------------------------------- |
| `src/core/automation/constants.ts`          | Chu kỳ click và giới hạn kiểm tra lại                       |
| `src/core/automation/integrate-income.ts`   | Tích phân máy, click rời rạc, thời điểm hết hiệu ứng        |
| `src/core/automation/loadout.ts`            | Thu nhập thường trực, chọn bộ thẻ, cache tổ hợp             |
| `src/core/automation/upgrade-planner.ts`    | Điểm ưu tiên, điều kiện mua, chờ đủ tiền, snapshot thu nhập |
| `src/core/automation/advance-game.ts`       | Chia mốc thời gian, hợp nhất Coin/Gold/mua và thống kê      |
| `src/core/offline/settle-offline.ts`        | Giới hạn 24 giờ, checkpoint, tổng kết offline               |
| `src/platform/time/offline-worker.ts`       | Chạy phép tính trong worker                                 |
| `src/platform/time/settle-offline-async.ts` | Vòng đời worker, lỗi và kết thúc worker                     |
| `src/features/automation/`                  | Nút bật/tắt, mô tả phạm vi và thao tác gần nhất             |
| `src/features/shop/`                        | Tab, bộ lọc, toàn bộ danh sách trong khung cuộn             |
| `src/content/balance.json`                  | Hiệu suất và giới hạn offline                               |
| `src/platform/storage/save-codec.ts`        | Schema 6, migration, kiểm tra dữ liệu                       |
| `src/locales/vi.json`                       | Toàn bộ nhãn giao diện và hướng dẫn                         |

Lõi không phụ thuộc React, DOM, storage hoặc worker. UI chỉ gửi command; không tự cộng Coin hay mua vật phẩm. Giữ ID nội dung ổn định khi phát triển tiếp; thay cấu trúc save phải thêm migration và fixture.

## Chuyển save

Schema 1–5 chuyển sang schema 6/catalog 0.7.0. Giữ số dư, sở hữu, RNG, receipt và lịch nhận thưởng. Auto nâng cấp mặc định tắt. Khoảng offline trước lần cập nhật đầu không được cấp bù auto click; lần quyết toán đầu cập nhật snapshot sức nhấn cho các khoảng sau. Không sửa/xóa kho tiến trình thật khi chạy kiểm thử.

## Kiểm tra

Các ca chính nằm ở `tests/unit/automation.test.ts`, `tests/integration/automation-session.test.tsx`, `tests/integration/offline-worker.test.ts` và các bộ kiểm tra engine/offline/save hiện có. Bao phủ mốc 99 + 1 ms qua save, click tại lúc hết boost, callback dài/ngắn, Gold một lần, bật/tắt qua reload và lỗi ghi, giữ tài nguyên dự trữ, bộ thẻ tối ưu, offline 48 giờ chỉ nhận 24 giờ, sổ Coin và quyết toán không trùng.

Kiểm tra UI bằng Edge headless dùng hồ sơ riêng ở 8 kích thước, từ 320×568 đến 1920×872. Kiểm tra cuộn tới nút cuối mỗi khung, không cuộn toàn trang, bật/tắt và tải lại. Bản cân bằng cũ trong `docs/balance/` là lịch sử trước auto; các con số không còn đại diện tốc độ bản mới.

Kết quả ngày 16/10/2026: `npm run check` đạt 242 kiểm thử/30 file, typecheck, lint, ranh giới module, catalog và định dạng đều đạt; build thành công. 32 ca giao diện đạt. Worker bản build tính 24 giờ với đủ 12 thẻ trong khoảng 7 giây trên máy kiểm tra, kết quả trùng lõi và giao diện vẫn phản hồi; thời gian thực tế phụ thuộc máy và tiến trình. Các thao tác kiểm tra dùng hồ sơ trình duyệt riêng, không sửa save đang chơi.
