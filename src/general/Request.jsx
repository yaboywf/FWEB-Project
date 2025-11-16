import axios from "redaxios";

const api = axios.create({
    baseURL: import.meta.env.PROD === false ? "https://fweb-project.onrender.com/api" : "http://localhost:3000/api",
    withCredentials: true
});

export default api;