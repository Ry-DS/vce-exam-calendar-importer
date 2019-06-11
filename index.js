//run this with node to generate data.json file. Then, this file will be used by the website to generate ics files.

//consts
const siteUrl = "https://www.vcaa.vic.edu.au/administration/Key-dates/Pages/VCE-exam-timetable.aspx";
const axios = require("axios");
const cheerio = require("cheerio");
const fileSystem = require("fs");
const moment = require("moment");

//getting data from website
const fetchData = async () => {
    const result = await axios.get(siteUrl);
    return cheerio.load(result.data);
};
console.log("Fetching Data from " + siteUrl);
//everything important here
fetchData().then($=>{
    let dates=[];
    let subjects = [];
    let dateElements=$('th');//this gets the date column
    dateElements.each((i,d)=>{//for every date column
        if(i<6)//we skip the first few cause they don't look like exams with proper dates
            return;
        let date = cleanup($(d).text());//get the date text and clean it up

        let exams=[];//getting ready to store all exams on that day
        for(let i=1; i<d.parent.children.length; i++){//jump to parent and read all exams on date. skip first cause thats the date
            let exam = {};//the tag of the parent is <tr>
            exam.examsRunning=[];

            let element = d.parent.children[i];//from tr to td
            let arr = element.children; //from td to p
            arr = arr.filter(val => {

                return cleanup($(val).text()) !== "";//filter out invalid exams, they have to not be an empty line
            });
            for (let j = 0; j < arr.length; j++) {//read exams with their time on single data
                let examLine = $(arr[j]);
                let examText = cleanup(examLine.text());
                if (examText === 'This examination commences with a 5-minute reading period.')//ignore this thing
                    continue;
                if(j===0) {
                    exam.time = examText;
                    exam.isoTime = parseTime(examText, date);
                    if (exam.time.includes('Melbourne')) {
                        console.log("foo");//little fun place to put a breakpoint, idk why anymore
                    }
                    continue;
                }
                if (!subjects.includes(examText.replace(/Examination \d/, '').trim()))//push new subjects aswell, ignore the exam x thing, cause math subjects have it
                    subjects.push(examText.replace(/Examination \d/, '').trim());

                exam.examsRunning.push(examText);
            }

            exams.push(exam);
        }
        dates.push({
            date: date,
            exams: exams
        });


    });
    console.log("Finished Parsing, writing to file data.json...");
    fileSystem.writeFile("data.json", JSON.stringify(
        {dates: dates, subjects: subjects, timeGenerated: new Date()},
        null, 2), 'utf8', () => {
        console.log("Completed");
    });
});

function cleanup(string) {
    return string.replace(/\s\s+/g, ' ').trim();
}

function parseTime(time, date) {
    let split = time.split('–');
    date = date.split(' ').splice(0).join(' ');//cut out the day
    let firstTime = date + ' ' + split[0];//e.g 28 October 2019 9.25am
    let secondTime = date + ' ' + split[1];
    let format = 'D MMM h.mma';
    return [moment(firstTime, format).toISOString(), moment(secondTime, format).toISOString()];


}