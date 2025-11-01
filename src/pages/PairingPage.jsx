import { useEffect, useState } from "react"
import Nav from "../general/Nav"
import api from "../general/Request"
import styles from '../styles/pair.module.scss'
import showMessage from "../general/Message"
import Placeholder from "../general/Placeholder"
import Student from "../general/Student"
import { useUser } from "../general/UserProvider"

const PlaceholderTemplate = () => {
    return (
        <div className={styles.pair}>
            <div>
                <Placeholder width={100} />
                <Placeholder width={100} />
                <Placeholder width={100} />
            </div>
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
                const resp = await api.get('/pair/pairs');
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
            await api.delete(`/pair/delete?id=${pair._id}`);
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
                    await api.post(`/account/rating`, {
                        student_id: otherUser,
                        rating: rating
                    });
                    showMessage("Rating submitted successfully", "success");
                }
            }
        } catch (err) {
            console.error(err);
            showMessage("Failed to unlink pair");
        }
    }

    const handleDownload = (pair) => {
        const title = `Study Session (Teach and Tackle)`;
        const tz = "Asia/Singapore";
        const creationDate = new Date(pair.created_at).toISOString().split("T")[0];

        const BYDAY = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"][pair.day - 1];
        const pad = n => String(n).padStart(2, "0");
        const toYYYYMMDD = d => d.replaceAll("-", "");
        const dtLocal = (date, hhmm) => {
            const [H, M] = hhmm.split(":");
            return toYYYYMMDD(date) + "T" + pad(H) + pad(M) + "00";
        };

        // RFC 5545 line folding helper (CRLF + one space)
        const foldLine = (str, limit = 75) =>
            str.replace(new RegExp(`(.{1,${limit}})(?=.)`, "g"), "$1\r\n ");

        const untilZ = new Date(pair.end_date)
            .toISOString()
            .replace(/\.\d{3}Z$/, "Z")
            .replaceAll("-", "")
            .replaceAll(":", "");

        const nowZ = new Date()
            .toISOString()
            .replace(/\.\d{3}Z$/, "Z")
            .replaceAll("-", "")
            .replaceAll(":", "");

        const description = `Module: ${pair.module_info.module}\\nPeople: ${pair.sender_info.name} and ${pair.receiver_info.name}\\nGenerated by Teach and Tackle`;

        const icsLines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//TeachAndTackle//EN",
            "BEGIN:VTIMEZONE",
            "TZID:Asia/Singapore",
            "BEGIN:STANDARD",
            "DTSTART:19700101T000000",
            "TZOFFSETFROM:+0800",
            "TZOFFSETTO:+0800",
            "TZNAME:SGT",
            "END:STANDARD",
            "END:VTIMEZONE",
            "BEGIN:VEVENT",
            `UID:${Date.now()}@teachandtackle`,
            `DTSTAMP:${nowZ}`,
            `SUMMARY:${foldLine(title)}`,
            `DESCRIPTION:${foldLine(description)}`,
            `DTSTART;TZID=${tz}:${dtLocal(creationDate, pair.start_time)}`,
            `DTEND;TZID=${tz}:${dtLocal(creationDate, pair.end_time)}`,
            `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY};UNTIL=${untilZ}`,
            "END:VEVENT",
            "END:VCALENDAR"
        ];

        const ics = icsLines.join("\r\n"); // CRLF line endings per RFC 5545
        const blob = new Blob([ics], { type: "text/calendar" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "event.ics";
        link.click();
    };

    return (
        <>
            <Nav active="pairing" />

            <div className={styles.pairing_container}>
                {loading && Array.from({ length: 2 }).map((_, index) => <PlaceholderTemplate key={`placeholder_${index}`} />)}
                {pairings && pairings.map(pair => (
                    <div className={styles.pair} key={pair._id}>
                        <div>
                            <span onClick={() => window.open(`https://teams.microsoft.com/l/chat/0/0?users=${pair.sender_id}@student.tp.edu.sg,${pair.receiver_id}@student.tp.edu.sg`, "_blank")}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#5143d6" viewBox="0 0 16 16">
                                    <path d="M9.186 4.797a2.42 2.42 0 1 0-2.86-2.448h1.178c.929 0 1.682.753 1.682 1.682zm-4.295 7.738h2.613c.929 0 1.682-.753 1.682-1.682V5.58h2.783a.7.7 0 0 1 .682.716v4.294a4.197 4.197 0 0 1-4.093 4.293c-1.618-.04-3-.99-3.667-2.35Zm10.737-9.372a1.674 1.674 0 1 1-3.349 0 1.674 1.674 0 0 1 3.349 0m-2.238 9.488-.12-.002a5.2 5.2 0 0 0 .381-2.07V6.306a1.7 1.7 0 0 0-.15-.725h1.792c.39 0 .707.317.707.707v3.765a2.6 2.6 0 0 1-2.598 2.598z" />
                                    <path d="M.682 3.349h6.822c.377 0 .682.305.682.682v6.822a.68.68 0 0 1-.682.682H.682A.68.68 0 0 1 0 10.853V4.03c0-.377.305-.682.682-.682Zm5.206 2.596v-.72h-3.59v.72h1.357V9.66h.87V5.945z" />
                                </svg>
                                Connect on Teams
                            </span>
                            <span onClick={() => handleDownload(pair)}>
                                <i className="fa-solid fa-calendar"></i>
                                Add to Calendar
                            </span>
                            <span onClick={() => handleUnlink(pair)}>
                                <i className="fa-solid fa-link-slash"></i>
                                Unlink
                            </span>
                        </div>
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