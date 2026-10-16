# Hỗ trợ 24 giờ, hình Gold và bố cục chơi — 1.4.0-rc.1

- Turbo Mint, Power Tap và Golden Magnet cộng dồn tối đa **24 giờ còn lại cho mỗi loại**. Mỗi lần dùng vẫn cộng 60/30/30 giây; hệ số không tăng theo số vật phẩm dùng. Khi đủ giới hạn, nút dùng bị khóa và không tiêu thêm vật phẩm. Hiệu lực giữ qua lưu/mở lại, giảm theo thời gian thực và được tính khi offline đến đúng lúc hết hạn.
- Time Warp 1h nhận Coin tức thì, không có đồng hồ hiệu lực. Frenzy là hiệu ứng sự kiện cầu vồng, giữ luật riêng.
- Thời gian hỗ trợ hiển thị theo giờ/phút/giây thay cho hàng chục nghìn giây.
- Ví Gold, cửa hàng, mưa vàng và thống kê dùng ảnh đồng xu rồng. Khung mưa vàng nằm trên đồng xu chính, thu gọn khi không có xu; mở vùng thu khi có xu, giữ nút cầu vồng riêng. Nút đồng xu chính có kích thước tối đa 480 px và tự co theo chiều cao còn lại.

## Vị trí chỉnh sửa

| File                                              | Vai trò                                     |
| ------------------------------------------------- | ------------------------------------------- |
| `src/content/boosters.json`                       | Thời gian mỗi lần dùng và giới hạn cộng dồn |
| `src/features/boosters/format-effect-duration.ts` | Hiển thị thời gian hiệu lực                 |
| `src/assets/images/coins/coin-gold-dragon.png`    | Ảnh Gold có nền trong suốt                  |
| `src/assets/asset-manifest.ts`                    | Đường dẫn dùng chung cho ảnh tiền           |
| `src/ui/components/GoldArtwork.tsx`               | Hiển thị ảnh Gold trong các tính năng       |
| `src/app/App.tsx`                                 | Thứ tự khung mưa vàng và vùng bấm xu        |
| `src/features/events/events.css`                  | Kích thước khung mưa vàng                   |
| `src/features/clicker/clicker.css`                | Kích thước đồng xu chính                    |

Giữ schema 7/catalog 0.7.0: chỉ nới giới hạn cấu hình trên ID hiện có, không đổi định dạng save. Thời hạn đang có trong save cũ được giữ nguyên; lần dùng mới cộng thêm theo giới hạn mới. Không mở save mới đã cộng trên giới hạn cũ bằng bản game cũ.

## Kiểm tra

`npm run check` đạt 276 kiểm thử/33 file, gồm kiểm tra trần 24 giờ, không tiêu vật phẩm ở trần, save/reload và hiệu lực offline của từng hỗ trợ. Build thành công. Kiểm tra Edge với save/hồ sơ thử riêng ở 6 kích thước (1920×872 đến 320×568), cả chế độ số đầy đủ và viết tắt: không tràn trang, khung mưa nằm trên vùng bấm, ảnh Gold tải được. Ảnh/báo cáo ở `tmp/gold-layout-qa/`.

Ở 1366×768, nút đồng xu rộng khoảng 321 px và khung mưa lúc chờ cao 67 px; ở 1920×872, đồng xu khoảng 420 px. Màn hình rất thấp vẫn giữ khả năng cuộn riêng vùng chơi.

## Nguồn ảnh và prompt

Ảnh tham chiếu do người dùng gửi trong hội thoại ngày 16/10/2026. Dùng công cụ imagegen tích hợp, chế độ chỉnh sửa/tách nền; bản PNG được sao chép vào dự án, không phụ thuộc thư mục công cụ khi chạy game.

Prompt: “Use case: background-extraction. Edit target: the ornate gold dragon coin standalone image supplied by the user (not the screenshot of the Coin Clicker UI). Remove only the white background and floor shadow, producing a clean transparent cutout for a game currency asset. Preserve the exact gold dragon coin design, dragon pose, ornamental rim, metallic highlights, perspective, full silhouette, and proportions. Center the single coin with a small transparent margin, square canvas. Do not redesign or add anything. No text, no UI, no extra coins. Output actual transparent alpha.”
