export function getMemberInitial(username: string) {
	const initial = username.trim().charAt(0);
	return initial ? initial.toUpperCase() : "?";
}
