-- Run this SQL in Supabase SQL Editor to create tables

-- Products table
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null default 'Khác',
  price numeric not null default 0,
  unit text not null default 'cái',
  specs jsonb not null default '{}',
  images text[] not null default '{}',
  visible boolean not null default true,
  description text not null default '',
  created_at timestamptz not null default now()
);

-- Posts table
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  date date not null default current_date,
  content text not null default '',
  excerpt text not null default '',
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS) with public read access
alter table products enable row level security;
alter table posts enable row level security;

-- Allow public read
create policy "Public read products" on products for select using (true);
create policy "Public read posts" on posts for select using (true);

-- Allow all operations via service role (API routes use anon key + we manage auth ourselves)
create policy "Admin full access products" on products for all using (true) with check (true);
create policy "Admin full access posts" on posts for all using (true) with check (true);

-- Sample products
insert into products (name, slug, category, price, unit, specs, images, visible, description) values
(
  'Máy khoan cầm tay Toyoko TK-13RE',
  'may-khoan-cam-tay-toyoko-tk-13re',
  'Máy khoan',
  850000,
  'cái',
  '{"Công suất": "650W", "Tốc độ không tải": "0-2800 rpm", "Đường kính mũi khoan tối đa": "13mm", "Điện áp": "220V / 50Hz", "Khối lượng": "1.8 kg", "Bảo hành": "12 tháng"}',
  ARRAY['/images/products/tk-13re-1.jpg'],
  true,
  'Máy khoan cầm tay Toyoko TK-13RE với công suất 650W, phù hợp khoan gỗ, kim loại và bê tông nhẹ. Thiết kế chắc chắn, tay cầm ergonomic.'
),
(
  'Máy mài góc Toyoko TK-180',
  'may-mai-goc-toyoko-tk-180',
  'Máy mài',
  720000,
  'cái',
  '{"Công suất": "2000W", "Tốc độ không tải": "8500 rpm", "Đường kính đĩa": "180mm", "Điện áp": "220V / 50Hz", "Khối lượng": "2.6 kg", "Bảo hành": "12 tháng"}',
  ARRAY['/images/products/tk-180-1.jpg'],
  true,
  'Máy mài góc Toyoko TK-180 công suất cao 2000W, phù hợp mài cắt kim loại, đá. Hệ thống làm mát hiệu quả, tản nhiệt tốt.'
),
(
  'Máy cưa kiếm Toyoko TK-JS65',
  'may-cua-kiem-toyoko-tk-js65',
  'Máy cưa',
  980000,
  'cái',
  '{"Công suất": "900W", "Hành trình": "0-2800 lần/phút", "Độ sâu cắt gỗ": "65mm", "Độ sâu cắt thép": "10mm", "Điện áp": "220V / 50Hz", "Khối lượng": "2.9 kg", "Bảo hành": "12 tháng"}',
  ARRAY['/images/products/tk-js65-1.jpg'],
  true,
  'Máy cưa kiếm Toyoko TK-JS65 đa năng, cắt được gỗ dày 65mm và thép 10mm. Điều chỉnh hành trình linh hoạt, phù hợp nhiều vật liệu.'
);

-- Sample posts
insert into posts (slug, title, date, content, excerpt, visible) values
(
  'tuyen-dung-ky-thuat-vien-2024',
  'Tuyển dụng Kỹ thuật viên sửa chữa máy cầm tay',
  '2024-03-01',
  E'## Mô tả công việc\n\n- Kiểm tra, sửa chữa, bảo dưỡng các loại máy cầm tay điện (máy khoan, máy mài, máy cưa...)\n- Tư vấn kỹ thuật cho khách hàng\n- Lập báo cáo kỹ thuật\n\n## Yêu cầu\n\n- Tốt nghiệp Trung cấp / Cao đẳng / Đại học chuyên ngành Điện – Điện tử, Cơ khí\n- Có kinh nghiệm sửa chữa máy cầm tay điện là lợi thế\n- Chịu khó học hỏi, cẩn thận, trung thực\n\n## Quyền lợi\n\n- Lương cạnh tranh: 8.000.000 – 12.000.000 VNĐ/tháng\n- Đóng BHXH, BHYT đầy đủ\n- Được đào tạo kỹ thuật bởi nhà sản xuất\n- Môi trường làm việc chuyên nghiệp\n\n## Liên hệ\n\nGửi CV về email hoặc liên hệ trực tiếp tại văn phòng Quang Phú.',
  'Công ty Quang Phú tuyển dụng Kỹ thuật viên sửa chữa máy cầm tay điện thương hiệu Toyoko. Lương 8–12 triệu/tháng.',
  true
),
(
  'tuyen-dung-nhan-vien-kinh-doanh-2024',
  'Tuyển dụng Nhân viên Kinh doanh – Phân phối máy công cụ',
  '2024-02-15',
  E'## Mô tả công việc\n\n- Phát triển, chăm sóc hệ thống đại lý và khách hàng doanh nghiệp\n- Giới thiệu sản phẩm máy cầm tay Toyoko đến khách hàng\n- Đạt chỉ tiêu doanh số hàng tháng\n\n## Yêu cầu\n\n- Kinh nghiệm bán hàng B2B, ưu tiên ngành máy móc thiết bị\n- Có xe máy, bằng lái xe\n- Năng động, chịu được áp lực doanh số\n\n## Quyền lợi\n\n- Lương cơ bản + hoa hồng hấp dẫn\n- Phụ cấp xăng xe\n- Thưởng theo quý, năm\n\n## Liên hệ\n\nGửi CV về email hoặc liên hệ trực tiếp tại văn phòng Quang Phú.',
  'Tuyển Nhân viên Kinh doanh phân phối máy công cụ Toyoko. Lương cơ bản + hoa hồng, phụ cấp đầy đủ.',
  true
);
