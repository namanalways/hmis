import frappe
from frappe.utils import nowdate
import re

@frappe.whitelist(allow_guest=True)
def get_opd_dates(doctor):
    if not doctor:
        return []

    today = nowdate()

    return frappe.get_all(
        "OPD Doctor Date Time",
        filters={
            "doctor": doctor,
            "date": [">=", today]
        },
        fields=["date"],
        distinct=True,
        order_by="date asc"
    )

@frappe.whitelist(allow_guest=True)
def get_opd_timings(doctor, date):
    if not doctor or not date:
        return []

    return frappe.get_all(
        "OPD Doctor Date Time",
        filters={
            "doctor": doctor,
            "date": date
        },
        fields=["timings"],
        distinct=True,
        order_by="timings asc"
    )

@frappe.whitelist(allow_guest=True)
def get_patient_ids_by_mobile(mobile_no):
    if not mobile_no:
        return []
    mobile_no = mobile_no[-10:]
    patients = frappe.get_all("Patient", fields=["name", "mobile_no","full_name"])
    matched = [
        {"name": p.name,
         "full_name": p.full_name}
        for p in patients
        if re.sub(r'\D', '', p.mobile_no or '')[-10:] == mobile_no
    ]
    return matched

@frappe.whitelist(allow_guest=True)
def get_patient_name_by_id(patient_id):
    return frappe.get_all(
        "Patient",
        filters={
            "patient_id": patient_id
        },
        fields=["name", "full_name"]
    )