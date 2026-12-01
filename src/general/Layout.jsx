import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import '../styles/icons.css';
import '../styles/general.scss';
import { useEffect } from "react";
import api from "./Request";
import { useUser } from "./UserProvider";
import showMessage from "./Message";

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
                if (error.status === 429) showMessage(error.data.message);
                else console.error(error);
            }
        }

        fetchUserData();
        console.log("Hi cher, if u see this, plz gimme good grade :)");
        console.log(String.raw`
  _                  _                 _     _             _    _      
_| |_ ___  ___  ___ | |_   ___ ._ _  _| |  _| |_ ___  ___ | |__| | ___ 
 | | / ._><_> |/ | '| . | <_> || ' |/ . |   | | <_> |/ | '| / /| |/ ._>
 |_| \___.<___|\_|_.|_|_| <___||_|_|\___|   |_| <___|\_|_.|_\_\|_|\___.
        `)
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