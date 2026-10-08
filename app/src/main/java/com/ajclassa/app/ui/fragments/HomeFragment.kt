package com.ajclassa.app.ui.fragments

import android.content.Intent
import android.os.Bundle
import android.view.*
import android.widget.*
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import com.ajclassa.app.R
import com.ajclassa.app.data.repositories.AuthRepository
import com.ajclassa.app.ui.activities.*
import com.ajclassa.app.ui.viewmodels.HomeViewModel
import com.ajclassa.app.ui.viewmodels.SessionViewModel
import com.ajclassa.app.utils.PrefsManager
import com.ajclassa.app.utils.TimeUtils
import com.ajclassa.app.utils.UiState
import kotlinx.coroutines.launch

class HomeFragment : Fragment() {
    private val vm: HomeViewModel by viewModels()
    private val session: SessionViewModel by viewModels()
    private val auth = AuthRepository()

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View =
        i.inflate(R.layout.fragment_home, c, false)

    override fun onViewCreated(v: View, s: Bundle?) {
        val prefs = PrefsManager(requireContext())
        val tvHello = v.findViewById<TextView>(R.id.tvHello)
        val tvDate = v.findViewById<TextView>(R.id.tvDate)
        val tvStreak = v.findViewById<TextView>(R.id.tvStreak)
        val tvNext = v.findViewById<TextView>(R.id.tvNextClass)
        val tvTasks = v.findViewById<TextView>(R.id.tvTasks)
        val progress = v.findViewById<ProgressBar>(R.id.progress)
        val btnRetry = v.findViewById<Button>(R.id.btnRetry)
        tvDate.text = TimeUtils.fmtDate(System.currentTimeMillis())
        tvStreak.text = "🔥 ${prefs.streakDays} أيام"

        v.findViewById<View>(R.id.cardAi).setOnClickListener { startActivity(Intent(requireContext(), AiChatActivity::class.java)) }
        v.findViewById<View>(R.id.cardCamera).setOnClickListener { startActivity(Intent(requireContext(), CameraSolverActivity::class.java)) }
        v.findViewById<View>(R.id.cardTools).setOnClickListener { startActivity(Intent(requireContext(), StudyToolsActivity::class.java)) }
        v.findViewById<View>(R.id.cardToday).setOnClickListener { parentFragmentManager.beginTransaction().replace(R.id.fragmentContainer, CalendarFragment()).addToBackStack(null).commit() }
        btnRetry.setOnClickListener { vm.load() }

        // Continue studying
        val tvContinue = v.findViewById<TextView>(R.id.tvContinue)
        if (prefs.lastChatId.isNotBlank() || prefs.lastLessonId.isNotBlank()) {
            tvContinue.visibility = View.VISIBLE
            tvContinue.text = "▶ تابع من حيث توقفت"
            tvContinue.setOnClickListener {
                if (prefs.lastChatId.isNotBlank()) startActivity(Intent(requireContext(), AiChatActivity::class.java).putExtra("chatId", prefs.lastChatId))
                else startActivity(Intent(requireContext(), LessonDetailActivity::class.java).putExtra("lessonId", prefs.lastLessonId))
            }
        }

        lifecycleScope.launch {
            try {
                val u = auth.currentUser()
                if (u != null) { tvHello.text = "مرحباً، ${u.name.ifBlank { u.username }} 👋"; prefs.bumpStreak(); tvStreak.text = "🔥 ${prefs.streakDays} أيام" }
            } catch (_: Exception) {}
        }
        vm.state.observe(viewLifecycleOwner) { st ->
            progress.visibility = if (st is UiState.Loading) View.VISIBLE else View.GONE
            btnRetry.visibility = if (st is UiState.Error) View.VISIBLE else View.GONE
            if (st is UiState.Success) {
                val nowMin = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY) * 60 +
                    java.util.Calendar.getInstance().get(java.util.Calendar.MINUTE)
                val upcoming = st.data.schedule.filter { it.endMin > nowMin }.minByOrNull { it.startMin }
                tvNext.text = if (upcoming != null) "الحصة القادمة: ${upcoming.subjectName} • ${"%02d:%02d".format(upcoming.startMin / 60, upcoming.startMin % 60)}" else "لا حصص متبقية اليوم 🎉"
                val sb = StringBuilder()
                st.data.homework.take(3).forEach { sb.append("• ${it.title} — ${TimeUtils.countdown(it.dueAt)}\n") }
                st.data.exams.take(2).forEach { sb.append("🧪 ${it.title}\n") }
                if (sb.isEmpty()) sb.append("لا مهام اليوم 🎉")
                tvTasks.text = sb.toString().trim()
            }
        }
        vm.load()
    }
}
