export const formatTime = (time: string): string => {
    const date = new Date(time)
    const now = new Date()
    date.setSeconds(0)
    if (date.getDay() !== now.getDay() || date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) {
        return date.toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'})
    }
    return date.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})
}

export const formatAsHourMinute = (time: string) => {
    const timeObj = new Date(time)
    // Extract hours and minutes
    let hours = timeObj.getHours();
    let minutes = timeObj.getMinutes();

// Ensure the hours and minutes are always two digits
    let hoursString = hours < 10 ? '0' + hours : hours;
    let minutesString = minutes < 10 ? '0' + minutes : minutes;
    return `${hoursString}:${minutesString}`
}