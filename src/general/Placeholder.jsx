import '../styles/general.css'

const Placeholder = ({ height=20, width=50 }) => {
    return (
        <div className='load_container' data-placeholder style={{ height: `${height}px`, width: `${width}px` }}>
            <div className='placeholder' />
        </div>
    )
}

export default Placeholder