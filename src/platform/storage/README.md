# Lưu tiến trình

`SaveRepository` và `BackupRepository` trong `core/ports` được thực thi bằng IndexedDB.
Codec kiểm tra schema, checksum, sổ thu/chi và tham chiếu catalog trước khi trả dữ liệu
cho bootstrap; save schema 1–6 được chuyển sang schema 7. Bộ schema mở rộng kiểm tra
inventory, hiệu ứng, Gold nguyên và trạng thái sự kiện/RNG. `collection-state.schema.ts`
kiểm tra thẻ, ô trang bị, receipt rương và snapshot hiệu suất offline.
`progression-state.schema.ts` kiểm tra lịch ngày, trạng thái mở/nhận thành tích và tổng nguồn thu.
Bản 1.1 chuyển sang catalog 0.7.0 sau kiểm tra checksum, giữ tài nguyên và lịch sử. Thêm trạng thái bật/tắt auto, phần mili giây click còn lại và snapshot sức nhấn offline; không tự bật auto mua trên save cũ.

Bản 1.2 giữ catalog 0.7.0, thêm `itemHistory` ở schema 7. `item-history.schema.ts` kiểm tra ID, số lượng nguyên an toàn, loại tiêu hao và cân bằng nhận/tiêu/tồn. Save cũ giữ tồn đầu và đánh dấu lịch sử chưa đầy đủ. Mua, nhận thưởng, dùng booster, tiêu rương/chìa, nâng thẻ và chuyển bản trùng lưu lịch sử cùng payload; lỗi giao dịch không tăng bộ đếm.

`app/game-session.ts` điều phối hàng đợi ghi. `platform/lifecycle/tab-lock.ts` giữ khóa
một tab. P2 đã có hai backup, migration và xuất/nhập có xác nhận. Ghi save và backup
trong cùng giao dịch; chỉ báo thành công sau sự kiện hoàn tất. Không ghi trực tiếp từ React.

`save-file.ts` xử lý file JSON tối đa 2 MB. `settings-repository.ts` lưu tùy chọn riêng
trong localStorage; các tùy chọn này không nằm trong file tiến trình.

File save thật không commit vào Git. Lỗi ghi dữ liệu phải được báo trước khi UI nói đã lưu.

`session.commitCommand` ghi trước khi công bố việc dùng vật phẩm/đổi Gold/thu xu thủ công,
trang bị/nâng thẻ, nhận mốc rương, mở rương, xác nhận kết quả, thưởng ngày và thành tích.
Không đưa logic thưởng vào storage adapter hoặc animation React.

`session.reset` chờ ghi xong rồi dùng một transaction tạo lượt mới ở primary/hai backup,
giữ snapshot RAM cũ vào `reset-backup`. Key này không xoay theo autosave và không được
loader chọn tự động; chỉ khôi phục qua preview và xác nhận. Settings giữ nguyên.
