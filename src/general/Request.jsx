import axios from "redaxios";

const api = axios.create({
    baseURL: "https://fweb-project.onrender.com/api",
    withCredentials: true
});

export default api;