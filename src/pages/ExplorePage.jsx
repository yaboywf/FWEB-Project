import Nav from "../general/Nav";
import axios from "redaxios";
import { useEffect, useState } from "react";
import showMessage from "../general/Message";
import styles from '../styles/explore.module.scss'
import Student from "../general/Student";
import '../styles/general.scss'
import REQ from "../general/Request";
import Placeholder from "../general/Placeholder";
import { useUser } from "../general/UserProvider";
import { useNavigate } from "react-router-dom";

const ExplorePage = () => {
    const navigate = useNavigate();
    const { user, userProficiencies } = useUser();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);

    useEffect(() => {
        async function getData() {
            try {
                if (!user?.name || !userProficiencies || userProficiencies?.length === 0) return;
                const strength = userProficiencies.filter(record => record.type === 1).map(record => record.module_id._id);
                const weakness = userProficiencies.filter(record => record.type === 2).map(record => record.module_id._id);

                const matchableAccounts = await axios.get(`${REQ}/api/proficiency/matchable-accounts?strength=${encodeURIComponent(strength.join(','))}&weakness=${encodeURIComponent(weakness.join(','))}`, { withCredentials: true });
                setStudents(matchableAccounts.data);
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
            const profMods = student.proficiencies.map(p => p.module).join(" ");
            return (
                student.name.toLowerCase().includes(lower) ||
                student.student_id.toLowerCase().includes(lower) ||
                student.diploma.toLowerCase().includes(lower) ||
                profMods.toLowerCase().includes(lower)
            );
        });

        setFilteredStudents(filtered);
    }

    return (
        <>
            <Nav />

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
                    <div key={student._id}>
                        <Student student={student} />
                        <div className={styles.student_skills}>
                            {student.proficiencies.map(proficiency => (
                                <div key={proficiency._id} className={proficiency.type === 1 ? styles.strength : styles.weakness}>{proficiency.module_id.module.split("(")[1].replace(")", "").toUpperCase()}</div>
                            ))}

                            <i className="fa-solid fa-link" onClick={() => navigate(`/session?adminNum=${student.student_id}`)}></i>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

export default ExplorePage;