package com.ajclassa.app.ui.activities

import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.*
import com.ajclassa.app.R
import com.ajclassa.app.admin.AdminGuards
import com.ajclassa.app.data.models.Perms
import com.ajclassa.app.data.models.Roles
import com.ajclassa.app.data.repositories.*
import com.ajclassa.app.ui.adapters.SimpleTextAdapter
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class AdminActivity : AppCompatActivity() {
    private val authRepo = AuthRepository()
    private val userRepo = UserRepository()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_admin)
        findViewById<View>(R.id.btnBack).setOnClickListener { finish() }
        val tvStats = findViewById<TextView>(R.id.tvStats)
        val rv = findViewById<RecyclerView>(R.id.recycler)
        rv.layoutManager = LinearLayoutManager(this)
        val etName = findViewById<EditText>(R.id.etName)
        val etUser = findViewById<EditText>(R.id.etUser)
        val etEmail = findViewById<EditText>(R.id.etEmail)
        val etPass = findViewById<EditText>(R.id.etPass)
        val spRole = findViewById<Spinner>(R.id.spRole)
        spRole.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, Roles.ALL)

        lifecycleScope.launch {
            val me = try { authRepo.currentUser() } catch (_: Exception) { null }
            try { AdminGuards.requireAdminPanel(me) }
            catch (_: Exception) { Toast.makeText(this@AdminActivity, "لا تملك الوصول للوحة الإدارة", Toast.LENGTH_LONG).show(); finish(); return@launch }
            refresh(tvStats, rv)
            findViewById<Button>(R.id.btnCreate).setOnClickListener {
                lifecycleScope.launch {
                    try {
                        AdminGuards.require(Perms.CREATE_USERS, me)
                        val email = etEmail.text.toString().trim()
                        val pw = etPass.text.toString()
                        if (email.isEmpty() || pw.length < 6 || etUser.text.isEmpty()) {
                            Toast.makeText(this@AdminActivity, "أكمل الحقول (كلمة المرور 6+)", Toast.LENGTH_SHORT).show(); return@launch
                        }
                        // NOTE: Creating real Auth users from client requires Admin SDK via secure backend.
                        // We create the Firestore user doc; Owner provisions Auth via backend/console, then links uid.
                        // Document the pending account so nothing is faked silently.
                        FirebaseRefs.users().add(mapOf(
                            "name" to etName.text.toString().trim(),
                            "username" to etUser.text.toString().trim(),
                            "email" to email,
                            "role" to (spRole.selectedItem as String),
                            "active" to true, "banned" to false,
                            "createdAt" to System.currentTimeMillis(),
                            "online" to false, "lastSeen" to 0L,
                            "mustChangePassword" to true,
                            "permissions" to emptyMap<String, Boolean>()
                        )).await()
                        me?.let { userRepo.audit(it, "create_user", email) }
                        Toast.makeText(this@AdminActivity, "تم إنشاء الملف — فعّل المصادقة من Backend", Toast.LENGTH_LONG).show()
                        refresh(tvStats, rv)
                    } catch (e: SecurityException) {
                        Toast.makeText(this@AdminActivity, e.message ?: "لا صلاحية", Toast.LENGTH_SHORT).show()
                    } catch (_: Exception) { Toast.makeText(this@AdminActivity, "حدث خطأ. حاول مرة أخرى.", Toast.LENGTH_SHORT).show() }
                }
            }
        }
    }

    private suspend fun refresh(tv: TextView, rv: RecyclerView) {
        try {
            val users = userRepo.all(100)
            val online = users.count { it.online }
            tv.text = "👥 الطلاب: ${users.size}   •   🟢 المتصلون: $online"
            rv.adapter = SimpleTextAdapter(users.map { "${it.name.ifBlank { it.username }} • ${it.role} • ${if (it.active && !it.banned) "نشط" else "معطّل"}" })
        } catch (_: Exception) { tv.text = "تعذر تحميل الإحصائيات" }
    }
}
