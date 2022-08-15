# Bảng Số Xe Việt Nam
- Tạo bảng số xe ngẫu nhiên cho mục đích kiểm thử.
- Tham khảo quy ước về [biển xe cơ giới Việt Nam](https://vi.wikipedia.org/wiki/Bi%E1%BB%83n_xe_c%C6%A1_gi%E1%BB%9Bi_Vi%E1%BB%87t_Nam)
- Demo: https://bangsoxe.web.app/

## Vietnamese Vehicle Plate Number
Generate vehicle plate number for testing purpose.

## Optional URL query parameters
- Ngôn ngữ (Language): `lang`
  - Tiếng Việt: `lang=vi`
  - English: `lang=en`
- Phương tiện (Vehicle): `vehicle`
  - Mô tô & xe máy (Motobike): `vehicle=motobike` (default)
  - Ô tô (Auto): `vehicle=auto`
- Hành động (Action): `action`
  - Tải về (Download): `action=download`

### Example
- https://bangsoxe.web.app/?lang=en
- https://bangsoxe.web.app/?lang=en&vehicle=auto
- https://bangsoxe.web.app/?action=download
- https://bangsoxe.web.app/?lang=en&action=download
- https://bangsoxe.web.app/?lang=en&vehicle=auto&action=download

## License
Licensed under MIT
