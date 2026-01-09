import { useEffect, useState, useMemo } from "react";
import { useUser } from "../general/UserContext";
import Nav from "../general/Nav"
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
                <Placeholder width={300} />
                <Placeholder width={300} />
            </div>
            <div className={`${styles.request_button}`}>
                <Placeholder width={200} />
                <Placeholder width={200} />
            </div>
        </div>
    )
}

const PendingPage = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        const getData = async () => {
            const resp = await api.get(`/request/requests`);
            setRequests(resp.data);
            setLoading(false);
        }

        getData();
    }, [])

    const category = useMemo(() => {
        const received = requests.filter(request => request.receiver_id === user.student_id);
        const sent = requests.filter(request => request.sender_id === user.student_id);
        return { received, sent };
    }, [requests, user])

    const dayNumberToName = (day) => {
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        return days[day - 1] || null;
    }

    const deleteRequest = async (requestId) => {
        try {
            await api.delete(`/request/remove?id=${requestId}`);
            showMessage("Request deleted successfully", "success");
            setRequests(prev => prev.filter(request => request._id !== requestId));
        } catch (err) {
            console.error(err);
            showMessage("Failed to delete request");
        }
    }

    const acceptRequest = async (requestId) => {
        try {
            await api.put(`/request/update-status`, { id: requestId });
            showMessage("Request accepted successfully", "success");
            setRequests(prev => prev.filter(request => request._id !== requestId));
        } catch (err) {
            console.error(err);
            showMessage("Failed to accept request");
        }
    }

    return (
        <>
            <Nav active="pending" />

            <div className={styles.pending_container}>
                <div>
                    <p>Received</p>
                    {loading && Array.from({ length: 2 }).map((_, index) => <PlaceholderTemplate key={`received_${index}`} />)}
                    {!loading && category.received.length === 0 && <p>No pending requests</p>}
                    {category.received && category.received.map(request => (
                        <div className={styles.request} key={request._id}>
                            <Student student={request.sender_info} classes={styles.student_info} />
                            <div className={styles.request_info}>
                                <p>{request.module_info.module}</p>
                                <p>{dayNumberToName(request.day)} | {request.start_time} - {request.end_time}</p>
                                <p>End on {new Date(request.end_date).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}</p>
                            </div>
                            <div className={`${styles.request_button} ${styles.received}`}>
                                <button onClick={() => acceptRequest(request._id)}>Accept</button>
                                <button onClick={() => deleteRequest(request._id)}>Decline</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className={styles.line}></div>
                <div>
                    <p>Sent</p>
                    {loading && Array.from({ length: 2 }).map((_, index) => <PlaceholderTemplate key={`sent_${index}`} />)}
                    {!loading && category.sent.length === 0 && <p>No pending requests</p>}
                    {category.sent && category.sent.map(request => (
                        <div className={styles.request} key={request._id}>
                            <Student student={request.receiver_info} classes={styles.student_info} />
                            <div className={styles.request_info}>
                                <p>{request.module_info.module}</p>
                                <p>{dayNumberToName(request.day)} | {request.start_time} - {request.end_time}</p>
                                <p>End on {new Date(request.end_date).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}</p>
                            </div>
                            <div className={`${styles.request_button} ${styles.sent}`}>
                                <button onClick={() => navigate(`/session?pairId=${request._id}`)}>Edit</button>
                                <button onClick={() => deleteRequest(request._id)}>Withdraw</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div >
        </>
    );
}

export default PendingPage