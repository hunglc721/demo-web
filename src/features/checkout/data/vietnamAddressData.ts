/**
 * Vietnamese Administrative Address Hierarchy (63 Provinces / Cities)
 * Comprehensive cascading data for Province -> District -> Ward selection.
 */

export interface VietnamDistrictData {
  name: string;
  wards: string[];
}

export interface VietnamProvinceData {
  name: string;
  code: string;
  districts: VietnamDistrictData[];
}

export const VIETNAM_63_PROVINCES: VietnamProvinceData[] = [
  // 1. TP. Hồ Chí Minh
  {
    name: 'TP. Hồ Chí Minh',
    code: '79',
    districts: [
      {
        name: 'Quận 1',
        wards: [
          'Phường Bến Nghé',
          'Phường Bến Thành',
          'Phường Đa Kao',
          'Phường Tân Định',
          'Phường Phạm Ngũ Lão',
          'Phường Cầu Ông Lãnh',
          'Phường Cô Giang',
          'Phường Cầu Kho',
          'Phường Nguyễn Cư Trinh',
          'Phường Nguyễn Thái Bình',
        ],
      },
      {
        name: 'Quận Bình Thạnh',
        wards: [
          'Phường 22',
          'Phường 19',
          'Phường 21',
          'Phường 25',
          'Phường 26',
          'Phường 27',
          'Phường 28',
          'Phường 1',
          'Phường 2',
          'Phường 3',
          'Phường 15',
          'Phường 17',
        ],
      },
      {
        name: 'TP. Thủ Đức',
        wards: [
          'Phường Thảo Điền',
          'Phường An Phú',
          'Phường Thủ Thiêm',
          'Phường Hiệp Bình Chánh',
          'Phường Hiệp Bình Phước',
          'Phường Linh Trung',
          'Phường Linh Tây',
          'Phường Tăng Nhơn Phú A',
          'Phường Phước Long B',
        ],
      },
      {
        name: 'Quận 3',
        wards: ['Phường Võ Thị Sáu', 'Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 9', 'Phường 11', 'Phường 14'],
      },
      {
        name: 'Quận 4',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 6', 'Phường 8', 'Phường 9', 'Phường 13', 'Phường 18'],
      },
      {
        name: 'Quận 5',
        wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 11', 'Phường 12', 'Phường 14'],
      },
      {
        name: 'Quận 7',
        wards: ['Phường Tân Phong', 'Phường Tân Phú', 'Phường Phú Mỹ', 'Phường Tân Quy', 'Phường Tân Kiểng', 'Phường Bình Thuận'],
      },
      {
        name: 'Quận 10',
        wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 6', 'Phường 9', 'Phường 10', 'Phường 12', 'Phường 14', 'Phường 15'],
      },
      {
        name: 'Quận Phú Nhuận',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 7', 'Phường 9', 'Phường 11', 'Phường 13', 'Phường 15'],
      },
      {
        name: 'Quận Gò Vấp',
        wards: ['Phường 1', 'Phường 3', 'Phường 5', 'Phường 8', 'Phường 10', 'Phường 11', 'Phường 14', 'Phường 16', 'Phường 17'],
      },
      {
        name: 'Quận Tân Bình',
        wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 6', 'Phường 10', 'Phường 12', 'Phường 13', 'Phường 15'],
      },
      {
        name: 'Quận Tân Phú',
        wards: ['Phường Tân Thành', 'Phường Tân Quý', 'Phường Tây Thạnh', 'Phường Phú Thọ Hòa', 'Phường Hiệp Tân'],
      },
      {
        name: 'Quận Bình Tân',
        wards: ['Phường An Lạc', 'Phường Bình Hưng Hòa', 'Phường Bình Trị Đông', 'Phường Tân Tạo'],
      },
      {
        name: 'Huyện Bình Chánh',
        wards: ['Thị trấn Tân Túc', 'Xã Bình Hưng', 'Xã Phong Phú', 'Xã Vĩnh Lộc A', 'Xã Vĩnh Lộc B', 'Xã Tân Kiên'],
      },
      {
        name: 'Huyện Nhà Bè',
        wards: ['Thị trấn Nhà Bè', 'Xã Phước Kiển', 'Xã Phú Xuân', 'Xã Nhơn Đức', 'Xã Long Thới'],
      },
      {
        name: 'Huyện Hóc Môn',
        wards: ['Thị trấn Hóc Môn', 'Xã Bà Điểm', 'Xã Xuân Thới Thượng', 'Xã Đông Thạnh', 'Xã Tân Hiệp'],
      },
      {
        name: 'Huyện Củ Chi',
        wards: ['Thị trấn Củ Chi', 'Xã Tân Thạnh Đông', 'Xã Bình Mỹ', 'Xã Phú Hòa Đông', 'Xã Phước Vĩnh An'],
      },
    ],
  },

  // 2. TP. Hà Nội
  {
    name: 'TP. Hà Nội',
    code: '01',
    districts: [
      {
        name: 'Quận Hoàn Kiếm',
        wards: [
          'Phường Tràng Tiền',
          'Phường Hàng Bạc',
          'Phường Hàng Buồm',
          'Phường Hàng Đào',
          'Phường Hàng Gai',
          'Phường Lý Thái Tổ',
          'Phường Phan Chu Trinh',
          'Phường Cửa Đông',
          'Phường Cửa Nam',
          'Phường Đồng Xuân',
        ],
      },
      {
        name: 'Quận Ba Đình',
        wards: ['Phường Điện Biên', 'Phường Đội Cấn', 'Phường Giảng Võ', 'Phường Kim Mã', 'Phường Liễu Giai', 'Phường Ngọc Hà', 'Phường Trúc Bạch'],
      },
      {
        name: 'Quận Đống Đa',
        wards: ['Phường Cát Linh', 'Phường Láng Hạ', 'Phường Ô Chợ Dừa', 'Phường Nam Đồng', 'Phường Văn Miếu', 'Phường Khâm Thiên'],
      },
      {
        name: 'Quận Cầu Giấy',
        wards: ['Phường Dịch Vọng', 'Phường Dịch Vọng Hậu', 'Phường Mai Dịch', 'Phường Nghĩa Đô', 'Phường Nghĩa Tân', 'Phường Quan Hoa', 'Phường Trung Hòa', 'Phường Yên Hòa'],
      },
      {
        name: 'Quận Hai Bà Trưng',
        wards: ['Phường Bạch Đằng', 'Phường Bách Khoa', 'Phường Đồng Tâm', 'Phường Lê Đại Hành', 'Phường Minh Khai', 'Phường Phố Huế', 'Phường Vĩnh Tuy'],
      },
      {
        name: 'Quận Tây Hồ',
        wards: ['Phường Bưởi', 'Phường Quảng An', 'Phường Thụy Khuê', 'Phường Tứ Liên', 'Phường Xuân La', 'Phường Yên Phụ', 'Phường Nhật Tân'],
      },
      {
        name: 'Quận Thanh Xuân',
        wards: ['Phường Hạ Đình', 'Phường Khương Đình', 'Phường Khương Mai', 'Phường Khương Trung', 'Phường Nhân Chính', 'Phường Thanh Xuân Bắc', 'Phường Thanh Xuân Trung'],
      },
      {
        name: 'Quận Hoàng Mai',
        wards: ['Phường Định Công', 'Phường Giáp Bát', 'Phường Hoàng Liệt', 'Phường Linh Đàm', 'Phường Mai Động', 'Phường Tân Mai', 'Phường Tương Mai'],
      },
      {
        name: 'Quận Long Biên',
        wards: ['Phường Bồ Đề', 'Phường Gia Thụy', 'Phường Ngọc Lâm', 'Phường Phúc Đồng', 'Phường Sài Đồng', 'Phường Thạch Bàn', 'Phường Việt Hưng'],
      },
      {
        name: 'Quận Nam Từ Liêm',
        wards: ['Phường Cầu Diễn', 'Phường Mỹ Đình 1', 'Phường Mỹ Đình 2', 'Phường Mễ Trì', 'Phường Phú Đô', 'Phường Tây Mỗ', 'Phường Đại Mỗ'],
      },
      {
        name: 'Quận Bắc Từ Liêm',
        wards: ['Phường Cổ Nhuế 1', 'Phường Cổ Nhuế 2', 'Phường Đức Thắng', 'Phường Minh Khai', 'Phường Phú Diễn', 'Phường Phúc Diễn', 'Phường Xuân Đỉnh'],
      },
      {
        name: 'Quận Hà Đông',
        wards: ['Phường Quang Trung', 'Phường Yết Kiêu', 'Phường Nguyễn Trãi', 'Phường Văn Quán', 'Phường Mộ Lao', 'Phường Hà Cầu', 'Phường Kiến Hưng'],
      },
      {
        name: 'Thị xã Sơn Tây',
        wards: ['Phường Lê Lợi', 'Phường Quang Trung', 'Phường Phú Thịnh', 'Phường Ngô Quyền', 'Xã Đường Lâm'],
      },
      {
        name: 'Huyện Đông Anh',
        wards: ['Thị trấn Đông Anh', 'Xã Hải Bối', 'Xã Kim Chung', 'Xã Tiên Dương', 'Xã Vĩnh Ngọc'],
      },
      {
        name: 'Huyện Gia Lâm',
        wards: ['Thị trấn Trâu Quỳ', 'Thị trấn Yên Viên', 'Xã Đa Tốn', 'Xã Bát Tràng', 'Xã Cổ Bi'],
      },
    ],
  },

  // 3. TP. Đà Nẵng
  {
    name: 'TP. Đà Nẵng',
    code: '48',
    districts: [
      {
        name: 'Quận Hải Châu',
        wards: ['Phường Hải Châu 1', 'Phường Hải Châu 2', 'Phường Thạch Thang', 'Phường Thanh Bình', 'Phường Thuận Phước', 'Phường Hòa Thuận Đông', 'Phường Bình Hiên'],
      },
      {
        name: 'Quận Thanh Khê',
        wards: ['Phường Vĩnh Trung', 'Phường Tân Chính', 'Phường Thạc Gián', 'Phường Chính Gián', 'Phường Tam Thuận', 'Phường Xuân Hà'],
      },
      {
        name: 'Quận Sơn Trà',
        wards: ['Phường An Hải Bắc', 'Phường An Hải Đông', 'Phường An Hải Tây', 'Phường Phước Mỹ', 'Phường Thọ Quang', 'Phường Mân Thái'],
      },
      {
        name: 'Quận Ngũ Hành Sơn',
        wards: ['Phường Mỹ An', 'Phường Khuê Mỹ', 'Phường Hòa Quý', 'Phường Hòa Hải'],
      },
      {
        name: 'Quận Liên Chiểu',
        wards: ['Phường Hòa Minh', 'Phường Hòa Khánh Bắc', 'Phường Hòa Khánh Nam', 'Phường Hòa Hiệp Bắc'],
      },
      {
        name: 'Quận Cẩm Lệ',
        wards: ['Phường Khuê Trung', 'Phường Hòa Thọ Đông', 'Phường Hòa Thọ Tây', 'Phường Hòa An', 'Phường Hòa Xuân'],
      },
      {
        name: 'Huyện Hòa Vang',
        wards: ['Xã Hòa Châu', 'Xã Hòa Tiến', 'Xã Hòa Phước', 'Xã Hòa Phong', 'Xã Hòa Khương'],
      },
    ],
  },

  // 4. TP. Hải Phòng
  {
    name: 'TP. Hải Phòng',
    code: '31',
    districts: [
      {
        name: 'Quận Hồng Bàng',
        wards: ['Phường Hoàng Văn Thụ', 'Phường Minh Khai', 'Phường Phan Bội Châu', 'Phường Thượng Lý', 'Phường Sở Dầu'],
      },
      {
        name: 'Quận Ngô Quyền',
        wards: ['Phường Cầu Đất', 'Phường Máy Chai', 'Phường Lạch Tray', 'Phường Lê Lợi', 'Phường Đông Khê'],
      },
      {
        name: 'Quận Lê Chân',
        wards: ['Phường An Biên', 'Phường Cát Dài', 'Phường Niệm Nghĩa', 'Phường Dư Hàng', 'Phường Vĩnh Niệm'],
      },
      {
        name: 'Quận Hải An',
        wards: ['Phường Đông Hải 1', 'Phường Đông Hải 2', 'Phường Đằng Hải', 'Phường Đằng Lâm', 'Phường Cát Bi'],
      },
      {
        name: 'Huyện Thủy Nguyên',
        wards: ['Thị trấn Núi Đèo', 'Thị trấn Minh Đức', 'Xã An Lư', 'Xã Hòa Bình', 'Xã Thủy Đường'],
      },
    ],
  },

  // 5. TP. Cần Thơ
  {
    name: 'TP. Cần Thơ',
    code: '92',
    districts: [
      {
        name: 'Quận Ninh Kiều',
        wards: ['Phường Tân An', 'Phường An Cư', 'Phường An Phú', 'Phường Xuân Khánh', 'Phường Hưng Lợi', 'Phường Cái Khế'],
      },
      {
        name: 'Quận Bình Thủy',
        wards: ['Phường Bình Thủy', 'Phường Trà An', 'Phường Trà Nóc', 'Phường An Thới', 'Phường Bùi Hữu Nghĩa'],
      },
      {
        name: 'Quận Cái Răng',
        wards: ['Phường Lê Bình', 'Phường Hưng Phú', 'Phường Hưng Thạnh', 'Phường Ba Láng', 'Phường Tân Phú'],
      },
      {
        name: 'Quận Ô Môn',
        wards: ['Phường Châu Văn Liêm', 'Phường Thới Hòa', 'Phường Thới An', 'Phường Phước Thới'],
      },
    ],
  },

  // 6. Khánh Hòa
  {
    name: 'Khánh Hòa',
    code: '56',
    districts: [
      {
        name: 'TP. Nha Trang',
        wards: [
          'Phường Lộc Thọ',
          'Phường Phước Tiến',
          'Phường Phước Tân',
          'Phường Vạn Thạnh',
          'Phường Tân Lập',
          'Phường Phương Sài',
          'Phường Vĩnh Nguyên',
          'Phường Vĩnh Hải',
        ],
      },
      {
        name: 'TP. Cam Ranh',
        wards: ['Phường Cam Lộc', 'Phường Cam Phú', 'Phường Cam Linh', 'Phường Cam Nghĩa', 'Phường Ba Ngòi'],
      },
      {
        name: 'Thị xã Ninh Hòa',
        wards: ['Phường Ninh Hiệp', 'Phường Ninh Đa', 'Phường Ninh Giang', 'Xã Ninh Quang'],
      },
      {
        name: 'Huyện Diên Khánh',
        wards: ['Thị trấn Diên Khánh', 'Xã Diên An', 'Xã Diên Toàn', 'Xã Diên Lạc'],
      },
    ],
  },

  // 7. Bình Dương
  {
    name: 'Bình Dương',
    code: '74',
    districts: [
      {
        name: 'TP. Thủ Dầu Một',
        wards: ['Phường Phú Cường', 'Phường Hiệp Thành', 'Phường Chánh Nghĩa', 'Phường Phú Lợi', 'Phường Định Hòa'],
      },
      {
        name: 'TP. Thuận An',
        wards: ['Phường Lái Thiêu', 'Phường An Phú', 'Phường Bình Hòa', 'Phường Vĩnh Phú', 'Phường Thuận Giao'],
      },
      {
        name: 'TP. Dĩ An',
        wards: ['Phường Dĩ An', 'Phường Đông Hòa', 'Phường Tân Đông Hiệp', 'Phường An Bình', 'Phường Tân Bình'],
      },
      {
        name: 'TP. Tân Uyên',
        wards: ['Phường Uyên Hưng', 'Phường Tân Hiệp', 'Phường Khánh Bình', 'Phường Thái Hòa'],
      },
      {
        name: 'Thị xã Bến Cát',
        wards: ['Phường Mỹ Phước', 'Phường Thới Hòa', 'Phường Tân Định', 'Phường Hòa Lợi'],
      },
    ],
  },

  // 8. Đồng Nai
  {
    name: 'Đồng Nai',
    code: '75',
    districts: [
      {
        name: 'TP. Biên Hòa',
        wards: ['Phường Quyết Thắng', 'Phường Trung Dũng', 'Phường Thống Nhất', 'Phường Tân Phong', 'Phường Trảng Dài', 'Phường Long Bình'],
      },
      {
        name: 'TP. Long Khánh',
        wards: ['Phường Xuân An', 'Phường Xuân Hòa', 'Phường Phú Bình', 'Phường Suối Tre'],
      },
      {
        name: 'Huyện Long Thành',
        wards: ['Thị trấn Long Thành', 'Xã An Phước', 'Xã Bình Sơn', 'Xã Lộc An'],
      },
      {
        name: 'Huyện Nhơn Trạch',
        wards: ['Thị trấn Hiệp Phước', 'Xã Phước Thiền', 'Xã Đại Phước', 'Xã Phú Hội'],
      },
    ],
  },

  // 9. Bà Rịa - Vũng Tàu
  {
    name: 'Bà Rịa - Vũng Tàu',
    code: '77',
    districts: [
      {
        name: 'TP. Vũng Tàu',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 7', 'Phường Thắng Tam', 'Phường Nguyễn An Ninh'],
      },
      {
        name: 'TP. Bà Rịa',
        wards: ['Phường Phước Trung', 'Phường Phước Hiệp', 'Phường Phước Hưng', 'Phường Long Toàn'],
      },
      {
        name: 'Thị xã Phú Mỹ',
        wards: ['Phường Phú Mỹ', 'Phường Mỹ Xuân', 'Phường Hắc Dịch', 'Phường Tân Phước'],
      },
    ],
  },

  // 10. Quảng Ninh
  {
    name: 'Quảng Ninh',
    code: '22',
    districts: [
      {
        name: 'TP. Hạ Long',
        wards: ['Phường Bạch Đằng', 'Phường Bãi Cháy', 'Phường Hồng Gai', 'Phường Cao Thắng', 'Phường Hà Khẩu'],
      },
      {
        name: 'TP. Cẩm Phả',
        wards: ['Phường Cẩm Trung', 'Phường Cẩm Thành', 'Phường Cẩm Phả', 'Phường Cửa Ông'],
      },
      {
        name: 'TP. Móng Cái',
        wards: ['Phường Trần Phú', 'Phường Ka Long', 'Phường Ninh Dương', 'Phường Trà Cổ'],
      },
      {
        name: 'TP. Uông Bí',
        wards: ['Phường Quang Trung', 'Phường Thanh Sơn', 'Phường Nam Khê', 'Phường Yên Thanh'],
      },
    ],
  },

  // 11. Thừa Thiên Huế
  {
    name: 'Thừa Thiên Huế',
    code: '46',
    districts: [
      {
        name: 'TP. Huế',
        wards: ['Phường Vĩnh Ninh', 'Phường Phú Nhuận', 'Phường Thuận Thành', 'Phường Thuận Hòa', 'Phường Tây Lộc', 'Phường Hương Sơ'],
      },
      {
        name: 'Thị xã Hương Thủy',
        wards: ['Phường Phú Bài', 'Phường Thủy Dương', 'Phường Thủy Phương'],
      },
      {
        name: 'Thị xã Hương Trà',
        wards: ['Phường Tứ Hạ', 'Phường Hương Văn', 'Phường Hương Xuân'],
      },
    ],
  },

  // 12. Lâm Đồng
  {
    name: 'Lâm Đồng',
    code: '68',
    districts: [
      {
        name: 'TP. Đà Lạt',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 8', 'Phường 9', 'Phường 10'],
      },
      {
        name: 'TP. Bảo Lộc',
        wards: ['Phường 1', 'Phường 2', 'Phường B’Lao', 'Phường Lộc Phát', 'Phường Lộc Tiến'],
      },
      {
        name: 'Huyện Đức Trọng',
        wards: ['Thị trấn Liên Nghĩa', 'Xã Hiệp An', 'Xã Phú Hội', 'Xã Tân Hội'],
      },
    ],
  },

  // 13. Bắc Ninh
  {
    name: 'Bắc Ninh',
    code: '27',
    districts: [
      {
        name: 'TP. Bắc Ninh',
        wards: ['Phường Suối Hoa', 'Phường Tiền An', 'Phường Ninh Xá', 'Phường Đại Phúc', 'Phường Võ Cường'],
      },
      {
        name: 'TP. Từ Sơn',
        wards: ['Phường Đông Ngàn', 'Phường Đồng Nguyên', 'Phường Tân Hồng', 'Phường Trang Hạ'],
      },
      {
        name: 'Thị xã Thuận Thành',
        wards: ['Phường Hồ', 'Phường Trạm Lộ', 'Phường An Bình'],
      },
    ],
  },

  // 14. An Giang
  {
    name: 'An Giang',
    code: '89',
    districts: [
      { name: 'TP. Long Xuyên', wards: ['Phường Mỹ Long', 'Phường Mỹ Bình', 'Phường Mỹ Xuyên', 'Phường Mỹ Thới'] },
      { name: 'TP. Châu Đốc', wards: ['Phường Châu Phú A', 'Phường Châu Phú B', 'Phường Núi Sam'] },
      { name: 'Thị xã Tân Châu', wards: ['Phường Long Thạnh', 'Phường Long Hưng', 'Phường Long Sơn'] },
    ],
  },

  // 15. Bắc Giang
  {
    name: 'Bắc Giang',
    code: '24',
    districts: [
      { name: 'TP. Bắc Giang', wards: ['Phường Ngô Quyền', 'Phường Trần Nguyên Hãn', 'Phường Lê Lợi', 'Phường Hoàng Văn Thụ'] },
      { name: 'Thị xã Việt Yên', wards: ['Phường Bích Động', 'Phường Nếnh', 'Phường Tăng Tiến'] },
    ],
  },

  // 16. Bắc Kạn
  {
    name: 'Bắc Kạn',
    code: '06',
    districts: [
      { name: 'TP. Bắc Kạn', wards: ['Phường Đức Xuân', 'Phường Sông Cầu', 'Phường Phùng Chí Kiên', 'Phường Nguyễn Thị Minh Khai'] },
      { name: 'Huyện Chợ Đồn', wards: ['Thị trấn Bằng Lũng', 'Xã Phương Viên', 'Xã Bằng Lãng'] },
    ],
  },

  // 17. Bạc Liêu
  {
    name: 'Bạc Liêu',
    code: '95',
    districts: [
      { name: 'TP. Bạc Liêu', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 7', 'Phường Nhà Mát'] },
      { name: 'Thị xã Giá Rai', wards: ['Phường 1', 'Phường Hộ Phòng', 'Phường Láng Tròn'] },
    ],
  },

  // 18. Bến Tre
  {
    name: 'Bến Tre',
    code: '83',
    districts: [
      { name: 'TP. Bến Tre', wards: ['Phường An Hội', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường Phú Khương'] },
      { name: 'Huyện Châu Thành', wards: ['Thị trấn Châu Thành', 'Xã Tiên Thủy', 'Xã Tân Thạch'] },
    ],
  },

  // 19. Bình Định
  {
    name: 'Bình Định',
    code: '52',
    districts: [
      { name: 'TP. Quy Nhơn', wards: ['Phường Lê Lợi', 'Phường Trần Hưng Đạo', 'Phường Ngô Mây', 'Phường Nguyễn Văn Cừ', 'Phường Ghềnh Ráng'] },
      { name: 'Thị xã An Nhơn', wards: ['Phường Bình Định', 'Phường Đập Đá', 'Phường Nhơn Hưng'] },
    ],
  },

  // 20. Bình Phước
  {
    name: 'Bình Phước',
    code: '70',
    districts: [
      { name: 'TP. Đồng Xoài', wards: ['Phường Tân Phú', 'Phường Tân Bình', 'Phường Tân Xuân', 'Phường Tân Thiện'] },
      { name: 'Thị xã Chơn Thành', wards: ['Phường Hưng Long', 'Phường Thành Tâm', 'Phường Minh Hưng'] },
    ],
  },

  // 21. Bình Thuận
  {
    name: 'Bình Thuận',
    code: '60',
    districts: [
      { name: 'TP. Phan Thiết', wards: ['Phường Đức Nghĩa', 'Phường Lạc Đạo', 'Phường Phú Thủy', 'Phường Mũi Né', 'Phường Hàm Tiến'] },
      { name: 'Thị xã La Gi', wards: ['Phường Phước Hội', 'Phường Phước Lộc', 'Phường Tân An'] },
    ],
  },

  // 22. Cà Mau
  {
    name: 'Cà Mau',
    code: '96',
    districts: [
      { name: 'TP. Cà Mau', wards: ['Phường 1', 'Phường 2', 'Phường 5', 'Phường 8', 'Phường 9', 'Phường Tân Xuyên'] },
      { name: 'Huyện Năm Căn', wards: ['Thị trấn Năm Căn', 'Xã Đất Mới', 'Xã Hàm Rồng'] },
    ],
  },

  // 23. Cao Bằng
  {
    name: 'Cao Bằng',
    code: '04',
    districts: [
      { name: 'TP. Cao Bằng', wards: ['Phường Hợp Giang', 'Phường Sông Bằng', 'Phường Sông Hiến', 'Phường Đề Thám'] },
      { name: 'Huyện Trùng Khánh', wards: ['Thị trấn Trùng Khánh', 'Xã Đàm Thủy', 'Xã Phong Nậm'] },
    ],
  },

  // 24. Đắk Lắk
  {
    name: 'Đắk Lắk',
    code: '66',
    districts: [
      { name: 'TP. Buôn Ma Thuột', wards: ['Phường Thắng Lợi', 'Phường Tân Lợi', 'Phường Thành Công', 'Phường Tân An', 'Phường Tự An'] },
      { name: 'Thị xã Buôn Hồ', wards: ['Phường An Lạc', 'Phường An Bình', 'Phường Thiện An'] },
    ],
  },

  // 25. Đắk Nông
  {
    name: 'Đắk Nông',
    code: '67',
    districts: [
      { name: 'TP. Gia Nghĩa', wards: ['Phường Nghĩa Đức', 'Phường Nghĩa Thành', 'Phường Nghĩa Phú', 'Phường Nghĩa Tân'] },
      { name: 'Huyện Đắk Mil', wards: ['Thị trấn Đắk Mil', 'Xã Đức Minh', 'Xã Đức Mạnh'] },
    ],
  },

  // 26. Điện Biên
  {
    name: 'Điện Biên',
    code: '11',
    districts: [
      { name: 'TP. Điện Biên Phủ', wards: ['Phường Mường Thanh', 'Phường Him Lam', 'Phường Tân Thanh', 'Phường Thanh Bình'] },
      { name: 'Thị xã Mường Lay', wards: ['Phường Na Lay', 'Phường Sông Đà'] },
    ],
  },

  // 27. Đồng Tháp
  {
    name: 'Đồng Tháp',
    code: '87',
    districts: [
      { name: 'TP. Cao Lãnh', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường Mỹ Phú'] },
      { name: 'TP. Sa Đéc', wards: ['Phường 1', 'Phường 2', 'Phường Tân Quy Đông', 'Phường An Hòa'] },
      { name: 'TP. Hồng Ngự', wards: ['Phường An Thạnh', 'Phường An Lộc', 'Phường An Bình A'] },
    ],
  },

  // 28. Gia Lai
  {
    name: 'Gia Lai',
    code: '64',
    districts: [
      { name: 'TP. Pleiku', wards: ['Phường Diên Hồng', 'Phường Hoa Lư', 'Phường Tây Sơn', 'Phường Hội Thương', 'Phường Yên Đỗ'] },
      { name: 'Thị xã An Khê', wards: ['Phường An Phú', 'Phường Tây Sơn', 'Phường An Bình'] },
    ],
  },

  // 29. Hà Giang
  {
    name: 'Hà Giang',
    code: '02',
    districts: [
      { name: 'TP. Hà Giang', wards: ['Phường Trần Phú', 'Phường Minh Khai', 'Phường Nguyễn Trãi', 'Phường Quang Trung'] },
      { name: 'Huyện Đồng Văn', wards: ['Thị trấn Đồng Văn', 'Xã Lũng Cú', 'Xã Sà Phìn', 'Xã Phố Cáo'] },
    ],
  },

  // 30. Hà Nam
  {
    name: 'Hà Nam',
    code: '35',
    districts: [
      { name: 'TP. Phủ Lý', wards: ['Phường Minh Khai', 'Phường Lương Khánh Thiện', 'Phường Hai Bà Trưng', 'Phường Trần Hưng Đạo'] },
      { name: 'Thị xã Duy Tiên', wards: ['Phường Hòa Mạc', 'Phường Đồng Văn', 'Phường Bạch Thượng'] },
    ],
  },

  // 31. Hà Tĩnh
  {
    name: 'Hà Tĩnh',
    code: '42',
    districts: [
      { name: 'TP. Hà Tĩnh', wards: ['Phường Bắc Hà', 'Phường Nam Hà', 'Phường Trần Phú', 'Phường Hà Huy Tập'] },
      { name: 'Thị xã Hồng Lĩnh', wards: ['Phường Bắc Hồng', 'Phường Nam Hồng', 'Phường Trung Lương'] },
      { name: 'Thị xã Kỳ Anh', wards: ['Phường Sông Trí', 'Phường Kỳ Liên', 'Phường Kỳ Phương'] },
    ],
  },

  // 32. Hải Dương
  {
    name: 'Hải Dương',
    code: '30',
    districts: [
      { name: 'TP. Hải Dương', wards: ['Phường Trần Phú', 'Phường Quang Trung', 'Phường Nguyễn Trãi', 'Phường Lê Thanh Nghị', 'Phường Hải Tân'] },
      { name: 'TP. Chí Linh', wards: ['Phường Sao Đỏ', 'Phường Cộng Hòa', 'Phường Bến Tắm'] },
      { name: 'Thị xã Kinh Môn', wards: ['Phường An Lưu', 'Phường Hiệp An', 'Phường Phú Thứ'] },
    ],
  },

  // 33. Hậu Giang
  {
    name: 'Hậu Giang',
    code: '93',
    districts: [
      { name: 'TP. Vị Thanh', wards: ['Phường 1', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7'] },
      { name: 'TP. Ngã Bảy', wards: ['Phường Ngã Bảy', 'Phường Lái Hiếu', 'Phường Hiệp Thành'] },
    ],
  },

  // 34. Hòa Bình
  {
    name: 'Hòa Bình',
    code: '17',
    districts: [
      { name: 'TP. Hòa Bình', wards: ['Phường Phương Lâm', 'Phường Đồng Tiến', 'Phường Tân Thịnh', 'Phường Hữu Nghị'] },
      { name: 'Huyện Lương Sơn', wards: ['Thị trấn Lương Sơn', 'Xã Hòa Sơn', 'Xã Nhuận Trạch'] },
    ],
  },

  // 35. Hưng Yên
  {
    name: 'Hưng Yên',
    code: '33',
    districts: [
      { name: 'TP. Hưng Yên', wards: ['Phường Lê Lợi', 'Phường Quang Trung', 'Phường Minh Khai', 'Phường Hiến Nam'] },
      { name: 'Thị xã Mỹ Hào', wards: ['Phường Bần Yên Nhân', 'Phường Phan Đình Phùng', 'Phường Nhân Hòa'] },
      { name: 'Huyện Văn Giang', wards: ['Thị trấn Văn Giang', 'Xã Xuân Quan', 'Xã Phụng Công', 'Xã Cửu Cao'] },
    ],
  },

  // 36. Kiên Giang
  {
    name: 'Kiên Giang',
    code: '91',
    districts: [
      { name: 'TP. Rạch Giá', wards: ['Phường Vĩnh Thanh Vân', 'Phường Vĩnh Thanh', 'Phường Vĩnh Lạc', 'Phường An Hòa'] },
      { name: 'TP. Phú Quốc', wards: ['Phường Dương Đông', 'Phường An Thới', 'Xã Hàm Ninh', 'Xã Cửa Cạn', 'Xã Gành Dầu'] },
      { name: 'TP. Hà Tiên', wards: ['Phường Đông Hồ', 'Phường Bình San', 'Phường Pháo Đài'] },
    ],
  },

  // 37. Kon Tum
  {
    name: 'Kon Tum',
    code: '62',
    districts: [
      { name: 'TP. Kon Tum', wards: ['Phường Quyết Thắng', 'Phường Thắng Lợi', 'Phường Quang Trung', 'Phường Duy Tân'] },
      { name: 'Huyện Đắk Hà', wards: ['Thị trấn Đắk Hà', 'Xã Hà Mòn', 'Xã Đắk Mar'] },
    ],
  },

  // 38. Lai Châu
  {
    name: 'Lai Châu',
    code: '12',
    districts: [
      { name: 'TP. Lai Châu', wards: ['Phường Quyết Thắng', 'Phường Tân Phong', 'Phường Đoàn Kết'] },
      { name: 'Huyện Phong Thổ', wards: ['Thị trấn Phong Thổ', 'Xã Mường So', 'Xã Khổng Lào'] },
    ],
  },

  // 39. Lạng Sơn
  {
    name: 'Lạng Sơn',
    code: '20',
    districts: [
      { name: 'TP. Lạng Sơn', wards: ['Phường Hoàng Văn Thụ', 'Phường Tam Thanh', 'Phường Vĩnh Trại', 'Phường Đông Kinh'] },
      { name: 'Huyện Cao Lộc', wards: ['Thị trấn Cao Lộc', 'Thị trấn Đồng Đăng', 'Xã Hợp Thành'] },
    ],
  },

  // 40. Lào Cai
  {
    name: 'Lào Cai',
    code: '10',
    districts: [
      { name: 'TP. Lào Cai', wards: ['Phường Kim Tân', 'Phường Cốc Lếu', 'Phường Bắc Cường', 'Phường Nam Cường', 'Phường Duyên Hải'] },
      { name: 'Thị xã Sa Pa', wards: ['Phường Sa Pa', 'Phường Hàm Rồng', 'Phường Phan Si Păng', 'Xã Tả Van'] },
    ],
  },

  // 41. Long An
  {
    name: 'Long An',
    code: '80',
    districts: [
      { name: 'TP. Tân An', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường Khánh Hậu'] },
      { name: 'Thị xã Kiến Tường', wards: ['Phường 1', 'Phường 2', 'Phường 3'] },
      { name: 'Huyện Bến Lức', wards: ['Thị trấn Bến Lức', 'Xã An Thạnh', 'Xã Mỹ Yên', 'Xã Lương Hòa'] },
      { name: 'Huyện Đức Hòa', wards: ['Thị trấn Hậu Nghĩa', 'Thị trấn Đức Hòa', 'Xã Mỹ Hạnh Nam'] },
    ],
  },

  // 42. Nam Định
  {
    name: 'Nam Định',
    code: '36',
    districts: [
      { name: 'TP. Nam Định', wards: ['Phường Vị Hoàng', 'Phường Trần Hưng Đạo', 'Phường Lộc Vượng', 'Phường Năng Tĩnh'] },
      { name: 'Huyện Hải Hậu', wards: ['Thị trấn Yên Định', 'Thị trấn Cồn', 'Xã Hải Phương'] },
    ],
  },

  // 43. Nghệ An
  {
    name: 'Nghệ An',
    code: '40',
    districts: [
      { name: 'TP. Vinh', wards: ['Phường Lê Mao', 'Phường Quang Trung', 'Phường Trường Thi', 'Phường Hưng Dũng', 'Phường Hà Huy Tập'] },
      { name: 'Thị xã Cửa Lò', wards: ['Phường Nghi Hương', 'Phường Nghi Thu', 'Phường Thu Thủy'] },
      { name: 'Thị xã Thái Hòa', wards: ['Phường Hòa Hiếu', 'Phường Long Sơn', 'Phường Quang Tiến'] },
    ],
  },

  // 44. Ninh Bình
  {
    name: 'Ninh Bình',
    code: '37',
    districts: [
      { name: 'TP. Ninh Bình', wards: ['Phường Đông Thành', 'Phường Vân Giang', 'Phường Nam Thành', 'Phường Bích Đào', 'Phường Tân Thành'] },
      { name: 'TP. Tam Điệp', wards: ['Phường Bắc Sơn', 'Phường Trung Sơn', 'Phường Nam Sơn'] },
      { name: 'Huyện Hoa Lư', wards: ['Thị trấn Thiên Tôn', 'Xã Ninh Xuân', 'Xã Ninh Hải', 'Xã Ninh Thắng'] },
    ],
  },

  // 45. Ninh Thuận
  {
    name: 'Ninh Thuận',
    code: '58',
    districts: [
      { name: 'TP. Phan Rang - Tháp Chàm', wards: ['Phường Kinh Dinh', 'Phường Thanh Sơn', 'Phường Phước Mỹ', 'Phường Đô Vinh'] },
      { name: 'Huyện Ninh Hải', wards: ['Thị trấn Khánh Hải', 'Xã Tri Hải', 'Xã Vĩnh Hải'] },
    ],
  },

  // 46. Phú Thọ
  {
    name: 'Phú Thọ',
    code: '25',
    districts: [
      { name: 'TP. Việt Trì', wards: ['Phường Gia Cẩm', 'Phường Tiên Cát', 'Phường Nông Trang', 'Phường Tân Dân'] },
      { name: 'Thị xã Phú Thọ', wards: ['Phường Âu Cơ', 'Phường Hùng Vương', 'Phường Phong Châu'] },
    ],
  },

  // 47. Phú Yên
  {
    name: 'Phú Yên',
    code: '54',
    districts: [
      { name: 'TP. Tuy Hòa', wards: ['Phường 1', 'Phường 2', 'Phường 5', 'Phường 7', 'Phường 9', 'Phường Phú Thạnh'] },
      { name: 'Thị xã Sông Cầu', wards: ['Phường Xuân Phú', 'Phường Xuân Thành', 'Phường Xuân Yên'] },
      { name: 'Thị xã Đông Hòa', wards: ['Phường Hòa Hiệp Bắc', 'Phường Hòa Hiệp Trung', 'Phường Hòa Vinh'] },
    ],
  },

  // 48. Quảng Bình
  {
    name: 'Quảng Bình',
    code: '44',
    districts: [
      { name: 'TP. Đồng Hới', wards: ['Phường Đồng Mỹ', 'Phường Hải Đình', 'Phường Nam Lý', 'Phường Bắc Lý'] },
      { name: 'Thị xã Ba Đồn', wards: ['Phường Ba Đồn', 'Phường Quảng Thọ', 'Phường Quảng Long'] },
      { name: 'Huyện Bố Trạch', wards: ['Thị trấn Hoàn Lão', 'Thị trấn Phong Nha', 'Xã Hải Phú'] },
    ],
  },

  // 49. Quảng Nam
  {
    name: 'Quảng Nam',
    code: '49',
    districts: [
      { name: 'TP. Tam Kỳ', wards: ['Phường An Mỹ', 'Phường Tân Thạnh', 'Phường Phước Hòa', 'Phường An Xuân'] },
      { name: 'TP. Hội An', wards: ['Phường Minh An', 'Phường Cẩm Phô', 'Phường Sơn Phong', 'Phường Cẩm Châu', 'Phường Cửa Đại'] },
      { name: 'Thị xã Điện Bàn', wards: ['Phường Vĩnh Điện', 'Phường Điện Ngọc', 'Phường Điện Nam Trung'] },
    ],
  },

  // 50. Quảng Ngãi
  {
    name: 'Quảng Ngãi',
    code: '51',
    districts: [
      { name: 'TP. Quảng Ngãi', wards: ['Phường Trần Phú', 'Phường Lê Hồng Phong', 'Phường Nghĩa Chánh', 'Phường Quảng Phú'] },
      { name: 'Thị xã Đức Phổ', wards: ['Phường Nguyễn Nghiêm', 'Phường Phổ Thạnh', 'Phường Phổ Ninh'] },
    ],
  },

  // 51. Quảng Trị
  {
    name: 'Quảng Trị',
    code: '45',
    districts: [
      { name: 'TP. Đông Hà', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường Đông Lương'] },
      { name: 'Thị xã Quảng Trị', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường An Đôn'] },
    ],
  },

  // 52. Sóc Trăng
  {
    name: 'Sóc Trăng',
    code: '94',
    districts: [
      { name: 'TP. Sóc Trăng', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 6', 'Phường 8'] },
      { name: 'Thị xã Vĩnh Châu', wards: ['Phường 1', 'Phường 2', 'Phường Vĩnh Phước'] },
      { name: 'Thị xã Ngã Năm', wards: ['Phường 1', 'Phường 2', 'Phường 3'] },
    ],
  },

  // 53. Sơn La
  {
    name: 'Sơn La',
    code: '14',
    districts: [
      { name: 'TP. Sơn La', wards: ['Phường Tô Hiệu', 'Phường Quyết Thắng', 'Phường Quyết Tâm', 'Phường Chiềng Cơi'] },
      { name: 'Huyện Mộc Châu', wards: ['Thị trấn Mộc Châu', 'Thị trấn Nông trường Mộc Châu', 'Xã Đông Sang'] },
    ],
  },

  // 54. Tây Ninh
  {
    name: 'Tây Ninh',
    code: '72',
    districts: [
      { name: 'TP. Tây Ninh', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường Hiệp Ninh', 'Phường Ninh Thạnh'] },
      { name: 'Thị xã Trảng Bàng', wards: ['Phường Trảng Bàng', 'Phường An Hòa', 'Phường Gia Lộc'] },
      { name: 'Thị xã Hòa Thành', wards: ['Phường Long Hoa', 'Phường Hiệp Tân', 'Phường Long Thành Bắc'] },
    ],
  },

  // 55. Thái Bình
  {
    name: 'Thái Bình',
    code: '34',
    districts: [
      { name: 'TP. Thái Bình', wards: ['Phường Lê Hồng Phong', 'Phường Đề Thám', 'Phường Bồ Xuyên', 'Phường Kỳ Bá', 'Phường Quang Trung'] },
      { name: 'Huyện Đông Hưng', wards: ['Thị trấn Đông Hưng', 'Xã Đông La', 'Xã Đông Các'] },
    ],
  },

  // 56. Thái Nguyên
  {
    name: 'Thái Nguyên',
    code: '19',
    districts: [
      { name: 'TP. Thái Nguyên', wards: ['Phường Phan Đình Phùng', 'Phường Hoàng Văn Thụ', 'Phường Tân Thịnh', 'Phường Đồng Quang'] },
      { name: 'TP. Sông Công', wards: ['Phường Thắng Lợi', 'Phường Cải Đan', 'Phường Mỏ Chè'] },
      { name: 'TP. Phổ Yên', wards: ['Phường Ba Hàng', 'Phường Bãi Bông', 'Phường Bắc Sơn'] },
    ],
  },

  // 57. Thanh Hóa
  {
    name: 'Thanh Hóa',
    code: '38',
    districts: [
      { name: 'TP. Thanh Hóa', wards: ['Phường Điện Biên', 'Phường Ba Đình', 'Phường Lam Sơn', 'Phường Ngọc Trạo', 'Phường Đông Thọ'] },
      { name: 'TP. Sầm Sơn', wards: ['Phường Bắc Sơn', 'Phường Trung Sơn', 'Phường Trường Sơn', 'Phường Quảng Cư'] },
      { name: 'Thị xã Bỉm Sơn', wards: ['Phường Ba Đình', 'Phường Bắc Sơn', 'Phường Ngọc Trạo'] },
      { name: 'Thị xã Nghi Sơn', wards: ['Phường Hải Hòa', 'Phường Hải Châu', 'Phường Ninh Hải'] },
    ],
  },

  // 58. Tiền Giang
  {
    name: 'Tiền Giang',
    code: '82',
    districts: [
      { name: 'TP. Mỹ Tho', wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường Tân Long'] },
      { name: 'TP. Gò Công', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4'] },
      { name: 'Thị xã Cai Lậy', wards: ['Phường 1', 'Phường 2', 'Phường Nhị Mỹ'] },
    ],
  },

  // 59. Trà Vinh
  {
    name: 'Trà Vinh',
    code: '84',
    districts: [
      { name: 'TP. Trà Vinh', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 7', 'Phường 9'] },
      { name: 'Thị xã Duyên Hải', wards: ['Phường 1', 'Phường 2', 'Xã Dân Thành'] },
    ],
  },

  // 60. Tuyên Quang
  {
    name: 'Tuyên Quang',
    code: '08',
    districts: [
      { name: 'TP. Tuyên Quang', wards: ['Phường Tân Quang', 'Phường Phan Thiết', 'Phường Minh Xuân', 'Phường Nông Tiến'] },
      { name: 'Huyện Sơn Dương', wards: ['Thị trấn Sơn Dương', 'Xã Tân Trào', 'Xã Vĩnh Lợi'] },
    ],
  },

  // 61. Vĩnh Long
  {
    name: 'Vĩnh Long',
    code: '86',
    districts: [
      { name: 'TP. Vĩnh Long', wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 9', 'Phường Tân Hòa'] },
      { name: 'Thị xã Bình Minh', wards: ['Phường Cái Vồn', 'Phường Thành Phước', 'Phường Đông Thuận'] },
    ],
  },

  // 62. Vĩnh Phúc
  {
    name: 'Vĩnh Phúc',
    code: '26',
    districts: [
      { name: 'TP. Vĩnh Yên', wards: ['Phường Ngô Quyền', 'Phường Đống Đa', 'Phường Liên Bảo', 'Phường Khai Quang'] },
      { name: 'TP. Phúc Yên', wards: ['Phường Trưng Trắc', 'Phường Hùng Vương', 'Phường Xuân Hòa', 'Phường Tiền Châu'] },
      { name: 'Huyện Tam Đảo', wards: ['Thị trấn Hợp Châu', 'Thị trấn Tam Đảo', 'Xã Đại Đình'] },
    ],
  },

  // 63. Yên Bái
  {
    name: 'Yên Bái',
    code: '15',
    districts: [
      { name: 'TP. Yên Bái', wards: ['Phường Đồng Tâm', 'Phường Hồng Hà', 'Phường Nguyễn Thái Học', 'Phường Yên Ninh'] },
      { name: 'Thị xã Nghĩa Lộ', wards: ['Phường Tân An', 'Phường Trung Tâm', 'Phường Cầu Thia'] },
      { name: 'Huyện Mù Cang Chải', wards: ['Thị trấn Mù Cang Chải', 'Xã La Pán Tẩn', 'Xã Chế Cu Nha'] },
    ],
  },
];

/**
 * Returns the names of all 63 Vietnamese provinces/cities.
 */
export function getVietnam63Provinces(): string[] {
  return VIETNAM_63_PROVINCES.map((p) => p.name);
}

/**
 * Returns district names for a given province.
 */
export function getDistrictsByProvince(provinceName: string): string[] {
  if (!provinceName) return [];
  const found = VIETNAM_63_PROVINCES.find(
    (p) => p.name.toLowerCase() === provinceName.trim().toLowerCase()
  );
  return found ? found.districts.map((d) => d.name) : [];
}

/**
 * Returns ward names for a given province and district.
 */
export function getWardsByDistrict(provinceName: string, districtName: string): string[] {
  if (!provinceName || !districtName) return [];
  const prov = VIETNAM_63_PROVINCES.find(
    (p) => p.name.toLowerCase() === provinceName.trim().toLowerCase()
  );
  if (!prov) return [];
  const dist = prov.districts.find(
    (d) => d.name.toLowerCase() === districtName.trim().toLowerCase()
  );
  return dist ? dist.wards : [];
}
