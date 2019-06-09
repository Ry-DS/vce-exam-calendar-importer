console.log("hello!");
const siteUrl = "https://www.vcaa.vic.edu.au/administration/Key-dates/Pages/VCE-exam-timetable.aspx";
const axios = require("axios");
const cheerio = require("cheerio");
const fetchData = async () => {
    const result = await axios.get(siteUrl);
    return cheerio.load(result.data);
};
fetchData().then($=>{
    let dates=[];
    let subjects = [];
    let dateElements=$('th');//this gets the date column
    dateElements.each((i,d)=>{//for every date column
        if(i<6)//we skip the first few cause they don't look like exams with proper dates
            return;
        let date = cleanup($(d).text());//get the date text and clean it up

        let exams=[];//getting ready to store all exams on that day
        for(let i=1;i<d.parent.children.length;i++){//jump to parent and read all exams on date. skip first cause thats the date
            let exam = {};//the tag of the parent is <tr>
            exam.examsRunning=[];

            let element = d.parent.children[i];//from tr to td
            let arr = element.children; //from td to p
            arr = arr.filter(val => {

                return cleanup($(val).text()) !== "";//filter out invalid exams, they have to not be an empty line
            });
            for (let j = 0; j < arr.length; j++) {//read exams at time
                let examLine = $(arr[j]);
                let examText = cleanup(examLine.text());
                if (examText === 'This examination commences with a 5-minute reading period.')//ignore this thing
                    continue;
                if(j===0)
                {
                    exam.time = examText;

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
            console.log(exam);
        }
        dates.push({
            date: date,
            exams: exams
        });


    });
    console.log(dates);
    console.log(subjects);

});

function cleanup(string) {
    return string.replace(/\s\s+/g, ' ').trim();
}