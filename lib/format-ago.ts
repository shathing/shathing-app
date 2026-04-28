export function formatAgo(value: string) {
	const date = new Date(value);
	const timestamp = date.getTime();

	if (Number.isNaN(timestamp)) return value;

	const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSeconds < 60) return "방금 전";
	if (diffMinutes < 60) return `${diffMinutes}분 전`;
	if (diffHours < 24) return `${diffHours}시간 전`;
	if (diffDays < 30) return `${diffDays}일 전`;

	return date.toLocaleDateString("ko-KR", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}
