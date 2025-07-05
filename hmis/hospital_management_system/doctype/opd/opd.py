# Copyright (c) 2025, Naman Agrawal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from datetime import datetime, date


class OPD(Document):
	def autoname(self):
		date_str = datetime.now().strftime('%y%m%d')
		today_count = frappe.db.count(
            'OPD',
            filters={
                'opd_id': ['like', f'OPD-{date_str}-%']
            }
		)
		today_count += 1
		serial = f'{today_count:04d}'
		self.opd_id = f'OPD-{date_str}-{serial}'

@frappe.whitelist()
def get_current_doctor():
    user = frappe.session.user
    doctor_name = frappe.db.get_value("Doctor", {"doctor_email": user}, "name")
    return doctor_name

@frappe.whitelist()
def get_filtered_opd_timings(doctype, txt, searchfield, start, page_len, filters):
    return frappe.db.sql("""
        SELECT timings
        FROM `tabOPD Doctor Date Time`
        WHERE doctor = %s AND date = %s AND timings LIKE %s
        LIMIT %s OFFSET %s
    """, (
        filters.get("doctor"),
        filters.get("date"),
        f"%{txt}%",
        page_len,
        start
    ))

@frappe.whitelist()
def get_appointments_with_tokens(doctor, date, timings):
    return frappe.get_all("Appointment",
        filters={
            "doctor": doctor,
            "date": date,
            "timings": timings,
            "token_no": ["is", "set"],
            "status": "Ongoing"
        },
        fields=["name", "token_no", "patient_name", "patient", "patient_mobile_no", "illness_description"],
        order_by="token_no asc"
    )
@frappe.whitelist()
def cancel_appointment(appointment_id):
    if not appointment_id:
        frappe.throw("No appointment ID provided.")
    frappe.db.set_value("Appointment", appointment_id, "status", "Cancelled")
    frappe.db.commit()
    return "Cancelled"