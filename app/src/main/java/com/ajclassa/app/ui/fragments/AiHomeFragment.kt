package com.ajclassa.app.ui.fragments

import android.content.Intent
import android.os.Bundle
import android.view.*
import android.widget.*
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.*
import com.ajclassa.app.R
import com.ajclassa.app.data.repositories.AuthRepository
import com.ajclassa.app.ui.activities.AiChatActivity
import com.ajclassa.app.ui.activities.CameraSolverActivity
import com.ajclassa.app.ui.adapters.AiChatListAdapter
import com.ajclassa.app.ui.viewmodels.AiViewModel
import com.ajclassa.app.utils.PrefsManager
import com.ajclassa.app.utils.UiState
import kotlinx.coroutines.launch

class AiHomeFragment : Fragment() {
    private val vm: AiViewModel by viewModels()
    private val auth = AuthRepository()
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View =
        i.inflate(R.layout.fragment_ai_home, c, false)
    override fun onViewCreated(v: View, s: Bundle?) {
        val prefs = PrefsManager(requireContext())
        vm.init(prefs)
        val rv = v.findViewById<RecyclerView>(R.id.recycler)
        val progress = v.findViewById<ProgressBar>(R.id.progress)
        val empty = v.findViewById<TextView>(R.id.tvEmpty)
        val adapter = AiChatListAdapter(
            onOpen = { startActivity(Intent(requireContext(), AiChatActivity::class.java).putExtra("chatId", it.chatId.ifBlank { it.id })) },
            onDelete = { chat -> lifecycleScope.launch { try { com.ajclassa.app.data.repositories.FirebaseRefs.aiChats().document(chat.id).delete() } catch (_: Exception) {} } }
        )
        rv.layoutManager = LinearLayoutManager(requireContext())
        rv.adapter = adapter
        v.findViewById<View>(R.id.btnNew).setOnClickListener {
            lifecycleScope.launch {
                val u = try { auth.currentUser() } catch (_: Exception) { null } ?: return@launch
                vm.newChat(u.uid, "محادثة جديدة") { c ->
                    startActivity(Intent(requireContext(), AiChatActivity::class.java).putExtra("chatId", c.id))
                }
            }
        }
        v.findViewById<View>(R.id.btnCamera).setOnClickListener { startActivity(Intent(requireContext(), CameraSolverActivity::class.java)) }
        vm.chats.observe(viewLifecycleOwner) { st ->
            progress.visibility = if (st is UiState.Loading) View.VISIBLE else View.GONE
            empty.visibility = if (st is UiState.Empty || st is UiState.Error) View.VISIBLE else View.GONE
            if (st is UiState.Success) adapter.submit(st.data)
        }
        lifecycleScope.launch {
            val u = try { auth.currentUser() } catch (_: Exception) { null }
            if (u != null) vm.loadChats(u.uid)
        }
    }
}
