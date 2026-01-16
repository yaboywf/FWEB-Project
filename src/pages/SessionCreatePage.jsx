import { useState, useEffect, Fragment } from "react";
import styles from '../styles/session.module.scss'
import Student from "../general/Student";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { useUser } from "../general/UserContext";
import api from "../general/Request";
import showMessage from "../general/Message";

const StepIndicator = ({ step, currentStep }) => {
    const status =
        currentStep === step
            ? "active"
            : currentStep < step
                ? "inactive"
                : "complete";

    return (
        <div className={`${styles.step_indicator} ${styles[status]}`}>
            <div className={styles.step_indicator_inner}>
                {status === "complete" ? (
                    <svg
                        className={styles.check_icon}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                    >
                        <path
                            className={styles.check_path}
                            d="M5 13l4 4L19 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                ) : status === "active" ? (
                    <div className={styles.active_dot} />
                ) : (
                    <span className="step-number">{step}</span>
                )}
            </div>
        </div>
    );
}

const StepConnector = ({ isComplete }) => {
    return (
        <div className={styles.step_connector}>
            <div
                className={`${styles.step_connector_inner} ${isComplete ? styles.complete : ""}`}
            />
        </div>
    );
}


const SessionCreatePage = () => {
    const navigate = useNavigate();
    const { adminNum } = useParams();
    const [currentStep, setCurrentStep] = useState(1);
    const { userProficiencies, user } = useUser();
    const [pairAccountInfo, setPairAccountInfo] = useState({});
    const [pairMatchableModules, setPairMatchableModules] = useState([]);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, setValue, control, formState: { errors } } = useForm({
        defaultValues: {
            receiver_id: adminNum,
        }
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
                    const match = userProficiencies.find(
                        c => c.module_id?._id === p.module_id?._id
                    );
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
        if (!adminNum) return;
        const { request, abort } = api("get", `/account/information?id=${encodeURIComponent(adminNum.toUpperCase())}`);

        const getData = async () => {
            try {
                const resp = await request;
                setPairAccountInfo(resp.data);
                await fetchProficiencies(adminNum);

                setLoading(false);
            } catch (err) {
                console.error(err);
                showMessage("Failed to fetch user/pair information");
            }
        }

        getData();
        return () => abort();
    }, [userProficiencies, adminNum]);

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
        if (currentStep === 3) return navigate("/pending");
        if (currentStep !== 2) return setCurrentStep(prev => prev + 1)

        try {
            const { request, abort } = api("post", "/request/add", data);
            await request;
            setCurrentStep(3);
            return () => abort();
        } catch (err) {
            if (err.name === "AbortError") return;
            console.error(err);
            showMessage("Failed to create pair request");
        }
    };

    return (
        <>
            <div className={styles.step_indicators}>
                <StepIndicator step={1} currentStep={currentStep} />
                <StepConnector isComplete={currentStep > 1} />
                <StepIndicator step={2} currentStep={currentStep} />
                <StepConnector isComplete={currentStep > 2} />
                <StepIndicator step={3} currentStep={currentStep} />
            </div>

            <div className={styles.step_content}>
                {currentStep === 1 && (
                    <div className={styles.step_1}>
                        <i className="fa-regular fa-plane"></i>
                        <h3>Send a Pair Request to</h3>

                        <div className={styles.student}>
                            <Student student={pairAccountInfo} loading={loading}></Student>
                            <div className={styles.buttons}>
                                <button>
                                    <i className="fa-regular fa-envelope" data-email onClick={() => window.open(`mailto:${pairAccountInfo.student_id}@student.tp.edu.sg`, "_blank")}></i>
                                    Email
                                </button>
                                <button>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16" onClick={() => window.open(`https://teams.microsoft.com/l/chat/0/0?users=${pairAccountInfo.student_id}@student.tp.edu.sg`, "_blank")}>
                                        <path d="M9.186 4.797a2.42 2.42 0 1 0-2.86-2.448h1.178c.929 0 1.682.753 1.682 1.682zm-4.295 7.738h2.613c.929 0 1.682-.753 1.682-1.682V5.58h2.783a.7.7 0 0 1 .682.716v4.294a4.197 4.197 0 0 1-4.093 4.293c-1.618-.04-3-.99-3.667-2.35Zm10.737-9.372a1.674 1.674 0 1 1-3.349 0 1.674 1.674 0 0 1 3.349 0m-2.238 9.488-.12-.002a5.2 5.2 0 0 0 .381-2.07V6.306a1.7 1.7 0 0 0-.15-.725h1.792c.39 0 .707.317.707.707v3.765a2.6 2.6 0 0 1-2.598 2.598z"></path>
                                        <path d="M.682 3.349h6.822c.377 0 .682.305.682.682v6.822a.68.68 0 0 1-.682.682H.682A.68.68 0 0 1 0 10.853V4.03c0-.377.305-.682.682-.682Zm5.206 2.596v-.72h-3.59v.72h1.357V9.66h.87V5.945z"></path>
                                    </svg>
                                    MS Teams
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.step_2}>
                        <div>
                            <p data-label>Select a day</p>
                            <div className={styles.day}>
                                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                                    <Fragment key={i}>
                                        <input
                                            type="radio"
                                            id={d.toLowerCase()}
                                            value={i + 1}
                                            {...register("day", { required: "Please select a day", setValueAs: v => Number(v) })}
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
                                    <div key={m._id} data-selected={m._id === module_id} className={`${styles.module} ${(m.alreadyRequested || m.alreadyPaired) && styles.disabled}`} onClick={() => setValue("module_id", m.module_id?._id, { shouldValidate: true, shouldDirty: true })}>
                                        <i className="fa-regular fa-book"></i>
                                        <p>{m.module_id?.code}</p>
                                        <span>{m.module_id?.module}</span>
                                        <span data-tag={m.alreadyRequested || m.alreadyPaired}>{(m.alreadyRequested || m.alreadyPaired) && "Already requested or paired"}</span>
                                    </div>
                                ))}
                            </div>
                            {errors.module_id && <p className={styles.error}>{errors.module_id.message}</p>}
                        </div>
                    </form>
                )}

                {currentStep === 3 && (
                    <div className={styles.step_3}>
                        <svg
                            className={`${styles.check_icon} ${styles.confirm}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                        >
                            <path
                                className={styles.check_path}
                                d="M5 13l4 4L19 7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <h3>Pair Request Created!</h3>
                        <p>Now its just a matter of waiting for the other student to accept your request</p>
                    </div>
                )}

                <div className={styles.controls}>
                    <button onClick={() => {
                        if (currentStep === 1) navigate('/explore');
                        setCurrentStep(prev => currentStep > 1 ? prev - 1 : prev)
                    }}>
                        <i className="fa-regular fa-arrow-left"></i>
                        {currentStep === 1 ? "Cancel" : "Previous"}
                    </button>
                    <button onClick={handleSubmit(onSubmit)}>
                        {currentStep === 3 ? "Done" : "Next"}
                        <i className="fa-regular fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </>
    )
}

export default SessionCreatePage