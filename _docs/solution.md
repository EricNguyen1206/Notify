# Solution Documentation

## Cập nhật Home Page và Middleware

### Thay đổi đã thực hiện:

#### 1. Đơn giản hóa Home Page (`frontend/src/app/page.tsx`)
- Đã xóa toàn bộ nội dung phức tạp của home page
- Chỉ giữ lại một dummy page đơn giản với thông điệp "Welcome to Notify"
- Loại bỏ các import không cần thiết (Download icon, Image, Link, HomePageFooter, HomePageNavbar)
- Loại bỏ tất cả các section marketing và hero images

#### 2. Cập nhật Middleware (`frontend/src/middleware.ts`)
- Middleware đã được cấu hình để xử lý redirect cho home page một cách logic hơn
- Khi user truy cập vào root path (`/`):
  - **Nếu có token**: redirect tới `/messages` (user đã login)
  - **Nếu không có token**: redirect tới `/login` (user chưa login)
- Logic redirect hoạt động như sau:
  - Nếu user có token và truy cập `/` → redirect tới `/messages`
  - Nếu user không có token và truy cập `/` → redirect tới `/login`
  - Nếu user có token và truy cập auth pages → redirect tới `/messages`
  - Nếu user không có token và truy cập protected routes → redirect tới `/login`

## Implement Chức năng Edit Account

### Thay đổi Backend:

#### 3. Cập nhật Models (`chat-service/internal/models/user.go`)
- Thêm struct `UpdateProfileRequest` với các field:
  - `username`: username mới (optional)
  - `avatar`: avatar mới (optional) 
  - `password`: password mới (optional)
  - `currentPassword`: password hiện tại (required để xác thực)

#### 4. Cập nhật UserService (`chat-service/internal/services/user_service.go`)
- Thêm method `UpdateProfile` để xử lý việc cập nhật profile
- Verify current password trước khi cho phép update
- Hash password mới nếu được cung cấp
- Update các field được thay đổi

#### 5. Cập nhật UserRepository (`chat-service/internal/repositories/postgres/user_repository.go`)
- Cập nhật method `Update` để hỗ trợ avatar field
- Sử dụng raw SQL để update user với avatar

#### 6. Cập nhật UserHandler (`chat-service/internal/api/handlers/user.go`)
- Thêm handler `UpdateProfile` để xử lý PUT request `/users/profile`
- Validate current password là required
- Xử lý các error cases (current password incorrect, validation errors)
- Trả về user profile đã được cập nhật

#### 7. Cập nhật Routes (`chat-service/internal/api/routes/routes.go`)
- Thêm route PUT `/users/profile` với authentication middleware

#### 8. Generate API Documentation
- Chạy `make swagger` để generate Swagger docs
- Chạy `make swagger-sync` để convert sang OpenAPI 3.0.1 và sync với frontend
- Chạy `npm run gen:api` để generate TypeScript API client với orval

### Thay đổi Frontend:

#### 9. Cập nhật useAuthStore (`frontend/src/store/useAuthStore.ts`)
- Thêm method `updateUser` để cập nhật thông tin user trong store

#### 10. Cập nhật UserSettingDialog (`frontend/src/components/organisms/UserSettingDialog.tsx`)
- Import và sử dụng API `usePutUsersProfile` để update profile
- Cập nhật form để có field current password (required)
- Implement logic update thực sự thay vì dummy
- Xử lý success/error cases với toast notifications
- Reset form sau khi update thành công
- Update local state với thông tin user mới
- **Tối giản hóa**: Thu nhỏ dialog từ fullscreen xuống `max-w-md`
- **Loại bỏ**: Tabs, theme toggle, logout button, provider field, user ID field
- **Giữ lại**: Form update profile tối thiểu với username, avatar, new password, current password
- **UI cải thiện**: Sử dụng Label component, spacing tốt hơn, button full-width
- **Upload Avatar**: Sử dụng folder `public` thay vì `user_avatars` theo policy Supabase
- **Auto Close**: Dialog tự động đóng sau khi update profile thành công

#### 11. Cập nhật NavUser (`frontend/src/components/molecules/NavUser.tsx`)
- Wrap item "Account" với `UserSettingDialog` để mở dialog edit profile khi click
- **Fix lỗi dialog đóng ngay lập tức**: Sử dụng controlled state thay vì wrap trực tiếp
- Sử dụng `useState` để control dialog open/close
- Tránh conflict giữa dropdown menu và dialog trigger

### Kết quả:
- Home page giờ đây chỉ hiển thị một dummy page đơn giản
- **Quan trọng**: Home page không bao giờ được hiển thị cho user
- User đã login sẽ tự động được chuyển hướng tới trang messages
- User chưa login sẽ tự động được chuyển hướng tới trang login
- **Chức năng Edit Account hoàn chỉnh**:
  - User có thể edit username, avatar, password
  - Luôn yêu cầu nhập current password để xác thực
  - API backend xử lý update profile với validation
  - Frontend hiển thị form edit profile trong dialog
  - Local state được cập nhật sau khi update thành công
  - Toast notifications cho success/error cases
- Middleware đảm bảo flow navigation mượt mà và logic

### Files đã thay đổi:
- `frontend/src/app/page.tsx` - Đơn giản hóa thành dummy page
- `frontend/src/middleware.ts` - Cải thiện logic redirect cho home page
- `chat-service/internal/models/user.go` - Thêm UpdateProfileRequest
- `chat-service/internal/services/user_service.go` - Thêm UpdateProfile method
- `chat-service/internal/repositories/postgres/user_repository.go` - Cập nhật Update method
- `chat-service/internal/api/handlers/user.go` - Thêm UpdateProfile handler
- `chat-service/internal/api/routes/routes.go` - Thêm PUT /users/profile route
- `frontend/src/store/useAuthStore.ts` - Thêm updateUser method
- `frontend/src/components/organisms/UserSettingDialog.tsx` - Implement logic update profile thực sự
- `frontend/src/components/molecules/NavUser.tsx` - Gắn UserSettingDialog với item Account
