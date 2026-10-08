package com.ajclassa.app.data.repositories

import com.ajclassa.app.data.models.AppUser
import com.ajclassa.app.utils.Constants
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import kotlinx.coroutines.tasks.await

class AuthRepository {
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()

    suspend fun loginWithUsername(username: String, password: String): AppUser {
        // Username -> email resolution (Owner creates username+email). Query once, then sign in.
        val snap = FirebaseRefs.users().whereEqualTo("username", username.trim()).limit(1).get().await()
        if (snap.isEmpty) throw IllegalArgumentException("بيانات الدخول غير صحيحة")
        val doc = snap.documents.first()
        val email = doc.getString("email").orEmpty()
        auth.signInWithEmailAndPassword(email, password).await()
        val user = doc.toObject(AppUser::class.java)?.copy(uid = doc.id)
            ?: throw IllegalStateException("تعذر تحميل الحساب")
        if (!user.active || user.banned) {
            auth.signOut()
            throw IllegalStateException("الحساب معطّل. تواصل مع الإدارة.")
        }
        // presence heartbeat + device session record
        FirebaseRefs.users().document(user.uid).update(
            mapOf("online" to true, "lastSeen" to System.currentTimeMillis())
        )
        return user
    }

    suspend fun currentUser(): AppUser? {
        val uid = auth.currentUser?.uid ?: return null
        val d = FirebaseRefs.users().document(uid).get().await()
        if (!d.exists()) return null
        return d.toObject(AppUser::class.java)?.copy(uid = d.id)
    }

    fun signOut(uid: String?) {
        try {
            if (uid != null) FirebaseRefs.users().document(uid)
                .update(mapOf("online" to false, "lastSeen" to System.currentTimeMillis()))
        } catch (_: Exception) {}
        auth.signOut()
    }

    suspend fun changePassword(newPw: String) {
        auth.currentUser?.updatePassword(newPw)?.await()
            ?: throw IllegalStateException("غير مسجل الدخول")
        val uid = auth.currentUser!!.uid
        FirebaseRefs.users().document(uid).update("mustChangePassword", false).await()
    }

    fun uid(): String? = auth.currentUser?.uid
}
