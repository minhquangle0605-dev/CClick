# Kiểm tra và dùng bản cập nhật

## Kết quả P6 — giai đoạn 7, 15/10/2026

- Bản **1.0.0-rc.1**, catalog **0.6.0**, schema **5**. Giữ nhãn RC do checklist trình duyệt thật chưa thực hiện, không tuyên bố M3 đã nghiệm thu đầy đủ.
- `npm run check`: đạt TypeScript, ESLint, kiến trúc **88 file**, validator catalog và định dạng. **223 test đạt trong 27 file**. Catalog: 12 máy, 30 nâng cấp, 12 thẻ, 30 thành tích, các hệ thống cũ giữ nguyên.
- Test mới: chuyển catalog của fixture v5 giữ nguyên payload/claim/snapshot offline; mua toàn bộ máy/nâng cấp và tick mili giây lẻ; sổ Coin round-trip; audit từ chối rương tự hoàn vốn và thưởng rương lồng; replay cùng seed giống nhau; UI bộ lọc shop; HTTP file server từ chối ghi/path ngoài thư mục.
- Mô phỏng: **18 lượt × 30 ngày** (9 trước, 9 sau), ba lịch × ba seed, checkpoint 1 giờ/1 ngày/7 ngày/30 ngày. Median mốc 10^15 mới: chủ động 1,50 ngày; hỗn hợp 2,25; thụ động 4,00. [Báo cáo và giả định](balance/REPORT.md), không phải thời gian bảo đảm cho người chơi.
- Benchmark Node: 72.000 tick trong hai giờ mô phỏng, 2 click/giây; p95 tick/kèm click theo lịch 0,77 ms, p95 42 quote 19,76 ms. Heap và giới hạn tải ở [dữ liệu benchmark](balance/engine-benchmark.json); không thay phép đo browser FPS, bộ nhớ renderer hoặc phiên chơi thật.
- `npm run build`: đạt, không còn cảnh báo chunk trên 500 kB. JS khởi động **467,29 kB** (gzip **141,12 kB**), App tải riêng **57,13 kB** (gzip **15,69 kB**); CSS **10,98 + 26,71 kB** (gzip **3,29 + 6,70 kB**). Font Latin/tiếng Việt **24,83 + 8,52 kB**. Toàn bộ 10 file dist **605.105 byte** chưa nén.
- Máy chủ Node không dùng npm dependencies: HTTP trang chính và **cả 10 file dist đều 200** tại `http://127.0.0.1:5173/`; bundle đúng **1.0.0-rc.1**. Máy chủ kiểm tra đã dừng. Đây là kiểm tra file/HTTP, chưa phải thực thi UI trong trình duyệt hay tắt adapter mạng rồi chơi thử.
- `scripts/package-local.ps1` đã tạo ZIP và SHA-256 trong `releases/`. ZIP chỉ gồm bản build, launcher, máy chủ file và hướng dẫn; không có dữ liệu trình duyệt của người chơi.
- Browser inventory rỗng; thử tạo tab `iab` trả **Browser is not available: iab**. Chưa xác minh trực quan desktop/360 px, focus/modal thực tế, âm/rung/cảm ứng, FPS, thời gian khởi động hoặc phiên 1–2 giờ/ngày hôm sau. Checklist còn mở trong [giai đoạn 7](12-stage-7.md).

## Kết quả P5 — giai đoạn 6, 15/10/2026

- `npm run check`: đạt TypeScript, ESLint, kiến trúc **87 file** không import sai tầng/vòng, validator và định dạng. Catalog có **7 quà ngày, 30 thành tích**, cùng các nội dung giai đoạn trước.
- Vitest: **217 test đạt trong 24 file**. Các test mới kiểm tra ngày Việt Nam qua cuối tháng/năm/ngày nhuận, vòng thứ 8, bỏ ngày, lùi ngày, Time Warp không đẩy ngày, kho đầy, claim lặp và claim ghi chậm/lỗi/reload.
- Thành tích và thống kê: mở khóa tách claim; mốc tổng sản xuất không giảm khi tiêu, không tính Coin quà; nguồn click/máy/offline/Time Warp/quà khớp số thực nhận; Magnet và chạm thủ công đều đếm sự kiện.
- Migration **schema 1–4 → 5**, fixture cũ giữ nguyên và bổ sung fixture v5 đã nhận daily/thành tích. Codec từ chối ngày/counter/ID/nguồn thu không hợp lệ; giữ phần lịch sử chưa phân loại thay vì tự gán nguồn.
- Reset: giữ phần RAM chưa autosave và settings, runId mới, giao dịch abort giữ bản cũ, backup riêng không bị xoay; primary mới hỏng không tự khôi phục lượt trước. Đã thử reset ở giới hạn số/revision và khôi phục có chủ đích. Màn boot lỗi có test xem backup không ghi và chỉ khôi phục sau xác nhận; save tương lai vẫn được bảo vệ.
- UI React/jsdom: nhận daily → nhận thành tích → dựng lại App, điều hướng thống kê, countdown qua nửa đêm, preview/nhập RESET, lỗi ghi và xem backup. Đây là kiểm thử DOM/kho IndexedDB mô phỏng, không phải thao tác trên Chrome/Edge thật.
- `npm run build`: đạt; `dist` cập nhật cho launcher **0.6.0**. JavaScript **507,49 kB** (gzip **154,13 kB**), CSS **41,86 kB** (gzip **12,61 kB**). Vite có cảnh báo chunk JavaScript vượt 500 kB; chưa đo ảnh hưởng lên thiết bị thật, ghi nhận để xem xét tách tải trong P6. Không đổi ngưỡng cảnh báo để che kết quả.
- HTTP trang chính, JavaScript và CSS tại **http://127.0.0.1:5173/** đều trả **200**; bundle đúng **0.6.0**. Máy chủ kiểm tra đã dừng sau xác minh.
- Công cụ trình duyệt trả `apps: []`, `browsers: []`: **chưa xác minh** trực quan desktop/360 px, cảm ứng, âm/rung, FPS và buổi chơi dài. Giai đoạn 7 về cân bằng và chơi thử chưa bắt đầu.

### Checklist thủ công P5 còn cần xác minh

1. Mở `Mo-Coin-Clicker.cmd`, thấy phiên bản 0.6.0. Nhận quà ngày, chờ báo đã lưu, F5: không nhận lại; ngày Việt Nam tiếp theo mở đúng quà kế tiếp.
2. Đạt mốc click/sản xuất hoặc nhận quà ngày, mở Thành tích, xem phần thưởng rồi nhận; kiểm tra badge và bộ lọc trước/sau reload.
3. Vào Thêm → Thống kê/Hướng dẫn/Sao lưu; thử desktop/360 px, bàn phím/Escape/focus, chuột/cảm ứng và giảm chuyển động. Kiểm tra âm/rung khi nhận quà theo settings.
4. Trên lượt thử đã xuất JSON riêng, mở Cài đặt → Bắt đầu lượt chơi mới; kiểm tra nhập sai không reset, nhập RESET mới thực hiện, cài đặt giữ nguyên. Trong Sao lưu xem **Trước reset gần nhất**; chỉ xác nhận khôi phục khi muốn quay lại lượt cũ.
5. Chơi nhiều phiên, ghi nhịp Coin/Gold và độ hữu ích của quà/thẻ/booster để dùng khi cân bằng P6. Chưa coi checklist này là kết quả đã thực hiện.

## P0: phần có thể kiểm tra

1. TypeScript strict và build production.
2. ESLint, import đúng tầng và không có vòng phụ thuộc.
3. Validator: catalog hợp lệ; từ chối giá âm/số kiểu number/ID trùng/thiếu bản dịch/thiếu icon/tham chiếu lỗi/vòng mở khóa/hiệu ứng không hỗ trợ.
4. UI: click xu chỉ phản hồi hình ảnh; tab shop thay nội dung; modal chi tiết/cài đặt/hướng dẫn/lộ trình mở đóng được; Escape và focus; thử chế độ giảm chuyển động.
5. Kiểm tra màn desktop và màn hẹp 360 px; không cuộn ngang hoặc nút bị che.

Chạy `npm run check`, sau đó `npm run build`. Kết quả kiểm tra thực tế được cập nhật ở cuối giai đoạn. Không dùng P0 để tuyên bố đã kiểm thử kinh tế/offline/save vì chúng chưa được triển khai.

## Khi cập nhật các giai đoạn sau

Từ P2, xuất backup trước khi dùng build mới; P1 chưa có tính năng này. Giữ địa chỉ local và hồ sơ trình duyệt ổn định, chờ lưu xong trước khi tắt hoặc cập nhật. Thay catalog chạy validator; thay công thức chạy unit/simulator; thay save chạy fixture migration; thay UI thử thao tác liên quan. Không cần test tài khoản, hóa đơn hoặc dịch vụ online.

P1 đã bổ sung Amount, command, sản lượng theo thời gian và save/load. P2 tiếp tục test mua nhiều, offline, backup và migration. Chỉ tạo E2E dài khi có luồng gameplay thật cần bảo vệ.

## Phạm vi kiểm tra P1

- Amount: cộng nhỏ trên 10^15 và 10^30; phép tính đến 10^100, số thập phân; từ chối âm, NaN, vô cực, tràn; không đổi số thật khi định dạng.
- Engine: 100 click = 100 Coin; máy mẫu 10 CPS trong 60 giây = 600 Coin ở 1/30/60/144 callback mỗi giây; phần lẻ millisecond; nhảy đồng hồ lịch; thời gian đi lùi; pause/resume; snapshot ổn định và đóng băng; giới hạn số không sửa state một phần.
- Save: round-trip số lớn; fixture v1; checksum, phiên bản, tham chiếu và counter sai; giao dịch abort; mở kết nối mới nạp lại; ghi chậm và nhiều click cùng lúc; lỗi quota giả lập, retry; không ghi trắng khi load lỗi.
- Khóa tab: chỉ một writer được giữ khóa; lần mở tiếp theo thành công khi khóa được giải phóng; lỗi rõ khi môi trường thiếu Web Locks. Test này mô phỏng LockManager.
- UI: React StrictMode; click tăng số một lần; lưu và dựng lại App/engine/kết nối IndexedDB vẫn giữ số; lỗi/retry; timer autosave và ẩn/hiện tab. Dùng jsdom + fake-indexeddb, không phải thao tác Chrome/Edge thật.

## Checklist thủ công P1 (lịch sử)

1. Mở bằng launcher, kiểm tra nhãn 0.2.0; chạm 10 lần, số dư tăng 10. Chọn xu rồi dùng Space/Enter, mỗi thao tác kích hoạt tăng một lần.
2. Chờ Đã lưu trên máy, nhấn F5: số dư và số lần chạm giữ nguyên. Bấm Lưu ngay khi đã lưu không nhân đôi Coin.
3. Mở thêm tab cùng địa chỉ: tab mới báo đang mở ở nơi khác. Đóng tab đầu rồi Thử lại, số dư đúng.
4. Thử màn 360 px và desktop, tooltip số lớn, modal và giảm chuyển động. Kiểm tra không cuộn ngang.

Các bước thủ công này là checklist còn cần xác minh trên trình duyệt thật, không phải kết quả đã thực hiện. Lõi chưa có shop/offline nên không kiểm thử các tính năng đó trong bản P1.

## Phạm vi kiểm tra P2

- Giá máy: cộng từng đơn giá đã làm tròn, đối chiếu mua nhiều với mua từng chiếc; Max theo ngân sách, giới hạn số, số lượng không hợp lệ, không sửa state một phần khi mua thất bại.
- Gameplay: mở khóa, nâng cấp mua một lần, tính CPS/click/hoàn vốn đúng; kết toán sản lượng cũ trước khi mua. Mô phỏng 30 phút click/sản xuất/mua, kiểm tra sổ thu chi.
- Offline: 0/10 phút/8 giờ/24 giờ, giới hạn 8 giờ, đồng hồ lùi, không nhận lặp, CPS đã lưu, trần số. Ghi chậm/lỗi ghi phải khóa thao tác và cho thử lại; nhiều vòng ẩn/hiện không nhân thưởng.
- Lưu: hai backup, primary hỏng, cả primary và backup đầu hỏng, không hạ cấp save tương lai, từ chối revision cũ, backup cả tiến trình RAM trước khôi phục. Fixture schema 1 → 2 và schema 2 có số lẻ/mua máy/nâng cấp.
- Xuất/nhập: giới hạn 2 MB, JSON lỗi, dữ liệu sai; xem trước không thay state, xác nhận mới khôi phục. UI mô phỏng mua máy và giữ tùy chọn qua lần mở lại.
- Tiếng Việt: kiểm tra các nhãn quan trọng và phát hiện ký tự bị thay thành dấu hỏi khi ghi file.

## Checklist thủ công P2 còn cần xác minh

1. Mở launcher, thấy bản 0.3.0. Chạm 15 lần, mua Máy ép xu thủ công, thấy 0,1 CPS; thử các lượng mua, nâng cấp và chi tiết lợi ích.
2. Có máy rồi ẩn tab khoảng 1 phút; quay lại thấy bảng thu nhập 50% CPS. F5 không nhận lại cùng khoảng vắng mặt.
3. Trong Sao lưu, xuất JSON, chơi thêm, nhập lại: xem trước chưa thay số dư; xác nhận mới thay. Khôi phục backup trước lần nhập để lấy lại tiến trình vừa chơi.
4. Bật/tắt giảm chuyển động, ánh sáng, âm và rung; tải lại vẫn giữ tùy chọn. Âm/rung chỉ đánh giá trên trình duyệt/thiết bị có hỗ trợ.
5. Thử bàn phím, chuột, nhiều ngón tay; mỗi thao tác chỉ tính một lần. Thử modal/Escape/focus và màn 360 px, không cuộn ngang hoặc che nút.
6. Thử hai tab: chỉ một tab chơi được; đóng tab đầu rồi thử lại ở tab còn lại.

Kiểm tra DOM/IndexedDB mô phỏng không thay thế checklist này. Trong phiên P2, công cụ điều khiển trả về danh sách ứng dụng và trình duyệt rỗng, nên chưa thể kiểm tra trực quan hoặc thao tác trên trình duyệt thật.

## Phạm vi kiểm tra P3

- Pipeline cộng phẳng/phần trăm/nhân; mạnh nhất cùng nhóm, trần ×20, nối thời gian đúng cap, không tiêu hao khi không thể dùng.
- Turbo/Frenzy hết hạn giữa tick; cùng kết quả ở 1/10/60 callback mỗi giây. Đồng hồ lịch nhảy không tạo thêm giờ sản xuất.
- Time Warp dùng CPS thường trực; không đổi đồng hồ chờ hoặc hạn effect; thiếu máy/tràn số không tiêu hao.
- Mưa vàng và Rainbow có thời điểm sinh/hết hạn, từ chối thu sớm/trùng/quá hạn. Magnet không chạm Rainbow, dùng multiplier Gold tại đúng thời điểm spawn.
- Cùng seed/time/commands tạo cùng RNG, ID và kết quả dù tick chia khác nhau. Mốc mở Rainbow giữa tick được tính từ lúc sản lượng chạm ngưỡng.
- Commit chậm/lỗi khóa command và không cấp thưởng trước lưu; retry không nhân vật phẩm. Reload/ẩn tab bỏ đợt dở, giữ lịch chờ/RNG. Fixture schema 1/2 chuyển sang 3 và round-trip fixture 3 có inventory/effect/mưa đã thu một phần.
- UI mô phỏng: xem trước Time Warp chưa dùng vật phẩm, xác nhận mới gửi lệnh; chỉ có hit target cho xu đang sống; luồng App đổi Gold → mở kho → dùng Turbo → kiểm tra bản lưu.

## Checklist thủ công P3 còn cần xác minh

1. Mở launcher, kiểm tra bản 0.4.0. Chơi chủ động 180–300 giây, thu mưa vàng bằng chuột/bàn phím/cảm ứng; không chạm nhầm shop và không nhận hai lần.
2. Dùng Gold đổi booster, xem trước rồi dùng; theo dõi CPS/sức nhấn và timer trước/sau hết hạn. Thử dùng tiếp để nối thời gian.
3. Khi tổng sản xuất đạt 10.000, chơi tới lúc có Rainbow; thu và kiểm tra Frenzy, ghép với booster, dùng Magnet trong mưa.
4. Xuất save rồi tải lại/ẩn tab: không phát lại xu đã thu hoặc phần đợt bị bỏ; hiệu ứng hết hạn thực tế, thời gian chờ chủ động được giữ.
5. Thử desktop/360 px, giảm chuyển động, phím Tab/Space/Enter, modal và cảm ứng. Chơi 15–30 phút để đánh giá nhịp thưởng/cân bằng.

Checklist này chưa được thực hiện trên trình duyệt thật. Công cụ trả về `apps: []`, `browsers: []`; không có kết quả đo FPS hoặc xác minh cảm ứng/trực quan để báo cáo.

## Phạm vi và kết quả P4 — 15/10/2026

- `npm run build`: đạt; `dist` cập nhật cho launcher **0.5.0**. JavaScript 474,13 kB (gzip 146,58 kB), CSS 38,10 kB (gzip 11,88 kB). HTTP trang chính và bundle tại `http://127.0.0.1:5173/` đều trả **200**, bundle chứa phiên bản 0.5.0; máy chủ kiểm tra đã dừng sau xác minh.
- `npm run check`: đạt TypeScript, ESLint, kiểm tra kiến trúc **73 file**, validator catalog và định dạng. Catalog có 12 thẻ, 3 tổ hợp, 2 rương, 1 chìa và 7 quầy đổi; nguồn máy/nâng cấp/booster cũ được giữ.
- Vitest: **175 test đạt trong 20 file**. Bao gồm thẻ trang bị/tháo/nâng, cấp tối đa và Gold chuyển đổi; bonus CPS/click/offline/Time Warp, cả ba tổ hợp, timer giữ nguyên khi thay thẻ và timestamp xu nguyên millisecond.
- Bảng rơi: 20.000 lượt trên mỗi bảng, seed cố định `0x12345678`; dung sai định trước `max(6 sigma, 1% số lượt)`. Kiểm tra biên trọng số, mọi thẻ có nguồn và tiền Gold hoàn trực tiếp không đủ mua lại rương/chìa tiếp theo.
- Lưu: mở rương/khóa/mở kết quả cùng giao dịch, không lộ thưởng trước ghi, lỗi ghi giữ seed/tài nguyên; **100 vòng mở lại kết nối IndexedDB/engine** ở trước/sau mở và xác nhận, không nhân thưởng. Đây là kho mô phỏng, không phải 100 lần F5 trên Chrome.
- UI React/jsdom: nhận rương miễn phí → xem tỷ lệ → mở → dựng lại App → hiện kết quả cũ → xác nhận → trang bị/nâng thẻ. Migration 1/2/3 → 4 giữ số dư, fixture v1–v3 giữ nguyên và bổ sung v4 có receipt chưa xem.
- Trình duyệt thật trả `apps: []`, `browsers: []`; **chưa xác minh** trực quan desktop/360 px, cảm ứng, FPS và cân bằng bằng buổi chơi dài.

### Checklist thủ công P4 còn cần xác minh

1. Mở launcher thấy bản 0.5.0; đạt tổng sản xuất 1.000 Coin, nhận rương miễn phí đúng một lần.
2. Xem xác suất bạc/vàng, đổi Gold lấy rương/chìa, mở và kiểm tra tiêu hao/phần thưởng. F5 khi chưa xác nhận kết quả phải hiện lại kết quả cũ.
3. Trang bị/tháo hai thẻ, thử tổ hợp và nâng cấp; không có bonus từ thẻ chỉ sở hữu. Quan sát CPS/click/Gold và các timer hiện có không bị kéo dài khi đổi thẻ.
4. Thử màn 360 px, bàn phím, chuột/cảm ứng, modal rộng, filter thẻ và chế độ giảm chuyển động. Xem rương/thẻ đã max chuyển Gold rõ ràng.
5. Xuất/nhập save có kết quả chưa xem; thử quay lại sau offline với thẻ Pin hoàng hôn. Chơi dài để đánh giá tốc độ kiếm Gold, giá rương và chi phí nâng.

## Kết quả P3 - 15/10/2026

- `npm run check`: đạt TypeScript, ESLint, kiểm tra kiến trúc 59 file không import sai tầng/vòng, validator catalog và định dạng.
- Vitest: **134 test đạt trong 17 file**. Có test luồng App đổi Gold → xem trước → dùng Turbo → lưu, bên cạnh kiểm tra lõi sự kiện/hiệu ứng và tương thích save cũ.
- `npm run build`: đạt; `dist` đã cập nhật cho launcher **0.4.0**. JavaScript 434,89 kB, gzip 136,40 kB; CSS 32,71 kB, gzip 10,72 kB. Không dùng kích thước build để suy ra FPS.
- Fixture v1/v2 giữ nguyên; bổ sung fixture v3 gồm kho, effect và sự kiện thu một phần để bảo vệ migration tương lai.
- Trình duyệt thật, desktop/360 px, cảm ứng và chơi thử 15–30 phút: **chưa xác minh**, do công cụ không có browser khả dụng.

## Kết quả P2 - 15/10/2026

- `npm run check`: đạt TypeScript, ESLint, kiểm tra 44 file nguồn không import sai tầng/vòng, catalog 6 máy/6 nâng cấp và định dạng.
- Vitest: **98 test đạt trong 13 file**, gồm mô phỏng kinh tế 30 phút và UI bằng jsdom/fake-indexeddb. Xuất bản lưu không đọc được đã được kiểm tra không ghi đè kho lưu.
- `npm run build`: đạt; đã cập nhật `dist` cho launcher bản **0.3.0**. JavaScript 408,52 kB, gzip 128,38 kB; đây là kích thước build, không phải phép đo hiệu năng khi chơi.
- Có fixture schema 1 và 2; kiểm tra giữ số dư, phần lẻ, sở hữu và CPS khi đọc/chuyển đổi.
- Kiểm tra trực quan và thao tác trên trình duyệt thật: **chưa xác minh** do không có trình duyệt khả dụng trong công cụ. Không tuyên bố đã chơi thử 30 phút, xác minh màn 360 px hoặc kiểm tra âm/rung/cảm ứng thực tế.

## Kết quả P1 - 14/10/2026

- `npm run check`: đạt typecheck, ESLint, ranh giới tầng/không vòng import, catalog và định dạng.
- Vitest: **60 test đạt trong 8 file**, gồm smoke test React StrictMode chạm → lưu → nạp lại bằng jsdom/fake-indexeddb.
- `npm run build`: đạt, đã cập nhật `dist` cho launcher. Bundle JavaScript khoảng 380 kB, gzip khoảng 121 kB; đây là dung lượng build, chưa phải số đo tốc độ trên trình duyệt.
- Có fixture schema 1 để bảo vệ tương thích khi viết migration ở giai đoạn sau.
- Kiểm tra trực quan desktop/360 px, bàn phím/cảm ứng thực tế, F5 và hai tab trên Chrome/Edge: **chưa xác minh**. Không coi test DOM mô phỏng là E2E trình duyệt thật.

## Kết quả P0 - 14/10/2026

- Typecheck, lint và kiểm tra import: đạt.
- Catalog mẫu: đạt; 9 test xác nhận dữ liệu đúng và từ chối đầu vào lỗi đều qua.
- Kiểm tra định dạng và build production: đạt.
- HTTP của bản xem trước trên `127.0.0.1:5173`: trả 200.
- Kiểm tra trực quan và thao tác trong trình duyệt: **chưa xác minh**. Trình duyệt tích hợp không khả dụng; Computer Use trên Windows dừng vì không xác định chắc URL của cửa sổ để áp dụng chính sách. Không tiếp tục điều khiển UI sau khi công cụ dừng.
- Chưa có bằng chứng kiểm tra màn 360 px hoặc modal/focus thực tế; CSS responsive và native dialog đã được triển khai, cần thử trực tiếp trước khi xác nhận phần UI hoàn tất kiểm tra.
