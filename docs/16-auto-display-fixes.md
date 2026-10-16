# Auto nâng cấp và hiển thị số — 1.3.0-rc.1

## Auto hoạt động rõ ràng

Quy tắc cũ so sánh thời gian chờ cộng hoàn vốn giữa cả món đủ tiền và món chưa đủ tiền. Vì vậy có thể để Coin trong ví, bỏ qua món mua được và chờ món đắt hơn. Giao diện chỉ hiện thao tác gần nhất nên người chơi không biết đang tích tiền cho mục tiêu nào.

Quy tắc hiện tại:

1. Tối ưu thẻ đang sở hữu như trước, không dùng bản trùng hoặc nâng cấp thẻ.
2. Trong các máy/nâng cấp đã mở và đủ Coin, mua món có thời gian hoàn vốn ngắn nhất. Thu nhập tăng thêm gồm máy và 10 click mỗi giây; hòa điểm chọn giá thấp hơn.
3. Khi không mua được món nào, chờ thời điểm đủ tiền/mở khóa sớm nhất. Chia thời gian mô phỏng tại mốc đó và xét lại sau mỗi giao dịch, hết hiệu ứng hoặc thay đổi trạng thái.
4. UI hiện **Sắp mua / Đang tích Coin cho**, món tiếp theo, số còn thiếu, thời gian chờ ước tính, số thao tác và món vừa mua.

Đây là chiến lược mua tham lam có thể giải thích được, không cam kết tối ưu toàn cục. Lõi và UI dùng chung `selectAutoInvestment` trong `src/core/automation/investment.ts`, tránh hiển thị mục tiêu khác luật mua. Thời gian chờ là ước tính theo thu nhập hiện tại; sẽ đổi khi hiệu ứng hoặc tài nguyên thay đổi.

Giữ nguyên giới hạn chi: Coin mua máy/nâng cấp shop, tự trang bị thẻ đã có; không dùng Gold, vật phẩm hoặc bản trùng. Offline vẫn tối đa 24 giờ, dùng cùng quy tắc mua theo thời điểm. Tắt auto mua không tắt auto click/Gold.

## Đầy đủ hoặc viết tắt

Vào **Cài đặt → Hiển thị số**:

- **Viết tắt**: giữ cách cũ, ví dụ `1,23 M`; số rất lớn dùng số mũ.
- **Đầy đủ**: `1.234.567`, có đủ phần lẻ đang lưu, không dùng số mũ. Dấu chấm phân nhóm nghìn và dấu phẩy phân cách thập phân.

Thay đổi áp dụng ngay cho số dư, thu nhập, giá mua, phần thưởng và thống kê. Chỉ là định dạng: không làm tròn hoặc thay đổi tài nguyên trong save. Giá trị lớn hơn giới hạn số nguyên JavaScript vẫn được định dạng chính xác từ Decimal; không chuyển tiền qua Number.

Tùy chọn `numberFormat` nằm trong `coin-clicker-settings-v1` của localStorage, cùng các tùy chọn hiển thị khác, được giữ qua reload và reset. Settings cũ hoặc giá trị không hợp lệ mặc định viết tắt. Không đổi schema gameplay (vẫn 7) hoặc catalog (0.7.0).

Các file:

| File                                          | Vai trò                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| `src/shared/display-settings.ts`              | Kiểu `numberFormat`                                                      |
| `src/shared/amount.ts`                        | `amount.format(value, mode)`, chuyển chuỗi thập phân sang định dạng Việt |
| `src/ui/components/number-format.tsx`         | Context và hook `useNumberFormat`                                        |
| `src/app/App.tsx`                             | Lưu lựa chọn và cung cấp cho toàn giao diện game                         |
| `src/platform/storage/settings-repository.ts` | Đọc settings cũ, xác minh lựa chọn và ghi lại                            |
| `src/features/settings/SettingsPanel.tsx`     | Điều khiển chọn định dạng                                                |
| `src/features/rewards/reward-label.ts`        | Nhận formatter khi tạo nhãn thưởng                                       |

Khi thêm component hiển thị tài nguyên, dùng `useNumberFormat()` ở cấp đầu component; helper thuần nhận formatter qua tham số. Không đặt hook trong vòng lặp hoặc hàm dựng nhãn. Cấu hình hiển thị không đi vào lõi kinh tế.

## Tổng quan có danh sách chi tiết

Trong **Thống kê → Tổng quan**, 7 vật phẩm có từng dòng kèm ảnh, số nhận/tiêu/còn lại và phần chi tiết mở rộng. Nhóm **Chi tiết thẻ công nghệ** mở danh sách 12 thẻ ngay trong cùng tab. Từ 1.3.1, phần **Coin và hoạt động** được đặt đầu tab và cũng chuyển thành danh sách 19 dòng có ảnh, mở chi tiết; xem [cập nhật bố cục](17-overview-detail-list.md). Hai tab Vật phẩm/Thẻ vẫn dùng được để xem riêng.

Các danh sách dùng chung `ItemStatisticsList`, không có bộ đếm độc lập hoặc ghi giao dịch khi mở UI. Quy tắc save cũ và dấu ≥ không đổi.

## Kiểm tra

`npm run check` đạt 274 test/33 file, gồm kiểm tra chọn món đủ tiền, mục tiêu chờ, auto qua giao diện thật/lưu/reload, giữ Gold, offline 24 giờ, số đầy đủ vượt độ chính xác Number, đổi settings và giữ lựa chọn sau khi mở lại. Typecheck, lint, ranh giới module, catalog và định dạng đạt.

Kiểm tra Edge headless dùng hồ sơ/save thử riêng. Ảnh và báo cáo ở `tmp/display-auto-qa/`; không đọc/sửa save đang chơi. Các trường số cực dài có vùng cuộn riêng để giữ đồng xu và các nút chính trong màn hình.
