import axios from "redaxios";

const isDev = import.meta.env.DEV;
const api = axios.create({
    baseURL: isDev ? "http://localhost:3000/api" : "https://fweb-project.onrender.com/api",
    withCredentials: true
});

function request(method, url, dataOrConfig, maybeConfig) {
    const controller = new AbortController();

    let config;

    if (["get", "delete"].includes(method)) {
        config = {
            ...(dataOrConfig || {}),
            signal: controller.signal,
        };
    } else {
        config = {
            ...(maybeConfig || {}),
            signal: controller.signal,
        };
    }

    const request =
        method === "get" || method === "delete"
            ? api[method](url, config)
            : api[method](url, dataOrConfig, config);

    return {
        request,
        abort: () => controller.abort(),
    };
}

export default request;