import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../general/UserProvider";
import styles from "../styles/login.module.scss";

const LoginPage = () => {
    const navigate = useNavigate();
    const { user, setUser } = useUser();

    useEffect(() => {
        if (user?.name) navigate("/explore");
    }, [user, navigate]);

    useEffect(() => {
        const listener = (event) => {
            if (event.origin !== "http://localhost:3000") return;
            const data = event.data;

            if (data.success) {
                const { token, user } = data;
                const sevenDays = 7 * 24 * 60 * 60 * 1000;
                const expires = new Date(Date.now() + sevenDays).toUTCString();
                document.cookie = `token=${token}; path=/; expires=${expires}; SameSite=None; Secure`;

                setUser(user);
                navigate("/explore");
            } else if (data.reason === "unregistered") {
                navigate(`/register?id=${encodeURIComponent(data.student_id)}&email=${encodeURIComponent(data.email)}`);
            }
        };

        window.addEventListener("message", listener);
        return () => window.removeEventListener("message", listener);
    }, [navigate, setUser]);

    const handleLogin = useCallback(() => {
        window.open("http://localhost:3000/api/auth/login", "mslogin", "width=500,height=600");
    }, []);

    return (
        <div className={styles.login}>
            <div className={styles.bg}></div>
            <div>
                <img src="logo.webp" alt="Logo" />
                <button onClick={handleLogin}>
                    <i className="fa-brands fa-microsoft"></i>
                    Sign in with Microsoft
                </button>
            </div>
        </div>
    );
};

export default LoginPage;