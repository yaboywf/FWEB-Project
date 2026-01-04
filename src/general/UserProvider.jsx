import { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";

const UserContext = createContext(null);

export function UserProvider({ children }) {
	const [user, setUser] = useState({});
	const [userProficiencies, setUserProficiencies] = useState([]);

	return (
		<UserContext.Provider value={{ user, setUser, userProficiencies, setUserProficiencies}}>
			{children}
		</UserContext.Provider>
	);
}

export function useUser() {
	return useContext(UserContext);
}

UserProvider.propTypes = {
	children: PropTypes.node.isRequired,
};