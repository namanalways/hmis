frappe.ready(() => {
    frappe.web_form.on('doctor', (field, value) => {
        if (!value) return;
        frappe.web_form.set_value('date', '');
        frappe.web_form.set_value('time', '');
        frappe.call({
            method: 'hmis.hospital_management_system.api.opd_booking.get_opd_dates',
            args: { doctor: value },
            callback: r => {
                if (r.message && r.message.length) {
                    let options = r.message.map(d => d.date);
                    frappe.web_form.set_df_property('date', 'options', options);
                } else {
                    frappe.msgprint('No available OPD dates for the selected doctor.');
                }
            }
        });
    });

    frappe.web_form.on('date', () => {
        const doctor = frappe.web_form.get_value('doctor');
        const date = frappe.web_form.get_value('date');

        if (!doctor || !date) return;

        frappe.call({
            method: 'hmis.hospital_management_system.api.opd_booking.get_opd_timings',
            args: { doctor, date },
            callback: function (r) {
                if (r.message) {
                    const time_options = r.message.map(d => d.timings);
                    frappe.web_form.set_df_property('time', 'options', time_options);
                }
            }
        });
    });

    frappe.web_form.on('time', () => {
        frappe.web_form.set_value('timings', frappe.web_form.get_value('time'));
    });

    frappe.web_form.on('patient_mobile_no', (field, value) => {
        const digits = value.replace(/\D/g, "");

        if (digits.length < 10) {
            frappe.web_form.set_df_property('pid', 'options', []);
            frappe.web_form.set_value('pid', '');
            return;
        }
        if (digits.length === 12) {
            frappe.call({
                method: 'hmis.hospital_management_system.api.opd_booking.get_patient_ids_by_mobile',
                args: { mobile_no: digits },
                callback: r => {
                    if (r.message && r.message.length > 0) {
                        const options = r.message.map(row => row.name);
                        frappe.web_form.set_df_property('pid', 'options', options);
                        if (r.message.length === 1) {
                            frappe.web_form.set_value('pid', r.message[0].name);
                            frappe.web_form.set_value('patient_name', r.message[0].full_name);
                            frappe.web_form.set_value('patient', r.message[0].name);
                        }
                    } else {
                        frappe.msgprint("No patients found with this mobile number.");
                        frappe.web_form.set_df_property('pid', 'options', []);
                        frappe.web_form.set_value('pid', '');
                    }
                }
            });
        }
    });

    frappe.web_form.on('pid', (field, value) => {
        if (!value) {
            frappe.web_form.set_value('patient', '');
            frappe.web_form.set_value('patient_name', '');
            return;
        }
        frappe.call({
            method: 'hmis.hospital_management_system.api.opd_booking.get_patient_name_by_id',
            args: { patient_id: value },
            callback: r => {
                if (r.message) {
                    frappe.web_form.set_value('patient_name', r.message[0].full_name);
                    frappe.web_form.set_value('patient', r.message[0].name);
                }
            }          
        });
    });
});
