package com.ajclassa.app.data.models

import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.ServerTimestamp
import java.util.Date

data class AppUser(
    @DocumentId val uid: String = "",
    val name: String = "",
    val username: String = "",
    val email: String = "",
    val role: String = Roles.STUDENT,
    val active: Boolean = true,
    val banned: Boolean = false,
    val createdAt: Long = 0L,
    val lastSeen: Long = 0L,
    val online: Boolean = false,
    val photoUrl: String = "",
    val mustChangePassword: Boolean = false,
    val permissions: Map<String, Boolean> = emptyMap(),
    val section: String = "A",
    val showOnline: Boolean = true,
    val showLastSeen: Boolean = true,
    val showReadReceipts: Boolean = true
)

data class Subject(
    @DocumentId val id: String = "",
    val name: String = "",
    val nameAr: String = "",
    val icon: String = "",
    val color: String = "",
    val order: Int = 0,
    val teacher: String = ""
)

data class Lesson(
    @DocumentId val id: String = "",
    val subjectId: String = "",
    val title: String = "",
    val description: String = "",
    val body: String = "",
    val imageUrls: List<String> = emptyList(),
    val pdfUrl: String = "",
    val links: List<String> = emptyList(),
    val order: Int = 0,
    val createdAt: Long = 0L
)

data class Homework(
    @DocumentId val id: String = "",
    val title: String = "",
    val subjectId: String = "",
    val subjectName: String = "",
    val description: String = "",
    val attachments: List<String> = emptyList(),
    val dueAt: Long = 0L,
    val allowLate: Boolean = false,
    val status: String = "open",
    val createdBy: String = "",
    val createdAt: Long = 0L
)

data class HomeworkSubmission(
    @DocumentId val id: String = "",
    val homeworkId: String = "",
    val userId: String = "",
    val userName: String = "",
    val text: String = "",
    val fileUrls: List<String> = emptyList(),
    val submittedAt: Long = 0L,
    val late: Boolean = false
)

data class ExamQuestion(
    val id: String = "",
    val type: String = "mcq", // mcq | tf | short | multi
    val question: String = "",
    val options: List<String> = emptyList(),
    val correctIndexes: List<Int> = emptyList(),
    val correctText: String = "",
    val points: Int = 1,
    val explanation: String = "",
    val difficulty: String = "medium",
    val lessonId: String = ""
)

data class Exam(
    @DocumentId val id: String = "",
    val title: String = "",
    val subjectId: String = "",
    val subjectName: String = "",
    val description: String = "",
    val questions: List<ExamQuestion> = emptyList(),
    val durationMin: Int = 20,
    val totalPoints: Int = 0,
    val startsAt: Long = 0L,
    val endsAt: Long = 0L,
    val createdBy: String = "",
    val createdAt: Long = 0L
)

data class ExamResult(
    @DocumentId val id: String = "",
    val examId: String = "",
    val userId: String = "",
    val score: Int = 0,
    val total: Int = 0,
    val answers: Map<String, String> = emptyMap(),
    val wrongIndexes: List<Int> = emptyList(),
    val submittedAt: Long = 0L
)

data class Announcement(
    @DocumentId val id: String = "",
    val title: String = "",
    val body: String = "",
    val imageUrl: String = "",
    val fileUrl: String = "",
    val link: String = "",
    val pinned: Boolean = false,
    val target: String = "all",
    val createdBy: String = "",
    val createdAt: Long = 0L
)

data class ScheduleSlot(
    @DocumentId val id: String = "",
    val day: String = "mon", // mon..fri
    val startMin: Int = 480,
    val endMin: Int = 570,
    val subjectId: String = "",
    val subjectName: String = "",
    val teacher: String = "",
    val room: String = ""
)

data class ChatMessage(
    @DocumentId val id: String = "",
    val messageId: String = "",
    val senderId: String = "",
    val senderName: String = "",
    val senderPhoto: String = "",
    val text: String = "",
    val type: String = "text", // text|image|file|voice
    val timestamp: Long = 0L,
    val sentAt: Long = 0L,
    val deliveredTo: List<String> = emptyList(),
    val readBy: List<String> = emptyList(),
    val replyToId: String = "",
    val replyToText: String = "",
    val attachments: List<String> = emptyList(),
    val reactions: Map<String, List<String>> = emptyMap(),
    val pinned: Boolean = false,
    val deleted: Boolean = false,
    val mentionAll: Boolean = false
)

data class AiChat(
    @DocumentId val id: String = "",
    val chatId: String = "",
    val userId: String = "",
    val title: String = "",
    val pinned: Boolean = false,
    val memorySummary: String = "",
    val subjectId: String = "",
    val createdAt: Long = 0L,
    val updatedAt: Long = 0L
)

data class AiMessage(
    @DocumentId val id: String = "",
    val messageId: String = "",
    val role: String = "user", // user|assistant
    val content: String = "",
    val timestamp: Long = 0L,
    val attachments: List<String> = emptyList(),
    val model: String = "",
    val tokens: Int = 0,
    val saved: Boolean = false
)

data class NoteItem(
    @DocumentId val id: String = "",
    val userId: String = "",
    val kind: String = "note", // note|homework|exam|reminder|event
    val title: String = "",
    val description: String = "",
    val dateAt: Long = 0L,
    val remindAt: Long = 0L,
    val attachment: String = "",
    val done: Boolean = false,
    val createdAt: Long = 0L
)

data class NotificationItem(
    @DocumentId val id: String = "",
    val userId: String = "",
    val kind: String = "general", // message|reply|mention|announcement|homework|exam|schedule|reminder|ai|admin
    val title: String = "",
    val body: String = "",
    val targetRoute: String = "",
    val targetId: String = "",
    val read: Boolean = false,
    val createdAt: Long = 0L
)

data class AuditLog(
    @DocumentId val id: String = "",
    val actorId: String = "",
    val actorName: String = "",
    val action: String = "",
    val target: String = "",
    val timestamp: Long = 0L
)

data class LibraryFile(
    @DocumentId val id: String = "",
    val subjectId: String = "",
    val subjectName: String = "",
    val title: String = "",
    val kind: String = "pdf",
    val url: String = "",
    val term: String = "",
    val size: Long = 0L,
    val uploadedBy: String = "",
    val createdAt: Long = 0L
)

data class DailyContent(
    val kind: String = "verse", // verse|hadith
    val text: String = "",
    val source: String = "",
    val dateKey: String = ""
)
