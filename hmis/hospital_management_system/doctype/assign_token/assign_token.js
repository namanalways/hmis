// Copyright (c) 2025, Naman Agrawal and contributors
// For license information, please see license.txt

frappe.ui.form.on('Assign Token', {
    doctor: function (frm) {
        if (frm.doc.doctor) {
            frappe.call({
                method: "hmis.hospital_management_system.doctype.assign_token.assign_token.get_opd_dates",
                args: {
                    doctor: frm.doc.doctor
                },
                callback: function (r) {
                    const dates = r.message || [];
                    if (Array.isArray(dates) && dates.length > 0) {
                        if (!dates.includes(frm.doc.date)) {
                            frm.set_value("date", null);
                        }
                        frm.set_df_property("date", "options", dates);
                        frm.refresh_field("date");
                    } else {
                        frm.set_df_property("date", "options", []);
                        frm.set_value("date", null);
                        frm.refresh_field("date");
                        frappe.msgprint("No OPD dates available for this doctor.");
                    }
                }
            });
        }
    }
});

frappe.ui.form.on('Assign Token', {
    date: function (frm) {
        if (frm.doc.doctor && frm.doc.date) {
            frm.set_query('timings', function () {
                return {
                    query: 'hmis.hospital_management_system.doctype.assign_token.assign_token.get_filtered_opd_timings',
                    filters: {
                        doctor: frm.doc.doctor,
                        date: frm.doc.date
                    }
                };
            });
            frm.refresh_field('timings');
        }
    }
});

frappe.ui.form.on('Assign Token', {
    refresh: function (frm) {
        frm.fields_dict["search_appointments"].$wrapper.on('click', function () {
            if (!frm.doc.doctor || !frm.doc.date || !frm.doc.timings) {
                frappe.msgprint("Please select Doctor, Date, and Time.");
                return;
            }
            const existing_appointments = (frm.doc.appointments || []).map(row => row.appointment);
            const existing_count = existing_appointments.length;
            frappe.call({
                method: 'hmis.hospital_management_system.doctype.assign_token.assign_token.get_appointments_for_token',
                args: {
                    doctor: frm.doc.doctor,
                    date: frm.doc.date,
                    time: frm.doc.timings
                },
                callback: function (r) {
                    if (r.message && r.message.length) {
                        let new_count = 0;
                        r.message.forEach((appt, idx) => {
                            if (!existing_appointments.includes(appt.name)) {
                                frm.add_child("appointments", {
                                    appointment: appt.name,
                                });
                                new_count++;
                            }
                        });

                        if (new_count > 0) {
                            frm.refresh_field("appointments");
                            frm.save().then(() => {
                                frappe.msgprint(`${new_count} new appointments added and saved.`);
                            });
                        } else {
                            frappe.msgprint("No new appointments found to add.");
                        }
                    } else {
                        frappe.msgprint("No appointments found for this selection.");
                    }
                }
            });
        });
    }
});

frappe.ui.form.on('Assign Token', {
    refresh: function (frm) {
        frm.fields_dict["assign_token_no"].$wrapper.on('click', function () {
            if (!frm.doc.name || frm.is_new()) {
                frappe.msgprint("Please save the Assign Token document first.");
                return;
            }
            frappe.call({
                method: 'hmis.hospital_management_system.doctype.assign_token.assign_token.assign_token_no',
                args: {
                    assign_token_name: frm.doc.name
                },
                callback: function (r) {
                    frappe.msgprint(r.message);
                    frm.reload_doc().then(() => {
                        frm.doc.appointments.forEach(row => {
                            frappe.model.with_doc('Appointment', row.appointment, function() {
                                const appt = frappe.model.get_doc('Appointment', row.appointment);
                                row.token_no = appt.token_no;
                                frm.refresh_field("appointments");
                            });
                        });
                    });
                }
            });
        });
    }
});

frappe.ui.form.on('Assign Token', {
    onload: function (frm) {
        frm.set_query('doctor', function () {
            return {
                filters: {
                    is_active: 1
                }
            };
        });
    }
});