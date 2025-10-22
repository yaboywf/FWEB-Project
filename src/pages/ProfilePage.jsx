import Nav from "../general/Nav"
import REQ from "../general/Request"
import styles from '../styles/profile.module.css'
import { useUser } from "../general/UserProvider"
import axios from "redaxios"
import { useEffect, useState, useMemo } from "react"
import showMessage from "../general/Message"
import { useNavigate, useLocation } from "react-router-dom"

const ProfilePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, setUser, userImage, setUserImage, userProficiencies, setUserProficiencies } = useUser();
    const [allProficiencies, setAllProficiencies] = useState([]);
    const [image, setImage] = useState(userImage || "favicon.webp");
    const [year, setYear] = useState(user.year_of_study || 1);
    const [diploma, setDiploma] = useState(user.diploma || "");

    useEffect(() => {
        if (location.hash) {
            const el = document.querySelector(location.hash);
            if (el) el.scrollIntoView({ behavior: "smooth" });
        }
    }, [location]);

    useEffect(() => {
        setYear(user.year_of_study);
        setDiploma(user.diploma);
        setImage(userImage || "favicon.webp");
    }, [user.year_of_study, user.diploma, userImage]);

    useEffect(() => {
        axios.get(`${REQ}/api/proficiency/all-modules`, { withCredentials: true })
            .then(res => setAllProficiencies(res.data))
            .catch(err => console.error(err));
    }, []);

    const category = useMemo(() => {
        return userProficiencies.reduce((acc, proficiency) => {
            if (!acc[proficiency.type]) acc[proficiency.type] = [];
            acc[proficiency.type].push(proficiency);
            return acc;
        }, {});
    }, [userProficiencies]);

    const availableModules = useMemo(() => {
        if (!userProficiencies || !allProficiencies) return [];
        const existingIds = new Set(userProficiencies.map(p => p.module_id?._id?.toString()));
        return allProficiencies.filter(m => !existingIds.has(m._id?.toString()));
    }, [userProficiencies, allProficiencies]);

    const toBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    }

    const changeProfilePicture = async (e) => {
        const file = e.target.files[0];
        const base64File = await toBase64(file);
        setImage(base64File);
    }

    const logout = async (needMessage = true) => {
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=None; Secure;";
        setUserProficiencies(null);
        setUserImage(null);
        setUser(null);
        if (needMessage) showMessage("Logged out successfully", "success");
        navigate("/");
    }

    const changePassword = async (e) => {
        e.preventDefault();

        const form = new FormData(e.target);
        const formObject = Object.fromEntries(form);
        if (!formObject.current_password) return showMessage("Please enter your current password", "error");
        if (!formObject.new_password) return showMessage("Please enter your new password", "error");
        if (!formObject.confirm_password) return showMessage("Please confirm your new password", "error");
        if (formObject.new_password !== formObject.confirm_password) return showMessage("Passwords do not match", "error");

        try {
            await axios.post(`${REQ}/api/account/change-password`, formObject, { withCredentials: true });
            showMessage("Password changed successfully", "success");
            showMessage("Please login with your new password", "success");
            logout();
        } catch (err) {
            console.error(err);
            showMessage(err.data.message);
        }
    }

    const addProficiency = async (e, type) => {
        e.preventDefault();
        if (e.target.value === "") return
        try {
            const resp = await axios.post(`${REQ}/api/proficiency/add`, { id: e.target.value, type }, { withCredentials: true });
            showMessage("Proficiency added successfully", "success");
            setUserProficiencies(prev => [...prev, resp.data.proficiency]);
            e.target.value = "";
        } catch (err) {
            console.error(err);
            showMessage(err.data.message);
        }
    }

    const deleteProficiency = async (id) => {
        try {
            await axios.delete(`${REQ}/api/proficiency/remove?id=${id}`, { withCredentials: true });
            showMessage("Proficiency deleted successfully", "success");
            setUserProficiencies(prev => prev.filter(p => p._id.toString() !== id));
        } catch (err) {
            console.error(err);
            showMessage(err.data.message);
        }
    }

    const updateProfile = async (e) => {
        try {
            e.preventDefault();
            if (!e.target.checkValidity()) return;

            const data = {
                diploma,
                year_of_study: year
            }

            if (image !== userImage) data.image = image;
            await axios.put(`${REQ}/api/account/update`, data, { withCredentials: true });
            setUser(prev => ({ ...prev, ...data }))
            setUserImage(image);
            showMessage("Profile updated successfully. Please login again to see the changes.", "success");
            logout(false);
        } catch (err) {
            console.error(err);
            showMessage(err.data.message);
        }
    }

    return (
        <>
            <Nav active="" />

            <div className={styles.profile_container}>
                <form id="general_form" noValidate onSubmit={updateProfile}>
                    <h2>User Information</h2>
                    <div>
                        <input type="file" name="profile_picture" id="profile_picture" accept="image/*" onChange={changeProfilePicture} />
                        <label htmlFor="profile_picture" id="profile_picture_label" style={{ background: `url(${image}) center/cover no-repeat` }}></label>

                        <p>Name:</p>
                        <p>{user.name}</p>
                        <p>Admission Number:</p>
                        <p>{user.student_id}</p>

                        <label htmlFor="diploma">Diploma</label>
                        <input type="text" name="diploma" id="diploma" placeholder="Enter Your Diploma" autoComplete="off" value={diploma || ""} onChange={(e) => setDiploma(e.target.value)} required />

                        <p>Year of Study</p>
                        <div>
                            <input type="radio" name="year" id="y1" required onChange={() => setYear(1)} checked={year === 1} />
                            <label htmlFor="y1">Year 1</label>
                            <input type="radio" name="year" id="y2" required onChange={() => setYear(2)} checked={year === 2} />
                            <label htmlFor="y2">Year 2</label>
                            <input type="radio" name="year" id="y3" required onChange={() => setYear(3)} checked={year === 3} />
                            <label htmlFor="y3">Year 3</label>
                        </div>
                    </div>
                    <button type="submit">Save</button>
                    <button type="button" onClick={logout}>Logout</button>
                </form>

                <div>
                    <h2 id="modules_proficiency">Modules Proficiency</h2>
                    <h3>Mentor Others</h3>
                    <div className={styles.profile_proficiency}>
                        {category[1] && category[1].length !== 0 && category[1].map(proficiency => (
                            <span key={proficiency._id} onClick={() => deleteProficiency(proficiency._id)}>{proficiency.module_id.module}</span>
                        ))}
                        <select id="new_strength" defaultValue="" onChange={(e) => addProficiency(e, 1)}>
                            <option value="" disabled hidden>Select Module</option>
                            {availableModules.map(module => (
                                <option key={module._id} value={module._id}>{module.module}</option>
                            ))}
                        </select>
                    </div>

                    <h3>Knowledge Wishlist</h3>
                    <div className={styles.profile_proficiency}>
                        {category[2] && category[2].length !== 0 && category[2].map(proficiency => (
                            <span key={proficiency._id} onClick={() => deleteProficiency(proficiency._id)}>{proficiency.module_id.module}</span>
                        ))}
                        <select value={""} id="new_weakness" onChange={(e) => addProficiency(e, 2)}>
                            <option value="" disabled hidden>Select Module</option>
                            {availableModules.map(module => (
                                <option key={module._id} value={module._id}>{module.module}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <form id="password_form" noValidate onSubmit={changePassword}>
                    <h2>Change Password</h2>
                    <div>
                        <input type="text" name="username" id="username" hidden autoComplete="username" />
                        <label htmlFor="current_password">Current Password</label>
                        <input type="password" name="current_password" id="current_password" placeholder="Enter Current Password" autoComplete="current-password" />
                        <label htmlFor="new_password">New Password</label>
                        <input type="password" name="new_password" id="new_password" placeholder="Enter New Password" autoComplete="new-password" />
                        <label htmlFor="confirm_password">Confirm Password</label>
                        <input type="password" name="confirm_password" id="confirm_password" placeholder="Confirm New Password" autoComplete="off" />
                    </div>

                    <button type="submit">Save</button>
                </form>
            </div>
        </>
    )
}

export default ProfilePage