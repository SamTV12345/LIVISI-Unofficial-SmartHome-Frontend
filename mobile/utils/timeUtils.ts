export const formatTime = (isoTime: string): string => {
    const date = new Date(isoTime);
    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    const now = new Date();
    const sameDay =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    if (!sameDay) {
        return date.toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    return date.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit"
    });
};

export const formatAsHourMinute = (isoTime: string): string => {
    const date = new Date(isoTime);
    if (Number.isNaN(date.getTime())) {
        return "--:--";
    }

    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};
