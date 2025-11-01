import Nav from "../general/Nav"
import REQ from "../general/Request"
import styles from '../styles/profile.module.scss'
import { useUser } from "../general/UserProvider"
import axios from "redaxios"
import { useEffect, useState, useMemo } from "react"
import showMessage from "../general/Message"
import Placeholder from "../general/Placeholder"
import { useNavigate, useLocation } from "react-router-dom"

const ProfilePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, setUser, userProficiencies, setUserProficiencies } = useUser();
    const [allProficiencies, setAllProficiencies] = useState([]);
    const [allAchievements, setAllAchievements] = useState([]);
    const [attained, setAttained] = useState([]);
    const [year, setYear] = useState(user.year_of_study || 1);
    const [diploma, setDiploma] = useState(user.diploma || "");
    const [loading, setLoading] = useState(true);
    const difficulty = { 1: "Easy", 2: "Medium", 3: "Hard" };

    useEffect(() => {
        if (location.hash) {
            const el = document.querySelector(location.hash);
            if (el) el.scrollIntoView({ behavior: "smooth" });
        }
    }, [location]);

    useEffect(() => {
        setYear(user.year_of_study);
        setDiploma(user.diploma);
    }, [user.year_of_study, user.diploma]);

    useEffect(() => {
        const getData = async () => {
            try {
                const resp = await axios.get(`${REQ}/api/proficiency/all-modules`, { withCredentials: true });
                setAllProficiencies(resp.data);

                const resp2 = await axios.get(`${REQ}/api/account/all-achievements`, { withCredentials: true })
                setAllAchievements(resp2.data);

                const resp3 = await axios.get(`${REQ}/api/account/attained-achievements`, { withCredentials: true })
                setAttained(resp3.data);

                setLoading(false);
            } catch (err) {
                console.error(err);
                showMessage(err.data.message);
            }
        }

        getData()
    }, []);

    const category = useMemo(() => {
        return userProficiencies.reduce((acc, proficiency) => {
            if (!acc[proficiency.type]) acc[proficiency.type] = [];
            acc[proficiency.type].push(proficiency);
            return acc;
        }, {});
    }, [userProficiencies]);

    const availableModules = useMemo(() => {
        if (!userProficiencies || !allProficiencies) return [];
        const existingIds = new Set(userProficiencies.map(p => p.module_id?._id?.toString()));
        return allProficiencies.filter(m => !existingIds.has(m._id?.toString()));
    }, [userProficiencies, allProficiencies]);

    const logout = async (needMessage = true) => {
        await axios.post(`${REQ}/api/auth/logout`, {}, { withCredentials: true });
        setUserProficiencies(null);
        setUser(null);
        if (needMessage) showMessage("Logged out successfully", "success");
        navigate("/");
    }

    const addProficiency = async (e, type) => {
        e.preventDefault();
        if (e.target.value === "") return
        try {
            const resp = await axios.post(`${REQ}/api/proficiency/add`, { id: e.target.value, type }, { withCredentials: true });
            showMessage("Proficiency added successfully", "success");
            setUserProficiencies(prev => [...prev, resp.data.proficiency]);
            e.target.value = "";
        } catch (err) {
            console.error(err);
            showMessage(err.data.message);
        }
    }

    const deleteProficiency = async (id) => {
        try {
            await axios.delete(`${REQ}/api/proficiency/remove?id=${id}`, { withCredentials: true });
            showMessage("Proficiency deleted successfully", "success");
            setUserProficiencies(prev => prev.filter(p => p._id.toString() !== id));
        } catch (err) {
            console.error(err);
            showMessage(err.data.message);
        }
    }

    const updateProfile = async (e) => {
        try {
            e.preventDefault();
            if (!e.target.checkValidity()) return;

            const data = {
                diploma,
                year_of_study: year
            }

            await axios.put(`${REQ}/api/account/update`, data, { withCredentials: true });
            setUser(prev => ({ ...prev, ...data }))
            showMessage("Profile updated successfully. Please login again to see the changes.", "success");
            logout(false);
        } catch (err) {
            console.error(err);
            showMessage(err.data.message);
        }
    }

    return (
        <>
            <Nav active="" />

            <div className={styles.profile_container}>
                <form id="general_form" noValidate onSubmit={updateProfile}>
                    <h2>User Information</h2>
                    <div>
                        {loading ? <>
                        <Placeholder width={150} height={150} /><span></span></> : <>
                        <span className={styles["profile-picture"]} data-empty={!user.image} style={{ background: `url(${user.image ?? ""}) center/contain no-repeat` }}></span>
                        </>}

                        <p>Name:</p>
                        {loading ? <Placeholder width={150} /> : <p>{user.name}</p>}
                        <p>Admission Number:</p>
                        {loading ? <Placeholder width={150} /> : <p>{user.student_id}</p>}

                        <label htmlFor="diploma">Diploma</label>
                        {loading ? <Placeholder width={200} /> : <input type="text" name="diploma" id="diploma" placeholder="Enter Your Diploma" autoComplete="off" value={diploma || ""} onChange={(e) => setDiploma(e.target.value)} required />}

                        <p>Year of Study</p>
                        <div>
                            <input type="radio" name="year" id="y1" required onChange={() => setYear(1)} checked={year === 1} />
                            <label htmlFor="y1">Year 1</label>
                            <input type="radio" name="year" id="y2" required onChange={() => setYear(2)} checked={year === 2} />
                            <label htmlFor="y2">Year 2</label>
                            <input type="radio" name="year" id="y3" required onChange={() => setYear(3)} checked={year === 3} />
                            <label htmlFor="y3">Year 3</label>
                        </div>
                    </div>
                    <button type="submit">Save</button>
                    <button type="button" onClick={logout}>Logout</button>
                </form>

                <div>
                    <h2>Achievements</h2>
                    <div className={styles.achievements_container}>
                        {loading && Array.from({ length: 5 }).map((_, i) => <Placeholder key={`achievement_${i}`} width={170} height={200} />)}
                        {!loading && allAchievements.map(achievement => {
                            const a = attained.find(a => a.achievement_id === achievement._id);
                            
                            return (
                                <div key={achievement._id} className={styles.achievement}>
                                    <div className={styles.inner}>
                                        <div className={styles.front}>
                                            <img src={achievement.image} alt={achievement.name} className={!a ? styles["not-attained"] : ""} />
                                            <span>
                                                {achievement.name}
                                                <br />
                                                <span className={styles[difficulty[achievement.difficulty].toLowerCase()]}>{difficulty[achievement.difficulty]}</span>
                                                {a && <br />}
                                                {a && <span>Attained on {new Date(a.achieved_date).toLocaleString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}</span>}
                                            </span>
                                        </div>
                                        <div className={styles.back}>
                                            <p>{achievement.description}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div>
                    <h2 id="modules_proficiency">Modules Proficiency</h2>
                    <h3>Mentor Others</h3>
                    <div className={styles.profile_proficiency}>
                        {loading && Array.from({ length: 3 }).map((_, i) => <Placeholder key={`proficiency_s${i}`} width={200} />)}
                        {category[1] && category[1].length !== 0 && category[1].map(proficiency => (
                            <span key={proficiency._id} onClick={() => deleteProficiency(proficiency._id)}>{proficiency.module_id.module}</span>
                        ))}
                        <select id="new_strength" defaultValue="" onChange={(e) => addProficiency(e, 1)}>
                            <option value="" disabled hidden>Select Module</option>
                            {availableModules.map(module => (
                                <option key={module._id} value={module._id}>{module.module}</option>
                            ))}
                        </select>
                    </div>

                    <h3>Knowledge Wishlist</h3>
                    <div className={styles.profile_proficiency}>
                        {loading && Array.from({ length: 3 }).map((_, i) => <Placeholder key={`proficiency_w${i}`} width={200} />)}
                        {category[2] && category[2].length !== 0 && category[2].map(proficiency => (
                            <span key={proficiency._id} onClick={() => deleteProficiency(proficiency._id)}>{proficiency.module_id.module}</span>
                        ))}
                        <select value={""} id="new_weakness" onChange={(e) => addProficiency(e, 2)}>
                            <option value="" disabled hidden>Select Module</option>
                            {availableModules.map(module => (
                                <option key={module._id} value={module._id}>{module.module}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProfilePage