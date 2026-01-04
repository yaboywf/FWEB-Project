import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../general/UserProvider";
import styles from "../styles/login.module.scss";
import api from "../general/Request";

const LoginPage = () => {
    const navigate = useNavigate();
    const { user, setUser } = useUser();

    useEffect(() => {
        if (user?.name) navigate("/explore");
    }, [user, navigate]);

    useEffect(() => {
        api.get(`/auth/verify`)
            .then(response => {
                setUser(response.data.user);
                navigate("/explore");
            })
    }, []);

    const handleLogin = () => {
        const isDev = import.meta.env.DEV;
        window.location.href = `${isDev ? "http://localhost:3000" : "https://fweb-project.onrender.com"}/api/auth/login?return_url=${encodeURIComponent(window.location.origin + "/explore")}`;
    };

    return (
        <div className={styles.login}>
            <div className={styles.bg}></div>
            <div>
                <img src="logo.webp" alt="Logo" />
                <button onClick={handleLogin}>
                    <svg width="15" height="15" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                        <rect x="12" y="1" width="9" height="9" fill="#7FBA00" />
                        <rect x="1" y="12" width="9" height="9" fill="#00A4EF" />
                        <rect x="12" y="12" width="9" height="9" fill="#FFB900" />
                    </svg>
                    Sign in with Microsoft
                </button>
            </div>
        </div>
    );
};

export default LoginPage;