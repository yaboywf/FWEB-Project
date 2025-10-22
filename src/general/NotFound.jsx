import styles from '../styles/error.module.css'
import '../styles/general.css'
import { useNavigate } from "react-router-dom";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.error_page}>
            <img src="logo.webp" alt="Logo" />
            <h1>Oops! Page not found.</h1>
            <p>We searched high and low but couldn&apos;t find what you&apos;re looking for</p>
            <p onClick={() => navigate(-1)}>Return to home</p>
        </div>
    )   
}

export default NotFound