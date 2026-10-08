package com.ajclassa.app.ui.fragments

import android.os.Bundle
import android.view.*
import android.widget.*
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.*
import com.ajclassa.app.R
import com.ajclassa.app.data.models.ChatMessage
import com.ajclassa.app.data.models.hasPerm
import com.ajclassa.app.data.models.Perms
import com.ajclassa.app.data.repositories.AuthRepository
import com.ajclassa.app.data.repositories.FirebaseRefs
import com.ajclassa.app.ui.adapters.ChatAdapter
import com.ajclassa.app.ui.viewmodels.CommunityViewModel
import com.firebase.ui.firestore.FirestoreRecyclerOptions
import kotlinx.coroutines.launch

class CommunityFragment : Fragment() {
    private val vm: CommunityViewModel by viewModels()
    private val auth = AuthRepository()
    private var adapter: ChatAdapter? = null

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View =
        i.inflate(R.layout.fragment_community, c, false)

    override fun onViewCreated(v: View, s: Bundle?) {
        val rv = v.findViewById<RecyclerView>(R.id.recycler)
        val et = v.findViewById<EditText>(R.id.etMessage)
        val btn = v.findViewById<ImageButton>(R.id.btnSend)
        rv.layoutManager = LinearLayoutManager(requireContext()).apply { reverseLayout = true }
        lifecycleScope.launch {
            val me = try { auth.currentUser() } catch (_: Exception) { null }
            val opts = FirestoreRecyclerOptions.Builder<ChatMessage>()
                .setQuery(vm.query(), ChatMessage::class.java).setLifecycleOwner(viewLifecycleOwner).build()
            adapter = ChatAdapter(me?.uid ?: "", me,
                onReact = { id, emoji -> lifecycleScope.launch { try { vm.repo.react(id, emoji, me?.uid ?: "") } catch (_: Exception) {} } },
                onDelete = { id -> lifecycleScope.launch { try { vm.repo.softDelete(id) } catch (_: Exception) {} } },
                onRead = { id -> lifecycleScope.launch { try { vm.repo.markRead(id, me?.uid ?: "") } catch (_: Exception) {} } }
            )
            adapter!!.applyOptions(opts)
            rv.adapter = adapter
            val canSend = me?.hasPerm(Perms.SEND_MESSAGES) != false
            et.isEnabled = canSend; btn.isEnabled = canSend
            btn.setOnClickListener {
                val t = et.text.toString().trim()
                if (t.isEmpty() || me == null) return@setOnClickListener
                et.setText("")
                lifecycleScope.launch {
                    try {
                        vm.repo.send(ChatMessage(senderId = me.uid, senderName = me.name.ifBlank { me.username }, senderPhoto = me.photoUrl, text = t))
                    } catch (_: Exception) { Toast.makeText(requireContext(), "حدث خطأ. حاول مرة أخرى.", Toast.LENGTH_SHORT).show() }
                }
            }
        }
    }
    override fun onDestroyView() { adapter?.stopListening(); super.onDestroyView() }
}
