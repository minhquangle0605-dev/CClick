# Giai đoạn 3 — vòng lặp chơi cá nhân

Ngày 15/10/2026. Mã roadmap **P2**, app **0.3.0**, catalog **0.2.0**, save **schema 2**.

## Đã triển khai

1. Sáu máy từ Máy ép xu thủ công đến Lõi sao bốn cánh; giữ thông số khởi đầu trong roadmap.
2. Sáu nâng cấp: ba nâng sức nhấn, ba nhân sản lượng toàn bộ máy; mua một lần, kiểm tra điều kiện sở hữu.
3. Mua ×1/×10/×100/Max; mốc mở dựa trên tổng Coin đã sản xuất, không mất khóa khi tiêu Coin. Nút mua thiếu tiền/khóa/vượt giới hạn bị vô hiệu hóa; engine vẫn kiểm tra lại khi nhận lệnh.
4. Màn chi tiết cho biết giá cả lô, delta CPS, delta sức nhấn và hoàn vốn theo CPS tăng thêm. Nâng cấp click không gán thời gian hoàn vốn giả.
5. Sản xuất khi hiển thị; offline 50% trong tối đa 8 giờ; hiển thị phần thưởng đã ghi xong. Không có hệ chống gian lận hoặc server thời gian cho game cá nhân.
6. Autosave, hai backup, export/import JSON, xem trước và xác nhận thay thế; khôi phục từ backup nếu bản chính hỏng; giữ bản lỗi để xuất kiểm tra.
7. Chuyển đổi save schema 1; giữ Coin, máy, nâng cấp, thống kê và runId.
8. Lưu cài đặt ánh sáng/giảm chuyển động/âm/rung; âm tổng hợp local, rung tùy phần cứng. Nút xu có một đường kích hoạt cho chuột/bàn phím, hỗ trợ các tiếp xúc cảm ứng riêng và chặn click tổng hợp cộng trùng.
9. Cột mốc tiếp theo; khu giới thiệu boosters cho giai đoạn 4. Cài đặt là nơi truy cập Sao lưu/Hướng dẫn/Lộ trình trên màn nhỏ.

## Những luật cần giữ khi mở rộng

**Giá máy:** `ceil(basePrice × growth^owned)` cho từng máy; giá lô là tổng từng giá nguyên. Ví dụ 2 Máy ép xu thủ công đầu tiên giá `15 + 18 = 33`, 10 máy đầu giá `308`. Không lấy tổng cấp số nhân rồi làm tròn một lần. Max tìm trên bảng tổng chính xác và không chi quá số dư kể cả có phần lẻ. Cache được đánh khóa theo giá gốc/hệ số, không làm lẫn dữ liệu khi sửa catalog.

**Giao dịch:** quyết toán CPS cũ đến thời điểm mua trước, sau đó trừ giá, cộng máy/nâng cấp và cập nhật CPS dùng cho offline. Cùng một command không được sửa ví rồi thất bại ở phần sở hữu. Giữ ranh giới `core/shop` và `features/shop`.

**Offline:** snapshot lưu `offlineCps` của máy/nâng cấp thường trực tại thời điểm dừng. Giới hạn thời gian 8 giờ, hiệu suất 0,5; watermark vẫn đi tới hiện tại khi khoảng vắng lâu hơn cap. Đồng hồ lùi thưởng 0 và không hạ watermark. Đóng thông báo chỉ ẩn bản tóm tắt, không thực hiện lại thưởng. Nếu hết miền Amount, chỉ cộng phần còn chứa được rồi vẫn tiêu thụ khoảng thời gian đó.

**Commit:** boot và resume ghi cả Coin lẫn watermark trước khi cho tiếp tục. Trong lúc này session chặn click/mua/tick/autosave khác. Nếu thất bại, resume giữ game tạm dừng và cho thử lại hoặc export. Đây là logic của `app/game-session.ts`, không đưa vào React handler hoặc component thông báo.

**Import:** file tối đa 2 MB, kiểm tra JSON/schema/checksum/catalog/giá trị trước khi xem trước. Khi xác nhận, tạm dừng, đợi ghi trước hoàn tất, sao lưu snapshot đang chơi rồi thay primary trong cùng giao dịch. Import phục hồi đúng tiến trình của file, không cộng thời gian offline tích lũy trong file; đặt lại mốc tới hiện tại (giữ mốc tương lai nếu đồng hồ đang lùi). Settings không bị thay.

**Cập nhật catalog:** P1 chỉ có hai máy giữ nguyên CPS, nên migration tính CPS cũ theo ID và thông số được giữ trong codec. Khi thay cân bằng ở bản sau, cần migration/cách quyết toán rõ; không bỏ qua `offlineCps` của save hoặc lặng lẽ dùng sản lượng mới để tính quá khứ.

## Giới hạn chủ động

- Tiền ≤ `10^100`, tối đa 18 chữ số phần lẻ. Giá máy dùng phân số BigInt; 5.000 máy mỗi loại là giới hạn kỹ thuật. Hệ số 1,15 hiện tại chạm giới hạn tiền sớm hơn.
- Hai backup ở cùng IndexedDB không bảo vệ được việc xóa toàn bộ dữ liệu trình duyệt. File xuất riêng là cách chuyển máy/giữ bản độc lập.
- Không có mua bằng tiền thật, đăng nhập, cloud, quảng cáo, leaderboard hoặc multiplayer.
- Boosters, mưa xu, Frenzy, thẻ, rương, daily và reset vẫn thuộc giai đoạn sau.
- Cân bằng giá/CPS chưa được xác nhận bằng 30 phút chơi người thật. Mô phỏng tự động 30 phút dùng để kiểm tra số dư/sản lượng; âm, rung, cảm ứng, desktop và màn 360 px còn cần xác minh trên thiết bị thật.

Nguồn API đã đối chiếu: [IndexedDB transaction complete](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/complete_event), [Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API).
