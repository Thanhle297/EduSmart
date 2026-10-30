# EduSmart Web · THCS Xuân Phương

Frontend **React + Vite + TypeScript**, dựa trên các trang của dự án [EduSmart trên Stitch](https://stitch.withgoogle.com/projects/4924344872507794289).

## Chạy ứng dụng

Yêu cầu Node.js từ **22.12** trở lên và npm.

Trong thư mục `web/`:

```bash
npm ci
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal, mặc định `http://localhost:5173`.

Chọn **Trải nghiệm bản demo** trên trang đăng nhập hoặc dùng:

- Tên đăng nhập: `bgh.xuanphuong`
- Mật khẩu demo: `edusmart-demo`

Không nhập tài khoản hoặc mật khẩu thật. Đây không phải cơ chế xác thực sản xuất.

## Giao diện đã dựng

- Đăng nhập và dashboard điều hành.
- **7 trang bán trú:** tổng quan, thực đơn, duyệt thực đơn, lịch trực, kiểm tra, suất ăn/đối soát và báo cáo.
- **7 trang giảng dạy:** tổng quan, bảng phân công, tạo/sửa phân công, phê duyệt, thời khóa biểu, dạy thay và đối soát tiết.
- Sidebar chung, tìm kiếm trang bằng `Ctrl/Cmd + K`, thông báo demo, dialog/drawer, điều hướng màn hình nhỏ, trang 403/404 và xử lý ID không tồn tại.

Các thao tác demo gồm lưu/gửi/duyệt thực đơn, phân công/xác nhận ca trực, ghi biên bản, xác minh/chốt suất ăn, tạo/sửa bản nháp phân công, duyệt kế hoạch và phân công/xác nhận tiết dạy thay. Báo cáo dùng cùng dữ liệu; các nút xuất CSV thực sự tải tệp. In sử dụng hộp thoại in của trình duyệt, không phải dịch vụ xuất PDF.

## Cấu hình và dữ liệu

| Vị trí | Nội dung |
| --- | --- |
| `src/lib/config.ts` | Tên trường, năm học, tài khoản và ngày demo |
| `index.html` | Tiêu đề và metadata ban đầu của trang |
| `src/app/navigation.ts` | Danh mục điều hướng và tiêu đề trang |
| `src/app/router.tsx` | Route và tải trang theo nhóm |
| `src/mocks/fixtures.ts` | Dataset mẫu dùng chung |
| `src/mocks/repository.ts` | Thao tác và kiểm tra chuyển trạng thái demo |
| `src/mocks/selectors.ts` | Tổng hợp, tải giảng dạy và kiểm tra xung đột |
| `src/styles/` | Token, bố cục, typography và responsive |

- Tên trường trên giao diện: **Trường THCS Xuân Phương**.
- Ngày nghiệp vụ mẫu cố định: **26/10/2026**, không phải dữ liệu thời gian thực.
- Thời khóa biểu được nhập từ Excel toàn trường: 34 lớp, 74 tên giáo viên và 1.389 ô tiết/hoạt động sáng, chiều.
- Lớp ghép và các hoạt động theo tuần giữ nguyên ghi chú từ nguồn; sĩ số và định mức vẫn là dữ liệu demo.
- Các thay đổi nghiệp vụ chỉ lưu trong bộ nhớ. Tải lại trang khôi phục dataset.
- Chỉ cờ phiên demo được lưu trong session/local storage; không lưu mật khẩu. Có thể khôi phục dataset từ menu tài khoản.

## OpenAI hỗ trợ phân công dạy thay

Điền `OPENAI_API_KEY` vào `.env.local` (file này đã được bỏ qua trong Git). Có thể tham khảo `.env.example` khi thiết lập ở máy khác. `OPENAI_MODEL` mặc định là `gpt-5-mini`; có thể đổi sang model hỗ trợ Responses API và Structured Outputs.

Sau khi lưu cấu hình, khởi động lại `npm run dev`. Trong trang **Quản lý & phân công dạy thay**, tạo yêu cầu cho một tiết học, chọn **AI hỗ trợ phân công**, rồi bấm **Gợi ý giáo viên phù hợp**. Có thể thêm ưu tiên trước khi phân tích. Chọn một đề xuất rồi dùng **Xác nhận phân công** để lưu vào dữ liệu demo.

- Phía máy chủ gọi [OpenAI Responses API với Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses). API key không có tiền tố `VITE_` và không được gửi ra trình duyệt.
- Dữ liệu gửi đi gồm thông tin tiết học, mã giáo viên khả dụng, tải giảng dạy và ưu tiên đã nhập; không gửi danh sách tên giáo viên, lý do vắng hay toàn bộ file Excel. Request dùng `store: false`.
- Cùng môn, lịch trống, ngày hiệu lực và các yêu cầu báo vắng/dạy thay được kiểm tra trước khi đề xuất. Khi xác nhận, ứng dụng kiểm tra lại lịch. AI chỉ xếp hạng tối đa 3 người trong danh sách khả dụng.
- Chưa có key, hết hạn mức, lỗi mạng hoặc phản hồi không hợp lệ sẽ hiển thị thông báo; không thay kết quả AI bằng dữ liệu giả lập.
- Endpoint `/api/ai/substitutions` và `/api/ai/substitutions/status` hoạt động trong Vite development và preview. Bản `dist/` trên hosting tĩnh cần backend riêng cho hai endpoint này trước khi sử dụng AI. Phiên đăng nhập hiện tại chỉ là phiên demo, chưa phải xác thực server để triển khai công khai.

## Giới hạn

Chưa có backend nghiệp vụ, phân quyền server, ký số, gửi Zalo/email, sổ đầu bài thật, thanh toán hay hoàn tiền thực tế. AI dạy thay được kết nối qua endpoint demo khi có cấu hình OpenAI hợp lệ. Vai trò đang mô phỏng Ban Giám hiệu; trang 403 không thay thế cơ chế bảo mật. Những phân hệ ngoài phạm vi sẽ thông báo chưa tích hợp.

Đây là bản giao diện đầu tiên để người dùng xem xét và kiểm tra, không phải hệ thống sẵn sàng vận hành tại trường. Không có thay đổi nào được ghi lên dự án Stitch.

## Deploy Ubuntu + Docker + Nginx

Domain: **edusmart.tedu.io.vn**, IP VPS: **103.176.22.123**. Repository: [Thanhle297/EduSmart](https://github.com/Thanhle297/EduSmart). Hướng dẫn này giả định server đã có Git, Docker Engine, Docker Compose (`docker compose`) và Nginx cài trực tiếp trên Ubuntu. Docker phục vụ frontend ở `127.0.0.1:8080`; Nginx trên server nhận truy cập theo domain và xử lý HTTPS.

Đây là bản web tĩnh, chưa có backend. AI chưa hoạt động; các thay đổi dữ liệu demo vẫn mất khi tải lại trang. Không cần đưa `.env.local` hay OpenAI API key lên server; `.dockerignore` loại các file môi trường khỏi Docker build.

### 1. Trỏ DNS

Trong trang quản lý DNS của `tedu.io.vn`, tạo bản ghi:

| Loại | Tên | Giá trị |
| --- | --- | --- |
| A | `edusmart` | `103.176.22.123` |

Nếu nhà cung cấp yêu cầu tên đầy đủ, nhập `edusmart.tedu.io.vn`. Chỉ giữ bản ghi AAAA cho subdomain này khi IPv6 thực sự trỏ đến cùng server. Cho phép TCP **80 và 443** trong firewall của server/nhà cung cấp. Không cần mở port 8080 ra Internet.

### 2. Push source lên GitHub và clone về VPS

Push source lên `https://github.com/Thanhle297/EduSmart`, giữ cấu trúc thư mục `web/` trong repository. Đảm bảo commit cả `web/Dockerfile`, `web/compose.yaml`, `web/.dockerignore` và thư mục `web/deploy/`. Không commit `.env.local`; file này đã được Git bỏ qua.

Từ máy cá nhân, SSH vào VPS; thay `SSH_USER` bằng tài khoản đăng nhập:

```bash
ssh SSH_USER@103.176.22.123
```

Sau khi SSH vào VPS, clone repository và chạy Docker:

```bash
cd ~
git clone https://github.com/Thanhle297/EduSmart.git EduSmart
cd ~/EduSmart/web
sudo docker compose up -d --build
```

Docker tự cài thư viện và build frontend trong image; không cần cài Node.js trên server.

### 3. Thêm domain vào Nginx

Nếu domain này **chưa có cấu hình Nginx**, tạo site mới:

```bash
sudo cp deploy/nginx-host.conf /etc/nginx/sites-available/edusmart.tedu.io.vn
sudo ln -s /etc/nginx/sites-available/edusmart.tedu.io.vn /etc/nginx/sites-enabled/edusmart.tedu.io.vn
sudo nginx -t
```

Chỉ khi `nginx -t` thành công, áp dụng cấu hình:

```bash
sudo systemctl reload nginx
```

Nếu domain **đã có server block**, sửa `location /` trong block đang dùng theo `deploy/nginx-host.conf`, giữ cấu hình SSL hiện có; không tạo thêm block trùng `server_name`. Nếu Nginx dùng `conf.d` thay cho `sites-enabled`, đặt file mới tại `/etc/nginx/conf.d/edusmart.tedu.io.vn.conf`, không tạo symlink bên trên.

### 4. Bật HTTPS

Nếu domain đã có chứng chỉ HTTPS hợp lệ trong Nginx, giữ cấu hình đó. Nếu chưa có, chờ DNS trỏ đúng và HTTP hoạt động rồi dùng Certbot. Khi Certbot đã được cài:

```bash
sudo certbot --nginx -d edusmart.tedu.io.vn --redirect
```

Nếu chưa có Certbot, cài theo [hướng dẫn chính thức cho Nginx trên Ubuntu/Linux](https://certbot.eff.org/instructions?ws=nginx&os=snap), rồi chạy lệnh trên. Certbot cấu hình chứng chỉ và chuyển HTTP sang HTTPS.

Truy cập **https://edusmart.tedu.io.vn** sau khi hoàn tất.

### Cập nhật và xem log

Mỗi lần sửa code, commit và push lên GitHub. Sau đó trên VPS:

```bash
cd ~/EduSmart
git pull --ff-only
cd web
sudo docker compose up -d --build
```

Xem log container nếu cần:

```bash
sudo docker compose logs --tail=100 web
```

Nếu port 8080 đã được ứng dụng khác sử dụng, chọn một port trống và đổi đồng thời trong `compose.yaml` và `proxy_pass` của Nginx trên server.

## Lệnh hỗ trợ

```bash
npm run build
npm run preview
npm run typecheck
npm run lint
npm run format
npm run format:check
npm test
npx playwright install chromium
npm run test:e2e
```

Các lệnh kiểm tra được cung cấp để người dùng chủ động chạy. Production hosting cần fallback các route phía client về `index.html`.

Kế hoạch và danh mục màn hình tham chiếu: [`../docs/future/web/README.md`](../docs/future/web/README.md).
