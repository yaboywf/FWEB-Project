import '../styles/general.scss'
import PropTypes from "prop-types";

const Placeholder = ({ height=20, width=50 }) => {
    return (
        <div className='load_container' data-placeholder style={{ height: `${height}px`, width: `${width}px` }}>
            <div className='placeholder' />
        </div>
    )
}

Placeholder.propTypes = {
    height: PropTypes.number,
    width: PropTypes.number,
}

export default Placeholder