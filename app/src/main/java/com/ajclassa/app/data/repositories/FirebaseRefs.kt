package com.ajclassa.app.data.repositories

import com.google.firebase.firestore.FirebaseFirestore

object FirebaseRefs {
    val db: FirebaseFirestore by lazy { FirebaseFirestore.getInstance() }
    fun users() = db.collection("users")
    fun subjects() = db.collection("subjects")
    fun lessons() = db.collection("lessons")
    fun homework() = db.collection("homework")
    fun submissions() = db.collection("submissions")
    fun exams() = db.collection("exams")
    fun results() = db.collection("examResults")
    fun questions() = db.collection("questionBank")
    fun announcements() = db.collection("announcements")
    fun schedule() = db.collection("schedule")
    fun community() = db.collection("communityMessages")
    fun aiChats() = db.collection("aiChats")
    fun notes() = db.collection("notes")
    fun notifications() = db.collection("notifications")
    fun audit() = db.collection("auditLogs")
    fun library() = db.collection("libraryFiles")
    fun settings() = db.collection("settings")
}
