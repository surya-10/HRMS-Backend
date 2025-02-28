// const nlp = require('compromise');
const chrono = require('chrono-node');
const { createTimeoff } = require('./timeoff.controller');
const { inferReason } = require('../../utils/Gemini AI/gemini.reasonExtractor');
const { getAllHolidays } = require('./holiday.controller');
const Holiday = require("../../model/Auth/holiday.model.js");


// exports.getDateAndReason = async (req, res) => {
//     try {
//         const { data } = req.body;
//         if (!data) {
//             return res.status(400).json({ error: "No input data provided" });
//         }

//         const doc = nlp(data);
//         let dates = doc.match('#Date').out('array');

//         // Regex for additional date formats (e.g., "Feb 12 2025", "12-02-2025", etc.)
//         const dateRegex = /\b(\w{3,9} \d{1,2},? \d{4}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/gi;
//         const regexDates = data.match(dateRegex) || [];

//         // Remove duplicate and incorrect values
//         dates = [...new Set([...dates, ...regexDates])].filter(d => d.length > 6);
//         console.log(dates, 19)
//         const formattedates = dates.map((data)=>new Date(data));
//         console.log(formattedates)

//         // Keywords for reason extraction
//         const reasonKeywords = ['because of', 'because', 'for', 'due to', 'as', 'since', 'reason is', 'due', 'caused by'];
//         let reason = '';

//         // Find reason in sentence
//         for (const keyword of reasonKeywords) {
//             const lowerData = data.toLowerCase();
//             if (lowerData.includes(keyword)) {
//                 reason = data.split(new RegExp(`${keyword}`, 'i'))[1]?.trim();
//                 break;
//             }
//         }

//         // If no explicit reason found, take the last word (if it's not a date/number)
//         if (!reason) {
//             const words = data.split(/\s+/);
//             if (words.length > 1 && !/\d/.test(words[words.length - 1])) {
//                 reason = words[words.length - 1];
//             }
//         }

//         // Prepare response
//         let response = { 
//             date: dates.length ? dates : ["No date found"],
//             reason: reason || "No reason found"
//         };

//         // Confirmation message
//         response.confirmation = `Please confirm the extracted details: Date(s): ${response.date.join(', ')}, Reason: ${response.reason}. Is this correct?`;

//         console.log(response);
//         return res.status(200).json(response);

//     } catch (error) {
//         console.error("Error extracting date and reason:", error);
//         return res.status(500).json({ error: "Internal Server Error" });
//     }
// };

// exports.getDateAndReason = async (req, res) => {
//     try {
//         const { data } = req.body;
//         console.log(data)
//         if (!data) {
//             return res.status(400).json({ error: "No input data provided" });
//         }

//         const doc = nlp(data);
//         let dates = doc.match('#Date').out('array');
//         const formatChange = dates.map(normalizeDate)
//         console.log(dates, formatChange, 73)
//         const dateRegex = /\b(\w{3,9} \d{1,2},? \d{4}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/gi;
//         const regexDates = data.match(dateRegex) || [];
//         dates = [...new Set([...dates, ...regexDates])].filter(d => d.length > 6);
//         const formatDates = (dates) => {
//             return dates.map(dateStr => {
//                 if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(dateStr)) {
//                     const [day, month, year] = dateStr.split(/[-/]/).map(Number);
//                     return new Date(year, month - 1, day); // Months are zero-based in JS
//                 }
//                 const parsedDate = new Date(dateStr);
//                 return isNaN(parsedDate.getTime()) ? null : parsedDate;
//             }).filter(date => date !== null); // Remove invalid dates
//         };

//         const formattedDates = formatDates(dates);
//         // console.log("Extracted Dates:", formattedDates);
//         const reasonKeywords = ['because of', 'because', 'for', 'due to', 'as', 'since', 'reason is', 'due', 'caused by'];
//         let reason = '';
//         for (const keyword of reasonKeywords) {
//             const lowerData = data.toLowerCase();
//             if (lowerData.includes(keyword)) {
//                 reason = data.split(new RegExp(`${keyword}`, 'i'))[1]?.trim();
//                 break;
//             }
//         }

//         // If no explicit reason found, extract the last non-date word
//         if (!reason) {
//             const words = data.split(/\s+/);
//             if (words.length > 1 && !/\d/.test(words[words.length - 1])) {
//                 reason = words[words.length - 1];
//             }
//         }

//         // Prepare response
//         let response = { 
//             date: formattedDates.length ? formattedDates : ["No valid date found"],
//             reason: reason || "No reason found"
//         };

//         // Confirmation message
//         response.confirmation = `Please confirm the extracted details: Date(s): ${response.date.join(', ')}, Reason: ${response.reason}. Is this correct?`;

//         // console.log(response);
//         return res.status(200).json(response);

//     } catch (error) {
//         console.error("Error extracting date and reason:", error);
//         return res.status(500).json({ error: "Internal Server Error" });
//     }
// };
// Assuming you're using the compromise NLP library

// Normalize date helper function
const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    const dateRegex = /(\d{2})[-/](\d{2})[-/](\d{4})/;
    const matched = dateStr.match(dateRegex);
    if (matched) {
        const [, day, month, year] = matched;
        return `${day}-${month}-${year}`;
    }
    return null;
};

// Combine chrono-node and NLP functionality
// Ensure you have an NLP library if needed

// exports.getDateAndReason = async (req, res) => {
//     try {
//         const { data } = req.body;
//         console.log(data)

//         if (!data) {
//             return res.status(400).json({ error: "No input data provided" });
//         }

//         // Extract dates using Chrono
//         const chronoResults = chrono.parse(data);
//         const extractedDates = chronoResults.map(date => ({
//             start: date.start.date().toISOString().split('T')[0],
//             end: date.end ? date.end.date().toISOString().split('T')[0] : date.start.date().toISOString().split('T')[0]
//         }));
//         if (!extractedDates.length) {
//             return res.status(204).json({ response: "No valid date found" });
//         }

//         // Extract reason using NLP and keywords
//         const reasonKeywords = ['because of', 'because', 'for', 'due to', 'as', 'since', 'reason is', 'due', 'caused by'];
//         let reason = '';

//         for (const keyword of reasonKeywords) {
//             const lowerData = data.toLowerCase();
//             if (lowerData.includes(keyword)) {
//                 reason = data.split(new RegExp(`${keyword}`, 'i'))[1]?.trim();
//                 break;
//             }
//         }

//         // If no reason is found, extract all text after the last detected date
//         if (!reason && extractedDates.length > 0) {
//             const lastDateStr = extractedDates[extractedDates.length - 1].end;
//             const lastDateIndex = data.lastIndexOf(lastDateStr);

//             if (lastDateIndex !== -1) {
//                 reason = data.substring(lastDateIndex + lastDateStr.length).trim();
//             }
//         }

//         // Prepare the response
//         let response = {
//             date: extractedDates.length ? extractedDates : ["No valid date found"],
//             reason: reason || ""
//         };

//         // Confirmation message
//         response.confirmation = `Please confirm the extracted details: Date(s): ${response.date.map(d => `${d.start} to ${d.end}`).join(', ')}, Reason: ${response.reason}. Is this correct?`;

//         return res.status(200).json(response);
//         // createTimeoff()

//     } catch (error) {
//         console.error("Error extracting date and reason:", error);
//         return res.status(500).json({ error: "Internal Server Error" });
//     }
// };

function extractDateTime(input) {
    const parsed = chrono.parse(input);

    if (parsed.length > 0) {
        const startTime = parsed[0].start?.isCertain("hour")
            ? parsed[0].start.date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
            : null;

        const endTime = parsed[0].end?.isCertain("hour")
            ? parsed[0].end.date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
            : null;

            const date = parsed[0].start?.isCertain("day")
            ? parsed[0].start.date().toISOString().split("T")[0] // Converts to YYYY-MM-DD format
            : null;


        return { startTime, endTime, date };
    }

    return { startTime: null, endTime: null, date: null };
}

const differenceInTime = (startTime, endTime) => {
    const start = new Date(`1970-09-20 ${startTime}`);
    const end = new Date(`1970-09-20 ${endTime}`);
    let diffMs = end - start;

    // If end time is earlier (e.g., 11 PM - 2 AM), add 24 hours
    console.log(diffMs)
    if (diffMs < 0) {
        return 0
    }

    // Convert milliseconds to hours and minutes
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return diffHrs;
}

exports.getDateAndReason = async (req, res) => {
    try {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const { data, type } = req.body;
        const parsed = chrono.parse(data);
        const availableHolidays = await Holiday.find();

        if (!data) {
            return res.status(400).json({ error: "No input data provided" });
        }
        if (type == "permission") {
            const isHoliday = new Date().getDay();
            
            // console.log(availableHolidays.length, "availableHolidays", )
            
            const reason = await inferReason(data);
            if(reason.toLowerCase()=="not found"){
                return res.status(400).json({message:"Provide reason to apply permission"})
            }
            const result = extractDateTime(data);
            console.log(result.date)
            const isHolidayAleady = availableHolidays.some(holiday => {
                const holidayParts = holiday.date.split('-'); // ["07", "12", "2025"]
                const formattedHolidayDate = `${holidayParts[2]}-${holidayParts[1]}-${holidayParts[0]}`; // "2025-12-07"
                console.log(result.date == formattedHolidayDate, 274)
                if(result.date == formattedHolidayDate){
                    return true;
                }
                else{
                    return false;
                }
            });
            if(isHolidayAleady){
                return res.status(400).json({message:"You cannot apply permission on holiday"})
            }
            const extractedDates = {
                start:result.startTime,
                end:result.endTime,
                date:result.date,
                permission:true,
                isHalf:false,
                isFull:false
            }
            // console.log(extractedDates)

            if (!result.date) {
                return res.status(400).json({ message: "Provide a valid date to continue" });
            }

            if (!result.startTime || !result.endTime) {
                return res.status(400).json({ message: "Provide a valid time range" });
            }

            const timediff = differenceInTime(result.startTime, result.endTime);

            if (timediff <= 0 || timediff < 1) {
                return res.status(400).json({ message: "Provide a valid time" });
            } 
            else if (timediff > 1) {
                return res.status(403).json({ message: "You cannot take more than one hour" });
            } 
            else {
                return res.status(200).json({extractedDates, reason,
                    message: `Are you planning to take permission from ${result.startTime} to ${result.endTime} on ${result.date} due to ${reason}?`
                });
            }
        }


        // Check for half-day request
        const isHalfDay = data.toLowerCase().includes('half');
        const isFirstHalf = data.toLowerCase().includes('first half');
        const isSecondHalf = data.toLowerCase().includes('second half');

        // Enhanced date parsing with chrono
        const chronoResults = chrono.parse(data, {
            forwardDate: true,
            parsers: [
                chrono.parseDate,
                chrono.parseTime,
                chrono.parseDateWithMonthName
            ]
        });

        // Extract and validate dates
        const extractedDates = chronoResults.map(date => {
            const startDate = date.start.date();
            const endDate = date.end ? date.end.date() : date.start.date();
            console.log(startDate, endDate, 338)
            console.log(data)
          

            // Format dates in YYYY-MM-DD format for storage
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const formattedStartDate = formatDate(startDate);
            const formattedEndDate = formatDate(endDate);
            let isHolidayFound = false;
            console.log(formattedStartDate, formattedEndDate, 352)
            
            for (const holiday of availableHolidays) {
                const holidayParts = holiday.date.split('-'); // ["07", "12", "2025"]
                const formattedHolidayDate = `${holidayParts[2]}-${holidayParts[1]}-${holidayParts[0]}`; // "2025-12-07"
                if(formattedStartDate == formattedHolidayDate || formattedEndDate == formattedHolidayDate){
                    isHolidayFound = true;
                    break;
                }
            }

            if (isHolidayFound) {
                return null;
            }

            if (isHalfDay) {
                if (isFirstHalf) {
                    return {
                        start: `${formattedStartDate}T09:00:00`,
                        end: `${formattedEndDate}T13:00:00`,
                        isHalfDay: true,
                        halfDayType: 'first',
                        isPermission:false
                    };
                } else if (isSecondHalf) {
                    return {
                        start: `${formattedStartDate}T14:00:00`,
                        end: `${formattedEndDate}T19:00:00`,
                        isHalfDay: true,
                        halfDayType: 'second',
                        isPermission:false
                    };
                }
            }

            return {
                start: formattedStartDate,
                end: formattedEndDate,
                isHalfDay: false
            };
        });
        

        // console.log("Extracted dates:", extractedDates);

        if (!extractedDates.length) {
            return res.status(204).json({
                message: "Please provide dates in format like 'Feb 20 2025' or 'February 20 2025'"
            });
        }

        // Extract reason using Gemini AI
        const result = await inferReason(data);
        // console.log("Extracted reason:", result);

        // Prepare response
        const response = {
            date: extractedDates,
            reason: result || "not found",
            isHalfDay: isHalfDay,
            halfDayType: isFirstHalf ? 'first' : (isSecondHalf ? 'second' : null)
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error("Error extracting date and reason:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


// const normalizeDate = (date) => {
//     if (date.includes('.')) {
//       return date.replace(/\./g, '-');
//     } else if (date.includes('-')) {
//       return date;
//     } else if (date.includes('/')) {
//       return date.replace(/\//g, '-');
//     } else {
//       return "Invalid Date Format";
//     }
//   };
