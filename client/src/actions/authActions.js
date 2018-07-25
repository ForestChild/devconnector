import axios from "axios";
import setAuthToken from "../utils/setAuthToken";
import jwt_decode from "jwt-decode";

import { GET_ERRORS, SET_CURRENT_USER } from "./types";

//Register user
export const registerUser = (userData, history) => dispatch => {
	// return {
	// 	type: TEST_DISPATCH,
	// 	payload: userData
	// }
	axios
		.post("/api/users/register", userData)
		.then(res => history.push("/login"))
		//dispatch allows us to make an asynchronous backend call (thunk)
		.catch(err =>
			dispatch({
				type: GET_ERRORS,
				payload: err.response.data
			})
		);
};

//Login user
export const loginUser = userData => dispatch => {
	axios.post("/api/users/login", userData)
	.then(res => {
		//Save to local storage
		const { token } = res.data;
		//Set token to local storage
		localStorage.setItem('jwtToken', token);
		//Set token to auth header
		setAuthToken(token);
		//Decode token to get user data
		const decoded = jwt_decode(token);
		//Set curren user
		dispatch(setCurrentUser(decoded));
	})
	.catch(err => 
		dispatch({
			type: GET_ERRORS,
			payload: err.response.data
		})
	);
};

//Set logged in user
export const setCurrentUser = (decoded) => {
	return {
		type: SET_CURRENT_USER,
		payload: decoded
	}
}