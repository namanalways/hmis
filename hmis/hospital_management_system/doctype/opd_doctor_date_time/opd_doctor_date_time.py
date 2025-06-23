# Copyright (c) 2025, Naman Agrawal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import json
from frappe.utils import getdate, nowdate


class OPDDoctorDateTime(Document):
	def validate(self):
		if self.date and getdate(self.date) < getdate(nowdate()):
			frappe.throw("Backdated OPD creation is not allowed. Please select today or a future date.")

@frappe.whitelist()
def bulk_generate_opds(doctor, timing, dates):
	print(doctor)
	print(timing)
	print(dates)
	if isinstance(dates, str):
		dates = json.loads(dates)
	# If the value is a label, find the corresponding name
	timing_name = frappe.db.get_value("OPD Timings Time", {"timings": timing}, "name")  # adjust fieldname if needed

	if not timing_name:
		frappe.throw(f"Timing '{timing}' not found in OPD Timing Time")

	created = []
	for d in dates:
		d = getdate(d)

		if frappe.db.exists("OPD Doctor Date Time", {
			"doctor": doctor,
			"timings": timing_name,
			"date": d
		}):
			frappe.throw(f"OPD already exists on {d}")

		doc = frappe.new_doc("OPD Doctor Date Time")
		doc.doctor = doctor
		doc.date = d
		doc.timings = timing_name
		doc.docstatus = 1
		doc.insert()
		created.append(str(d))

	return f"OPDs created for: {', '.join(created)}"

@frappe.whitelist()
def get_opd_timings_for_doctor(doctype, txt, searchfield, start, page_len, filters):
    doctor = filters.get("doctor")
    if not doctor:
        return []

    # Fetch timing names from child table of Doctor
    timings = frappe.get_all("OPD Timings",  # Assuming this is your child table name
        filters={"parent": doctor, "parenttype": "Doctor"},
        fields=["time_slot"],  # `opd_time` is the Link field in the child table
    )

    timing_names = [t.time_slot for t in timings if t.time_slot]

    if not timing_names:
        return []

    return frappe.db.sql("""
        SELECT name FROM `tabOPD Timings Time`
        WHERE name IN (%s)
        AND name LIKE %s
        ORDER BY name
    """ % (", ".join(["%s"] * len(timing_names)), "%s"),
        timing_names + [f"%{txt}%"]
    )
