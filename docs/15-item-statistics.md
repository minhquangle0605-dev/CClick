# Thống kê vật phẩm — 1.2.0-rc.1

## Cách xem

Mở **Thống kê** ở thanh cuối màn hình hoặc **Thêm → Thống kê**. Tab mặc định **Vật phẩm** liệt kê cả 7 món, kể cả món chưa có: 4 booster, 2 rương và Chìa sao. Tab **Thẻ công nghệ** liệt kê 12 thẻ. Tab **Tổng quan** giữ thống kê Coin, Gold, nguồn thu, auto và mốc sản xuất trước đây.

Mỗi dòng gồm hình minh họa riêng, tên, loại/cấp thẻ, **Đã kiếm được / Đã tiêu / Hiện có**. Bấm dòng hoặc dùng Enter/Space để mở chi tiết nguồn nhận, cách tiêu và mô tả. Ô tìm kiếm lọc theo tên. Danh sách cuộn trong cửa sổ thống kê; màn hình nhỏ xếp các số xuống dưới tên.

## Quy tắc đếm

Thống kê tích lũy trong toàn bộ lượt chơi hiện tại, qua reload, offline và xuất/nhập save. Bắt đầu lượt mới bằng RESET sẽ tạo lịch sử mới; bản trước reset vẫn có lịch sử cũ. Nhập/khôi phục save lấy lịch sử của chính snapshot đó, không cộng lịch sử từ hai lượt khác nhau.

| Hành động                          | Ghi nhận                                              |
| ---------------------------------- | ----------------------------------------------------- |
| Đổi Gold mua vật phẩm              | Nhận từ cửa hàng                                      |
| Nhận thưởng ngày/thành tích/rương  | Nhận theo nguồn tương ứng                             |
| Nhận rương mốc khởi đầu            | Nhận từ quà mốc, một lần                              |
| Dùng booster, kể cả Time Warp      | Tiêu 1 vật phẩm kích hoạt                             |
| Mở rương bạc/vàng                  | Tiêu 1 rương; rương vàng tiêu thêm 1 chìa             |
| Nhận thẻ hoặc bản trùng            | Nhận theo số bản                                      |
| Nâng cấp thẻ                       | Tiêu đúng số bản trùng yêu cầu; Coin vẫn theo sổ Coin |
| Bản trùng chuyển Gold ở cấp tối đa | Ghi số bản đã chuyển vào mục tiêu                     |
| Trang bị/tháo/tự tối ưu thẻ        | Không tiêu thẻ                                        |
| Auto mua máy/nâng cấp bằng Coin    | Không đổi lịch sử vật phẩm                            |

Với thẻ, **hiện có = 1 bản sở hữu + bản trùng còn lại**. Cấp thẻ hiển thị riêng. Khi nhận thẻ đã ở cấp tối đa, cùng giao dịch ghi cả nhận bản thẻ và tiêu bản đó để chuyển Gold. Khi nâng lên cấp tối đa, bản trùng còn dư cũng được ghi tiêu khi chuyển.

Số lượng bộ đếm dùng số nguyên an toàn, tối đa `Number.MAX_SAFE_INTEGER`. Không ghi bộ đếm ở animation hoặc khi mở UI. Kho, lịch sử, phần thưởng, RNG và receipt được commit cùng payload. Lỗi lưu giữ trạng thái cũ; tải lại receipt chưa xem không cấp thưởng/ghi số lần thứ hai.

## Save cũ

Schema 1–6 chưa lưu đầy đủ số nhận/tiêu của từng món. Chuyển lên schema 7 giữ nguyên tài nguyên, dùng số đang có làm **tồn đầu**, đặt nguồn nhận/tiêu mới bằng 0 và đánh dấu lịch sử chưa đầy đủ. Không thể khôi phục chính xác những vật phẩm đã dùng trước bản cập nhật.

- Tổng đã kiếm được hiển thị **≥ tồn đầu + số nhận mới**.
- Tổng đã tiêu hiển thị **≥ số tiêu mới**.
- Hiện có luôn là số thực trong kho; chi tiết cho biết tồn đầu và số giao dịch đã ghi nhận.
- Mốc hiển thị là checkpoint của save trước khi chuyển, được ghi rõ trong UI; ngày hiển thị theo giờ Việt Nam.
- Lượt mới tạo ở schema 7 có lịch sử đầy đủ từ đầu và không cần dấu ≥.

## Cấu trúc file

| File                                             | Trách nhiệm                                             |
| ------------------------------------------------ | ------------------------------------------------------- |
| `src/core/statistics/item-history.types.ts`      | Kiểu lịch sử, danh sách nguồn nhận/cách tiêu            |
| `src/core/statistics/item-history.ts`            | Khởi tạo, ghi giao dịch bất biến, tính tổng             |
| `src/core/rewards/grant-rewards.ts`              | Điểm ghi nhận thưởng chung, bao gồm bản thẻ chuyển Gold |
| `src/core/shop/purchase-item.ts`                 | Nhận vật phẩm qua cửa hàng                              |
| `src/core/boosters/use-booster.ts`               | Ghi dùng booster                                        |
| `src/core/chests/commands.ts`                    | Ghi rương/chìa tiêu và quà khởi đầu                     |
| `src/core/cards/commands.ts`                     | Ghi bản trùng tiêu khi nâng/chuyển                      |
| `src/platform/storage/item-history.schema.ts`    | Kiểm tra số nguyên, ID, cách tiêu và cân bằng kho       |
| `src/platform/storage/save-codec.ts`             | Migration và checksum schema 7                          |
| `src/features/statistics/StatisticsPanel.tsx`    | Chuyển ba tab thống kê                                  |
| `src/features/statistics/ItemStatisticsList.tsx` | Tìm kiếm, danh sách và chi tiết                         |
| `src/features/statistics/OverviewStatistics.tsx` | Giữ phần tổng quan trước đây                            |
| `src/features/statistics/statistics.css`         | Bố cục danh sách và đáp ứng màn hình                    |
| `src/ui/components/ItemArtwork.tsx`              | Hình SVG cục bộ theo ID, có tên truy cập                |
| `src/locales/vi.json`                            | Nhãn `itemStats.*` tiếng Việt                           |

Khi thêm vật phẩm: khai báo catalog/locale, bổ sung hình theo ID trong `ItemArtwork`, nhận thưởng qua `grantRewards` và ghi tiêu cùng giao dịch trong lõi. Danh sách đọc catalog tự động. Nếu thêm loại nguồn/cách tiêu, cập nhật types, validator và nhãn hiển thị cùng lúc; không đặt phép tính kho trong React.

## Kiểm chứng

- `npm run check`: 268 test ở 32 file đạt, typecheck, lint, kiến trúc, catalog và định dạng đạt.
- `npm run build`: tạo bản local thành công.
- Test mới kiểm tra nguồn nhận, cả 4 booster, rương/chìa, bản trùng nâng/chuyển Gold, lỗi lưu/retry, reload, offline auto, reset, migration 1–6 và lịch sử sai.
- Kiểm tra Edge headless: 25 ca giao diện ở 6 kích thước từ 320×568 đến 1920×872, gồm danh sách, dòng mở rộng, thẻ, tổng quan và save cũ; không tràn ngang, dòng cuối truy cập được. Reload giữ số nhận/tiêu. Dùng dữ liệu thử và hồ sơ riêng, không đụng save đang chơi. Báo cáo và ảnh cục bộ ở `tmp/item-statistics-qa/`.
