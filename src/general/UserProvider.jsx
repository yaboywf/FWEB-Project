import { createContext, useContext, useState } from "react";

const UserContext = createContext(null);

export function UserProvider({ children }) {
	const [user, setUser] = useState({});
	const [userImage, setUserImage] = useState(null);
	const [userProficiencies, setUserProficiencies] = useState([]);

	return (
		<UserContext.Provider value={{ user, setUser, userImage, setUserImage, userProficiencies, setUserProficiencies}}>
			{children}
		</UserContext.Provider>
	);
}

export function useUser() {
	return useContext(UserContext);
}