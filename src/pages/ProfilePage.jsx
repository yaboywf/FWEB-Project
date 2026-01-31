import api from "../general/Request"
import styles from '../styles/profile.module.scss'
import { useUser } from "../general/UserContext"
import { useEffect, useState, useMemo, useRef } from "react"
import showMessage from "../general/Message"
import Placeholder from "../general/Placeholder"
import { useLocation } from "react-router-dom"

const ProfilePage = () => {
    const location = useLocation();
    const { user, setUser, userProficiencies, setUserProficiencies } = useUser();
    const [year, setYear] = useState(user.year_of_study || 1);
    const [diploma, setDiploma] = useState(user.diploma || "");
    const ratingArray = user.rating?.length ? user.rating.reduce((a, b) => a + b, 0) / user.rating.length : 0;
    const rounded = Math.round((ratingArray || 0) * 2) / 2;
    const full = Math.floor(rounded);
    const half = rounded % 1 !== 0;
    const empty = 5 - full - (half ? 1 : 0);

    const [allProficiencies, setAllProficiencies] = useState([]);
    const [allModuleStats, setAllModuleStats] = useState([]);
    const [moduleSearch, setModuleSearch] = useState("");
    const [draggedModule, setDraggedModule] = useState(null);
    const [dragOverZone, setDragOverZone] = useState([]);
    const modulesRef = useRef(null);
    const colors = { IT: '#82b1eb', ASC: '#a4d094', BUS: '#d0b661', HSS: '#e99643', ENG: '#b860e3' };

    const [allAchievements, setAllAchievements] = useState([]);
    const [attained, setAttained] = useState([]);
    const [selectedAchievement, setSelectedAchievement] = useState({});
    const difficulty = { 1: "Easy", 2: "Medium", 3: "Hard" };
    const a = attained.find(a => a.achievement_id === selectedAchievement._id);

    const [selectedSection, setSelectedSection] = useState("section-0");
    const sectionIds = ["section-0", "section-1", "section-2", "section-3"];

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (location.hash) {
            const el = document.querySelector(location.hash);
            if (el) el.scrollIntoView({ behavior: "smooth" });
        }
    }, [location]);

    useEffect(() => {
        const setData = async () => {
            setYear(user.year_of_study);
            setDiploma(user.diploma);
        }

        setData();
    }, [user.year_of_study, user.diploma]);

    useEffect(() => {
        const controllers = [];

        const getData = async () => {
            try {
                const r1 = api("get", "/proficiency/all-modules");
                controllers.push(r1);
                const resp = await r1.request;
                setAllProficiencies(resp.data);

                const r2 = api("get", "/account/all-achievements");
                controllers.push(r2);
                const resp2 = await r2.request;
                setAllAchievements(resp2.data);

                const r3 = api("get", "/account/attained-achievements");
                controllers.push(r3);
                const resp3 = await r3.request;
                setAttained(resp3.data);

                const r4 = api("get", "/pair/stats");
                controllers.push(r4);
                const resp4 = await r4.request;
                setAllModuleStats(resp4.data);

                setLoading(false);
            } catch (err) {
                if (err.name === "AbortError") return;
                console.error(err);
                showMessage(err?.data?.message || "Something went wrong");
            }
        };

        getData();
        return () => controllers.forEach(c => c.abort());
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setSelectedSection(entry.target.id);
                    }
                });
            },
            {
                root: null,
                rootMargin: "-40% 0px -50% 0px",
                threshold: 0
            }
        );

        sectionIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleGlobalDragOver = () => {
            setDragOverZone([]);
        };

        window.addEventListener("dragend", handleGlobalDragOver);

        return () => {
            window.removeEventListener("dragover", handleGlobalDragOver);
        };
    }, []);

    useEffect(() => {
        const filter = async () => {
            if (!allProficiencies || !modulesRef.current) return;
            const modules = modulesRef.current.getElementsByClassName(styles.module);
            Array.from(modules).map(m => {
                if (m.textContent.toLowerCase().includes(moduleSearch.toLowerCase())) {
                    m.style.display = "flex";
                } else {
                    m.style.display = "none";
                }
            })
        }

        filter();
    }, [moduleSearch, allProficiencies]);

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

    const addProficiency = async (e, type) => {
        if (!draggedModule) return;
        const existingModule = userProficiencies.some(p => (p.module_id?._id?.toString() === draggedModule.module_id?._id) && p.type === type);
        if (existingModule) return;

        try {
            const { request } = api("post", "/proficiency/add", {
                id: draggedModule.module_id?._id || draggedModule._id,
                type
            });

            const resp = await request;
            showMessage("Proficiency added successfully", "success");
            setUserProficiencies(prev => [...prev, resp.data.proficiency]);
            e.target.value = "";
        } catch (err) {
            console.error(err);
            showMessage(err?.data?.message || "Failed to add proficiency");
        } finally {
            setDraggedModule(null);
        }
    }

    const deleteProficiency = async () => {
        const id = draggedModule._id;
        const existingModule = userProficiencies.find(p => p._id === id);
        if (!existingModule || !id) return;

        try {
            const { request } = api("delete", `/proficiency/remove?id=${id}`);
            await request;
            showMessage("Proficiency deleted successfully", "success");
            setUserProficiencies(prev => prev.filter(p => p._id.toString() !== id));
        } catch (err) {
            console.error(err);
            showMessage(err.data.message);
        } finally {
            setDraggedModule(null);
        }
    }

    const updateProficiency = async (proficiency, type) => {
        const existingModule = userProficiencies.some(p => (p.module_id?._id?.toString() === draggedModule.module_id?._id) && p.type === type);
        if (existingModule) return;

        try {
            const { request } = api("put", `/proficiency/update`, { id: proficiency._id, type: proficiency.type === 1 ? 2 : 1 });
            await request;
            showMessage("Proficiency updated successfully", "success");
            setUserProficiencies(prev => prev.map(p => p._id === proficiency._id ? { ...p, type: proficiency.type === 1 ? 2 : 1 } : p));
        } catch (err) {
            console.error(err);
            showMessage(err.data.message);
        }
    }

    const updateProfile = async (e) => {
        try {
            e.preventDefault();
            if (!e.target.checkValidity()) return;
            const data = { diploma, year_of_study: year }
            const { request } = api('put', `/account/update`, data);

            await request;
            setUser(prev => ({ ...prev, ...data }));
            showMessage("Profile updated successfully", "success");
        } catch (err) {
            if (err.name === "AbortError") return;
            console.error(err);
            showMessage(err.data.message);
        }
    }

    const checkOperation = () => {
        const id = draggedModule.module_id?._id || draggedModule._id;
        if (!id) return false;
        return userProficiencies.some(p => p.module_id?._id?.toString() === id);
    }

    return (
        <div className={styles.profile_page}>
            <div className={styles.profile_container}>
                <div className={styles.profile_info}>
                    <span className={styles["profile-picture"]} data-empty={!user.image} style={{ background: `url(${user.image ?? ""}) center/contain no-repeat` }}></span>
                    {loading ? <Placeholder width={200} /> : <p>{user.name}</p>}
                    {loading ? <Placeholder width={150} /> : <p>{user.student_id}@student.tp.edu.sg</p>}
                    {loading ? <Placeholder width={180} /> :
                        <div className={styles.rating}>
                            {[...Array(full)].map((_, i) => <i key={"f" + i} className="fa-solid fa-star"></i>)}
                            {half && <i className="fa-solid fa-star-half-stroke"></i>}
                            {[...Array(empty)].map((_, i) => <i key={"e" + i} className="fa-regular fa-star"></i>)}
                            <p><span>Rated by {user.rating?.length || 0} people</span></p>
                        </div>
                    }
                </div>

                <form className={`${styles.profile_form} ${styles.container}`} id="section-0" noValidate onSubmit={updateProfile}>
                    <h2>Account</h2>
                    <p>Diploma</p>
                    <p>Year of Study</p>

                    {loading ? <Placeholder width={200} height={30} /> : <input type="text" name="diploma" id="diploma" placeholder="Enter Your Diploma" autoComplete="off" value={diploma || ""} onChange={(e) => setDiploma(e.target.value)} required />}
                    {loading ? <Placeholder width={200} height={30} /> : <div>
                        <input type="radio" name="year" id="y1" required onChange={() => setYear(1)} checked={year === 1} />
                        <label htmlFor="y1">Year 1</label>
                        <input type="radio" name="year" id="y2" required onChange={() => setYear(2)} checked={year === 2} />
                        <label htmlFor="y2">Year 2</label>
                        <input type="radio" name="year" id="y3" required onChange={() => setYear(3)} checked={year === 3} />
                        <label htmlFor="y3">Year 3</label>
                    </div>}

                    <button type="submit">Save</button>
                </form>

                <div id="section-1" className={`${styles.container} ${styles.proficiency_container}`}>
                    <h2 id="modules_proficiency">Modules Proficiency</h2>
                    <div className={styles.proficiency_group}>
                        <h3>Ok to teach</h3>
                        <div
                            className={`${styles.profile_proficiency} ${dragOverZone.includes("teach") ? styles.drag_over : ""}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                checkOperation() === false ? addProficiency(e, 1) : updateProficiency(draggedModule, 1);
                                setDragOverZone([]);
                            }}
                        >
                            {loading && Array.from({ length: 3 }).map((_, i) => <Placeholder key={`proficiency_s${i}`} width={200} />)}
                            {category[1] && category[1].length !== 0 && category[1].map(module => (
                                <div key={module._id} className={styles.module} draggable onDragStart={() => { setDraggedModule(module); setDragOverZone(["all", "learn"]) }} onDrop={() => setDragOverZone([])}>
                                    <i className="fa-regular fa-book"></i>
                                    <p>{module.module_id.code}</p>
                                    <span>{module.module_id.module}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`${styles.modules_container} ${dragOverZone.includes("all") ? styles.drag_over : ""}`} ref={modulesRef} onDragOver={(e) => e.preventDefault()} onDrop={deleteProficiency}>
                        <div className={styles.modules_tip}>
                            <i className="fa-regular fa-lightbulb"></i>
                            <p>Drag and Drop to add and remove modules from your profile</p>
                        </div>
                        <div className={styles.modules_search}>
                            <i className="fa-regular fa-magnifying-glass"></i>
                            <input type="search" name="modules_search" placeholder="Search Modules" value={moduleSearch} onChange={(e) => setModuleSearch(e.target.value)} />
                        </div>
                        {availableModules.map(module => (
                            <div key={module._id} className={styles.module} draggable onDragStart={() => { setDraggedModule(module); setDragOverZone(["teach", "learn"]) }} onDrop={() => setDragOverZone([])}>
                                <i className="fa-regular fa-book"></i>
                                <p>{module.code}</p>
                                <span>{module.module}</span>
                                <div className={styles.module_tags}>
                                    {allModuleStats[module._id] >= 0 && <span>{allModuleStats[module._id] || 0} pair(s) currently studying this</span>}
                                    <span style={{ backgroundColor: colors[module.category] }}>School of {module.category}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.proficiency_group}>
                        <h3>I need help in</h3>
                        <div
                            className={`${styles.profile_proficiency} ${dragOverZone.includes("learn") ? styles.drag_over : ""}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                checkOperation() === false ? addProficiency(e, 2) : updateProficiency(draggedModule, 2);
                                setDragOverZone([]);
                            }}
                        >

                            {loading && Array.from({ length: 3 }).map((_, i) => <Placeholder key={`proficiency_w${i}`} width={200} />)}
                            {category[2] && category[2].length !== 0 && category[2].map(module => (
                                <div key={module._id} className={styles.module} draggable onDragStart={() => { setDraggedModule(module); setDragOverZone(["all", "teach"]) }} onDrop={() => setDragOverZone([])}>
                                    <i className="fa-regular fa-book"></i>
                                    <p>{module.module_id.code}</p>
                                    <span>{module.module_id.module}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div id="section-2" className={styles.achievements_container_outer}>
                    <h2>Achievements</h2>
                    <div className={styles.achievements_container}>
                        {loading && Array.from({ length: 5 }).map((_, i) => <Placeholder key={`achievement_${i}`} width={170} height={200} />)}
                        {!loading && allAchievements.map(achievement => {
                            const a = attained.find(a => a.achievement_id === achievement._id);

                            return (
                                <div key={achievement._id} className={styles.achievement} onClick={() => setSelectedAchievement(achievement)}>
                                    <img src={achievement.image} alt={achievement.name} className={!a ? styles["not-attained"] : ""} />
                                </div>
                            )
                        })}
                    </div>
                    <div className={`${styles.achievement_data} ${styles.container}`}>
                        {Object.keys(selectedAchievement).length > 0 ? (
                            <>
                                <h3>{selectedAchievement?.name}</h3>
                                <p>{selectedAchievement?.description}</p>
                                <p className={styles[difficulty[selectedAchievement?.difficulty]?.toLowerCase()]}>{difficulty[selectedAchievement?.difficulty]}</p>
                                <p>Attained on: {a && new Date(a.achieved_date).toLocaleString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) || "Not Attained"}</p>
                            </>
                        ) : <p>Select an Achievement</p>}
                    </div>
                </div>
            </div>

            <div className={styles.action_bar}>
                <div className={styles.selector} style={{ transform: `translateY(${40 * (selectedSection.split("-")[1])}px)` }}></div>
                {["Account", "Proficiency", "Achievements"].map((section, i) => (
                    <p
                        key={`section-${i}`}
                        onClick={() => {
                            setSelectedSection(`section-${i}`);
                            document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className={selectedSection === `section-${i}` ? styles.selected : ""}>
                        {section}
                    </p>
                ))}
            </div>
        </div>
    )
}

export default ProfilePage
