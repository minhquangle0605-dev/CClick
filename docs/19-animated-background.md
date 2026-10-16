# Nền xu bạc động — 1.5.0-rc.1

Nền được dựng theo ảnh người dùng gửi: xu bạc ngôi sao bốn cánh, ánh sáng xanh và bụi sáng. Ảnh nền ngang được tạo từ ảnh tham chiếu bằng **imagegen tích hợp**; các lớp chuyển động được dựng bằng CSS trong game.

## Cách hoạt động

- Ảnh nền dịch và phóng nhẹ theo chu kỳ 38 giây, đổi hướng mềm để không có điểm nhảy khi lặp.
- Sáu xu nổi có chu kỳ 22–32 giây lệch pha; bụi sáng và tia sáng chuyển động chậm, không nhấp nháy nhanh.
- Chỉ animate `transform` và `opacity`. Không vẽ canvas mỗi khung hình, không video, không cập nhật state React mỗi khung hình. Component dùng `memo` để giữ các lớp ổn định khi số Coin cập nhật.
- Nền có vùng tối giúp đọc thông tin, xưởng có nền đậm riêng. Lớp trang trí nằm dưới giao diện, `aria-hidden`, `pointer-events: none`, không có phần tử nhận focus.
- Màn hình hẹp chỉ giữ ba xu nổi, tắt lớp tia sáng, giảm độ sáng ảnh. Ảnh dùng `object-fit: cover`, không tạo thanh cuộn trang.
- Khi mở cửa sổ chức năng hoặc chuyển tab, animation tạm dừng. Quay lại tiếp tục từ vị trí cũ. **Cài đặt → Giảm chuyển động** và thiết lập tương ứng của hệ điều hành dừng chuyển động nền; ảnh tĩnh vẫn hiển thị.

## Cấu trúc file

| File                                                | Vai trò                                                 |
| --------------------------------------------------- | ------------------------------------------------------- |
| `src/ui/background/AnimatedBackground.tsx`          | Các lớp ổn định, theo dõi tab ẩn và điều khiển tạm dừng |
| `src/ui/background/animated-background.css`         | Kích thước, lớp che, animation và responsive            |
| `src/assets/images/backgrounds/silver-coin-sky.png` | Ảnh nền ngang từ tham chiếu                             |
| `src/assets/asset-manifest.ts`                      | Đường dẫn ảnh dùng chung                                |
| `src/app/App.tsx`                                   | Gắn nền với cài đặt và trạng thái modal                 |

Muốn đổi tốc độ, chỉnh thời lượng trong CSS và mảng `coins`; không sửa vòng lặp gameplay. Muốn đổi độ sáng, chỉnh opacity của `.ambient-scene` và các lớp `.ambient-depth`, `.ambient-veil`. Không thêm blur/filter chuyển động toàn màn hình vì sẽ tăng chi phí vẽ.

Giữ schema 7 và catalog 0.7.0. Cài đặt Giảm chuyển động dùng trường đã có, được nhớ qua lần mở game.

## Kiểm tra

Edge headless với hồ sơ thử riêng: kiểm tra 1920×872, 1366×768, 768×600, 390×844, 320×568; nền phủ màn hình, không tràn trang, nút xu vẫn nhận thao tác. Kiểm tra animation không tạo lại khi số Coin đổi, tạm dừng khi mở modal/tab ẩn, Giảm chuyển động qua reload và lựa chọn từ hệ điều hành.

Phép đo thử 3 giây trong môi trường headless: trung vị khoảng cách khung hình 16,7 ms, P95 33,4 ms, một tác vụ dài 52 ms. Đây là số đo của môi trường thử, không phải bảo đảm FPS trên mọi thiết bị. Ảnh và kết quả ở `tmp/background-qa/`.

## Prompt ảnh nền

“Use case: style-transfer / game background adaptation. Reference: the user's latest portrait image of floating silver four-point-star coins in a deep blue luminous space. Create a wide landscape 16:9 background plate for this exact Coin Clicker game. Preserve the reference's photoreal polished silver coins, beveled FOUR-point compass/star emblem (not five-point), rich midnight/navy blue palette, fine blue-white particles, vertical shafts of cool light, atmospheric depth, and elegant metallic lighting. Adapt the composition to widescreen: medium and larger tilted silver coins mainly around the left and right edges, some smaller distant coins and bokeh. Keep the central third dark and relatively open so the actual clickable coin and numeric UI can sit there legibly. The image should still visibly resemble the supplied reference, not a plain gradient. Avoid an oversized central hero coin, text, symbols other than the four-point coin emblem, UI, logos, borders, any gold coins. Restrained bright accents, cinematic but calm, no white blown-out regions. This is a still base plate that will be animated in layers with code, not a screenshot of a finished interface. High-quality landscape image.”
