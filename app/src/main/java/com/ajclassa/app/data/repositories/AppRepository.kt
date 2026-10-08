package com.ajclassa.app.data.repositories

import com.ajclassa.app.data.models.*
import com.ajclassa.app.utils.Constants
import com.google.firebase.firestore.Query
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.tasks.await

class UserRepository {
    suspend fun get(uid: String): AppUser? {
        val d = FirebaseRefs.users().document(uid).get().await()
        return if (d.exists()) d.toObject(AppUser::class.java)?.copy(uid = d.id) else null
    }
    suspend fun listOnline(): List<AppUser> =
        FirebaseRefs.users().whereEqualTo("online", true).limit(50).get().await()
            .documents.mapNotNull { it.toObject(AppUser::class.java)?.copy(uid = it.id) }
    suspend fun all(limit: Long = 200): List<AppUser> =
        FirebaseRefs.users().limit(limit).get().await()
            .documents.mapNotNull { it.toObject(AppUser::class.java)?.copy(uid = it.id) }
    suspend fun audit(actor: AppUser, action: String, target: String) {
        FirebaseRefs.audit().add(AuditLog(actorId = actor.uid, actorName = actor.name, action = action, target = target, timestamp = System.currentTimeMillis())).await()
    }
}

class ContentRepository {
    suspend fun subjects(): List<Subject> =
        FirebaseRefs.subjects().orderBy("order").get().await()
            .documents.mapNotNull { it.toObject(Subject::class.java)?.copy(id = it.id) }
    suspend fun lessons(subjectId: String): List<Lesson> =
        FirebaseRefs.lessons().whereEqualTo("subjectId", subjectId).orderBy("order").get().await()
            .documents.mapNotNull { it.toObject(Lesson::class.java)?.copy(id = it.id) }
    suspend fun lesson(id: String): Lesson? {
        val d = FirebaseRefs.lessons().document(id).get().await()
        return d.toObject(Lesson::class.java)?.copy(id = d.id)
    }
    suspend fun homeworkUpcoming(limit: Long = 30): List<Homework> =
        FirebaseRefs.homework().whereGreaterThanOrEqualTo("dueAt", System.currentTimeMillis() - 86400000L)
            .orderBy("dueAt").limit(limit).get().await()
            .documents.mapNotNull { it.toObject(Homework::class.java)?.copy(id = it.id) }
    suspend fun examsUpcoming(): List<Exam> =
        FirebaseRefs.exams().whereGreaterThanOrEqualTo("endsAt", System.currentTimeMillis())
            .orderBy("endsAt").limit(30).get().await()
            .documents.mapNotNull { it.toObject(Exam::class.java)?.copy(id = it.id) }
    suspend fun exam(id: String): Exam? {
        val d = FirebaseRefs.exams().document(id).get().await()
        return d.toObject(Exam::class.java)?.copy(id = d.id)
    }
    suspend fun announcements(limit: Long = 30): List<Announcement> =
        FirebaseRefs.announcements().orderBy("createdAt", Query.Direction.DESCENDING).limit(limit).get().await()
            .documents.mapNotNull { it.toObject(Announcement::class.java)?.copy(id = it.id) }
    suspend fun schedule(): List<ScheduleSlot> =
        FirebaseRefs.schedule().get().await()
            .documents.mapNotNull { it.toObject(ScheduleSlot::class.java)?.copy(id = it.id) }
    suspend fun library(subjectId: String = ""): List<LibraryFile> {
        val q = if (subjectId.isBlank()) FirebaseRefs.library().limit(100)
        else FirebaseRefs.library().whereEqualTo("subjectId", subjectId).limit(100)
        return q.get().await().documents.mapNotNull { it.toObject(LibraryFile::class.java)?.copy(id = it.id) }
    }
    suspend fun notificationsFor(uid: String): List<com.ajclassa.app.data.models.NotificationItem> =
        FirebaseRefs.notifications().whereEqualTo("userId", uid)
            .orderBy("createdAt", Query.Direction.DESCENDING).limit(60).get().await()
            .documents.mapNotNull { it.toObject(com.ajclassa.app.data.models.NotificationItem::class.java)?.copy(id = it.id) }
}

class ChatRepository {
    fun communityQuery() = FirebaseRefs.community()
        .orderBy("timestamp", Query.Direction.DESCENDING).limit(40)
    suspend fun send(msg: ChatMessage) {
        FirebaseRefs.community().add(msg.copy(timestamp = System.currentTimeMillis(), sentAt = System.currentTimeMillis())).await()
    }
    suspend fun react(id: String, emoji: String, uid: String) {
        val ref = FirebaseRefs.community().document(id)
        FirebaseRefs.db.runTransaction { tx ->
            val d = tx.get(ref)
            val map = (d.get("reactions") as? Map<String, List<String>>)?.toMutableMap() ?: mutableMapOf()
            val list = (map[emoji] ?: emptyList()).toMutableList()
            if (list.contains(uid)) list.remove(uid) else list.add(uid)
            map[emoji] = list
            tx.update(ref, "reactions", map)
            null
        }.await()
    }
    suspend fun softDelete(id: String) {
        FirebaseRefs.community().document(id).update(mapOf("deleted" to true, "text" to "")).await()
    }
    suspend fun pin(id: String, v: Boolean) {
        FirebaseRefs.community().document(id).update("pinned", v).await()
    }
    suspend fun markRead(id: String, uid: String) {
        try {
            val ref = FirebaseRefs.community().document(id)
            val d = ref.get().await()
            val read = (d.get("readBy") as? List<String> ?: emptyList()).toMutableSet()
            val del = (d.get("deliveredTo") as? List<String> ?: emptyList()).toMutableSet()
            del.add(uid); read.add(uid)
            ref.update(mapOf("deliveredTo" to del.toList(), "readBy" to read.toList())).await()
        } catch (_: Exception) {}
    }
}

class AiRepository(private val baseUrl: String, private val model: String, private val proxyKey: String) {
    private val api by lazy { com.ajclassa.app.data.remote.RetrofitClient.api(baseUrl) }
    private fun auth(): String? = proxyKey.takeIf { it.isNotBlank() }?.let { "Bearer $it" }

    suspend fun chat(system: String, history: List<AiMessage>, summary: String, prompt: String): Pair<String, Int> {
        val req = com.ajclassa.app.data.remote.AiChatRequest(
            model = model,
            messages = com.ajclassa.app.ai.AiMemoryManager.buildMessages(system, history, summary, prompt)
        )
        val res = api.chat(req, auth())
        val t = res.text().ifBlank { throw IllegalStateException("empty") }
        return t to (res.usage?.total ?: 0)
    }

    suspend fun vision(prompt: String, imageBase64: String): String {
        val res = api.vision(com.ajclassa.app.data.remote.AiVisionRequest(model, prompt, imageBase64), auth())
        return res.text().ifBlank { throw IllegalStateException("empty") }
    }

    // Firestore persistence
    suspend fun chats(uid: String): List<AiChat> =
        FirebaseRefs.aiChats().whereEqualTo("userId", uid)
            .orderBy("updatedAt", Query.Direction.DESCENDING).limit(60).get().await()
            .documents.mapNotNull { it.toObject(AiChat::class.java)?.copy(id = it.id) }

    suspend fun createChat(uid: String, title: String, subjectId: String = ""): AiChat {
        val now = System.currentTimeMillis()
        val ref = FirebaseRefs.aiChats().add(
            AiChat(chatId = "", userId = uid, title = title.take(60), createdAt = now, updatedAt = now, subjectId = subjectId)
        ).await()
        ref.update("chatId", ref.id).await()
        return AiChat(id = ref.id, chatId = ref.id, userId = uid, title = title.take(60), createdAt = now, updatedAt = now, subjectId = subjectId)
    }

    suspend fun messages(chatId: String): List<AiMessage> =
        FirebaseRefs.aiChats().document(chatId).collection("messages")
            .orderBy("timestamp").limit(200).get().await()
            .documents.mapNotNull { it.toObject(AiMessage::class.java)?.copy(id = it.id) }

    suspend fun addMessage(chatId: String, m: AiMessage) {
        FirebaseRefs.aiChats().document(chatId).collection("messages")
            .add(m.copy(timestamp = System.currentTimeMillis())).await()
        FirebaseRefs.aiChats().document(chatId).update("updatedAt", System.currentTimeMillis()).await()
    }
}

class FileRepository {
    private val storage = FirebaseStorage.getInstance()
    suspend fun upload(bytes: ByteArray, path: String): String {
        val ref = storage.reference.child(path)
        ref.putBytes(bytes).await()
        return ref.downloadUrl.await().toString()
    }
}
