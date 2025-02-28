const express = require("express");
const xlsx = require("xlsx");
const cors = require("cors");
const path = require("path");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const { generatePDF } = require("../../utils/pdf generator/generate.pdf");

const excel = path.join(__dirname, "..", "..", "utils", "payslips", "employee_salary_sample.xlsx");

exports.generatePayslip = async (req, res) => {
    try {
        const { data } = req.body;
        console.log(data);

        const workbook = xlsx.readFile(excel);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const values = xlsx.utils.sheet_to_json(sheet);

        const result = values.filter(row => row.Email === data);
        console.log(result);

        if (result.length === 0) {
            return res.status(404).json({ message: "Email not found" });
        }

        // Render the EJS template with the filtered data
        let userDatas = result;
        function calculateSalary(userDataArray) {
            return userDataArray.map((employeeData) => {
                const { 
                    'Total Working days': totalWorkingDays, 
                    'Leaves taken': leavesTaken, 
                    'Gross pay': grossPay, 
                    'Total Deductions': totalDeductions 
                } = employeeData;
        
                // Calculate Loss of Pay (LOP)
                const dailyPay = grossPay / totalWorkingDays;
                const lop = dailyPay * leavesTaken; 
        
                // Calculate updated Total Deductions
                const updatedTotalDeductions = totalDeductions + lop;
                const TotalEarnings= grossPay
        
                // Calculate updated Net Salary
                const netSalary = grossPay - updatedTotalDeductions;
        
                // Return updated employee data
                return {
                    ...employeeData,
                    LOP: lop.toFixed(2),
                    'Total Deductions': updatedTotalDeductions.toFixed(2),
                    'Net Salary': Number(netSalary.toFixed(2)),
                    'Total Earnings':Number(TotalEarnings)
                };
            });
        }
        
        // Calculate salary for all employees
        let userData = calculateSalary(userDatas);
        userData = userData[0]
        console.log(userData)
        
        // Log updated userData
        // console.log(userData);
        // const dataWithLop = userData[0]
        


        // Use ejs to render the template with the userData
        const htmlContent = await ejs.renderFile(path.join(__dirname, '..', '..', 'Templates', 'paylsipTemplate.ejs'), { userData });
        // console.log(htmlContent)

        const buffer = await generatePDF(htmlContent);
        res.set({
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=report.pdf",
        });
    
        res.send(buffer);


        // Generate PDF using Puppeteer
        // const browser = await puppeteer.launch({
        //     headless: 'new',  // Use new headless mode
        //     args: ['--no-sandbox', '--disable-setuid-sandbox']
        // });
        // const page = await browser.newPage();
        // await page.setContent(htmlContent);

        // // Generate PDF buffer
        // const pdfBuffer = await page.pdf({
        //     format: 'A4',
        //     printBackground: true,
        //     margin: {
        //         top: '20px',
        //         right: '20px',
        //         bottom: '20px',
        //         left: '20px'
        //     }
        // });

        // await browser.close();

        // // Send the PDF as the response with proper headers
        // res.setHeader('Content-Type', 'application/pdf');
        // res.setHeader('Content-Disposition', 'attachment; filename=payslip.pdf');
        // res.setHeader('Content-Length', pdfBuffer.length);
        
        // // Send the PDF buffer as the response
        // return res.send(pdfBuffer);

        // await browser.close();

        // Send the PDF as the response with proper headers
        // res.setHeader('Content-Type', 'application/pdf');
        // res.setHeader('Content-Disposition', 'attachment; filename=payslip.pdf');
        // res.setHeader('Content-Length', pdfBuffer.length);
        // console.log(pdfBuffer)
       

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error generating payslip", error: error.message });
    }
};


const generatePdfFormat = async (userData, res) => {
    console.log(userData)
    try {
        const { Month, 'Employee Name': employeeName, Email, Designation, 'Date of joining': dateOfJoining, 'Total Working days': totalWorkingDays, 'No.of Working days attended': workedDays, 'Basic Salary': basicSalary, HRA, 'Other allowance': otherAllowance, PF, 'Professional Tax': professionalTax, TDS, LOP, 'Total Deductions': totalDeductions, 'Net Salary': netSalary } = userData;

        const filePath = path.join(__dirname, "..", "..", "utils", `${Email}_payslip_${Month}.pdf`);
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(fs.createWriteStream(filePath));
        const { width, height } = doc.page;

        const borderWidth = 1; // Border thickness
        const padding = 10; // Space between border and document edges

        // Draw the border inside the document margins
        doc
            .lineWidth(borderWidth)
            .rect(padding, padding, width - 2 * padding, height - 2 * padding)
            .stroke();


        const boxX = 50; // Left margin
        const boxY = 50; // Top position
        const boxWidth = 500; // Line width
        const fontSize = 20;
        const text = "Pay-slip";
        const spacing = 10;

        // Add the text (aligned left)
        doc.fontSize(fontSize).text(text, boxX, boxY);

        // Draw the underline
        const textWidth = doc.widthOfString(text); // Get text width
        const textHeight = doc.currentLineHeight();
        doc.moveTo(boxX, boxY + textHeight + spacing)
            .lineTo(boxX + doc.widthOfString(text), boxY + textHeight + spacing)
            .stroke();

        // doc.fontSize(20).text('Payslip', { align: 'center' }, {padding:20}).strokeColor("black").lineWidth(1).rect(50, 50, 500, 40).stroke();
        doc.moveDown(2);

        // Employee Details Section
        doc.fontSize(14).text('Employee Details', { underline: true });
        doc.fontSize(12)
            .text(`Employee Name: ${employeeName}`)
            .text(`Email: ${Email}`)
            .text(`Designation: ${Designation}`)
            .text(`Date of Joining: ${dateOfJoining}`)
            .text(`Month: ${Month}`)
            .text(`Total Working Days: ${totalWorkingDays}`)
            .text(`Worked Days: ${workedDays}`)
            .text(`Leaves Taken: ${totalWorkingDays - workedDays}`)
            .moveDown();

        // Create a two-column layout for income and deductions
        const col1X = 50;
        const col2X = 300;
        let y = doc.y;

        // Income Section
        doc.fontSize(14).text('Income', col1X, y, { underline: true });
        doc.fontSize(12)
            .text(`Basic Salary: ${basicSalary}`, col1X)
            .text(`HRA: ${HRA}`, col1X)
            .text(`Other Allowance: ${otherAllowance}`, col1X)
            .moveDown();

        // Deductions Section
        doc.fontSize(14).text('Deductions', col2X, y, { underline: true });
        doc.fontSize(12)
            .text(`PF: ${PF}`, col2X)
            .text(`Professional Tax: ${professionalTax}`, col2X)
            .text(`TDS: ${TDS}`, col2X)
            .text(`LOP: ${LOP}`, col2X)
            .text(`Total Deductions: ${totalDeductions}`, col2X)
            .moveDown();

        doc.moveDown(2);
        doc.fontSize(14).text(`Net Salary: ${netSalary}`, { bold: true, align: 'center' }).strokeColor("black").lineWidth(1).rect(50, doc.y, 500, 30).stroke();

        // Finalize the PDF document
        doc.end();

        // Send response after finishing the PDF generation
        doc.on('finish', () => {
            res.status(200).json({ message: "Payslip generated", file: filePath });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating PDF" });
    }
};

