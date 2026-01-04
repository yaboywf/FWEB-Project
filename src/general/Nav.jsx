import styles from '../styles/nav.module.scss'
import { useNavigate } from 'react-router-dom';
import PropTypes from "prop-types";

const Nav = ({ active = "explore" }) => {
    const navigate = useNavigate();

    return (
        <nav className={styles.nav}>
            <a onClick={() => navigate("/explore")} title="Explore Page" className={active === "explore" ? styles.active : ""}>Explore</a>
            <a onClick={() => navigate("/pending")} title="Pending Page" className={active === "pending" ? styles.active : ""}>Pending</a>
            <a onClick={() => navigate("/pairing")} title="Pairing Page" className={active === "pairing" ? styles.active : ""}>Pairing</a>
        </nav>
    )
}

Nav.propTypes = {
    active: PropTypes.bool,
};

export default Nav;