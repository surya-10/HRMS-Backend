module.exports = (app) => {
    const asyncHandler = require("express-async-handler");
    const { authBearer } = require("../../middleware/authorization.service.js");
    const payslipController = require("../../controller/Auth/payslip.controller.js")
    let payslipRouter = require("express").Router();

    payslipRouter.post("/generate", asyncHandler(payslipController.generatePayslip))


    app.use("/api/routes/payslip", payslipRouter)
}

