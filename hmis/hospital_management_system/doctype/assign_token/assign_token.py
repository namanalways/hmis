# Copyright (c) 2025, Naman Agrawal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from datetime import datetime, date


class AssignToken(Document):

    def autoname(self):
        if self.doctor and self.date and self.timings:
            doctor = self.doctor
            date_str = self.date
            time_str = self.timings

            self.name1 = f"{doctor}-{date_str}-{time_str}"
        else:
            frappe.throw("Doctor, Date, and Time must be set to generate the name.")

    def before_save(self):
        if self.doctor and self.date and self.timings:
            opd_slot = frappe.db.get_value(
                "OPD Doctor Date Time",
                {
                    "doctor": self.doctor,
                    "date": self.date,
                    "timings": self.timings,
                },
                "name"
            )
            if opd_slot:
                self.opd = opd_slot
                self.selected_date = self.date
            else:
                frappe.throw("No matching OPD slot found for the selected doctor, date, and time.")

@frappe.whitelist()
def get_opd_dates(doctor):
    today = date.today()
    opd_dates = frappe.get_all(
        "OPD Doctor Date Time",
        filters={
            "doctor": doctor,
            "date": [">=", today],
            },
        fields=["date"],
        distinct=True
    )
    return [d.date.strftime("%Y-%m-%d") for d in opd_dates]

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
def get_appointments_for_token(doctor, date, time):
    appointments = frappe.get_all("Appointment",
        filters={
            "doctor": doctor,
            "date": date,
            "timings": time,
            "status": "Booked"
        },
        fields=["name", "creation"],
        order_by="creation asc"
    )
    return appointments

@frappe.whitelist()
def assign_token_no(assign_token_name):
    doc = frappe.get_doc("Assign Token", assign_token_name)

    if not doc.appointments:
        frappe.throw("No appointments found in the child table.")
    existing_token_nos = [
        frappe.db.get_value("Appointment", row.appointment, "token_no")
        for row in doc.appointments
    ]
    max_existing_token = max(
        [int(t) for t in existing_token_nos if t and t.isdigit()],
        default=0
    )
    token_counter = max_existing_token + 1
    updated = 0

    for row in doc.appointments:
        appt = frappe.get_doc("Appointment", row.appointment)
        appt.reload() 
        if not appt.token_no:
            appt.db_set("token_no", token_counter)
            appt.db_set("status", "Ongoing")
            token_counter += 1
            updated += 1
    frappe.db.set_value("Assign Token", assign_token_name, "token_generated", 1)

    return f"{updated} appointments assigned token numbers. Token generation marked complete."