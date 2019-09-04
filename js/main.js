const CATEGORIES = {

    "Asian 5": ["Chemistry", "English", "Mathematical Methods", "Physics", "Specialist Mathematics"],
    "Common Subjects": ["Biology", "Accounting", "Psychology", "Further Mathematics", "Business Management", "Physical Education",
        "Visual Communication Design", "Economics", "Media"]

};

(function () {
    //ios specific stuff
    //https://stackoverflow.com/questions/9038625/detect-if-device-is-ios
    let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
        $('#create-btn').addClass('hide');
        $('#ios-info').removeClass('hide');
        $('#ios-buttons').removeClass('hide');

    }
    //prepare parsing exams
    let EXAMS;
    $.getJSON('data.json', function (data) {
        EXAMS = data;
        Object.freeze(EXAMS);
        $(function () {
            init();
        });
    });

    function init() {
        let selector = $('#subject-selector');
        selector.select2();
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
        selector.on('change', () => {
            if (typeof selector.val() === 'string' || selector.val().length > 0) {//value selected
                if (!isIOS)
                    $('#create-btn').prop('disabled', false);
                else {
                    updateIOS(selector.val());
                }
            } else $('#create-btn').prop('disabled', true);
        });

        selector.val(null);
        //add button click listener
        $('#create-btn').click(() => sendCalendarFile(selector.val()));
        if (isIOS) {
            $('#create-btn').text('Add to Google Calendar');
        }
        //init the picker, all data is now inside
        setTimeout(() => selector.select2({
            maximumSelectionLength: 6, placeholder: 'Pick your Subject' + (isIOS ? '' : '(s)')
            , multiple: !isIOS
        }), 200);//give time for DOM to refresh


    }

    function sendCalendarFile(values) {
        let examTimes = getExamsForSubjects.apply(this, values);
        //start making timetable

        let calendar = ics();
        examTimes.forEach(exam => {
            let event = generateEvent(exam);
            calendar.addEvent(event.title, event.details, '', event.start, event.end);
        });
        calendar.download("VCE-Calendar");//send finished timetable to user!
        $('#finished-modal').modal('show');

    }

    //generate a calendar event from an exam with a description, to be used for a file or link
    function generateEvent(exam) {

        //generating description with length of exam
        let diffMs = (new Date(exam.endTime) - new Date(exam.startTime));
        let diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
        let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
        let desc = "This exam is" + (diffHrs > 0 ? " " + diffHrs + " hr" + (diffHrs === 1 ? "" : "s") : "") + (diffMins > 0 ? " " + diffMins + " min" : "") + " long";
        return {title: exam.name, details: desc, start: new Date(exam.startTime), end: new Date(exam.endTime)};

    }

    //get exams for the given subjects. Math subjects may give two exams.
    function getExamsForSubjects(...subjects) {
        let examTimes = [];
        subjects.forEach(subject => {
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

        return examTimes;
    }

    function updateIOS(value) {
        let examTimes = getExamsForSubjects(value);

        let list = $('#ios-buttons');
        list.empty();
        let events = examTimes.map(generateEvent);

        for (let i = 0; i < events.length; i++) {
            let button = $(`<li><button class="btn btn-success" > Add ${events.length === 1 ? '' : `Exam ${i + 1}`} to Google Calendar</button></li>`);
            button.children().click(() => window.open(googleCalendar.generateUrl(events[i])));
            list.append(button);
        }

    }


})();
