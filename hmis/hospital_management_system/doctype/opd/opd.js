// Copyright (c) 2025, Naman Agrawal and contributors
// For license information, please see license.txt

frappe.ui.form.on('OPD', {
    onload: function (frm) {
        frappe.call({
            method: "hmis.hospital_management_system.doctype.opd.opd.get_current_doctor",
            callback: function (r) {
                if (r.message) {
                    frm.set_value("doctor_id", r.message);
                }
                frm.set_value("date", frappe.datetime.get_today());
            }
        });
        frm.set_query('timings', function () {
                return {
                    query: 'hmis.hospital_management_system.doctype.opd.opd.get_filtered_opd_timings',
                    filters: {
                        doctor: frm.doc.doctor_id,
                        date: frm.doc.date
                    }
                };
            });
            frm.refresh_field('timings');
    }
});

frappe.ui.form.on('OPD', {
    refresh: function (frm) {
        frm.fields_dict["search_appointments"].$wrapper.on('click', function () {
            if (!frm.doc.doctor_id || !frm.doc.date || !frm.doc.timings) {
                frappe.msgprint("Please select Doctor, Date, and Timings.");
                return;
            }

            frappe.call({
                method: "hmis.hospital_management_system.doctype.opd.opd.get_appointments_with_tokens",
                args: {
                    doctor: frm.doc.doctor_id,
                    date: frm.doc.date,
                    timings: frm.doc.timings
                },
                callback: function (r) {
                    if (r.message && r.message.length) {
                        const options = r.message.map(appt => ({
                            label: `Token ${appt.token_no} - ${appt.patient_name}`,
                            value: appt.name,
                            data: appt
                        }));

                        const dialog = new frappe.ui.Dialog({
                            title: "Select Appointment Token",
                            fields: [
                                {
                                    fieldname: "appointment",
                                    label: "Appointment",
                                    fieldtype: "Select",
                                    options: options.map(opt => opt.label),
                                    reqd: 1
                                }
                            ],
                            primary_action_label: "Select",
                            primary_action(values) {
                                const selected = options.find(opt => opt.label === values.appointment);
                                if (selected && selected.data) {
                                    frm.set_value("appointment_no", selected.data.name);
                                    frm.set_value("patient_name", selected.data.patient_name);
                                    frm.set_value("patient_id", selected.data.patient);
                                    frm.set_value("patient_mobile_no", selected.data.patient_mobile_no);
                                    frm.set_value("token_no", selected.data.token_no);
                                    frm.set_value("illness_description", selected.data.illness_description);
                                    dialog.hide();
                                }
                            }
                        });

                        // Add Cancel Button
                        dialog.set_secondary_action_label("Cancel");
                        dialog.set_secondary_action(() => {
                            const selected_value = dialog.get_value("appointment");
                            const selected = options.find(opt => opt.label === selected_value);

                            if (selected && selected.data) {
                                frappe.call({
                                    method: "hmis.hospital_management_system.doctype.opd.opd.cancel_appointment",
                                    args: {
                                        appointment_id: selected.data.name
                                    },
                                    callback: function () {
                                        frappe.msgprint(`Appointment ${selected.data.name} cancelled.`);
                                        dialog.hide();
                                    }
                                });
                            } else {
                                frappe.msgprint("No appointment selected to cancel.");
                            }
                        });

                        dialog.show();
                    } else {
                        frappe.msgprint("No appointments with generated tokens found.");
                    }
                }
            });
        });
    }
});