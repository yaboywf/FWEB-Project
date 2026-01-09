import Nav from "../general/Nav";
import { useEffect, useState } from "react";
import showMessage from "../general/Message";
import styles from '../styles/explore.module.scss'
import Student from "../general/Student";
import '../styles/general.scss'
import api from "../general/Request";
import Placeholder from "../general/Placeholder";
import { useUser } from "../general/UserContext";
import { useNavigate } from "react-router-dom";

const ExplorePage = () => {
    const navigate = useNavigate();
    const { user, userProficiencies } = useUser();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [moduleTab, setModuleTab] = useState({});
    const [filteredStudents, setFilteredStudents] = useState([]);

    useEffect(() => {
        async function getData() {
            try {
                if (!user?.name || !userProficiencies || userProficiencies?.length === 0) return;

                const matchableAccounts = await api.get(`/proficiency/matchable-accounts`);
                setStudents(matchableAccounts.data);

                for (const student of matchableAccounts.data) {
                    if (student.proficiencies.filter(p => p.type === 1).length === 0) {
                        setModuleTab(prev => ({ ...prev, [student._id]: 2 }));
                        continue;
                    }
                }

                setFilteredStudents(matchableAccounts.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                showMessage("Failed to fetch matchable accounts");
            }
        }

        getData();
    }, [userProficiencies, user])

    const filter = (searchTerm) => {
        if (loading) return;
        if (!searchTerm.trim()) {
            setFilteredStudents(students);
            return;
        }

        const lower = searchTerm.toLowerCase();
        const filtered = students.filter(student => {
            const profMods = student.proficiencies.map(p => p.module_id.module).join(" ");
            return (
                student.name.toLowerCase().includes(lower) ||
                student.diploma.toLowerCase().includes(lower) ||
                String(student.year_of_study).includes(lower) ||
                profMods.toLowerCase().includes(lower)
            );
        });

        setFilteredStudents(filtered);
    }

    const selectTab = (studentId, tab) => {
        setModuleTab(prev => ({ ...prev, [studentId]: tab }));
    }

    return (
        <>
            <div className={styles.search}>
                <input type="search" onChange={(e) => filter(e.target.value)} placeholder="Search for a student" id="searchBar" autoComplete="off" />
            </div>

            <div className={styles.container}>
                {loading && Array.from({ length: 6 }).map((_, i) => (
                    <div key={i}>
                        <Student loading={true} />
                        <div className={styles.student_skills}>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Placeholder key={`proficiency_${i}`}></Placeholder>
                            ))}
                        </div>
                    </div>
                ))}


                {filteredStudents.map(student => (
                    <div key={student._id} className={styles.student}>
                        <Student student={student} />
                        <div className={styles.student_skills}>
                            <div className={styles.toggles}>
                                <button className={(moduleTab[student._id] === undefined || moduleTab[student._id] === 1) ? styles.selected : ""} onClick={() => selectTab(student._id, 1)}>
                                    <i className="fa-solid fa-teach"></i>
                                    Teach ({student.proficiencies.filter(p => p.type === 1).length})
                                </button>
                                <button className={moduleTab[student._id] === 2 ? styles.selected : ""} onClick={() => selectTab(student._id, 2)}>
                                    <i className="fa-solid fa-graduation-cap"></i>
                                    Learn ({student.proficiencies.filter(p => p.type === 2).length})
                                </button>
                            </div>

                            <div className={styles.proficiencies} style={{ transform: (moduleTab[student._id] === undefined || moduleTab[student._id] === 1) ? "translateX(0)" : "translateX(calc(-50% - 10px))" }}>
                                <div>
                                    {student.proficiencies.filter(p => p.type === 1).length === 0 && <p>Not teaching any modules right now</p>}
                                    {student.proficiencies.filter(p => p.type === 1).map(proficiency => (
                                        <div key={proficiency._id} title={`Can Teach: ${proficiency.module_id.module}`} className={proficiency.type === 1 ? styles.strength : styles.weakness}>{proficiency.module_id.module.split("(")[1].replace(")", "").toUpperCase()}</div>
                                    ))}
                                </div>
                                <div>
                                    {student.proficiencies.filter(p => p.type === 2).length === 0 && <p>Not learning any modules right now</p>}
                                    {student.proficiencies.filter(p => p.type === 2).map(proficiency => (
                                        <div key={proficiency._id} title={`Want to Learn: ${proficiency.module_id.module}`} className={proficiency.type === 1 ? styles.strength : styles.weakness}>{proficiency.module_id.module.split("(")[1].replace(")", "").toUpperCase()}</div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={styles.buttons}>
                            <button>
                                <i className="fa-regular fa-envelope" data-email onClick={() => window.open(`mailto:${student.student_id}@student.tp.edu.sg`, "_blank")}></i>
                            </button>
                            <button>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16" onClick={() => window.open(`https://teams.microsoft.com/l/chat/0/0?users=${student.student_id}@student.tp.edu.sg`, "_blank")}>
                                    <path d="M9.186 4.797a2.42 2.42 0 1 0-2.86-2.448h1.178c.929 0 1.682.753 1.682 1.682zm-4.295 7.738h2.613c.929 0 1.682-.753 1.682-1.682V5.58h2.783a.7.7 0 0 1 .682.716v4.294a4.197 4.197 0 0 1-4.093 4.293c-1.618-.04-3-.99-3.667-2.35Zm10.737-9.372a1.674 1.674 0 1 1-3.349 0 1.674 1.674 0 0 1 3.349 0m-2.238 9.488-.12-.002a5.2 5.2 0 0 0 .381-2.07V6.306a1.7 1.7 0 0 0-.15-.725h1.792c.39 0 .707.317.707.707v3.765a2.6 2.6 0 0 1-2.598 2.598z"></path>
                                    <path d="M.682 3.349h6.822c.377 0 .682.305.682.682v6.822a.68.68 0 0 1-.682.682H.682A.68.68 0 0 1 0 10.853V4.03c0-.377.305-.682.682-.682Zm5.206 2.596v-.72h-3.59v.72h1.357V9.66h.87V5.945z"></path>
                                </svg>
                            </button>

                            <button onClick={() => navigate(`/session?adminNum=${student.student_id}`)}>
                                <i className="fa-solid fa-link"></i>
                                Request
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

export default ExplorePage;