import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../general/UserProvider";
import showMessage from "../general/Message";
import styles from "../styles/login.module.css";
import REQ from "../general/Request";
import axios from "redaxios";

const LoginPage = () => {
    const navigate = useNavigate();
    const { user, setUser } = useUser();
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user?.name) navigate("/explore");
    }, [user]);

    const handleSubmit = async (e) => {
        try {
            e.preventDefault();

            const form = new FormData(e.target);
            const formObject = Object.fromEntries(form);

            const response = await axios.post(`${REQ}/api/auth/login`, formObject);
            document.cookie = `token=${response.data.token}; path=/; expires=${new Date(Date.now() + 3 * 60 * 60 * 1000).toUTCString()}; SameSite=None; Secure;`;
            setUser(response.data.user._doc);
            navigate("/explore");
        } catch (err) {
            console.error(err);
            showMessage("Invalid username or password");
        }
    }
    
    return (
        <div className={styles.login}>
            <div className={styles.bg}></div>
            <form id="signInForm" noValidate onSubmit={handleSubmit}>
                <img src="logo.webp" alt="Logo" id="image" />
                    <label htmlFor="signInUsername">Admission Number:</label>
                    <div>
                        <i className="fa-solid fa-user"></i>
                        <input type="text" name="student_id" id="signInUsername" placeholder="Enter Admission Number" autoComplete="username" required />
                    </div>

                    <label htmlFor="signInUsername">Password:</label>
                    <div>
                        <i className="fa-solid fa-lock"></i>
                        <input type={showPassword ? "text" : "password"} name="password" id="signInPassword" placeholder="Password" autoComplete="current-password" required />
                        <i onClick={() => setShowPassword(!showPassword)} className={showPassword ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"} id="eyeIcon"></i>
                    </div>
                    <button type="submit">Login</button>
                    <div>
                        <a href="reset1.html">
                            <i className="fa-solid fa-lock-open"></i>
                            Reset password
                        </a>
                        <a href="register1.html">
                            <i className="fa-solid fa-plus"></i>
                            Create account
                        </a>
                    </div>
            </form>
        </div>
    );
};

export default LoginPage;