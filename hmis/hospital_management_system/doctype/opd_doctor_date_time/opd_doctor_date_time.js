// Copyright (c) 2025, Naman Agrawal and contributors
// For license information, please see license.txt

frappe.ui.form.on('OPD Doctor Date Time', {
    refresh(frm) {
        frm.add_custom_button('Bulk Generate OPDs', () => {
            if (!frm.doc.doctor) {
                frappe.msgprint("Please select a Doctor first.");
                return;
            }

            if (!frm.doc.timings) {
                frappe.msgprint("Please select a Timing first.");
                return;
            }
            show_bulk_opd_dialog(frm);
        });
    }
});

function show_bulk_opd_dialog(frm) {
    let dialog;
    const month_options = moment.months();
    const current_year = moment().year();
    dialog = new frappe.ui.Dialog({
        title: 'Bulk OPD Generation',
        fields: [
            {
                label: 'Month',
                fieldname: 'month',
                fieldtype: 'Select',
                options: month_options,
                default: moment().format("MMMM"),
                reqd: 1
            },
            {
                label: 'Year',
                fieldname: 'year',
                fieldtype: 'Int',
                default: current_year,
                reqd: 1
            },
            {
                label: 'Dates',
                fieldname: 'dates_html',
                fieldtype: 'HTML'
            }
        ],
        primary_action_label: 'Generate OPDs',
        primary_action(values) {
            const selected_dates = [];
            dialog.get_field('dates_html').$wrapper
                .find('input.opd-date-checkbox:checked')
                .each(function () {
                    selected_dates.push($(this).val());
                });
            if (!selected_dates.length) {
                frappe.msgprint("Please select at least one date.");
                return;
            }
            frappe.call({
                method: 'hmis.hospital_management_system.doctype.opd_doctor_date_time.opd_doctor_date_time.bulk_generate_opds',
                args: {
                    doctor: frm.doc.doctor,
                    timing: frm.doc.timings,
                    dates: selected_dates
                },
                callback(r) {
                    if (r.message) {
                        frappe.msgprint(r.message);
                        dialog.hide();
                        frappe.set_route("List", "OPD Doctor Date Time", "List")
                    }
                }
            });
        }
    });
    dialog.show();
    dialog.fields_dict.month.df.onchange = () => generate_dates(dialog);
    dialog.fields_dict.year.df.onchange = () => generate_dates(dialog);
    generate_dates(dialog);
}

function generate_dates(dialog) {
    const month = dialog.get_value('month');
    const year = dialog.get_value('year');

    if (!month || !year) return;

    const monthIndex = moment().month(month).month();
    const start = moment([year, monthIndex]).startOf("month");
    const end = moment([year, monthIndex]).endOf("month");
    const today = moment();

    let current = moment.max(today, start);
    let html = `
        <div style="margin-bottom: 10px;">
            <label><input type="checkbox" id="toggle_all_dates" checked /> Select/Deselect All</label>
        </div>
    `;
    html += '<div style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; padding: 5px;">';
    while (current.isSameOrBefore(end)) {
        const dateStr = current.format("YYYY-MM-DD");
        const dayName = current.format("dddd");
        html += `
            <div>
                <label>
                    <input type="checkbox" class="opd-date-checkbox" value="${dateStr}" checked />
                    ${dateStr} (${dayName})
                </label>
            </div>
        `;
        current.add(1, 'day');
    }
    html += '</div>';
    const wrapper = dialog.get_field('dates_html').$wrapper;
    wrapper.html(html);
    wrapper.find('#toggle_all_dates').on('change', function () {
        const checked = $(this).is(':checked');
        wrapper.find('.opd-date-checkbox').prop('checked', checked);
    });
}

frappe.ui.form.on('OPD Doctor Date Time', {
    doctor(frm) {
        frm.set_value('timings', null);
    }
});

frappe.ui.form.on('OPD Doctor Date Time', {
    setup(frm) {
        frm.set_query('timings', () => {
            return {
                query: 'hmis.hospital_management_system.doctype.opd_doctor_date_time.opd_doctor_date_time.get_opd_timings_for_doctor',
                filters: {
                    doctor: frm.doc.doctor
                }
            };
        });
    }
});

frappe.ui.form.on('OPD Doctor Date Time', {
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