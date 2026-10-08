package com.ajclassa.app.utils

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

object TimeUtils {
    fun fmtTime(ts: Long): String = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(ts))
    fun fmtDate(ts: Long): String = SimpleDateFormat("EEEE d MMMM", Locale("ar")).format(Date(ts))
    fun fmtDateTime(ts: Long): String = SimpleDateFormat("d MMM • HH:mm", Locale("ar")).format(Date(ts))
    fun dayKey(ts: Long = System.currentTimeMillis()): String =
        SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(ts))

    fun lastSeenLabel(lastSeen: Long, online: Boolean): String {
        if (online) return "متصل الآن 🟢"
        if (lastSeen <= 0) return "آخر ظهور غير معروف"
        val diff = System.currentTimeMillis() - lastSeen
        val min = TimeUnit.MILLISECONDS.toMinutes(diff)
        if (min < 1) return "آخر ظهور الآن"
        if (min < 60) return "آخر ظهور منذ $min د"
        val h = TimeUnit.MILLISECONDS.toHours(diff)
        if (h < 24) return "آخر ظهور منذ $h س"
        return "آخر ظهور " + fmtDate(lastSeen)
    }

    fun countdown(to: Long): String {
        val d = to - System.currentTimeMillis()
        if (d <= 0) return "انتهى الوقت"
        val h = TimeUnit.MILLISECONDS.toHours(d)
        val m = TimeUnit.MILLISECONDS.toMinutes(d) % 60
        return if (h > 0) "متبقي $h س و $m د" else "متبقي $m دقيقة"
    }

    fun todayRange(): Pair<Long, Long> {
        val c = Calendar.getInstance()
        c.set(Calendar.HOUR_OF_DAY, 0); c.set(Calendar.MINUTE, 0); c.set(Calendar.SECOND, 0); c.set(Calendar.MILLISECOND, 0)
        val s = c.timeInMillis
        c.add(Calendar.DAY_OF_MONTH, 1)
        return s to c.timeInMillis
    }
}
