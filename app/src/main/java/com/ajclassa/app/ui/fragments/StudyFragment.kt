package com.ajclassa.app.ui.fragments

import android.content.Intent
import android.os.Bundle
import android.view.*
import android.widget.*
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.*
import com.ajclassa.app.R
import com.ajclassa.app.ui.activities.SubjectDetailActivity
import com.ajclassa.app.ui.adapters.SubjectAdapter
import com.ajclassa.app.ui.viewmodels.StudyViewModel
import com.ajclassa.app.utils.UiState

class StudyFragment : Fragment() {
    private val vm: StudyViewModel by viewModels()
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View =
        i.inflate(R.layout.fragment_list, c, false)
    override fun onViewCreated(v: View, s: Bundle?) {
        v.findViewById<TextView>(R.id.tvTitle).text = "📚 الدراسة"
        val rv = v.findViewById<RecyclerView>(R.id.recycler)
        val progress = v.findViewById<ProgressBar>(R.id.progress)
        val empty = v.findViewById<TextView>(R.id.tvEmpty)
        val adapter = SubjectAdapter { sub ->
            startActivity(Intent(requireContext(), SubjectDetailActivity::class.java).putExtra("subjectId", sub.id).putExtra("subjectName", sub.nameAr.ifBlank { sub.name }))
        }
        rv.layoutManager = GridLayoutManager(requireContext(), 2)
        rv.adapter = adapter
        vm.subjects.observe(viewLifecycleOwner) { st ->
            progress.visibility = if (st is UiState.Loading) View.VISIBLE else View.GONE
            if (st is UiState.Success) adapter.submit(st.data)
            empty.visibility = if (st is UiState.Empty) View.VISIBLE else View.GONE
            if (st is UiState.Error) { empty.text = st.message; empty.visibility = View.VISIBLE }
        }
        vm.load()
    }
}
