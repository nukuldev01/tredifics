from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Address, EmailOTP, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("email", "username", "first_name", "last_name", "country", "is_staff")
    search_fields = ("email", "username", "first_name", "last_name")
    list_filter = ("is_staff", "is_active", "country")
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Tredific", {"fields": ("phone", "country", "marketing_opt_in")}),
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("full_name", "city", "country", "is_default", "user")
    search_fields = ("full_name", "city", "user__email")
    list_filter = ("country", "is_default")


@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ("email", "code", "consumed", "expires_at", "created_at")
    readonly_fields = ("email", "code", "consumed", "expires_at", "created_at")
