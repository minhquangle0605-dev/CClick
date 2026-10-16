# Giai đoạn 5 — thẻ, tổ hợp và rương

Ngày 15/10/2026. Roadmap **P4**, app **0.5.0**, catalog **0.4.0**, save **schema 4**. Chạy local tại địa chỉ cũ, giữ tiến trình từ các giai đoạn trước. Chưa triển khai thưởng ngày, thành tích, thống kê đầy đủ hoặc reset của P5.

## Cách chơi

1. Đạt tổng **sản xuất** 1.000 Coin, mở **Rương & chìa** và nhận rương bạc đầu tiên. Mỗi run chỉ nhận mốc này một lần; Coin được tặng trong rương không đẩy mốc sản xuất.
2. Xem phần thưởng chắc chắn và các bảng xác suất, rồi bấm mở. Rương bạc không cần chìa; rương vàng cần 1 Chìa sao.
3. Kết quả xuất hiện sau khi lưu thành công. Bấm **Đã xem kết quả** để mở rương khác; đóng màn hoặc tải lại vẫn xem được kết quả cũ. Nút **Xem lại kết quả gần nhất** không phát thưởng.
4. Mở **Thẻ công nghệ**, chọn thẻ đã có để xem chỉ số trước/sau trang bị. Hai ô dùng ngay; ô thứ ba mở ở tổng sản xuất 1.000.000 Coin. Tháo thẻ giữ nguyên cấp và số bản trùng.
5. Khi đủ bản trùng và Coin, xem giá rồi **Xác nhận nâng 1 cấp**. Chỉ thẻ đang trang bị tạo bonus, tổ hợp tự bật khi đủ các thẻ được yêu cầu.

## Danh mục thẻ

Hiệu ứng dưới đây tính **mỗi cấp**, cộng dồn tuyến tính từ cấp 1 đến 10. Các số là bộ cân bằng khởi đầu của Coin Clicker, chưa được tinh chỉnh bằng buổi chơi thật.

| ID                  | Tên                | Bậc    | Hiệu ứng mỗi cấp khi trang bị            |
| ------------------- | ------------------ | ------ | ---------------------------------------- |
| card.silver-touch   | Chạm bạc           | Thường | +5% sức nhấn                             |
| card.mint-gear      | Bánh răng đúc      | Thường | +4% CPS                                  |
| card.steady-hand    | Bàn tay vững       | Thường | +1 sức nhấn nền                          |
| card.dusk-battery   | Pin hoàng hôn      | Thường | +2 điểm phần trăm hiệu suất offline      |
| card.rain-lens      | Thấu kính mưa      | Thường | +0,3 giây tuổi thọ xu mưa                |
| card.gold-chip      | Mạch vàng          | Thường | +1 Gold cơ bản/xu mưa                    |
| card.rainbow-finder | Dò cầu vồng        | Hiếm   | −2% thời gian chờ cầu vồng mới           |
| card.frenzy-core    | Lõi Frenzy         | Hiếm   | +1 giây Frenzy mới                       |
| card.rain-cloud     | Mây tích vàng      | Hiếm   | +0,5 giây đợt mưa, +0,4 giây tuổi thọ xu |
| card.clockwork      | Nhịp máy           | Hiếm   | +8% CPS                                  |
| card.star-forge     | Lò sao             | Sử thi | +12% CPS và +8% sức nhấn                 |
| card.prism-heart    | Trái tim lăng kính | Sử thi | +15% sức nhấn và +1 giây Frenzy mới      |

| Tổ hợp             | Cần cùng trang bị         | Bonus thêm một lần    |
| ------------------ | ------------------------- | --------------------- |
| Dây chuyền đồng bộ | Bánh răng đúc + Nhịp máy  | +25% CPS              |
| Thời tiết vàng     | Mạch vàng + Mây tích vàng | +1 Gold cơ bản/xu mưa |
| Mạch cầu vồng      | Dò cầu vồng + Lõi Frenzy  | +5 giây Frenzy mới    |

Cộng các phần trăm thẻ/tổ hợp trong nhóm thẻ rồi nhân sau nhóm nâng cấp. Bonus click phẳng cộng vào nền trước các nâng cấp. Time Warp và offline dùng CPS thường trực đã gồm thẻ; booster/Frenzy vẫn là nhóm tạm thời riêng. Gold thêm từ thẻ chỉ áp dụng xu mưa (thu tay hoặc Magnet), rồi mới nhân Frenzy; Gold từ rương không nhận các hệ số này.

Hiệu suất offline tối đa 100%; thời gian chờ cầu vồng không thấp hơn 50% mặc định; đợt mưa tối đa 30 giây, tuổi thọ xu tối đa 12 giây; Frenzy tối đa 60 giây. Đây là trần bảo vệ cấu hình, không có nghĩa mọi trần đều đạt được với bộ 12 thẻ hiện tại. Bonus kéo dài Frenzy cũng tăng trần nối thời gian từ 40 giây lên tối đa 60 giây.

**Quy tắc thời gian:** trang bị/tháo cập nhật CPS, click, hiệu suất offline và Gold hiện tại. Các bonus về thời lượng/lịch chờ chỉ dùng khi tạo lịch, đợt hoặc kích hoạt Frenzy tiếp theo. Timestamp của xu, lịch và effect đã tồn tại không bị viết lại. Vì vậy tháo/lắp không kéo dài một lượt miễn phí. Timestamp sinh ra được làm tròn tới millisecond nguyên.

## Cấp và bản trùng

Nhận lần đầu tạo cấp 1 với 0 bản trùng; mỗi bản tiếp theo cộng 1 nguyên liệu. Nâng đúng một cấp dùng đồng thời Coin và số bản dưới đây. Thiếu một loại hoặc lưu thất bại thì giữ nguyên mọi tài nguyên.

| Cấp đích | Bản trùng | Coin cơ bản |
| -------- | --------: | ----------: |
| 2        |         1 |         100 |
| 3        |         2 |         500 |
| 4        |         3 |       2.500 |
| 5        |         4 |      12.500 |
| 6        |         5 |      62.500 |
| 7        |         6 |     312.500 |
| 8        |         8 |   1.562.500 |
| 9        |        10 |   7.812.500 |
| 10       |        12 |  39.062.500 |

Giá Coin nhân ×1/×2/×4 cho Thường/Hiếm/Sử thi. Khi đạt cấp 10, phần bản trùng còn dư chuyển ngay thành Gold; các bản nhận về sau cũng chuyển. Mỗi bản cho tương ứng **1/3/6 Gold**. UI hiển thị tổng Gold đã chuyển của từng thẻ. Không mất bản dư khi đạt max; không có cơ chế hy sinh hoặc ghép hủy thẻ.

## Rương và bảng rơi

| Vật phẩm   | Giá Gold | Tiêu hao khi mở      | Chắc chắn  | Rút ngẫu nhiên    |
| ---------- | -------: | -------------------- | ---------- | ----------------- |
| Rương bạc  |       20 | 1 rương              | 500 Coin   | 1 thẻ + 1 quà phụ |
| Rương vàng |       50 | 1 rương + 1 Chìa sao | 5.000 Coin | 2 thẻ + 1 quà phụ |
| Chìa sao   |       15 | Đi kèm rương vàng    | —          | —                 |

Mỗi lượt rút độc lập, có thể trùng cả trong cùng rương. Xác suất bên dưới là **mỗi lượt**, không phải xác suất nhận ít nhất một thẻ qua nhiều lượt. Không có pity hoặc bảo đảm bí mật. Tổng trọng số mỗi bảng hiện tại là 100.

| Bảng thẻ | Mỗi thẻ Thường (6 thẻ) | Mỗi thẻ Hiếm (4 thẻ) | Mỗi thẻ Sử thi (2 thẻ) |
| -------- | ---------------------: | -------------------: | ---------------------: |
| Bạc      |                    12% |                   6% |                     2% |
| Vàng     |                     5% |                  10% |                    15% |

Quà phụ bạc: 1 Turbo Mint **40%**, 1 Power Tap **40%**, 3 Gold **20%**. Quà phụ vàng: 1 Golden Magnet **40%**, 1 Time Warp **30%**, 5 Gold **30%**. UI tính tỷ lệ từ chính trọng số engine dùng; khi thẻ đã max, preview hiển thị lượng Gold thay thế.

Tất cả thẻ đều có nguồn trong rương; mọi booster/rương/chìa đều mua được bằng Gold trong shop. Nguồn Gold lặp lại là mưa vàng. Không có tự động bán vật phẩm. Khi mọi thẻ max, tiền Gold trả trực tiếp nhiều nhất mỗi rương là 9 (bạc) hoặc 17 (vàng), thấp hơn chi phí 20/65 Gold; thưởng vật phẩm có thể giúp kiếm thêm trong gameplay, không phải tiền hoàn tự động.

## Lưu giao dịch và bảo vệ tiến trình

`session.commitCommand` điều phối mọi thao tác sưu tập. Engine thử lệnh trên snapshot riêng; mở rương cùng lúc trừ rương/chìa, cập nhật seed riêng, cộng thưởng và ghi biên nhận. Chỉ sau IndexedDB commit mới công bố state cho React. Ghi chậm khóa command khác; ghi lỗi không tiêu hao, seed cũ giữ nguyên và thử lại cho cùng lượt rút.

`chests.lastResult` lưu ID tuần tự, loại rương, UTC và danh sách thưởng thực nhận. `acknowledged=false` khiến App tự mở kết quả sau tải lại, chặn mở rương tiếp theo cho đến khi xác nhận đã xem. Ghi lỗi khi xác nhận giữ kết quả chưa xem. Cờ này chỉ quản lý xem kết quả; thưởng đã nằm trong ví/kho và không được cấp từ màn kết quả. Import/backup cũng giữ nguyên quy tắc này.

RNG rương tách khỏi RNG sự kiện; mở modal hoặc thay frame không rút thưởng. Đây là RNG tái hiện được cho game local, không phục vụ chống chỉnh sửa save hay tiền thật. Giới hạn: 9.999 vật phẩm/loại, 999.999 bản trùng/thẻ trước max; vượt trần trả lỗi và không thay state một phần.

Schema 4 thêm bộ sưu tập, rương, `statistics.totalGiftCoin` và `offlineEfficiency`. Sổ Coin: `wallet + spent = produced + gift + initial`. Coin trong rương không tăng tổng sản xuất, còn Time Warp vẫn được tính là sản xuất theo luật P3. Codec đọc và chuyển schema 1/2/3, không tặng thêm vật phẩm trong migration; người chơi cũ đủ mốc vẫn có thể tự nhận rương khởi đầu một lần.

## File để chỉnh về sau

| Cần sửa                                 | File/module                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| Thẻ, rarity, hiệu ứng mỗi cấp           | `src/content/cards.json`                                                              |
| Chi phí/cấp, chuyển bản max sang Gold   | `src/content/card-progression.json`                                                   |
| Các cặp tổ hợp                          | `src/content/card-synergies.json`                                                     |
| Ô trang bị, mốc rương và trần bonus     | `src/content/unlocks.json`                                                            |
| Rương/chìa và bảng rơi                  | `src/content/chests.json`, `keys.json`, `loot-tables.json`                            |
| Giá đổi Gold                            | `src/content/item-offers.json`                                                        |
| Tính bonus, preview, nâng/tháo/trang bị | `src/core/cards/`                                                                     |
| Mở rương, xác suất và seed              | `src/core/chests/`                                                                    |
| Cấp tiền/vật phẩm/thẻ dùng lại cho P5   | `src/core/rewards/`                                                                   |
| Giao diện sưu tập                       | `src/features/cards/`, `src/features/chests/`                                         |
| Kiểm tra catalog và save                | `content/schemas/collection.schema.ts`, `platform/storage/collection-state.schema.ts` |

Giữ ID ổn định; sửa tên chỉ đổi locale. Không đặt giá/xác suất hoặc phép cấp thưởng trong React. Khi sửa nội dung ảnh hưởng save cũ, thêm migration/fixture trước khi tăng contentVersion. Kiểu callback dùng chung nằm ở `core/engine/contracts.ts`, không phụ thuộc component booster.

## Kiểm chứng và phần còn cần chơi thử

Kiểm thử gồm trang bị/tháo, chi phí/copy, cả ba tổ hợp, offline/Time Warp, tuổi thọ xu nguyên millisecond, giữ timer khi đổi thẻ, max-card conversion, nguồn vật phẩm, lỗi ghi, khóa thao tác, schema cũ và receipt mới. Mô phỏng 20.000 lượt cho **mỗi** bảng rơi, seed `0x12345678`, dung sai định trước `max(6 × sqrt(N × p × (1−p)), 1% × N)` cho từng mục. Test 100 vòng mở lại kết nối IndexedDB/engine ở trước/sau mở rương và xác nhận, không sinh phần thưởng phụ.

UI kiểm tra bằng React/jsdom; lưu trữ bằng fake-indexeddb. Trình duyệt thật không khả dụng trong phiên này (`apps: []`, `browsers: []`), nên chưa xác minh trực quan desktop/360 px, cảm ứng, FPS hoặc nhịp chơi dài. Thẻ hiện dùng icon vector và khung CSS; vẫn dùng xu SVG tạm từ giai đoạn trước. Kết quả lệnh toàn dự án xem `06-testing-release.md`.
