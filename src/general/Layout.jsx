import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import '../styles/icons.css';
import '../styles/general.scss';
import { useEffect, useState, useRef } from "react";
import api from "./Request";
import { useUser } from "./UserProvider";
import showMessage from "./Message";
import ReactMarkdown from "react-markdown";
import Placeholder from "./Placeholder";

const Layout = () => {
    const { setUser, user } = useUser();
    const navigate = useNavigate();
    const chatRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState(null);
    const [aiVisible, setAiVisible] = useState(false);
    const [loading, setLoading] = useState(false);

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

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!input || input.trim() === "") return;
        try {
            setMessages(prev => [...prev, { input, user: true }]);
            setInput(null);
            setLoading(true);
            const newMessage = await api.post(`/account/ai`, { message: input, history: [...messages, { input, user: true }] });
            setMessages(prev => [...prev, { input: newMessage.data.reply, user: false }]);
            setLoading(false);
        } catch (err) {
            console.error(err);
            showMessage(err.data.message);
        }
    }

    const suggestion = async (text) => {
        try {
            setMessages(prev => [...prev, { input: text, user: true }]);
            setInput(null);
            setLoading(true);
            const newMessage = await api.post(`/account/ai`, { message: text, history: [...messages, { input: text, user: true }] });
            setMessages(prev => [...prev, { input: newMessage.data.reply, user: false }]);
            setLoading(false);
        } catch (err) {
            console.error(err);
            showMessage(err.data.message);
        }
    }

    return (
        <>
            <div className="error_container"></div>
            <Sidebar />
            <main>
                <Outlet />
            </main>
            {user && <div id="chat" className={`chat ${aiVisible ? "visible" : ""}`} ref={chatRef}>
                <div>
                    <p>TackleBot</p>
                    <i className="fa-solid fa-xmark" onClick={() => setAiVisible(!aiVisible)}></i>
                </div>

                {messages.map((message, index) => (
                    <div key={index} className={message.user ? "user" : "ai"} data-empty={!user.image} style={{  "--before-background": user.image ? `url(${user.image})` : "none" }}>
                        <div className="text">
                            <ReactMarkdown>{message.input}</ReactMarkdown>
                        </div>
                    </div>
                ))}

                {loading && <div className="ai">
                    <Placeholder width={200} height={60} />    
                </div>}

                {messages.length === 0 && <div className="suggestion">
                    <p onClick={(e) => suggestion(e.target.textContent)}>Am I’m learning correctly?</p>
                    <p onClick={(e) => suggestion(e.target.textContent)}>Give me study tips</p>
                    <p onClick={(e) => suggestion(e.target.textContent)}>Give me 10 quiz questions</p>
                    <p onClick={(e) => suggestion(e.target.textContent)}>Help me break down this chapter</p>
                </div>}

                <section>
                    <input type="text" value={input || ""} onChange={(e) => setInput(e.target.value)} placeholder="Ask TackleBot..." />
                    <button onClick={onSubmit}></button>
                </section>
            </div>}

            <div className="ai_icon" onClick={() => setAiVisible(!aiVisible)}></div>
        </>
    )
}

export default Layout;