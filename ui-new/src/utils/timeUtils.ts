export const formatTime = (time: string): string => {
    console.log(time)
    const date = new Date(time)
    const now = new Date()
    date.setSeconds(0)
    if (date.getDay() !== now.getDay() || date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) {
        return date.toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'})
    }
    return date.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})
}
