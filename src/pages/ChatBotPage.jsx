import { useEffect, useRef, useState } from "react";
import { useUser } from "../general/UserContext";
import api from "../general/Request";
import showMessage from "../general/Message";
import Placeholder from "../general/Placeholder";
import ReactMarkdown from "react-markdown";
import styles from '../styles/chatbot.module.scss'

const ChatBot = () => {
    const { user } = useUser();
    const chatRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState(null);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const sendRequest = async (data) => {
        try {
            setInput(null);
            setLoading(true);
            const { request } = api("post", `/account/ai`, data);
            const newMessage = await request;
            setMessages(prev => [...prev, { input: newMessage.data.reply, user: false }]);
            setLoading(false);
        } catch (err) {
            console.error(err);
            showMessage(err.data.message);
        }
    }

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!input || input.trim() === "") return;
        setMessages(prev => [...prev, { input, user: true }]);
        sendRequest({ message: input, history: [...messages, { input, user: true }] });
    }

    const suggestion = async (text) => {
        setMessages(prev => [...prev, { input: text, user: true }]);
        sendRequest({ message: text, history: [...messages, { input: text, user: true }] });
    }

    return (
        <>
            <div id="chat" className={styles.chat} ref={chatRef}>
                {messages.length !== 0 && <div className={styles.top}>
                    <i className="fa-regular fa-star-christmas"></i>
                    <p>TackleBot</p>
                </div>}

                {messages.length === 0 && <div className={styles.intro}>
                    <div className={styles.sublogo}>
                        <div className={styles.waves}>
                            <div className={styles.wave}></div>
                            <div className={styles.wave}></div>
                            <div className={styles.wave}></div>
                        </div>
                    </div>

                    <div className={styles.heading}>
                        <i className="fa-regular fa-star-christmas"></i>
                        <p>TackleBot</p>
                    </div>

                    <div className={styles.subheading}>Customised AI Companion just for you</div>

                    <div className={styles.suggestion}>
                        <p onClick={(e) => suggestion(e.target.textContent)}>Am I’m learning correctly?</p>
                        <p onClick={(e) => suggestion(e.target.textContent)}>Give me study tips</p>
                        <p onClick={(e) => suggestion(e.target.textContent)}>Give me 10 quiz questions based on what I have learnt</p>
                        <p onClick={(e) => suggestion(e.target.textContent)}>Help me break down each topic that i'm learning about</p>
                    </div>

                    <p className={styles.powered}>Powered by Gemini 2.5 Flash</p>
                </div>}

                {messages.map((message, index) => {
                    const isLast = index === messages.length - 1;

                    return (
                        <div
                            key={index}
                            className={message.user ? styles.user : styles.ai}
                            data-empty={!user.image}
                            data-last={isLast && !loading}
                            style={{
                                "--before-background": user.image
                                    ? `url(${user.image})`
                                    : "none",
                            }}
                        >
                            <div className={styles.text}>
                                <ReactMarkdown>{message.input}</ReactMarkdown>
                            </div>
                        </div>
                    );
                })}

                {loading && <div className={styles.ai} data-last={loading}>
                    <Placeholder width={200} height={60} />
                </div>}

                <section className={styles.input}>
                    <input
                        type="text"
                        value={input || ""}
                        id="chat_input"
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask TackleBot..."
                        onKeyDown={(e) => {
                            if (e.key === "Enter") onSubmit(e);
                        }}
                    />
                    <button onClick={onSubmit}></button>
                </section>
            </div>
        </>
    )
}

export default ChatBot
