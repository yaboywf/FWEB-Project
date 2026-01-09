import { Component } from "react";
import "../styles/general.scss";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorMessage: "", errorStack: "" };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, errorMessage: error.message };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);
        this.setState({ errorStack: error?.stack || "" });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className='error_page'>
                    <img src="error.png" alt="An Error Has Occurred" width={"200px"} height={"200px"}/>
                    <h2>An Error Has Occurred</h2>
                    <p>Please notify the developer and try again later</p>
                    <br />
                    {this.state.errorMessage && <pre>{this.state.errorMessage}</pre>}
                    {this.state.errorStack && <pre>{this.state.errorStack}</pre>}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
