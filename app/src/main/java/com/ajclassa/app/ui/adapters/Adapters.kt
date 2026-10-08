package com.ajclassa.app.ui.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.ajclassa.app.R
import com.ajclassa.app.ai.MarkdownRenderer
import com.ajclassa.app.data.models.*
import com.ajclassa.app.utils.TimeUtils
import com.firebase.ui.firestore.FirestoreRecyclerAdapter
import com.firebase.ui.firestore.FirestoreRecyclerOptions

class SubjectAdapter(private val onClick: (Subject) -> Unit) : ListAdapter<Subject, SubjectAdapter.H>(Diff()) {
    class Diff : DiffUtil.ItemCallback<Subject>() {
        override fun areItemsTheSame(a: Subject, b: Subject) = a.id == b.id
        override fun areContentsTheSame(a: Subject, b: Subject) = a == b
    }
    class H(v: View) : RecyclerView.ViewHolder(v) {
        val t: TextView = v.findViewById(R.id.tvTitle)
        val s: TextView = v.findViewById(R.id.tvSub)
    }
    override fun onCreateViewHolder(p: ViewGroup, t: Int) = H(LayoutInflater.from(p.context).inflate(R.layout.item_subject, p, false))
    override fun onBindViewHolder(h: H, i: Int) {
        val s = getItem(i)
        h.t.text = s.nameAr.ifBlank { s.name }
        h.s.text = "📚 الدروس  •  📝 الواجبات  •  🤖 اسأل AI"
        h.itemView.setOnClickListener { onClick(s) }
    }
    fun submit(d: List<Subject>) = submitList(d)
}

class SimpleTextAdapter(private val items: List<String>) : RecyclerView.Adapter<SimpleTextAdapter.H>() {
    class H(v: View) : RecyclerView.ViewHolder(v) { val t: TextView = v.findViewById(R.id.tvText) }
    override fun onCreateViewHolder(p: ViewGroup, t: Int) = H(LayoutInflater.from(p.context).inflate(R.layout.item_simple_text, p, false))
    override fun onBindViewHolder(h: H, i: Int) { h.t.text = items[i] }
    override fun getItemCount() = items.size
}

class AnnouncementAdapter(private val items: List<Announcement>) : RecyclerView.Adapter<AnnouncementAdapter.H>() {
    class H(v: View) : RecyclerView.ViewHolder(v) {
        val t: TextView = v.findViewById(R.id.tvTitle); val b: TextView = v.findViewById(R.id.tvBody)
    }
    override fun onCreateViewHolder(p: ViewGroup, t: Int) = H(LayoutInflater.from(p.context).inflate(R.layout.item_announcement, p, false))
    override fun onBindViewHolder(h: H, i: Int) { h.t.text = items[i].title; h.b.text = items[i].body }
    override fun getItemCount() = items.size
}

class NotificationAdapter(private val items: List<NotificationItem>) : RecyclerView.Adapter<NotificationAdapter.H>() {
    class H(v: View) : RecyclerView.ViewHolder(v) {
        val t: TextView = v.findViewById(R.id.tvTitle); val b: TextView = v.findViewById(R.id.tvBody)
    }
    override fun onCreateViewHolder(p: ViewGroup, t: Int) = H(LayoutInflater.from(p.context).inflate(R.layout.item_announcement, p, false))
    override fun onBindViewHolder(h: H, i: Int) { h.t.text = items[i].title; h.b.text = items[i].body }
    override fun getItemCount() = items.size
}

class AiChatListAdapter(val onOpen: (AiChat) -> Unit, val onDelete: (AiChat) -> Unit) : ListAdapter<AiChat, AiChatListAdapter.H>(Diff()) {
    class Diff : DiffUtil.ItemCallback<AiChat>() {
        override fun areItemsTheSame(a: AiChat, b: AiChat) = a.id == b.id
        override fun areContentsTheSame(a: AiChat, b: AiChat) = a == b
    }
    class H(v: View) : RecyclerView.ViewHolder(v) {
        val t: TextView = v.findViewById(R.id.tvTitle); val d: TextView = v.findViewById(R.id.tvDate)
    }
    override fun onCreateViewHolder(p: ViewGroup, t: Int) = H(LayoutInflater.from(p.context).inflate(R.layout.item_ai_chat, p, false))
    override fun onBindViewHolder(h: H, i: Int) {
        val c = getItem(i)
        h.t.text = (if (c.pinned) "📌 " else "") + c.title
        h.d.text = TimeUtils.fmtDateTime(c.updatedAt)
        h.itemView.setOnClickListener { onOpen(c) }
        h.itemView.setOnLongClickListener { onDelete(c); true }
    }
    fun submit(d: List<AiChat>) = submitList(d)
}

class AiMessageAdapter : ListAdapter<AiMessage, AiMessageAdapter.H>(Diff()) {
    class Diff : DiffUtil.ItemCallback<AiMessage>() {
        override fun areItemsTheSame(a: AiMessage, b: AiMessage) = a.timestamp == b.timestamp && a.content == b.content
        override fun areContentsTheSame(a: AiMessage, b: AiMessage) = a == b
    }
    class H(v: View) : RecyclerView.ViewHolder(v) { val t: TextView = v.findViewById(R.id.tvText) }
    override fun getItemViewType(p: Int) = if (getItem(p).role == "assistant") 1 else 0
    override fun onCreateViewHolder(p: ViewGroup, t: Int): H {
        val layout = if (t == 1) R.layout.item_ai_answer else R.layout.item_ai_user
        return H(LayoutInflater.from(p.context).inflate(layout, p, false))
    }
    override fun onBindViewHolder(h: H, i: Int) {
        val m = getItem(i)
        if (m.role == "assistant") MarkdownRenderer.renderInto(h.t, m.content) else h.t.text = m.content
    }
    fun submit(d: List<AiMessage>) = submitList(d.toList())
}

class ChatAdapter(
    private val myId: String, private val me: AppUser?,
    val onReact: (String, String) -> Unit, val onDelete: (String) -> Unit, val onRead: (String) -> Unit
) : FirestoreRecyclerAdapter<ChatMessage, ChatAdapter.H>(FirestoreRecyclerOptions.Builder<ChatMessage>().setQuery(com.ajclassa.app.data.repositories.FirebaseRefs.community().limit(1), ChatMessage::class.java).build()) {
    class H(v: View) : RecyclerView.ViewHolder(v) {
        val name: TextView = v.findViewById(R.id.tvName)
        val text: TextView = v.findViewById(R.id.tvText)
        val time: TextView = v.findViewById(R.id.tvTime)
        val status: TextView = v.findViewById(R.id.tvStatus)
    }
    override fun onCreateViewHolder(p: ViewGroup, t: Int): H {
        val layout = if (t == 1) R.layout.item_msg_me else R.layout.item_msg_other
        return H(LayoutInflater.from(p.context).inflate(layout, p, false))
    }
    override fun getItemViewType(p: Int) = if (getItem(p).senderId == myId) 1 else 0
    override fun onBindViewHolder(h: H, i: Int, m: ChatMessage) {
        if (m.deleted) { h.text.text = "🗑 تم حذف الرسالة"; }
        else h.text.text = m.text
        h.name.text = m.senderName
        h.time.text = TimeUtils.fmtTime(m.timestamp)
        h.status.text = when {
            m.readBy.isNotEmpty() -> "✓✓ Read"
            m.deliveredTo.isNotEmpty() -> "✓✓ Delivered"
            else -> "✓ Sent"
        }
        if (m.senderId != myId) onRead(m.id.ifBlank { snapshots.getSnapshot(i).id })
        h.itemView.setOnLongClickListener {
            val id = m.id.ifBlank { snapshots.getSnapshot(i).id }
            if (me?.hasPerm(Perms.DELETE_MESSAGES) == true || m.senderId == myId) onDelete(id)
            true
        }
    }
    fun applyOptions(o: FirestoreRecyclerOptions<ChatMessage>) { super.updateOptions(o) }
}
