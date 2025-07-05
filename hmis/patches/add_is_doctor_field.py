import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_field

def execute():
    if not frappe.db.exists("Custom Field", {"dt": "User", "fieldname": "is_doctor"}):
        create_custom_field("User", {
            "fieldname": "is_doctor",
            "label": "Is Doctor",
            "fieldtype": "Check",
            "insert_after": "email",
        })