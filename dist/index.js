#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";
class ApiCallerServer {
    server;
    configPath;
    configs = {};
    constructor() {
        this.server = new Server({
            name: "api-caller",
            version: "0.1.0",
            capabilities: {
                tools: {},
            },
        });
        this.configPath = path.join(process.cwd(), "api-configs.json");
        this.loadConfigs();
        this.setupHandlers();
    }
    loadConfigs() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, "utf-8");
                this.configs = JSON.parse(configData);
            }
        }
        catch (error) {
            console.error("Error loading configs:", error);
        }
    }
    saveConfigs() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.configs, null, 2));
        }
        catch (error) {
            throw new McpError(ErrorCode.InternalError, "Failed to save config");
        }
    }
    buildHeaders(config, additionalHeaders) {
        let headers = { ...config.headers };
        // Add authentication headers
        if (config.authentication) {
            switch (config.authentication.type) {
                case "bearer":
                    if (config.authentication.token) {
                        headers["Authorization"] = `Bearer ${config.authentication.token}`;
                    }
                    break;
                case "api_key":
                    if (config.authentication.apiKey && config.authentication.headerName) {
                        headers[config.authentication.headerName] = config.authentication.apiKey;
                    }
                    break;
                case "basic":
                    if (config.authentication.username && config.authentication.password) {
                        const credentials = Buffer.from(`${config.authentication.username}:${config.authentication.password}`).toString("base64");
                        headers["Authorization"] = `Basic ${credentials}`;
                    }
                    break;
            }
        }
        // Merge additional headers
        if (additionalHeaders) {
            headers = { ...headers, ...additionalHeaders };
        }
        return headers;
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: "set_api_config",
                    description: "Set configuration for an API endpoint",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Name for this API configuration",
                            },
                            baseUrl: {
                                type: "string",
                                description: "Base URL for the API",
                            },
                            headers: {
                                type: "object",
                                description: "Default headers to include with requests",
                            },
                            authentication: {
                                type: "object",
                                properties: {
                                    type: {
                                        type: "string",
                                        enum: ["bearer", "api_key", "basic"],
                                        description: "Authentication type",
                                    },
                                    token: {
                                        type: "string",
                                        description: "Bearer token (for bearer auth)",
                                    }, apiKey: {
                                        type: "string",
                                        description: "API key (for api_key auth)",
                                    },
                                    headerName: {
                                        type: "string",
                                        description: "Header name for API key (for api_key auth)",
                                    },
                                    username: {
                                        type: "string",
                                        description: "Username (for basic auth)",
                                    },
                                    password: {
                                        type: "string",
                                        description: "Password (for basic auth)",
                                    },
                                },
                            },
                        },
                        required: ["name", "baseUrl"],
                    },
                },
                {
                    name: "list_api_configs",
                    description: "List all configured APIs",
                    inputSchema: {
                        type: "object",
                        properties: {},
                    },
                },
                {
                    name: "delete_api_config",
                    description: "Delete an API configuration",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Name of the API configuration to delete",
                            },
                        },
                        required: ["name"],
                    },
                },
                {
                    name: "api_get",
                    description: "Make a GET request to a configured API",
                    inputSchema: {
                        type: "object",
                        properties: {
                            configName: {
                                type: "string",
                                description: "Name of the API configuration to use",
                            }, endpoint: {
                                type: "string",
                                description: "API endpoint (will be appended to baseUrl)",
                            },
                            queryParams: {
                                type: "object",
                                description: "Query parameters",
                            },
                            headers: {
                                type: "object",
                                description: "Additional headers for this request",
                            },
                        },
                        required: ["configName", "endpoint"],
                    },
                },
                {
                    name: "api_post",
                    description: "Make a POST request to a configured API",
                    inputSchema: {
                        type: "object",
                        properties: {
                            configName: {
                                type: "string",
                                description: "Name of the API configuration to use",
                            },
                            endpoint: {
                                type: "string",
                                description: "API endpoint (will be appended to baseUrl)",
                            },
                            body: {
                                type: "object",
                                description: "Request body",
                            },
                            headers: {
                                type: "object",
                                description: "Additional headers for this request",
                            },
                        },
                        required: ["configName", "endpoint", "body"],
                    },
                }, {
                    name: "api_put",
                    description: "Make a PUT request to a configured API",
                    inputSchema: {
                        type: "object",
                        properties: {
                            configName: {
                                type: "string",
                                description: "Name of the API configuration to use",
                            },
                            endpoint: {
                                type: "string",
                                description: "API endpoint (will be appended to baseUrl)",
                            },
                            body: {
                                type: "object",
                                description: "Request body",
                            },
                            headers: {
                                type: "object",
                                description: "Additional headers for this request",
                            },
                        },
                        required: ["configName", "endpoint", "body"],
                    },
                },
                {
                    name: "api_delete",
                    description: "Make a DELETE request to a configured API",
                    inputSchema: {
                        type: "object",
                        properties: {
                            configName: {
                                type: "string",
                                description: "Name of the API configuration to use",
                            },
                            endpoint: {
                                type: "string",
                                description: "API endpoint (will be appended to baseUrl)",
                            }, headers: {
                                type: "object",
                                description: "Additional headers for this request",
                            },
                        },
                        required: ["configName", "endpoint"],
                    },
                },
                {
                    name: "api_post_form",
                    description: "Make a POST request with form data (supports file uploads)",
                    inputSchema: {
                        type: "object",
                        properties: {
                            configName: {
                                type: "string",
                                description: "Name of the API configuration to use",
                            },
                            endpoint: {
                                type: "string",
                                description: "API endpoint (will be appended to baseUrl)",
                            },
                            fields: {
                                type: "array",
                                description: "Form fields (text or file)",
                                items: {
                                    type: "object",
                                    properties: {
                                        name: {
                                            type: "string",
                                            description: "Field name",
                                        },
                                        type: {
                                            type: "string",
                                            enum: ["text", "file"],
                                            description: "Field type",
                                        },
                                        value: {
                                            type: "string",
                                            description: "Text value (for text fields)",
                                        },
                                        filePath: {
                                            type: "string",
                                            description: "Path to file (for file fields)",
                                        },
                                        fileName: {
                                            type: "string",
                                            description: "Custom filename (optional for file fields)",
                                        },
                                        contentType: {
                                            type: "string",
                                            description: "Content type (optional for file fields)",
                                        },
                                    },
                                    required: ["name", "type"],
                                },
                            },
                            headers: {
                                type: "object",
                                description: "Additional headers for this request",
                            },
                        },
                        required: ["configName", "endpoint", "fields"],
                    },
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case "set_api_config":
                        return this.handleSetConfig(args);
                    case "list_api_configs":
                        return this.handleListConfigs();
                    case "delete_api_config":
                        return this.handleDeleteConfig(args);
                    case "api_get":
                        return this.handleApiRequest("GET", args);
                    case "api_post":
                        return this.handleApiRequest("POST", args);
                    case "api_put":
                        return this.handleApiRequest("PUT", args);
                    case "api_delete":
                        return this.handleApiRequest("DELETE", args);
                    case "api_post_form":
                        return this.handleApiPostForm(args);
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            }
            catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }
                throw new McpError(ErrorCode.InternalError, `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    async handleSetConfig(args) {
        const { name, baseUrl, headers = {}, authentication } = args;
        this.configs[name] = {
            name,
            baseUrl,
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            authentication,
        };
        this.saveConfigs();
        return {
            content: [
                {
                    type: "text",
                    text: `API configuration '${name}' has been set successfully!\nConfig saved to: ${this.configPath}`,
                },
            ],
        };
    }
    async handleListConfigs() {
        const configList = Object.keys(this.configs).map((key) => ({
            name: key,
            baseUrl: this.configs[key].baseUrl,
            hasAuth: !!this.configs[key].authentication,
            authType: this.configs[key].authentication?.type || null,
            configFilePath: this.configPath,
        }));
        return {
            content: [
                {
                    type: "text",
                    text: `Configured APIs:\n${JSON.stringify(configList, null, 2)}\n\nConfig file location: ${this.configPath}`,
                },
            ],
        };
    }
    async handleDeleteConfig(args) {
        const { name } = args;
        if (!this.configs[name]) {
            throw new McpError(ErrorCode.InvalidParams, `API configuration '${name}' not found`);
        }
        delete this.configs[name];
        this.saveConfigs();
        return {
            content: [
                {
                    type: "text",
                    text: `API configuration '${name}' has been deleted.`,
                },
            ],
        };
    }
    async handleApiRequest(method, args) {
        const { configName, endpoint, body, queryParams, headers: additionalHeaders } = args;
        // Get config
        const config = this.configs[configName];
        if (!config) {
            throw new McpError(ErrorCode.InvalidParams, `API configuration '${configName}' not found`);
        }
        // Build URL
        let url = `${config.baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
        if (queryParams) {
            const params = new URLSearchParams(queryParams);
            url += `?${params.toString()}`;
        }
        // Build headers
        const headers = this.buildHeaders(config, additionalHeaders);
        // Build request options
        const requestOptions = {
            method,
            headers,
        };
        if (body && (method === "POST" || method === "PUT")) {
            requestOptions.body = JSON.stringify(body);
        }
        try {
            const response = await fetch(url, requestOptions);
            const responseText = await response.text();
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            }
            catch {
                responseData = responseText;
            }
            const result = {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                data: responseData,
            };
            return {
                content: [
                    {
                        type: "text",
                        text: `${method} ${url}\nStatus: ${response.status} ${response.statusText}\n\nResponse:\n${JSON.stringify(result.data, null, 2)}`,
                    },
                ],
            };
        }
        catch (error) {
            throw new McpError(ErrorCode.InternalError, `API request failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async handleApiPostForm(args) {
        const { configName, endpoint, fields, headers: additionalHeaders } = args;
        // Get config
        const config = this.configs[configName];
        if (!config) {
            throw new McpError(ErrorCode.InvalidParams, `API configuration '${configName}' not found`);
        }
        // Build URL
        let url = `${config.baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
        // Build headers (remove Content-Type for form data)
        const headers = this.buildHeaders(config, additionalHeaders);
        delete headers["Content-Type"]; // Let FormData set the correct content type
        // Create FormData
        const formData = new FormData();
        for (const field of fields) {
            if (field.type === "text") {
                if (field.value !== undefined) {
                    formData.append(field.name, field.value);
                }
            }
            else if (field.type === "file") {
                if (field.filePath) {
                    try {
                        const fileStream = fs.createReadStream(field.filePath);
                        const options = {};
                        if (field.fileName) {
                            options.filename = field.fileName;
                        }
                        if (field.contentType) {
                            options.contentType = field.contentType;
                        }
                        formData.append(field.name, fileStream, options);
                    }
                    catch (error) {
                        throw new McpError(ErrorCode.InvalidParams, `Failed to read file at path '${field.filePath}': ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
            }
        }
        // Build request options
        const requestOptions = {
            method: "POST",
            headers: {
                ...headers,
                ...formData.getHeaders(),
            },
            body: formData,
        };
        try {
            const response = await fetch(url, requestOptions);
            const responseText = await response.text();
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            }
            catch {
                responseData = responseText;
            }
            const result = {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                data: responseData,
            };
            return {
                content: [
                    {
                        type: "text",
                        text: `POST ${url} (Form Data)\nStatus: ${response.status} ${response.statusText}\n\nResponse:\n${JSON.stringify(result.data, null, 2)}`,
                    },
                ],
            };
        }
        catch (error) {
            throw new McpError(ErrorCode.InternalError, `API form request failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("API Caller MCP server running on stdio");
    }
}
const server = new ApiCallerServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map