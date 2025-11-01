import styles from "../styles/register.module.scss";
import { useNavigate, useSearchParams } from "react-router-dom";
import showMessage from "../general/Message";
import api from "../general/Request";

const Register = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!e.target.checkValidity()) return showMessage("One or more fields are invalid");

        try {
            const form = new FormData(e.target);
            const formObject = Object.fromEntries(form);
            formObject.student_id = searchParams.get("id");
            formObject.name = searchParams.get("name");

            const resp = await api.post(`/auth/register`, formObject);
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

                <label htmlFor="diploma">Diploma:</label>
                <div>
                    <i className="fa-solid fa-graduation-cap"></i>
                    <input type="text" name="diploma" id="diploma" placeholder="Enter Your Diploma" autoComplete="off" required />
                </div>

                <p>Year of Study:</p>
                <div>
                    <input type="radio" name="year_of_study" id="y1" value="1" required />
                    <label htmlFor="y1">Year 1</label>
                    <input type="radio" name="year_of_study" id="y2" value="2" required />
                    <label htmlFor="y2">Year 2</label>
                    <input type="radio" name="year_of_study" id="y3" value="3" required />
                    <label htmlFor="y3">Year 3</label>
                </div>

                <button type="submit">Create</button>
            </form>
        </div>
    )
}

export default Register;