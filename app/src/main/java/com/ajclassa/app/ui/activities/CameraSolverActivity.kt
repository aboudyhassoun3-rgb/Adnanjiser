package com.ajclassa.app.ui.activities

import android.app.Activity
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.util.Base64
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.lifecycle.lifecycleScope
import com.ajclassa.app.R
import com.ajclassa.app.ai.AiPrompts
import com.ajclassa.app.ai.MarkdownRenderer
import com.ajclassa.app.data.repositories.AiRepository
import com.ajclassa.app.utils.FileUtils
import com.ajclassa.app.utils.PrefsManager
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
import java.io.File

class CameraSolverActivity : AppCompatActivity() {
    private var photoUri: Uri? = null
    private var photoB64: String? = null
    private val REQ_CAMERA = 1001
    private val REQ_GALLERY = 1002

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_camera)
        findViewById<View>(R.id.btnBack).setOnClickListener { finish() }
        val img = findViewById<ImageView>(R.id.imgPreview)
        val tv = findViewById<TextView>(R.id.tvAnswer)
        val progress = findViewById<ProgressBar>(R.id.progress)

        findViewById<View>(R.id.btnCamera).setOnClickListener {
            val f = File(cacheDir, "q_${System.currentTimeMillis()}.jpg")
            val uri = FileProvider.getUriForFile(this, "$packageName.fileprovider", f)
            photoUri = uri
            val i = Intent(MediaStore.ACTION_IMAGE_CAPTURE).putExtra(MediaStore.EXTRA_OUTPUT, uri)
            startActivityForResult(i, REQ_CAMERA)
        }
        findViewById<View>(R.id.btnGallery).setOnClickListener {
            startActivityForResult(Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI), REQ_GALLERY)
        }
        findViewById<Button>(R.id.btnSolve).setOnClickListener {
            val b64 = photoB64 ?: run { Toast.makeText(this, "التقط صورة أولاً", Toast.LENGTH_SHORT).show(); return@setOnClickListener }
            progress.visibility = View.VISIBLE
            lifecycleScope.launch {
                try {
                    val prefs = PrefsManager(this@CameraSolverActivity)
                    val repo = AiRepository(prefs.aiBaseUrl, prefs.aiModel, prefs.aiProxyKey)
                    val ans = repo.vision(AiPrompts.VISION_SOLVE, b64)
                    MarkdownRenderer.renderInto(tv, ans)
                    img.visibility = View.VISIBLE
                } catch (_: Exception) {
                    tv.text = "حدث خطأ. حاول مرة أخرى."
                } finally { progress.visibility = View.GONE }
            }
        }
        Unit.also { img; Unit }
    }

    @Deprecated("deprecated")
    override fun onActivityResult(rc: Int, res: Int, data: Intent?) {
        super.onActivityResult(rc, res, data)
        if (res != Activity.RESULT_OK) return
        val img = findViewById<ImageView>(R.id.imgPreview)
        try {
            val uri: Uri? = if (rc == REQ_CAMERA) photoUri else data?.data
            if (uri == null) return
            img.setImageURI(uri); img.visibility = View.VISIBLE
            val bytes = FileUtils.compressImage(this, uri) ?: contentResolver.openInputStream(uri)?.readBytes()
            if (bytes != null) photoB64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
        } catch (_: Exception) { Toast.makeText(this, "تعذر قراءة الصورة", Toast.LENGTH_SHORT).show() }
    }
}
