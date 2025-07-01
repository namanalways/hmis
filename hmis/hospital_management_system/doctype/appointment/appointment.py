# Copyright (c) 2025, Naman Agrawal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from datetime import datetime, date


class Appointment(Document):

    def autoname(self):
        date_str = datetime.now().strftime('%y%m%d')
        today_count = frappe.db.count(
            'Appointment',
            filters={
                'appointment_id': ['like', f'A-{date_str}-%']
            }
        )
        today_count += 1
        serial = f'{today_count:04d}'
        self.appointment_id = f'A-{date_str}-{serial}'

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
                self.status = "Booked"
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
def search_patients_by_mobile(mobile):
    patients = frappe.get_all(
        'Patient',
        filters={'mobile_no': ['like', f'%{mobile}%']},
        fields=['name']
    )
    return [p.name for p in patients]