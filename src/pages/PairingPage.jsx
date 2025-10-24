import { useEffect, useState } from "react"
import Nav from "../general/Nav"
import REQ from "../general/Request"
import axios from "redaxios"
import styles from '../styles/pair.module.scss'
import showMessage from "../general/Message"
import Placeholder from "../general/Placeholder"
import Student from "../general/Student"
import { useUser } from "../general/UserProvider"

const PlaceholderTemplate = () => {
    return (
        <div className={styles.pair}>
            <Student loading={true} />

            <div className={styles.pair_info}>
                <i className="fa-solid fa-link"></i>
                <Placeholder width={100} height={18} />
                <Placeholder width={100} height={18} />
                <Placeholder width={60} height={18} />
            </div>

            <Student loading={true} />
        </div>
    )
}

const PairingPage = () => {
    const { user } = useUser();
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

    const handleUnlink = async (pair) => {
        const confirm = prompt("Please enter 'confirm' to unlink this pair");
        if (confirm?.toLowerCase() !== "confirm") return;
        try {
            console.log("Unlinking pair:", pair);
            await axios.delete(`${REQ}/api/pair/delete?id=${pair._id}`, { withCredentials: true });
            showMessage("Pair unlinked successfully", "success");
            setPairings(prev => prev.filter(pair => pair._id !== pair._id));

            if (pair.learner) {
                let rating = null;
                while (true) {
                    const rate = prompt("Please rate your learning experience with this student from 1 to 5:");

                    if (rate === null) {
                        rating = null;
                        break;
                    }

                    const parsed = parseInt(rate);
                    if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
                        rating = parsed;
                        break;
                    }

                    alert("Please enter a number between 1 and 5.");
                }

                if (rating !== null) {
                    const otherUser = pair.sender_id === user.student_id ? pair.receiver_id : pair.sender_id;
                    await axios.post(`${REQ}/api/account/rating`, {
                        student_id: otherUser,
                        rating: rating
                    }, { withCredentials: true });
                    showMessage("Rating submitted successfully", "success");
                }
            }
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
                        <span onClick={() => handleUnlink(pair)}>Unlink</span>
                        <Student student={pair.sender_info} />

                        <div className={styles.pair_info}>
                            <i className="fa-solid fa-link"></i>
                            <p>{dayNumberToName(pair.day)} {pair.start_time} - {pair.end_time}</p>
                            <p id={styles.end_date} style={calcRemainingDays(pair.end_date) < 0 ? { color: "red" } : {}}>{calcRemainingDays(pair.end_date) < 0 ? "Ended" : `Ending in ${calcRemainingDays(pair.end_date)} Days`}</p>
                            <p title={pair.module_info.module}>{extractModuleName(pair.module_info.module)}</p>
                        </div>

                        <Student student={pair.receiver_info} />
                    </div>
                ))}
            </div >
        </>
    )
}

export default PairingPage