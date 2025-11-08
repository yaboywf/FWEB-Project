import { Fragment, useEffect, useState } from "react";
import Nav from "../general/Nav";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../general/UserProvider";
import api from "../general/Request";
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
    const [userLoading, setUserLoading] = useState(true);
    const [moduleLoading, setModuleLoading] = useState(true);

    useEffect(() => {
        const getData = async () => {
            const adminNum = query.get("adminNum");
            const pairId = query.get("pairId");
            if (!adminNum && !pairId) navigate("/explore");

            try {
                if (adminNum) {
                    const resp = await api.get(`/account/information?id=${encodeURIComponent(adminNum.toUpperCase())}`)
                    setAccountInfo(resp.data);
                    setType("create");
                    setUserLoading(false);
                    await fetchProficiencies(adminNum);
                    setModuleLoading(false);
                } else {
                    const resp = await api.get(`/request/sent?id=${encodeURIComponent(pairId)}`);
                    setUserLoading(false)
                    await fetchProficiencies(resp.data.receiver_info.student_id);
                    setSelectedModule(resp.data.module_id);
                    setDay(resp.data.day);
                    setEndDate(resp.data.end_date?.split("T")[0] || "");
                    setAccountInfo(resp.data.receiver_info);
                    setTime({ start: resp.data.start_time, end: resp.data.end_time });
                    setType("edit");
                    setModuleLoading(false);
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
            const resp = await api.get(`/proficiency/user-proficiency?id=${encodeURIComponent(adminNum.toUpperCase())}`);
            const resp2 = await api.get('/pair/pairs');
            const resp3 = await api.get(`/request/requests`);
            const today = new Date();

            const merged = resp.data
                .filter(p => {
                    const match = userProficiencies.find(c => c.module_id?._id === p.module_id?._id);
                    return match && match.type !== p.type;
                })
                .map(p => {
                    const existingPair = resp2.data.find(pair => {
                        const cond1 = pair.sender_id === user.student_id;
                        const cond2 = pair.receiver_id === adminNum.toUpperCase();
                        const cond3 = String(pair.module_id) === String(p.module_id?._id);
                        const cond4 = new Date(pair.end_date) >= today;

                        console.log("---- Checking Pair ----");
                        console.log("pair.sender_id:", pair.sender_id, "vs", user.student_id, "=", cond1);
                        console.log("pair.receiver_id:", pair.receiver_id, "vs", adminNum.toUpperCase(), "=", cond2);
                        console.log("pair.module_id:", pair.module_id, "vs", p.module_id?._id, "=", cond3);
                        console.log("pair.end_date:", pair.end_date, ">= today", today.toISOString(), "=", cond4);
                        console.log("Result:", cond1 && cond2 && cond3 && cond4);
                        console.log("----------------------");

                        return cond1 && cond2 && cond3 && cond4;
                    });

                    const alreadyRequested = resp3.data.find(req => {
                        const cond1 = req.sender_id === user.student_id;
                        const cond2 = req.receiver_id === adminNum.toUpperCase();
                        const cond3 = String(req.module_id) === String(p.module_id?._id);

                        return cond1 && cond2 && cond3;
                    })

                    return {
                        id: p.module_id?._id,
                        name: p.module_id?.module,
                        alreadyPaired: Boolean(existingPair),
                        alreadyRequested: Boolean(alreadyRequested)
                    };
                });

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

        const method = type === "create" ? api.post : api.put;
        const path = type === "create" ? `add` : `update-details`;

        const data = type === "create"
            ? { ...baseData, sender_id: user.student_id, receiver_id: adminNum }
            : { ...baseData, id: pairId };

        try {
            const resp = await method(`/request/${path}`, data);
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
                        <img src={userLoading ? null : accountInfo.image ? accountInfo.image : "favicon.png"} />
                        <div>
                            {userLoading ? <Placeholder width={200} /> : <p data-year={accountInfo.year_of_study || "?"}>{accountInfo.name}</p>}
                            {userLoading ? <Placeholder width={200} /> : <a href={`https://teams.microsoft.com/l/chat/0/0?users=${accountInfo.student_id}@student.tp.edu.sg`} target="_blank" rel="noopener noreferrer">{accountInfo.student_id}@student.tp.edu.sg</a>}
                            {userLoading ? <Placeholder width={200} /> : <p>{accountInfo.diploma}</p>}
                        </div>
                    </div>
                </div>

                <div>
                    <h2>Matchable Module</h2>
                    <div className={styles.module}>
                        {moduleLoading && Array.from({ length: 3 }).map((_, i) => <Placeholder key={`module_${i}`} width={200} />)}
                        {!moduleLoading && modules.length === 0 && <p>No matchable modules found</p>}
                        {modules.map(m => (
                            <Fragment key={m.id}>
                                <input type="radio" id={m.id} value={m.id} checked={selectedModule === m.id} name="module" onChange={() => setSelectedModule(m.id)} required />
                                <label htmlFor={m.id}>{m.name} {m.alreadyPaired && <span style={{ color: 'red' }}> (Already Paired)</span>} {m.alreadyRequested && <span style={{ color: 'red' }}> (Already Requested)</span>}</label>
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