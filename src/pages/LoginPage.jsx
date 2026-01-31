import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../general/UserContext";
import styles from "../styles/login.module.scss";
import api from "../general/Request";

const LoginPage = () => {
    const navigate = useNavigate();
    const { user, setUser } = useUser();
    const didVerify = useRef(false);

    useEffect(() => {
        if (user && Object.keys(user).length > 0) navigate("/explore");
    }, [user, navigate]);

    useEffect(() => {
        if (didVerify.current) return;
        didVerify.current = true;

        const { request, abort } = api('get', `/auth/verify`);

        const verify = async () => {
            try {
                const response = await request;
                setUser(response.data);
                navigate("/explore");
            } catch (error) {
                if (error.name !== "AbortError") console.error(error);
            }
        }

        verify();
        return () => abort();
    }, []);

    const handleLogin = () => {
        const isDev = import.meta.env.DEV;
        window.location.href = `${isDev ? "http://localhost:3000" : "https://fweb-project.onrender.com"}/api/auth/login?return_url=${encodeURIComponent(window.location.origin + "/explore")}`;
    };

    return (
        <div className={styles.login}>
            <div className={styles.bg}></div>
            <div className={styles.content}>
                <img src="logo.png" alt="Logo" />
                <button onClick={handleLogin}>
                    <svg width="15" height="15" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                        <rect x="12" y="1" width="9" height="9" fill="#7FBA00" />
                        <rect x="1" y="12" width="9" height="9" fill="#00A4EF" />
                        <rect x="12" y="12" width="9" height="9" fill="#FFB900" />
                    </svg>
                    Sign in with Microsoft
                </button>

                <div className={styles.instruction}>
                    <i className="fa-regular fa-info-circle"></i>
                    Please sign in with your TP email to continue
                </div>
                <div className={styles.tip}>
                    <i className="fa-regular fa-lightbulb"></i>
                    Unregistered users will automatically be registered
                </div>
            </div>
        </div>
    );
};

export default LoginPage;