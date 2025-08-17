# MCP API Caller

A Model Context Protocol (MCP) server for making API calls with authentication support.

## Features

- Configure multiple API endpoints with authentication
- Support for Bearer token, API key, and Basic authentication
- HTTP methods: GET, POST, PUT, DELETE
- **NEW**: Form data POST requests with file upload support

## Tools

### 1. `set_api_config`
Configure an API endpoint with authentication.

**Parameters:**
- `name`: Configuration name
- `baseUrl`: Base URL for the API
- `headers`: Default headers (optional)
- `authentication`: Authentication configuration (optional)

**Authentication Types:**
- `bearer`: Bearer token authentication
- `api_key`: API key authentication
- `basic`: Basic authentication

### 2. `list_api_configs`
List all configured APIs.

### 3. `delete_api_config`
Delete an API configuration.

**Parameters:**
- `name`: Name of the API configuration to delete

### 4. `api_get`
Make a GET request to a configured API.

**Parameters:**
- `configName`: Name of the API configuration
- `endpoint`: API endpoint
- `queryParams`: Query parameters (optional)
- `headers`: Additional headers (optional)

### 5. `api_post`
Make a POST request with JSON body.

**Parameters:**
- `configName`: Name of the API configuration
- `endpoint`: API endpoint
- `body`: Request body (JSON)
- `headers`: Additional headers (optional)

### 6. `api_put`
Make a PUT request with JSON body.

**Parameters:**
- `configName`: Name of the API configuration
- `endpoint`: API endpoint
- `body`: Request body (JSON)
- `headers`: Additional headers (optional)

### 7. `api_delete`
Make a DELETE request.

**Parameters:**
- `configName`: Name of the API configuration to use
- `endpoint`: API endpoint
- `headers`: Additional headers (optional)

### 8. `api_post_form` ⭐ NEW
Make a POST request with form data (supports file uploads).

**Parameters:**
- `configName`: Name of the API configuration
- `endpoint`: API endpoint
- `fields`: Array of form fields
- `headers`: Additional headers (optional)

**Field Types:**
- `text`: Text field with `value` parameter
- `file`: File field with `filePath`, `fileName` (optional), and `contentType` (optional)

## Usage Examples

### Basic API Configuration
```json
{
  "name": "my_api",
  "baseUrl": "https://api.example.com",
  "headers": {
    "User-Agent": "MCP-API-Caller/1.0"
  },
  "authentication": {
    "type": "bearer",
    "token": "your_token_here"
  }
}
```

### File Upload Example
```json
{
  "configName": "my_api",
  "endpoint": "/upload",
  "fields": [
    {
      "name": "title",
      "type": "text",
      "value": "My Image"
    },
    {
      "name": "image",
      "type": "file",
      "filePath": "/path/to/image.jpg",
      "fileName": "custom_name.jpg",
      "contentType": "image/jpeg"
    }
  ]
}
```

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Start the server: `npm start`

## Development

Run in development mode: `npm run dev`
