package com.ajclassa.app.ui.activities

import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.*
import com.ajclassa.app.R
import com.ajclassa.app.data.repositories.ContentRepository
import com.ajclassa.app.ui.adapters.SimpleTextAdapter
import com.ajclassa.app.utils.PrefsManager
import kotlinx.coroutines.launch

class SubjectDetailActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_subject)
        val name = intent.getStringExtra("subjectName") ?: "المادة"
        val sid = intent.getStringExtra("subjectId") ?: ""
        findViewById<TextView>(R.id.tvTitle).text = name
        findViewById<View>(R.id.btnBack).setOnClickListener { finish() }
        val rv = findViewById<RecyclerView>(R.id.recycler)
        rv.layoutManager = LinearLayoutManager(this)
        findViewById<View>(R.id.cardAskAi).setOnClickListener {
            startActivity(android.content.Intent(this, AiChatActivity::class.java))
        }
        lifecycleScope.launch {
            try {
                val lessons = ContentRepository().lessons(sid)
                rv.adapter = SimpleTextAdapter(lessons.map { "📚 ${it.title}" }.ifEmpty { listOf("لا دروس بعد") })
                findViewById<TextView>(R.id.tvMeta).text = "📚 الدروس (${lessons.size})  •  📝 الواجبات  •  🧪 الاختبارات  •  📄 الملفات"
            } catch (_: Exception) {
                rv.adapter = SimpleTextAdapter(listOf("حدث خطأ. حاول مرة أخرى."))
            }
            findViewById<ProgressBar>(R.id.progress).visibility = View.GONE
        }
    }
}

class LessonDetailActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_lesson)
        findViewById<View>(R.id.btnBack).setOnClickListener { finish() }
        val id = intent.getStringExtra("lessonId").orEmpty()
        PrefsManager(this).lastLessonId = id
        lifecycleScope.launch {
            try {
                val l = ContentRepository().lesson(id)
                findViewById<TextView>(R.id.tvTitle).text = l?.title ?: "الدرس"
                findViewById<TextView>(R.id.tvBody).text = l?.body ?: l?.description ?: "لا محتوى"
            } catch (_: Exception) {
                findViewById<TextView>(R.id.tvBody).text = "حدث خطأ. حاول مرة أخرى."
            }
            findViewById<ProgressBar>(R.id.progress).visibility = View.GONE
        }
    }
}

class ExamRunnerActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_lesson)
        findViewById<View>(R.id.btnBack).setOnClickListener { finish() }
        val id = intent.getStringExtra("examId").orEmpty()
        lifecycleScope.launch {
            try {
                val e = ContentRepository().exam(id)
                findViewById<TextView>(R.id.tvTitle).text = e?.title ?: "الاختبار"
                val sb = StringBuilder()
                e?.questions?.forEachIndexed { i, q -> sb.append("${i + 1}. ${q.question}\n") }
                findViewById<TextView>(R.id.tvBody).text = sb.ifEmpty { StringBuilder("لا أسئلة") }.toString()
            } catch (_: Exception) { findViewById<TextView>(R.id.tvBody).text = "حدث خطأ. حاول مرة أخرى." }
            findViewById<ProgressBar>(R.id.progress).visibility = View.GONE
        }
    }
}
