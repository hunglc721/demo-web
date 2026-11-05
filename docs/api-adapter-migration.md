# Chuyển Mock DAL sang Laravel API

Ứng dụng hiện chạy `UI_ONLY`: `productService`, `orderService` và `couponService` đọc/ghi qua `LocalStorageRepository`, còn form, model và component dùng các kiểu trong `src/types`.

Khi nối Laravel:

1. Giữ nguyên `Product`, `Order`, `Coupon` và DTO hiện tại; ánh xạ request/response Laravel trong tầng `src/services/api`.
2. Tạo HTTP adapter dùng `fetch` tại tầng API, đặt URL gốc trong biến môi trường Vite (`VITE_API_BASE_URL`), không đặt token trong mã nguồn.
3. Đổi phần repository bên trong từng service sang adapter API; giữ tên và chữ ký hàm để UI không phải biết backend nào đang chạy.
4. Chuyển order creation thành request duy nhất phía Laravel. Server phải kiểm tra coupon, tồn kho và cập nhật order/inventory trong transaction; không dựa vào tính tồn kho hoặc giảm giá từ trình duyệt.
5. Giữ mock adapter cho preview/demo bằng cấu hình runtime, rồi kiểm tra lại các luồng tạo đơn, tồn kho, coupon, tra cứu đơn và lỗi mạng.

`createCheckoutOrder` hiện là luồng mock phía trình duyệt: tạo order, trừ tồn kho và cập nhật coupon qua các service local, kèm thao tác bù khi bước sau lỗi. Đây không phải transaction thật hay cơ chế thanh toán an toàn cho production.
