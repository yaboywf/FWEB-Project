import axios from "redaxios";

const isDev = import.meta.env.DEV;
const api = axios.create({
    baseURL: isDev ? "http://localhost:3000/api" : "https://fweb-project.onrender.com/api",
    withCredentials: true
});

export default api;