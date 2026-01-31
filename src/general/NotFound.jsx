import styles from '../styles/error.module.scss'
import '../styles/general.scss'
import { useNavigate } from "react-router-dom";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.error_page}>
            <img src="/logo.png" alt="Logo" />
            <div className={styles.blob}>
                <img src="/not_found.png" alt="Owl" className={styles.body} />
            </div>
            <div className={styles.content}>
                <h1>404</h1>
                <h2>Oops! Page Not Found</h2>
                <p>We searched high and low, in every tutor and tutee, but couldn&apos;t find what you&apos;re looking for</p>
                <button onClick={() => navigate(-1)}>Take me Back</button>
            </div>
        </div>
    )
}

export default NotFound