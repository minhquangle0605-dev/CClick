# Kết quả mô phỏng kinh tế

Ngày 15/10/2026. Ba seed cố định 17, 73, 211 cho mỗi lịch chơi; trung vị của ba lượt. Đây là kết quả của chính sách tự động đã mô tả, không phải cam kết thời gian cho mọi người chơi.

| Lối chơi | Mốc     | Tổng sản xuất cũ (0.5.0) | Tổng sản xuất mới (0.6.0) | CPS mới   | Rương mới |
| -------- | ------- | ------------------------ | ------------------------- | --------- | --------- |
| Chủ động | 1 giờ   | 768.240,1                | 768.240,1                 | 376,7     | 9         |
| Chủ động | 1 ngày  | 25,72 B                  | 821,16 B                  | 79,69 M   | 23        |
| Chủ động | 7 ngày  | 328,99 B                 | 3,11e+18                  | 28,05 T   | 67        |
| Chủ động | 30 ngày | 1,89 T                   | 5,15e+19                  | 86,28 T   | 192       |
| Thụ động | 1 giờ   | 39.323,67                | 39.323,67                 | 21,09     | 3         |
| Thụ động | 1 ngày  | 741,11 M                 | 741,11 M                  | 50.541,99 | 10        |
| Thụ động | 7 ngày  | 205,39 B                 | 1,71e+18                  | 28,97 T   | 24        |
| Thụ động | 30 ngày | 1,25 T                   | 5,38e+19                  | 79,75 T   | 39        |
| Hỗn hợp  | 1 giờ   | 381.764,38               | 381.764,38                | 209,3     | 6         |
| Hỗn hợp  | 1 ngày  | 14,69 B                  | 87,05 B                   | 6,87 M    | 18        |
| Hỗn hợp  | 7 ngày  | 313,33 B                 | 5,45e+18                  | 34,39 T   | 37        |
| Hỗn hợp  | 30 ngày | 1,85 T                   | 5,22e+19                  | 90,25 T   | 88        |

## Thời gian đến mốc 10^15

| Lối chơi | Trung vị  | Khoảng ba seed |
| -------- | --------- | -------------- |
| Chủ động | 1.50 ngày | 1.50–1.67 ngày |
| Thụ động | 4.00 ngày | 3.50–4.00 ngày |
| Hỗn hợp  | 2.25 ngày | 2.25–2.50 ngày |

Bản cũ chưa đạt 10^15 trong cả chín lượt 30 ngày. Số mốc là lúc thực sự ghi nhận khi chơi/quay lại; báo cáo checkpoint trong khoảng vắng mặt chỉ dự phóng một snapshot riêng, không chia nhỏ khoảng offline hoặc nhận vượt cap.

## Phạm vi và cách đọc

- Chủ động: 6 phiên × 10 phút/ngày, 2 click/giây, thu khoảng 70% vật thể sự kiện theo hàm hash cố định.
- Thụ động: 2 phiên × 3 phút/ngày, 15 click ban đầu để mua máy; sau đó không click, thu khoảng 30% vật thể. Có cap offline 8 giờ mỗi lần vắng.
- Hỗn hợp: 4 phiên × 5 phút/ngày, 1 click/giây, thu khoảng 70% vật thể.
- Các phiên chia đều trong ngày. Engine chạy bước 1 giây khi hoạt động; mua mỗi 15 giây theo thời gian hoàn vốn biên trong các mục mua được. Click được gom trong giây, nên thời gian sớm nhất có độ phân giải 1 giây. Đây không phải chiến lược tối ưu.
- Nhận daily/thành tích, mở rương có sẵn, mua chìa cho rương được tặng rồi ưu tiên rương bạc. Trang bị theo danh sách cố định, nâng thẻ khi chi phí không quá 20% ví; dùng vật phẩm đã kiếm được. Chính sách không mô phỏng mọi phong cách chơi.
- Tổng Gold kiếm/tiêu, từng nguồn Coin, cấp thẻ, số rương, máy, mốc và khoảng lâu nhất giữa hai lần mua tính theo thời gian chủ động nằm trong JSON. Khoảng không mua không đồng nghĩa không có lựa chọn.
- Điểm 1 giờ/1 ngày/7 ngày/30 ngày đều được kiểm tra bằng save codec và sổ Coin. Ba seed cho biết độ lệch mẫu nhỏ; không phải khoảng tin cậy thống kê.
- Thu nhập offline chiếm phần lớn trong lịch mở vài lần/ngày. Thẻ cao nhất chưa đồng loạt đạt cấp 10 sau 30 ngày; việc sưu tập vẫn còn mục tiêu. Cân bằng cảm giác chạm và độ dài phiên cần thử trên trình duyệt thật.

Dữ liệu: [trước](simulation-before.json), [sau](simulation-current.json), [catalog cũ](catalog-0.5.0.json), [kiểm tra nguồn thưởng](economy-audit.json), [đo lõi](engine-benchmark.json).

Chạy lại: `npm run simulate` (vài phút), rồi `npx tsx scripts/summarize-economy.ts`. Muốn so sánh lại bản cũ: `npm run simulate -- --catalog docs/balance/catalog-0.5.0.json --out docs/balance/simulation-before.json`.
