import { z } from 'zod';

export const VIETNAMESE_PHONE_REGEX = /^(?:(?:\+84|84|0))(?:3|5|7|8|9)\d{8}$/;

export const checkoutFormSchema = z.object({
  receiverName: z
    .string()
    .trim()
    .min(2, 'Vui lòng nhập họ và tên người nhận (tối thiểu 2 ký tự)')
    .max(100, 'Họ và tên không quá 100 ký tự'),
  phone: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập số điện thoại')
    .regex(
      VIETNAMESE_PHONE_REGEX,
      'Số điện thoại không hợp lệ (10 chữ số, đầu số 03, 05, 07, 08, 09)'
    ),
  email: z
    .string()
    .trim()
    .email('Địa chỉ email không đúng định dạng')
    .optional()
    .or(z.literal('')),
  province: z.string().min(1, 'Vui lòng chọn Tỉnh / Thành phố'),
  district: z.string().min(1, 'Vui lòng chọn Quận / Huyện'),
  ward: z.string().min(1, 'Vui lòng chọn Phường / Xã'),
  street: z
    .string()
    .trim()
    .min(5, 'Vui lòng nhập số nhà, tên đường (tối thiểu 5 ký tự)')
    .max(255, 'Địa chỉ cụ thể quá dài'),
  paymentMethod: z
    .enum(['cod', 'vietqr', 'momo', 'card'], {
      required_error: 'Vui lòng chọn phương thức thanh toán',
    })
    .default('cod'),
  note: z
    .string()
    .trim()
    .max(300, 'Ghi chú đơn hàng tối đa 300 ký tự')
    .optional()
    .default(''),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;
