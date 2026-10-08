package com.ajclassa.app.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.ajclassa.app.R
import com.ajclassa.app.ui.activities.MainActivity

object NotificationHelper {
    const val CH_GENERAL = "aj_general"
    const val CH_CHAT = "aj_chat"
    const val CH_HOMEWORK = "aj_homework"
    const val CH_ANNOUNCE = "aj_announce"

    fun ensureChannels(ctx: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        listOf(
            NotificationChannel(CH_GENERAL, "عام", NotificationManager.IMPORTANCE_DEFAULT),
            NotificationChannel(CH_CHAT, "الدردشة", NotificationManager.IMPORTANCE_HIGH),
            NotificationChannel(CH_HOMEWORK, "الواجبات", NotificationManager.IMPORTANCE_HIGH),
            NotificationChannel(CH_ANNOUNCE, "الإعلانات", NotificationManager.IMPORTANCE_HIGH)
        ).forEach { nm.createNotificationChannel(it) }
    }

    fun show(ctx: Context, channel: String, title: String, body: String, route: String = "", targetId: String = "", id: Int = System.currentTimeMillis().toInt()) {
        ensureChannels(ctx)
        val intent = Intent(ctx, MainActivity::class.java).apply {
            putExtra("route", route); putExtra("targetId", targetId)
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pi = PendingIntent.getActivity(ctx, id, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val n = NotificationCompat.Builder(ctx, channel)
            .setSmallIcon(R.drawable.ic_bell)
            .setContentTitle(title).setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setContentIntent(pi).setAutoCancel(true)
            .build()
        (ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(id, n)
    }
}
