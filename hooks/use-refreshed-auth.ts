import { useEffect } from "react";

import { useAppPreferences } from "@/providers/app-preferences-provider";

export function useRefreshedAuth() {
	const auth = useAppPreferences();

	useEffect(() => {
		void auth.refreshAuth();
	}, [auth.refreshAuth]);

	return auth;
}
