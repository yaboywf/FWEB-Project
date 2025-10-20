import '../styles/error.css'
import '../styles/general.css'

const NotFound = () => {
    return (
        <div className="error_page">
            <img src="logo.webp" alt="Logo" />
            <h1>Oops! Page not found.</h1>
            <p>We searched high and low but couldn&apos;t find what you&apos;re looking for</p>
            <p><a href="/explore">Return to home</a></p>
        </div>
    )   
}

export default NotFound