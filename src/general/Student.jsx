import Placeholder from "./Placeholder";
import styles from "../styles/student.module.scss";
import PropTypes from "prop-types";

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
            <div className={styles.student_details}>
                {student.image ? <img data-empty={!student.image} src={loading ? null : student.image || null} /> : <div data-placeholder className={styles.no_image}></div>}
                <div>
                    {loading ? <Placeholder width={200} /> : <p title={student.name}>{student.name}</p>}
                    {loading ? <Placeholder width={200} /> : <p title={student.diploma}>{student.diploma}</p>}
                </div>
            </div>
            <div className={styles.student_additional}>
                {loading ? <Placeholder width={100} /> : <p>{student.year_of_study || "?"} <span>Year</span></p>}
                {loading ? <Placeholder width={100} /> :
                    <div className={styles.rating}>
                        {[...Array(full)].map((_, i) => <i key={"f" + i} className="fa-solid fa-star"></i>)}
                        {half && <i className="fa-solid fa-star-half-stroke"></i>}
                        {[...Array(empty)].map((_, i) => <i key={"e" + i} className="fa-regular fa-star"></i>)}
                        <p><span>Rated by {student.rating?.length || 0} people</span></p>
                    </div>
                }
            </div>
        </div>
    )
}

Student.propTypes = {
    student: PropTypes.object,
    loading: PropTypes.bool,
    classes: PropTypes.string,
};

export default Student;