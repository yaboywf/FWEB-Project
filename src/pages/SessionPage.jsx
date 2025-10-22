import { Fragment, useEffect, useState } from "react";
import Nav from "../general/Nav";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../general/UserProvider";
import axios from "redaxios";
import REQ from "../general/Request";
import showMessage from "../general/Message";
import Placeholder from "../general/Placeholder";
import styles from '../styles/session.module.scss'
import styles1 from '../styles/student.module.scss'

const SessionPage = () => {
    const navigate = useNavigate();
    const { userProficiencies, user } = useUser();
    const query = new URLSearchParams(useLocation().search);
    const [type, setType] = useState("create");
    const [accountInfo, setAccountInfo] = useState({});
    const [modules, setModules] = useState([]);
    const [selectedModule, setSelectedModule] = useState();
    const [day, setDay] = useState();
    const [endDate, setEndDate] = useState("");
    const [time, setTime] = useState({ start: "", end: "" });
    const loading = !accountInfo.name || modules.length === 0;

    useEffect(() => {
        const getData = async () => {
            const adminNum = query.get("adminNum");
            const pairId = query.get("pairId");
            if (!adminNum && !pairId) navigate("/explore");

            try {
                if (adminNum) {
                    const resp = await axios.get(`${REQ}/api/account/information?id=${encodeURIComponent(adminNum.toUpperCase())}`, { withCredentials: true })
                    setAccountInfo(resp.data);
                    setType("create");
                    await fetchProficiencies(adminNum);
                } else {
                    const resp = await axios.get(`${REQ}/api/request/sent?id=${encodeURIComponent(pairId)}`, { withCredentials: true });
                    await fetchProficiencies(resp.data.receiver_info.student_id);
                    setSelectedModule(resp.data.module_id);
                    setDay(resp.data.day);
                    setEndDate(resp.data.end_date?.split("T")[0] || "");
                    setAccountInfo(resp.data.receiver_info);
                    setTime({ start: resp.data.start_time, end: resp.data.end_time });
                    setType("edit");
                }
            } catch (err) {
                console.error(err);
                showMessage("Failed to fetch user/pair information");
            }
        }

        getData();
    }, [userProficiencies]);

    const fetchProficiencies = async (adminNum) => {
        try {
            const resp = await axios.get(`${REQ}/api/proficiency/user-proficiency?id=${encodeURIComponent(adminNum.toUpperCase())}`, { withCredentials: true });

            const merged = resp.data
                .filter(p => {
                    const match = userProficiencies.find(c => c.module_id?._id === p.module_id?._id);
                    return match && match.type !== p.type;
                })
                .map(p => ({
                    id: p.module_id?._id,
                    name: p.module_id?.module,
                }));

            setModules(merged);
        } catch (err) {
            console.error(err);
            showMessage("Failed to fetch user proficiency");
        }
    };

    const handleTimeChange = (e) => {
        const { name, value } = e.target;
        setTime(prev => ({ ...prev, [name]: value }));
    }

    const getDuration = () => {
        if (!time.start || !time.end) return "0";
        const [sh, sm] = time.start.split(":").map(Number);
        const [eh, em] = time.end.split(":").map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff <= 0) return "0";
        return (diff / 60).toFixed(1);
    };

    const countWeekdaysUntil = () => {
        if (!day || !endDate || endDate === "") return 0;

        const today = new Date();
        const end = new Date(endDate);
        if (end <= today) return 0;

        const jsTargetDay = day % 7;

        let count = 0;
        let current = new Date(today);

        while (current <= end) {
            if (current.getDay() === jsTargetDay) count++;
            current.setDate(current.getDate() + 1);
        }

        return count;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!e.target.checkValidity()) return showMessage("One or more fields are invalid");

        const adminNum = query.get("adminNum");
        const pairId = query.get("pairId");

        const baseData = {
            day,
            start_time: time.start,
            end_time: time.end,
            end_date: endDate,
            module_id: selectedModule,
        };

        const method = type === "create" ? axios.post : axios.put;
        const path = type === "create" ? `add` : `update-details`;

        const data = type === "create"
            ? { ...baseData, sender_id: user.student_id, receiver_id: adminNum }
            : { ...baseData, id: pairId };

        try {
            const resp = await method(`${REQ}/api/request/${path}`, data, { withCredentials: true });
            showMessage(resp.data.message, "success");
            navigate("/explore");
        } catch (err) {
            console.error(err);
            showMessage("Failed to create request");
        }
    }

    return (
        <>
            <Nav active="explore" />

            <form id="request_form" className={styles.request_form} noValidate onSubmit={handleSubmit}>
                <div>
                    <h2>Student</h2>
                    <div className={styles1.student_info}>
                        <img src={loading ? null : accountInfo.image ? accountInfo.image : "favicon.webp"} />
                        <div>
                            {loading ? <Placeholder width={200} /> : <p data-year={accountInfo.year_of_study || "?"}>{accountInfo.name}</p>}
                            {loading ? <Placeholder width={200} /> : <a href={`mailto:${accountInfo.student_id}@student.tp.edu.sg`}>{accountInfo.student_id}@student.tp.edu.sg</a>}
                            {loading ? <Placeholder width={200} /> : <p>{accountInfo.diploma}</p>}
                        </div>
                    </div>
                </div>

                <div>
                    <h2>Matchable Module</h2>
                    <div className={styles.module}>
                        {loading && Array.from({ length: 3 }).map((_, i) => <Placeholder key={`module_${i}`} width={200} />)}
                        {modules.map(m => (
                            <Fragment key={m.id}>
                                <input type="radio" id={m.id} value={m.id} checked={selectedModule === m.id} name="module" onChange={() => setSelectedModule(m.id)} required />
                                <label htmlFor={m.id}>{m.name}</label>
                            </Fragment>
                        ))}
                    </div>
                </div>

                <div>
                    <h2>Day & Time</h2>
                    <div className={styles.day}>
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                            <Fragment key={i}>
                                <input type="radio" onChange={() => setDay(i + 1)} id={d.toLowerCase()} value={day === i + 1} checked={day === i + 1} name="day" required />
                                <label htmlFor={d.toLowerCase()}>{d}</label>
                            </Fragment>
                        ))}
                    </div>

                    <div className={styles.time}>
                        <label htmlFor="request_time_start">From</label>
                        <input type="time" id="request_time_start" required value={time.start} onChange={handleTimeChange} name="start" />
                        <label htmlFor="request_time_end">To</label>
                        <input type="time" id="request_time_end" required value={time.end} onChange={handleTimeChange} name="end" />
                        <p>{getDuration()}h</p>
                    </div>

                    <div className={styles.time}>
                        <label htmlFor="request_end_on">End On</label>
                        <input type="date" id="request_end_on" onChange={e => setEndDate(e.target.value)} value={endDate} required />
                        <p>{countWeekdaysUntil()} sessions</p>
                    </div>
                </div>

                <button>{type === "create" ? "Request" : "Update"}</button>
            </form>
        </>
    )
}

export default SessionPage