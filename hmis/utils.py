import frappe
from frappe import whitelist

@frappe.whitelist()
def get_doctor_users(doctype, txt, searchfield, start, page_len, filters):
    return frappe.db.sql("""
        SELECT name
        FROM `tabUser`
        WHERE is_doctor = 1 AND enabled = 1 AND name LIKE %s
        ORDER BY name ASC
        LIMIT %s OFFSET %s
    """, (f"%{txt}%", page_len, start))
