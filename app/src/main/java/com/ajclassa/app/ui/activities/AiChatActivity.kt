package com.ajclassa.app.ui.activities

import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.ajclassa.app.R
import com.ajclassa.app.data.models.AiChat
import com.ajclassa.app.data.repositories.AuthRepository
import com.ajclassa.app.data.repositories.FirebaseRefs
import com.ajclassa.app.ui.adapters.AiMessageAdapter
import com.ajclassa.app.ui.viewmodels.AiChatViewModel
import com.ajclassa.app.utils.PrefsManager
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class AiChatActivity : AppCompatActivity() {
    private val vm: AiChatViewModel by viewModels()
    private val auth = AuthRepository()
    private var chat: AiChat? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_ai_chat)
        val prefs = PrefsManager(this)
        vm.init(prefs)
        val rv = findViewById<RecyclerView>(R.id.recycler)
        val et = findViewById<EditText>(R.id.etInput)
        val btn = findViewById<ImageButton>(R.id.btnSend)
        val progress = findViewById<ProgressBar>(R.id.progress)
        val adapter = AiMessageAdapter()
        rv.layoutManager = LinearLayoutManager(this).apply { stackFromEnd = true }
        rv.adapter = adapter
        findViewById<View>(R.id.btnBack).setOnClickListener { finish() }
        findViewById<View>(R.id.btnNew).setOnClickListener { finish() }
        vm.messages.observe(this) { list ->
            adapter.submit(list)
            if (list.isNotEmpty()) rv.scrollToPosition(list.size - 1)
        }
        vm.sending.observe(this) { progress.visibility = if (it) View.VISIBLE else View.GONE }
        val chatId = intent.getStringExtra("chatId").orEmpty()
        lifecycleScope.launch {
            val me = try { auth.currentUser() } catch (_: Exception) { null } ?: run { finish(); return@launch }
            chat = if (chatId.isNotBlank()) {
                val d = FirebaseRefs.aiChats().document(chatId).get().await()
                d.toObject(AiChat::class.java)?.copy(id = d.id) ?: create(me.uid, prefs)
            } else create(me.uid, prefs)
            prefs.lastChatId = chat!!.id.ifBlank { chat!!.chatId }
            vm.load(chat!!.id.ifBlank { chat!!.chatId })
            btn.setOnClickListener {
                val t = et.text.toString().trim()
                if (t.isEmpty()) return@setOnClickListener
                et.setText("")
                vm.send(chat!!, t, onError = { Toast.makeText(this@AiChatActivity, it, Toast.LENGTH_SHORT).show() })
            }
        }
    }

    private suspend fun create(uid: String, prefs: PrefsManager): AiChat {
        return try {
            com.ajclassa.app.data.repositories.AiRepository(prefs.aiBaseUrl, prefs.aiModel, prefs.aiProxyKey)
                .createChat(uid, "محادثة جديدة")
        } catch (_: Exception) {
            AiChat(id = "", chatId = "", userId = uid, title = "محادثة جديدة")
        }
    }
}
