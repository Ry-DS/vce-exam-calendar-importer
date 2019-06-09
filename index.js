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
    let dateElements=$('th');//this gets the date column
    dateElements.each((i,d)=>{//for every date column
        if(i<6)//we skip the first few cause they don't look like exams with proper dates
            return;
        let date=$(d).text().replace(/\s\s+/g, ' ');//get the date text and clean it up

        let exams=[];//getting ready to store all exams on that day
        for(let i=1;i<d.parent.children.length;i++){//jump to parent and read all exams on date. skip first cause thats the date
            let exam={};
            exam.examsRunning=[];

            let element=d.parent.children[i];
            for (let j = 0; j < element.children.length; j++) {//read exams at time
                console.log(element.children[j]);
                if(j===0)
                {
                    exam.time=$(element.children[j]).text().replace(/\s\s+/g, ' ').trim();
                    if(exam.time.includes('Melbourne')){
                        console.log("foo");
                    }
                    continue;
                }
                let text=$(element.children[j]).text().replace(/\s\s+/g, ' ').trim();
                if(text==='This examination commences with a 5-minute reading period.')
                    continue;
                exam.examsRunning.push(text);
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

});