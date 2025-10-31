import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../general/UserProvider";
import styles from "../styles/login.module.scss";
import axios from "redaxios";
import REQ from "../general/Request";

const LoginPage = () => {
    const navigate = useNavigate();
    const { user, setUser } = useUser();

    useEffect(() => {
        if (user?.name) navigate("/explore");
    }, [user, navigate]);

    useEffect(() => {
        axios.get(`${REQ}/api/auth/verify`, { withCredentials: true })
            .then(response => {
                setUser(response.data.user);
                navigate("/explore");
            })
    }, []);

    const handleLogin = useCallback(() => {
        window.location.href = `https://fweb-project.onrender.com/api/auth/login?return_url=${encodeURIComponent(window.location.origin + "/explore")}`;
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