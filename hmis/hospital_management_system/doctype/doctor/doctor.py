# Copyright (c) 2025, Naman Agrawal and contributors
# For license information, please see license.txt

# import frappe
from frappe.website.website_generator import WebsiteGenerator

class Doctor(WebsiteGenerator):
	def before_save(self):
		if not self.route:
			self.route = f"doctor/{self.name}"
