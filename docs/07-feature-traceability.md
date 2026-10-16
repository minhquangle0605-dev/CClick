# Task và phạm vi tính năng

Số giai đoạn người dùng 1-7 tương ứng mã kỹ thuật P0-P6 trong roadmap. P0 là dựng nền, P1 mới làm engine chơi thật.

## P0

Đã triển khai các đầu ra bên dưới. Build và kiểm tra mã nguồn đạt; phần xem trực tiếp UI chưa được xác minh vì giới hạn công cụ, xem báo cáo trong `06-testing-release.md`.

| Task  | Công việc                          | Đầu ra                                            |
| ----- | ---------------------------------- | ------------------------------------------------- |
| P0-01 | Chọn local và origin cố định       | README, quyết định 0001                           |
| P0-02 | Repo, TypeScript, build, formatter | Cấu hình và lockfile                              |
| P0-03 | Tách tầng và chặn import sai/vòng  | Cấu trúc src, script architecture                 |
| P0-04 | Hợp đồng dữ liệu                   | Amount, state/save, command/events/rewards, ports |
| P0-05 | Catalog mẫu và kiểm tra            | JSON, schema, validator và test                   |
| P0-06 | Nhận diện và giao diện nền         | Main, shop, settings, coin SVG tạm                |
| P0-07 | Kiểm tra và bàn giao               | Báo cáo kiểm tra, launcher, README                |

## P1 — giai đoạn 2

| Task  | Công việc                        | Đầu ra                                                            |
| ----- | -------------------------------- | ----------------------------------------------------------------- |
| P1-01 | Số lớn chính xác và định dạng    | Amount, kiểm tra miền số trong catalog                            |
| P1-02 | Engine tuần tự, Clock, snapshot  | create-engine, selectors, FakeClock                               |
| P1-03 | Click thật và thống kê           | apply-click, store, CoinStage, JourneyPanel                       |
| P1-04 | Lõi sản xuất theo elapsed time   | Tick/pause/resume; test máy mẫu 10 CPS                            |
| P1-05 | Save/load có version và checksum | Codec, IndexedDB adapter, fixture v1                              |
| P1-06 | Bảo vệ ghi và hiển thị lỗi       | Hàng đợi lưu, Web Lock, autosave, màn lỗi/retry                   |
| P1-07 | Nghiệm thu                       | Test số lớn, thời gian, lỗi save, UI chạm/lưu/nạp lại trong jsdom |

P1-06 kéo autosave và khóa tab từ P2 lên để có một cơ chế lưu an toàn ngay từ bản đầu tiên. Tại thời điểm P1, chưa triển khai backup/export/import/offline; các phần này đã được bổ sung ở P2. Smoke test UI chạy trong môi trường mô phỏng DOM/IndexedDB; không thay thế kiểm tra trực quan trên trình duyệt thật.

## P2 — giai đoạn 3

| Task  | Công việc                           | Đầu ra                                                                     |
| ----- | ----------------------------------- | -------------------------------------------------------------------------- |
| P2-01 | Giá mua chính xác, mua nhiều và Max | core/shop, báo giá và kiểm tra ngân sách                                   |
| P2-02 | Máy và nâng cấp chơi được           | 6 máy, 6 nâng cấp trong catalog; shop nối engine                           |
| P2-03 | Thu nhập khi vắng mặt               | settle-offline, bootstrap và session; ghi trước khi cho chơi               |
| P2-04 | Backup và phục hồi                  | Hai backup IndexedDB, giữ dữ liệu hỏng để xuất chẩn đoán                   |
| P2-05 | Xuất/nhập và tương thích save       | Xem trước rồi xác nhận; schema 1 → 2; fixture v1/v2                        |
| P2-06 | Cài đặt và thao tác                 | Lưu tùy chọn, âm/rung tùy chọn, đa chạm, mốc tiếp theo                     |
| P2-07 | Kiểm tra và bàn giao                | Unit/integration/UI mô phỏng, mô phỏng kinh tế 30 phút, docs/08-stage-3.md |

Phần triển khai P2 đã có; kiểm tra trực quan, âm thanh và cảm ứng trên thiết bị thật vẫn chưa được xác minh. Xem `06-testing-release.md`.

## P3 — giai đoạn 4

| Task  | Công việc                     | Đầu ra                                                                        |
| ----- | ----------------------------- | ----------------------------------------------------------------------------- |
| P3-01 | Pipeline và giới hạn hiệu ứng | core/effects, selector thường trực/đang hoạt động                             |
| P3-02 | Booster và Time Warp          | core/boosters, content/boosters.json, UI kho/preview                          |
| P3-03 | Nguồn vật phẩm chơi được      | Quầy 4 booster trong SHOP, item-offers.json                                   |
| P3-04 | Mưa vàng, Rainbow và Frenzy   | core/events, ID thu một lần, RNG và đồng hồ chủ động                          |
| P3-05 | Tương tác và hiển thị         | Vùng sự kiện riêng, Gold, timer, giảm chuyển động                             |
| P3-06 | Commit và migration           | session.commitCommand, schema 3, fixture v1/v2/v3                             |
| P3-07 | Kiểm tra                      | Effect hết hạn, ghép nhóm/cap, seed/frame, chuyển nền, lỗi ghi và UI mô phỏng |

Quầy booster được kéo lên từ P4; rương/chìa được bổ sung trong P4 bên dưới. Kiểm tra chơi/cảm ứng/trực quan 15–30 phút chưa xác minh do công cụ không có trình duyệt khả dụng.

## P4 — giai đoạn 5

| Task  | Công việc           | Đầu ra                                                                      |
| ----- | ------------------- | --------------------------------------------------------------------------- |
| P4-01 | Bộ sưu tập và cấp   | 12 thẻ, 3 bậc hiếm, cấp 1–10, bản trùng và chuyển Gold khi max              |
| P4-02 | Trang bị và tổ hợp  | 2–3 ô, 3 tổ hợp; bonus nối CPS/click/offline/sự kiện                        |
| P4-03 | Rương và nguồn kiếm | Rương bạc/vàng, Chìa sao, mốc miễn phí và quầy Gold                         |
| P4-04 | Bảng rơi chung      | Preview cùng trọng số với engine, seed riêng, mô phỏng 20.000 lượt mỗi bảng |
| P4-05 | Lưu và phục hồi     | Atomic open, receipt trước animation, kết quả chưa xem phục hồi sau reload  |
| P4-06 | Schema/migration    | Schema 4, totalGift, snapshot offlineEfficiency, đọc 1/2/3, fixture v4      |
| P4-07 | Kiểm tra/bàn giao   | 100 vòng mở lại kho lưu, lỗi ghi, UI mô phỏng; docs/10-stage-5.md           |

Đã triển khai P4; giới hạn kiểm tra trực quan vẫn được ghi riêng trong `06-testing-release.md`.

## P5 — giai đoạn 6

| Task  | Công việc                 | Đầu ra                                                                                           |
| ----- | ------------------------- | ------------------------------------------------------------------------------------------------ |
| P5-01 | Thưởng theo ngày Việt Nam | Chu kỳ 7 lần nhận, countdown, bỏ ngày giữ tiến độ, chặn ngày lùi                                 |
| P5-02 | Thành tích                | 30 ID, mốc/preview/quà trong catalog; mở và nhận riêng; filter/badge                             |
| P5-03 | Thống kê và mục tiêu      | Bảy nguồn Coin, lịch sử chưa phân loại, sự kiện, thời gian chơi và mốc 10^15                     |
| P5-04 | Quản lý cá nhân           | Menu Thêm, hướng dẫn/thuật ngữ, âm/rung sau commit theo settings                                 |
| P5-05 | Reset                     | Preview, nhập RESET, giữ settings, runId mới, snapshot RAM và backup riêng trong một transaction |
| P5-06 | Lưu/tương thích           | Schema 5, chuyển 1–4, fixture v5; khôi phục backup reset có xác nhận cả khi boot lỗi             |
| P5-07 | Kiểm tra/bàn giao         | Đổi ngày, ghi lỗi, reload, abort/reset, UI mô phỏng và docs/11-stage-6.md                        |

Đã triển khai P5; kiểm tra âm/rung, trực quan và điều khiển trên thiết bị thật còn chờ xác minh. Phần P6 được cập nhật bên dưới.

## P6 — giai đoạn 7

| Task  | Công việc                | Đầu ra / trạng thái                                                                 |
| ----- | ------------------------ | ----------------------------------------------------------------------------------- |
| P6-01 | Nội dung sau khởi đầu    | 12 máy, 30 nâng cấp; giữ 12 thẻ và 30 thành tích                                    |
| P6-02 | Cân bằng bằng mô phỏng   | 3 lịch chơi × 3 seed × 30 ngày, 4 checkpoint; báo cáo trước/sau                     |
| P6-03 | Nguồn vật phẩm/Gold      | Audit khoản hoàn tối đa, nguồn/dùng vật phẩm, kiểm tra vòng rương                   |
| P6-04 | Hiệu năng và UI          | Bộ lọc shop, lazy App, font gọn; benchmark Node 2 giờ mô phỏng; browser FPS chưa đo |
| P6-05 | Tương thích và đóng gói  | Schema 5/catalog 0.6.0, đọc các bản cũ; launcher Node + ZIP/checksum                |
| P6-06 | Nghiệm thu thiết bị thật | Chưa xác minh do không có browser trong công cụ; checklist ở docs/12-stage-7.md     |

Đã có bản **1.0.0-rc.1** để chơi thử cá nhân. Chưa tuyên bố hoàn tất nghiệm thu bản 1.0 chính thức hoặc đạt FPS/âm/cảm ứng chỉ từ kết quả mô phỏng.

## Tính năng giữ lại

| ID  | Task kế tiếp                                           | Giai đoạn |
| --- | ------------------------------------------------------ | --------- |
| F01 | Đã có click/Amount, đa chạm và âm/rung tùy chọn        | P1-P2     |
| F02 | Đã có engine/thống kê và máy mua được                  | P1-P2     |
| F03 | Đã có mua ×1/×10/×100/Max, mở khóa và nâng cấp         | P2        |
| F04 | Đã gom điều hướng vào menu Thêm và các nút gameplay    | P2-P5     |
| F05 | Đã có 3 booster theo thời gian, nhóm và cap            | P3        |
| F06 | Đã có Time Warp 1h bằng CPS thường trực                | P3        |
| F07 | Đã có Gold và mưa vàng                                 | P3        |
| F08 | Đã có Rainbow/Frenzy và thẻ/tổ hợp hỗ trợ              | P3-P4     |
| F09 | Đã có 12 thẻ, nâng cấp, 3 tổ hợp                       | P4        |
| F10 | Đã có rương bạc/vàng và bảng thưởng                    | P4        |
| F11 | Đã có Chìa sao đổi bằng Gold kiếm trong game           | P4        |
| F12 | Đã có thưởng ngày 7 lượt, không phạt bỏ ngày           | P5        |
| F13 | Chạy local không mạng, cache tùy nhu cầu               | P2, P6    |
| F14 | Đã có offline cơ bản 50% CPS + bonus thẻ, tối đa 8 giờ | P2, P4    |
| F15 | Đã có 30 thành tích cá nhân, nhận thưởng riêng         | P5        |
| F18 | Đã có reset nguyên tử và backup riêng                  | P5        |
| F19 | Đã có lưu, hai backup, xuất/nhập và migration          | P1-P2     |
| F21 | Chỉ giữ vật phẩm và nguồn kiếm trong game              | P3-P5     |
| F22 | Đã lưu settings, âm/rung chạm và nhận quà              | P2, P5    |
| F23 | Đã có lợi ích/hoàn vốn, hướng dẫn và thuật ngữ         | P2, P5    |
| F24 | Đã có thống kê và mốc 10^15; cân bằng ở P6             | P1, P5-P6 |

F16 bạn bè/leaderboard, F17 dịch vụ xã hội, F20 quảng cáo và phần bán hàng của F21 đã bỏ; không tạo task triển khai. Chi tiết nguồn PDF và luật riêng xem roadmap.
