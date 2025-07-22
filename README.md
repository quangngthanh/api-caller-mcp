# MCP API Caller

MCP server for making API calls with authentication support.

## Tính năng

- ✅ Hỗ trợ nhiều loại authentication (Bearer Token, API Key, Basic Auth)
- ✅ Các HTTP methods: GET, POST, PUT, DELETE
- ✅ Quản lý nhiều API configurations
- ✅ Query parameters và custom headers
- ✅ Tự động lưu/load configurations

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Build project

```bash
npm run build
```

### 3. Cấu hình Claude Desktop

Thêm vào file `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "api-caller": {
      "command": "node",
      "args": ["D:\\Working\\MCP\\my-mcp\\call-api\\dist\\index.js"],
      "env": {}
    }
  }
}
```

## Sử dụng

### 1. Thiết lập API Config

```
Thiết lập API config tên "github_api" với base URL "https://api.github.com" và bearer token "your_token"
```

### 2. Gọi API

```
Gọi GitHub API để lấy thông tin user octocat
```

### 3. Xem danh sách configs

```
Hiển thị tất cả API configurations
```

## Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Chạy built server
- `npm run dev` - Chạy development mode với tsx

## Bảo mật

- File `api-configs.json` chứa tokens nhạy cảm
- Đã được thêm vào `.gitignore`
- Không commit file này vào repository