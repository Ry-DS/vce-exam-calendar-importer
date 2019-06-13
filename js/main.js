const CATEGORIES = {

    "Asian 5": ["Chemistry", "English", "Mathematical Methods", "Physics", "Specialist Mathematics"],
    "Common Subjects": ["Biology", "Accounting", "Psychology", "Further Mathematics", "Business Management", "Physical Education",
        "Visual Communication Design", "Economics", "Media"]

};
const isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
    return p.toString() === "[object SafariRemoteNotification]";
})(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));
let EXAMS;//idk how to make this constant if its fetched async
$.getJSON('data.json', function (data) {
    EXAMS = data;
    Object.freeze(EXAMS);
    $(function () {
        init();
    });
});

function init() {
    let selector = $('#subject-selector');
    for (let key in CATEGORIES) {//setting up categories in selector
        let subjects = CATEGORIES[key];
        subjects.sort();
        let html = [];
        subjects.forEach(subject => {
            html.push(`<option>${subject}</option>`)
        });
        selector.append(`<optgroup label="${key}">${html.join("\n")}</optgroup>`);


    }
    //chuck rest under other
    let html = [];
    EXAMS.subjects.sort();
    EXAMS.subjects.forEach(subject => {
        for (let key in CATEGORIES) {
            if (CATEGORIES[key].includes(subject))
                return;
        }
        html.push(`<option>${subject}</option>`);

    });
    selector.append(`<optgroup label="Other">${html.join("\\n")}</optgroup>`);


    //disable and enable button when needed
    selector.on('changed.bs.select', () => {
        if (selector.val().length > 0) {
            $('#create-btn').prop('disabled', false);
        } else $('#create-btn').prop('disabled', true);
    });
    //add button click listener
    $('#create-btn').click(() => sendCalendarFile(selector.val()));
    //init the picker, all data is now inside
    setTimeout(() => selector.selectpicker('refresh'), 200);//give time for DOM to refresh



}

function sendCalendarFile(values) {
    //one mistake i made is indexing the data.json by date. Now more stuff is needed to find the exam in the file.
    //oh well
    let examTimes = [];
    values.forEach(subject => {
        EXAMS.dates.forEach(date => {
            date.exams.forEach(examSlot => {
                examSlot.examsRunning.forEach(exam => {
                    if (exam === subject || (exam.includes(subject) && exam.includes("Exam"))) {//only be a little lenient if 'exam' is in the exam name e.g Examination 1, math subjects make use of this
                        examTimes.push({
                            name: exam.includes("Exam") ? exam : exam + " Exam",//append exam to name if it isn't already there, applies to anything that's not a math subject
                            startTime: examSlot.isoTime[0],
                            endTime: examSlot.isoTime[1]
                        });
                    }
                });
            });
        });


    });
    //start making timetable
    let calendar = ics();
    examTimes.forEach(exam => {
        //generating description with length of exam
        let diffMs = (new Date(exam.endTime) - new Date(exam.startTime)); // milliseconds between now & Christmas
        let diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
        let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
        let desc = "This exam is" + (diffHrs > 0 ? " " + diffHrs + " hr" + (diffHrs === 1 ? "" : "s") : "") + (diffMins > 0 ? " " + diffMins + " min" : "") + " long";
        calendar.addEvent(exam.name, desc, '', exam.startTime, exam.endTime);
    });
    if (isSafari) {
        //have to do this cause download doesn't work on safari
        window.open("data:text/calendar;charset=utf8," + encodeURI(calendar.build()));
    } else {
        calendar.download("VCE-Calendar");//send finished timetable to user!
        $('#finished-modal').modal('show');
    }

}