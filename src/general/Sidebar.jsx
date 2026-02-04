import styles from "../styles/sidebar.module.scss";
import { useState, useEffect, useMemo } from "react";
import { useUser } from "../general/UserContext";
import { useNavigate } from "react-router-dom";
import showMessage from "../general/Message";
import api from "./Request";
import Placeholder from "../general/Placeholder";

const Sidebar = () => {
    const navigate = useNavigate();
    const { user, setUser, setUserProficiencies, userProficiencies } = useUser();
    const [showAside, setShowAside] = useState(false);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState("explore");

    useEffect(() => {
        if (!user?.student_id) return;
        const { request, abort } = api('get', `/proficiency/user-proficiency?id=${user.student_id}`);

        const fetchProficiencies = async () => {
            if (!user?.student_id) return;
            if (userProficiencies && Object.keys(userProficiencies).length > 0) return setLoading(false);

            try {
                const response = await request;
                setUserProficiencies(response.data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                showMessage(error.response.data.message);
            }
        };

        fetchProficiencies();
        return abort;
    }, [user?.student_id, userProficiencies, setUserProficiencies]);

    useEffect(() => {
        let startX = 0;

        const onTouchStart = (e) => {
            if (window.innerWidth > 800) return;
            startX = e.touches[0].clientX;
        };

        const onTouchEnd = e => {
            if (window.innerWidth > 800) return;
            const endX = e.changedTouches[0].clientX;
            const deltaX = endX - startX;
            setShowAside(deltaX > 100);
        };

        const addTouchListeners = () => {
            window.addEventListener("touchstart", onTouchStart);
            window.addEventListener("touchend", onTouchEnd);
        };

        const removeTouchListeners = () => {
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchend", onTouchEnd);
        };

        const handleResize = () => {
            if (window.innerWidth <= 800) addTouchListeners();
            else removeTouchListeners();
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        const page = () => {
            const path = window.location.pathname;
            setActive(path.split("/")[1]);
        }

        page();

        return () => {
            removeTouchListeners();
            window.removeEventListener("resize", handleResize);
        };
    }, [navigate]);

    const category = useMemo(() => {
        if (!Array.isArray(userProficiencies)) return {};

        return userProficiencies.reduce((acc, proficiency) => {
            if (!acc[proficiency.type]) acc[proficiency.type] = [];
            acc[proficiency.type].push(proficiency);
            return acc;
        }, {});
    }, [userProficiencies]);

    const toggle = (e) => {
        const el = e.currentTarget.nextElementSibling;

        if (!el.classList.contains(styles.collapsed)) {
            el.classList.toggle(styles.collapsed);
            el.addEventListener("transitionend", () => {
                el.style.display = "none";
            }, { once: true });
        } else {
            el.style.display = "block";
            setTimeout(() => {
                el.classList.toggle(styles.collapsed);
            }, 100)
        }
    }

    const logout = async (needMessage = true) => {
        try {
            const { request } = api('post', `/auth/logout`);
            await request;
            setUserProficiencies(null);
            setUser(null);
            if (needMessage) showMessage("Logged out successfully", "success");
            navigate("/", { replace: true });
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error(error);
                showMessage(error.response.data.message);
            }
        }
    }

    return (
        <aside className={`${styles.aside} ${showAside ? styles.show_aside : ""}`}>
            <img src="/logo.png" alt="Logo" />
            <div>
                <button onClick={() => navigate("/explore")} className={active === "explore" ? styles.active : ""}>
                    <i className="fa-regular fa-rocket"></i>
                    Explore
                </button>
                <button onClick={() => navigate("/pending")} className={active === "pending" ? styles.active : ""}>
                    <i className="fa-regular fa-hourglass"></i>
                    Requests
                </button>
                <button onClick={() => navigate("/pairing")} className={active === "pairing" ? styles.active : ""}>
                    <i className="fa-regular fa-users"></i>
                    Pairing1
                </button>
                <button onClick={() => navigate("/tacklebot")} className={active === "tacklebot" ? styles.active : ""}>
                    <i className="fa-regular fa-star-christmas"></i>
                    TackleBot
                </button>
                <div className={styles.category}>
                    <div onClick={(e) => toggle(e)}>
                        <div id={styles.strength}>Ok to Teach</div>
                        <i className="fa-regular fa-edit" tabIndex="0" onClick={() => navigate("/settings#modules_proficiency")}></i>
                    </div>

                    {loading && Array.from({ length: 3 }).map((_, index) => <Placeholder key={`strength_${index}`} width={180} />)}
                    <ul id="strength_content">
                        {category[1] && category[1].length === 0 && <p>No strength modules</p>}
                        {category[1] && category[1].length > 0 && category[1].map(proficiency => (
                            <div key={proficiency._id} className={styles.tree}>
                                <p>⎯⎯</p>
                                <li key={proficiency._id} id={`aside-${proficiency._id}`} title={proficiency.module_id.module}>{proficiency.module_id.module}</li>
                            </div>
                        ))}
                    </ul>
                </div>
                <div className={styles.category}>
                    <div onClick={(e) => toggle(e)}>
                        <div id={styles.weakness}>I need Help with</div>
                        <i className="fa-regular fa-edit" tabIndex="0" onClick={() => navigate("/settings#modules_proficiency")} ></i>
                    </div>

                    {loading && Array.from({ length: 3 }).map((_, index) => <Placeholder key={`strength_${index}`} width={180} />)}
                    <ul id="weakness_content" >
                        {category[2] && category[2].length === 0 && <p>No strength modules</p>}
                        {category[2] && category[2].length > 0 && category[2].map(proficiency => (
                            <div key={proficiency._id} className={styles.tree}>
                                <p>⎯⎯</p>
                                <li key={proficiency._id} id={`aside-${proficiency._id}`} title={proficiency.module_id.module}>{proficiency.module_id.module}</li>
                            </div>
                        ))}
                    </ul>
                </div>
                <button onClick={() => navigate("/settings")} className={active === "settings" ? styles.active : ""}>
                    <i className="fa-regular fa-gear"></i>
                    Settings
                </button>
                <button onClick={logout}>
                    <i className="fa-regular fa-right-from-bracket"></i>
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
