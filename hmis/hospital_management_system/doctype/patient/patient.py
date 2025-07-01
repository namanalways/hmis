# Copyright (c) 2025, Naman Agrawal and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
from datetime import datetime
import frappe


class Patient(Document):
	def autoname(self):
		date_str = datetime.now().strftime('%y%m%d')
		today_count = frappe.db.count(
            'Patient',
            filters={
                'patient_id': ['like', f'P-{date_str}-%']
            }
        ) + 1
		serial = f'{today_count:04d}'
		self.patient_id = f'P-{date_str}-{serial}'
