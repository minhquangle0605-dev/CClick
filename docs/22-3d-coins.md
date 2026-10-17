# Xu 3D — bản 1.8

## Hành vi

- **Xu bạc chính:** thân và cạnh 3D, viền kim loại phản chiếu, ngôi sao bốn cánh nổi ở cả hai mặt. Chuyển động trôi chậm, nghiêng theo chuột và nhún khi bấm. Vùng nhận click giữ nguyên, không xoay vùng bấm theo hình.
- **Gold:** thân vàng, hai mặt dùng họa tiết rồng từ ảnh người dùng đã có. Ảnh được dùng làm màu/độ nổi bề mặt trên đĩa 3D; không phải mô hình điêu khắc rồng riêng. Quay chậm để thấy cạnh khía.
- **Cầu vồng:** đĩa kim loại nhiều màu và ngôi sao tám cánh nổi, quay chậm. Sự kiện vẫn dùng quy tắc nhận thưởng hiện có.
- Mô hình dùng ở xu chính, Gold trong ví/xưởng/bầu trời, xu sự kiện, phần thưởng và thống kê. Xu trang trí trên nền vẫn dùng lớp ảnh chuyển động sẵn có.
- **Giảm chuyển động:** giữ một khung hình 3D tĩnh. Tôn trọng cả cài đặt game và thiết lập hệ điều hành. Không làm dừng auto click/sản xuất.
- Ảnh gốc nằm sẵn phía dưới canvas. Khi WebGL không dùng được hoặc GPU context bị mất, ảnh xuất hiện; nút bấm và tiến trình vẫn hoạt động. Khi context phục hồi, dựng lại ánh sáng và vẽ tiếp.

## Sắp xếp file

| File                                                                                                   | Chỉnh ở đây khi cần                                                                                     |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `src/ui/coins/coin-model.ts`                                                                           | Hình học, thân/cạnh/viền, số cánh, độ nổi, màu/độ nhám/kim loại, UV họa tiết rồng.                      |
| `src/ui/coins/coin-renderer.ts`                                                                        | Camera, ánh sáng, tốc độ xoay, độ nghiêng theo chuột, phản hồi bấm, độ phân giải và vòng vẽ dùng chung. |
| `src/ui/coins/Coin3D.tsx`                                                                              | Component React, tải renderer khi cần, ảnh dự phòng và nhãn trợ năng.                                   |
| `src/ui/coins/coin-motion-context.ts`                                                                  | Truyền trạng thái tạm dừng/giảm chuyển động từ App.                                                     |
| `src/ui/coins/coin-types.ts`                                                                           | Kiểu ba loại xu và giao diện quản lý một vùng vẽ.                                                       |
| `src/ui/coins/coins.css`                                                                               | Kích thước và chuyển giữa canvas/ảnh dự phòng.                                                          |
| `src/features/clicker/CoinStage.tsx`                                                                   | Vùng bấm, chống click tổng hợp trùng sau touch; engine vẫn nhận lệnh ở đây.                             |
| `src/ui/components/GoldArtwork.tsx`, `ItemArtwork.tsx`                                                 | Các nơi hiển thị Gold/cầu vồng dùng chung mô hình.                                                      |
| `src/features/events/EventField.tsx`, `rewards/RewardDisplay.tsx`, `statistics/ActivityStatistics.tsx` | Kết nối mô hình với các màn hình hiện có.                                                               |
| `tests/integration/coin-input.test.tsx`                                                                | Click/keyboard, touch tổng hợp, hủy chạm, disabled, fallback và giữ canvas qua cập nhật số dư.          |

## Hiệu năng và vòng đời

Một WebGL renderer tạo tối đa một hình cho mỗi loại xu trong một frame. Các vị trí cùng loại nhận bản sao qua canvas 2D, không tạo WebGL context theo từng biểu tượng. Khi mở danh sách dài chỉ những vùng nhìn thấy mới cần vẽ. Mô hình/tài nguyên được dùng chung và giải phóng khi không còn vùng vẽ nào.

Renderer dùng `requestAnimationFrame`, thời gian thực có giới hạn delta khi quay lại tab; không thêm interval vào gameplay và không gọi `setState` mỗi frame. Coin vẫn cập nhật theo tick 100 ms của engine cũ. Shader/Three.js tải trong chunk riêng; ảnh ban đầu đã hiển thị trong lúc tải.

Độ phân giải nội bộ tối đa 720 × 720 cho mỗi loại; tăng lấy mẫu cho màn hình thường để cạnh rõ hơn, không chạy hậu kỳ bloom hoặc đổ bóng thời gian thực. Ánh sáng môi trường sinh một lần, cập nhật lại khi context khôi phục. `ResizeObserver` cập nhật kích thước; `IntersectionObserver` bỏ qua vùng khuất; `visibilitychange`, trạng thái modal và `prefers-reduced-motion` dừng vòng vẽ. Những lựa chọn này nhằm giữ chuyển động mượt trên máy đang chơi; tốc độ thực tế vẫn phụ thuộc GPU/trình duyệt.

Không có file save mới hay migration: schema 8 và catalog 0.7.0 giữ nguyên. Three.js 0.186.1 được đóng gói cục bộ, không cần mạng lúc chơi; giấy phép đi kèm tại `public/licenses/three.txt` và `dist/licenses/three.txt`.

Tham khảo API chính thức: [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html), [LatheGeometry](https://threejs.org/docs/pages/LatheGeometry.html), [PMREMGenerator](https://threejs.org/docs/pages/PMREMGenerator.html).

## Kiểm tra bản cập nhật

`npm run check`: 286 kiểm thử/36 file đều đạt; build thành công. Kiểm tra bằng Edge với profile và save riêng, không dùng tiến trình người chơi: 1920×1080, 1366×768, 768×600, 390×844, 320×568; DPR 1/2, không tràn khung. Xác nhận chỉ một WebGL context, hình tiếp tục chuyển động, dừng khi mở modal/ẩn tab/giảm chuyển động, rồi vẽ tiếp khi trở lại. Mất context hiện ảnh gốc; 20 click vẫn ghi đúng trước khi context khôi phục.

Lấy mẫu 240 khung hình trong game ở 1920×1080/DPR 2 trên máy kiểm tra: trung bình 7,64 ms, phân vị 95% là 13,9 ms, một khung vượt 33,4 ms. Đây là phép đo ngắn trên máy này, không phải cam kết FPS cho mọi thiết bị. Kết quả và ảnh kiểm tra nằm trong `tmp/coins-3d-qa/`.
