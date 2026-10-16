# COIN CLICKER - LỘ TRÌNH PHÁT TRIỂN VÀ TỔ CHỨC MÃ NGUỒN

> Ngày lập: 14/10/2026. Phiên bản kế hoạch: 1.1 - chỉ chơi cá nhân.
> Trạng thái 15/10/2026: giai đoạn 7 (P6) đã có bản local **1.0.0-rc.1**, 12 máy/30 nâng cấp, đầy đủ hệ thống cá nhân, mô phỏng cân bằng, benchmark lõi và đóng gói. Phần chơi thử/trực quan/âm/cảm ứng/FPS trên trình duyệt thật chưa xác minh, nên chưa nghiệm thu bản 1.0 chính thức. Xem `docs/12-stage-7.md` và `docs/06-testing-release.md`.
> Mục tiêu: tạo Coin Clicker cho một người chơi trên máy của mình; giữ chiều sâu gameplay từ PDF, bỏ dịch vụ thương mại và xã hội, tổ chức mã nguồn dễ sửa lâu dài.

## Mục lục

1. [Phạm vi và cách sử dụng tài liệu](#s01)
2. [Định hướng sản phẩm và hình ảnh](#s02)
3. [Bảng đối chiếu toàn bộ nhóm tính năng](#s03)
4. [Nền tảng và công nghệ đề xuất](#s04)
5. [Cấu trúc thư mục từ ngày đầu tiên](#s05)
6. [Quy tắc kiến trúc và dữ liệu](#s06)
7. [Đặc tả gameplay và công thức](#s07)
8. [Lưu tiến trình, thời gian và chuyển save thủ công](#s08)
9. [Màn hình, trải nghiệm và tài nguyên hình ảnh](#s09)
10. [Các giai đoạn triển khai và nghiệm thu](#s10)
11. [Kiểm thử, cân bằng và chất lượng](#s11)
12. [Hướng dẫn sửa và mở rộng game](#s12)
13. [Rủi ro và điều kiện hoàn thành bản cá nhân](#s13)
14. [Checklist bắt đầu và nguồn tham chiếu](#s14)

<a id="s01"></a>
## 1. Phạm vi và cách sử dụng tài liệu

### 1.1. Nguồn đầu vào

- PDF: `Cam_nang_Cookie_Clickers_day_du_2026.pdf`, 22 trang, người dùng cung cấp tại `C:/Users/tranv/Downloads/`.
- Ảnh tham chiếu: đồng xu bạc, ngôi sao bốn cánh nổi ở giữa, viền kim loại xanh bạc, góc nhìn hơi nghiêng, nền trắng.
- Yêu cầu chính: một file Markdown chi tiết để làm game, trong đó tổ chức file khoa học ngay từ đầu là yêu cầu bắt buộc.
- Các chỉ dẫn chơi game trong PDF được xem là dữ liệu tham khảo, không phải yêu cầu thao tác với tài khoản, mua hàng hay cài đặt game của người dùng.

### 1.2. Phạm vi đã điều chỉnh theo nhu cầu cá nhân

PDF mô tả **Cookie Clickers của Tiny Games/redBit games**, khác với Cookie Clicker của Orteil/DashNet và Cookie Clickers 2 (PDF trang 2, 18). Dùng tài liệu để tham khảo gameplay; yêu cầu mới của người dùng là chỉ làm game cho chính mình chơi.

**Bản hoàn chỉnh của Coin Clicker trong kế hoạch này là bản chơi cá nhân.** Những hệ thống bị loại dưới đây không còn là công việc phải làm về sau, không giữ nút trống hoặc adapter giả để chờ triển khai.

| Quyết định | Các chức năng |
|---|---|
| Giữ | Click, máy sản xuất, shop nâng cấp, boosters, Time Warp, mưa vàng, Rainbow/Frenzy, thẻ, tổ hợp, rương, chìa, thành tích, thống kê và mốc dài hạn |
| Giữ để bảo vệ tiến trình | Tự lưu trên máy, backup, xuất/nhập save, nâng phiên bản save, tính sản lượng khi đóng game, reset có xác nhận |
| Giữ nhẹ | Thưởng ngày, hướng dẫn ngắn, âm thanh, tùy chọn hiệu ứng; chỉ tiếng Việt |
| Bỏ hoàn toàn | Tài khoản/đăng nhập, bạn bè, bảng xếp hạng, Facebook/Game Center, máy chủ gameplay, cơ sở dữ liệu online, đồng bộ cloud và chống gian lận cạnh tranh |
| Bỏ hoàn toàn | Quảng cáo, No Ads, tiền thật/IAP, gói trả phí, xác minh hóa đơn, hoàn tiền, khôi phục mua hàng và hệ thống theo dõi người dùng |
| Bỏ khỏi lộ trình | Đưa lên App Store/Google Play, ký ứng dụng native, bộ phận hỗ trợ, kiểm thử tải nhiều người và vận hành dịch vụ thương mại |
| Chỉ thêm nếu sau này cần | Bản cài desktop/điện thoại, tiếng Anh, nhiều slot save; không dựng sẵn hạ tầng cho chúng |

Không bỏ thẻ, rương, sự kiện hoặc tiến trình dài chỉ vì chơi một mình: đây là nội dung trực tiếp tạo niềm vui và mục tiêu chơi. Ngược lại, không giữ cơ chế trả phí dưới dạng nút “mua miễn phí”; vật phẩm được đưa vào các nguồn thưởng gameplay rõ ràng ở mục 7.11.

### 1.3. Mức độ tham khảo PDF

Kế hoạch giữ các nhóm gameplay phù hợp, không tái tạo từng giá/cấp/xác suất nội bộ của game gốc. PDF trang 22 cũng nêu giới hạn dữ liệu này.

| Nhãn | Ý nghĩa |
|---|---|
| **PDF-XN** | PDF ghi nhận có tính năng; không đồng nghĩa mọi thông số đã được xác minh độc lập. |
| **PDF-CK** | PDF nêu cơ chế hoặc biểu tượng nhưng còn thiếu bằng chứng chi tiết. |
| **CC-ĐX** | Thiết kế riêng cho Coin Clicker, có thể điều chỉnh theo sở thích khi chơi thử. |

Mọi giá, thời lượng, số cấp, số vật phẩm và công thức tự đặt bên dưới đều là CC-ĐX. Ascension, Sugar Lumps, Garden, Stock Market, CookieLand và Lucky Spin không thuộc phạm vi này.

### 1.4. Giả định triển khai

- Game 2D web chạy cục bộ, ưu tiên trình duyệt trên máy Windows hiện tại; bố cục co giãn để dùng trên điện thoại nếu cần.
- Khi phát triển dùng công cụ chạy web cục bộ; khi chơi dùng bản build qua địa chỉ local cố định. Đây chỉ là cách phục vụ file ứng dụng, không phải máy chủ tài khoản/gameplay.
- Có thể bổ sung cache/PWA ở P6 để mở offline sau lần cài/tải đầu. Không bắt buộc thuê hosting hoặc đưa game ra internet.
- Dùng cùng trình duyệt, hồ sơ trình duyệt và địa chỉ/port để truy cập save. Đổi địa chỉ hoặc chuyển máy dùng export/import, không mặc định save tự đi theo file game.
- Một người phát triển và một người chơi; thời lượng trong mục 10 là dự toán làm toàn thời gian, không phải lịch bắt buộc.
- Coin và Gold đều là tài nguyên ảo kiếm trong game, không mua/bán bằng tiền thật.
- Chỉ tiếng Việt; vẫn gom chuỗi giao diện vào `locales/vi.json` để sửa chữ dễ.
- Ảnh xu là tham chiếu trong hội thoại; chưa giả định có file ảnh gốc trong dự án.
- Cây thư mục trong lộ trình là thiết kế ban đầu; bản đồ file đã triển khai được cập nhật ở `docs/02-architecture.md` và tài liệu từng giai đoạn.

### 1.5. Các mức hoàn thành mới

| Mốc | Nội dung | Khi hoàn thành |
|---|---|---|
| M1 - Vòng lặp cơ bản | Click, mua máy, sản xuất, save/load, backup và offline | Cuối P2 |
| M2 - Bản chơi sớm | M1 + boosters, Time Warp, mưa vàng, Rainbow/Frenzy | Cuối P3 |
| M3 - Bản cá nhân đầy đủ | M2 + thẻ/rương/daily/thành tích, cân bằng và kiểm tra save | Cuối P6 |

Không còn giai đoạn online, thương mại hoặc phát hành công khai sau M3.

<a id="s02"></a>
## 2. Định hướng sản phẩm và hình ảnh

### 2.1. Trải nghiệm cốt lõi

Người chơi chạm vào đồng xu bạc để kiếm Coin, đầu tư vào thiết bị đúc tiền, mở các tổ hợp thẻ và tận dụng sự kiện để tăng sản lượng. Trò chơi cần dễ hiểu trong phút đầu nhưng có lựa chọn đầu tư và phối hợp hiệu ứng ở các phiên chơi dài hơn.

Vòng lặp ngắn: **chạm -> nhận Coin -> mua nâng cấp -> tăng Coin/giây -> mở nội dung -> lặp lại**.

Vòng lặp theo phiên: **nhận thưởng quay lại -> nâng máy/thẻ -> tham gia sự kiện -> xem mục tiêu tiếp theo -> lưu tiến trình**.

Vòng lặp dài: **mở bộ sưu tập -> hoàn thiện tổ hợp thẻ -> đạt mốc sản lượng -> vượt kỷ lục của chính mình**.

### 2.2. Chuyển chủ đề từ bánh quy sang đồng xu

| Thành phần tham khảo | Tên/ý tưởng Coin Clicker |
|---|---|
| Bánh quy lớn | Đồng xu bạc ngôi sao bốn cánh |
| Cookies | Coin, tiền cơ bản |
| Golden Cookies | Gold Coin, tài nguyên hiếm riêng |
| Cookie production | Xưởng đúc tiền, dây chuyền và lõi năng lượng |
| Golden Cookie Rain | Golden Coin Rain / Mưa xu vàng |
| Rainbow Cookie | Rainbow Coin / Xu cầu vồng |
| Frenzy | Coin Frenzy / Bùng nổ xu |
| Cards | Thẻ công nghệ và thẻ vận may |
| Silver/Golden Chest | Rương bạc / Rương vàng |
| Magic Keys | Chìa khóa sao; công dụng do Coin Clicker tự quy định |
| Mốc một quadrillion | Mốc tổng sản xuất `10^15` Coin, danh hiệu “Bậc thầy đúc xu” |

`10^15` là mốc lấy cảm hứng từ PDF trang 4; tên danh hiệu và cách trao thưởng là CC-ĐX. Không kết thúc game khi đạt mốc này.

### 2.3. Quy chuẩn hình ảnh ban đầu

- Điểm nhấn: bạc, xanh băng, xanh navy; vàng dùng cho tiền hiếm, cầu vồng dùng riêng cho sự kiện đặc biệt.
- Bảng màu thử nghiệm: nền `#101B31`, panel `#1B2B46`, bạc `#DCE6F5`, xanh sáng `#78D2FF`, vàng `#FFC857`.
- Giữ ngôi sao bốn cánh rõ ở kích thước nhỏ; không để phát sáng che mất hình đồng xu.
- Đồng xu chính có các trạng thái thường, nhấn xuống, sáng viền, Frenzy và khóa tương tác khi có modal.
- Nền game tương phản với xu bạc; nền trắng trong ảnh tham chiếu không bắt buộc là nền gameplay.
- Thiết kế nút, icon, âm thanh và tên vật phẩm riêng cho Coin Clicker; dùng ảnh người dùng làm định hướng nhận diện.
- Tách lớp ánh sáng, hạt, chữ thưởng khỏi ảnh xu để đổi hiệu ứng mà không phải sửa ảnh gốc.

<a id="s03"></a>
## 3. Bảng đối chiếu toàn bộ nhóm tính năng

Mã F được giữ để đối chiếu với bản kế hoạch cũ và PDF. Dòng “Bỏ” là đã loại khỏi phạm vi, không phải task hoãn hoặc tính năng cần làm để hoàn thành game.

| ID | Nhóm / trang PDF | Quyết định cho bản cá nhân | Giai đoạn |
|---|---|---|---|
| F01 | Chạm xu, tr. 4-6; PDF-XN | Giữ click power và phản hồi hình/âm | P1-P2 |
| F02 | Ví/CPS/sản xuất, tr. 6, 12; PDF-XN | Giữ số dư, tổng sản xuất và máy đúc | P1-P2 |
| F03 | Shop, tr. 7-8; PDF-XN | Giữ nâng cấp bằng tiền trong game | P2 |
| F04 | MORE/SHOP/BOOSTERS, tr. 5-6 | Giữ điều hướng gọn, thanh mốc có nhãn | P2-P3 |
| F05 | Boosters, tr. 5, 8; chi tiết PDF-CK | Giữ, nhận qua gameplay | P3 |
| F06 | Time Warp, tr. 8, 14; công thức PDF-CK | Giữ vật phẩm; bỏ mua bằng tiền thật | P3 |
| F07 | Gold và mưa vàng, tr. 6-7, 9; PDF-XN | Giữ Gold làm tài nguyên hiếm kiếm khi chơi | P3 |
| F08 | Rainbow/Frenzy, tr. 9; PDF-XN | Giữ sự kiện và luật cộng dồn riêng | P3-P4 |
| F09 | Thẻ/nâng cấp/combine, tr. 9-10 | Giữ sưu tập, nâng bằng bản trùng và tổ hợp | P4 |
| F10 | Rương bạc/vàng, tr. 10-11; PDF-XN | Giữ bảng rơi và mở rương một lần | P4 |
| F11 | Magic Keys, tr. 11, 14; công dụng PDF-CK | Giữ chìa sao kiếm trong game, không phụ thuộc gói hàng | P4 |
| F12 | Thưởng ngày/streak, tr. 11; PDF-XN | Giữ thưởng theo ngày trên máy, đơn giản hóa chuỗi ngày | P5 |
| F13 | Chơi không mạng, tr. 12; PDF-XN | Giữ; chạy local, cache/PWA nếu cần | P2, P6 |
| F14 | Thu nhập khi đóng game, tr. 12, 19; PDF-CK | Giữ luật offline do Coin Clicker quy định | P2 |
| F15 | Huy chương, tr. 5, 13; PDF-CK | Giữ thành tích cá nhân và mốc thưởng | P5 |
| F16 | Bạn bè/leaderboard, tr. 12-13 | Bỏ; xem thống kê và kỷ lục cá nhân thay thế | Không triển khai |
| F17 | Game Center/Facebook, tr. 12-13 | Bỏ tích hợp dịch vụ xã hội | Không triển khai |
| F18 | Reset, tr. 13, 19; PDF-XN | Giữ reset có backup và giữ cài đặt | P5 |
| F19 | Save/chuyển máy/cloud, tr. 13, 22 | Giữ save/backup/export/import, bỏ đồng bộ cloud | P1-P2 |
| F20 | Quảng cáo/No Ads, tr. 14 | Bỏ hoàn toàn, kể cả quảng cáo nhận thưởng | Không triển khai |
| F21 | Gói trả phí, tr. 14, 20 | Bỏ cửa hàng tiền thật; chuyển nguồn vật phẩm sang gameplay | P3-P5 cho vật phẩm |
| F22 | Cài đặt/ngôn ngữ, tr. 14, 17 | Giữ âm/rung/hiệu ứng/save; chỉ tiếng Việt | P2, P5 |
| F23 | Công thức/chiến thuật, tr. 14-17 | Giữ tooltip cần thiết, hướng dẫn ngắn | P2, P6 |
| F24 | Mốc lớn/FAQ, tr. 4, 19 | Giữ mốc `10^15`, số lớn và hướng dẫn save | P1, P5-P6 |

Những phần phân biệt sản phẩm, thuật ngữ, timeline và nguồn của PDF là tham khảo, không chuyển thành menu hoặc chức năng bắt buộc.

<a id="s04"></a>
## 4. Nền tảng và công nghệ đề xuất

Giữ bộ công cụ web đã chọn để phát triển và chạy local. Một ứng dụng, một lõi, một save đang chơi; không tạo monorepo hoặc package chia sẻ khi chưa có nhu cầu.

| Phần việc | Lựa chọn đề xuất | Lý do và giới hạn |
|---|---|---|
| Ngôn ngữ | TypeScript với kiểm tra kiểu nghiêm ngặt | Kiểm tra kiểu dữ liệu, tách lõi khỏi giao diện để dễ sửa |
| Giao diện | React | Chia màn hình thành component; trạng thái gameplay ở engine, không nằm rải trong component |
| Công cụ phát triển | Vite | Phục vụ môi trường phát triển và đóng gói web; dùng mẫu React/TypeScript |
| Gameplay | Thư viện TypeScript thuần trong `src/core` | Chạy không cần giao diện để test và mô phỏng kinh tế |
| Hiệu ứng | CSS và Canvas 2D theo nhu cầu | CSS cho nút/xu; Canvas cho mưa xu khi cần, không dựng engine 3D ngay |
| Số lớn | `decimal.js` qua lớp `Amount` | Độ chính xác cấu hình được; chỉ một file phụ thuộc thư viện số |
| Save | IndexedDB qua `SaveRepository` | Dữ liệu có cấu trúc và giao dịch; vẫn cần export vì dữ liệu trình duyệt có thể bị xóa |
| Kiểm thử | Vitest và Playwright | Kiểm thử công thức/hệ thống và luồng thao tác trình duyệt |
| Quản lý gói | npm, một lockfile | Dễ tái tạo môi trường; lưu phiên bản runtime trong cấu hình dự án |

Nguồn kỹ thuật: [Vite](https://vite.dev/guide/) hỗ trợ dự án React/TypeScript; [React](https://react.dev/learn/thinking-in-react) hướng dẫn chia component và xác định state. [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) cung cấp lưu trữ dữ liệu có cấu trúc phía trình duyệt. Đây là cơ sở công cụ; cách chia module trong tài liệu là thiết kế riêng cho dự án.

[decimal.js](https://mikemcl.github.io/decimal.js/) hỗ trợ số thập phân với độ chính xác tùy chỉnh. [Vitest](https://vitest.dev/guide/) và [Playwright](https://playwright.dev/docs/intro) là công cụ kiểm thử được đề xuất.

Chốt phiên bản ổn định và tương thích ở P0, ghi lockfile, kiểm tra yêu cầu runtime từ tài liệu tại thời điểm cài. Không ghi cứng một phiên bản “mới nhất” vào lộ trình dài hạn.

<a id="s05"></a>
## 5. Cấu trúc thư mục từ ngày đầu tiên

### 5.1. Nguyên tắc sắp xếp

1. **Tách theo trách nhiệm, bên trong tách theo tính năng.** Luật shop thuộc lõi shop; màn hình shop thuộc giao diện shop.
2. **Dữ liệu cân bằng tách khỏi thuật toán.** Đổi giá/cấp/xác suất trong `content`; đổi cách tính trong `core`.
3. **Lõi không biết React, DOM, IndexedDB hoặc mã giao diện.** Nó nhận dữ liệu và trả kết quả.
4. **Một nguồn dữ liệu thật cho gameplay.** UI chỉ giữ trạng thái hiển thị như tab đang mở, không giữ ví tiền thứ hai.
5. **Chỉ tạo thư mục khi có module đầu tiên.** Cây bên dưới là bản đồ đích; P0 tạo phần nền, P4 mới tạo thẻ/rương.
6. **Đánh số tài liệu và migration, không đánh số file code.** Tên `01-Shop.tsx` không thể hiện trách nhiệm và gây phiền khi thêm file.
7. **Không để ảnh, file tạm, save thử và code chung một chỗ.** Build, dữ liệu người chơi và secret không đưa vào Git.

### 5.2. Cây thư mục đích

```text
Coin Clicker/
├── COIN_CLICKER_ROADMAP.md          # Tài liệu lộ trình này
├── README.md                       # Cài đặt, chạy, kiểm tra, liên kết tài liệu
├── CHANGELOG.md                    # Thay đổi theo phiên bản game
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.js                # Quy tắc code và ranh giới import
├── .editorconfig
├── .gitignore
├── index.html
├── docs/
│   ├── 00-overview.md
│   ├── 01-game-design.md
│   ├── 02-architecture.md
│   ├── 03-economy-balance.md
│   ├── 04-save-format.md
│   ├── 05-art-ui-guide.md
│   ├── 06-testing-release.md
│   ├── 07-feature-traceability.md   # F01-F24, nguồn, trạng thái, task
│   ├── decisions/                 # Quyết định kiến trúc có lý do
│   │   └── 0001-platform.md
│   └── references/                # Danh mục nguồn và ảnh tham chiếu nếu lưu được
├── assets-source/                 # Ảnh/âm gốc có thể chỉnh sửa, không đóng vào app
│   ├── coins/
│   ├── cards/
│   ├── ui/
│   └── audio/
├── public/
│   ├── icons/                     # Icon ứng dụng/PWA
│   └── manifest.webmanifest       # Tạo ở P6
├── src/
│   ├── main.tsx                   # Điểm khởi động
│   ├── app/
│   │   ├── App.tsx                # Ghép màn hình, không chứa công thức game
│   │   ├── bootstrap.ts           # Nạp catalog, save, adapter, engine
│   │   ├── game-store.ts          # Cầu nối snapshot của engine với React
│   │   └── navigation.ts
│   ├── core/
│   │   ├── engine/                # Commands, reducer, scheduler, selectors
│   │   ├── state/                 # GameState và trạng thái khởi tạo
│   │   ├── economy/               # Wallet, production, nguồn thu/chi
│   │   ├── offline/               # Quyết toán thời gian vắng mặt và watermark
│   │   ├── clicking/              # Luật tính một thao tác chạm
│   │   ├── shop/                  # Giá, điều kiện mua, mua nhiều
│   │   ├── effects/               # Áp dụng/cộng dồn/hết hạn hiệu ứng
│   │   ├── boosters/              # Dùng vật phẩm, Time Warp
│   │   ├── events/                # Mưa vàng, cầu vồng, Frenzy
│   │   ├── cards/                 # Sở hữu, trang bị, nâng cấp, tổ hợp
│   │   ├── chests/                # Bảng thưởng, mở rương
│   │   ├── daily-rewards/         # Nhận theo ngày và tiến độ chu kỳ
│   │   ├── achievements/          # Điều kiện, nhận thưởng, mốc lớn
│   │   ├── progression/           # Mở khóa, chỉ số thống kê, reset
│   │   ├── rewards/               # RewardBundle, giao dịch nhận thưởng
│   │   ├── ports/                 # Clock, RNG, SaveRepository
│   │   └── index.ts               # API công khai của lõi
│   ├── content/
│   │   ├── schemas/               # Kiểm tra cấu trúc catalog khi chạy/build
│   │   ├── balance.json           # Tham số chung, phiên bản cân bằng
│   │   ├── generators.json        # Máy sản xuất
│   │   ├── upgrades.json          # Nâng cấp click/hiệu suất/sự kiện
│   │   ├── item-offers.json       # Đổi Gold lấy booster, rương và chìa
│   │   ├── boosters.json
│   │   ├── events.json
│   │   ├── cards.json
│   │   ├── card-synergies.json
│   │   ├── chests.json
│   │   ├── loot-tables.json
│   │   ├── daily-rewards.json
│   │   ├── achievements.json
│   │   ├── unlocks.json
│   │   └── index.ts               # Nạp, kiểm tra và xuất GameCatalog
│   ├── features/                  # UI theo tính năng, gọi commands qua app
│   │   ├── clicker/
│   │   ├── shop/
│   │   ├── boosters/
│   │   ├── events/
│   │   ├── cards/
│   │   ├── chests/
│   │   ├── daily-rewards/
│   │   ├── achievements/
│   │   ├── statistics/
│   │   ├── settings/
│   │   └── help/
│   ├── ui/
│   │   ├── components/            # Button, Modal, Tooltip, CurrencyAmount
│   │   ├── layout/                # GameShell, BottomNav, Panel
│   │   └── styles/                # tokens.css, global.css, accessibility.css
│   ├── platform/
│   │   ├── storage/               # IndexedDB, codec, backup, import/export
│   │   │   └── migrations/        # v001-to-v002.ts, ...
│   │   ├── time/                  # Clock thực, xử lý resume
│   │   ├── random/                # RNG, seed cho test/local
│   │   ├── lifecycle/             # Pause/resume, một tab được ghi save
│   │   ├── audio/
│   │   └── haptics/
│   ├── shared/
│   │   ├── amount.ts              # Lớp bọc decimal.js
│   │   ├── ids.ts
│   │   └── result.ts              # Kiểu kết quả/lỗi chung nhỏ gọn
│   ├── assets/
│   │   ├── asset-manifest.ts      # ID tài nguyên -> file, metadata
│   │   ├── images/coins/
│   │   ├── images/cards/
│   │   ├── images/chests/
│   │   ├── images/backgrounds/
│   │   ├── images/ui/
│   │   ├── audio/sfx/
│   │   └── audio/music/
│   └── locales/
│       └── vi.json
├── tests/
│   ├── integration/
│   ├── e2e/
│   ├── fixtures/saves/            # Save cũ mẫu, không dùng save thật của user
│   └── helpers/                   # FakeClock, SeededRng, MemorySaveRepository
├── scripts/
│   ├── validate-content.ts
│   ├── simulate-economy.ts
│   └── check-assets.ts
└── .github/workflows/ci.yml        # Tùy chọn, chỉ khi muốn tự động kiểm tra
```

Không tạo thư mục cho tính năng đã bỏ. Một repo và một `package.json` là đủ; `src/core` tiếp tục là lõi dùng trong game và test. Chỉ tạo `public/manifest.webmanifest` và mã cache khi thực hiện tùy chọn PWA ở P6.

### 5.3. Mẫu tổ chức một tính năng

```text
src/core/shop/
├── shop.types.ts
├── calculate-price.ts
├── calculate-price.test.ts
├── purchase-generator.ts
├── purchase-generator.test.ts
└── index.ts

src/features/shop/
├── ShopPanel.tsx
├── GeneratorRow.tsx
├── UpgradeCard.tsx
├── useShopViewModel.ts
├── shop.module.css
└── index.ts
```

Test đơn vị đặt cạnh thuật toán; test liên tính năng đặt trong `tests/integration`; thao tác người chơi đặt trong `tests/e2e`. Component dùng PascalCase, hook bắt đầu bằng `use`, file nghiệp vụ/data dùng kebab-case. ID nội dung dùng dạng ổn định như `generator.hand-press`; đổi tên tiếng Việt không đổi ID.

Không thêm mọi thứ vào `utils.ts`, `Game.tsx`, `data.ts` hoặc `global.css`. Khi một file có nhiều trách nhiệm, tách theo trách nhiệm; mốc khoảng 250-350 dòng là tín hiệu xem lại, không phải giới hạn máy móc.

<a id="s06"></a>
## 6. Quy tắc kiến trúc và dữ liệu

### 6.1. Luồng thao tác bắt buộc

```text
Người chơi nhấn nút
  -> UI tạo command (không tự cộng/trừ tiền)
  -> Engine kiểm tra điều kiện trên state hiện tại
  -> Hàm nghiệp vụ tính nextState + domainEvents
  -> Commit giao dịch nếu cần lưu bền vững
  -> Store phát snapshot mới
  -> UI vẽ và phát âm/hoạt ảnh theo kết quả đã chấp nhận
```

Ví dụ command: `ClickCoin`, `PurchaseGenerator`, `PurchaseUpgrade`, `PurchaseItemOffer`, `ActivateBooster`, `CollectEventCoin`, `EquipCard`, `UpgradeCard`, `OpenChest`, `ClaimDailyReward`, `ResetProgress`.

Thứ tự phụ thuộc:

- `core` chỉ dùng types của catalog, ports và `shared`; không đọc JSON qua UI và không gọi dịch vụ ngoài trực tiếp.
- `content` cung cấp dữ liệu được kiểm tra; `app/bootstrap` nạp và truyền catalog cho engine.
- `platform` hiện thực các ports; không tự thêm luật về giá hay phần thưởng.
- `features` đọc selectors và gửi command qua `app/game-store`; không sửa trực tiếp state.
- `ui/components` không phụ thuộc `features` và không tự biết phần thưởng thẻ/rương.
- `shared` không import ngược các tầng khác. Chỉ đưa vào đây phần thực sự dùng chung.
- Khai báo alias `@core`, `@content`, `@features`, `@platform`, `@ui`, `@shared`; lint chặn import vòng và import vượt ranh giới.

### 6.2. Các loại dữ liệu cần tách

| Loại | Ví dụ | Nơi giữ |
|---|---|---|
| Catalog cố định theo bản phát hành | Giá gốc, hệ số giá, bảng rơi, tên khóa dịch | `content` |
| GameState có thể lưu | Ví, máy sở hữu, thẻ, vật phẩm, thống kê, claim | Engine và save |
| Chỉ số suy ra | CPS hiện tại, click power, giá món tiếp theo | Selectors; tính lại khi nguồn thay đổi |
| Trạng thái UI | Tab mở, bộ lọc, modal, hiệu ứng hạt | React/renderer, không ghi vào gameplay save |
| Cài đặt cá nhân | Âm lượng, rung, mức hiệu ứng | Kho settings cục bộ, không mất khi reset lượt chơi |

Không lưu CPS như một nguồn sự thật thứ hai rồi cộng thêm khi load. Load state gốc, tính lại CPS từ catalog và hiệu ứng.

### 6.3. Hợp đồng dữ liệu gợi ý

Các kiểu dưới đây là phác thảo hợp đồng, không phải toàn bộ source code:

```ts
type AmountString = string; // Decimal được mã hóa, ví dụ "12500.25"

interface SaveEnvelope {
  schemaVersion: number;
  contentVersion: string;
  appVersion: string;
  runId: string;
  revision: number;
  savedAtUtc: string;
  checksum: string; // Phát hiện hỏng dữ liệu, không phải cơ chế chống sửa save
  payload: GameStateDto;
}

interface GameStateDto {
  wallet: { coin: AmountString; goldCoin: AmountString };
  generators: Record<string, number>;
  purchasedUpgradeIds: string[];
  inventory: Record<string, number>; // Booster, rương, chìa khóa
  cards: Record<string, { level: number; duplicates: number }>;
  equippedCardIds: string[];
  activeEffects: EffectDto[];
  events: EventStateDto;
  dailyRewards: DailyRewardStateDto;
  achievements: Record<string, AchievementStateDto>;
  statistics: StatisticsDto;
  unlockedIds: string[];
  lastSimulatedAtUtc: string;
  lastAcceptedWallClockUtc: string;
  rngState: string;
  recentTransactions: TransactionDto[];
}
```

`EffectDto`, `EventStateDto` và các DTO còn lại sẽ được định nghĩa trong task triển khai tương ứng. Settings dùng kho riêng để reset gameplay không vô tình xóa chúng. `recentTransactions` được giới hạn dung lượng; mốc claim và kết quả rương đã nhận phải có trạng thái bền vững riêng, không phụ thuộc mãi vào danh sách gần đây.

### 6.4. Quy tắc catalog

- Mỗi đối tượng có `id`, `nameKey`, `descriptionKey`, `iconId`, điều kiện mở khóa và dữ liệu hiệu ứng.
- ID là bất biến; bỏ một món phải có chiến lược chuyển save cũ, không tái sử dụng ID cũ cho món mới.
- Biểu diễn hiệu ứng bằng cấu trúc như `target`, `operation`, `value`, `stackGroup`, `durationSeconds`; không nhúng JavaScript dạng chuỗi trong JSON.
- Số kinh tế ghi bằng chuỗi; số đếm nhỏ/cấp/slot dùng integer có giới hạn rõ.
- Validator phát hiện ID trùng, khóa dịch thiếu, icon thiếu, giá âm, tham chiếu không tồn tại, vòng điều kiện mở khóa và bảng rơi vô hiệu.
- Mỗi bản cân bằng có `contentVersion`; thay đổi schema save mới tăng `schemaVersion`. Hai loại phiên bản có mục đích khác nhau.
- Chỉ thêm tùy chọn cấu hình cần dùng. Không xây hệ thống bật/tắt tính năng từ xa cho bản chơi cá nhân.

<a id="s07"></a>
## 7. Đặc tả gameplay và công thức

**Toàn bộ thông số thử nghiệm bên dưới là CC-ĐX.** Mục đích là có một bộ luật nhất quán để bắt đầu, sau đó điều chỉnh bằng mô phỏng và chơi thử.

### 7.1. Tiền tệ, thống kê và số lớn

| Đại lượng | Vai trò | Quy tắc |
|---|---|---|
| Coin | Mua máy, nâng cấp và một phần chi phí nâng thẻ | Có thể có phần lẻ từ sản xuất; UI được làm tròn nhưng lưu đủ độ chính xác |
| Gold Coin | Tiền hiếm từ sự kiện/phần thưởng | Số nguyên; không có tỷ lệ đổi sang Coin mặc định |
| Star Key | Vật phẩm mở rương vàng | Số nguyên trong inventory, không trộn với số dư Gold |
| `totalProducedCoin` | Tổng Coin tạo bằng click, máy, offline, Time Warp và sự kiện | Không giảm khi chi tiêu; không tính daily hoặc rương |
| `totalEarnedCoin` | Tổng mọi Coin được cộng hợp lệ | Bao gồm thưởng; mỗi giao dịch có nguồn rõ |
| `totalSpentCoin` | Tổng Coin đã tiêu | Chỉ tăng sau giao dịch mua thành công |
| CPS, Coin/click | Chỉ số hiệu suất | Là giá trị suy ra; tooltip chỉ rõ hiệu ứng đang tác động |

- Bắt đầu với 0 Coin, 0 Gold, sức nhấn 1 Coin/lần, chưa có máy sản xuất.
- Dùng `Amount` từ P1, không chờ đến khi game vượt `Number.MAX_SAFE_INTEGER` mới sửa.
- Đề xuất phạm vi v1 đến `1e100`, precision Decimal 120 chữ số có nghĩa; xử lý phép chia với sai số quy định, giữ phần dư sản xuất. Khi tiến tới giới hạn, hiển thị mốc mở rộng thay vì để Infinity/NaN đi vào save.
- Chi phí mua được làm tròn lên thành Coin nguyên; Gold, rương và chìa không có phần thập phân.
- Chỉ làm tròn khi hiển thị hoặc tại ranh giới được quy định như giá mua. Không làm tròn sản lượng mỗi frame.
- Định dạng ngắn K/M/B/T hoặc dạng khoa học; tooltip cho giá trị chính xác theo locale. Không lấy chuỗi đã định dạng để tính toán.

### 7.2. Nhấn, sản xuất tự động và nhịp mô phỏng

```text
baseProduction = tổng(quantity[i] × baseCps[i] × generatorMultiplier[i])
passiveCps = baseProduction × permanentProductionMultiplier
activeCps = passiveCps × temporaryProductionMultiplier

clickValue = (baseClick + flatClickBonus)
             × permanentClickMultiplier × temporaryClickMultiplier

coinFromProduction = activeCps × elapsedSeconds
coinFromAcceptedClick = clickValue tại thời điểm command được xử lý
```

`permanent...` bao gồm nâng cấp và thẻ đang trang bị hợp lệ; `temporary...` gồm booster/Frenzy theo nhóm hiệu ứng. Phân biệt rõ modifier của một máy với modifier toàn bộ sản lượng để không nhân hai lần.

- Nhịp xử lý đề xuất 10 lần/giây khi màn hình hoạt động; animation dùng nhịp vẽ riêng.
- Mỗi lần cập nhật tính theo thời gian thực đã trôi qua, không cộng một lượng cố định cho mỗi frame.
- Nếu hiệu ứng hết hạn giữa khoảng cập nhật, chia khoảng theo thời điểm hết hạn và tính từng đoạn.
- Khi người chơi mua hoặc trang bị thẻ, xử lý phần thời gian trước command rồi mới đổi chỉ số.
- Desktop hỗ trợ chuột, Enter/Space khi vùng xu được focus; điện thoại hỗ trợ pointer và nhiều ngón theo quy tắc thống nhất.
- Chọn một đường ghi nhận thao tác để không cộng đôi từ `pointerdown` và `click`. UI có thể phát hiệu ứng ngay nhưng tiền chỉ cộng từ command hợp lệ.
- Nghiệm thu: cùng state và chuỗi thao tác, chạy renderer 30 FPS hay 60 FPS không làm thay đổi sản lượng.

### 7.3. Máy sản xuất và cửa hàng

Danh mục thử nghiệm P2, sau đó mở rộng cùng cấu trúc dữ liệu:

| ID | Tên máy | Giá gốc Coin | CPS mỗi máy | Hệ số tăng giá |
|---|---|---:|---:|---:|
| `generator.hand-press` | Máy ép xu thủ công | 15 | 0,1 | 1,15 |
| `generator.auto-press` | Máy dập tự động | 100 | 1 | 1,15 |
| `generator.mint-workshop` | Xưởng đúc xu | 1.100 | 8 | 1,15 |
| `generator.mint-factory` | Nhà máy tiền xu | 12.000 | 47 | 1,15 |
| `generator.plasma-forge` | Lò đúc plasma | 130.000 | 260 | 1,15 |
| `generator.star-core` | Lõi sao bốn cánh | 1.400.000 | 1.400 | 1,15 |

Đây là bộ dữ liệu khởi động để test, không phải bảng cân bằng đã được chứng minh. P6 dùng mô phỏng để thay cả đường giá/sản lượng nếu cần. Mở thêm ít nhất 6 cấp máy cao hơn cho bản gameplay đầy đủ.

```text
price(i, n) = ceil(basePrice[i] × growth[i]^n)
bulkPrice(i, n, q) = tổng price(i, n+j), j = 0..q-1
```

`n` là số máy đang có trước khi mua; `q` là lượng mua. Tổng cấp số nhân có thể dùng để ước lượng nhưng kết quả thu tiền phải khớp tổng từng giá đã làm tròn. Nút Max dùng tìm kiếm số lượng có thể trả, sau đó kiểm chứng lại chi phí chính xác.

Yêu cầu shop:

- Mua x1/x10/x100/Max; hiển thị giá, số đang sở hữu, phần tăng CPS, điều kiện khóa.
- Có nhóm nâng cấp click, máy cụ thể, hiệu suất toàn bộ và sự kiện.
- Khi bấm mua liên tục, command kiểm tra số dư mới nhất; không cho số âm hoặc mua vượt cấp.
- Giá và phần thưởng đi chung một giao dịch; lỗi lưu ở giao dịch quan trọng phải có trạng thái lỗi rõ.
- Không có bán lại máy trong v1; nếu bổ sung sau cần luật hoàn tiền và chống vòng mua/bán kiếm lời.
- So sánh hiệu quả dùng `paybackSeconds = cost / deltaPassiveCps` khi `deltaPassiveCps > 0`. Nâng cấp click không hiển thị hoàn vốn giả nếu chưa có giả định số lần chạm.
- Mục tiêu nhập môn: người chơi hiểu và mua được máy đầu trong khoảng 30-90 giây; đây là mục tiêu chơi thử, không phải kết quả đã đạt.

### 7.4. Bộ xử lý hiệu ứng dùng chung

Mỗi hiệu ứng ghi `sourceId`, `target`, `operation`, `value`, `stackGroup`, `startsAt`, `expiresAt`, `stackPolicy`.

Quy tắc mặc định:

1. Cộng bonus phẳng vào giá trị nền.
2. Cộng các bonus phần trăm trong cùng nhóm thường trực rồi chuyển thành multiplier.
3. Nhân các nhóm độc lập theo thứ tự cố định được khai báo.
4. Trong cùng nhóm hiệu ứng tạm thời, lấy hệ số mạnh nhất; hiệu ứng yếu không ghi đè hiệu ứng mạnh.
5. Dùng lại cùng booster khi còn hiệu lực: nối thời gian trong giới hạn cấu hình, hiển thị tổng thời gian trước khi xác nhận.
6. Frenzy và booster sản xuất thuộc hai nhóm riêng nên có thể nhân; giới hạn multiplier tổng của bản thử nghiệm là x20, hiển thị khi chạm trần.

Giới hạn x20 áp dụng phần multiplier tạm thời của từng chỉ số, không cắt sức mạnh nâng cấp thường trực. Golden event multiplier là chỉ số riêng, không tự ăn mọi bonus CPS.

### 7.5. Boosters và Time Warp

| Booster thử nghiệm | Tác dụng đề xuất | Quy tắc |
|---|---|---|
| Turbo Mint | x2 sản xuất tự động trong 60 giây | Không tăng trực tiếp click |
| Power Tap | x3 Coin/click trong 30 giây | Không tăng CPS |
| Golden Magnet | Thu hộ xu vàng rơi trong 30 giây | Chỉ đối tượng của sự kiện mưa vàng, không tự chạm Rainbow |
| Time Warp 1h | Nhận ngay `passiveCps × 3.600` Coin | Không nhân booster/Frenzy, không đẩy ngày hoặc đồng hồ sự kiện |

- Nguồn nhận: daily, thành tích, rương và quầy vật phẩm đổi bằng Gold; không có vật phẩm chỉ nhận qua thanh toán.
- Hiện preview chính xác lượng thưởng trước khi dùng Time Warp. Dùng giá trị tại thời điểm engine chấp nhận command.
- Số lượng vật phẩm và phần thưởng được cập nhật một lần; reload sau animation không thể dùng lại cùng vật phẩm.
- Time Warp không làm nhận daily sớm, không tạo mưa vàng trong “giờ được bỏ qua”, không làm trôi hạn effect thực tế.
- Tooltip nói rõ booster nào cộng dồn với Frenzy và cái nào chỉ ảnh hưởng click/sản xuất/sự kiện.

### 7.6. Golden Coin Rain, Rainbow Coin và Frenzy

Máy trạng thái sự kiện: `waiting -> spawning -> active -> finished -> cooldown`.

Thông số đầu tiên để chơi thử:

- Mưa vàng: chờ ngẫu nhiên 180-300 giây **chơi chủ động**, kéo dài 15 giây; mỗi đợt có 10 xu vàng, mỗi xu thu được cho 1 Gold cơ bản.
- Mỗi xu có ID, vị trí, thời gian sinh/hết hạn và trạng thái đã nhận. Chạm hai lần cùng ID chỉ thưởng một lần.
- Rainbow: mở ở `totalProducedCoin >= 10.000`; khoảng chờ chủ động 600-900 giây; tồn tại 8 giây để chạm.
- Rainbow được thu sẽ kích hoạt Frenzy 20 giây: x3 sản xuất và click, đồng thời x2 Gold từ mưa vàng xảy ra trong thời gian này.
- Nếu Rainbow xuất hiện khi Frenzy còn hoạt động, luật v1 là nối thêm thời gian, tổng còn lại không quá 40 giây; không nhân x3 thêm lần nữa.
- Thẻ có thể tăng thời lượng hoặc thưởng đúng chỉ số được ghi trong catalog; dùng trần cấu hình để tránh tổ hợp vô hạn.
- Chữ/hạt xu trang trí không có collider thu thưởng và không dùng cùng kiểu hiển thị với xu tương tác.
- Khi chuyển nền/đóng app: kết thúc các vật thể chưa thu, không phát lại phần thưởng; đồng hồ chờ sự kiện chủ động tạm dừng. Frenzy/booster có hạn theo thời gian thực vẫn hết hạn.
- Lưu seed/trạng thái bộ sinh và cooldown; reload không được tự tạo ngay sự kiện mới để người chơi quay lại lấy lợi thế.

Khoảng chờ và số xu đều nằm trong `content/events.json`; không ghi trực tiếp trong component animation.

### 7.7. Thẻ: sở hữu, trang bị, nâng cấp và phối hợp

Quy mô đề xuất P4: 12 thẻ, 3 bậc hiếm, cấp 1-10. Bắt đầu với 2 ô trang bị, mở ô thứ ba ở mốc được ghi trong `unlocks.json`.

Các nhóm hiệu ứng: sức nhấn, máy sản xuất, Gold, thời lượng sự kiện, Frenzy và hiệu suất offline. Danh mục phải có ít nhất một thẻ liên quan Rainbow và một thẻ liên quan Frenzy để bao phủ PDF.

- Nhận thẻ chưa có: mở khóa ở cấp 1. Nhận thêm cùng ID: tăng `duplicates`.
- Nâng cấp: dùng bản trùng và Coin theo bảng chi phí từng cấp; preview hiệu quả/chi phí trước khi bấm.
- Chỉ thẻ đang trang bị tạo bonus, trừ thẻ được catalog đánh dấu rõ là bonus bộ sưu tập; v1 có thể bỏ loại thứ hai để đơn giản.
- Không cho cùng ID chiếm hai ô; tháo/lắp không mất thẻ.
- “Combine” của Coin Clicker được định nghĩa là **tổ hợp thẻ khi cùng trang bị**, không mặc định là phá hủy hai thẻ. Ví dụ Rainbow Finder + Frenzy Core cho bonus thời lượng Frenzy; hiển thị bonus riêng.
- Nâng cấp bằng thẻ trùng và tổ hợp thẻ là hai thao tác khác nhau; UI không dùng chung một nút “ghép” mơ hồ.
- Thẻ trùng khi đã max cấp được chuyển thành Gold theo bảng đổi CC-ĐX; kết quả hiện trước và có ghi nguồn giao dịch.
- Không cho thay thẻ giữa lúc xử lý một giao dịch rương/Time Warp để nhận cả hai cấu hình; engine xử lý command tuần tự.
- Tooltip hiển thị chỉ số hiện tại, cấp tiếp theo, thẻ đang dùng và tổ hợp đang hoạt động.

### 7.8. Rương và chìa khóa

- Rương bạc: nhận miễn phí từ tiến trình/daily, mở không cần chìa.
- Rương vàng: cần 1 Star Key; chìa nhận từ gameplay và đổi bằng Gold. Đây là luật CC-ĐX vì PDF chưa xác nhận cách dùng Magic Keys.
- Kho tách rương chưa mở, chìa, booster và thẻ; không dùng một số đếm chung.
- Preview gồm phần thưởng chắc chắn, số lượt rút, tỷ lệ từng kết quả và cách xử lý thẻ trùng.
- Bảng rơi có thể lưu trọng số nguyên; UI tính xác suất từ tổng trọng số. Không có trường “% hiển thị” khác với dữ liệu rút thật.
- Chốt một kết quả trước khi animation mở rương; lưu tiêu rương/chìa và nhận thưởng cùng giao dịch.
- Đóng ứng dụng khi đang mở: lần mở sau hiển thị lại kết quả đã chốt, không rút lại.
- RNG và kết quả rương được xử lý cục bộ; inject seed để test tái hiện được lỗi.
- Quy tắc bảo đảm sau nhiều lần mở chỉ thêm nếu được đặc tả, lưu counter và công bố; không ngầm giả định đã có trong game gốc.

### 7.9. Thưởng ngày đơn giản, không bắt buộc giữ chuỗi

Luật CC-ĐX cho chơi cá nhân: giữ chu kỳ 7 lần nhận, tối đa một lần/ngày. **Bỏ một ngày không mất tiến độ chu kỳ**; bỏ bộ đếm chuỗi liên tiếp và tính năng phục hồi chuỗi. Nếu cần thống kê, chỉ dùng tổng số ngày đã nhận thưởng.

| Lần nhận trong chu kỳ | Phần thưởng thử nghiệm |
|---:|---|
| 1 | 5 Gold |
| 2 | 1 Turbo Mint |
| 3 | 1 rương bạc |
| 4 | 1 Power Tap |
| 5 | 1 Star Key |
| 6 | 1 Time Warp 1h |
| 7 | 1 rương vàng và 1 Star Key |

- Dùng ngày theo múi giờ cố định `Asia/Ho_Chi_Minh`, đổi ngày lúc 00:00 giờ Việt Nam; không phụ thuộc múi giờ đang đặt trên thiết bị.
- Timestamp vẫn lưu UTC, chỉ chuyển sang múi giờ trên để lấy `dayKey` cho daily.
- Lưu `lastClaimDayKey` và `claimCount`; phần thưởng tiếp theo là `(claimCount mod 7) + 1` trước khi tăng `claimCount`.
- Claim lại cùng ngày không nhận thêm. Nếu ngày trên máy lùi về trước ngày đã claim, không cấp thêm thưởng cho ngày cũ.
- Nhận thưởng và cập nhật ngày/số lần nhận trong cùng giao dịch save.
- Dùng giờ thiết bị; không kiểm tra online, không yêu cầu đăng nhập, không có nhãn “chưa xác thực”.

### 7.10. Thành tích, thống kê, MORE và reset

- Mục MORE chứa thống kê cá nhân, thành tích, hướng dẫn ngắn, cài đặt và phiên bản game.
- Mục tiêu tham khảo khoảng 30 thành tích ở P5: số lần chạm, tổng sản xuất, số máy, sự kiện, thẻ, rương và tổng số ngày nhận thưởng.
- Có mã thành tích bền vững và hai trạng thái riêng `unlocked`/`rewardClaimed`; không trao lặp sau load.
- Mốc `10^15` dùng `totalProducedCoin`, không dùng số dư hiện tại; mua hàng không làm mất tiến độ tới mốc.
- Thống kê tách sản lượng click/tự động/offline/sự kiện và tiền nhận qua quà, để người chơi hiểu nguồn thu.
- Reset mở màn xác nhận liệt kê dữ liệu sẽ mất, yêu cầu nhập `RESET`, tạo backup trước khi xóa.
- Reset xóa ví, máy, nâng cấp, thẻ, kho vật phẩm gameplay, lịch nhận thưởng và thành tích của lượt; tạo `runId` mới. Không gọi reset là prestige và không cho thưởng tái sinh.
- Giữ cài đặt âm thanh/hiệu ứng. Vật phẩm và lịch nhận thưởng thuộc lượt chơi sẽ được xóa sau xác nhận; ghi rõ trước khi reset.
- Backup trước reset được đặt tên riêng; không tự tải lại nó thay cho save mới khi khởi động. Chỉ khôi phục nếu người chơi chủ động chọn.

### 7.11. Nguồn vật phẩm sau khi bỏ tính năng trả phí

Mọi vật phẩm phải có đường kiếm bằng chơi game, không yêu cầu chờ dịch vụ ngoài. Gold giữ vai trò tài nguyên hiếm và giúp người chơi chọn thứ mình cần thay vì phụ thuộc hoàn toàn vào rương ngẫu nhiên.

| Vật phẩm | Nguồn nhận | Cách tránh bế tắc |
|---|---|---|
| Gold | Mưa vàng, Frenzy, daily, thành tích, thẻ trùng max cấp | Mưa vàng là nguồn lặp lại; không chỉ có thưởng một lần |
| Turbo Mint / Power Tap / Golden Magnet | Rương, thành tích, một số ngày thưởng, đổi Gold | Mọi loại đều có trong quầy vật phẩm sau mở khóa |
| Time Warp | Ngày thưởng thứ 6, rương/thành tích và đổi Gold | Có cách nhận chủ động, không bắt buộc chờ đủ ngày |
| Rương bạc / rương vàng | Mốc thành tích, daily và đổi Gold | Gold kiếm lặp lại nên không hết nguồn rương sau khi hết thành tích |
| Star Key | Daily, thành tích và đổi Gold | Preview cho biết cần chìa; luôn có thể tích Gold để đổi |
| Thẻ / bản trùng | Rương bạc/vàng có bảng rơi rõ | Mọi thẻ v1 có ít nhất một nguồn rơi có thể tiếp cận bằng chơi |

Thêm một mục **Vật phẩm** ngay trong SHOP, không tạo cửa hàng tiền thật riêng. Danh mục và giá Gold nằm ở `content/item-offers.json`, dùng `core/shop` để trừ tài nguyên/nhận vật phẩm nguyên tử. Giá khởi điểm để thử: Turbo Mint 10 Gold, Power Tap 10, Golden Magnet 15, Time Warp 40, rương bạc 20, rương vàng 50, Star Key 15; tất cả là CC-ĐX và cần cân bằng P6.

Không có No Ads, gói Standard/Mega/Ultimate, hóa đơn, nút xem quảng cáo hoặc nút restore purchases. Các tên gói bán hàng này không cần chuyển nguyên sang gameplay.

Khi cân bằng, kiểm tra phần thưởng Gold trực tiếp và Gold đổi từ thẻ max cấp không tạo vòng lặp “đổi Gold -> mở rương -> thu nhiều Gold hơn chi phí” với lợi nhuận kỳ vọng dương không giới hạn. Đồng thời bảo đảm chìa/rương/booster có thể kiếm với thời gian hợp lý.

<a id="s08"></a>
## 8. Lưu tiến trình, thời gian và chuyển save thủ công

### 8.1. Chiến lược lưu cục bộ

- Autosave định kỳ 10 giây cho click/sản xuất, và khi chuyển sang nền nếu trình duyệt cho phép; không dựa vào sự kiện đóng tab để bảo đảm lưu.
- Giao dịch thẻ/rương/daily/Time Warp dùng ghi nguyên tử ngay; chỉ thông báo hoàn tất sau khi lưu thành công.
- Save thường có `revision` tăng dần; chỉ một tab được ghi save tại một thời điểm.
- Duy trì bản hiện tại và ít nhất hai bản backup hợp lệ. Load bản mới nhất hợp lệ, không xóa bản lỗi trước khi cho phép xuất chẩn đoán.
- Nếu quota đầy hoặc IndexedDB bị chặn, báo chế độ chưa lưu và cho export; không âm thầm nói “đã lưu”.
- Đọc save -> kiểm tra schema/giá trị/giới hạn kích thước -> migration -> kiểm tra ID catalog -> hydrate Amount -> tính lại selectors.
- Save từ phiên bản mới hơn chưa hiểu: không ghi đè bằng save trắng; giữ file và yêu cầu bản game tương thích.
- Import: kiểm tra trước, preview tiến trình/mốc thời gian, backup save hiện tại rồi mới thay.
- Cửa sổ mất dữ liệu tối đa mục tiêu với click/idle là 10 giây khi crash bất thường; các giao dịch vật phẩm đã báo thành công không được mất hoặc nhận lại.

### 8.2. Thời gian và sản lượng offline

Phân biệt ba trường hợp: game mở không mạng; game ở nền; game đã đóng. Chỉ trường hợp đang hiển thị và có mô phỏng chủ động mới sinh vật thể mưa/Rainbow.

```text
offlineSeconds = clamp(nowUtc - lastSimulatedAtUtc, 0, 8 giờ)
offlineReward = passiveCpsAtSuspend × offlineSeconds × offlineEfficiency
```

`offlineEfficiency` ban đầu là 0,5; thẻ có thể tăng tối đa tới 1,0. `passiveCpsAtSuspend` được lấy từ máy/nâng cấp/thẻ thường trực tại lúc dừng, không dùng booster/Frenzy tạm thời. Nếu đổi catalog giữa hai phiên, migrate state và chốt quy tắc tính từ phiên bản cũ trước khi áp dụng cân bằng mới. Giữ bản catalog cần thiết trong build hoặc có migration quyết toán rõ; nếu không thể tính theo bản cũ thì dùng luật bồi hoàn đã ghi, không bỏ qua thời gian offline.

- Engine dùng đồng hồ đơn điệu cho thời gian trong phiên; adapter dùng UTC lưu mốc qua các phiên.
- Khi resume, quyết toán duy nhất khoảng từ watermark `lastSimulatedAtUtc`, cập nhật ví và watermark trong cùng giao dịch trước khi cho UI nhận tiếp.
- Hộp “Chào mừng quay lại” là bản tóm tắt phần thưởng đã commit; đóng/mở lại không nhận thêm cùng khoảng thời gian.
- Khoảng quá 8 giờ vẫn tiến watermark tới hiện tại, không để reload nhận từng đợt 8 giờ liên tiếp.
- Bộ đếm sinh sự kiện chủ động được giữ nguyên lúc nền; không mô phỏng hàng nghìn xu rơi khi quay lại.
- Booster/Frenzy hết hạn theo timestamp thực; phần thời gian offline không nhận bonus tạm thời, kể cả booster chưa hết. UI phải thông báo quy tắc này khi dùng.
- Nếu đồng hồ lùi, thưởng khoảng đó bằng 0 và không hạ `lastAcceptedWallClockUtc`; báo rõ tình trạng để tránh giá trị âm. Đây là kiểm tra tính đúng, không xây hệ thống chống sửa giờ cho một người chơi.

### 8.3. Nhiều tab, migration và cập nhật ứng dụng

- Dùng cơ chế khóa phù hợp của trình duyệt và giao dịch kiểm tra revision để chỉ một tab ghi state; tab phụ chỉ xem hoặc đề nghị chuyển quyền.
- Khi tab ghi bị đóng đột ngột, tab khác chỉ tiếp quản sau khi quyền ghi hết hiệu lực và đã nạp save mới nhất.
- Migration tăng từng bước, ví dụ v1 -> v2 -> v3; test từ fixture của từng phiên bản còn hỗ trợ.
- ID vật phẩm bị xóa phải có ánh xạ thay thế/bồi hoàn; log migration và không chạy lại phần bồi hoàn khi reload.
- PWA chỉ kích hoạt bản mới sau khi lưu và người chơi ở điểm an toàn; tránh UI mới đọc schema cũ giữa một giao dịch.
- Rollback bản ứng dụng chỉ thực hiện nếu vẫn đọc được schema hiện tại hoặc có adapter tương thích. Không tự hạ schema và làm mất thẻ mới.

### 8.4. Chuyển máy bằng file save khi cần

1. Trên máy đang chơi, lưu và chọn Export, nhận file JSON có phiên bản và ngày tạo.
2. Tự chuyển file sang máy khác bằng cách thuận tiện; game không tích hợp dịch vụ truyền file.
3. Trên máy đích, chọn Import; xem trước tiến trình và tạo backup save hiện có.
4. Nạp save hợp lệ và tiếp tục chơi. File import thay thế lượt hiện tại, không cộng tiền/thẻ từ hai save.

Chỉ giữ một lượt chính tại một thời điểm. Nếu chơi cả hai máy rồi muốn gộp, tự chọn save muốn tiếp tục; kế hoạch không có thuật toán hợp nhất tiến trình.

Backup trong IndexedDB bảo vệ trước lỗi cập nhật/reset, nhưng cũng có thể mất khi xóa dữ liệu trình duyệt. Vì vậy giữ thêm file export ngoài trình duyệt, đặc biệt trước khi cập nhật game hoặc đổi máy.

<a id="s09"></a>
## 9. Màn hình, trải nghiệm và tài nguyên hình ảnh

### 9.1. Bố cục đề xuất

```text
┌──────────────────────────────────────────┐
│ Coin hiện có             Gold       ⚙   │
│ Coin/giây       Coin/lần chạm             │
│ Mốc tiếp theo [██████░░░░]                │
│ Hiệu ứng đang chạy + thời gian còn lại    │
│                                          │
│          ĐỒNG XU BẠC NGÔI SAO            │
│       + Coin, ánh sáng và phản hồi        │
│                                          │
│ Daily / Rương / Thẻ       Sự kiện         │
│                                          │
│      MORE       SHOP       BOOSTERS      │
└──────────────────────────────────────────┘
```

Thanh tiến trình phải ghi rõ đang đo mốc mở khóa nào. Không sao chép thanh vàng trong ảnh PDF rồi gán chức năng không có nhãn.

Desktop có thể chuyển thành ba vùng: thông tin bên trái, xu giữa, shop bên phải. Mobile dùng panel/tab để không thu nhỏ toàn bộ bố cục desktop. Không đặt nút reset gần nút nhận thưởng hoặc vùng chạm chính.

### 9.2. Danh sách màn hình và trạng thái

| Màn hình | Nội dung bắt buộc | Trạng thái cần thiết kế |
|---|---|---|
| Loading/khôi phục | Phiên bản, trạng thái đọc save | Save lỗi, migration, backup, không truy cập được bộ nhớ |
| Main | Ví, CPS, click power, xu, mốc, hiệu ứng | Đang chơi, pause, offline summary, mở khóa |
| Shop | Máy, nâng cấp, mua nhiều, so sánh hiệu suất | Đủ tiền, thiếu tiền, khóa, max cấp |
| Boosters | Kho, mô tả, preview, thời gian | Hết vật phẩm, đang chạy, không cộng dồn được |
| Cards | Bộ sưu tập, ô trang bị, nâng và tổ hợp | Chưa có, bản trùng, max cấp, thiếu nguyên liệu |
| Chests | Rương/chìa, preview, xác suất, mở | Thiếu chìa, đang commit, kết quả đã nhận |
| Daily | Ngày hiện tại, tiến độ chu kỳ, thưởng, countdown | Có thể nhận, đã nhận, ngày kế tiếp |
| Achievements/Stats | Tiến độ, phần thưởng, nguồn sản lượng | Chưa đạt, đã mở, đã nhận |
| Settings | Âm, rung, hiệu ứng, save, backup, reset | Export/import lỗi, cần xác nhận reset |
| Help | Hướng dẫn tính năng và khôi phục save | Hướng dẫn ngắn, thông tin phiên bản và vị trí save |

### 9.3. Trợ năng và hiệu năng cảm nhận

- Mục tiêu vùng chạm tối thiểu 44 x 44 CSS px; thử màn nhỏ 360 x 640 và safe area điện thoại.
- Hỗ trợ bàn phím, focus rõ, đóng modal hợp lý, nhãn cho icon và trạng thái không chỉ dựa trên màu.
- Có tắt âm, nhạc, rung, hạt và chế độ giảm chuyển động; âm thanh bắt đầu sau tương tác hợp lệ của người dùng.
- Không đọc mỗi lần tăng Coin qua screen reader; cung cấp tóm tắt khi người dùng yêu cầu hoặc theo nhịp thưa.
- Số nhảy và hạt có giới hạn; renderer giảm chất lượng trước khi ảnh hưởng tốc độ mô phỏng.
- Một bảng hướng dẫn ngắn: chạm -> mua máy -> hiểu CPS -> mở shop/booster; có thể mở lại trong MORE. Không cần hệ thống tutorial nhiều bước theo dõi từng lần bấm.

### 9.4. Danh mục asset và quy trình nhập

| Nhóm | Asset cần chuẩn bị | Quy tắc lưu |
|---|---|---|
| Coin | Xu bạc chủ đạo, xu vàng, xu cầu vồng | Gốc ở `assets-source/coins`, bản tối ưu ở `src/assets/images/coins` |
| UI | Icon tab, tiền, máy, thẻ, rương, chìa | ID trong manifest; không tham chiếu tên file rải khắp UI |
| Thẻ | Khung các bậc, icon từng thẻ, trạng thái khóa | Chia khung dùng chung và hình riêng nếu phù hợp |
| Sự kiện | Hạt, ánh viền, vệt rơi, Frenzy overlay | Tái sử dụng atlas hoặc asset nhỏ |
| Âm | Chạm, mua, mở khóa, rương, sự kiện | Tách sfx/music; âm chạm có biến thể nhẹ |
| Nền | Nền game, panel, texture kim loại | Ưu tiên tương phản và dung lượng tải |

Khi có file ảnh xu gốc, lưu bản không chỉnh sửa vào `assets-source/coins/coin-silver-star-master.*`; chuẩn bị bản nền trong suốt và các kích cỡ cần dùng. Không đổi tên một ảnh có nền trắng thành “transparent” rồi coi đã xử lý. Kiểm tra halo mép xu trên nền navy, khả năng đọc ngôi sao và độ sắc nét ở màn nhỏ. Việc xử lý ảnh là task P0/P2, chưa được thực hiện chỉ bằng lộ trình này.

Mỗi asset ghi tác giả/nguồn/quyền sử dụng trong manifest tài nguyên. Dùng hậu tố có nghĩa như `coin-silver-star.webp`, tránh `final2-new-ok.png`.

<a id="s10"></a>
## 10. Các giai đoạn triển khai và nghiệm thu

### 10.1. Lịch tổng thể cho bản chơi cá nhân

Giữ 7 giai đoạn P0-P6, kết thúc khi game cá nhân hoàn chỉnh. Không còn phần online/thương mại ở cuối. Ước lượng cho một người làm toàn thời gian, có thay đổi theo chất lượng hình ảnh, số nội dung thực sự muốn và mức kinh nghiệm.

| Giai đoạn | Mục tiêu | Thời lượng dự kiến | Phụ thuộc | Mốc |
|---|---|---:|---|---|
| P0 | Nền kỹ thuật, cấu trúc, đặc tả gọn | 1 tuần | Không | Khung rõ ràng |
| P1 | Engine, số lớn, click, save sơ bộ | 1-2 tuần | P0 | Prototype |
| P2 | Shop, sản xuất, backup, offline, UI nền | 2-3 tuần | P1 | M1 |
| P3 | Boosters, Time Warp, mưa vàng, Rainbow/Frenzy | 2-3 tuần | P2 | M2 |
| P4 | Thẻ, tổ hợp, rương, chìa, quầy đổi Gold | 3-4 tuần | P3 | Sưu tập và nguồn vật phẩm đầy đủ |
| P5 | Thưởng ngày đơn giản, thành tích, thống kê, reset | 2-3 tuần | P4 | Gameplay đủ hệ thống |
| P6 | Chơi thử cá nhân, cân bằng, ổn định, bản build local | 2-3 tuần | P5 | M3 hoàn chỉnh |

- Bản chơi sớm P0-P3: khoảng **6-9 tuần**.
- Bản cá nhân đầy đủ P0-P6: khoảng **13-19 tuần công**, dự phòng khoảng **16-25 tuần** nếu phát sinh chỉnh sửa. Đây không phải thời gian bắt buộc chờ mới được chơi; có thể chơi ngay từ M1/M2.
- Không còn dự toán 23-34 tuần cho bản thương mại. Nếu làm vào thời gian rảnh, quy đổi theo số giờ thực tế mỗi tuần.
- Ưu tiên chức năng chơi được; không cần đạt số lượng máy/thẻ/thành tích thật lớn trước khi thử.
- Cuối mỗi giai đoạn cập nhật tiến độ và sở thích khi chơi, giữ kiểm tra save và tính đúng của tài nguyên.

### 10.2. P0 - Đặt nền trước khi viết gameplay

**Đầu vào:** file kế hoạch này, PDF, ảnh đồng xu. **Đầu ra:** bộ khung có thể chạy và tài liệu quyết định.

- [x] Chốt cách chạy web local trên máy đang chơi, địa chỉ/port cố định và trình duyệt sử dụng; ghi trong README và `docs/decisions/0001-platform.md`.
- [x] Tạo repo Git local, README, ignore cho `node_modules`, build, cache, save thử và tài nguyên quá lớn không cần theo dõi. Không bắt buộc đẩy mã lên dịch vụ bên ngoài.
- [x] Khởi tạo React/TypeScript/Vite; cấu hình strict types, aliases, formatter và lint ranh giới import.
- [x] Tạo `app`, `core/engine`, `core/state`, `core/ports`, `content`, `features/clicker`, `ui`, `platform/storage`, `shared`, `tests`.
- [x] Chốt hợp đồng Amount, GameState, SaveEnvelope, Command, DomainEvent, RewardBundle và Catalog.
- [x] Tạo schema catalog và một ví dụ máy/nâng cấp; chưa nhập hàng trăm vật phẩm.
- [x] Chuẩn bị hướng dẫn hình ảnh và asset xu dùng thử; ghi rõ asset tạm nếu chưa có bản gốc.
- [x] Dựng wireframe main/shop/settings và design tokens màu/khoảng cách/chữ.
- [x] Thiết lập script `dev`, `build`, `typecheck`, `lint`, `test`, `validate:content` ; CI là tùy chọn, chạy kiểm tra trên máy là đủ cho giai đoạn đầu.
- [x] Tạo task cho các dòng giữ lại trong F01-F24; dòng bị bỏ chỉ ghi trạng thái ngoài phạm vi, không tạo backlog triển khai.

**Nghiệm thu:** máy mới làm theo README có thể chạy giao diện trống; build/typecheck/lint chạy được; cấu trúc import được kiểm tra; không có công thức kinh tế trong `App.tsx`.

### 10.3. P1 - Lõi nhỏ nhưng đúng

**File trọng tâm:** `shared/amount.ts`, `core/engine`, `core/state`, `core/economy`, `core/clicking`, `platform/storage`.

- [x] Cài lớp Amount, định dạng hiển thị và serialize/deserialize bằng chuỗi.
- [x] Xây engine nhận command, xử lý tuần tự và phát snapshot; inject Clock để test. RNG chỉ cần khi có tính năng ngẫu nhiên, chưa dùng ở P1.
- [x] Nhấn xu cộng tiền, hiển thị số dư và số lần chạm; renderer chỉ hiển thị kết quả.
- [x] Thêm sản xuất nền từ máy thử trong test để kiểm tra elapsed time; phiên chơi mới chưa có máy.
- [x] Lưu/load IndexedDB có version và báo lỗi; fixture `tests/fixtures/saves/v1.json` cho migration sau này.
- [x] Tạo FakeClock và MemorySaveRepository; kiểm tra click, sản xuất, reload, số lớn và số âm bị từ chối.
- [x] Chạy smoke test thao tác chạm -> số tăng -> lưu -> nạp lại -> số giữ bằng React/jsdom + IndexedDB mô phỏng. Kiểm tra trình duyệt thật chưa xác minh.

**Đã bổ sung sớm từ P2:** autosave sau click/mỗi 10 giây, trạng thái lưu/retry, hàng đợi ghi và khóa một tab. **Chưa có:** mua máy, thưởng offline, backup/export/import; tiếp tục ở P2. Cấu trúc và đường dẫn file thực tế xem `docs/02-architecture.md`.

**Nghiệm thu:** 100 thao tác hợp lệ ở sức nhấn 1 cho đúng 100 Coin; 60 giây ở CPS 10 cho đúng 600 Coin khi không có hiệu ứng; thay tốc độ render không đổi kết quả; save/load giữ giá trị lớn đúng.

### 10.4. P2 - Shop và vòng lặp chơi hoàn chỉnh

**File trọng tâm:** `core/shop`, `core/economy`, `core/progression`, `content/generators.json`, `features/shop`, `platform/storage`.

- [x] Thêm 6 máy thử và 6 nâng cấp click/hiệu suất cơ bản.
- [x] Giá tăng theo số đang có; mua x1/x10/x100/Max; mở khóa theo mốc.
- [x] Hoàn thiện main/shop/boosters-placeholder; nhóm Sao lưu/Hướng dẫn/Lộ trình trong Cài đặt thay cho một trang MORE riêng; hiển thị CPS, click power, mốc tiếp theo.
- [x] Thiết lập âm/rung, giảm hiệu ứng, lưu cài đặt riêng và vi.json; âm/rung thực tế phụ thuộc thiết bị và chưa xác minh trực tiếp.
- [x] Autosave, 2 backup, export/import có xem trước/xác nhận, một tab ghi; thử lỗi quota mô phỏng, giao dịch abort và save hỏng.
- [x] Thu nhập offline 50%, resume, watermark chống nhận trùng và không lùi, cap 8 giờ; commit trước khi cho chơi tiếp.
- [x] Hiển thị chi tiết lợi ích và hoàn vốn theo CPS tăng thêm; không gán hoàn vốn cho nâng cấp click.
- [x] Test mua thiếu tiền, mua sát ngưỡng, Max, load schema 1 và chuyển nền nhiều lần.

**Bản 0.3.0:** quy tắc/đường dẫn thực tế ở `docs/08-stage-3.md`, save schema 2 ở `docs/04-save-format.md`. Có mô phỏng tự động 30 phút; chưa chạy buổi chơi trực quan 30 phút hoặc xác minh âm/cảm ứng trên trình duyệt thật.

**Nghiệm thu:** người thử có thể chơi liên tục 30 phút, mua nâng cấp và trở lại sau đóng game mà không mất hoặc nhân đôi tiền; thay giá trong JSON không cần sửa React; có thể export rồi import khôi phục cùng tiến trình.

### 10.5. P3 - Sự kiện và tăng tốc

**File trọng tâm:** `core/effects`, `core/boosters`, `core/events`, `content/events.json`, `features/events`.

- [x] Xây pipeline bonus/phần trăm/multiplier và luật cùng nhóm.
- [x] Turbo Mint, Power Tap, Golden Magnet, Time Warp với preview và kho vật phẩm.
- [x] Mưa xu vàng có spawn, hitbox riêng, ID thu thưởng, cooldown và tối đa 10 xu/đợt.
- [x] Rainbow kích hoạt Frenzy; có đồng hồ, hiệu ứng hình và thưởng Gold đúng điều kiện.
- [x] Lưu cooldown/effect/RNG trong schema 3; resume/reload bỏ đợt dở, không phát lại xu.
- [x] Test effect hết hạn giữa tick, hai booster cùng nhóm, Frenzy với booster và cap.
- [ ] Chơi thử 15-30 phút với thiết bị cảm ứng, kiểm tra không chạm nhầm tab khi bắt xu.

**Bản 0.4.0:** chi tiết thực tế ở `docs/09-stage-4.md`. Đã đưa quầy đổi Gold lấy 4 booster lên sớm từ P4 để mọi vật phẩm có nguồn kiếm. Giao diện và thao tác trình duyệt thật chưa xác minh vì công cụ không có trình duyệt khả dụng. Các nút thu xu nằm trong vùng riêng, không phủ shop.

**Nghiệm thu:** cùng seed/time/commands tái hiện cùng phần thưởng; mỗi xu chỉ được nhận một lần; Time Warp không đổi daily/cooldown; tỷ lệ khung hình không làm thay đổi thu nhập.

**M2:** có thể tự chơi để kiểm tra cảm giác chạm, tốc độ phát triển và sự kiện; điều chỉnh theo sở thích trước khi nhân rộng nội dung.

### 10.6. P4 - Thẻ và rương

**File trọng tâm:** `core/cards`, `core/chests`, `core/rewards`, `content/cards.json`, `content/loot-tables.json`, hai feature UI tương ứng.

- [x] Thêm 12 thẻ thử nghiệm, bậc hiếm, cấp, chi phí nâng và ô trang bị.
- [x] Ít nhất 3 tổ hợp có tác dụng khác nhau; phải có nhóm Rainbow/Frenzy.
- [x] Nhận thẻ lần đầu/bản trùng/max cấp; nâng/trang bị/tháo có preview.
- [x] Rương bạc/vàng, chìa sao, bảng rơi, xác suất hiển thị từ cùng dữ liệu.
- [x] Giao dịch mở rương atomic; kết quả được lưu trước animation; hỗ trợ xem lại khi crash.
- [x] Luồng rương -> thẻ -> trang bị -> CPS/thưởng sự kiện cập nhật đúng.
- [x] Mở rộng quầy vật phẩm trong SHOP với rương/chìa; phần đổi Gold lấy 4 booster đã có từ P3, giá nằm trong `item-offers.json`.
- [x] Mô phỏng bảng rơi bằng RNG cố định và kiểm tra phân phối với dung sai thống kê định trước.

**Bản 0.5.0:** triển khai thực tế và thông số ở `docs/10-stage-5.md`; schema 4 chuyển được save 1/2/3. Có rương bạc miễn phí tại tổng sản xuất 1.000 Coin, ô thẻ thứ ba tại 1.000.000 Coin. Đã kiểm thử 100 vòng mở lại kho lưu/engine và luồng UI mô phỏng; trực quan/cảm ứng trên trình duyệt thật chưa xác minh. Thông số thực tế trong catalog/tài liệu giai đoạn được ưu tiên hơn ví dụ đề xuất ban đầu bên trên.

**Nghiệm thu:** 100 lần reload ở các điểm trước/sau commit rương không tạo thêm vật phẩm; không trang bị trùng ID; đủ nguyên liệu thì nâng đúng một cấp; đổi thẻ không để lại multiplier cũ.

### 10.7. P5 - Tiến trình theo ngày và quản lý game

**File trọng tâm:** `core/daily-rewards`, `core/achievements`, `core/progression`, `features/statistics`, `features/settings`, `features/help`.

- [x] Chu kỳ thưởng 7 lần nhận, ngày theo giờ Việt Nam, countdown; bỏ ngày không reset tiến độ nhận.
- [x] 30 thành tích theo các mốc gameplay, phần thưởng có trạng thái claim và ID ổn định.
- [x] Thống kê nguồn thu, tổng sản xuất, tổng tiêu và mốc `10^15`.
- [x] Menu Thêm gọn; một trang hướng dẫn về offline/save/boosters và thuật ngữ cần dùng.
- [x] Reset có preview/xác nhận/backup/runId; giữ đúng settings.
- [ ] Hoàn thiện âm, rung, giảm chuyển động, chữ tiếng Việt và điều khiển trên thiết bị thực tế dùng chơi.
- [x] Chạy migration từ save P1-P4 và các tình huống đổi ngày, lùi giờ, reload lúc claim.

**Bản 0.6.0:** đặc tả thực tế ở `docs/11-stage-6.md`; schema 5 chuyển được save 1–4. Thêm âm/rung nhận quà theo settings và điều khiển HTML có nhãn; dòng kiểm tra thiết bị thực tế bên trên còn chờ xác minh. Reset giữ snapshot mới nhất trước reset ở `reset-backup`, không xoay theo autosave và chỉ phục hồi khi xác nhận.

**Nghiệm thu:** không nhận daily hai lần cùng ngày; lần nhận thứ 7 quay đúng vòng; bỏ ngày vẫn giữ tiến độ; reset không tự khôi phục lượt cũ và không làm mất cài đặt.

### 10.8. P6 - Hoàn thiện bản chơi cá nhân

**File trọng tâm:** `scripts/simulate-economy.ts`, `content/*`, `tests/e2e`, `ui/styles`, adapter lifecycle và cơ chế cache ứng dụng.

- [x] Mở rộng nội dung tới 12 máy, 30 nâng cấp, 12 thẻ, 30 thành tích. Độ thú vị vẫn cần chơi thử thực tế.
- [x] Mô phỏng người chơi chủ động, thụ động và hỗn hợp ở 1 giờ/1 ngày/7 ngày/30 ngày, ba seed mỗi lịch; có dữ liệu trước/sau.
- [x] Phân tích dòng Coin/Gold/chìa/thẻ, giới hạn hoàn Gold tối đa của rương, nguồn/công dụng vật phẩm. Không tuyên bố loại trừ mọi chiến lược ngoài phạm vi audit.
- [x] Ghi thời gian tới từng máy/mốc và nguồn thu trong `docs/balance/`.
- [ ] Tối ưu ảnh, âm, particle, snapshot UI; đo hiệu năng trên thiết bị mục tiêu đã ghi tên.
- [x] Làm bản build và ZIP local, launcher bằng Node.js không cần npm dependencies, có README và SHA-256. Không chọn PWA; giữ origin 127.0.0.1:5173 và tương thích save cũ.
- [ ] Kiểm tra trình duyệt đang dùng trên máy cá nhân; thêm điện thoại chỉ khi thực sự chơi trên đó. Thử phiên 1-2 giờ và quay lại ngày hôm sau.
- [ ] Tự chơi thử nhiều phiên ngắn/dài; ghi cảm giác click, tốc độ tiến triển, độ hữu ích của thẻ/sự kiện và điểm gây mất hứng. Không cần tuyển người chơi thử.

**Nghiệm thu:** không còn lỗi mất/nhân đôi tài nguyên đã biết; bản build chơi được khi ngắt mạng qua cách mở local đã ghi; nếu chọn PWA thì kiểm tra cả khởi động từ cache; đạt ngân sách hiệu năng mục 11 trên thiết bị chọn; không có nút hiển thị nhưng chưa làm trong phạm vi M3.

**Tình trạng RC:** kiểm thử tự động, dữ liệu cân bằng và benchmark lõi đã có. Đã tách tải App, giảm font và gom shop; dòng tối ưu/đo thiết bị chưa đánh dấu xong vì chưa đo renderer trên trình duyệt thật. Công cụ không có browser khả dụng; checklist chơi 1–2 giờ/ngày hôm sau còn mở. Không coi 30 ngày mô phỏng hoặc 2 giờ tải lõi là buổi chơi thật. Thông số thực tế và giới hạn: `docs/12-stage-7.md`.

### 10.9. Kết thúc lộ trình

Sau P6, đóng phiên bản cá nhân 1.0: lưu mã nguồn vào Git, ghi thay đổi, xuất backup save và giữ bản build đang chơi ổn định. Khi có ý tưởng mới, thêm task nhỏ theo nhu cầu thực tế; không tự thêm lại các nhóm đã bỏ ở mục 1.2.

<a id="s11"></a>
## 11. Kiểm thử, cân bằng và chất lượng

### 11.1. Ma trận kiểm thử có ý nghĩa

| Khu vực | Ca kiểm tra quan trọng | Tầng |
|---|---|---|
| Amount | `1e15`, `1e30`, gần `1e100`, phần lẻ, serialize, giá làm tròn | Unit |
| Wallet | Thiếu tiền, nhiều command liên tiếp, không âm, nguồn thưởng đúng | Unit/integration |
| Shop | Mua q lần x1 bằng mua q theo tổng luật giá; Max không vượt ví | Unit/property |
| Quầy vật phẩm | Đổi Gold đúng giá, không âm, nhận đúng số lượng; tất cả vật phẩm có nguồn kiếm | Unit/integration |
| Production | Chia 60 giây thành nhiều tick cho cùng kết quả trong dung sai quy định | Unit/property |
| Effects | Hết hạn giữa tick, cùng nhóm, khác nhóm, trần multiplier, tháo thẻ | Unit |
| Time Warp | Dùng CPS nền, không xê dịch UTC/day/cooldown | Unit/integration |
| Event | Thu hai lần, hết hạn, reload, RNG/cooldown, chuyển nền | Integration |
| Cards | Bản trùng, max cấp, đủ/thiếu nguyên liệu, slot, tổ hợp | Unit/integration |
| Chests | Trừ rương/chìa và nhận quà nguyên tử; crash trước/sau commit | Integration |
| Daily | 23:59:59 -> 00:00 giờ Việt Nam, tháng/năm mới, bỏ ngày không mất tiến độ, claim lặp | Unit/integration |
| Offline | 0/10 phút/8 giờ/24 giờ, giờ lùi, mở nhiều lần, booster hết hạn | Integration |
| Save | Migration, dữ liệu hỏng, schema mới hơn, quota, hai tab, backup | Integration/E2E |
| Reset | Dữ liệu bị xóa/được giữ, backup, runId, tải lại sau reset | Integration/E2E |
| UX | Chuột/cảm ứng/keyboard, modal, focus, số lớn, chữ dài, màn nhỏ | E2E/manual |

Không đặt mục tiêu coverage 100% cho mọi component. Ưu tiên kiểm thử những nơi có thể làm mất tiến trình, tính sai tiền, nhân phần thưởng hoặc làm hỏng file save. UI trang trí nhỏ chỉ cần kiểm tra hiển thị phù hợp.

### 11.2. Kịch bản mô phỏng kinh tế

- **Chủ động:** phiên 10 phút, trung bình 2 click/giây khi thao tác, tham gia 70% sự kiện; đây là giả định mô phỏng có thể thay.
- **Thụ động:** hai lần mở/ngày, mỗi lần 3 phút, ưu tiên máy/CPS; tính cap offline theo đúng luật.
- **Hỗn hợp:** bốn phiên ngắn/ngày, có nâng thẻ và nhận daily, không mua gói.
- **Kiểm tra biên:** toàn click, không click sau máy đầu, bỏ lỡ 7 ngày, dùng hết booster cùng lúc, thẻ max cấp.
- **Ngẫu nhiên:** nhiều seed, báo trung vị và khoảng phân bố; không cân bằng game chỉ theo một lần mở rương may mắn.

Đầu ra của simulator: thời gian đến máy/mốc mới, tổng Coin/Gold kiếm và tiêu, thời gian chờ dài nhất không có lựa chọn, số rương mở, tiến trình thẻ và nguồn bonus chiếm tỷ trọng cao. Mỗi lần chỉnh `balance.json` ghi lý do, kết quả trước/sau và `contentVersion`.

### 11.3. Ngân sách chất lượng đề xuất

Các số dưới là mục tiêu nghiệm thu, phải đo trên thiết bị/mạng ghi rõ ở P0/P6:

| Chỉ tiêu | Mục tiêu ban đầu |
|---|---|
| Phản hồi hình ảnh sau chạm | Dưới 100 ms trong phiên bình thường |
| Tốc độ hiển thị | Mục tiêu 60 FPS; chế độ nhẹ tối thiểu 30 FPS trên thiết bị thử đã chọn |
| Khởi động local từ cache | Mục tiêu dưới 3 giây, không tính lần tải đầu qua mạng |
| Engine | Không mất sản lượng khi renderer chậm; không có vòng lặp bắt kịp offline hàng triệu tick |
| Save | 0 lỗi mất/nhân đôi giao dịch đã báo hoàn tất trong bộ kiểm thử lỗi |
| Dung lượng | Đề xuất tài nguyên tải lần đầu dưới 5 MB nén, phần phụ tải sau; điều chỉnh theo chất lượng asset |
| Chơi lâu | Phiên 2 giờ không có xu hướng tăng bộ nhớ không giới hạn hoặc hàng đợi âm/particle |
| Trải nghiệm | Không cuộn ngang ở 360 px, nút bấm rõ và mọi trạng thái lỗi chính có thông báo |

### 11.4. Kiểm tra trước khi dùng bản cập nhật

Sau khi các script tương ứng đã được tạo:

```text
npm run typecheck
npm run lint
npm run validate:content
npm run test
npm run build
```

Chạy E2E cho luồng bị ảnh hưởng; chạy toàn bộ E2E và migration trước khi thay bản đang chơi. Thay cân bằng thì chạy simulator; thay asset thì kiểm tra manifest/kích thước/hiển thị. Không lặp mọi bài test dài cho một sửa chữ không liên quan.

<a id="s12"></a>
## 12. Hướng dẫn sửa và mở rộng game

### 12.1. Muốn sửa gì thì mở file nào?

Đường dẫn dưới dùng trực tiếp trong một repo; không có bước chuyển sang package dùng chung cho nhiều ứng dụng.

| Nhu cầu | Nơi sửa chính | Kiểm tra đi kèm |
|---|---|---|
| Đổi giá/CPS một máy | `src/content/generators.json` | Validator, mô phỏng tiến trình |
| Đổi công thức tăng giá hoặc mua Max | `src/core/shop/calculate-price.ts` và module mua | Giá làm tròn, mua nhiều, thiếu tiền |
| Thêm máy mới | Catalog máy, unlocks, locale, asset manifest | ID/tham chiếu, UI hàng mới, save cũ |
| Đổi sức nhấn mặc định | `src/content/balance.json` | Click mới và migrate nếu cần |
| Đổi cách các bonus nhân nhau | `src/core/effects` | Toàn bộ tương tác booster/thẻ/Frenzy |
| Đổi thời lượng booster | `src/content/boosters.json` | Preview, timer, save effect đang chạy |
| Đổi Time Warp | Catalog booster và `src/core/boosters` | Chỉ số nền, không đẩy đồng hồ |
| Đổi tần suất/thưởng mưa xu | `src/content/events.json` | Tỷ trọng Gold, cooldown, cap vật thể |
| Thêm thẻ hoặc tổ hợp | `cards.json`, `card-synergies.json`, locale/asset | Slot, max cấp, tổ hợp và stacking |
| Đổi xác suất rương | `src/content/loot-tables.json` | Xác suất UI, phân phối, version kết quả đã chốt |
| Đổi thưởng ngày | `src/content/daily-rewards.json` | Claim qua ranh giới ngày, chu kỳ |
| Đổi cap/hiệu suất offline | `balance.json` và `src/core/offline` | Watermark, 24 giờ, resume nhiều lần |
| Thêm trường dữ liệu cần lưu | `core/state`, codec và migration mới | Đọc fixture save cũ, default và round-trip |
| Đổi hình xu | `assets/images/coins`, `asset-manifest.ts` | Mép trong suốt, vùng chạm, trạng thái Frenzy |
| Đổi bố cục shop | `src/features/shop` | Responsive, focus, không đổi luật mua |
| Đổi màu/font/nút | `src/ui/styles` và component tương ứng | Tương phản, tiếng Việt, màn nhỏ |
| Đổi văn bản | `src/locales/vi.json` | Khóa đủ, biến nội suy, chữ dài |
| Đổi giá Gold của vật phẩm | `src/content/item-offers.json` | Đủ/thiếu tiền, nhận đúng vật phẩm, tránh vòng kiếm Gold vô hạn |
| Đổi save/backup/export/import | `src/platform/storage` | Save cũ, file lỗi, khôi phục và hai tab cùng mở |

### 12.2. Quy trình thêm một tính năng mới

1. Viết mục tiêu người chơi, luật, dữ liệu và tiêu chí nghiệm thu trong tài liệu tính năng.
2. Xác định có thật sự là tính năng mới hay chỉ thêm catalog cho hệ đã có.
3. Thêm ID/dữ liệu/schema; nếu thay save thì lập migration trước khi làm UI.
4. Viết hàm nghiệp vụ trong module lõi phù hợp và test ca có rủi ro.
5. Thêm command/selector công khai; không cho UI gọi sâu vào nội bộ module khác.
6. Làm UI, khóa dịch và asset; dùng component chung nếu trách nhiệm giống nhau.
7. Chạy kiểm thử liên tính năng, save cũ, mô phỏng cân bằng nếu ảnh hưởng kinh tế.
8. Cập nhật hướng dẫn, traceability, CHANGELOG và trạng thái cấu hình nếu có.

Ví dụ thêm “Máy đúc lượng tử”: nếu chỉ khác giá/CPS/icon/mốc mở thì sửa catalog + locale + asset, không tạo một engine mới. Nếu có luật chuyển Gold thành Coin mỗi giờ, cần đặc tả nguồn/chi, scheduler và cách xử lý offline trước khi thêm UI.

### 12.3. Quy tắc Git và quản lý tài liệu

- Một thay đổi tập trung một mục đích; tách đổi cấu trúc khỏi đổi cân bằng khi có thể để dễ review.
- Tên nhánh gợi ý `feat/cards`, `fix/offline-double-claim`, `balance/early-game`.
- Commit ví dụ `feat(shop): add bulk generator purchase`; mô tả PR giải thích hành vi và kiểm tra đã chạy.
- Không tạo nhiều bản `Game-final.tsx`, `Game-final-2.tsx`. Dùng lịch sử Git để quay lại.
- README dành cho chạy dự án; game-design dành cho luật; architecture dành cho ranh giới module; roadmap dành cho giai đoạn và trạng thái. Chỉ tách thêm tài liệu khi thực sự cần tra cứu, không duy trì tài liệu dài chỉ vì có tên trong cây đích.
- Sau khi tách đặc tả ra `docs`, chi tiết luật ở `01-game-design.md` là nguồn chuẩn; roadmap dẫn tới nó và giữ tóm tắt, tránh hai bản luật khác nhau.
- Mỗi task ghi ID, phase, file tác động, dependency, acceptance và trạng thái. Chỉ chuyển sang Done khi điều kiện nghiệm thu đạt.

Mẫu task:

```md
### TASK-P4-012 - Mở rương vàng đúng một lần
- Phạm vi: F10, F11.
- Phụ thuộc: RewardBundle, inventory, SaveRepository transaction.
- File: core/chests, core/rewards, content/chests.json, features/chests.
- Hành vi: tiêu 1 rương vàng + 1 Star Key, tạo và lưu thưởng trước animation.
- Nghiệm thu: thiếu chìa không mất rương; retry không phát quà lần hai;
  crash sau commit rồi mở lại hiển thị đúng kết quả đã lưu.
- Kiểm tra: unit điều kiện, integration crash/retry, E2E mở rương.
- Trạng thái: Todo.
```

<a id="s13"></a>
## 13. Rủi ro và điều kiện hoàn thành bản cá nhân

### 13.1. Những rủi ro vẫn cần xử lý

| Rủi ro | Cách xử lý |
|---|---|
| Dồn mọi thứ vào một file | Tách luật, dữ liệu cân bằng, giao diện và lưu trữ; có bảng tra cứu nơi sửa |
| Tính sai số lớn/giá | Amount từ đầu, test công thức và mua nhiều |
| Nhận thưởng trùng khi reload | Giao dịch lưu nguyên tử, mốc thời gian đã tính, ID vật thể/claim |
| Hỏng hoặc mất save | Autosave, backup, export ngoài trình duyệt, migration từ save cũ |
| Đổi port/trình duyệt tưởng bị mất save | Ghi cách mở local cố định; chuyển môi trường bằng export/import |
| Bỏ trả phí nhưng vật phẩm không có nguồn kiếm | Quầy đổi Gold và bảng nguồn nhận ở mục 7.11; kiểm tra toàn bộ catalog |
| Đổi Gold/mở rương sinh vòng lợi nhuận vô hạn | Mô phỏng giá, phần thưởng và xử lý thẻ max cấp cùng nhau |
| Thêm quá nhiều nội dung trước khi thích chơi | Tự chơi từ M1/M2, chỉ mở rộng thứ tạo lựa chọn và mục tiêu hữu ích |

### 13.2. Các quyết định đã đơn giản hóa

- Một người chơi, một lượt chính, mọi dữ liệu trên máy.
- Một ứng dụng web local, không cần backend hay tài khoản dịch vụ.
- Chỉ tiếng Việt; thử trên thiết bị thực tế dùng chơi.
- Daily theo ngày Việt Nam, bỏ ngày không mất tiến độ thưởng.
- Mọi vật phẩm kiếm trong game; không có nhiệm vụ xem quảng cáo/mua gói.
- Chuyển máy bằng export/import; không tự hợp nhất hai save.
- Giữ kiểm tra chống lỗi mất/nhân tài nguyên; không cần bảo vệ điểm thi đấu hoặc chống người chơi tự sửa save.
- Chỉ làm bản cài native, đa ngôn ngữ hoặc chức năng ngoài phạm vi khi người dùng có nhu cầu mới.

### 13.3. Điều kiện hoàn thành

- [ ] Tất cả dòng giữ lại ở bảng F01-F24 đã có hành vi thực sự; dòng bỏ không còn nút/module/task triển khai.
- [ ] Click, shop, máy, offline, boosters, sự kiện, thẻ/rương và thành tích hoạt động liền mạch.
- [ ] Gold, chìa, booster, Time Warp và mọi thẻ đều kiếm được qua gameplay; không có vật phẩm bị khóa sau nguồn đã bỏ.
- [ ] Daily nhận một lần/ngày, bỏ ngày không reset chu kỳ; reset game có xác nhận và backup.
- [ ] Save/load/export/import/migration đã thử với tiến trình thật của chính mình và fixture lỗi.
- [ ] Cách chạy local khi không mạng được ghi rõ; file build và file save được phân biệt.
- [ ] Không còn màn đăng nhập, nút quảng cáo, giá tiền thật hoặc thông báo chờ xác thực online.
- [ ] Chạy mượt trên máy dùng chơi; âm/hiệu ứng có thể tắt theo sở thích.
- [ ] Không có công thức tính tiền trong UI; thay dữ liệu cân bằng không phải sửa nhiều màn hình.
- [ ] Có bản mã nguồn lưu trong Git, bản build ổn định và file backup trước cập nhật.

Hoàn thành các mục trên là đủ để gọi đây là bản cá nhân hoàn chỉnh; không phụ thuộc việc công bố hoặc phát hành cho người khác.

<a id="s14"></a>
## 14. Checklist bắt đầu và nguồn tham chiếu

### 14.1. Thứ tự công việc đầu tiên

1. Đọc mục 1 và ghi quyết định nền tảng/phạm vi vào tài liệu P0.
2. Tạo repo và các thư mục nền ở mục 5; chưa tạo hàng loạt file rỗng cho giai đoạn xa.
3. Tạo README, script kiểm tra, TypeScript strict, alias và ranh giới import.
4. Định nghĩa Amount, GameState, catalog, commands và ports.
5. Làm một lát cắt hoàn chỉnh: chạm xu -> cộng tiền -> mua một máy -> sản xuất -> lưu -> tải lại.
6. Chứng minh lát cắt đó đúng bằng test và chơi thử, rồi mở rộng shop.
7. Thêm offline và backup trước khi tăng độ phức tạp bằng thẻ/rương.
8. Đi lần lượt P3-P6, cập nhật task và lịch theo kết quả thực tế.

### 14.2. Những việc tránh để giữ dự án dễ sửa

- Không viết game thành một file HTML/JS/TSX rất lớn rồi mới định tách sau.
- Không để từng màn hình tự lưu tiền, tự tính CPS hoặc tự gọi RNG để cấp thưởng.
- Không chép giá/công thức vào nhiều màn hình; dùng một lõi và version catalog rõ.
- Không đổi ID vật phẩm theo tên hiển thị, thứ tự mảng hoặc vị trí trong shop.
- Không tạo file hoặc adapter trống cho tính năng đã bỏ chỉ để “phòng khi cần”.
- Không dùng sự kiện animation kết thúc làm bằng chứng một giao dịch đã được lưu.
- Không bỏ kiểm tra save vì chỉ chơi một mình; đây vẫn là dữ liệu cần giữ qua các lần sửa game.
- Không coi mọi ví dụ trong PDF là công thức thật của trò chơi gốc.

### 14.3. Nguồn và giới hạn kiểm chứng

**Nguồn tính năng chính:** PDF người dùng cung cấp, 22 trang. Tài liệu này đã được đọc để đối chiếu nhóm tính năng; các số trang trong bảng F01-F24 là trang PDF thực tế. Các phần PDF-XN phản ánh cách PDF phân loại thông tin, không phải tuyên bố đã kiểm chứng lại mọi phiên bản trên cửa hàng.

Các trang nguồn được PDF dẫn, giữ để tham khảo khi cần xác minh sâu hơn:

- [Google Play - Cookie Clickers, mã it.junglestudios.cookieclickers](https://play.google.com/store/apps/details?id=it.junglestudios.cookieclickers&hl=en-US).
- [App Store Việt Nam - Cookie Clickers, ID 703439482](https://apps.apple.com/vn/app/cookie-clickers/id703439482).
- [Trang App Store mà PDF dùng tham chiếu lịch sử phiên bản](https://apps.apple.com/vn/app/cookie-clickers/id703439482?platform=vision).
- [Google Play - Cookie Clickers 2, dùng để phân biệt sản phẩm](https://play.google.com/store/apps/details?id=it.redbitgames.cookieclickers2&hl=en-US).

Các link cửa hàng trên được chép lại từ nguồn PDF, không dùng để khẳng định giá hoặc trạng thái tính năng trực tiếp hôm nay. Nguồn kỹ thuật đã tham khảo cho lựa chọn công cụ được liên kết ở mục 4; kiến trúc, thông số game và dự toán công sức còn lại là đề xuất dành riêng cho Coin Clicker.

Ảnh xu trong hội thoại là nguồn tham chiếu hình ảnh. Chưa có thao tác tạo/cắt/xử lý hay xuất bộ asset game trong công việc lập lộ trình này.

### 14.4. Theo dõi trạng thái kế hoạch

| Mục | Trạng thái tại ngày lập |
|---|---|
| Đọc và đối chiếu PDF | Hoàn tất để xây lộ trình |
| Lộ trình Markdown và kiến trúc thư mục | Đã cập nhật bản 1.1 theo mục tiêu chơi cá nhân |
| P0-P5 triển khai game | Đã có đầy đủ hệ thống; giữ tương thích trong bản 1.0.0-rc.1 |
| P6 triển khai game | Đã có nội dung, mô phỏng, benchmark lõi, launcher và ZIP; chờ nghiệm thu thiết bị thật |
| Bộ công thức CC-ĐX | Đã cân bằng bằng mô phỏng trước/sau; chưa xác minh cảm giác chơi thực tế |
| Asset sản xuất từ ảnh tham chiếu | Chưa tạo |
| Dịch vụ xã hội, thương mại và vận hành online | Đã loại khỏi phạm vi, không phải công việc chờ làm |

Bước tiếp theo là **chơi bản 1.0.0-rc.1 trên trình duyệt thực tế, hoàn tất checklist P6 rồi chốt bản 1.0**. Không thêm giai đoạn online/thương mại. Giữ ranh giới giữa lõi, catalog, UI và lưu trữ khi chỉnh theo trải nghiệm thực tế.

