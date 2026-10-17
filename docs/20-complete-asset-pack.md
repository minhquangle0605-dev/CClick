# Bộ ảnh đầy đủ — 1.6.0-rc.1

Đã tích hợp **102/102 ảnh PNG** từ `CClick_Asset_Pack_102_Anh.zip`, đối chiếu danh mục 18 trang trong `CClick_Toan_Bo_Asset_Hinh_Anh.pdf`. Ảnh nguồn được giữ nguyên byte, không cắt, vẽ lại hoặc tự tách nền. Bộ ảnh có nền navy, phù hợp với các khung vật phẩm tối hiện tại.

## Danh mục và nơi sử dụng

Tất cả đường dẫn dưới đây nằm trong `src/assets/images/catalog/`.

| Nhóm            |  Số ảnh | Thư mục         | Hiển thị trong game                                                   |
| --------------- | ------: | --------------- | --------------------------------------------------------------------- |
| Máy sản xuất    |      12 | `generators/`   | Xưởng máy và cửa sổ xem chi tiết                                      |
| Nâng cấp        |      30 | `upgrades/`     | Xưởng nâng cấp và cửa sổ xem chi tiết                                 |
| Thẻ công nghệ   |      12 | `cards/`        | Bộ thẻ, ô trang bị, chi tiết, phần thưởng và thống kê                 |
| Vật phẩm hỗ trợ |       4 | `boosters/`     | Quầy đổi, kho, xem trước, hiệu ứng đang chạy, phần thưởng và thống kê |
| Rương           |       2 | `chests/`       | Quầy đổi, chọn/mở rương, biên nhận, phần thưởng và thống kê           |
| Chìa sao        |       1 | `keys/`         | Quầy đổi, kho chìa, phần thưởng và thống kê                           |
| Xu cầu vồng     |       1 | `coins/`        | Nút thu cầu vồng, hiệu ứng Frenzy và thống kê                         |
| Thành tích      |      30 | `achievements/` | Huy hiệu riêng của từng thành tích                                    |
| Tổ hợp thẻ      |       3 | `synergies/`    | Danh sách tổ hợp thẻ                                                  |
| Quà ngày        |       7 | `daily/`        | Minh họa 7 lần nhận quà                                               |
| **Tổng**        | **102** |                 |                                                                       |

Bộ ảnh có 90 file 512×512 và 12 thẻ 512×690, tổng 16.059.001 byte. Dùng `object-fit: contain` để không cắt hoặc kéo méo hình. PNG được đóng gói thành file riêng và tải bằng lazy loading ở các danh sách; xu cầu vồng tải ngay khi sự kiện xuất hiện. Bảng ánh xạ URL không buộc trình duyệt tải đủ 102 ảnh khi khởi động.

Xu bạc chính, Gold rồng và nền động tiếp tục sử dụng asset đã có. Các icon thao tác như đóng, cài đặt, mũi tên vẫn là icon giao diện. 7 ảnh quà ngày có sẵn chữ trong hình; danh sách thưởng thật và số lượng vẫn được dựng từ catalog bằng văn bản, đi kèm ảnh vật phẩm hoặc ảnh Gold hiện có.

## Bản đồ file để bảo trì

| File                                      | Trách nhiệm                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `src/assets/catalog-artwork.json`         | ID, tên, nhóm, đường dẫn và thông tin tái sử dụng từ manifest nguồn          |
| `src/assets/catalog-artwork.ts`           | Import URL theo manifest; báo lỗi nếu thiếu file                             |
| `src/ui/components/ItemArtwork.tsx`       | Hiển thị ảnh bằng ID, kích thước, nhãn truy cập và tải khi cần               |
| `src/ui/components/item-artwork.css`      | Tỷ lệ ảnh, nền, góc bo và ảnh trong chi tiết                                 |
| `src/ui/components/VectorItemArtwork.tsx` | Hình vector dự phòng cho ID mới chưa được gắn ảnh                            |
| `src/features/rewards/RewardDisplay.tsx`  | Hình và nhãn thưởng dùng chung cho quà ngày, thành tích, rương và bảng tỷ lệ |
| `src/assets/asset-manifest.ts`            | Xu bạc, Gold và ảnh nền lớn                                                  |
| `tests/unit/catalog-artwork.test.ts`      | Đối chiếu toàn bộ catalog với bảng ánh xạ, kiểm tra trùng/thiếu ID           |

Ví dụ:

```tsx
<ItemArtwork id="generator.hand-press" size={52} />
<ItemArtwork id="card.silver-touch" label="Chạm bạc" size={160} />
```

Nếu hình đã có tên bằng văn bản bên cạnh, để `label` trống để trình đọc màn hình không lặp tên. Trong danh sách thống kê, truyền nhãn để người dùng nhận biết hình. Muốn đổi ảnh, thay đúng file theo ID. Muốn thêm một ID, thêm PNG và một dòng manifest; component sẽ dùng ảnh đó ở tất cả các vị trí liên quan. Chạy `npm run check` và `npm run build` sau thay đổi.

Không đặt ảnh trực tiếp trong `dist`: thư mục đó được tạo lại khi build. Không thay ID gameplay chỉ để đổi tên file ảnh.

## Nguồn và kiểm chứng

- Nguồn ZIP: `C:\Users\tranv\Downloads\CClick_Asset_Pack_102_Anh.zip`.
- SHA-256 ZIP: `D53C499B06AE150F58A9D37F869F09396F7F9B5FD2C16E4E882853EBE212A29F`.
- Danh mục tham chiếu: `C:\Users\tranv\Downloads\CClick_Toan_Bo_Asset_Hinh_Anh.pdf`.
- 102 PNG đã đọc/kiểm tra hợp lệ trước khi nhập, đường dẫn được kiểm tra nằm trong thư mục đích. Báo cáo kích thước/hash từng ảnh: `tmp/asset-pack-review/import-audit.json`.
- `npm run check`: 277 kiểm thử/34 file, typecheck, lint, kiểm tra kiến trúc, catalog và định dạng đạt. Build thành công.
- Edge với save/hồ sơ riêng: 41 trường hợp giao diện ở 1366×768, 960×814, 390×844 và 320×568. Tất cả 102 ID đều có ảnh tải được trong các màn hình thực tế, không tràn ngang. Kiểm tra thủ công ảnh chụp cửa hàng, thẻ, quà ngày, rương và thống kê. Báo cáo/ảnh ở `tmp/asset-pack-qa/`.

Không đổi cấu trúc save, giá, phần thưởng hoặc luật auto; giữ schema 7 và catalog 0.7.0. Sau khi cập nhật bản chơi, dùng Ctrl+F5 để tải giao diện mới.
