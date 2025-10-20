import styles from "../styles/aside.module.css";
import { useState, useEffect, useMemo } from "react";
import { useUser } from "../general/UserProvider";
import { useNavigate } from "react-router-dom";
import showMessage from "../general/Message";
import REQ from "./Request";
import axios from "redaxios";

const Sidebar = () => {
    const navigate = useNavigate();
    const { user, userImage, setUserProficiencies, userProficiencies } = useUser();
    const [showAside, setShowAside] = useState(false);

    useEffect(() => {
        const fetchProficiencies = async () => {
            try {
                const response = await axios.get(`${REQ}/api/proficiency/user-proficiency?id=${user.student_id}`, { withCredentials: true });
                setUserProficiencies(response.data);
            } catch (error) {
                console.error(error);
                showMessage(error.response.data.message);
            }
        };

        if (user.student_id) fetchProficiencies();
    }, [user]);

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

        return () => {
            removeTouchListeners();
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const category = useMemo(() => {
        return userProficiencies.reduce((acc, proficiency) => {
            if (!acc[proficiency.type]) acc[proficiency.type] = [];
            acc[proficiency.type].push(proficiency);
            return acc;
        }, {});
    }, [userProficiencies]);

    return (
        <aside className={`${styles.aside} ${showAside ? styles.show_aside : ""}`}>
            <img src="logo.webp" alt="Logo" />
            <div>
                <div className={styles.category}>
                    <div>
                        <div id="strength">Mentor Others</div>
                        <i className="fa-solid fa-edit" tabIndex="0" onClick={() => navigate("/profile#modules_proficiency")}></i>
                    </div>
                    <ul id="strength_content">
                        {category[1] && category[1].length === 0 && <p>No strength modules</p>}
                        {category[1] && category[1].length > 0 && category[1].map(proficiency => (
                            <li key={proficiency._id} id={`aside-${proficiency._id}`} title={proficiency.module_id.module}>{proficiency.module_id.module}</li>
                        ))}
                    </ul>
                </div>
                <div className={styles.category}>
                    <div>
                        <div id="weakness">Knowledge Wishlist</div>
                        <i className="fa-solid fa-edit" tabIndex="0" onClick={() => navigate("/profile#modules_proficiency")} ></i>
                    </div>
                    <ul id="weakness_content">
                        {category[2] && category[2].length === 0 && <p>No strength modules</p>}
                        {category[2] && category[2].length > 0 && category[2].map(proficiency => (
                            <li key={proficiency._id} id={`aside-${proficiency._id}`} title={proficiency.module_id.module}>{proficiency.module_id.module}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <a href="/profile" style={{ '--before-background': `url("${userImage}")` }} className={styles.user}>{user.name}</a>
        </aside>
    );
}

export default Sidebar;