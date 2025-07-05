// Copyright (c) 2025, Naman Agrawal and contributors
// For license information, please see license.txt

frappe.ui.form.on('Doctor', {
    onload: function (frm) {
        frm.set_query('doctor_email', function () {
            return {
                query: "hmis.utils.get_doctor_users"
            };
        });
    }
});

frappe.ui.form.on('Doctor', {
    doctor_email: function (frm) {
        if (frm.doc.doctor_email) {
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "User",
                    name: frm.doc.doctor_email
                },
                callback: function (r) {
                    if (r.message) {
                        const user = r.message;
                        const full_name = [
                            user.first_name || '',
                            user.middle_name || '',
                            user.last_name || ''
                        ].filter(Boolean).join(" ");
                        frm.set_value("doctor_name", full_name);
                    }
                }
            });
        } else {
            frm.set_value("doctor_name", "");
        }
    }
});