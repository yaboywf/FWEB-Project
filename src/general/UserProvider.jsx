import { useState } from "react";
import { UserContext } from "./UserContext";

export function UserProvider({ children }) {
	const [user, setUser] = useState({});
	const [userProficiencies, setUserProficiencies] = useState([]);

	return (
		<UserContext.Provider value={{ user, setUser, userProficiencies, setUserProficiencies}}>
			{children}
		</UserContext.Provider>
	);
}