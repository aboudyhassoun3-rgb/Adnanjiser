package com.ajclassa.app.admin

import com.ajclassa.app.data.models.AppUser
import com.ajclassa.app.data.models.canAccessAdmin
import com.ajclassa.app.data.models.hasPerm
import com.ajclassa.app.data.models.isOwner
import com.ajclassa.app.data.models.Perms

object AdminGuards {
    fun require(perm: String, user: AppUser?) {
        if (user == null) throw SecurityException("غير مسجل الدخول")
        if (user.isOwner()) return
        if (!user.hasPerm(perm)) throw SecurityException("لا تملك الصلاحية: $perm")
    }
    fun requireAdminPanel(user: AppUser?) {
        if (user == null || !user.canAccessAdmin()) throw SecurityException("لا تملك الوصول للوحة الإدارة")
    }
    fun requireOwner(user: AppUser?) {
        if (user == null || !user.isOwner()) throw SecurityException("Owner فقط")
    }
    val MANAGEABLE_PERMS: List<String> = Perms.ALL
}
