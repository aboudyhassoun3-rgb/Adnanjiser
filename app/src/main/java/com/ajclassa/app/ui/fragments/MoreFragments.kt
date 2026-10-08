package com.ajclassa.app.ui.fragments

import android.os.Bundle
import android.view.*
import android.widget.*
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.*
import com.ajclassa.app.R
import com.ajclassa.app.data.models.NotificationItem
import com.ajclassa.app.data.repositories.AuthRepository
import com.ajclassa.app.data.repositories.ContentRepository
import com.ajclassa.app.data.repositories.FirebaseRefs
import com.ajclassa.app.ui.adapters.*
import com.ajclassa.app.utils.TimeUtils
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class CalendarFragment : Fragment() {
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View = i.inflate(R.layout.fragment_list, c, false)
    override fun onViewCreated(v: View, s: Bundle?) {
        v.findViewById<TextView>(R.id.tvTitle).text = "🗓 التقويم — ماذا لدي اليوم؟"
        val rv = v.findViewById<RecyclerView>(R.id.recycler)
        val tvEmpty = v.findViewById<TextView>(R.id.tvEmpty)
        rv.layoutManager = LinearLayoutManager(requireContext())
        val repo = ContentRepository()
        lifecycleScope.launch {
            try {
                val hw = repo.homeworkUpcoming(20)
                val ex = repo.examsUpcoming()
                val sch = repo.schedule()
                val items = mutableListOf<String>()
                sch.sortedBy { it.startMin }.forEach { items.add("📚 ${it.subjectName} • ${"%02d:%02d".format(it.startMin/60, it.startMin%60)}") }
                hw.forEach { items.add("📝 ${it.title} — ${TimeUtils.countdown(it.dueAt)}") }
                ex.forEach { items.add("🧪 ${it.title}") }
                val ad = SimpleTextAdapter(items.ifEmpty { listOf("لا مهام اليوم 🎉") })
                rv.adapter = ad
                tvEmpty.visibility = View.GONE
            } catch (_: Exception) { tvEmpty.text = "حدث خطأ. حاول مرة أخرى."; tvEmpty.visibility = View.VISIBLE }
            v.findViewById<ProgressBar>(R.id.progress).visibility = View.GONE
        }
    }
}

class LibraryFragment : Fragment() {
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View = i.inflate(R.layout.fragment_list, c, false)
    override fun onViewCreated(v: View, s: Bundle?) {
        v.findViewById<TextView>(R.id.tvTitle).text = "📁 مركز الملفات"
        val rv = v.findViewById<RecyclerView>(R.id.recycler)
        rv.layoutManager = LinearLayoutManager(requireContext())
        lifecycleScope.launch {
            try {
                val files = ContentRepository().library()
                rv.adapter = SimpleTextAdapter(files.map { "📄 ${it.title} • ${it.kind}" }.ifEmpty { listOf("لا ملفات بعد") })
            } catch (_: Exception) {}
            v.findViewById<ProgressBar>(R.id.progress).visibility = View.GONE
        }
    }
}

class AnnouncementsFragment : Fragment() {
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View = i.inflate(R.layout.fragment_list, c, false)
    override fun onViewCreated(v: View, s: Bundle?) {
        v.findViewById<TextView>(R.id.tvTitle).text = "📢 الإعلانات"
        val rv = v.findViewById<RecyclerView>(R.id.recycler)
        rv.layoutManager = LinearLayoutManager(requireContext())
        lifecycleScope.launch {
            try {
                val list = ContentRepository().announcements()
                rv.adapter = AnnouncementAdapter(list)
            } catch (_: Exception) { v.findViewById<TextView>(R.id.tvEmpty).visibility = View.VISIBLE }
            v.findViewById<ProgressBar>(R.id.progress).visibility = View.GONE
        }
    }
}

class NotificationsFragment : Fragment() {
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View = i.inflate(R.layout.fragment_list, c, false)
    override fun onViewCreated(v: View, s: Bundle?) {
        v.findViewById<TextView>(R.id.tvTitle).text = "🔔 الإشعارات"
        val rv = v.findViewById<RecyclerView>(R.id.recycler)
        rv.layoutManager = LinearLayoutManager(requireContext())
        lifecycleScope.launch {
            try {
                val uid = AuthRepository().uid() ?: return@launch
                val list = ContentRepository().notificationsFor(uid)
                val today = mutableListOf<NotificationItem>(); val older = mutableListOf<NotificationItem>()
                val (s, _) = TimeUtils.todayRange()
                list.forEach { if (it.createdAt >= s) today.add(it) else older.add(it) }
                rv.adapter = NotificationAdapter(today + older)
                if (list.isEmpty()) v.findViewById<TextView>(R.id.tvEmpty).apply { text = "لا إشعارات بعد"; visibility = View.VISIBLE }
            } catch (_: Exception) {}
            v.findViewById<ProgressBar>(R.id.progress).visibility = View.GONE
        }
    }
}

class NotesFragment : Fragment() {
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View = i.inflate(R.layout.fragment_list, c, false)
    override fun onViewCreated(v: View, s: Bundle?) {
        v.findViewById<TextView>(R.id.tvTitle).text = "📝 المفكرة"
        val rv = v.findViewById<RecyclerView>(R.id.recycler)
        rv.layoutManager = LinearLayoutManager(requireContext())
        lifecycleScope.launch {
            try {
                val uid = AuthRepository().uid() ?: return@launch
                val docs = FirebaseRefs.notes().whereEqualTo("userId", uid).limit(100).get().await()
                val items = docs.documents.mapNotNull { it.getString("title") }
                rv.adapter = SimpleTextAdapter(items.ifEmpty { listOf("لا ملاحظات بعد — أنشئ أول مهمة") })
            } catch (_: Exception) {}
            v.findViewById<ProgressBar>(R.id.progress).visibility = View.GONE
        }
    }
}
