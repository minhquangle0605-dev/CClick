# Thêm và tháo thẻ công nghệ — bản 1.7

## Cách dùng

1. Mở **Thẻ công nghệ**. Các ô phía trên hiển thị bộ thẻ đang dùng.
2. Bấm **Tháo thẻ** dưới ô hoặc ngay trên thẻ đang trang bị. Thẻ vẫn ở bộ sưu tập, không mất bản trùng và không tiêu Coin/Gold.
3. Bấm **Trang bị thẻ** trên thẻ đã sở hữu để đưa vào ô trống. Khi đầy ô, tháo một thẻ trước. Ô trống có thể bấm để lọc thẻ đã sở hữu.
4. Thêm/tháo thành công tự tắt **Auto chọn thẻ**, giữ bộ thẻ bạn chọn kể cả offline/tải lại. Auto nâng cấp bằng Coin vẫn theo nút riêng ở xưởng.
5. Bật lại **Auto chọn thẻ** để cho phép bộ tối ưu đổi thẻ. Tính năng này chỉ chạy khi **Auto nâng cấp** đang bật. Khi auto nâng cấp tắt, giao diện báo đang chờ.

Chỉ thẻ đang trang bị cộng hiệu ứng. Không thay đổi giới hạn hai ô đầu và mở ô thứ ba khi tổng sản xuất đạt mốc hiện có. Mỗi ID chỉ trang bị một lần. Phần chi tiết, so sánh chỉ số, nâng cấp bằng bản trùng/Coin và các tổ hợp vẫn giữ nguyên.

## Phân chia mã

| File                                               | Trách nhiệm                                                                                                          |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/features/cards/CardsPanel.tsx`                | Nút thao tác ở ô/thẻ, chọn xem chi tiết, bộ lọc, khóa thao tác khi đang lưu, thông báo kết quả.                      |
| `src/features/cards/cards.css`                     | Bố cục ô, ảnh, nút; lưới ba cột và hai cột trên màn hình hẹp.                                                        |
| `src/locales/vi.json`                              | Nội dung hướng dẫn, tên nút, trạng thái auto/thủ công.                                                               |
| `src/core/cards/commands.ts`                       | Kiểm tra quyền sở hữu/số ô; thêm/tháo và tắt quyền auto đổi thẻ trong cùng kết quả.                                  |
| `src/core/automation/upgrade-planner.ts`           | Chỉ tối ưu bộ thẻ khi được phép; auto mua máy/nâng cấp giữ nguyên. Online và offline dùng chung.                     |
| `src/core/engine/contracts.ts`, `create-engine.ts` | Lệnh bền vững `SetAutoEquip`; cập nhật chỉ số sau thay bộ thẻ.                                                       |
| `src/core/state/`                                  | `automation.autoEquipEnabled` mặc định true; schema 8.                                                               |
| `src/platform/storage/save-codec.ts`               | Đọc schema cũ, kiểm checksum trước chuyển đổi, thêm cờ true cho schema 1–7, ghi schema 8.                            |
| `tests/integration/manual-cards.test.tsx`          | Thao tác trực tiếp, đủ ô/chưa sở hữu, lưu lỗi, tải lại/offline, auto Coin, bật lại tối ưu, migration và dữ liệu sai. |

UI gửi `session.commitCommand`, chỉ công bố cấu hình mới sau khi ghi thành công. Lỗi ghi giữ cả bộ thẻ lẫn cờ auto trước đó. Thao tác nâng cấp cấp thẻ không tự thay chính sách trang bị.

Save schema 8 cần bản game này trở lên; không sửa fixture schema cũ để kiểm tra migration. Không thêm hoặc đổi nội dung kinh tế: catalog vẫn 0.7.0.
