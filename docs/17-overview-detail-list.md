# Danh sách Coin và hoạt động — 1.3.1-rc.1

Vào **Thống kê → Tổng quan**. Phần **Coin và hoạt động** ở đầu tab là danh sách 19 dòng, thay cho lưới ô vuông. Mỗi dòng có hình minh họa, tên chỉ số và giá trị; bấm dòng hoặc dùng Enter/Space để mở cách tính.

Tổng Coin sản xuất mở chi tiết click, máy, offline, Time Warp và lịch sử chưa phân loại. Coin nhận qua quà mở nguồn rương, thưởng ngày, thành tích và lịch sử cũ. Tổng click tách click tự động và phần click còn lại. Các số khác giải thích đúng phạm vi dữ liệu đang lưu, không dựng lịch sử giao dịch còn thiếu. Gold sự kiện không đại diện cho tổng Gold từ mọi nguồn.

Số dùng tùy chọn **Cài đặt → Hiển thị số**. Dãy chữ số không xuống dòng ở giữa; trên màn hình hẹp, giá trị đặt dưới tên, chuỗi quá dài cuộn ngang ngay trong vùng số. Mục tiêu dài hạn nằm sau danh sách, tiếp theo là danh sách vật phẩm và nhóm thẻ hiện có.

## Cấu trúc file

| File                                              | Trách nhiệm                                                 |
| ------------------------------------------------- | ----------------------------------------------------------- |
| `src/features/statistics/OverviewStatistics.tsx`  | Sắp xếp các phần trong tab Tổng quan                        |
| `src/features/statistics/ActivityStatistics.tsx`  | Các dòng chỉ số, hình minh họa, phân tích nguồn và mục tiêu |
| `src/features/statistics/activity-statistics.css` | Bố cục danh sách, chi tiết và hiển thị số dài               |
| `src/locales/vi.json`                             | Tên chỉ số, đơn vị và lời giải thích                        |

Component chỉ đọc state và selector hiện có; không ghi giao dịch khi mở thống kê. Giữ save schema 7 và catalog 0.7.0. Thêm chỉ số bằng một mục trong danh sách `metrics`, nhãn/mô tả tương ứng trong locale và hình minh họa phù hợp.

Kiểm tra: `npm run check` đạt 274 kiểm thử; build thành công. Edge với save thử riêng kiểm tra hai chế độ số, danh sách đóng/mở chi tiết ở 1366×768, 960×814, 390×844 và 320×568. Ảnh kiểm tra nằm ở `tmp/activity-qa/`.
