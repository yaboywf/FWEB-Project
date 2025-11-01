import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import '../styles/icons.css';
import '../styles/general.scss';
import { useEffect } from "react";
import api from "./Request";
import { useUser } from "./UserProvider";

const Layout = () => {
    const { setUser } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get('/auth/verify');
                if (response.data.user) setUser(response.data.user);
            } catch (error) {
                if (error.status === 401) navigate("/");
                else console.error(error);
            }
        }

        fetchUserData();
    }, [])

    return (
        <>
            <div className="error_container"></div>
            <Sidebar />
            <main>
                <Outlet />
            </main>
        </>
    )
}

export default Layout;