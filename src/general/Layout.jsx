import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import axios from "redaxios";
import { useNavigate } from "react-router-dom";
import '../styles/icons.css';
import '../styles/general.css';
import { useEffect } from "react";
import REQ from "./Request";
import { useUser } from "./UserProvider";

const Layout = () => {
    const { setUser, setUserImage } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${REQ}/api/auth/verify`, { withCredentials: true });
                if (response.data.user) setUser(response.data.user);

                const response2 = await axios.get(`${REQ}/api/account/account-information?id=${response.data.user.student_id}`, { withCredentials: true });
                if (response2.data) setUserImage(response2.data.image);
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