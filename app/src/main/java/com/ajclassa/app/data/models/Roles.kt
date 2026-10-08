package com.ajclassa.app.data.models

/** Roles + permission keys. Permission checks happen in UI AND repository AND Firestore rules. */
object Roles {
    const val OWNER = "OWNER"
    const val SUPER_ADMIN = "SUPER_ADMIN"
    const val ADMIN = "ADMIN"
    const val MODERATOR = "MODERATOR"
    const val TEACHER = "TEACHER"
    const val STUDENT = "STUDENT"
    val ALL = listOf(OWNER, SUPER_ADMIN, ADMIN, MODERATOR, TEACHER, STUDENT)
}

object Perms {
    const val ACCESS_APP = "accessApp"
    const val USE_AI = "useAI"
    const val USE_CAMERA_AI = "useCameraAI"
    const val USE_CHAT = "useChat"
    const val SEND_MESSAGES = "sendMessages"
    const val SEND_IMAGES = "sendImages"
    const val SEND_FILES = "sendFiles"
    const val CREATE_NOTES = "createNotes"
    const val CREATE_HOMEWORK = "createHomework"
    const val CREATE_EXAMS = "createExams"
    const val UPLOAD_FILES = "uploadFiles"
    const val MANAGE_STUDENTS = "manageStudents"
    const val CREATE_USERS = "createUsers"
    const val EDIT_USERS = "editUsers"
    const val DELETE_USERS = "deleteUsers"
    const val MANAGE_SCHEDULE = "manageSchedule"
    const val MANAGE_SUBJECTS = "manageSubjects"
    const val MANAGE_LESSONS = "manageLessons"
    const val MANAGE_ANNOUNCEMENTS = "manageAnnouncements"
    const val SEND_NOTIFICATIONS = "sendNotifications"
    const val MODERATE_CHAT = "moderateChat"
    const val DELETE_MESSAGES = "deleteMessages"
    const val MANAGE_AI = "manageAI"
    const val ACCESS_ADMIN_PANEL = "accessAdminPanel"
    const val MANAGE_ADMINS = "manageAdmins"
    const val MANAGE_PERMISSIONS = "managePermissions"
    const val MANAGE_SETTINGS = "manageSettings"

    val ALL = listOf(
        ACCESS_APP, USE_AI, USE_CAMERA_AI, USE_CHAT, SEND_MESSAGES, SEND_IMAGES, SEND_FILES,
        CREATE_NOTES, CREATE_HOMEWORK, CREATE_EXAMS, UPLOAD_FILES, MANAGE_STUDENTS,
        CREATE_USERS, EDIT_USERS, DELETE_USERS, MANAGE_SCHEDULE, MANAGE_SUBJECTS,
        MANAGE_LESSONS, MANAGE_ANNOUNCEMENTS, SEND_NOTIFICATIONS, MODERATE_CHAT,
        DELETE_MESSAGES, MANAGE_AI, ACCESS_ADMIN_PANEL, MANAGE_ADMINS, MANAGE_PERMISSIONS, MANAGE_SETTINGS
    )

    /** Defaults per role; Owner can override per-user in Firestore. */
    fun defaultsFor(role: String): Map<String, Boolean> = when (role) {
        Roles.OWNER -> ALL.associateWith { true }
        Roles.SUPER_ADMIN -> ALL.associateWith { true }.toMutableMap().apply {
            this[MANAGE_ADMINS] = false
        }
        Roles.ADMIN -> mapOf(
            ACCESS_APP to true, USE_AI to true, USE_CAMERA_AI to true, USE_CHAT to true,
            SEND_MESSAGES to true, SEND_IMAGES to true, SEND_FILES to true,
            CREATE_NOTES to true, CREATE_HOMEWORK to true, CREATE_EXAMS to true,
            UPLOAD_FILES to true, MANAGE_STUDENTS to true, MANAGE_SCHEDULE to true,
            MANAGE_SUBJECTS to true, MANAGE_LESSONS to true, MANAGE_ANNOUNCEMENTS to true,
            SEND_NOTIFICATIONS to true, MODERATE_CHAT to true, DELETE_MESSAGES to true,
            ACCESS_ADMIN_PANEL to true
        ).withDefaults()
        Roles.MODERATOR -> mapOf(
            ACCESS_APP to true, USE_AI to true, USE_CHAT to true, SEND_MESSAGES to true,
            SEND_IMAGES to true, MODERATE_CHAT to true, DELETE_MESSAGES to true
        ).withDefaults()
        Roles.TEACHER -> mapOf(
            ACCESS_APP to true, USE_AI to true, USE_CAMERA_AI to true, USE_CHAT to true,
            SEND_MESSAGES to true, SEND_IMAGES to true, SEND_FILES to true,
            CREATE_NOTES to true, CREATE_HOMEWORK to true, CREATE_EXAMS to true,
            UPLOAD_FILES to true, MANAGE_LESSONS to true
        ).withDefaults()
        else -> mapOf(
            ACCESS_APP to true, USE_AI to true, USE_CAMERA_AI to true, USE_CHAT to true,
            SEND_MESSAGES to true, SEND_IMAGES to true, SEND_FILES to true, CREATE_NOTES to true
        ).withDefaults()
    }

    private fun Map<String, Boolean>.withDefaults(): Map<String, Boolean> {
        val m = ALL.associateWith { false }.toMutableMap()
        for ((k, v) in this) m[k] = v
        return m
    }
}

fun AppUser.hasPerm(key: String): Boolean {
    if (role == Roles.OWNER) return true
    permissions[key]?.let { return it }
    return Perms.defaultsFor(role)[key] == true
}

fun AppUser.isOwner(): Boolean = email.equals("aboudyhassoun3@gmail.com", true) || role == Roles.OWNER
fun AppUser.canAccessAdmin(): Boolean = isOwner() || hasPerm(Perms.ACCESS_ADMIN_PANEL)
