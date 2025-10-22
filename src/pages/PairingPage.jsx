import { useEffect, useState } from "react"
import Nav from "../general/Nav"
import REQ from "../general/Request"
import axios from "redaxios"
import styles from '../styles/pair.module.css'
import styles1 from '../styles/student.module.css'
import showMessage from "../general/Message"
import Placeholder from "../general/Placeholder"

const PlaceholderTemplate = () => {
    return (
        <div className={styles.pair}>
            <div className={styles1.student_info}>
                <img />
                <div>
                    <Placeholder width={200} />
                    <Placeholder width={150} />
                    <Placeholder width={200} />
                </div>
            </div>

            <div className={styles.pair_info}>
                <i className="fa-solid fa-link"></i>
                <Placeholder width={100} height={18} />
                <Placeholder width={100} height={18} />
                <Placeholder width={60} height={18} />
            </div>

            <div className={styles1.student_info}>
                <img />
                <div>
                    <Placeholder width={200} />
                    <Placeholder width={150} />
                    <Placeholder width={200} />
                </div>
            </div>
        </div>
    )
}

const PairingPage = () => {
    const [pairings, setPairings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getData = async () => {
            try {
                const resp = await axios.get(`${REQ}/api/pair/pairs`, { withCredentials: true });
                setPairings(resp.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                showMessage("Failed to fetch pairings");
            }
        }

        getData();
    }, [])

    const dayNumberToName = (day) => {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        return days[day - 1] || null;
    }

    const extractModuleName = (moduleName) => {
        const match = moduleName.match(/\(([^)]+)\)/);
        const result = match ? match[1] : null;
        return result;
    }

    const calcRemainingDays = (endDate) => {
        const currentDate = new Date();
        const endDateObj = new Date(endDate);

        const timeDifference = endDateObj.getTime() - currentDate.getTime();
        const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));

        return daysDifference;
    }

    const handleUnlink = async (pairId) => {
        const confirm = prompt("Please enter 'confirm' to unlink this pair");
        if (confirm.toLowerCase() !== "confirm") return;
        try {
            await axios.delete(`${REQ}/api/pair/delete?id=${pairId}`, { withCredentials: true });
            showMessage("Pair unlinked successfully", "success");
            setPairings(prev => prev.filter(pair => pair._id !== pairId));
        } catch (err) {
            console.error(err);
            showMessage("Failed to unlink pair");
        }
    }

    return (
        <>
            <Nav active="pairing" />

            <div className={styles.pairing_container}>
                {loading && Array.from({ length: 2 }).map((_, index) => <PlaceholderTemplate key={`placeholder_${index}`} />)}
                {pairings && pairings.map(pair => (
                    <div className={styles.pair} key={pair._id}>
                        <span onClick={() => handleUnlink(pair._id)}>Unlink</span>
                        <div className={styles1.student_info}>
                            <img src={pair.sender_info.image ?? "favicon.webp"} alt="Profile Picture" />
                            <div>
                                <p data-year={pair.sender_info.year_of_study}>{pair.sender_info.name}</p>
                                <a href={`mailto:${pair.sender_info.student_id}@student.tp.edu.sg`}>{pair.sender_info.student_id}@student.tp.edu.sg</a>
                                <p>{pair.sender_info.diploma}</p>
                            </div>
                        </div>

                        <div className={styles.pair_info}>
                            <i className="fa-solid fa-link"></i>
                            <p>{dayNumberToName(pair.day)} {pair.start_time} - {pair.end_time}</p>
                            <p id={styles.end_date} style={calcRemainingDays(pair.end_date) < 0 ? { color: "red" } : {}}>{calcRemainingDays(pair.end_date) < 0 ? "Ended" : `Ending in ${calcRemainingDays(pair.end_date)} Days`}</p>
                            <p title={pair.module_info.module}>{extractModuleName(pair.module_info.module)}</p>
                        </div>

                        <div className={styles1.student_info}>
                            <img src={pair.receiver_info.image ?? "favicon.webp"} alt="Profile Picture" />
                            <div>
                                <p data-year={pair.receiver_info.year_of_study}>{pair.receiver_info.name}</p>
                                <a href={`mailto:${pair.receiver_info.student_id}@student.tp.edu.sg`}>{pair.receiver_info.student_id}@student.tp.edu.sg</a>
                                <p>{pair.receiver_info.diploma}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div >
        </>
    )
}

export default PairingPage