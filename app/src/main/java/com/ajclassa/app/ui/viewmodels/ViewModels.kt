package com.ajclassa.app.ui.viewmodels

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ajclassa.app.ai.AiPrompts
import com.ajclassa.app.data.models.*
import com.ajclassa.app.data.repositories.*
import com.ajclassa.app.utils.PrefsManager
import com.ajclassa.app.utils.UiState
import com.ajclassa.app.utils.userMessage
import kotlinx.coroutines.launch

class SessionViewModel : ViewModel() {
    private val auth = AuthRepository()
    private val _me = MutableLiveData<UiState<AppUser>>()
    val me: LiveData<UiState<AppUser>> = _me
    fun load() {
        _me.value = UiState.Loading
        viewModelScope.launch {
            try {
                val u = auth.currentUser() ?: throw IllegalStateException("سجل الدخول أولاً")
                _me.value = UiState.Success(u)
            } catch (e: Exception) { _me.value = UiState.Error(userMessage(e)) }
        }
    }
}

class HomeViewModel : ViewModel() {
    private val repo = ContentRepository()
    private val _state = MutableLiveData<UiState<HomeData>>()
    val state: LiveData<UiState<HomeData>> = _state
    data class HomeData(
        val schedule: List<ScheduleSlot>, val homework: List<Homework>,
        val exams: List<Exam>, val announcements: List<Announcement>
    )
    fun load() {
        _state.value = UiState.Loading
        viewModelScope.launch {
            try {
                _state.value = UiState.Success(HomeData(repo.schedule(), repo.homeworkUpcoming(10), repo.examsUpcoming(), repo.announcements(5)))
            } catch (e: Exception) { _state.value = UiState.Error(userMessage(e)) }
        }
    }
}

class StudyViewModel : ViewModel() {
    private val repo = ContentRepository()
    private val _subjects = MutableLiveData<UiState<List<Subject>>>()
    val subjects: LiveData<UiState<List<Subject>>> = _subjects
    fun load() {
        _subjects.value = UiState.Loading
        viewModelScope.launch {
            try {
                val s = repo.subjects()
                _subjects.value = if (s.isEmpty()) UiState.Empty else UiState.Success(s)
            } catch (e: Exception) { _subjects.value = UiState.Error(userMessage(e)) }
        }
    }
}

class CommunityViewModel : ViewModel() {
    val repo = ChatRepository()
    fun query() = repo.communityQuery()
}

class AiViewModel : ViewModel() {
    private val _chats = MutableLiveData<UiState<List<AiChat>>>()
    val chats: LiveData<UiState<List<AiChat>>> = _chats
    private var repo: AiRepository? = null
    fun init(prefs: PrefsManager) {
        repo = AiRepository(prefs.aiBaseUrl, prefs.aiModel, prefs.aiProxyKey)
    }
    fun loadChats(uid: String) {
        _chats.value = UiState.Loading
        viewModelScope.launch {
            try {
                val c = repo!!.chats(uid)
                _chats.value = if (c.isEmpty()) UiState.Empty else UiState.Success(c)
            } catch (e: Exception) { _chats.value = UiState.Error(userMessage(e)) }
        }
    }
    fun newChat(uid: String, title: String, onDone: (AiChat) -> Unit) {
        viewModelScope.launch {
            try { onDone(repo!!.createChat(uid, title.ifBlank { "محادثة جديدة" })) }
            catch (_: Exception) {}
        }
    }
}

class AiChatViewModel : ViewModel() {
    private val _messages = MutableLiveData<List<AiMessage>>(emptyList())
    val messages: LiveData<List<AiMessage>> = _messages
    private val _sending = MutableLiveData(false)
    val sending: LiveData<Boolean> = _sending
    private var repo: AiRepository? = null
    private var prefs: PrefsManager? = null
    fun init(p: PrefsManager) { prefs = p; repo = AiRepository(p.aiBaseUrl, p.aiModel, p.aiProxyKey) }
    fun load(chatId: String) {
        viewModelScope.launch {
            try { _messages.value = repo!!.messages(chatId) } catch (_: Exception) {}
        }
    }
    fun send(chat: AiChat, prompt: String, subjectName: String = "", onError: (String) -> Unit = {}) {
        if (prompt.isBlank() || _sending.value == true) return
        _sending.value = true
        viewModelScope.launch {
            try {
                val history = _messages.value ?: emptyList()
                repo!!.addMessage(chat.chatId.ifBlank { chat.id }, AiMessage(role = "user", content = prompt))
                _messages.value = history + AiMessage(role = "user", content = prompt)
                val sys = AiPrompts.systemTutor(subjectName)
                val memOn = prefs?.aiMemoryOn != false
                val (answer, tokens) = repo!!.chat(sys, if (memOn) history else emptyList(), if (memOn) chat.memorySummary else "", prompt)
                repo!!.addMessage(chat.chatId.ifBlank { chat.id }, AiMessage(role = "assistant", content = answer, model = prefs?.aiModel ?: "", tokens = tokens))
                _messages.value = (history + AiMessage(role = "user", content = prompt) + AiMessage(role = "assistant", content = answer))
            } catch (e: Exception) { onError("حدث خطأ. حاول مرة أخرى.") }
            finally { _sending.value = false }
        }
    }
}
