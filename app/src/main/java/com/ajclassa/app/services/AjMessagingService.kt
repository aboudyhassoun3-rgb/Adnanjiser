package com.ajclassa.app.services

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.ajclassa.app.data.repositories.FirebaseRefs
import com.ajclassa.app.notifications.NotificationHelper
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class AjFirebaseMessagingService : FirebaseMessagingService() {
    override fun onMessageReceived(msg: RemoteMessage) {
        val title = msg.notification?.title ?: msg.data["title"] ?: "AJ Class A"
        val body = msg.notification?.body ?: msg.data["body"] ?: ""
        val kind = msg.data["kind"] ?: "general"
        val channel = when (kind) {
            "message", "reply", "mention" -> NotificationHelper.CH_CHAT
            "homework", "exam", "schedule", "reminder" -> NotificationHelper.CH_HOMEWORK
            "announcement" -> NotificationHelper.CH_ANNOUNCE
            else -> NotificationHelper.CH_GENERAL
        }
        NotificationHelper.show(this, channel, title, body, msg.data["route"] ?: "", msg.data["targetId"] ?: "")
        // Mirror into in-app Notification Center (best effort)
        try {
            val uid = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid ?: return
            FirebaseRefs.notifications().add(
                com.ajclassa.app.data.models.NotificationItem(
                    userId = uid, kind = kind, title = title, body = body,
                    targetRoute = msg.data["route"] ?: "", targetId = msg.data["targetId"] ?: "",
                    createdAt = System.currentTimeMillis()
                )
            )
        } catch (_: Exception) {}
    }
    override fun onNewToken(token: String) {
        try {
            val uid = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid ?: return
            FirebaseRefs.users().document(uid).update("fcmTokens", com.google.firebase.firestore.FieldValue.arrayUnion(token))
        } catch (_: Exception) {}
    }
}

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        NotificationHelper.show(ctx, NotificationHelper.CH_HOMEWORK,
            intent.getStringExtra("title") ?: "تذكير",
            intent.getStringExtra("body") ?: "")
    }
}

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // Reminders are re-scheduled from Notes on next app start (offline-first cache).
        }
    }
}

class PresenceService : android.app.Service() {
    override fun onBind(intent: Intent?) = null
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        heartbeat()
        return START_STICKY
    }
    private fun heartbeat() {
        try {
            val uid = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid ?: return
            FirebaseRefs.users().document(uid).update(mapOf("online" to true, "lastSeen" to System.currentTimeMillis()))
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({ heartbeat() }, com.ajclassa.app.utils.Constants.HEARTBEAT_MS)
        } catch (_: Exception) {}
    }
}
