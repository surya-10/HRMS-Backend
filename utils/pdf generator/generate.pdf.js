const ejs = require('ejs');
const pdf = require('html-pdf');

const options = {
    format: "A4",
    orientation: "portrait",
    border: {
      top: "10mm",
      right: "5mm",
      bottom: "10mm",
      left: "5mm",
    },
  };
exports.generatePDF = (html) => {
    return new Promise((resolve, reject) => {
      pdf.create(html, options).toBuffer((err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });
  };