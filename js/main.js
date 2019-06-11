const CATEGORIES = {

    "Asian 5": ["Chemistry", "English", "Mathematical Methods", "Physics", "Specialist Mathematics"],
    "Common Subjects": ["Biology", "Accounting", "Psychology", "Further Mathematics", "Business Management", "Physical Education",
        "Visual Communication Design", "Economics", "Media"]

};
let EXAMS;//idk how to make this constant if its fetched async
$.getJSON('data.json', function (data) {
    EXAMS = data;
    Object.freeze(EXAMS);
    init();
});

function init() {
    let selector = $('#subject-selector');
    for (let key in CATEGORIES) {//setting up categories subjects in selector
        let subjects = CATEGORIES[key];
        let html = [];
        subjects.forEach(subject => {
            html.push(`<option>${subject}</option>`)
        });
        selector.append(`<optgroup label="${key}">${html.join("\n")}</optgroup>`);


    }
    //chuck rest under other
    let html = [];
    EXAMS.subjects.forEach(subject => {
        for (let key in CATEGORIES) {
            if (CATEGORIES[key].includes(subject))
                return;
        }
        html.push(`<option>${subject}</option>`);

    });
    selector.append(`<optgroup label="Other">${html.join("\\n")}</optgroup>`);


}