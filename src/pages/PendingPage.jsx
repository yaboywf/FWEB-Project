import { useEffect, useState, useMemo } from "react";
import { useUser } from "../general/UserContext";
import api from "../general/Request";
import styles from '../styles/pending.module.scss'
import Placeholder from "../general/Placeholder";
import Student from "../general/Student";
import { useNavigate } from "react-router-dom";
import showMessage from "../general/Message";

const PlaceholderTemplate = () => {
    return (
        <div className={styles.request}>
            <Student loading={true} classes={styles.student_info} />
            <div className={styles.request_info}>
                <Placeholder width={300} height={15} />
                <Placeholder width={300} height={15} />
                <Placeholder width={300} height={15} />
            </div>
            <div className={`${styles.request_button}`}>
                <Placeholder width={35} height={35} />
                <Placeholder width={35} height={35} />
                <Placeholder width={135} height={35} />
                <Placeholder width={135} height={35} />
            </div>
        </div>
    )
}

const PendingPage = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);

    const { request, abort } = api('get', `/request/requests`);
    const getData = async () => {
        const resp = await request;
        setRequests(resp.data);
        setLoading(false);
    }

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            if (!mounted) return;
            await getData();
        };

        load();
        return () => {
            mounted = false;
            abort();
        };
    }, [])

    const category = useMemo(() => {
        const received = requests.filter(request => request.receiver_id === user.student_id);
        const sent = requests.filter(request => request.sender_id === user.student_id);
        return { received, sent };
    }, [requests, user])

    const reload = async () => {
        setLoading(true);
        getData();
    }

    const dayNumberToName = (day) => {
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        return days[day - 1] || null;
    }

    const deleteRequest = async (requestId) => {
        const { request } = api("delete", `/request/remove?id=${requestId}`);

        try {
            await request;
            showMessage("Request deleted successfully", "success");
            setRequests(prev => prev.filter(request => request._id !== requestId));
        } catch (err) {
            if (err.name === "AbortError") return;
            console.error(err);
            showMessage("Failed to delete request");
        }
    }

    const acceptRequest = async (requestId) => {
        const { request } = api("put", `/request/update-status`, { id: requestId });

        try {
            await request;
            showMessage("Request accepted successfully", "success");
            setRequests(prev => prev.filter(request => request._id !== requestId));
        } catch (err) {
            if (err.name === "AbortError") return;
            console.error(err);
            showMessage("Failed to accept request");
        }
    }

    return (
        <>
            <div className={styles.pending_container}>
                <div>
                    <p>Received</p>
                    {loading && Array.from({ length: 2 }).map((_, index) => <PlaceholderTemplate key={`received_${index}`} />)}
                    {!loading && category.received.length === 0 && <div className={styles.not_found}>
                        <img src="/not_found.png" alt="Owl" />
                        <p>No received requests</p>
                    </div>}

                    {!loading && category.received && category.received.map(request => (
                        <div className={`${styles.request} ${styles.received}`} key={request._id}>
                            <Student student={request.sender_info} classes={styles.student_info} />
                            <div className={styles.request_info}>
                                <p>{request.module_info.module}</p>
                                <p>{dayNumberToName(request.day)} | {request.start_time} - {request.end_time}</p>
                                <p>End on {new Date(request.end_date).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}</p>
                            </div>
                            <div className={`${styles.request_button} ${styles.received}`}>
                                <button>
                                    <i className="fa-regular fa-envelope" data-email onClick={() => window.open(`mailto:${request.receiver.student_id}@student.tp.edu.sg`, "_blank")}></i>
                                </button>
                                <button>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16" onClick={() => window.open(`https://teams.microsoft.com/l/chat/0/0?users=${request.receiver.student_id}@student.tp.edu.sg`, "_blank")}>
                                        <path d="M9.186 4.797a2.42 2.42 0 1 0-2.86-2.448h1.178c.929 0 1.682.753 1.682 1.682zm-4.295 7.738h2.613c.929 0 1.682-.753 1.682-1.682V5.58h2.783a.7.7 0 0 1 .682.716v4.294a4.197 4.197 0 0 1-4.093 4.293c-1.618-.04-3-.99-3.667-2.35Zm10.737-9.372a1.674 1.674 0 1 1-3.349 0 1.674 1.674 0 0 1 3.349 0m-2.238 9.488-.12-.002a5.2 5.2 0 0 0 .381-2.07V6.306a1.7 1.7 0 0 0-.15-.725h1.792c.39 0 .707.317.707.707v3.765a2.6 2.6 0 0 1-2.598 2.598z"></path>
                                        <path d="M.682 3.349h6.822c.377 0 .682.305.682.682v6.822a.68.68 0 0 1-.682.682H.682A.68.68 0 0 1 0 10.853V4.03c0-.377.305-.682.682-.682Zm5.206 2.596v-.72h-3.59v.72h1.357V9.66h.87V5.945z"></path>
                                    </svg>
                                </button>
                                <button onClick={() => acceptRequest(request._id)}>Accept</button>
                                <button onClick={() => deleteRequest(request._id)}>Decline</button>
                            </div>
                        </div>
                    ))}

                    <button className={styles.reload} onClick={() => reload()}>
                        <i className="fa-regular fa-rotate-right"></i>
                        Reload
                    </button>
                </div>

                <div className={styles.line}></div>
                
                <div>
                    <p>Sent</p>
                    {loading && Array.from({ length: 2 }).map((_, index) => <PlaceholderTemplate key={`sent_${index}`} />)}
                    {!loading && category.sent.length === 0 && <div className={styles.not_found}>
                        <img src="/not_found.png" alt="Owl" />
                        <p>No pending requests</p>
                    </div>}

                    {!loading && category.sent && category.sent.map((request, index) => (
                        <div className={`${styles.request} ${styles.sent}`} key={request._id} style={{ animationDelay: `${index * 0.2}s` }}>
                            <Student student={request.receiver_info} classes={styles.student_info} />

                            <div className={styles.request_info}>
                                <p>{request.module_info.module}</p>
                                <p>{dayNumberToName(request.day)} | {request.start_time} - {request.end_time}</p>
                                <p>End on {new Date(request.end_date).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}</p>
                            </div>

                            <div className={`${styles.request_button} ${styles.sent}`}>
                                <button>
                                    <i className="fa-regular fa-envelope" data-email onClick={() => window.open(`mailto:${request.receiver.student_id}@student.tp.edu.sg`, "_blank")}></i>
                                </button>
                                <button>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16" onClick={() => window.open(`https://teams.microsoft.com/l/chat/0/0?users=${request.receiver.student_id}@student.tp.edu.sg`, "_blank")}>
                                        <path d="M9.186 4.797a2.42 2.42 0 1 0-2.86-2.448h1.178c.929 0 1.682.753 1.682 1.682zm-4.295 7.738h2.613c.929 0 1.682-.753 1.682-1.682V5.58h2.783a.7.7 0 0 1 .682.716v4.294a4.197 4.197 0 0 1-4.093 4.293c-1.618-.04-3-.99-3.667-2.35Zm10.737-9.372a1.674 1.674 0 1 1-3.349 0 1.674 1.674 0 0 1 3.349 0m-2.238 9.488-.12-.002a5.2 5.2 0 0 0 .381-2.07V6.306a1.7 1.7 0 0 0-.15-.725h1.792c.39 0 .707.317.707.707v3.765a2.6 2.6 0 0 1-2.598 2.598z"></path>
                                        <path d="M.682 3.349h6.822c.377 0 .682.305.682.682v6.822a.68.68 0 0 1-.682.682H.682A.68.68 0 0 1 0 10.853V4.03c0-.377.305-.682.682-.682Zm5.206 2.596v-.72h-3.59v.72h1.357V9.66h.87V5.945z"></path>
                                    </svg>
                                </button>
                                <button onClick={() => navigate(`/session/edit/${request._id}`)}>Edit</button>
                                <button onClick={() => deleteRequest(request._id)}>Withdraw</button>
                            </div>
                        </div>
                    ))}

                    <button className={styles.reload} onClick={() => reload()}>
                        <i className="fa-regular fa-rotate-right"></i>
                        Reload
                    </button>
                </div>
            </div >
        </>
    );
}

export default PendingPage