// Copyright (c) 2025, Naman Agrawal and contributors
// For license information, please see license.txt

frappe.ui.form.on('Appointment', {
    doctor: function (frm) {
        if (frm.doc.doctor) {
            frappe.call({
                method: "hmis.hospital_management_system.doctype.appointment.appointment.get_opd_dates",
                args: {
                    doctor: frm.doc.doctor
                },
                callback: function (r) {
                    if (Array.isArray(r.message)) {
                        if (frm.doc.date && !r.message.includes(frm.doc.date)) {
                            r.message.push(frm.doc.date);
                        }
                        frm.set_df_property("date", "options", r.message);
                        frm.refresh_field("date");
                    } else {
                        frm.set_df_property("date", "options", []);
                        frm.refresh_field("date");
                        frappe.msgprint("No OPD dates available for this doctor.");
                    }
                }
            });
        }
    }
});

frappe.ui.form.on('Appointment', {
    date: function (frm) {
        if (frm.doc.doctor && frm.doc.date) {
            frm.set_query('timings', function () {
                return {
                    query: 'hmis.hospital_management_system.doctype.appointment.appointment.get_filtered_opd_timings',
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

frappe.ui.form.on('Appointment', {
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

frappe.ui.form.on('Appointment', {
    refresh: function (frm) {
        frm.fields_dict["search_patient"].$wrapper.on('click', function () {
            if (!frm.doc.patient_mobile_no) {
                frappe.msgprint('Please enter a mobile number first.');
                return;
            }

            frappe.call({
                method: 'hmis.hospital_management_system.doctype.appointment.appointment.search_patients_by_mobile',
                args: {
                    mobile: frm.doc.patient_mobile_no
                },
                callback: function (r) {
                    if (Array.isArray(r.message) && r.message.length > 0) {
                        frm.set_value('patient', null);
                        frm.set_query('patient', () => {
                            return {
                                filters: [['name', 'in', r.message]]
                            };
                        });
                        if (r.message.length == 1) {
                            frm.set_value('patient', r.message[0]);
                        }
                        frappe.show_alert(`Found ${r.message.length} patient(s).`);
                    } else {
                        frappe.msgprint('No matching patients found.');
                    }
                }
            });
        });
    }
});

frappe.ui.form.on('Appointment', {
    refresh: function (frm) {
        if (frm.doc.status === 'Booked') {
            frm.set_read_only();
        }
    }
});