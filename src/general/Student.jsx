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
            {student.image ? <img data-empty={!student.image} src={loading ? null : student.image || null} /> : <div data-placeholder className={styles.no_image}></div>}
            <div>
                {loading ? <Placeholder width={200} /> : <p data-year={student.year_of_study || "?"} title={`${student.name} (Y${student.year_of_study || "?"})`}>{student.name}</p>}
                {loading ? <Placeholder width={150} /> : <a href={`mailto:${student.student_id}@student.tp.edu.sg`} target="_blank" rel="noopener noreferrer">{student.student_id}@student.tp.edu.sg</a>}
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