package com.ajclassa.app.ui.fragments

import android.content.Intent
import android.os.Bundle
import android.view.*
import android.widget.*
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.ajclassa.app.R
import com.ajclassa.app.data.models.canAccessAdmin
import com.ajclassa.app.data.repositories.AuthRepository
import com.ajclassa.app.ui.activities.*
import com.ajclassa.app.utils.PrefsManager
import com.ajclassa.app.utils.TimeUtils
import kotlinx.coroutines.launch

class ProfileFragment : Fragment() {
    private val auth = AuthRepository()
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View =
        i.inflate(R.layout.fragment_profile, c, false)
    override fun onViewCreated(v: View, s: Bundle?) {
        val prefs = PrefsManager(requireContext())
        val tvName = v.findViewById<TextView>(R.id.tvName)
        val tvMeta = v.findViewById<TextView>(R.id.tvMeta)
        val btnAdmin = v.findViewById<Button>(R.id.btnAdmin)
        v.findViewById<View>(R.id.rowTools).setOnClickListener { startActivity(Intent(requireContext(), StudyToolsActivity::class.java)) }
        v.findViewById<View>(R.id.rowProfile).setOnClickListener { startActivity(Intent(requireContext(), ProfileActivity::class.java)) }
        v.findViewById<Switch>(R.id.swMemory).apply {
            isChecked = prefs.aiMemoryOn
            setOnCheckedChangeListener { _, b -> prefs.aiMemoryOn = b }
        }
        v.findViewById<Button>(R.id.btnLogout).setOnClickListener {
            lifecycleScope.launch {
                val u = try { auth.currentUser() } catch (_: Exception) { null }
                auth.signOut(u?.uid)
                startActivity(Intent(requireContext(), AuthActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK))
            }
        }
        lifecycleScope.launch {
            val u = try { auth.currentUser() } catch (_: Exception) { null }
            if (u != null) {
                tvName.text = u.name.ifBlank { u.username }
                tvMeta.text = "${u.role} • ${TimeUtils.lastSeenLabel(u.lastSeen, u.online)}"
                btnAdmin.visibility = if (u.canAccessAdmin()) View.VISIBLE else View.GONE
                btnAdmin.setOnClickListener { startActivity(Intent(requireContext(), AdminActivity::class.java)) }
            }
        }
    }
}
