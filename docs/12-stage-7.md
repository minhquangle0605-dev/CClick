# Giai đoạn 7 — cân bằng, ổn định và bản chạy cá nhân

Ngày 15/10/2026. Mã roadmap **P6**; app **1.0.0-rc.1**, catalog **0.6.0**, save **schema 5**. Đã triển khai phần nội dung, công cụ đo, tương thích và đóng gói. Nhãn RC giữ lại cho tới khi hoàn thành chơi thử trên trình duyệt/thiết bị thật; không tự đánh dấu những kiểm tra chưa thực hiện là đạt.

## Nội dung thực tế

Giữ sáu máy và sáu nâng cấp cũ, bao gồm ID, giá và hiệu ứng. Thêm sáu máy:

| Máy               | Giá chiếc đầu      | CPS cơ bản |
| ----------------- | ------------------ | ---------- |
| Xưởng đúc quỹ đạo | 20.000.000         | 2.000      |
| Cụm máy Mặt Trăng | 330.000.000        | 11.000     |
| Kho lượng tử      | 5.100.000.000      | 65.000     |
| Mạng lưới tinh tú | 75.000.000.000     | 400.000    |
| Động cơ thiên hà  | 1.000.000.000.000  | 2.500.000  |
| Lò đúc vô tận     | 14.000.000.000.000 | 16.250.000 |

Máy mới dùng tăng giá 1,15 và điều kiện mở theo tổng sản xuất. 24 nâng cấp mới gồm 12 lần nhân đôi CPS thường trực và 12 lần nhân 8 sức nhấn, mỗi nhánh có điều kiện nối tiếp. Giá nằm trong JSON và được xếp tăng dần; đây là giá thiết kế cho Coin Clicker, không tuyên bố giống giá nội bộ của game tham khảo. Sức nhấn mới giúp click còn đóng góp ở chặng sau; không thêm cơ chế click tự động vào UI.

Giữ 12 thẻ, 3 tổ hợp, 2 rương, 1 chìa, 4 booster, 7 quà ngày và 30 thành tích. Không thêm tài khoản, quảng cáo, mua tiền thật, cloud, bảng xếp hạng hoặc backend gameplay. PWA không được chọn: bản build có thể phục vụ đầy đủ từ máy qua Node.js.

## Cân bằng và bằng chứng

Simulator gọi trực tiếp engine, command, reward, card, offline và codec đang dùng trong game. Không sửa ví để làm đẹp kết quả. Chính sách và giả định chi tiết nằm trong [báo cáo cân bằng](balance/REPORT.md); JSON giữ số tiền đầy đủ, các nguồn, mốc, Gold kiếm/tiêu và cấp thẻ.

Đã chạy 18 lượt 30 ngày: 9 trước và 9 sau, gồm 3 lịch chơi × 3 seed. Mỗi lượt lấy checkpoint 1 giờ/1 ngày/7 ngày/30 ngày và kiểm tra save/sổ Coin. Khoảng offline không bị chia nhỏ bởi việc lấy báo cáo; checkpoint giữa phiên chỉ dự phóng trên bản sao. Lịch thụ động chỉ click 15 lần đầu để khởi động, sau đó dùng máy.

| Lối chơi               | Mốc 10^15, trung vị bản mới | Khoảng ba seed |
| ---------------------- | --------------------------- | -------------- |
| Chủ động: 60 phút/ngày | 1,50 ngày                   | 1,50–1,67 ngày |
| Hỗn hợp: 20 phút/ngày  | 2,25 ngày                   | 2,25–2,50 ngày |
| Thụ động: 6 phút/ngày  | 4,00 ngày                   | 3,50–4,00 ngày |

Bản cũ chưa đạt mốc đó trong cả chín lượt 30 ngày. Nội dung mới khắc phục khoảng thiếu mục tiêu sau máy thứ sáu, giữ kết quả một giờ đầu giống bản cũ trong cả ba lịch. Mốc 10^15 không phải điểm kết thúc: vẫn còn mua máy, nâng cấp cao, thẻ/bản trùng và mục tiêu cá nhân. Ba seed chỉ là mẫu nhỏ; đây không phải bảo đảm thời gian hoàn thành hoặc chứng minh game đã vui.

Audit xét khoản Gold hoàn **tối đa**, kể cả mọi thẻ đã max: rương bạc mua 20 Gold hoàn tối đa 9; rương vàng kèm chìa mua 65 hoàn tối đa 17. Không thể chỉ dùng khoản hoàn trực tiếp để mua lại vô hạn. Bộ audit chặn thưởng rương/chìa lồng vào rương để tránh bỏ sót vòng gián tiếp; hiện catalog không có vòng đó. Mọi vật phẩm có nguồn và công dụng. Nguồn tái tạo theo thời gian như sản xuất, mưa vàng, daily là chủ ý; không có thị trường bán lại. Xem [audit](balance/economy-audit.json).

## Tối ưu và ổn định

- Shop mặc định hiển thị mục đã mở và hai mục đang tới, ẩn nâng cấp đã mua; có bộ lọc Tất cả/Đang sở hữu. Không tính/hiện toàn bộ 30 hàng mỗi lần UI cập nhật nếu chỉ cần phần gần mục tiêu.
- App tải thành chunk riêng sau bootstrap; font chỉ đóng gói Latin và tiếng Việt từ gói đang cài, có bản giấy phép trong `public/licenses/`. Mọi asset vẫn local.
- Nhận quà/lưu/reset tiếp tục commit trước thông báo. Không sửa chu kỳ autosave, luật offline hoặc hiệu ứng để phục vụ benchmark.
- Test cấp cao mua đủ 12 máy/30 nâng cấp, tick với khoảng 1/17/83/101/999 ms, serialize/đọc lại đúng miền số. Tránh nhân hệ số thập phân quá nhiều lần làm vượt 18 chữ số thập phân mà Amount hỗ trợ.

Benchmark chạy trên **Windows 10.0.26200, Intel i7-12700H, Node 24.14.0**, mô phỏng hai giờ bằng 72.000 tick 100 ms, 2 click/giây, 100 máy mỗi loại, toàn bộ nâng cấp và ba thẻ cấp 10. Kết quả p95 tick kèm click theo lịch **0,77 ms**; p95 một lượt báo giá 12 máy + 30 nâng cấp **19,76 ms**. Thử tải này không thu sự kiện/dùng booster; các luồng đó được chạy trong simulator và bộ kiểm thử riêng.

Payload lưu lớn nhất trong bài đo 4.610 byte; vật thể sự kiện tối đa 10. Heap Node sau GC từ 16,15 MB lên 17,64 MB, có cả mảng ghi mẫu của benchmark; không suy ra không rò bộ nhớ trình duyệt từ con số này. Toàn bộ số đo, môi trường và giới hạn ở [engine-benchmark.json](balance/engine-benchmark.json). Đây là thời gian mô phỏng tăng tốc, **không phải đã chơi thật hai giờ**, FPS hay độ trễ hiển thị sau click.

## Bản lưu và bản chạy

Schema vẫn là 5. Catalog 0.5.0 chuyển sang 0.6.0 sau xác minh checksum, giữ toàn bộ ví, ID sở hữu, daily/claim, RNG/receipt, nguồn thu và snapshot offline. Các bản schema 1–4 vẫn được đọc. Không sửa trực tiếp dữ liệu trình duyệt của người chơi trong quá trình triển khai.

`Mo-Coin-Clicker.cmd` ưu tiên bản `dist` có sẵn; chỉ cần Node.js để chạy, không cần npm dependencies. Máy chủ `scripts/serve-local.mjs` chỉ nhận GET/HEAD và chỉ phục vụ file trong dist qua `127.0.0.1:5173`; không ghi save, không có tài khoản hay API nghiệp vụ. Save vẫn ở IndexedDB cùng origin/hồ sơ như trước. Khi cổng bận thì báo lỗi, không tự đổi origin.

Đóng gói bằng `powershell -NoProfile -File scripts/package-local.ps1`: ZIP trong `releases/` gồm dist, launcher, máy chủ file và hướng dẫn; có SHA-256 kèm theo. Giải nén rồi mở launcher, không chạy trong ZIP. ZIP không chứa save; xuất save từ game nếu cần backup tiến trình. Hướng dẫn bản chạy: [PLAY-LOCAL.md](PLAY-LOCAL.md).

## Bản đồ chỉnh sửa

| Muốn sửa                          | Nơi sửa                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| Máy/nâng cấp, giá và hiệu ứng     | `src/content/generators.json`, `upgrades.json`                                                   |
| Chữ và mô tả                      | `src/locales/vi.json`                                                                            |
| Điều kiện mở/quote                | `src/core/shop/quotes.ts`                                                                        |
| Bộ lọc và bố cục shop             | `src/features/shop/ShopPanel.tsx`, `shop.css`                                                    |
| Font, tải UI                      | `src/ui/styles/fonts.css`, `src/main.tsx`                                                        |
| Phiên bản app/catalog             | `src/shared/version.ts`, `package.json`, `content/balance.json`                                  |
| Lịch chơi mô phỏng                | `scripts/simulation/profiles.ts`                                                                 |
| Chính sách mua/nhận quà           | `scripts/simulation/policy.ts`                                                                   |
| Engine mô phỏng và checkpoint     | `scripts/simulation/simulate.ts`                                                                 |
| Chạy, so sánh, audit và benchmark | `scripts/simulate-economy.ts`, `summarize-economy.ts`, `audit-economy.ts`, `benchmark-engine.ts` |
| Bằng chứng đã đo                  | `docs/balance/`                                                                                  |
| Chạy/đóng gói local               | `scripts/serve-local.mjs`, `package-local.ps1`, `Mo-Coin-Clicker.cmd`                            |

Khi chỉnh giá: tăng contentVersion, cập nhật whitelist chuyển catalog nếu cần, chạy validator/test/simulator và ghi lý do trước/sau. Không xóa ID đã có trong save. Script simulation không thuộc mã runtime của game.

## Phần nghiệm thu còn cần thực hiện

Công cụ trả `apps: []`, `browsers: []`; thử mở tab `iab` cũng trả `Browser is not available: iab`. Chưa có đường điều khiển trình duyệt khả dụng. Các mục sau chưa xác minh, nên chưa đổi nhãn RC thành 1.0 chính thức:

- Desktop và 360 px: không cuộn ngang, không che nút; thử tất cả bộ lọc/modal và focus khi đóng.
- Click chuột, bàn phím, đa chạm; âm/rung và giảm chuyển động theo tùy chọn.
- Đo hiển thị sau click, khởi động local, FPS và bộ nhớ trình duyệt trong phiên 1–2 giờ.
- Quay lại ngày hôm sau: offline/daily/F5; xem tiến trình đủ hấp dẫn, quà/thẻ/booster có ích.
- Trên lượt thử đã xuất save: import, reset, khôi phục backup có xác nhận; không thao tác thử reset trên tiến trình thật chưa backup.

Không có yêu cầu phát hành online. Sau lượt chơi thực tế, ghi điểm cần sửa và đóng một bản local ổn định; không tự thêm lại chức năng thương mại/xã hội đã bỏ.
