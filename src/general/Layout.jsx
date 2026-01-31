import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import '../styles/icons.css';
import '../styles/general.scss';
import { useEffect } from "react";
import api from "./Request";
import { useUser } from "./UserContext";
import showMessage from "./Message";

const Layout = () => {
    const { setUser } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        const { request, abort } = api('get', `/auth/verify`);

        const fetchUserData = async () => {
            try {
                const response = await request;
                if (response.data) setUser(response.data);
            } catch (error) {
                if (error.status === 401) navigate("/");
                if (error.status === 429) showMessage(error.data.message);
                else console.error(error);
            }
        }

        fetchUserData();
        console.log(String.raw`
  _                  _                 _     _             _    _      
_| |_ ___  ___  ___ | |_   ___ ._ _  _| |  _| |_ ___  ___ | |__| | ___ 
 | | / ._><_> |/ | '| . | <_> || ' |/ . |   | | <_> |/ | '| / /| |/ ._>
 |_| \___.<___|\_|_.|_|_| <___||_|_|\___|   |_| <___|\_|_.|_\_\|_|\___.
        `)

        return abort;
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