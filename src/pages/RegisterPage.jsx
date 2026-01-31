import styles from "../styles/register.module.scss";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import showMessage from "../general/Message";
import api from "../general/Request";

const Register = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                student_id: searchParams.get("student_id"),
                name: searchParams.get("name"),
            };

            const { request } = api("post", "/auth/register", payload);
            const resp = await request;

            showMessage(resp.data.message, "success");
            navigate("/");
        } catch (err) {
            console.error(err);
            if (err?.data?.message?.includes("E11000")) {
                return showMessage("A user with this admission number already registered");
            }
            showMessage(err?.data?.message || "Registration failed");
        }
    };

    return (
        <div className={styles.register}>
            <div className={styles.bg}></div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <img src="/logo.png" alt="Logo" />

                <label htmlFor="diploma">Diploma:</label>
                <input
                    id="diploma"
                    placeholder="Enter Your Diploma"
                    autoComplete="off"
                    {...register("diploma", { required: true })}
                />
                {errors.diploma && <p className={styles.error}>Diploma is required</p>}

                <p>Year of Study:</p>
                <div>
                    <input
                        type="radio"
                        id="y1"
                        value="1"
                        {...register("year_of_study", { required: true })}
                    />
                    <label htmlFor="y1">Year 1</label>

                    <input
                        type="radio"
                        id="y2"
                        value="2"
                        {...register("year_of_study", { required: true })}
                    />
                    <label htmlFor="y2">Year 2</label>

                    <input
                        type="radio"
                        id="y3"
                        value="3"
                        {...register("year_of_study", { required: true })}
                    />
                    <label htmlFor="y3">Year 3</label>
                </div>
                {errors.year_of_study && (
                    <p className={styles.error}>Please select your year of study</p>
                )}

                <button type="submit">Create</button>
            </form>
        </div>
    );
};

export default Register;
