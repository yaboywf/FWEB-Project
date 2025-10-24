import Placeholder from "./Placeholder";
import styles from "../styles/student.module.scss";

const Student = ({ student = {}, loading = false, classes = "" }) => {
    const ratingArray = student.rating?.length
        ? student.rating.reduce((a, b) => a + b, 0) / student.rating.length
        : 0;
    const rounded = Math.round((ratingArray || 0) * 2) / 2;
    const full = Math.floor(rounded);
    const half = rounded % 1 !== 0;
    const empty = 5 - full - (half ? 1 : 0);

    return (
        <div className={styles.student_info + " " + classes}>
            <img src={
                loading
                    ? null
                    : student.image
                        ? student.image
                        : "favicon.webp"
            } />
            <div>
                {loading ? <Placeholder width={200} /> : <p data-year={student.year_of_study || "?"}>{student.name}</p>}
                {loading ? <Placeholder width={150} /> : <a href={`https://teams.microsoft.com/l/chat/0/0?users=${student.student_id}@student.tp.edu.sg`} target="_blank" rel="noopener noreferrer">{student.student_id}@student.tp.edu.sg</a>}
                {loading ? <Placeholder width={200} /> : <p>{student.diploma}</p>}
                {loading ? <Placeholder width={100} /> :
                    <span className={styles.rating}>
                        {[...Array(full)].map((_, i) => <i key={"f" + i} className="fa-solid fa-star"></i>)}
                        {half && <i className="fa-solid fa-star-half-stroke"></i>}
                        {[...Array(empty)].map((_, i) => <i key={"e" + i} className="fa-regular fa-star"></i>)}
                        <span>{ratingArray.toFixed(1) || "0"}/5.0</span>
                    </span>
                }
            </div>
        </div>
    )
}

export default Student;