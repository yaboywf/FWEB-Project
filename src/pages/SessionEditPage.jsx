import { Fragment, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { useUser } from "../general/UserContext";
import api from "../general/Request";
import showMessage from "../general/Message";
import styles from '../styles/session.module.scss'

const SessionPage = () => {
    const navigate = useNavigate();
    const { pairId } = useParams();
    const { userProficiencies, user } = useUser();

    const [pairMatchableModules, setPairMatchableModules] = useState([]);
    const { register, handleSubmit, setValue, control, reset, formState: { errors }, } = useForm({
        defaultValues: {
            day: "",
            start_time: "",
            end_time: "",
            end_date: "",
            module_id: "",
        },
    });
    const values = useWatch({ control });
    const { start_time, end_time, day, end_date, module_id } = values;

    const fetchProficiencies = async (adminNum) => {
        try {
            const r1 = api(
                "get",
                `/proficiency/user-proficiency?id=${encodeURIComponent(adminNum.toUpperCase())}`
            );
            const r2 = api("get", "/pair/pairs");
            const r3 = api("get", "/request/requests");

            const [resp, resp2, resp3] = await Promise.all([
                r1.request,
                r2.request,
                r3.request,
            ]);

            const today = new Date();

            const merged = resp.data
                .filter(p => {
                    const match = userProficiencies.find(c => c.module_id?._id === p.module_id?._id);
                    return match && match.type !== p.type;
                })
                .map(p => {
                    const existingPair = resp2.data.find(pair =>
                        pair.sender_id === user.student_id &&
                        pair.receiver_id === adminNum.toUpperCase() &&
                        String(pair.module_id) === String(p.module_id?._id) &&
                        new Date(pair.end_date) >= today
                    );

                    const alreadyRequested = resp3.data.find(req => {
                        const isBetweenUsers =
                            (req.sender_id === user.student_id &&
                                req.receiver_id === adminNum.toUpperCase()) ||
                            (req.sender_id === adminNum.toUpperCase() &&
                                req.receiver_id === user.student_id);

                        return (
                            isBetweenUsers &&
                            String(req.module_id) === String(p.module_id?._id)
                        );
                    });

                    return {
                        ...p,
                        alreadyPaired: Boolean(existingPair),
                        alreadyRequested: Boolean(alreadyRequested),
                    };
                });

            setPairMatchableModules(merged);

            return () => {
                r1.abort();
                r2.abort();
                r3.abort();
            };

        } catch (err) {
            if (err.name !== "AbortError") {
                console.error(err);
                showMessage("Failed to fetch user proficiency");
            }
        }
    };

    useEffect(() => {
        const getData = async () => {
            try {
                const { request } = api("get", `/request/sent?id=${encodeURIComponent(pairId)}`);
                const resp = await request
                await fetchProficiencies(resp.data.receiver_info.student_id);

                reset({
                    module_id: resp.data.module_id,
                    day: String(resp.data.day),
                    start_time: resp.data.start_time,
                    end_time: resp.data.end_time,
                    end_date: resp.data.end_date?.split("T")[0] || "",
                });
            } catch (err) {
                console.error(err);
                showMessage("Failed to fetch user/pair information");
            }
        }

        getData();
    }, [userProficiencies]);

    const getDuration = () => {
        if (!start_time || !end_time) return "0";

        const [sh, sm] = start_time.split(":").map(Number);
        const [eh, em] = end_time.split(":").map(Number);

        const diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff <= 0) return "0";

        return (diff / 60).toFixed(1);
    };


    const countWeekdaysUntil = () => {
        if (!day || !end_date) return 0;

        const today = new Date();
        const end = new Date(end_date);

        today.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (end < today) return 0;

        const targetDay = Number(day) === 7 ? 0 : Number(day);

        let count = 0;
        const current = new Date(today);
        current.setDate(current.getDate() + 1);

        while (current <= end) {
            if (current.getDay() === targetDay) count++;
            current.setDate(current.getDate() + 1);
        }

        return count;
    };

    const onSubmit = async (data) => {
        const formattedData = { ...data, id: pairId };

        try {
            const { request } = api("put", '/request/update-details', formattedData);
            const resp = await request;
            showMessage(resp.data.message, "success");
            navigate("/explore");
        } catch (err) {
            if (err.name === "AbortError") return;
            console.error(err);
            showMessage("Failed to create request");
        }
    }

    return (
        <>
            <form className={`${styles.step_2} ${styles.edit_form}`} noValidate onSubmit={handleSubmit(onSubmit)}>
                <div>
                    <p data-label>Select a day</p>
                    <div className={styles.day}>
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                            <Fragment key={i}>
                                <input
                                    type="radio"
                                    id={d.toLowerCase()}
                                    value={i + 1}
                                    {...register("day", { required: "Please select a day" })}
                                />
                                <label htmlFor={d.toLowerCase()}>{d}</label>
                            </Fragment>
                        ))}
                    </div>
                    {errors.day && <p className={styles.error}>{errors.day.message}</p>}
                </div>

                <div>
                    <label htmlFor="start_time">From</label>
                    <input
                        type="time"
                        id="start_time"
                        {...register("start_time", { required: "Please select a start time" })}
                    />
                    {errors.start_time && <p className={styles.error}>{errors.start_time.message}</p>}
                </div>

                <div>
                    <label htmlFor="end_time">To</label>
                    <input
                        type="time"
                        id="end_time"
                        min={start_time}
                        {...register("end_time", {
                            required: "Please select an end time",
                            validate: value =>
                                !start_time || value > start_time || "End time must be after start time",
                        })}
                    />
                    {errors.end_time && <p className={styles.error}>{errors.end_time.message}</p>}
                </div>

                <div>
                    <label htmlFor="end_date">End this pair on</label>
                    <input
                        type="date"
                        id="end_date"
                        min={new Date().toISOString().split("T")[0]}
                        {...register("end_date", {
                            required: "Please select an end date",
                            validate: value => {
                                if (!value) return true;

                                const selected = new Date(value);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                return (
                                    selected >= today || "End date must be today or later"
                                );
                            },
                        })}
                    />
                    {errors.end_date && <p className={styles.error}>{errors.end_date.message}</p>}
                </div>

                <div>
                    <p data-label>Duration</p>
                    <p style={{ fontSize: 13 }}>{getDuration()}h per session | {countWeekdaysUntil()} sessions</p>
                </div>

                <div className={styles.modules}>
                    <p data-label>Select Module</p>
                    <input
                        type="hidden"
                        {...register("module_id", { required: "Please select a module" })}
                    />
                    <div>
                        {pairMatchableModules.map(m => (
                            <div key={m._id} data-selected={m.module_id._id === module_id} className={`${styles.module} ${((m.alreadyRequested || m.alreadyPaired) && !module_id) && styles.disabled}`} onClick={() => setValue("module_id", m.module_id?._id, { shouldValidate: true, shouldDirty: true })}>
                                <i className="fa-regular fa-book"></i>
                                <p>{m.module_id?.code}</p>
                                <span>{m.module_id?.module}</span>
                                <span data-tag={(m.alreadyRequested || m.alreadyPaired) && !module_id}>{((m.alreadyRequested || m.alreadyPaired) && !module_id) && "Already requested or paired"}</span>
                            </div>
                        ))}
                    </div>
                    {errors.module_id && <p className={styles.error}>{errors.module_id.message}</p>}
                </div>

                <button onClick={() => navigate(-1)} type="button">Back</button>
                <button>Update</button>
            </form>
        </>
    )
}

export default SessionPage
