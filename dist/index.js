#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
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
                    case "api_get":
                        return this.handleApiRequest("GET", args);
                    case "api_post":
                        return this.handleApiRequest("POST", args);
                    case "api_put":
                        return this.handleApiRequest("PUT", args);
                    case "api_delete":
                        return this.handleApiRequest("DELETE", args);
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
        }));
        return {
            content: [
                {
                    type: "text",
                    text: `Configured APIs:\n${JSON.stringify(configList, null, 2)}`,
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
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }
}
const server = new ApiCallerServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map