# Copyright (c) 2025, Naman Agrawal and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document

class Doctor(Document):
	def before_save(self):
		if not self.route:
			self.route = f"doctor/{self.name}"