# Changelog

## 1.8.0-rc.1 - 17/10/2026

- Ba loại xu dùng mô hình 3D có thân dày, cạnh khía, viền vát và hai mặt; xu bạc bốn cánh nổi, Gold dùng họa tiết rồng từ tài nguyên hiện có, cầu vồng tám cánh trên nền kim loại nhiều màu.
- Xu bạc lớn xoay nhẹ, nghiêng theo chuột và nhún khi bấm; Gold/cầu vồng quay chậm. Dùng cùng mô hình trong ví, sự kiện, phần thưởng và thống kê.
- Một WebGL context và vòng vẽ dùng chung, tối đa một lượt dựng mỗi loại xu/khung hình; hình 3D tải riêng, không cập nhật React hoặc engine mỗi frame. Giới hạn độ phân giải, chỉ vẽ khi nhìn thấy và tự dừng khi ẩn tab/mở modal/Giảm chuyển động.
- Giữ ảnh gốc dự phòng khi thiếu WebGL hoặc mất GPU context; khôi phục 3D khi context trở lại. Giữ schema 8/catalog 0.7.0, luật tính Coin, click và offline.
- 286 kiểm thử đạt; typecheck/lint/catalog/format/build thành công. Kiểm tra Edge trên 5 kích thước, DPR 1/2, dừng/tiếp tục khi ẩn tab, cả hai thiết lập giảm chuyển động, mất/khôi phục context và 20 click trong lúc fallback. Chỉ một WebGL context cho toàn giao diện.

## 1.7.0-rc.1 - 16/10/2026

- Tháo thẻ trực tiếp ở ô trang bị; thêm/tháo ngay trên từng thẻ đã sở hữu, không phải cuộn tới phần chi tiết. Đầy ô sẽ hiện hướng dẫn tháo trước khi thêm.
- Tự chọn thẻ thủ công sẽ tắt riêng Auto chọn thẻ; auto mua máy/nâng cấp bằng Coin giữ nguyên. Bộ thẻ được giữ cả khi tải lại và offline; có nút bật lại Auto chọn thẻ.
- Save schema 8 lưu tùy chọn mới; chuyển schema 1–7 giữ tiến trình, thẻ, vật phẩm và lịch sử. Không thay đổi catalog 0.7.0 hoặc giá nâng cấp.
- 283 kiểm thử đạt, typecheck/lint/catalog/format và build thành công. Thử trên Edge ở 5 kích thước, xác nhận thêm/tháo, tải lại, bật lại auto và không tràn ngang.

## 1.6.0-rc.1 - 16/10/2026

- Tích hợp đủ 102 PNG từ bộ CClick người dùng cung cấp, ánh xạ bằng ID catalog: máy, nâng cấp, thẻ, hỗ trợ, rương/chìa, cầu vồng, thành tích, tổ hợp và quà ngày.
- Thay biểu tượng tạm bằng ảnh trong cửa hàng, màn hình chi tiết, kho tăng tốc, thẻ/trang bị/tổ hợp, rương, phần thưởng, thống kê và sự kiện cầu vồng.
- Dùng chung ItemArtwork và RewardDisplay; tải ảnh khi cần, giữ tỷ lệ bằng object-fit contain, có ảnh vector dự phòng cho ID mới chưa có minh họa.
- 277 kiểm thử đạt. Kiểm tra 41 trường hợp giao diện ở 4 kích thước, đủ 102 ID có ảnh tải được và không tràn ngang. Giữ nguyên dữ liệu kinh tế/schema 7/catalog 0.7.0.

## 1.5.0-rc.1 - 16/10/2026

- Nền xu bạc và ánh sáng xanh theo ảnh tham chiếu, có ảnh nền dịch chậm, xu nổi và bụi sáng chuyển động riêng.
- Chuyển động dùng CSS transform/opacity, không chạy vòng lặp cập nhật React theo khung hình; giữ animation qua cập nhật số Coin. Giảm số lớp trên màn hình hẹp.
- Tạm dừng khi tab ẩn hoặc mở modal; tuân theo Giảm chuyển động trong Cài đặt và hệ điều hành. Nền không chặn thao tác bấm, cuộn hay focus.
- Tăng độ đậm nền xưởng để đọc giá/nâng cấp rõ hơn. Không đổi kinh tế, auto hoặc save.

## 1.4.0-rc.1 - 16/10/2026

- Nâng trần thời gian cộng dồn Turbo Mint, Power Tap, Golden Magnet lên 24 giờ mỗi loại; giữ thời lượng mỗi vật phẩm và hệ số hiện tại. Đủ trần không tiêu thêm vật phẩm. Hiển thị thời gian theo giờ/phút/giây.
- Thêm ảnh Gold rồng từ ảnh người dùng, tách nền trong suốt bằng imagegen; dùng ở ví, cửa hàng, sự kiện và thống kê.
- Chuyển Bầu trời xu vàng lên trên vùng bấm, thu gọn khi không có xu; tăng kích thước đồng xu chính, tối đa 480 px theo không gian còn lại.
- Kiểm tra cộng dồn, không tiêu ở trần, save/reload và hết hạn offline cho cả ba hỗ trợ.

## 1.3.1-rc.1 - 16/10/2026

- Sửa launcher khi mở game lần hai: xác minh trang game đang chạy và dùng lại cổng 5173, mở trình duyệt rồi thoát thành công. Vẫn báo lỗi nếu cổng thuộc ứng dụng khác hoặc không phản hồi; không dừng tiến trình khác.
- Đổi chính phần Coin và hoạt động trong Tổng quan từ lưới ô vuông thành danh sách 19 dòng có hình minh họa, tên, giá trị và chi tiết mở rộng.
- Hiện phần này đầu tab; bấm từng dòng để xem cách tính. Tổng sản xuất, Coin nhận qua quà và số click có phân tích từ dữ liệu đã lưu. Giữ danh sách vật phẩm/thẻ và tiến độ mục tiêu bên dưới.
- Số đầy đủ giữ trên một dòng; số quá dài có vùng cuộn ngang riêng, không ngắt giữa chữ số. Không thay đổi dữ liệu tiến trình hoặc luật auto.
- 274 kiểm thử đạt; kiểm tra giao diện danh sách/chi tiết ở bốn kích thước với cả hai chế độ số.

## 1.3.0-rc.1 - 16/10/2026

- Auto nâng cấp ưu tiên món đã mở và đủ Coin theo hoàn vốn, tránh bỏ qua món mua được để chờ món đắt hơn. Thêm mục tiêu, Coin còn thiếu, thời gian ước tính và số thao tác; áp dụng cả offline.
- Cài đặt có lựa chọn số đầy đủ/viết tắt, áp dụng ngay và giữ qua reload. Số đầy đủ giữ chính xác chữ số/phần lẻ, không thay đổi kinh tế hoặc save.
- Tab Tổng quan có danh sách 7 vật phẩm kèm ảnh và chi tiết nhận/tiêu, cùng nhóm chi tiết 12 thẻ. Giữ phần Coin/hoạt động bên dưới.
- Giữ schema 7/catalog 0.7.0, giữ phạm vi auto chỉ dùng Coin và thẻ đang sở hữu.
- 274 kiểm thử đạt, gồm auto mua từ UI, reload, offline và tùy chọn hiển thị số.

## 1.2.0-rc.1 - 16/10/2026

- Thống kê mặc định mở danh sách 7 vật phẩm có hình minh họa riêng, số đã kiếm được, đã tiêu và hiện có; có tìm tên và mở chi tiết nguồn nhận/cách tiêu.
- Tab 12 thẻ thống kê theo số bản, phân biệt bản trùng nâng cấp/chuyển Gold; giữ các thống kê cũ trong tab Tổng quan.
- Lưu lịch sử cùng giao dịch nhận/dùng vật phẩm, mở rương, tiêu chìa và bản trùng. Reload, offline và retry ghi lỗi không tăng trùng số liệu.
- Save schema 7, catalog giữ 0.7.0. Chuyển schema 1–6 giữ tồn kho; lịch sử cũ thiếu được đánh dấu ≥ mức tối thiểu đã biết, giao dịch mới ghi đầy đủ. Reset tạo lịch sử của lượt mới.
- 268 kiểm thử đạt; typecheck, lint, kiểm tra kiến trúc/catalog và build thành công. 25 ca giao diện Edge ở 6 kích thước đạt, kiểm tra reload và chuyển save v6.

## 1.1.0-rc.1 - 16/10/2026

- Xưởng nâng cấp cuộn toàn bộ nội dung độc lập; bỏ phân trang máy/nâng cấp/vật phẩm.
- Auto click 100 ms/lần và tự thu Gold luôn bật cả khi tính offline; click thủ công cộng thêm, cầu vồng vẫn thu thủ công.
- Nút auto nâng cấp lưu trạng thái bật/tắt, chọn máy/nâng cấp bằng Coin theo thời gian chờ + hoàn vốn và tối ưu bộ thẻ đang có. Giữ Gold, vật phẩm và bản trùng thẻ.
- Offline tối đa 24 giờ, mô phỏng mua tại từng thời điểm, tính hiệu ứng đến lúc hết hạn; kết quả dài được tính trong worker và lưu nguyên tử trước khi cho chơi tiếp.
- Save schema 6/catalog 0.7.0; chuyển schema 1–5 giữ tài nguyên và lịch sử, auto mua mặc định tắt. Thêm thống kê auto, tổng kết khoản chi và hướng dẫn.
- 242 kiểm thử và build đạt; kiểm tra 32 ca giao diện ở 8 kích thước, bật/tắt qua reload và worker 24 giờ với đầy đủ thẻ.

## 1.0.0-rc.2 - 16/10/2026

- Bố cục theo chiều cao cửa sổ: đồng xu và mưa vàng bên trái, cửa hàng bên phải; thanh mục tiêu và thống kê thu gọn ở cuối màn hình.
- Cửa hàng máy, nâng cấp và vật phẩm có phân trang tự điều chỉnh số dòng theo chiều cao thực tế. Toàn bộ nội dung và nút mua vẫn truy cập được.
- Màn hình hẹp dùng nút chuyển Chơi & mưa vàng / Xưởng nâng cấp. Thông báo offline và danh sách hiệu ứng mở tại chỗ; các chức năng phụ nằm trong Thêm.
- Vùng mưa vàng hai hàng, dành một ô riêng cho xu cầu vồng để các nút thu xu không chồng nhau.
- Giữ catalog 0.6.0, save schema 5 và dữ liệu tiến trình hiện có. Không thay đổi giá hoặc luật kinh tế.
- 226 kiểm thử qua; build thành công. Kiểm tra Edge headless 32 trường hợp ở 8 kích thước từ 320×568 đến 1920×872: không tràn trang, không cần cuộn cửa hàng.

## 1.0.0-rc.1 - 15/10/2026

- P6 (giai đoạn 7): bổ sung 6 máy và 24 nâng cấp, tổng 12 máy/30 nâng cấp; giữ thông số và ID của phần khởi đầu.
- Mô phỏng ba lịch chơi với ba seed tại 1 giờ/1 ngày/7 ngày/30 ngày, báo cáo trước/sau, nguồn thu và mốc thực tế. Kiểm tra nguồn vật phẩm và rương không tự hoàn đủ Gold để mua lại.
- Catalog 0.6.0, giữ save schema 5; chuyển cả save catalog 0.5.0 mà không cấp lại thưởng, giữ snapshot offline cũ khi quyết toán.
- Bộ lọc cửa hàng; tách tải App và chỉ đóng gói font Latin/tiếng Việt. Bản build không còn cảnh báo chunk trên 500 kB.
- Máy chủ file local bằng Node.js, launcher chơi bản build không cần npm dependencies; script đóng gói ZIP/checksum và hướng dẫn giữ save.
- Kiểm thử nội dung cấp cao, mili giây lẻ, migration, bộ lọc, HTTP local; benchmark 72.000 tick tương đương hai giờ. Chưa xác minh UI/FPS/âm/cảm ứng/chơi dài trên trình duyệt thật; giữ nhãn RC.

## 0.6.0 - 15/10/2026

- P5 (giai đoạn 6): chu kỳ 7 lần nhận quà theo ngày Việt Nam, countdown, giữ tiến độ khi bỏ ngày và chặn nhận lặp/lùi ngày.
- 30 thành tích với mở khóa/nhận quà tách riêng; nhận quà chờ commit, không trao lại sau reload.
- Thống kê Coin từ click, máy, offline, Time Warp, rương/ngày/thành tích và lịch sử chưa phân loại; mốc dài hạn 10^15 tính tổng sản xuất.
- Menu Thêm, hướng dẫn/thuật ngữ, âm/rung nhận thưởng theo settings; chưa xác minh thiết bị thật.
- Reset có preview, nhập RESET, runId mới, giữ settings; ghi nguyên tử backup riêng và lượt mới. Backup trước reset không xoay vòng và không tự dùng để phục hồi lượt cũ.
- Schema 5/catalog 0.5.0, migration từ schema 1–4, fixture v5 và kiểm thử đổi ngày/claim/reset/lỗi ghi/UI mô phỏng.

## 0.5.0 - 15/10/2026

- P4 (giai đoạn 5): 12 thẻ thuộc 3 bậc hiếm, cấp 1–10, 2 ô trang bị và ô thứ ba mở theo mốc; nâng bằng Coin/bản trùng, thẻ tối đa đổi bản trùng thành Gold.
- 3 tổ hợp sản xuất, mưa vàng và Rainbow/Frenzy; bonus thường trực nối với CPS, click, offline, Time Warp và sự kiện. Giữ timestamp của lịch/effect đã tạo khi đổi thẻ.
- Rương bạc/vàng, Chìa sao, mốc rương miễn phí, quầy đổi Gold; preview thưởng và xác suất từ cùng bảng trọng số với RNG.
- Mở rương ghi tiêu hao, RNG, thưởng và biên nhận trong cùng giao dịch trước khi hiện kết quả; phục hồi kết quả chưa xem sau tải lại.
- Schema 4, catalog 0.4.0; migrate schema 1/2/3, sổ Coin tách quà và sản xuất, snapshot hiệu suất offline, fixture v4.
- Kiểm thử phân phối cố định, 100 vòng mở lại kho lưu, lỗi ghi và luồng UI mô phỏng; tài liệu giai đoạn 5 và bản đồ file để mở rộng. Kiểm tra trực quan trên trình duyệt thật chưa khả dụng.

## 0.4.0 - 15/10/2026

- P3 (giai đoạn 4): Turbo Mint, Power Tap, Golden Magnet, Time Warp; kho vật phẩm, preview và xác nhận dùng.
- Mưa vàng, Gold, xu cầu vồng/Frenzy; đồng hồ chủ động, RNG lưu được, ID thu đúng một lần và vùng chạm riêng.
- Pipeline cộng/phần trăm/nhân, nhóm tạm thời mạnh nhất, trần ×20; tính sản lượng và thưởng qua từng mốc hết hạn.
- Quầy đổi Gold lấy bốn booster được đưa lên sớm để có nguồn vật phẩm trong giai đoạn này.
- Ghi trước khi công bố đổi/dùng/thu thủ công; schema 3, migration từ schema 1/2, fixture v3 và kiểm tra RNG/effect/inventory.
- Cập nhật kiến trúc, quy tắc save, README và tài liệu giai đoạn 4. Kiểm tra trình duyệt/cảm ứng thật chưa khả dụng; không coi test mô phỏng là xác minh trực quan.

## 0.3.0 - 15/10/2026

- P2 (giai đoạn 3): shop thật với 6 máy, 6 nâng cấp; mua ×1/×10/×100/Max, điều kiện mở khóa, sở hữu, CPS và lợi ích/hoàn vốn.
- Tính giá máy bằng phân số BigInt chính xác, làm tròn từng giá rồi cộng; Max không vượt ví. Giao dịch cập nhật tiền/sở hữu/thống kê cùng snapshot.
- Sản xuất theo elapsed time và offline 50%, cap 8 giờ; snapshot CPS khi dừng, watermark không lùi; commit trước khi tiếp tục chơi.
- Save schema 2, catalog 0.2.0; migration từ schema 1 giữ tiến trình. Hai backup nguyên tử, khôi phục tự động khi primary lỗi, giữ bản lỗi và kiểm tra writer cũ.
- Xuất/nhập JSON 2 MB với xem trước và xác nhận, backup trước thay thế; hỗ trợ khôi phục/xuất dữ liệu từ màn lỗi boot.
- Lưu cài đặt riêng, âm chạm local/rung tùy thiết bị, nhiều tiếp xúc cảm ứng, cột mốc tiếp theo và thẻ giới thiệu boosters.
- Thêm kiểm thử mua/Max/offline/backup/import/UI và mô phỏng 30 phút; cập nhật tài liệu và lộ trình. Chưa xác minh trình duyệt/âm/rung/cảm ứng thật vì chưa có browser kết nối.

## 0.2.0 - 14/10/2026

- P1 (giai đoạn 2): chạm cộng Coin thật, thống kê và cột mốc theo tiến trình.
- Amount dùng decimal.js, giữ tiền chính xác bằng chuỗi đến 10^100; giới hạn rõ ràng, từ chối kết quả âm/tràn.
- Engine command/snapshot bất biến, Clock được truyền vào, sản xuất theo elapsed time; chưa có mua máy hoặc thưởng offline.
- IndexedDB, save schema 1, SHA-256, kiểm tra khi đọc, không ghi đè save lỗi/khác phiên bản.
- Lưu tuần tự sau click và mỗi 10 giây, nút lưu/retry, trạng thái giao dịch; khóa một tab ghi.
- Test FakeClock, MemorySaveRepository, IndexedDB mô phỏng, lưu chồng nhau, lỗi ghi, số lớn và luồng UI chạm/lưu/nạp lại.
- Cập nhật hướng dẫn mở game, bản đồ module và hợp đồng save. Shop vẫn là bản xem mẫu cho P2.

## 0.1.0 - 14/10/2026

- P0: khung React/TypeScript/Vite, địa chỉ local cố định và launcher Windows.
- Tổ chức app/core/content/features/platform/ui/shared, kiểm tra phụ thuộc và vòng import.
- Hợp đồng GameState, SaveEnvelope, Amount, Command, DomainEvent, RewardBundle, Clock/RNG/SaveRepository.
- Catalog mẫu: 2 máy, 1 nâng cấp; schema và kiểm tra dữ liệu/điều kiện mở khóa.
- Giao diện navy-bạc, xu SVG tạm, xem mẫu shop, modal hướng dẫn/lộ trình/cài đặt, màn hình co giãn.
- Font và asset được đóng gói local. Chưa có gameplay thật hoặc lưu dữ liệu.
