import styles from "../styles/register.module.scss";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import showMessage from "../general/Message";
import axios from "redaxios";
import REQ from "../general/Request";

const Register = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!e.target.checkValidity()) return showMessage("One or more fields are invalid");

        try {
            const form = new FormData(e.target);
            const formObject = Object.fromEntries(form);
            if (formObject.password.length < 6) return showMessage("Password must be at least 6 characters long");

            const resp = await axios.post(`${REQ}/api/auth/register`, formObject);
            showMessage(resp.data.message, "success");
            navigate("/");
        } catch (err) {
            console.error(err);
            if (err.data.message.includes("E11000")) return showMessage("A user with this admission number already registered");
            showMessage(err.data.message);
        }
    }

    return (
        <div className={styles.register}>
            <div className={styles.bg}></div>
            <form id="signupForm" noValidate onSubmit={handleSubmit}>
                <img src="/logo.webp" alt="Logo" />

                <label htmlFor="admin_number">Admission Number:</label>
                <div>
                    <i className="fa-solid fa-id-card"></i>
                    <input type="text" id="admin_number" name="student_id" placeholder="Enter Admission Number" autoComplete="off" required />
                </div>

                <label htmlFor="name">Name:</label>
                <div>
                    <i className="fa-solid fa-user"></i>
                    <input type="text" id="name" name="name" placeholder="Enter Your Name" autoComplete="name" required />
                </div>

                <label htmlFor="password">Password:</label>
                <div>
                    <i className="fa-solid fa-lock"></i>
                    <input type={showPassword ? "text" : "password"} id="password" name="password" placeholder="Password" autoComplete="new-password" required />
                    <i className="fa-solid fa-eye-slash" id="eyeIcon" onClick={() => setShowPassword(!showPassword)}></i>
                </div>

                <label htmlFor="diploma">Diploma:</label>
                <div>
                    <i className="fa-solid fa-graduation-cap"></i>
                    <input type="text" name="diploma" id="diploma" placeholder="Enter Your Diploma" autoComplete="off" required />
                </div>

                <p>Year of Study</p>
                <div>
                    <input type="radio" name="year_of_study" id="y1" value="1" required />
                    <label htmlFor="y1">Year 1</label>
                    <input type="radio" name="year_of_study" id="y2" value="2" required />
                    <label htmlFor="y2">Year 2</label>
                    <input type="radio" name="year_of_study" id="y3" value="3" required />
                    <label htmlFor="y3">Year 3</label>
                </div>

                <button type="submit">Create</button>
                <span onClick={() => navigate("/")}>Back to login</span>
            </form>
        </div>
    )
}

export default Register;