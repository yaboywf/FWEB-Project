import styles from '../styles/nav.module.css'

const Nav = ({ active = "explore" }) => {
    return (
        <nav className={styles.nav}>
            <a href="/explore" title="Explore Page" className={active === "explore" ? styles.active : ""}>Explore</a>
            <a href="/pending" title="Pending Page" className={active === "pending" ? styles.active : ""}>Pending</a>
            <a href="/pairing" title="Pairing Page" className={active === "pairing" ? styles.active : ""}>Pairing</a>
        </nav>
    )
}

export default Nav;